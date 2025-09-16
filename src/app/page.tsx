"use client";

import { useState, useEffect } from "react";
import { DatabaseConfigForm } from "@/components/DatabaseConfigForm";
import { AIProviderConfigForm } from "@/components/AIProviderConfigForm";
import { QueryInterface } from "@/components/QueryInterface";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { DatabaseManagementPanel } from "@/components/DatabaseManagementPanel";
import { DatabaseInsights } from "@/components/DatabaseInsights";
import { QueryLog, QueryLogEntry } from "@/components/QueryLog";
import {
  AIConsultation,
  ConsultationMessage,
} from "@/components/AIConsultation";
import { DatabaseSchema, DatabaseConfig } from "@/types/database";
import { AIProviderConfig } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Settings, Database, Bot, MessageCircle, History } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { loadFromStorage, STORAGE_KEYS } from "@/lib/storage";

export default function Home() {
  const { t, languageKey } = useI18n();
  const [isConnected, setIsConnected] = useState(false);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null);

  // Debug aiConfig changes
  useEffect(() => {
    console.log("aiConfig state changed:", aiConfig);
  }, [aiConfig]);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [queryLogs, setQueryLogs] = useState<QueryLogEntry[]>([]);
  const [consultationMessages, setConsultationMessages] = useState<
    ConsultationMessage[]
  >([]);
  const [isConsulting, setIsConsulting] = useState(false);
  const [showQueryLog, setShowQueryLog] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [currentDatabaseName, setCurrentDatabaseName] =
    useState<string>("Unknown");

  // Load saved configs from localStorage on component mount
  useEffect(() => {
    const savedAIConfig = loadFromStorage<AIProviderConfig>(
      STORAGE_KEYS.AI_CONFIG
    );
    if (savedAIConfig) {
      setAiConfig(savedAIConfig);
    }

    const savedDBConfig = loadFromStorage<DatabaseConfig>(
      STORAGE_KEYS.DATABASE_CONFIG
    );
    if (savedDBConfig) {
      // Try to auto-connect with saved config
      handleAutoConnect(savedDBConfig);
    }
  }, []);

  const handleAutoConnect = async (config: DatabaseConfig) => {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      await invoke("connect_database", { config });
      setIsConnected(true);
      loadSchema();
    } catch (err) {
      console.error("Auto-connect failed:", err);
      // Don't show error for auto-connect failures
    }
  };

  const handleDatabaseConnect = (connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      loadSchema();
      // Auto-hide config drawer after successful connection
      setShowConfigDrawer(false);
    } else {
      setSchema(null);
      setQueryResults(null);
      setCurrentDatabaseName("Unknown");
    }
  };

  const handleAIConfig = (config: AIProviderConfig) => {
    console.log("handleAIConfig called with:", config);
    setAiConfig(config);
  };

  const loadSchema = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const schema = await invoke<DatabaseSchema>("get_database_schema");
      setSchema(schema);

      // Get current database config to get database name
      const config = await invoke<DatabaseConfig | null>("get_database_config");
      if (config) {
        setCurrentDatabaseName(config.database);
      }
    } catch (err) {
      console.error("Failed to load schema:", err);
      setError("Failed to load database schema");
    }
  };

  const handleQueryResults = (results: any) => {
    setQueryResults(results);
  };

  const addQueryLog = (log: Omit<QueryLogEntry, "id" | "timestamp">) => {
    const newLog: QueryLogEntry = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setQueryLogs((prev) => [newLog, ...prev]);
  };

  const clearQueryLogs = () => {
    setQueryLogs([]);
  };

  const copyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  const handleConsultationMessage = async (message: string) => {
    if (!schema || !aiConfig) return;

    // Add user message
    const userMessage: ConsultationMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    setConsultationMessages((prev) => [...prev, userMessage]);

    setIsConsulting(true);

    try {
      const { AIService } = await import("@/lib/ai-service");
      const response = await AIService.consultDatabase(
        message,
        JSON.stringify(schema),
        aiConfig
      );

      // Add AI response
      const aiMessage: ConsultationMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response,
        timestamp: new Date(),
      };
      setConsultationMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Consultation error:", error);
      const errorMessage: ConsultationMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.",
        timestamp: new Date(),
      };
      setConsultationMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleExecuteQuery = async (query: string) => {
    const startTime = Date.now();
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const results = await invoke("execute_query", { query });
      const executionTime = Date.now() - startTime;

      setQueryResults(results);

      // Add to query log
      addQueryLog({
        query,
        database: currentDatabaseName,
        status: "success",
        executionTime,
        rowCount: (results as any)?.row_count || 0,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Query execution failed";

      setError(errorMessage);

      // Add to query log with error
      addQueryLog({
        query,
        database: currentDatabaseName,
        status: "error",
        executionTime,
        error: errorMessage,
      });
    }
  };

  const handleSwitchDatabase = async (databaseName: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      // Get current database config and update with new database name
      const currentConfig = await invoke<DatabaseConfig | null>(
        "get_database_config"
      );

      if (!currentConfig) {
        setError("No database configuration found");
        return;
      }

      const updatedConfig = { ...currentConfig, database: databaseName };

      // Reconnect with the new database
      await invoke("connect_database", { config: updatedConfig });

      // Update current database name
      setCurrentDatabaseName(databaseName);

      // Reload schema for the new database
      loadSchema();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to switch database"
      );
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("appTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("appSubtitle")}</p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">{t("connected")}</span>
              </div>
            )}
            {isConnected && (
              <>
                <Button
                  onClick={() => setShowQueryLog(!showQueryLog)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("queryLog")}</span>
                </Button>
                <Button
                  onClick={() => setShowConsultation(!showConsultation)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("consultation")}</span>
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 px-3"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t("config")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <button
              onClick={clearError}
              className="text-destructive hover:text-destructive/80 text-lg font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Configuration Drawer */}
      {showConfigDrawer && (
        <div className="bg-card border-b p-6 flex-shrink-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatabaseConfigForm onConnect={handleDatabaseConnect} />
            <AIProviderConfigForm onConfig={handleAIConfig} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Database Management */}
        {isConnected && schema && (
          <div
            key={`sidebar-${languageKey}`}
            className="w-full lg:w-80 bg-card border-r flex flex-col"
          >
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold text-foreground">
                {t("databaseManagement")}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DatabaseManagementPanel
                schema={schema}
                onExecuteQuery={handleExecuteQuery}
                onRefreshSchema={loadSchema}
                onSwitchDatabase={handleSwitchDatabase}
                aiConfig={aiConfig}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Database Insights */}
          {isConnected && schema && aiConfig && (
            <div
              key={`insights-${languageKey}`}
              className="bg-card border-b p-4 flex-shrink-0"
            >
              <DatabaseInsights schema={schema} aiConfig={aiConfig} />
            </div>
          )}

          {/* Query Log */}
          {showQueryLog && isConnected && (
            <div
              key={`querylog-${languageKey}`}
              className="bg-card border-b p-4 flex-shrink-0"
            >
              <QueryLog
                logs={queryLogs}
                onClearLogs={clearQueryLogs}
                onCopyQuery={copyQuery}
              />
            </div>
          )}

          {/* AI Consultation */}
          {showConsultation && isConnected && schema && (
            <div
              key={`consultation-${languageKey}`}
              className="bg-card border-b p-4 flex-shrink-0"
            >
              <AIConsultation
                databaseName={currentDatabaseName}
                onSendMessage={handleConsultationMessage}
                messages={consultationMessages}
                isGenerating={isConsulting}
                schema={schema}
                aiConfig={aiConfig}
              />
            </div>
          )}

          {/* Query Interface - STICKY */}
          {aiConfig && (
            <div
              key={`queryinterface-${languageKey}`}
              className="bg-card border-b p-4 flex-shrink-0 sticky top-0 z-10 shadow-sm"
            >
              <h2 className="text-base font-semibold mb-3 text-foreground">
                {t("aiQueryInterface")}
              </h2>
            <QueryInterface
              schema={schema}
              aiConfig={aiConfig}
              onResults={handleQueryResults}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setParentError={setError}
              addQueryLog={addQueryLog}
            />
            </div>
          )}

          {/* Results Display - Takes most of the space */}
          <div className="flex-1 overflow-hidden">
            {queryResults ? (
              <div className="h-full flex flex-col">
                <div className="bg-card border-b px-4 py-3 flex-shrink-0">
                  <h2 className="text-base font-semibold text-foreground">
                    {t("queryResults")}
                  </h2>
                </div>
                <div className="flex-1 overflow-auto">
                  <ResultsDisplay results={queryResults} />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {!isConnected ? t("connectToDatabase") : t("runQuery")}
                  </h3>
                  <p className="text-muted-foreground">
                    {!isConnected
                      ? t("configureDatabaseConnection")
                      : t("useNaturalLanguage")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatabaseConfig, DatabaseType } from "@/types/database";
import {
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from "@/lib/storage";

interface DatabaseConfigFormProps {
  onConnect: (connected: boolean) => void;
}

export function DatabaseConfigForm({ onConnect }: DatabaseConfigFormProps) {
  const [config, setConfig] = useState<DatabaseConfig>({
    host: "localhost",
    port: 3306,
    username: "",
    password: "",
    database: "",
    db_type: "MySQL",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(false);

  // Load saved config from localStorage on component mount
  useEffect(() => {
    const savedConfig = loadFromStorage<DatabaseConfig>(
      STORAGE_KEYS.DATABASE_CONFIG
    );
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    // Validate required fields based on database type
    if (config.db_type === "SQLite" && !config.database) {
      setError("SQLite requires a database file path");
      setIsConnecting(false);
      return;
    }

    if (
      config.db_type !== "SQLite" &&
      config.db_type !== "MongoDB" &&
      !config.username
    ) {
      setError("Username is required for this database type");
      setIsConnecting(false);
      return;
    }

    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      await invoke("connect_database", { config });

      // Save config to localStorage on successful connection
      saveToStorage(STORAGE_KEYS.DATABASE_CONFIG, config);

      setIsConnected(true);
      onConnect(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
      onConnect(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      await invoke("disconnect_database");
      setIsConnected(false);
      onConnect(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    }
  };

  const handleInputChange = (
    field: keyof DatabaseConfig,
    value: string | number
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getDefaultPort = (dbType: DatabaseType) => {
    switch (dbType) {
      case "MySQL":
        return 3306;
      case "PostgreSQL":
        return 5432;
      case "SQLite":
        return 0;
      case "MongoDB":
        return 27017;
      default:
        return 3306;
    }
  };

  const handleDbTypeChange = (dbType: DatabaseType) => {
    setConfig((prev) => ({
      ...prev,
      db_type: dbType,
      port: getDefaultPort(dbType),
    }));
    // Clear available databases when changing database type
    setAvailableDatabases([]);
    setShowDatabaseSelector(false);
  };

  const loadAvailableDatabases = async () => {
    if (config.db_type === "SQLite") return; // SQLite doesn't have multiple databases

    setIsLoadingDatabases(true);
    setError(null);

    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const databases = await invoke<string[]>("list_databases");
      setAvailableDatabases(databases);
      setShowDatabaseSelector(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load databases");
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const selectDatabase = (databaseName: string) => {
    setConfig((prev) => ({
      ...prev,
      database: databaseName,
    }));
    setShowDatabaseSelector(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Database Connection</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Configure your database connection settings
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Database Type</label>
            <Select
              value={config.db_type}
              onChange={(e) =>
                handleDbTypeChange(e.target.value as DatabaseType)
              }
              disabled={isConnected}
            >
              <option value="MySQL">MySQL</option>
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="SQLite">SQLite</option>
              <option value="MongoDB">MongoDB</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Port</label>
            <Input
              type="number"
              value={config.port}
              onChange={(e) =>
                handleInputChange("port", parseInt(e.target.value) || 0)
              }
              disabled={isConnected || config.db_type === "SQLite"}
              placeholder="3306"
            />
          </div>
        </div>

        {config.db_type !== "SQLite" && config.db_type !== "MongoDB" && (
          <>
            <div>
              <label className="text-sm font-medium">Host</label>
              <Input
                value={config.host}
                onChange={(e) => handleInputChange("host", e.target.value)}
                disabled={isConnected}
                placeholder="localhost"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={config.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  disabled={isConnected}
                  placeholder="username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={config.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  disabled={isConnected}
                  placeholder="password"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium">
            Database Name{" "}
            <span className="text-muted-foreground">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <Input
              value={config.database}
              onChange={(e) => handleInputChange("database", e.target.value)}
              disabled={isConnected}
              placeholder="database_name (leave empty to connect without specific database)"
              className="flex-1"
            />
            {config.db_type !== "SQLite" && (
              <Button
                type="button"
                onClick={loadAvailableDatabases}
                disabled={isConnected || isLoadingDatabases}
                variant="outline"
                size="sm"
                className="px-3"
              >
                {isLoadingDatabases ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to connect to the server without selecting a specific
            database
          </p>
        </div>

        {/* Database Selector */}
        {showDatabaseSelector && availableDatabases.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Available Databases</span>
              <Button
                type="button"
                onClick={() => setShowDatabaseSelector(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {availableDatabases.map((db) => (
                <button
                  key={db}
                  type="button"
                  onClick={() => selectDatabase(db)}
                  className="w-full text-left p-2 hover:bg-muted rounded text-sm flex items-center gap-2"
                >
                  <Database className="h-3 w-3" />
                  <span>{db}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              type="submit"
              disabled={
                isConnecting ||
                (config.db_type === "SQLite" && !config.database)
              }
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleDisconnect}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Connected successfully</span>
          </div>
        )}
      </form>
    </div>
  );
}

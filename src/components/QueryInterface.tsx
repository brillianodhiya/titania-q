"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatabaseSchema } from "@/types/database";
import { AIProviderConfig } from "@/types/ai";
import { Send, Loader2 } from "lucide-react";

interface QueryInterfaceProps {
  schema: DatabaseSchema | null;
  aiConfig: AIProviderConfig;
  onResults: (results: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setParentError: (error: string | null) => void;
}

export function QueryInterface({
  schema,
  aiConfig,
  onResults,
  isLoading,
  setIsLoading,
  setParentError,
}: QueryInterfaceProps) {
  const [query, setQuery] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const clearError = () => {
    setLocalError(null);
    setParentError(null);
  };

  const generateSQL = async (naturalLanguageQuery: string) => {
    if (!schema) {
      setLocalError("Database schema not available");
      setParentError("Database schema not available");
      return;
    }

    try {
      const response = await fetch("/api/generate-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: naturalLanguageQuery,
          schema: schema,
          aiConfig: aiConfig,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract error message from API response
        const errorMessage = data.error || "Failed to generate SQL";
        throw new Error(errorMessage);
      }

      return data.sql;
    } catch (error) {
      console.error("Error generating SQL:", error);
      throw error;
    }
  };

  const executeQuery = async (sqlQuery: string) => {
    try {
      console.log("Executing query:", sqlQuery);
      const { invoke } = await import("@tauri-apps/api/tauri");
      const results = await invoke("execute_query", { query: sqlQuery });
      console.log("Query executed successfully:", results);
      return results;
    } catch (error) {
      console.error("Error executing query:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setLocalError(null);
    setParentError(null);

    try {
      // Generate SQL from natural language
      const sql = await generateSQL(query);
      setGeneratedSQL(sql);

      // Execute the generated SQL
      const results = await executeQuery(sql);
      onResults(results);
    } catch (error) {
      console.error("Query execution error:", error);
      let errorMessage = "Query failed";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle Tauri error format
        if ("QueryExecutionFailed" in error) {
          errorMessage = (error as any).QueryExecutionFailed;
        } else if ("message" in error) {
          errorMessage = (error as any).message;
        }
      }

      setLocalError(errorMessage);
      setParentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSQL = async () => {
    if (!generatedSQL.trim()) return;

    setIsLoading(true);
    setLocalError(null);
    setParentError(null);

    try {
      const results = await executeQuery(generatedSQL);
      onResults(results);
    } catch (error) {
      console.error("SQL execution error:", error);
      let errorMessage = "Query execution failed";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle Tauri error format
        if ("QueryExecutionFailed" in error) {
          errorMessage = (error as any).QueryExecutionFailed;
        } else if ("message" in error) {
          errorMessage = (error as any).message;
        }
      }

      setLocalError(errorMessage);
      setParentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question in natural language..."
            className="min-h-[80px] text-sm"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          size="sm"
          className="w-full h-9"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate & Execute
            </>
          )}
        </Button>
      </form>

      {localError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-4 h-4 mt-0.5">
              <svg
                className="w-4 h-4 text-destructive"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-destructive">
                  Query Error
                </h4>
                <button
                  onClick={clearError}
                  className="text-destructive/60 hover:text-destructive text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-destructive/80 break-words">
                {localError}
              </p>
            </div>
          </div>
        </div>
      )}

      {generatedSQL && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Generated SQL
            </span>
            <Button
              onClick={handleExecuteSQL}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Execute"
              )}
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-40 font-mono">
            {generatedSQL}
          </pre>
        </div>
      )}
    </div>
  );
}

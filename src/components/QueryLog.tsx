"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { useI18n } from "@/hooks/useI18n";
import {
  Clock,
  Database,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface QueryLogEntry {
  id: string;
  timestamp: Date;
  query: string;
  database: string;
  status: "success" | "error";
  executionTime?: number;
  rowCount?: number;
  error?: string;
}

interface QueryLogProps {
  logs: QueryLogEntry[];
  onClearLogs: () => void;
  onCopyQuery: (query: string) => void;
}

export function QueryLog({ logs, onClearLogs, onCopyQuery }: QueryLogProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyQuery = (query: string, id: string) => {
    onCopyQuery(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(timestamp);
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return "N/A";
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 px-3 py-2">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded-md p-1 -m-1 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h3 className="text-sm font-medium">{t("queryLog")}</h3>
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
              {logs.length} {t("queries")}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearLogs}
              className="h-6 w-6 p-0"
              disabled={logs.length === 0}
              title={t("clearAllLogs")}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-3 pb-3">
          <div className="h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noQueriesExecuted")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <div
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            log.status === "success"
                              ? "bg-primary text-primary-foreground"
                              : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {log.status === "success" ? (
                            <CheckCircle className="h-2 w-2 mr-1" />
                          ) : (
                            <XCircle className="h-2 w-2 mr-1" />
                          )}
                          {log.status === "success" ? t("success") : t("error")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyQuery(log.query, log.id)}
                        className="h-6 w-6 p-0"
                        title={t("copyQuery")}
                      >
                        {copiedId === log.id ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        {t("database")}:
                      </div>
                      <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {log.database}
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        {t("query")}:
                      </div>
                      <div className="text-sm font-mono bg-muted px-2 py-1 rounded max-h-20 overflow-y-auto">
                        {log.query}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {t("executionTime")}:{" "}
                        {formatExecutionTime(log.executionTime)}
                      </span>
                      {log.rowCount !== undefined && (
                        <span>
                          {t("rows")}: {log.rowCount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {log.error && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                        <strong>Error:</strong> {log.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

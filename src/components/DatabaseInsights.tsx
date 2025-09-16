"use client";

import { useState } from "react";
import { DatabaseSchema } from "@/types/database";
import { AIProviderConfig } from "@/types/ai";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Lightbulb,
  Database,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { AIService } from "@/lib/ai-service";

interface DatabaseInsightsProps {
  schema: DatabaseSchema | null;
  aiConfig: AIProviderConfig | null;
}

export function DatabaseInsights({ schema, aiConfig }: DatabaseInsightsProps) {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const generateInsights = async () => {
    if (!schema || !aiConfig) {
      setError("Database schema or AI configuration not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const insights = await AIService.generateInsights(null, schema, aiConfig);
      setInsights(insights);
      setIsExpanded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate insights"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearInsights = () => {
    setInsights("");
    setIsExpanded(false);
    setError(null);
    setIsCopied(false);
  };

  const copyInsights = async () => {
    try {
      await navigator.clipboard.writeText(insights);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy insights:", err);
    }
  };

  if (!schema || !aiConfig) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Database Insights</h3>
        </div>
        <div className="flex items-center gap-2">
          {insights && (
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {insights && (
            <>
              <Button
                onClick={copyInsights}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                onClick={clearInsights}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            </>
          )}
          <Button
            onClick={generateInsights}
            disabled={isLoading}
            size="sm"
            className="h-7 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="h-3.5 w-3.5 mr-1" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {insights && isExpanded && (
        <div className="space-y-3">
          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs mb-2">AI Analysis</h4>
                <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div
                    className="prose prose-xs max-w-none text-xs leading-relaxed bg-background p-3 rounded border"
                    dangerouslySetInnerHTML={{
                      __html: insights
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/\n/g, "<br/>")
                        .replace(
                          /^# (.*$)/gm,
                          '<h1 class="text-sm font-bold mb-2">$1</h1>'
                        )
                        .replace(
                          /^## (.*$)/gm,
                          '<h2 class="text-xs font-semibold mb-1 mt-2">$1</h2>'
                        )
                        .replace(
                          /^### (.*$)/gm,
                          '<h3 class="text-xs font-medium mb-1 mt-1">$1</h3>'
                        )
                        .replace(/^- (.*$)/gm, '<li class="ml-2">$1</li>')
                        .replace(/^\d+\. (.*$)/gm, '<li class="ml-2">$1</li>'),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
              <div className="text-blue-900 font-semibold text-lg">
                {schema.tables.length}
              </div>
              <div className="text-blue-700 text-xs">Tables</div>
            </div>
            <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
              <div className="text-green-900 font-semibold text-lg">
                {schema.tables.reduce(
                  (acc, table) =>
                    acc +
                    table.columns.filter((col) => col.is_foreign_key).length,
                  0
                )}
              </div>
              <div className="text-green-700 text-xs">Relations</div>
            </div>
            <div className="p-2 bg-purple-50 border border-purple-200 rounded text-center">
              <div className="text-purple-900 font-semibold text-lg">
                {schema.tables.reduce(
                  (acc, table) => acc + table.columns.length,
                  0
                )}
              </div>
              <div className="text-purple-700 text-xs">Columns</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

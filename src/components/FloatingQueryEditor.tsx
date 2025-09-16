"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, X, Minimize2, Maximize2 } from "lucide-react";

interface FloatingQueryEditorProps {
  onExecuteQuery: (query: string) => void;
  isExecuting?: boolean;
}

export function FloatingQueryEditor({
  onExecuteQuery,
  isExecuting = false,
}: FloatingQueryEditorProps) {
  const [customQuery, setCustomQuery] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleExecuteQuery = async () => {
    if (!customQuery.trim()) return;
    await onExecuteQuery(customQuery);
  };

  const handleClear = () => {
    setCustomQuery("");
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50 flex items-center justify-center"
        title="Open Query Editor"
      >
        <Play className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold text-foreground">Query Editor</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-muted rounded transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 space-y-3">
          <Textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Enter SQL query..."
            className="min-h-[100px] font-mono text-xs resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleExecuteQuery}
              disabled={!customQuery.trim() || isExecuting}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              {isExecuting ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1" />
              )}
              Execute
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

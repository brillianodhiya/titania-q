"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import {
  RefreshCw,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import mermaid from "mermaid";
import { DatabaseSchema } from "@/types/database";
import { AIProviderConfig } from "@/types/ai";

interface DatabaseRelationDiagramProps {
  schema: DatabaseSchema | null;
  onRefresh?: () => void;
  aiConfig: AIProviderConfig | null;
}

export function DatabaseRelationDiagram({
  schema,
  onRefresh,
  aiConfig,
}: DatabaseRelationDiagramProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [aiGenerationStep, setAiGenerationStep] = useState<string>("");
  const [aiProgress, setAiProgress] = useState<number>(0);
  const diagramRef = useRef<HTMLDivElement>(null);

  // Get theme-aware colors with better font settings
  const getThemeColors = () => {
    // Check if dark mode is active
    const isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return {
      primaryColor: isDark ? "#3b82f6" : "#2563eb",
      primaryTextColor: isDark ? "#f8fafc" : "#1e293b",
      primaryBorderColor: isDark ? "#475569" : "#cbd5e1",
      lineColor: isDark ? "#64748b" : "#94a3b8",
      secondaryColor: isDark ? "#1e293b" : "#f1f5f9",
      tertiaryColor: isDark ? "#0f172a" : "#ffffff",
      background: isDark ? "#0f172a" : "#ffffff",
      mainBkg: isDark ? "#1e293b" : "#f8fafc",
      secondBkg: isDark ? "#334155" : "#e2e8f0",
      tertiaryBkg: isDark ? "#475569" : "#cbd5e1",
      // Font settings for better readability
      fontSize: "16px",
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    };
  };

  // Initialize Mermaid with theme-aware colors
  useEffect(() => {
    const colors = getThemeColors();

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: colors.primaryColor,
        primaryTextColor: colors.primaryTextColor,
        primaryBorderColor: colors.primaryBorderColor,
        lineColor: colors.lineColor,
        secondaryColor: colors.secondaryColor,
        tertiaryColor: colors.tertiaryColor,
        background: colors.background,
        mainBkg: colors.mainBkg,
        secondBkg: colors.secondBkg,
        tertiaryBkg: colors.tertiaryBkg,
        fontSize: colors.fontSize,
        fontFamily: colors.fontFamily,
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 50,
        diagramPadding: 20,
      },
    });
  }, []);

  // Generate Mermaid diagram definition
  const generateDiagram = (schema: DatabaseSchema): string => {
    let diagram = "graph TD\n";

    // Add styling for better readability
    diagram += `classDef tableClass fill:#f8fafc,stroke:#2563eb,stroke-width:2px,color:#1e293b,font-size:14px,font-weight:bold\n`;
    diagram += `classDef columnClass fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#374151,font-size:12px\n`;
    diagram += `classDef pkClass fill:#dbeafe,stroke:#2563eb,stroke-width:1px,color:#1e40af,font-size:11px,font-weight:bold\n`;
    diagram += `classDef fkClass fill:#fef3c7,stroke:#d97706,stroke-width:1px,color:#92400e,font-size:11px,font-weight:bold\n`;
    diagram += `classDef constraintClass fill:#f3f4f6,stroke:#6b7280,stroke-width:1px,color:#374151,font-size:10px\n`;

    // Add tables
    schema.tables.forEach((table) => {
      const tableId = `table_${table.name}`;

      // Create table node with better formatting
      let tableContent = `${tableId}["<b>${table.name}</b><br/>`;

      // Add columns with better formatting
      table.columns.forEach((column) => {
        const columnId = `col_${table.name}_${column.name}`;
        let columnText = `• ${column.name} (${getColumnType(
          column.data_type
        )})`;

        // Add constraints
        const constraints = [];
        if (column.is_primary_key) constraints.push("PK");
        if (column.is_foreign_key) constraints.push("FK");
        if (column.is_nullable === false) constraints.push("NOT NULL");

        if (constraints.length > 0) {
          columnText += ` [${constraints.join(", ")}]`;
        }

        tableContent += `${columnText}<br/>`;
      });

      tableContent += `"]`;
      diagram += `${tableContent}\n`;

      // Apply table styling
      diagram += `class ${tableId} tableClass\n`;
    });

    // Add relationships (simplified - we'll try to infer relationships from column names)
    schema.tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.is_foreign_key) {
          // Try to find referenced table by looking for tables with matching primary key
          const referencedTable = findReferencedTable(schema, column.name);
          if (referencedTable) {
            const sourceTableId = `table_${table.name}`;
            const targetTableId = `table_${referencedTable}`;
            diagram += `${sourceTableId} -->|"${column.name}"| ${targetTableId}\n`;
          }
        }
      });
    });

    return diagram;
  };

  // Helper function to find referenced table
  const findReferencedTable = (
    schema: DatabaseSchema,
    reference: string
  ): string | null => {
    // Simple heuristic: look for table that has a column matching the reference
    for (const table of schema.tables) {
      for (const column of table.columns) {
        if (
          column.name === reference ||
          column.name === reference.replace("_id", "")
        ) {
          return table.name;
        }
      }
    }
    return null;
  };

  // Helper function to simplify column types
  const getColumnType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      varchar: "string",
      char: "string",
      text: "string",
      int: "integer",
      integer: "integer",
      bigint: "bigint",
      smallint: "smallint",
      tinyint: "tinyint",
      decimal: "decimal",
      numeric: "numeric",
      float: "float",
      double: "double",
      boolean: "boolean",
      bool: "boolean",
      date: "date",
      datetime: "datetime",
      timestamp: "timestamp",
      time: "time",
      json: "json",
      jsonb: "jsonb",
    };

    const lowerType = type.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) {
        return value;
      }
    }
    return type;
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.3));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Check if database has foreign keys
  const hasForeignKeys = (schema: DatabaseSchema): boolean => {
    return schema.tables.some((table) =>
      table.columns.some((column) => column.is_foreign_key)
    );
  };

  // Check if database has more than 2 tables
  const hasMultipleTables = (schema: DatabaseSchema): boolean => {
    return schema.tables.length > 2;
  };

  // Generate AI diagram
  const handleGenerateAIDiagram = async () => {
    if (!schema) {
      return;
    }

    // Clear previous diagram before generating new one
    setDiagramSvg("");

    // Check if database needs foreign keys
    if (hasMultipleTables(schema) && !hasForeignKeys(schema)) {
      setShowWarning(true);
      // Continue with AI generation anyway, but with enhanced prompt
    }

    setIsGeneratingAI(true);
    setAiProgress(0);
    setAiGenerationStep("Calling AI API...");

    try {
      // Step 1: Call AI API
      setAiProgress(25);

      const response = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema,
          aiConfig: aiConfig,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API error response:", errorText);
        throw new Error(
          `Failed to generate AI diagram: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      const { diagramDefinition } = result;

      if (!diagramDefinition) {
        throw new Error("No diagram definition returned from AI API");
      }

      // Step 2: Render diagram
      setAiProgress(75);
      setAiGenerationStep("Rendering diagram...");
      const diagramId = `ai-diagram-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const { svg } = await mermaid.render(diagramId, diagramDefinition);
      setDiagramSvg(svg);

      // Step 3: Complete
      setAiProgress(100);
      setAiGenerationStep("Complete!");
    } catch (error) {
      console.error("Error generating AI diagram:", error);
      setAiProgress(0);
      setAiGenerationStep("Falling back to basic diagram...");
      // Fallback to regular diagram
      await renderDiagram();
    } finally {
      setIsGeneratingAI(false);
      setAiGenerationStep("");
      setAiProgress(0);
    }
  };

  // Render diagram
  const renderDiagram = useCallback(async () => {
    if (!schema) {
      return;
    }

    setIsLoading(true);
    setDiagramSvg(""); // Clear previous diagram

    try {
      const diagramDefinition = generateDiagram(schema);

      // Generate new diagram with unique ID
      const diagramId = `diagram-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Use a try-catch around mermaid.render specifically
      let svg: string;
      try {
        const result = await mermaid.render(diagramId, diagramDefinition);
        svg = result.svg;
      } catch (mermaidError) {
        console.error("Mermaid render error:", mermaidError);
        throw mermaidError;
      }

      // Set the SVG using state instead of direct DOM manipulation
      setDiagramSvg(svg);
    } catch (error) {
      console.error("Error rendering diagram:", error);
      setDiagramSvg(
        '<p class="text-muted-foreground text-center p-4">Error rendering diagram</p>'
      );
    } finally {
      setIsLoading(false);
    }
  }, [schema]);

  if (!schema) {
    return (
      <Card>
        <CardHeader className="pb-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Database Relations Diagram</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateAIDiagram}
                className="h-6 w-6 p-0"
                disabled={isGeneratingAI || isLoading}
                title="Generate AI Enhanced Diagram"
              >
                <Sparkles
                  className={`h-3 w-3 ${isGeneratingAI ? "animate-pulse" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No database schema available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Remove auto-render - user will manually open diagram

  // Add wheel event listener for zoom functionality (only when expanded)
  useEffect(() => {
    if (!isExpanded) return;

    const diagramElement = diagramRef.current;
    if (!diagramElement) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel((prev) => Math.max(0.3, Math.min(3, prev + delta)));
    };

    diagramElement.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      diagramElement.removeEventListener("wheel", wheelHandler);
    };
  }, [isExpanded]);

  return (
    <>
      <Card>
        <CardHeader className="pb-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Database Relations Diagram</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateAIDiagram}
                className="h-6 w-6 p-0"
                disabled={isGeneratingAI || isLoading}
                title="Generate AI Enhanced Diagram"
              >
                <Sparkles
                  className={`h-3 w-3 ${isGeneratingAI ? "animate-pulse" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(true);
                  renderDiagram();
                }}
                className="h-6 w-6 p-0"
                disabled={isLoading}
                title="Open Diagram"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-center text-muted-foreground py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Maximize2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">View Database Diagram</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the expand button to open the diagram
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Database Relations Diagram
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="h-8 w-8 p-0"
                    disabled={zoomLevel <= 0.3}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2 min-w-[4rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="h-8 w-8 p-0"
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetZoom}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateAIDiagram}
                  disabled={isGeneratingAI || isLoading}
                  title="Generate AI Enhanced Diagram"
                >
                  <Sparkles
                    className={`h-4 w-4 ${
                      isGeneratingAI ? "animate-pulse" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={renderDiagram}
                  disabled={isLoading}
                  title="Refresh Diagram"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              className={`flex-1 overflow-hidden p-4 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={diagramRef}
                className={`w-full h-full min-h-[500px] database-diagram-transform ${
                  isDragging ? "dragging" : ""
                }`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                }}
              >
                {isLoading || isGeneratingAI ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="text-lg">
                          {isGeneratingAI
                            ? "Generating AI diagram..."
                            : "Generating diagram..."}
                        </span>
                      </div>
                      {isGeneratingAI && aiGenerationStep && (
                        <div className="text-sm text-center w-full max-w-md">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>{aiGenerationStep}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                              // eslint-disable-next-line react/forbid-dom-props
                              style={{ width: `${aiProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : diagramSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: diagramSvg }}
                    className="w-full h-full database-diagram"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No diagram available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Alert Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center gap-3 p-4 border-b">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Database Schema Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI will infer relationships from your database schema
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">
                      No Foreign Key Relationships Detected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your database has {schema?.tables.length} tables but no
                      foreign key relationships defined. AI will generate a
                      diagram with inferred relationships based on column naming
                      patterns.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">What AI Will Do</p>
                    <p className="text-xs text-muted-foreground">
                      AI will analyze table and column names to infer potential
                      relationships and generate a diagram with suggested
                      connections using dotted lines.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Example</p>
                    <p className="text-xs text-muted-foreground">
                      AI will detect patterns like <code>user_id</code> →{" "}
                      <code>users</code> table,
                      <code>order_id</code> → <code>orders</code> table, and
                      suggest relationships based on naming conventions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWarning(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowWarning(false);
                  handleGenerateAIDiagram();
                }}
              >
                Generate with Inferred Relationships
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

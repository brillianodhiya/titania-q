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
      secondaryColor: isDark ? "#1e293b" : "#1e293b", // Dark color for all columns
      tertiaryColor: isDark ? "#0f172a" : "#1e293b", // Dark color for all columns
      background: isDark ? "#0f172a" : "#ffffff",
      mainBkg: isDark ? "#1e293b" : "#1e293b", // Dark color for all columns
      secondBkg: isDark ? "#334155" : "#1e293b", // Dark color for all columns
      tertiaryBkg: isDark ? "#475569" : "#1e293b", // Dark color for all columns
      // Font settings for better readability
      fontSize: "16px",
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    };
  };

  // Initialize Mermaid with theme-aware colors
  useEffect(() => {
    const colors = getThemeColors();

    // Add custom CSS for better diagram contrast - only for AI diagrams
    const style = document.createElement("style");
    style.id = "mermaid-custom-style";
    style.textContent = `
      /* Only apply aggressive overrides to AI-generated diagrams */
      .database-diagram.ai-diagram svg {
        filter: contrast(1.2) brightness(1.1) saturate(1.1);
        background: white !important;
      }
      .database-diagram.ai-diagram .entityBox {
        stroke-width: 2px !important;
        stroke: #1e293b !important;
        fill: #f1f5f9 !important;
      }
      .database-diagram.ai-diagram .entityLabel {
        fill: #1e293b !important;
        font-weight: bold !important;
        font-size: 14px !important;
      }
      .database-diagram.ai-diagram .attributeBox {
        stroke-width: 1px !important;
        stroke: #1e293b !important;
        fill: #1e293b !important;
      }
      .database-diagram.ai-diagram .attributeLabel {
        fill: #ffffff !important;
        font-size: 12px !important;
        font-weight: normal !important;
      }
      .database-diagram.ai-diagram .relationshipLabel {
        fill: #1e293b !important;
        font-weight: bold !important;
        font-size: 12px !important;
      }
      .database-diagram.ai-diagram .relationshipLine {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram .relationshipLine path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram .relationshipLine line {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram .er .entityBox {
        stroke-width: 2px !important;
        stroke: #1e293b !important;
        fill: #f1f5f9 !important;
      }
      .database-diagram.ai-diagram .er .entityLabel {
        fill: #1e293b !important;
        font-weight: bold !important;
        font-size: 14px !important;
      }
      .database-diagram.ai-diagram .er .attributeBox {
        stroke-width: 1px !important;
        stroke: #1e293b !important;
        fill: #ffffff !important;
      }
      .database-diagram.ai-diagram .er .attributeLabel {
        fill: #1e293b !important;
        font-size: 12px !important;
        font-weight: normal !important;
      }
      .database-diagram.ai-diagram .er .relationshipLabel {
        fill: #1e293b !important;
        font-weight: bold !important;
        font-size: 12px !important;
      }
      .database-diagram.ai-diagram .er .relationshipLine {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram .er .relationshipLine path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram .er .relationshipLine line {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram .er .entityText {
        fill: #1e293b !important;
        font-weight: bold !important;
      }
      .database-diagram.ai-diagram .er .attributeText {
        fill: #1e293b !important;
        font-weight: normal !important;
      }
      .database-diagram.ai-diagram .er .relationshipText {
        fill: #1e293b !important;
        font-weight: bold !important;
      }
      .database-diagram.ai-diagram svg path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram svg line {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram svg polyline {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram svg polygon {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram svg .default {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        fill: #f1f5f9 !important;
      }
      .database-diagram.ai-diagram svg .default path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
      }
      .database-diagram.ai-diagram svg .default line {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
      }
      .database-diagram.ai-diagram svg .default polyline {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
      }
      /* Override untuk AI diagram - garis relationship */
      .database-diagram.ai-diagram svg g.edgePath path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      .database-diagram.ai-diagram svg g.edgePath .path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
      }
      .database-diagram.ai-diagram svg g.edgeLabel {
        fill: #1e293b !important;
        font-weight: bold !important;
      }
      .database-diagram.ai-diagram svg g.edgeLabel text {
        fill: #1e293b !important;
        font-weight: bold !important;
      }
      /* Override untuk AI diagram - semua elemen garis */
      .database-diagram.ai-diagram svg g[class*="edge"] path,
      .database-diagram.ai-diagram svg g[class*="edge"] line,
      .database-diagram.ai-diagram svg g[class*="edge"] polyline {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      /* Override khusus untuk AI diagram - semua elemen garis */
      .database-diagram.ai-diagram svg path[stroke="#333333"],
      .database-diagram.ai-diagram svg path[stroke="#333"],
      .database-diagram.ai-diagram svg path[stroke="rgb(51, 51, 51)"],
      .database-diagram.ai-diagram svg line[stroke="#333333"],
      .database-diagram.ai-diagram svg line[stroke="#333"],
      .database-diagram.ai-diagram svg line[stroke="rgb(51, 51, 51)"],
      .database-diagram.ai-diagram svg polyline[stroke="#333333"],
      .database-diagram.ai-diagram svg polyline[stroke="#333"],
      .database-diagram.ai-diagram svg polyline[stroke="rgb(51, 51, 51)"] {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      /* Override untuk AI diagram - semua path dan line yang mungkin ada */
      .database-diagram.ai-diagram svg path:not([fill]),
      .database-diagram.ai-diagram svg line:not([fill]),
      .database-diagram.ai-diagram svg polyline:not([fill]) {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
      }
      /* Force dark colors for AI diagrams only */
      .database-diagram.ai-diagram svg {
        background: white !important;
      }
      /* Override hanya elemen yang diperlukan untuk AI diagram */
      .database-diagram.ai-diagram svg path,
      .database-diagram.ai-diagram svg line,
      .database-diagram.ai-diagram svg polyline {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
      }
      .database-diagram.ai-diagram svg text,
      .database-diagram.ai-diagram svg tspan {
        fill: #1e293b !important;
        color: #1e293b !important;
      }
      /* Override sederhana untuk elemen penting AI diagram */
      .database-diagram.ai-diagram svg .edgePath path {
        stroke: #1e293b !important;
        stroke-width: 2px !important;
      }
      .database-diagram.ai-diagram svg .edgeLabel {
        fill: #1e293b !important;
      }
      /* Force all text elements to be dark and high contrast */
      .database-diagram.ai-diagram svg text,
      .database-diagram.ai-diagram svg tspan,
      .database-diagram.ai-diagram svg .label,
      .database-diagram.ai-diagram svg .nodeLabel,
      .database-diagram.ai-diagram svg .edgeLabel,
      .database-diagram.ai-diagram svg .titleText,
      .database-diagram.ai-diagram svg .actor,
      .database-diagram.ai-diagram svg .messageText,
      .database-diagram.ai-diagram svg .labelText {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force text in gray backgrounds to be dark */
      .database-diagram.ai-diagram svg g[fill*="#f1f5f9"] text,
      .database-diagram.ai-diagram svg g[fill*="#f8fafc"] text,
      .database-diagram.ai-diagram svg g[fill*="#e2e8f0"] text,
      .database-diagram.ai-diagram svg g[fill*="#cbd5e1"] text,
      .database-diagram.ai-diagram svg rect[fill*="#f1f5f9"] + text,
      .database-diagram.ai-diagram svg rect[fill*="#f8fafc"] + text,
      .database-diagram.ai-diagram svg rect[fill*="#e2e8f0"] + text,
      .database-diagram.ai-diagram svg rect[fill*="#cbd5e1"] + text {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force all text in entity boxes to be dark */
      .database-diagram.ai-diagram svg .entityBox text,
      .database-diagram.ai-diagram svg .entityBox tspan,
      .database-diagram.ai-diagram svg .entityBox .label,
      .database-diagram.ai-diagram svg .entityBox .nodeLabel {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force all text in attribute boxes to be dark */
      .database-diagram.ai-diagram svg .attributeBox text,
      .database-diagram.ai-diagram svg .attributeBox tspan,
      .database-diagram.ai-diagram svg .attributeBox .label,
      .database-diagram.ai-diagram svg .attributeBox .nodeLabel {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force text in even/odd rows to be dark */
      .database-diagram.ai-diagram svg rect[fill*="#ffffff"] text,
      .database-diagram.ai-diagram svg rect[fill*="#f8fafc"] text,
      .database-diagram.ai-diagram svg rect[fill*="#f1f5f9"] text,
      .database-diagram.ai-diagram svg rect[fill*="#e2e8f0"] text,
      .database-diagram.ai-diagram svg rect[fill*="#cbd5e1"] text {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force text in all table cells to be dark */
      .database-diagram.ai-diagram svg g[class*="table"] text,
      .database-diagram.ai-diagram svg g[class*="row"] text,
      .database-diagram.ai-diagram svg g[class*="cell"] text,
      .database-diagram.ai-diagram svg g[class*="column"] text {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force text in alternating rows */
      .database-diagram.ai-diagram svg g:nth-child(even) text,
      .database-diagram.ai-diagram svg g:nth-child(odd) text,
      .database-diagram.ai-diagram svg rect:nth-child(even) + text,
      .database-diagram.ai-diagram svg rect:nth-child(odd) + text {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force all foreign objects and text containers */
      .database-diagram.ai-diagram svg foreignObject,
      .database-diagram.ai-diagram svg foreignObject *,
      .database-diagram.ai-diagram svg .label *,
      .database-diagram.ai-diagram svg .nodeLabel * {
        color: #1e293b !important;
        fill: #1e293b !important;
      }
      /* Override any remaining light colored text */
      .database-diagram.ai-diagram svg *[fill*="blue"],
      .database-diagram.ai-diagram svg *[fill*="#"],
      .database-diagram.ai-diagram svg *[fill*="rgb"],
      .database-diagram.ai-diagram svg *[fill*="hsl"] {
        fill: #1e293b !important;
      }
      /* Force all text to be bold and dark */
      .database-diagram.ai-diagram svg text {
        font-weight: bold !important;
        fill: #1e293b !important;
        stroke: none !important;
      }
      /* Universal text override - force all text to be dark */
      .database-diagram.ai-diagram svg * text,
      .database-diagram.ai-diagram svg * tspan,
      .database-diagram.ai-diagram svg * .label,
      .database-diagram.ai-diagram svg * .nodeLabel {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Nuclear option - override ALL text elements with maximum specificity */
      .database-diagram.ai-diagram svg text,
      .database-diagram.ai-diagram svg tspan,
      .database-diagram.ai-diagram svg text[fill],
      .database-diagram.ai-diagram svg tspan[fill],
      .database-diagram.ai-diagram svg text[style*="fill"],
      .database-diagram.ai-diagram svg tspan[style*="fill"] {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Override with maximum specificity for white text */
      .database-diagram.ai-diagram svg text[fill="white"],
      .database-diagram.ai-diagram svg text[fill="#fff"],
      .database-diagram.ai-diagram svg text[fill="#ffffff"],
      .database-diagram.ai-diagram svg text[fill="rgb(255,255,255)"],
      .database-diagram.ai-diagram svg tspan[fill="white"],
      .database-diagram.ai-diagram svg tspan[fill="#fff"],
      .database-diagram.ai-diagram svg tspan[fill="#ffffff"],
      .database-diagram.ai-diagram svg tspan[fill="rgb(255,255,255)"] {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Override any remaining white or light colored text */
      .database-diagram.ai-diagram svg text[fill*="white"],
      .database-diagram.ai-diagram svg text[fill*="#fff"],
      .database-diagram.ai-diagram svg text[fill*="#ffffff"],
      .database-diagram.ai-diagram svg tspan[fill*="white"],
      .database-diagram.ai-diagram svg tspan[fill*="#fff"],
      .database-diagram.ai-diagram svg tspan[fill*="#ffffff"] {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Maximum specificity override for all text */
      .database-diagram.ai-diagram svg g text,
      .database-diagram.ai-diagram svg g tspan,
      .database-diagram.ai-diagram svg rect + text,
      .database-diagram.ai-diagram svg rect + tspan,
      .database-diagram.ai-diagram svg g rect + text,
      .database-diagram.ai-diagram svg g rect + tspan {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Override with maximum specificity using attribute selectors */
      .database-diagram.ai-diagram svg text[fill],
      .database-diagram.ai-diagram svg tspan[fill],
      .database-diagram.ai-diagram svg text[style],
      .database-diagram.ai-diagram svg tspan[style] {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Ultimate override - target ALL text elements with maximum specificity */
      .database-diagram.ai-diagram svg text,
      .database-diagram.ai-diagram svg tspan {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Override any text that might be styled inline */
      .database-diagram.ai-diagram svg text[style*="fill"],
      .database-diagram.ai-diagram svg tspan[style*="fill"],
      .database-diagram.ai-diagram svg text[style*="color"],
      .database-diagram.ai-diagram svg tspan[style*="color"] {
        fill: #1e293b !important;
        color: #1e293b !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Force all column backgrounds to be dark */
      .database-diagram.ai-diagram svg rect[fill*="#f1f5f9"],
      .database-diagram.ai-diagram svg rect[fill*="#f8fafc"],
      .database-diagram.ai-diagram svg rect[fill*="#e2e8f0"],
      .database-diagram.ai-diagram svg rect[fill*="#cbd5e1"],
      .database-diagram.ai-diagram svg rect[fill*="#ffffff"] {
        fill: #1e293b !important;
      }
      /* Force all text in dark columns to be white */
      .database-diagram.ai-diagram svg rect[fill="#1e293b"] + text,
      .database-diagram.ai-diagram svg rect[fill="#1e293b"] text,
      .database-diagram.ai-diagram svg g[fill="#1e293b"] text,
      .database-diagram.ai-diagram svg g[fill="#1e293b"] tspan {
        fill: #ffffff !important;
        color: #ffffff !important;
      }
      /* ULTIMATE NUCLEAR OPTION - Force everything */
      .database-diagram.ai-diagram svg,
      .database-diagram.ai-diagram svg *,
      .database-diagram.ai-diagram svg rect,
      .database-diagram.ai-diagram svg g,
      .database-diagram.ai-diagram svg path,
      .database-diagram.ai-diagram svg line,
      .database-diagram.ai-diagram svg polyline,
      .database-diagram.ai-diagram svg polygon {
        fill: #1e293b !important;
        stroke: #1e293b !important;
        background: #1e293b !important;
      }
      /* Force all table cells to be the same color - no alternating */
      .database-diagram.ai-diagram svg rect[fill],
      .database-diagram.ai-diagram svg g[fill],
      .database-diagram.ai-diagram svg .entityBox,
      .database-diagram.ai-diagram svg .attributeBox {
        fill: #1e293b !important;
        background: #1e293b !important;
      }
      /* Override any alternating color patterns */
      .database-diagram.ai-diagram svg rect:nth-child(odd),
      .database-diagram.ai-diagram svg rect:nth-child(even),
      .database-diagram.ai-diagram svg g:nth-child(odd),
      .database-diagram.ai-diagram svg g:nth-child(even) {
        fill: #1e293b !important;
        background: #1e293b !important;
      }
      .database-diagram.ai-diagram svg text,
      .database-diagram.ai-diagram svg tspan,
      .database-diagram.ai-diagram svg .label,
      .database-diagram.ai-diagram svg .nodeLabel,
      .database-diagram.ai-diagram svg .edgeLabel,
      .database-diagram.ai-diagram svg .titleText,
      .database-diagram.ai-diagram svg .actor,
      .database-diagram.ai-diagram svg .messageText,
      .database-diagram.ai-diagram svg .labelText {
        fill: #ffffff !important;
        color: #ffffff !important;
        stroke: none !important;
        font-weight: bold !important;
      }
      /* Override any remaining elements */
      .database-diagram.ai-diagram svg [fill],
      .database-diagram.ai-diagram svg [style*="fill"] {
        fill: #1e293b !important;
      }
      .database-diagram.ai-diagram svg text[fill],
      .database-diagram.ai-diagram svg tspan[fill],
      .database-diagram.ai-diagram svg text[style*="fill"],
      .database-diagram.ai-diagram svg tspan[style*="fill"] {
        fill: #ffffff !important;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);

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
      er: {
        diagramPadding: 20,
        layoutDirection: "TB",
        minEntityWidth: 100,
        minEntityHeight: 75,
        entityPadding: 15,
        stroke: "#1e293b",
        fill: "#1e293b",
        fontSize: 12,
      },
    });

    return () => {
      const existingStyle = document.getElementById("mermaid-custom-style");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
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

    // Prevent multiple clicks
    if (isGeneratingAI || isLoading) {
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

      if (!aiConfig) {
        throw new Error("AI configuration not available");
      }

      const { AIService } = await import("@/lib/ai-service");
      const diagram = await AIService.generateDiagram(
        JSON.stringify(schema),
        aiConfig
      );

      if (!diagram) {
        throw new Error("No diagram returned from AI API");
      }

      // Step 2: Render diagram
      setAiProgress(75);
      setAiGenerationStep("Rendering diagram...");
      const diagramId = `ai-diagram-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const { svg } = await mermaid.render(diagramId, diagram);
      // Add ai-diagram class to SVG for CSS targeting
      const svgWithClass = svg.replace("<svg", '<svg class="ai-diagram"');
      setDiagramSvg(svgWithClass);

      // Force override all text elements with JavaScript after rendering
      const forceTextOverride = () => {
        const svgElement = document.querySelector(
          ".database-diagram.ai-diagram svg"
        );
        if (svgElement) {
          // NUCLEAR OPTION - Override EVERYTHING
          const allElements2 = svgElement.querySelectorAll("*");
          allElements2.forEach((el: any) => {
            // Force all backgrounds to be dark - NO ALTERNATING COLORS
            if (el.tagName === "rect" || el.tagName === "g") {
              el.style.fill = "#1e293b";
              el.style.background = "#1e293b";
              el.setAttribute("fill", "#1e293b");
              // Override any alternating color classes
              el.classList.remove("odd", "even", "alternating");
            }
            // Force all text to be white
            if (el.tagName === "text" || el.tagName === "tspan") {
              el.style.fill = "#ffffff";
              el.style.color = "#ffffff";
              el.setAttribute("fill", "#ffffff");
              el.setAttribute("color", "#ffffff");
            }
            // Force all lines to be dark
            if (
              el.tagName === "path" ||
              el.tagName === "line" ||
              el.tagName === "polyline"
            ) {
              el.style.stroke = "#1e293b";
              el.setAttribute("stroke", "#1e293b");
            }
          });

          // Specifically target alternating color elements
          const alternatingElements = svgElement.querySelectorAll(
            "rect[fill*='#f'], rect[fill*='#e'], rect[fill*='#c'], rect[fill*='#9'], rect[fill*='#6'], rect[fill*='#3'], rect[fill*='#1']"
          );
          alternatingElements.forEach((el: any) => {
            el.style.fill = "#1e293b";
            el.style.background = "#1e293b";
            el.setAttribute("fill", "#1e293b");
          });

          // Override all text elements
          const allTextElements = svgElement.querySelectorAll(
            "text, tspan, .label, .nodeLabel, .edgeLabel"
          );
          allTextElements.forEach((el: any) => {
            el.style.fill = "#ffffff";
            el.style.color = "#ffffff";
            el.style.stroke = "none";
            el.style.fontWeight = "bold";
            el.setAttribute("fill", "#ffffff");
            el.setAttribute("color", "#ffffff");
          });

          // Override text in gray backgrounds specifically
          const grayBackgroundElements = svgElement.querySelectorAll(
            "g[fill*='#f1f5f9'], g[fill*='#f8fafc'], g[fill*='#e2e8f0'], g[fill*='#cbd5e1'], rect[fill*='#f1f5f9'], rect[fill*='#f8fafc'], rect[fill*='#e2e8f0'], rect[fill*='#cbd5e1'], rect[fill*='#ffffff']"
          );
          grayBackgroundElements.forEach((el: any) => {
            const textElements = el.querySelectorAll(
              "text, tspan, .label, .nodeLabel"
            );
            textElements.forEach((textEl: any) => {
              textEl.style.fill = "#1e293b";
              textEl.style.color = "#1e293b";
              textEl.style.stroke = "none";
              textEl.style.fontWeight = "bold";
              textEl.setAttribute("fill", "#1e293b");
              textEl.setAttribute("color", "#1e293b");
            });
          });

          // Override text in all table cells (even/odd rows)
          const allRects = svgElement.querySelectorAll("rect");
          allRects.forEach((rect: any) => {
            const textElements = rect.parentElement?.querySelectorAll(
              "text, tspan, .label, .nodeLabel"
            );
            if (textElements) {
              textElements.forEach((textEl: any) => {
                textEl.style.fill = "#1e293b";
                textEl.style.color = "#1e293b";
                textEl.style.stroke = "none";
                textEl.style.fontWeight = "bold";
                textEl.setAttribute("fill", "#1e293b");
                textEl.setAttribute("color", "#1e293b");
              });
            }
          });

          // Override text in all groups (for table structure)
          const allGroups = svgElement.querySelectorAll("g");
          allGroups.forEach((group: any) => {
            const textElements = group.querySelectorAll(
              "text, tspan, .label, .nodeLabel"
            );
            textElements.forEach((textEl: any) => {
              textEl.style.fill = "#1e293b";
              textEl.style.color = "#1e293b";
              textEl.style.stroke = "none";
              textEl.style.fontWeight = "bold";
              textEl.setAttribute("fill", "#1e293b");
              textEl.setAttribute("color", "#1e293b");
            });
          });

          // Override all foreign objects
          const foreignObjects = svgElement.querySelectorAll(
            "foreignObject, foreignObject *"
          );
          foreignObjects.forEach((el: any) => {
            el.style.color = "#1e293b";
            el.style.fill = "#1e293b";
          });

          // Override any elements with light colors
          const allElements = svgElement.querySelectorAll("*");
          allElements.forEach((el: any) => {
            if (
              el.style.fill &&
              (el.style.fill.includes("blue") ||
                el.style.fill.includes("#") ||
                el.style.fill.includes("rgb"))
            ) {
              el.style.fill = "#1e293b";
              el.setAttribute("fill", "#1e293b");
            }
            if (
              el.style.color &&
              (el.style.color.includes("blue") ||
                el.style.color.includes("#") ||
                el.style.color.includes("rgb"))
            ) {
              el.style.color = "#1e293b";
              el.setAttribute("color", "#1e293b");
            }
          });

          // Force all text to be dark regardless of parent background
          const allTextNodes = svgElement.querySelectorAll("text, tspan");
          allTextNodes.forEach((textEl: any) => {
            // Force override with maximum priority
            textEl.style.setProperty("fill", "#1e293b", "important");
            textEl.style.setProperty("color", "#1e293b", "important");
            textEl.style.setProperty("stroke", "none", "important");
            textEl.style.setProperty("font-weight", "bold", "important");
            textEl.setAttribute("fill", "#1e293b");
            textEl.setAttribute("color", "#1e293b");

            // Also check if parent has gray background
            let parent = textEl.parentElement;
            while (parent && parent !== svgElement) {
              if (
                parent.style.fill &&
                (parent.style.fill.includes("#f1f5f9") ||
                  parent.style.fill.includes("#f8fafc") ||
                  parent.style.fill.includes("#e2e8f0") ||
                  parent.style.fill.includes("#cbd5e1") ||
                  parent.style.fill.includes("#ffffff"))
              ) {
                textEl.style.setProperty("fill", "#1e293b", "important");
                textEl.style.setProperty("color", "#1e293b", "important");
                textEl.setAttribute("fill", "#1e293b");
                textEl.setAttribute("color", "#1e293b");
                break;
              }
              parent = parent.parentElement;
            }
          });

          // Nuclear option - force ALL text elements to be dark
          const allSvgElements = svgElement.querySelectorAll("*");
          allSvgElements.forEach((el: any) => {
            if (el.tagName === "text" || el.tagName === "tspan") {
              el.style.setProperty("fill", "#1e293b", "important");
              el.style.setProperty("color", "#1e293b", "important");
              el.style.setProperty("stroke", "none", "important");
              el.style.setProperty("font-weight", "bold", "important");
              el.setAttribute("fill", "#1e293b");
              el.setAttribute("color", "#1e293b");
            }
          });

          // Additional aggressive override - target specific Mermaid classes
          const mermaidTextElements = svgElement.querySelectorAll(
            "text, tspan, .nodeLabel, .edgeLabel, .label, .titleText, .actor, .messageText, .labelText"
          );
          mermaidTextElements.forEach((el: any) => {
            el.style.setProperty("fill", "#1e293b", "important");
            el.style.setProperty("color", "#1e293b", "important");
            el.style.setProperty("stroke", "none", "important");
            el.style.setProperty("font-weight", "bold", "important");
            el.setAttribute("fill", "#1e293b");
            el.setAttribute("color", "#1e293b");
          });

          // Force all column backgrounds to be dark
          const allRects2 = svgElement.querySelectorAll("rect");
          allRects2.forEach((rect: any) => {
            const fillColor =
              rect.getAttribute("fill") || rect.style.fill || "";
            if (
              fillColor.includes("#f1f5f9") ||
              fillColor.includes("#f8fafc") ||
              fillColor.includes("#e2e8f0") ||
              fillColor.includes("#cbd5e1") ||
              fillColor.includes("#ffffff") ||
              fillColor === "white" ||
              fillColor === "#fff" ||
              fillColor === "#ffffff"
            ) {
              rect.style.setProperty("fill", "#1e293b", "important");
              rect.setAttribute("fill", "#1e293b");
            }
          });

          // Force all text in dark columns to be white
          const allTexts = svgElement.querySelectorAll("text, tspan");
          allTexts.forEach((el: any) => {
            // Check if parent has dark background
            let parent = el.parentElement;
            let hasDarkBackground = false;

            while (parent && parent !== svgElement) {
              const parentFill =
                parent.getAttribute("fill") || parent.style.fill || "";
              if (parentFill === "#1e293b" || parentFill.includes("#1e293b")) {
                hasDarkBackground = true;
                break;
              }
              parent = parent.parentElement;
            }

            if (hasDarkBackground) {
              el.style.setProperty("fill", "#ffffff", "important");
              el.style.setProperty("color", "#ffffff", "important");
              el.setAttribute("fill", "#ffffff");
              el.setAttribute("color", "#ffffff");
            } else {
              // For light backgrounds, use dark text
              el.style.setProperty("fill", "#1e293b", "important");
              el.style.setProperty("color", "#1e293b", "important");
              el.setAttribute("fill", "#1e293b");
              el.setAttribute("color", "#1e293b");
            }
          });

          // ER Diagram specific overrides
          const erElements = svgElement.querySelectorAll(
            ".er .entityBox, .er .attributeBox"
          );
          erElements.forEach((el: any) => {
            el.style.setProperty("fill", "#1e293b", "important");
            el.style.setProperty("stroke", "#1e293b", "important");
            el.setAttribute("fill", "#1e293b");
            el.setAttribute("stroke", "#1e293b");
          });

          const erTexts = svgElement.querySelectorAll(
            ".er .entityLabel, .er .attributeLabel"
          );
          erTexts.forEach((el: any) => {
            el.style.setProperty("fill", "#ffffff", "important");
            el.style.setProperty("color", "#ffffff", "important");
            el.setAttribute("fill", "#ffffff");
            el.setAttribute("color", "#ffffff");
          });

          const erLines = svgElement.querySelectorAll(
            ".er .relationshipLine, .er path, .er line"
          );
          erLines.forEach((el: any) => {
            el.style.setProperty("stroke", "#1e293b", "important");
            el.style.setProperty("stroke-width", "2px", "important");
            el.setAttribute("stroke", "#1e293b");
            el.setAttribute("stroke-width", "2");
          });
        }
      };

      // Run multiple times with delays and requestAnimationFrame
      setTimeout(forceTextOverride, 100);
      setTimeout(forceTextOverride, 300);
      setTimeout(forceTextOverride, 500);
      setTimeout(forceTextOverride, 1000);
      setTimeout(forceTextOverride, 2000);
      setTimeout(forceTextOverride, 3000);

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        forceTextOverride();
        requestAnimationFrame(() => {
          forceTextOverride();
        });
      });

      // ULTIMATE NUCLEAR OPTION - Run continuously for 15 seconds
      const nuclearInterval = setInterval(() => {
        forceTextOverride();
      }, 50);

      // Stop after 15 seconds
      setTimeout(() => {
        clearInterval(nuclearInterval);
      }, 15000);

      // Additional aggressive override
      const aggressiveOverride = () => {
        const svgElement = document.querySelector(
          ".database-diagram.ai-diagram svg"
        );
        if (svgElement) {
          console.log("Aggressive override running on SVG element");
          // Force ALL elements to be dark
          const allElements = svgElement.querySelectorAll("*");
          console.log(`Found ${allElements.length} elements to override`);
          allElements.forEach((el: any) => {
            if (el.tagName !== "text" && el.tagName !== "tspan") {
              el.style.fill = "#1e293b";
              el.style.background = "#1e293b";
              el.setAttribute("fill", "#1e293b");
            } else {
              el.style.fill = "#ffffff";
              el.style.color = "#ffffff";
              el.setAttribute("fill", "#ffffff");
            }
          });
        } else {
          console.log("No SVG element found for aggressive override");
        }
      };

      // Run aggressive override
      setTimeout(aggressiveOverride, 200);
      setTimeout(aggressiveOverride, 500);
      setTimeout(aggressiveOverride, 1000);
      setTimeout(aggressiveOverride, 2000);
      setTimeout(aggressiveOverride, 5000);

      // Use MutationObserver to monitor DOM changes
      const observer = new MutationObserver(() => {
        forceTextOverride();
      });

      // Start observing
      const targetNode = document.querySelector(".database-diagram");
      if (targetNode) {
        observer.observe(targetNode, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "fill", "color"],
        });
      }

      // Cleanup observer after 5 seconds
      setTimeout(() => {
        observer.disconnect();
      }, 5000);

      // Step 3: Complete
      setAiProgress(100);
      setAiGenerationStep("Complete!");

      // Auto-close after successful generation
      setTimeout(() => {
        setIsGeneratingAI(false);
        setAiGenerationStep("");
        setAiProgress(0);
      }, 2000);
    } catch (error) {
      console.error("Error generating AI diagram:", error);
      setAiProgress(0);
      setAiGenerationStep("Falling back to basic diagram...");
      // Fallback to regular diagram
      await renderDiagram();
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
      // Manual diagram - no special class needed, uses default styling
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
                className={`h-6 w-6 p-0 ${
                  isGeneratingAI ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isGeneratingAI || isLoading}
                title={
                  isGeneratingAI
                    ? "Generating AI diagram..."
                    : "Generate AI Enhanced Diagram"
                }
              >
                {isGeneratingAI ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
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
                className={`h-6 w-6 p-0 ${
                  isGeneratingAI ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isGeneratingAI || isLoading}
                title={
                  isGeneratingAI
                    ? "Generating AI diagram..."
                    : "Generate AI Enhanced Diagram"
                }
              >
                {isGeneratingAI ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
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
                  title={
                    isGeneratingAI
                      ? "Generating AI diagram..."
                      : "Generate AI Enhanced Diagram"
                  }
                  className={
                    isGeneratingAI ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  {isGeneratingAI ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
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

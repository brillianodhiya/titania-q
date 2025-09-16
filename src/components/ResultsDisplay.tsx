"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { QueryResult } from "@/types/database";
import {
  Table,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Layers,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import "./ResultsDisplay.css";

interface ResultsDisplayProps {
  results: QueryResult;
}

// Constants for performance thresholds
const PAGINATION_THRESHOLD = 1000;
const VIRTUAL_SCROLL_THRESHOLD = 5000;
const ITEMS_PER_PAGE = 100;
const ITEM_HEIGHT = 40; // Height per row in pixels
const CONTAINER_HEIGHT = 400; // Visible container height

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [expandedCell, setExpandedCell] = useState<{
    rowIndex: number;
    cellIndex: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const expandedCellRef = useRef<HTMLDivElement>(null);

  // Determine display method based on data size
  const shouldUseVirtualScroll = results.row_count > VIRTUAL_SCROLL_THRESHOLD;
  const shouldUsePagination = results.row_count > PAGINATION_THRESHOLD;

  // Pagination logic
  const totalPages = Math.ceil(results.row_count / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Virtual scroll calculations
  const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
  const visibleEnd = Math.min(
    results.row_count,
    visibleStart + Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 5 // Buffer for smooth scrolling
  );

  // Get visible rows based on display method
  const visibleRows = useMemo(() => {
    if (shouldUseVirtualScroll) {
      return results.rows.slice(visibleStart, visibleEnd);
    } else if (shouldUsePagination) {
      return results.rows.slice(startIndex, endIndex);
    }
    return results.rows;
  }, [
    results.rows,
    shouldUseVirtualScroll,
    shouldUsePagination,
    visibleStart,
    visibleEnd,
    startIndex,
    endIndex,
  ]);

  // Handle scroll events for virtual scrolling and horizontal scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;

      if (shouldUseVirtualScroll) {
        setScrollTop(target.scrollTop);
      }

      // Handle horizontal scroll
      setScrollLeft(target.scrollLeft);
      setCanScrollLeft(target.scrollLeft > 0);
      setCanScrollRight(
        target.scrollLeft < target.scrollWidth - target.clientWidth
      );
    },
    [shouldUseVirtualScroll]
  );

  // Handle cell double-click for expansion
  const handleCellDoubleClick = useCallback(
    (rowIndex: number, cellIndex: number, isLongText: boolean) => {
      if (isLongText) {
        setExpandedCell({ rowIndex, cellIndex });
      }
    },
    []
  );

  // Handle click outside to close expanded cell
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        expandedCellRef.current &&
        !expandedCellRef.current.contains(event.target as Node)
      ) {
        setExpandedCell(null);
      }
    };

    if (expandedCell) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedCell]);

  // Reset scroll position when switching pages
  useEffect(() => {
    if (scrollContainerRef.current && shouldUseVirtualScroll) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [currentPage, shouldUseVirtualScroll]);

  // Check scroll state on mount and when results change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const target = scrollContainerRef.current;
      setCanScrollLeft(target.scrollLeft > 0);
      setCanScrollRight(
        target.scrollLeft < target.scrollWidth - target.clientWidth
      );
    }
  }, [results.columns.length, results.rows.length]);

  // Horizontal scroll functions
  const scrollLeftAction = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRightAction = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Enhanced cell value formatter for different data types
  const formatCellValue = (value: any): { text: string; type: string } => {
    if (value === null || value === undefined) {
      return { text: "NULL", type: "null" };
    }

    // Handle different data types
    if (typeof value === "number") {
      // Check if it's a decimal number
      if (value % 1 !== 0) {
        return {
          text: value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          }),
          type: "decimal",
        };
      }
      return {
        text: value.toLocaleString("en-US"),
        type: "integer",
      };
    }

    if (typeof value === "boolean") {
      return {
        text: value ? "TRUE" : "FALSE",
        type: "boolean",
      };
    }

    if (typeof value === "string") {
      // Check if it's a date string
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
      const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      if (datetimeRegex.test(value) || timestampRegex.test(value)) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return {
              text: date.toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              type: "datetime",
            };
          }
        } catch (e) {
          // Fall through to default string handling
        }
      } else if (dateRegex.test(value)) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return {
              text: date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
              type: "date",
            };
          }
        } catch (e) {
          // Fall through to default string handling
        }
      } else if (timeRegex.test(value)) {
        try {
          const time = new Date(`1970-01-01T${value}`);
          if (!isNaN(time.getTime())) {
            return {
              text: time.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              type: "time",
            };
          }
        } catch (e) {
          // Fall through to default string handling
        }
      }

      return { text: value, type: "string" };
    }

    // Handle objects (JSON, arrays, etc.)
    if (typeof value === "object") {
      try {
        return {
          text: JSON.stringify(value, null, 2),
          type: "json",
        };
      } catch (e) {
        return { text: String(value), type: "object" };
      }
    }

    return { text: String(value), type: "unknown" };
  };

  const exportToCSV = () => {
    if (!results.columns.length || !results.rows.length) return;

    const csvContent = [
      results.columns.join(","),
      ...results.rows.map((row) =>
        row
          .map((cell) => {
            const formattedValue = formatCellValue(cell);
            return typeof formattedValue.text === "string" &&
              formattedValue.text.includes(",")
              ? `"${formattedValue.text}"`
              : formattedValue.text;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const renderPaginationControls = () => {
    if (!shouldUsePagination) return null;

    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    return (
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <span className="text-sm text-muted-foreground">
            ({startIndex + 1}-{Math.min(endIndex, results.row_count)} of{" "}
            {results.row_count.toLocaleString()})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const page = startPage + i;
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!results.columns.length || !results.rows.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8">
        <div className="text-center">
          <Table className="h-12 w-12 mx-auto mb-4" />
          <p className="text-sm font-medium">No results found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with performance indicators */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            <span className="text-sm font-semibold text-foreground">
              {results.row_count.toLocaleString()} row
              {results.row_count !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Performance indicators */}
          <div className="flex items-center gap-3">
            {shouldUseVirtualScroll && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                <Zap className="h-3 w-3" />
                <span>Virtual Scroll</span>
              </div>
            )}
            {shouldUsePagination && !shouldUseVirtualScroll && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                <Layers className="h-3 w-3" />
                <span>Pagination</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Horizontal scroll controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={scrollLeftAction}
              disabled={!canScrollLeft}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Scroll left"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={scrollRightAction}
              disabled={!canScrollRight}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Scroll right"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Export All ({results.row_count.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-auto virtual-scroll-container"
          onScroll={handleScroll}
        >
          <div className="bg-background rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-full">
                <thead className="sticky top-0 bg-muted/50 z-10">
                  <tr className="border-b">
                    {results.columns.map((column, index) => (
                      <th
                        key={index}
                        className="text-left px-6 py-4 font-semibold text-sm text-foreground"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shouldUseVirtualScroll ? (
                    // Virtual Scroll Implementation
                    <>
                      {/* Spacer for virtual scrolling */}
                      <tr
                        className="virtual-spacer"
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{ height: `${visibleStart * ITEM_HEIGHT}px` }}
                      >
                        <td colSpan={results.columns.length}></td>
                      </tr>
                      {visibleRows.map((row, index) => (
                        <tr
                          key={visibleStart + index}
                          className="border-b hover:bg-muted/30 transition-colors virtual-row"
                          // eslint-disable-next-line react/forbid-dom-props
                          style={{ height: `${ITEM_HEIGHT}px` }}
                        >
                          {row.map((cell, cellIndex) => {
                            const formatted = formatCellValue(cell);
                            return (
                              <td key={cellIndex} className="px-6 py-4 text-sm">
                                <span
                                  className={`whitespace-pre-wrap ${
                                    formatted.type === "null"
                                      ? "text-muted-foreground italic"
                                      : formatted.type === "decimal" ||
                                        formatted.type === "integer"
                                      ? "text-blue-600 font-mono"
                                      : formatted.type === "boolean"
                                      ? "text-green-600 font-medium"
                                      : formatted.type === "date" ||
                                        formatted.type === "datetime" ||
                                        formatted.type === "time"
                                      ? "text-purple-600 font-mono"
                                      : formatted.type === "json"
                                      ? "text-orange-600 font-mono text-xs"
                                      : "text-foreground"
                                  }`}
                                >
                                  {formatted.text}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {/* Bottom spacer for virtual scrolling */}
                      <tr
                        className="virtual-spacer"
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{
                          height: `${
                            (results.row_count - visibleEnd) * ITEM_HEIGHT
                          }px`,
                        }}
                      >
                        <td colSpan={results.columns.length}></td>
                      </tr>
                    </>
                  ) : (
                    // Regular display or pagination
                    visibleRows.map((row, rowIndex) => (
                      <tr
                        key={
                          shouldUsePagination ? startIndex + rowIndex : rowIndex
                        }
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        {row.map((cell, cellIndex) => {
                          const formatted = formatCellValue(cell);
                          const isDetailKomisi =
                            results.columns[cellIndex] === "detail_komisi";
                          const isLongText = formatted.text.length > 50; // Any cell with text > 50 chars can be expanded
                          const isExpanded =
                            expandedCell?.rowIndex ===
                              (shouldUsePagination
                                ? startIndex + rowIndex
                                : rowIndex) &&
                            expandedCell?.cellIndex === cellIndex;
                          const actualRowIndex = shouldUsePagination
                            ? startIndex + rowIndex
                            : rowIndex;

                          return (
                            <td
                              key={cellIndex}
                              className={`px-6 py-4 text-sm ${
                                isDetailKomisi ? "max-w-xs" : ""
                              }`}
                            >
                              <div
                                ref={isExpanded ? expandedCellRef : undefined}
                                className={`${
                                  isLongText
                                    ? "whitespace-normal break-words"
                                    : "whitespace-pre-wrap"
                                } ${
                                  isLongText && !isExpanded
                                    ? "line-clamp-3 expandable-cell"
                                    : isExpanded
                                    ? "expanded-cell"
                                    : ""
                                } ${
                                  formatted.type === "null"
                                    ? "text-muted-foreground italic"
                                    : formatted.type === "decimal" ||
                                      formatted.type === "integer"
                                    ? "text-blue-600 font-mono"
                                    : formatted.type === "boolean"
                                    ? "text-green-600 font-medium"
                                    : formatted.type === "date" ||
                                      formatted.type === "datetime" ||
                                      formatted.type === "time"
                                    ? "text-purple-600 font-mono"
                                    : formatted.type === "json"
                                    ? "text-orange-600 font-mono text-xs"
                                    : "text-foreground"
                                }`}
                                title={
                                  isLongText && !isExpanded
                                    ? "Double-click to expand"
                                    : undefined
                                }
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCellDoubleClick(
                                    actualRowIndex,
                                    cellIndex,
                                    isLongText
                                  );
                                }}
                              >
                                {formatted.text}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {renderPaginationControls()}
    </div>
  );
}

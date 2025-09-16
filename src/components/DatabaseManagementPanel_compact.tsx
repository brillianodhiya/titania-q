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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatabaseSchema } from "@/types/database";
import {
  Database,
  Table,
  Plus,
  Trash2,
  Edit,
  Play,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { FloatingQueryEditor } from "./FloatingQueryEditor";

interface DatabaseManagementPanelProps {
  schema: DatabaseSchema | null;
  onExecuteQuery: (query: string) => void;
  onRefreshSchema: () => void;
  onSwitchDatabase?: (databaseName: string) => void;
}

export function DatabaseManagementPanel({
  schema,
  onExecuteQuery,
  onRefreshSchema,
  onSwitchDatabase,
}: DatabaseManagementPanelProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [databaseSearchTerm, setDatabaseSearchTerm] = useState("");
  const [tableSearchTerm, setTableSearchTerm] = useState("");

  const loadDatabases = async () => {
    setIsLoadingDatabases(true);
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const dbList = await invoke<string[]>("list_databases");
      setDatabases(dbList);
    } catch (error) {
      console.error("Failed to load databases:", error);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const loadCollections = async () => {
    setIsLoadingCollections(true);
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const collectionList = await invoke<string[]>("list_collections");
      setCollections(collectionList);
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
  };

  const handleQuickQuery = (query: string) => {
    onExecuteQuery(query);
  };

  const filteredTables =
    schema?.tables.filter((table) =>
      table.name.toLowerCase().includes(tableSearchTerm.toLowerCase())
    ) || [];

  const filteredDatabases = databases.filter((db) =>
    db.toLowerCase().includes(databaseSearchTerm.toLowerCase())
  );

  const filteredCollections = collections.filter((collection) =>
    collection.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2 p-2">
      {/* Database Switch */}
      {onSwitchDatabase && (
        <Card>
          <CardHeader className="pb-2 px-3 py-2">
            <CardTitle className="text-sm">Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="flex gap-1">
              <Input
                placeholder="Search databases..."
                value={databaseSearchTerm}
                onChange={(e) => setDatabaseSearchTerm(e.target.value)}
                className="text-xs h-7"
              />
              <Button
                onClick={loadDatabases}
                disabled={isLoadingDatabases}
                size="sm"
                variant="outline"
                className="h-7 px-2"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    isLoadingDatabases ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {filteredDatabases.map((db) => (
                <button
                  key={db}
                  onClick={() => onSwitchDatabase(db)}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded transition-colors"
                >
                  {db}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      <Card>
        <CardHeader className="pb-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tables</CardTitle>
            <Button
              onClick={onRefreshSchema}
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          <div className="flex gap-1">
            <Input
              placeholder="Search tables..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              className="text-xs h-7"
            />
            <Button
              onClick={() => setTableSearchTerm("")}
              size="sm"
              variant="outline"
              className="h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                className={`p-1.5 rounded border cursor-pointer transition-colors ${
                  selectedTable === table.name
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => handleTableSelect(table.name)}
              >
                <div className="flex items-center gap-1.5">
                  <Table className="h-3 w-3" />
                  <span className="text-xs font-medium">{table.name}</span>
                </div>
                <div className="text-xs opacity-70 mt-0.5">
                  {table.columns.length} columns
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Table Details */}
      {selectedTable && schema && (
        <Card>
          <CardHeader className="pb-2 px-3 py-2">
            <CardTitle className="text-sm">Table: {selectedTable}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="space-y-1">
              {schema.tables
                .find((t) => t.name === selectedTable)
                ?.columns.map((column) => (
                  <div
                    key={column.name}
                    className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{column.name}</span>
                      <span className="text-muted-foreground">
                        {column.data_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {column.is_primary_key && (
                        <span className="px-1 py-0.5 bg-primary text-primary-foreground rounded text-xs">
                          PK
                        </span>
                      )}
                      {column.is_foreign_key && (
                        <span className="px-1 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                          FK
                        </span>
                      )}
                      {!column.is_nullable && (
                        <span className="px-1 py-0.5 bg-destructive text-destructive-foreground rounded text-xs">
                          NOT NULL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() =>
                  handleQuickQuery(`SELECT * FROM ${selectedTable} LIMIT 10`)
                }
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                SELECT *
              </Button>
              <Button
                onClick={() =>
                  handleQuickQuery(`SELECT COUNT(*) FROM ${selectedTable}`)
                }
                size="sm"
                variant="outline"
                className="h-7 text-xs"
              >
                COUNT
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections (for MongoDB) */}
      {collections.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3 py-2">
            <CardTitle className="text-sm">Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {filteredCollections.map((collection) => (
                <div
                  key={collection}
                  className="p-1.5 rounded border hover:bg-muted cursor-pointer transition-colors"
                  onClick={() =>
                    handleQuickQuery(`db.${collection}.find().limit(10)`)
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <Database className="h-3 w-3" />
                    <span className="text-xs font-medium">{collection}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Query Editor */}
      <FloatingQueryEditor onExecuteQuery={onExecuteQuery} />
    </div>
  );
}

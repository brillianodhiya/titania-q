export type Language = "en" | "id";

export interface Translations {
  // App Header
  appTitle: string;
  appSubtitle: string;

  // Navigation
  queryLog: string;
  consultation: string;
  config: string;

  // Database Management
  databaseManagement: string;
  database: string;
  searchDatabases: string;
  tables: string;
  searchTables: string;
  collections: string;
  databaseRelationsDiagram: string;
  clickToOpenDiagram: string;

  // Table Details
  selectedTableDetails: string;
  columns: string;
  primaryKey: string;
  foreignKey: string;
  notNull: string;
  selectAll: string;
  count: string;

  // Database Insights
  databaseInsights: string;
  copy: string;
  clear: string;
  generateInsights: string;
  aiAnalysis: string;
  suggestionsForQueries: string;
  schemaStatistics: string;
  tablesCount: string;
  relationsCount: string;
  columnsCount: string;

  // AI Consultation
  aiConsultation: string;
  askAbout: string;
  askAboutDatabase: string;
  send: string;
  aiThinking: string;
  suggestedQuestions: string;
  quickQuestions: string;

  // Query Interface
  aiQueryInterface: string;
  askQuestionNaturalLanguage: string;
  execute: string;
  clearQuery: string;

  // Query Results
  queryResults: string;
  noResults: string;
  exportToCsv: string;
  rowsPerPage: string;
  showingResults: string;
  of: string;
  previous: string;
  next: string;

  // Query Log
  queries: string;
  timestamp: string;
  query: string;
  status: string;
  executionTime: string;
  rows: string;
  error: string;
  success: string;
  clearAllLogs: string;
  copyQuery: string;
  noQueriesExecuted: string;

  // Database Config
  databaseConfiguration: string;
  connectionType: string;
  host: string;
  port: string;
  username: string;
  password: string;
  connect: string;
  disconnect: string;
  connected: string;
  disconnected: string;

  // AI Config
  aiConfiguration: string;
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  save: string;

  // Common
  loading: string;
  cancel: string;
  confirm: string;
  close: string;
  open: string;
  refresh: string;
  search: string;
  filter: string;
  sort: string;
  edit: string;
  delete: string;

  // Error Messages
  connectionFailed: string;
  queryFailed: string;
  noSchemaAvailable: string;
  invalidQuery: string;
  networkError: string;
  unknownError: string;

  // Success Messages
  connectionSuccessful: string;
  queryExecuted: string;
  dataExported: string;
  settingsSaved: string;

  // Placeholders
  connectToDatabase: string;
  runQuery: string;
  configureDatabaseConnection: string;
  useNaturalLanguage: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // App Header
    appTitle: "Titania-Q",
    appSubtitle:
      "AI-Powered Database Query Tool by Titania Labs (Kanrishaurus)",

    // Navigation
    queryLog: "Query Log",
    consultation: "Consultation",
    config: "Config",

    // Database Management
    databaseManagement: "Database Management",
    database: "Database",
    searchDatabases: "Search databases...",
    tables: "Tables",
    searchTables: "Search tables...",
    collections: "Collections",
    databaseRelationsDiagram: "Database Relations Diagram",
    clickToOpenDiagram: "Click the expand button to open the diagram",

    // Table Details
    selectedTableDetails: "Selected Table Details",
    columns: "Columns",
    primaryKey: "PK",
    foreignKey: "FK",
    notNull: "NOT NULL",
    selectAll: "SELECT *",
    count: "COUNT",

    // Database Insights
    databaseInsights: "Database Insights",
    copy: "Copy",
    clear: "Clear",
    generateInsights: "Generate Insights",
    aiAnalysis: "AI Analysis",
    suggestionsForQueries: "Suggestions for Common Queries or Analysis",
    schemaStatistics: "Schema Statistics",
    tablesCount: "Tables",
    relationsCount: "Relations",
    columnsCount: "Columns",

    // AI Consultation
    aiConsultation: "AI Consultation",
    askAbout: "Ask about",
    askAboutDatabase:
      "Ask about your database structure, relationships, or optimization...",
    send: "Send",
    aiThinking: "AI is thinking...",
    suggestedQuestions: "Suggested questions:",
    quickQuestions: "Quick questions:",

    // Query Interface
    aiQueryInterface: "AI Query Interface",
    askQuestionNaturalLanguage: "Ask a question in natural language...",
    execute: "Execute",
    clearQuery: "Clear Query",

    // Query Results
    queryResults: "Query Results",
    noResults: "No results to display",
    exportToCsv: "Export to CSV",
    rowsPerPage: "Rows per page",
    showingResults: "Showing",
    of: "of",
    previous: "Previous",
    next: "Next",

    // Query Log
    queries: "queries",
    timestamp: "Timestamp",
    query: "Query",
    status: "Status",
    executionTime: "Execution Time",
    rows: "Rows",
    error: "Error",
    success: "Success",
    clearAllLogs: "Clear all logs",
    copyQuery: "Copy query",
    noQueriesExecuted: "No queries executed yet",

    // Database Config
    databaseConfiguration: "Database Configuration",
    connectionType: "Connection Type",
    host: "Host",
    port: "Port",
    username: "Username",
    password: "Password",
    connect: "Connect",
    disconnect: "Disconnect",
    connected: "Connected",
    disconnected: "Disconnected",

    // AI Config
    aiConfiguration: "AI Configuration",
    provider: "Provider",
    model: "Model",
    apiKey: "API Key",
    baseUrl: "Base URL",
    save: "Save",

    // Common
    loading: "Loading...",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    open: "Open",
    refresh: "Refresh",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    edit: "Edit",
    delete: "Delete",

    // Error Messages
    connectionFailed: "Connection failed",
    queryFailed: "Query failed",
    noSchemaAvailable: "Database schema not available",
    invalidQuery: "Invalid query",
    networkError: "Network error",
    unknownError: "Unknown error",

    // Success Messages
    connectionSuccessful: "Connection successful",
    queryExecuted: "Query executed successfully",
    dataExported: "Data exported successfully",
    settingsSaved: "Settings saved successfully",

    // Placeholders
    connectToDatabase: "Connect to Database",
    runQuery: "Run a Query",
    configureDatabaseConnection:
      "Configure your database connection to get started",
    useNaturalLanguage: "Use natural language to query your database",
  },

  id: {
    // App Header
    appTitle: "Titania-Q",
    appSubtitle:
      "Alat Query Database Berbasis AI oleh Titania Labs (Kanrishaurus)",

    // Navigation
    queryLog: "Log Query",
    consultation: "Konsultasi",
    config: "Konfigurasi",

    // Database Management
    databaseManagement: "Manajemen Database",
    database: "Database",
    searchDatabases: "Cari database...",
    tables: "Tabel",
    searchTables: "Cari tabel...",
    collections: "Koleksi",
    databaseRelationsDiagram: "Diagram Relasi Database",
    clickToOpenDiagram: "Klik tombol expand untuk membuka diagram",

    // Table Details
    selectedTableDetails: "Detail Tabel Terpilih",
    columns: "Kolom",
    primaryKey: "PK",
    foreignKey: "FK",
    notNull: "NOT NULL",
    selectAll: "SELECT *",
    count: "COUNT",

    // Database Insights
    databaseInsights: "Wawasan Database",
    copy: "Salin",
    clear: "Hapus",
    generateInsights: "Generate Wawasan",
    aiAnalysis: "Analisis AI",
    suggestionsForQueries: "Saran untuk Query atau Analisis Umum",
    schemaStatistics: "Statistik Schema",
    tablesCount: "Tabel",
    relationsCount: "Relasi",
    columnsCount: "Kolom",

    // AI Consultation
    aiConsultation: "Konsultasi AI",
    askAbout: "Tanyakan tentang",
    askAboutDatabase:
      "Tanyakan tentang struktur database, relasi, atau optimisasi...",
    send: "Kirim",
    aiThinking: "AI sedang berpikir...",
    suggestedQuestions: "Pertanyaan yang disarankan:",
    quickQuestions: "Pertanyaan cepat:",

    // Query Interface
    aiQueryInterface: "Antarmuka Query AI",
    askQuestionNaturalLanguage: "Ajukan pertanyaan dalam bahasa alami...",
    execute: "Eksekusi",
    clearQuery: "Hapus Query",

    // Query Results
    queryResults: "Hasil Query",
    noResults: "Tidak ada hasil untuk ditampilkan",
    exportToCsv: "Ekspor ke CSV",
    rowsPerPage: "Baris per halaman",
    showingResults: "Menampilkan",
    of: "dari",
    previous: "Sebelumnya",
    next: "Selanjutnya",

    // Query Log
    queries: "query",
    timestamp: "Waktu",
    query: "Query",
    status: "Status",
    executionTime: "Waktu Eksekusi",
    rows: "Baris",
    error: "Error",
    success: "Berhasil",
    clearAllLogs: "Hapus semua log",
    copyQuery: "Salin query",
    noQueriesExecuted: "Belum ada query yang dieksekusi",

    // Database Config
    databaseConfiguration: "Konfigurasi Database",
    connectionType: "Tipe Koneksi",
    host: "Host",
    port: "Port",
    username: "Username",
    password: "Password",
    connect: "Hubungkan",
    disconnect: "Putuskan",
    connected: "Terhubung",
    disconnected: "Terputus",

    // AI Config
    aiConfiguration: "Konfigurasi AI",
    provider: "Penyedia",
    model: "Model",
    apiKey: "API Key",
    baseUrl: "Base URL",
    save: "Simpan",

    // Common
    loading: "Memuat...",
    cancel: "Batal",
    confirm: "Konfirmasi",
    close: "Tutup",
    open: "Buka",
    refresh: "Refresh",
    search: "Cari",
    filter: "Filter",
    sort: "Urutkan",
    edit: "Edit",
    delete: "Hapus",

    // Error Messages
    connectionFailed: "Koneksi gagal",
    queryFailed: "Query gagal",
    noSchemaAvailable: "Schema database tidak tersedia",
    invalidQuery: "Query tidak valid",
    networkError: "Error jaringan",
    unknownError: "Error tidak diketahui",

    // Success Messages
    connectionSuccessful: "Koneksi berhasil",
    queryExecuted: "Query berhasil dieksekusi",
    dataExported: "Data berhasil diekspor",
    settingsSaved: "Pengaturan berhasil disimpan",

    // Placeholders
    connectToDatabase: "Hubungkan ke Database",
    runQuery: "Jalankan Query",
    configureDatabaseConnection: "Konfigurasi koneksi database untuk memulai",
    useNaturalLanguage: "Gunakan bahasa alami untuk query database",
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language];
}

export function getCurrentLanguage(): Language {
  if (typeof window === "undefined") return "en"; // Default to English on server
  try {
    return (localStorage.getItem("language") as Language) || "en";
  } catch {
    return "en"; // Fallback if localStorage is not available
  }
}

export function setLanguage(language: Language): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("language", language);
  } catch {
    // Silently fail if localStorage is not available
  }
}

# Titania-Q

A desktop database management application that allows users to query databases using natural language. Built with Tauri, Next.js, and AI SDK.

## Features

- **Natural Language Queries**: Ask questions in plain English and get SQL queries generated automatically
- **Multi-Database Support**: Connect to MySQL, PostgreSQL, and SQLite databases
- **AI Integration**: Support for Ollama (local), OpenAI, and Google Gemini
- **Schema-Aware**: AI generates accurate SQL by understanding your database structure
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Export Results**: Download query results as CSV files

## Prerequisites

- Node.js 18+ and npm
- Rust 1.70+
- For local AI: Ollama installed and running
- For cloud AI: API keys for OpenAI or Google Gemini

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd titania-q
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Rust dependencies**
   ```bash
   cd src-tauri
   cargo build
   cd ..
   ```

## Development

1. **Start the development server**

   ```bash
   npm run tauri:dev
   ```

2. **Build for production**
   ```bash
   npm run tauri:build
   ```

## Usage

### 1. Database Connection

1. Open the application
2. Configure your database connection:

   - **Database Type**: Select MySQL, PostgreSQL, or SQLite
   - **Host**: Database server address (not needed for SQLite)
   - **Port**: Database port (auto-filled based on type)
   - **Username/Password**: Database credentials (not needed for SQLite)
   - **Database Name**: Name of the database to connect to

3. Click "Connect" to establish the connection

### 2. AI Provider Configuration

Configure your AI provider for natural language processing:

#### Ollama (Local - Recommended)

- **Provider**: Ollama
- **Server URL**: `http://localhost:11434` (default)
- **Model**: `llama2`, `codellama`, or any compatible model

#### OpenAI

- **Provider**: OpenAI
- **API Key**: Your OpenAI API key
- **Model**: `gpt-3.5-turbo` or `gpt-4`

#### Google Gemini

- **Provider**: Gemini
- **API Key**: Your Google AI API key
- **Model**: `gemini-pro`

### 3. Querying

1. Once connected to a database and AI provider, you can start querying
2. Type your question in natural language, e.g.:
   - "Show me all users who registered in the last month"
   - "Find products with price greater than $100"
   - "Count the number of orders by customer"
3. Click "Generate & Execute Query" to see the results
4. Review the generated SQL before execution
5. Export results as CSV if needed

## Project Structure

```
titania-q/
├── src/                          # Next.js frontend
│   ├── app/                      # App router
│   │   ├── api/                  # API routes
│   │   │   └── generate-sql/     # AI integration endpoint
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main page
│   ├── components/               # React components
│   │   ├── ui/                   # UI components
│   │   ├── DatabaseConfigForm.tsx
│   │   ├── AIProviderConfigForm.tsx
│   │   ├── QueryInterface.tsx
│   │   └── ResultsDisplay.tsx
│   ├── lib/                      # Utilities
│   └── types/                    # TypeScript types
├── src-tauri/                    # Tauri backend
│   ├── src/
│   │   ├── main.rs               # Main Rust application
│   │   ├── database.rs           # Database operations
│   │   └── error.rs              # Error handling
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── package.json                  # Node.js dependencies
├── tailwind.config.js            # Tailwind CSS config
└── README.md
```

## Architecture

### Frontend (Next.js)

- **UI Components**: React components for database config, AI config, and query interface
- **API Routes**: Handles AI integration and natural language processing
- **State Management**: React state for application data
- **Styling**: Tailwind CSS for modern, responsive design

### Backend (Tauri/Rust)

- **Database Layer**: SQLx for database connections and query execution
- **Schema Extraction**: Automatically extracts database schema for AI context
- **Tauri Commands**: Exposes Rust functions to the frontend
- **Error Handling**: Comprehensive error handling and user feedback

### AI Integration

- **Multi-Provider Support**: Ollama, OpenAI, and Gemini
- **Schema-Aware Prompts**: Includes database structure in AI prompts
- **SQL Generation**: Converts natural language to valid SQL queries

## Database Support

- **MySQL**: Full support with schema extraction
- **PostgreSQL**: Full support with schema extraction
- **SQLite**: Full support with schema extraction

## Security Considerations

- Database credentials are stored in memory only
- API keys are stored securely in the application state
- No sensitive data is persisted to disk
- All database operations are sandboxed within the Tauri application

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify database credentials
   - Check if database server is running
   - Ensure correct port and host settings

2. **AI Generation Failed**

   - For Ollama: Ensure Ollama is running and model is installed
   - For OpenAI/Gemini: Verify API key is correct
   - Check internet connection for cloud providers

3. **SQL Execution Failed**
   - Review generated SQL for syntax errors
   - Check database permissions
   - Verify table and column names

### Development Tips

- Use `npm run tauri:dev` for development with hot reload
- Check browser console for frontend errors
- Check terminal output for Rust/Tauri errors
- Use database GUI tools to verify schema structure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

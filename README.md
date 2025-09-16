# Titania-Q 🚀

**AI-powered database management tool with Tauri desktop app**

<div align="center">
  <a href="README-ID.md">🇮🇩 Bahasa Indonesia</a> | <a href="README.md">🇺🇸 English</a>
</div>

<div align="center">
  <img src="screenshot/connection.png" alt="Database Connection" width="800"/>
  <p><em>Connect to multiple database types with ease</em></p>
</div>

Titania-Q is a modern, standalone desktop application built with Tauri, Next.js, and AI integration for comprehensive database management. It provides an intuitive interface for database operations, AI-powered SQL generation, and visual database relationship diagrams.

## 🌟 Why Titania-Q?

As an **open-source project**, Titania-Q aims to democratize database management by making AI-powered tools accessible to everyone. Whether you're a developer, data analyst, or database administrator, Titania-Q simplifies complex database operations through natural language processing and visual interfaces.

**Our Mission**: To help developers and database professionals work more efficiently by combining the power of AI with intuitive user interfaces, making database management accessible to everyone regardless of their technical background.

## ✨ Features

### 🆕 What's New in v0.2.0

- **🚀 Standalone Application** - No external dependencies required
- **🤖 Rust AI Implementation** - Faster and more reliable AI processing
- **🔧 Anthropic Claude Support** - Full integration with Claude models
- **📝 Query Logging** - Track all AI-generated and manual queries
- **⚡ Enhanced Performance** - Direct HTTP calls without Next.js overhead
- **📦 Smaller Bundle** - Reduced size by removing unused dependencies

### 🎯 AI-Powered SQL Generation

<div align="center">
  <img src="screenshot/aiqueryinterface.png" alt="AI Query Interface" width="800"/>
  <p><em>Generate SQL queries using natural language with multiple AI providers</em></p>
</div>

- Generate complex SQL queries using natural language
- Support for multiple AI providers (OpenAI, Google Gemini, Anthropic Claude, Ollama)
- Context-aware query generation based on your database schema
- Query validation and optimization suggestions

### 📊 Comprehensive Database Management

<div align="center">
  <img src="screenshot/tableview.png" alt="Table View" width="800"/>
  <p><em>View and manage your database tables with advanced features</em></p>
</div>

- Connect to MySQL, PostgreSQL, SQLite, and MongoDB
- Real-time database schema analysis
- Interactive table browsing with pagination
- Advanced data filtering and searching capabilities
- Query logging and history tracking

### 🔍 Visual Database Diagrams

- AI-generated database relationship visualization
- Interactive Mermaid diagrams
- Real-time schema updates

### 💬 AI Consultation

<div align="center">
  <img src="screenshot/aiconsult.png" alt="AI Consultation" width="800"/>
  <p><em>Get AI-powered insights about your database structure and data</em></p>
</div>

- Ask questions about your database structure
- Get recommendations for database optimization
- Understand complex relationships between tables
- Receive suggestions for query improvements

### 🌍 Multi-language Support

- English and Indonesian interface
- Localized error messages and tooltips
- Easy language switching

### 🖥️ Standalone Desktop App

- No server required, runs natively on Windows
- Lightweight and fast performance
- Offline capability for local databases
- Automatic updates

### ⚡ Advanced Features

- Query logging and history tracking
- Database insights and analytics
- AI-powered query generation
- Standalone application (no external dependencies)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Desktop**: Tauri 1.8 (Rust-based)
- **Backend**: Rust with SQLx, MongoDB Rust Driver
- **AI Integration**: Rust-based AI service with multiple providers
- **Database Support**: MySQL, PostgreSQL, SQLite, MongoDB
- **UI Components**: Custom components with Lucide React icons

## 🚀 Getting Started

### Prerequisites

- Windows 10/11 (64-bit)
- Node.js 18+ (for development)
- Rust 1.70+ (for development)
- Database server (MySQL, PostgreSQL, SQLite, or MongoDB)

### Quick Start (Download)

1. **Download the latest release**

   - Go to [Releases](https://github.com/brillianodhiya/titania-q/releases)
   - Download `Titania-Q_0.2.0_x64_en-US.msi` (Windows Installer)
   - Or download `Titania-Q_0.2.0_x64-setup.exe` (Portable Setup)

2. **Install and run**
   - Run the installer
   - Launch Titania-Q from your desktop or start menu
   - No additional setup required!

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/brillianodhiya/titania-q.git
   cd titania-q
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run in development mode**

   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

## 📖 Usage Guide

### 1. Database Connection

1. Open the application
2. Navigate to Database Management Panel
3. Select your database type (MySQL, PostgreSQL, SQLite, MongoDB)
4. Enter your connection details
5. Click "Connect" to establish connection

### 2. AI Configuration

1. Go to AI Provider Settings
2. Select your preferred AI provider:
   - **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
   - **Google Gemini**: gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro
   - **Anthropic Claude**: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
   - **Ollama**: Local models (llama2, codellama, mistral, etc.)
3. Enter your API key (for OpenAI, Gemini, and Anthropic)
4. Choose a model from the dropdown
5. Save configuration

### 3. SQL Generation

1. Use the AI Query Interface
2. Type your request in natural language (e.g., "Show me all users who registered last month")
3. Review the generated SQL
4. Execute the query and view results

### 4. Database Visualization

1. Navigate to Database Insights
2. Click "Generate Diagram" to create visual relationships
3. Use zoom and pan to explore the diagram
4. Export the diagram if needed

## ⚙️ Configuration

### AI Providers

- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- **Google Gemini**: gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro
- **Anthropic Claude**: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
- **Ollama**: Local models (llama2, codellama, mistral, etc.)

### Database Support

- **MySQL**: Full support with schema analysis and relationship detection
- **PostgreSQL**: Full support with advanced data types
- **SQLite**: Local database support with file-based storage
- **MongoDB**: Document database support with collection analysis

## 📁 Project Structure

```
titania-q/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript definitions
├── src-tauri/            # Tauri backend
│   ├── src/              # Rust source code
│   ├── icons/            # Application icons
│   └── tauri.conf.json   # Tauri configuration
├── screenshot/           # Application screenshots
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and test thoroughly
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 💖 Support the Project

Titania-Q is an open-source project developed with ❤️ to help the developer community. If you find this project useful, please consider supporting its development:

### ☕ Buy Me a Coffee

Your support helps us:

- Maintain and improve the application
- Add new features and database support
- Provide better documentation and tutorials
- Keep the project free and open-source

**Donation Links:**

- 🇮🇩 [Saweria](https://saweria.co/Kanrishaurus) - Support via Saweria
- 🇮🇩 [Trakteer](https://trakteer.id/kanrisha-d) - Support via Trakteer

### ⭐ Star the Repository

If you can't contribute financially, starring the repository helps us reach more developers who might benefit from this tool.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [Next.js](https://nextjs.org/) - React framework
- [Rust HTTP Client](https://docs.rs/reqwest/) - AI integration
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Lucide React](https://lucide.dev/) - Beautiful icons
- [Mermaid.js](https://mermaid.js.org/) - Diagram generation

### Special Thanks

- [@zulfaah](https://github.com/zulfaah) - My beloved wife, for continuous support and assistance throughout this project development

## 📞 Support & Community

If you encounter any issues or have questions:

1. **Check the [Issues](https://github.com/brillianodhiya/titania-q/issues) page**
2. **Create a new issue** with detailed information
3. **Join the discussion** in GitHub Discussions
4. **Contact**: [@brillianodhiya](https://github.com/brillianodhiya)

## 🗺️ Roadmap

### 🚀 Upcoming Features

- [ ] **macOS and Linux support** - Cross-platform compatibility
- [ ] **Additional database types** - Oracle, SQL Server, MariaDB
- [ ] **Team collaboration features** - Multi-user support, shared queries
- [ ] **Advanced query optimization** - Performance analysis and suggestions
- [ ] **Database migration tools** - Schema migration and data transfer
- [ ] **Custom theme support** - Dark/light themes and customization
- [ ] **Plugin system** - Extensible architecture for custom features
- [ ] **Export functionality** - Export query results to CSV, Excel, JSON
- [ ] **Virtual scrolling** - Enhanced performance for large datasets
- [ ] **Diagram export** - Export diagrams as images or PDF
- [ ] **Custom query editor** - Syntax highlighting and advanced editing
- [ ] **Import functionality** - Import data from various formats
- [ ] **Advanced filtering** - Complex query builder interface
- [ ] **Real-time collaboration** - Live editing and sharing
- [ ] **Query templates** - Pre-built query templates and snippets
- [ ] **Performance monitoring** - Database performance metrics and alerts

---

<div align="center">
  <strong>Made with ❤️ by Brilliano Dhiya / Kanrishaurus (2025)</strong>
  <br>
  <em>Empowering developers with AI-powered database management</em>
</div>

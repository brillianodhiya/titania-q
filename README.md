# Titania-Q 🚀

**AI-powered database management tool with Tauri desktop app**

Titania-Q is a modern, standalone desktop application built with Tauri, Next.js, and AI integration for comprehensive database management. It provides an intuitive interface for database operations, AI-powered SQL generation, and visual database relationship diagrams.

## ✨ Features

- 🎯 **AI-Powered SQL Generation** - Generate SQL queries using natural language
- 📊 **Database Management** - Connect to MySQL, PostgreSQL, SQLite, and MongoDB
- 🔍 **Visual Database Diagrams** - Interactive relationship diagrams with zoom/pan
- 🤖 **Multiple AI Providers** - Support for OpenAI, Google Gemini, Anthropic, and Ollama
- 🌍 **Multi-language Support** - English and Indonesian interface
- 🖥️ **Standalone Desktop App** - No server required, runs natively
- 📈 **Query Logging** - Track and review all executed queries
- 💬 **AI Consultation** - Ask questions about your database structure

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Desktop**: Tauri 1.8
- **Backend**: Rust with SQLx, MongoDB Rust Driver
- **AI Integration**: AI SDK with multiple providers
- **Database Support**: MySQL, PostgreSQL, SQLite, MongoDB

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Rust 1.70+
- Database server (MySQL, PostgreSQL, SQLite, or MongoDB)

### Installation

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

## 📖 Usage

### Database Connection
1. Open the application
2. Navigate to Database Management Panel
3. Enter your database connection details
4. Click "Connect" to establish connection

### AI Configuration
1. Go to AI Provider Settings
2. Select your preferred AI provider
3. Enter your API key
4. Choose a model from the dropdown
5. Save configuration

### SQL Generation
1. Use the AI Query Interface
2. Type your request in natural language
3. Review the generated SQL
4. Execute the query

## 🔧 Configuration

### AI Providers
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Google Gemini**: gemini-1.5-pro, gemini-1.5-flash
- **Anthropic**: Claude-3.5-Sonnet, Claude-3.5-Haiku
- **Ollama**: Local models (llama2, codellama, etc.)

### Database Support
- **MySQL**: Full support with schema analysis
- **PostgreSQL**: Full support with schema analysis  
- **SQLite**: Local database support
- **MongoDB**: Document database support

## 📁 Project Structure

```
titania-q/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── types/            # TypeScript definitions
├── src-tauri/            # Tauri backend
│   ├── src/              # Rust source code
│   └── tauri.conf.json   # Tauri configuration
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [Next.js](https://nextjs.org/) - React framework
- [AI SDK](https://sdk.vercel.ai/) - AI integration
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/brillianodhiya/titania-q/issues) page
2. Create a new issue with detailed information
3. Contact: [@brillianodhiya](https://github.com/brillianodhiya)

---

**Made with ❤️ by Brilliano Dhiya**
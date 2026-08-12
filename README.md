# 📚 AI-Powered Library Management System

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![AI](https://img.shields.io/badge/AI-Powered-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-success.svg)

**A modern, intelligent library management system with advanced AI capabilities**

[Features](#-features) • [AI Capabilities](#-ai-capabilities) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo)

</div>

---

## 🌟 Overview

This is a **high-level AI-powered library management system** that transforms traditional book management into an intelligent, data-driven experience. Built with modern web technologies and equipped with machine learning algorithms, NLP, and advanced analytics.

### 🎯 What Makes This Special?

- 🤖 **AI-Powered Recommendations** - Personalized book suggestions using ML algorithms
- 🔍 **Smart Search** - Natural language understanding and semantic search
- 💬 **Intelligent Chatbot** - Interactive assistant for library queries
- 📊 **Advanced Analytics** - Reading insights, achievements, and trends
- 📝 **Auto Summaries** - AI-generated book summaries and themes
- 🌐 **External APIs** - Integration with Google Books and Open Library
- 📄 **PDF Management** - Built-in PDF viewer and library
- 🔐 **Secure Auth** - JWT-based authentication with role management

---

## 🚀 Features

### Core Library Management

- **User Management**
  - User registration and secure login
  - Role-based access (Admin, Librarian, User)
  - Profile management
  
- **Book Management**
  - CRUD operations for books
  - Advanced search and filtering
  - Book availability tracking
  - ISBN, author, genre organization
  
- **Borrowing System**
  - Book borrowing and returns
  - Due date management
  - Late fee calculation
  - Borrowing history
  
- **Reservation System**
  - Book reservations
  - Priority queue management
  - Automated notifications
  
- **PDF Library**
  - Upload and manage PDFs
  - Built-in PDF viewer
  - Metadata management

### 🤖 AI Capabilities

#### 1. AI Book Recommendations 🎯
- **Collaborative Filtering**: "Users who read X also enjoyed Y"
- **Content-Based Filtering**: Genre, author, and theme matching
- **Hybrid Algorithm**: Combines multiple ML techniques
- **Confidence Scores**: Shows recommendation certainty
- **Reasoning**: Explains why each book was suggested

**Try It**: Get personalized recommendations based on your reading history

#### 2. Smart Search with NLP 🔍
- **Intent Recognition**: Understands what you're looking for
- **Entity Extraction**: Identifies genres, authors, keywords
- **Semantic Matching**: Goes beyond keyword search
- **Context-Aware**: Understands complex queries

**Try It**: Search "mystery books by Agatha Christie" or "fantasy for beginners"

#### 3. AI Chatbot Assistant 💬
- **Natural Conversations**: Chat naturally about books
- **Book Discovery**: "Recommend me a thriller"
- **Statistics**: "What are my reading stats?"
- **Availability**: "Is '1984' available?"
- **Help & Support**: Library information and assistance

**Try It**: Click the chat icon and ask anything!

#### 4. Reading Analytics 📊
- **Personal Stats**: Books read, streak, average per month
- **Reading Profile**: Speed, consistency, diversity
- **Favorite Genres**: Visual charts and breakdowns
- **Achievements**: Unlock badges and track progress
- **AI Tips**: Personalized reading suggestions

**Try It**: View your reading insights dashboard

#### 5. Book Summaries 📝
- **Auto-Generated**: AI creates book summaries
- **Key Themes**: Extracts main themes and topics
- **Reading Time**: Estimates time to complete
- **Difficulty Level**: Beginner, intermediate, advanced
- **Target Audience**: Who would enjoy this book

**Try It**: View any book details for AI summary

### External Book Integration

- **Google Books API**: Search millions of books
- **Open Library API**: Access extensive catalog
- **Unified Search**: Search across multiple sources
- **Rich Metadata**: Covers, descriptions, ratings

---

## 💻 Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **TypeScript** - Type-safe development
- **JSON Database** - File-based storage with partitioning
- **JWT** - Secure authentication
- **Custom AI Engine** - ML algorithms and NLP

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **CSS3** - Advanced styling with animations
- **React Router** - Navigation

### AI/ML
- **Custom ML Algorithms** - Collaborative filtering, content-based
- **NLP Engine** - Intent recognition, entity extraction
- **Analytics Engine** - Statistical analysis and insights
- **Optional**: OpenAI/Anthropic integration

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "library management"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

```bash
# Backend: Create .env file
cd backend
cp .env.example .env

# Edit .env with your settings (optional - works without changes)
```

### Seed Data (Recommended)

```bash
# From backend directory
npm run seed:admin   # Create admin account
npm run seed:books   # Add sample books
npm run seed:1000    # Add 1000 books (optional, for better AI)
```

### Run Application

```bash
# Terminal 1: Start backend (from backend/)
npm run dev
# Backend runs on http://localhost:3000

# Terminal 2: Start frontend (from frontend/)
npm run dev
# Frontend runs on http://localhost:5173
```

### Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

**Default Admin**:
- Username: `admin`
- Password: `admin123`

**Create User**: Sign up on the website

---

## 📖 Documentation

- 📘 **[Complete Setup Guide](./docs/COMPLETE_SETUP.md)** - Detailed installation instructions
- 🤖 **[AI Features Guide](./docs/AI_FEATURES.md)** - Complete AI capabilities documentation
- 🔌 **[AI Integration Guide](./docs/AI_INTEGRATION_GUIDE.md)** - How to integrate AI components
- 🏗️ **[Architecture](./docs/ARCHITECTURE.md)** - System architecture overview
- 📊 **[Project Status](./docs/PROJECT_STATUS.md)** - Current completion status
- 🔐 **[Authentication Setup](./docs/AUTH_SETUP.md)** - Auth configuration
- 🔒 **[Security Guide](./docs/SECURITY.md)** - Security best practices
- 🧪 **[Testing Guide](./docs/TESTING_GUIDE.md)** - How to test the application

---

## 🎮 Demo Walkthrough

### 1. User Experience

1. **Sign Up / Login**
   - Create account or login
   - Secure JWT authentication
   
2. **Browse Books**
   - View all available books
   - Use AI smart search
   - Filter by genre, author, availability
   
3. **Get AI Recommendations**
   - Navigate to "AI Recommendations" tab
   - See personalized suggestions
   - View confidence scores and reasoning
   
4. **Borrow Books**
   - Click "Borrow" on available books
   - Track borrowed books
   - View due dates
   
5. **Chat with AI**
   - Click chatbot icon (bottom-right)
   - Ask: "Recommend me a mystery book"
   - Get instant responses
   
6. **View Reading Insights**
   - Go to "Reading Insights" tab
   - See your stats and achievements
   - Get AI reading tips

### 2. Admin Experience

1. **Dashboard Overview**
   - View library statistics
   - See active users and borrows
   - Check reading trends
   
2. **Manage Books**
   - Add/Edit/Delete books
   - Upload cover images
   - Manage availability
   
3. **Manage Users**
   - View all users
   - Change user roles
   - Monitor activity
   
4. **AI Trends**
   - View popular genres
   - See trending books
   - Analyze reading patterns

---

## 🗂️ Project Structure

```
library-management/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── bookController.ts
│   │   │   ├── borrowController.ts
│   │   │   ├── aiController.ts     # 🤖 AI endpoints
│   │   │   └── ...
│   │   ├── database/         # Data storage
│   │   │   ├── db.ts
│   │   │   └── partitions/
│   │   ├── middleware/       # Auth, validation
│   │   ├── models/           # Type definitions
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   │   └── aiService.ts  # 🤖 AI engine (773 lines!)
│   │   ├── scripts/          # Seed scripts
│   │   └── server.ts         # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AIChatbot.tsx      # 🤖 Chatbot
│   │   │   ├── AIRecommendations.tsx  # 🤖 Recommendations
│   │   │   ├── ReadingInsights.tsx    # 🤖 Analytics
│   │   │   └── ...
│   │   ├── api/              # API client
│   │   ├── context/          # React context
│   │   ├── pages/            # Page components
│   │   ├── styles/           # CSS files
│   │   └── main.tsx          # Entry point
│   └── package.json
│
└── docs/
    ├── AI_FEATURES.md        # 🤖 AI documentation
    ├── AI_INTEGRATION_GUIDE.md
    ├── ARCHITECTURE.md
    ├── PROJECT_STATUS.md
    └── ...
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup      # Register new user
POST   /api/auth/login       # Login
GET    /api/auth/me          # Get current user
```

### Books
```
GET    /api/books            # Get all books
GET    /api/books/:id        # Get book by ID
POST   /api/books            # Create book (admin)
PUT    /api/books/:id        # Update book (admin)
DELETE /api/books/:id        # Delete book (admin)
GET    /api/books/search     # Search books
```

### Borrowing
```
POST   /api/borrow           # Borrow book
POST   /api/borrow/return    # Return book
GET    /api/borrow           # Get user's borrows
GET    /api/borrow/all       # Get all borrows (admin)
```

### AI Features 🤖
```
GET    /api/ai/recommendations          # Get personalized recommendations
GET    /api/ai/similar/:bookId          # Find similar books
GET    /api/ai/smart-search            # NLP-powered search
GET    /api/ai/summary/:bookId         # Get book summary
POST   /api/ai/summaries/batch         # Batch summaries
GET    /api/ai/insights                # User reading analytics
GET    /api/ai/trends                  # Library trends (admin)
POST   /api/ai/chat                    # Chatbot conversation
```

### External Books
```
GET    /api/external/search   # Search Google Books + Open Library
```

**Full API Documentation**: See [docs/README.md](./docs/README.md)

---

## 🎨 Screenshots

### 🏠 Dashboard
Modern, intuitive interface with real-time statistics

### 📚 Browse Books
Advanced search and filtering with AI smart search

### 🤖 AI Recommendations
Personalized book suggestions with confidence scores

### 💬 AI Chatbot
Interactive assistant for instant help

### 📊 Reading Insights
Comprehensive analytics and achievements

### 📱 Responsive Design
Works perfectly on mobile, tablet, and desktop

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```bash
PORT=3000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
GOOGLE_BOOKS_API_KEY=optional

# AI Configuration
AI_MODEL=local  # local | openai | anthropic
AI_ENABLE_RECOMMENDATIONS=true
AI_ENABLE_SMART_SEARCH=true
AI_ENABLE_CHATBOT=true
AI_ENABLE_SUMMARIES=true
AI_ENABLE_ANALYTICS=true

# Optional: For enhanced AI
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### AI Models

**Local (Default)** - Free, no setup:
- Fast and efficient
- Works offline
- No API costs
- Good quality results

**OpenAI** - Enhanced quality:
- Better natural language
- More sophisticated summaries
- Requires API key
- Pay per use

**Anthropic (Claude)** - Alternative:
- High-quality responses
- Good for long-form content
- Requires API key
- Pay per use

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Manual testing
# See docs/TESTING_GUIDE.md
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Review security settings
- [ ] Configure CORS properly
- [ ] Set up logging
- [ ] Database backup strategy
- [ ] SSL/TLS certificates
- [ ] Rate limiting
- [ ] Monitoring

See [docs/PRODUCTION_CHECKLIST.md](./backend/PRODUCTION_CHECKLIST.md) for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Initial Development** - Library Management System
- **AI Enhancement** - Added ML, NLP, and advanced analytics

---

## 🙏 Acknowledgments

- React team for React 19
- Express.js community
- Google Books API
- Open Library API
- TypeScript team
- All open-source contributors

---

## 📞 Support

- **Documentation**: Check [docs/](./docs/) folder
- **AI Features**: [AI_FEATURES.md](./docs/AI_FEATURES.md)
- **Integration Help**: [AI_INTEGRATION_GUIDE.md](./docs/AI_INTEGRATION_GUIDE.md)
- **Issues**: Use GitHub issues
- **Discussions**: Use GitHub discussions

---

## 🔮 Roadmap

### Completed ✅
- [x] Core library management
- [x] User authentication
- [x] Borrowing system
- [x] PDF management
- [x] External book search
- [x] AI recommendations
- [x] Smart search with NLP
- [x] AI chatbot
- [x] Reading analytics
- [x] Book summaries

### Future Enhancements 🚀
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Book reviews and ratings
- [ ] Reading groups/clubs
- [ ] Social features
- [ ] Advanced ML model training
- [ ] Voice interface
- [ ] Barcode scanning
- [ ] Multi-language support

---

## 📊 Project Stats

- **Code**: 5,800+ lines of TypeScript
- **Components**: 15+ React components
- **API Endpoints**: 30+ endpoints
- **AI Features**: 5 major features
- **Documentation**: 2,000+ lines

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">

**Built with ❤️ using React, TypeScript, and AI**

[⬆ Back to Top](#-ai-powered-library-management-system)

</div>

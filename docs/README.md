# 📚 Library Management System - Full Stack

A complete full-stack library management system with React frontend and Node.js/Express backend. Includes user authentication, book management, and borrowing system.

## 🎯 Features

### Frontend Features
- ✅ User login and registration
- ✅ Library portal with book browsing
- ✅ Book borrowing and returning
- ✅ Track borrowed books
- ✅ User profile management
- ✅ Responsive design

### Backend Features
- ✅ User authentication with JWT
- ✅ Password hashing with bcryptjs
- ✅ Book management API
- ✅ Book borrowing system
- ✅ Borrow history tracking
- ✅ Overdue detection
- ✅ JSON file database

## 📁 Project Structure

```
projects/
├── src/                          # React Frontend
│   ├── api/apiClient.ts         # Backend API integration
│   ├── components/              # Reusable components
│   ├── context/AuthContext.tsx  # Authentication state
│   ├── pages/                   # Page components
│   │   ├── LoginPage.tsx
│   │   └── LibraryPortal.tsx
│   └── styles/                  # CSS files
│
├── server/                       # Node.js/Express Backend
│   └── src/
│       ├── controllers/         # Business logic
│       ├── middleware/          # Authentication
│       ├── models/              # TypeScript types
│       ├── routes/              # API endpoints
│       └── database/            # Database operations
│
├── QUICKSTART.md                # Frontend quick start
├── FULLSTACK_GUIDE.md           # Complete integration guide
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- npm or yarn

### Setup Both Frontend & Backend

#### Terminal 1: Start Backend Server
```bash
cd server
npm install
npm run dev
```
Backend runs at: **http://localhost:5000**

#### Terminal 2: Start Frontend Server
```bash
npm install  # (if not already installed)
npm run dev
```
Frontend runs at: **http://localhost:5173**

## 🔐 Authentication

### User Registration
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### User Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Returns JWT token for subsequent requests.

## 📚 Book Management

### Get All Books
```bash
GET /api/books
```

### Search Books
```bash
GET /api/books/search?query=gatsby
```

### Get Available Books
```bash
GET /api/books/available
```

### Get Library Statistics
```bash
GET /api/books/stats
```

## 📖 Borrowing System

### Borrow Book
```bash
POST /api/borrows/borrow
Authorization: Bearer <token>
{
  "bookId": "1"
}
```

### Return Book
```bash
POST /api/borrows/return
Authorization: Bearer <token>
{
  "bookId": "1"
}
```

### Get Active Borrows
```bash
GET /api/borrows/active
Authorization: Bearer <token>
```

### Get Borrow History
```bash
GET /api/borrows/history
Authorization: Bearer <token>
```

## 💻 Technology Stack

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- CSS3 (Flexbox & Grid)
- Context API (state management)

### Backend
- Node.js
- Express.js
- TypeScript
- JWT (JSON Web Tokens)
- bcryptjs (password hashing)
- JSON file database

## 📖 Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
cd server
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🗄️ Database

The backend uses a JSON file-based database located at:
```
server/database/library.json
```

**Pre-populated with:**
- 6 classic books
- User accounts
- Borrow records

To reset the database, delete the file and restart the server.

## 🔧 Configuration

### Frontend Environment Variables
Create `.env` if needed:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend Environment Variables
Edit `server/.env`:
```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
DATABASE_PATH=./database/library.json
```

**Important:** Change `JWT_SECRET` in production!

## 📝 Sample Data

The system comes with 6 pre-loaded books:
1. The Great Gatsby - F. Scott Fitzgerald
2. To Kill a Mockingbird - Harper Lee
3. 1984 - George Orwell
4. Pride and Prejudice - Jane Austen
5. The Catcher in the Rye - J.D. Salinger
6. Brave New World - Aldous Huxley

## 🧪 Testing the API

### Using cURL

Register a user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Get books:
```bash
curl http://localhost:5000/api/books
```

Borrow a book (replace TOKEN with actual JWT):
```bash
curl -X POST http://localhost:5000/api/borrows/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"bookId": "1"}'
```

### Using Postman
1. Import the API endpoints shown above
2. Set Authorization header with Bearer token
3. Test each endpoint

## 🌐 Deployment

### Deploy Frontend
```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or similar
```

### Deploy Backend
```bash
cd server
npm run build
# Deploy to Heroku, Railway, DigitalOcean, or similar
```

## 📚 Documentation

- **Frontend Setup**: See [QUICKSTART.md](./QUICKSTART.md)
- **Backend Setup**: See [server/SETUP.md](./server/SETUP.md)
- **Backend API**: See [server/README.md](./server/README.md)
- **Full Stack Guide**: See [FULLSTACK_GUIDE.md](./FULLSTACK_GUIDE.md)

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check API_BASE_URL in src/api/apiClient.ts
- Verify CORS is enabled in server/src/server.ts

### Login fails
- Check backend logs for errors
- Verify database has users
- Check JWT_SECRET in server/.env

### Database not persisting
- Check file permissions
- Ensure server/database directory exists
- Restart server to reinitialize

## 🚀 Next Steps

1. **Test the application**: Register, login, borrow books
2. **Customize**: Modify books, add features
3. **Deploy**: Set up production environment
4. **Enhance**: Add ratings, wishlist, notifications

## 📋 Checklist

- [x] Frontend UI with React
- [x] Backend API with Express
- [x] User authentication
- [x] Book management
- [x] Borrowing system
- [x] Database integration
- [x] TypeScript support
- [x] Error handling
- [x] Documentation

## 📄 License

MIT License - Feel free to use and modify.

## 👨‍💻 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs in terminal
3. Check browser console for frontend errors
4. Refer to API documentation at http://localhost:5000/api

---

**Your full-stack library management system is ready!** 🎉

Start both servers and open http://localhost:5173 to begin.


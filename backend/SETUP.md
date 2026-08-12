# Backend Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Start the Server
```bash
npm run dev
```

The server will run at: **http://localhost:5000**

## API Testing

### Test with cURL

#### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the token from the response.

#### 3. Get All Books
```bash
curl http://localhost:5000/api/books
```

#### 4. Borrow a Book
```bash
curl -X POST http://localhost:5000/api/borrows/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "bookId": "1"
  }'
```

#### 5. Get Your Active Borrows
```bash
curl http://localhost:5000/api/borrows/active \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6. Return a Book
```bash
curl -X POST http://localhost:5000/api/borrows/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "bookId": "1"
  }'
```

## API Documentation

Visit the API documentation at:
```
http://localhost:5000/api
```

## Connecting Frontend to Backend

### Update API Base URL in Frontend

Edit `src/context/AuthContext.tsx`:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    // ... rest of logic
  }
};
```

## Database Location

The JSON database file is created at:
```
server/database/library.json
```

This file stores all users, books, and borrow records.

## Environment Variables

The `.env` file contains:

```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
DATABASE_PATH=./database/library.json
```

**Important**: Change `JWT_SECRET` in production!

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
PORT=3000 npm run dev
```

### Dependencies Installation Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
```

### TypeScript Errors
```bash
# Rebuild TypeScript
npm run build
```

## Project Structure

```
server/
├── src/
│   ├── controllers/        # Business logic
│   ├── middleware/         # Authentication middleware
│   ├── models/            # TypeScript types
│   ├── routes/            # API routes
│   ├── database/          # Database operations
│   └── server.ts          # Main server file
├── package.json
├── tsconfig.json
├── .env                   # Environment variables
└── README.md
```

## Complete Feature List

✅ User Registration with Password Hashing
✅ User Login with JWT Token
✅ Protected Routes
✅ Book Management (View, Search, Stats)
✅ Book Borrowing System
✅ Book Return with Overdue Detection
✅ Borrow History Tracking
✅ User Profile Management
✅ CORS Support
✅ Error Handling
✅ Request Logging

## Next Steps

1. **Connect Frontend**: Update API endpoints in the React frontend
2. **Test All Endpoints**: Use Postman or cURL
3. **Deploy**: Configure for production environment
4. **Database Migration**: Move to MongoDB if scaling needed
5. **Add Features**: Implement additional features as needed

## Available Endpoints Summary

**Authentication:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

**Books:**
- GET /api/books
- GET /api/books/:id
- GET /api/books/available
- GET /api/books/search
- GET /api/books/stats

**Borrowing:**
- POST /api/borrows/borrow
- POST /api/borrows/return
- GET /api/borrows/active
- GET /api/borrows/history

**Health:**
- GET /api/health
- GET /api

---

**Backend is ready for integration!** 🚀

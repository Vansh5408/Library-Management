# Full Stack Library Management System

Complete frontend and backend implementation for Library Management System.

## Project Overview

```
projects/
├── src/                    # React Frontend (Vite + TypeScript)
│   ├── api/               # API client for backend integration
│   ├── components/        # Reusable components
│   ├── context/           # State management
│   ├── pages/             # Page components
│   └── styles/            # CSS styling
│
└── server/                # Node.js/Express Backend
    └── src/
        ├── controllers/   # Business logic
        ├── middleware/    # Authentication, validation
        ├── models/        # TypeScript types
        ├── routes/        # API endpoints
        └── database/      # Database operations
```

## Quick Start (Both Frontend & Backend)

### Terminal 1: Start Backend Server
```bash
cd server
npm install
npm run dev
```
Backend runs at: `http://localhost:5000`

### Terminal 2: Start Frontend Server
```bash
cd ../
npm run dev
```
Frontend runs at: `http://localhost:5173`

## Frontend Features

### ✅ Login Page
- Email/Password authentication
- Form validation
- Error handling
- Connects to backend authentication

### ✅ Library Portal
- View all books
- Search functionality
- Borrow/Return books
- Track borrowed books
- User profile
- Logout

## Backend API

### Authentication Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile (requires token)

### Book Endpoints
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get single book
- `GET /api/books/available` - Get available books
- `GET /api/books/search?query=...` - Search books
- `GET /api/books/stats` - Get library statistics

### Borrowing Endpoints
- `POST /api/borrows/borrow` - Borrow a book
- `POST /api/borrows/return` - Return a book
- `GET /api/borrows/active` - Get active borrows
- `GET /api/borrows/history` - Get borrow history

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS3 (Flexbox & Grid)
- Context API (State Management)

### Backend
- Node.js
- Express.js
- TypeScript
- JWT (Authentication)
- bcryptjs (Password Hashing)
- JSON File Database

## Integration Guide

### 1. Update Frontend API Client

The API client is already configured in `src/api/apiClient.ts`

### 2. Update Authentication Context

Update `src/context/AuthContext.tsx` to use backend:

```typescript
import { loginUser, registerUser } from '../api/apiClient';

export const login = async (email: string, password: string) => {
  try {
    const response = await loginUser(email, password);
    const mockUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      name: response.data.user.name,
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', response.data.token);
  } catch (error) {
    throw error;
  }
};
```

### 3. Test Integration

1. Start both servers (frontend and backend)
2. Open frontend at `http://localhost:5173`
3. Try to register or login
4. Check browser console for any errors
5. Verify API calls in Network tab

## Features Implementation

### User Registration
1. User fills registration form
2. Frontend calls `POST /api/auth/register`
3. Backend validates and creates user
4. Token returned and stored in localStorage
5. User automatically logged in

### User Login
1. User enters email and password
2. Frontend calls `POST /api/auth/login`
3. Backend verifies credentials
4. JWT token returned
5. User redirected to library portal

### Book Borrowing
1. User clicks "Borrow Book"
2. Frontend calls `POST /api/borrows/borrow` with token
3. Backend updates book availability
4. Borrow record created
5. Due date calculated (14 days)
6. UI updated with borrowed book

### Book Returning
1. User clicks "Return" on borrowed book
2. Frontend calls `POST /api/borrows/return` with token
3. Backend checks for overdue
4. Book availability updated
5. Borrow record marked as returned/overdue
6. UI updated

## Database Structure

### JSON Database (server/database/library.json)

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "password": "hashed_password",
      "name": "John Doe",
      "createdAt": "2024-01-19T10:00:00Z",
      "borrowHistory": ["bookId1", "bookId2"]
    }
  ],
  "books": [
    {
      "id": "1",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0743273565",
      "description": "...",
      "available": true,
      "totalCopies": 3,
      "availableCopies": 3,
      "borrowedBy": [],
      "createdAt": "2024-01-19T10:00:00Z"
    }
  ],
  "borrowRecords": [
    {
      "id": "uuid",
      "userId": "uuid",
      "bookId": "1",
      "borrowedAt": "2024-01-19T10:00:00Z",
      "dueDate": "2024-02-02T10:00:00Z",
      "returnedAt": null,
      "status": "active"
    }
  ]
}
```

## Deployment

### Frontend Deployment (Vercel, Netlify, etc.)

```bash
cd projects
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Heroku, Railway, etc.)

```bash
cd server
npm run build
npm start
```

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000
```

### Backend (.env)
```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
DATABASE_PATH=./database/library.json
```

## Testing

### Test with API Documentation
Visit: `http://localhost:5000/api`

### Test with cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Books
curl http://localhost:5000/api/books

# Borrow Book (replace TOKEN with actual token)
curl -X POST http://localhost:5000/api/borrows/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"bookId":"1"}'
```

## Troubleshooting

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check CORS configuration in `server/src/server.ts`
- Verify API_BASE_URL in `src/api/apiClient.ts`

### Login Not Working
- Check backend logs for errors
- Verify JWT_SECRET in .env
- Check browser console for error messages

### Book Borrowing Fails
- Ensure user is authenticated (token present)
- Check if book exists and is available
- Verify Authorization header format

### Database Not Persisting
- Check file permissions on database directory
- Ensure database path is correct
- Verify write access to file system

## Project Files

### Frontend Files
- `src/api/apiClient.ts` - API integration
- `src/context/AuthContext.tsx` - Authentication state
- `src/pages/LoginPage.tsx` - Login UI
- `src/pages/LibraryPortal.tsx` - Main application UI

### Backend Files
- `server/src/server.ts` - Main server
- `server/src/controllers/authController.ts` - Auth logic
- `server/src/controllers/bookController.ts` - Book logic
- `server/src/controllers/borrowController.ts` - Borrow logic
- `server/src/middleware/auth.ts` - Authentication middleware
- `server/src/database/db.ts` - Database operations

## Future Enhancements

### Backend
- [ ] Migrate to MongoDB
- [ ] Add advanced search filters
- [ ] Implement pagination
- [ ] Add email notifications
- [ ] Create admin dashboard API
- [ ] Add rating and review system
- [ ] Implement wishlist feature

### Frontend
- [ ] Add book search filters
- [ ] Implement pagination
- [ ] Add user settings page
- [ ] Create admin panel
- [ ] Add book recommendations
- [ ] Implement dark mode
- [ ] Add notifications UI

### DevOps
- [ ] Set up CI/CD pipeline
- [ ] Docker containerization
- [ ] Database backup strategy
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Logging system

## Support & Documentation

- Frontend README: See `/README.md`
- Backend README: See `/server/README.md`
- Frontend Setup: See `/QUICKSTART.md`
- Backend Setup: See `/server/SETUP.md`

## License

MIT License - Feel free to use and modify for your projects.

---

**Your full-stack library management system is ready!** 🎉

# Library Management System - Enhanced Version

This is an **intermediate-level full-stack** Library Management System with real authentication, role-based access control, and comprehensive book management features.

## 🎯 Features Implemented

### ✅ Real Authentication (STEP 1)
- **Signup Page**: New users can create accounts with email, password, and name
- **Login Page**: Secure login with email and password
- **Password Hashing**: Using bcryptjs for secure password storage (SALT_ROUNDS: 10)
- **JWT Tokens**: 7-day session tokens for authenticated requests
- **Token Storage**: Tokens stored in localStorage for persistence
- **Redirect Logic**:
  - Unauthenticated users → Login/Signup pages
  - Authenticated users → Dashboard (Admin or User based on role)

### ✅ User Roles & Permissions (STEP 2)

#### 👤 User (Default Role)
- View all books in the library
- Search books by title or author
- See available book copies
- Borrow available books
- Return borrowed books
- View "My Borrowed Books" with due dates
- Track borrowing history

#### 👨‍💼 Admin (Special Role)
- **Book Management**:
  - ➕ Add new books to library
  - ✏️ Edit existing book details
  - 🗑️ Delete books from library
  - 📊 View book statistics
- **Borrowing Management**:
  - 📋 View ALL borrow records across users
  - 📈 Track who borrowed what and when
  - Monitor return status (active/returned/overdue)

## 🛠️ Technical Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (TypeScript)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Database**: JSON file (library.json)
- **Middleware**: Custom auth middleware for token verification & role checking

### Frontend
- **Framework**: React 19.2
- **Routing**: React Router v6
- **Styling**: CSS3 with responsive design
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: React Context API

## 📁 Project Structure

```
library management/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express server setup
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Login, signup, profile
│   │   │   ├── bookController.ts     # Book CRUD + admin endpoints
│   │   │   └── borrowController.ts   # Borrow/return + admin endpoints
│   │   ├── database/
│   │   │   ├── db.ts                 # Database operations
│   │   │   └── library.json          # Data storage
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT verification + role authorization
│   │   ├── models/
│   │   │   └── types.ts              # TypeScript interfaces & types
│   │   └── routes/
│   │       ├── authRoutes.ts         # Auth endpoints
│   │       ├── bookRoutes.ts         # Book endpoints (with admin routes)
│   │       └── borrowRoutes.ts       # Borrow endpoints (with admin routes)
│   ├── package.json                   # Backend dependencies
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx                    # Main app with routing
    │   ├── api/
    │   │   └── apiClient.ts           # API calls & endpoints
    │   ├── components/
    │   │   ├── AdminDashboard.tsx     # Admin main dashboard
    │   │   ├── AdminBooks.tsx         # Book management interface
    │   │   ├── UserDashboard.tsx      # User main dashboard
    │   │   └── ProtectedRoute.tsx     # Auth guard component
    │   ├── context/
    │   │   └── AuthContext.tsx        # Auth state + signup/login
    │   ├── pages/
    │   │   ├── LoginPage.tsx          # Login form
    │   │   ├── SignupPage.tsx         # Signup form (NEW)
    │   │   └── LibraryPortal.tsx      # Main portal (role-based)
    │   └── styles/
    │       ├── App.css
    │       ├── LoginPage.css
    │       ├── LibraryPortal.css
    │       ├── UserDashboard.css      # User dashboard styles
    │       ├── AdminDashboard.css     # Admin dashboard styles
    │       └── AdminBooks.css         # Book management styles
    └── package.json
```

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
npm install
npm run dev  # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires token)

### Books (Public)
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get single book
- `GET /api/books/available` - Get available books
- `GET /api/books/search?query=...` - Search books
- `GET /api/books/stats` - Get library statistics

### Books (Admin Only)
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Borrowing (Authenticated)
- `POST /api/borrows/borrow` - Borrow a book
- `POST /api/borrows/return` - Return a book
- `GET /api/borrows/active` - Get user's active borrows
- `GET /api/borrows/history` - Get user's borrow history

### Borrowing (Admin Only)
- `GET /api/borrows/admin/all` - Get all borrow records

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Authentication**: 7-day expiring tokens
- **Role-Based Access Control**: Middleware-level authorization
- **Token Validation**: Every protected route verifies JWT
- **Role Checking**: Admin routes validate user role

## 📝 Test Credentials

Since this uses a JSON database, you can:
1. Create a new account during signup
2. Or manually add users to `backend/src/database/library.json`

Example admin user:
```json
{
  "id": "admin-id",
  "email": "admin@library.com",
  "password": "(bcrypt hash here)",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2026-01-29T00:00:00.000Z",
  "borrowHistory": []
}
```

## 🎨 UI/UX Enhancements

- **Modern Design**: Gradient backgrounds, smooth transitions
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Role-Based UI**: Different interface for admin vs user
- **Real-time Updates**: UI refreshes after actions
- **Status Indicators**: Visual badges for book availability
- **Error Handling**: Clear error messages for users
- **Loading States**: Feedback during API calls

## 🔄 User Workflows

### User Registration & Login
```
1. Visit /signup → Fill form → Create account
2. Redirected to / → LibraryPortal (User Dashboard)
```

### User Borrowing Books
```
1. Browse available books
2. Search for specific books
3. Click "Borrow Book" on any available book
4. View in "My Borrowed Books" section
5. See due date and days remaining
6. Click "Return Now" when done
```

### Admin Book Management
```
1. Admin login → Admin Dashboard
2. Click "Manage Books" tab
3. Click "+ Add New Book"
4. Fill form (Title, Author, ISBN, Copies, Description)
5. Books appear in table with Edit/Delete options
```

### Admin Viewing Borrow Records
```
1. Admin Dashboard → "Borrow Records" tab
2. See all user borrowings across library
3. View user info, book info, dates, and status
4. Status: Active (borrowed), Returned, or Overdue
```

## 📊 Database Schema

### Users
- id (UUID)
- email (unique)
- password (bcrypt hash)
- name
- **role** ('admin' | 'user')
- createdAt
- borrowHistory (array of book IDs)

### Books
- id (UUID)
- title
- author
- isbn (unique)
- description
- available (boolean)
- totalCopies
- availableCopies
- borrowedBy (array of records)
- createdAt

### Borrow Records
- id (UUID)
- userId
- bookId
- borrowedAt
- dueDate
- returnedAt (optional)
- **status** ('active' | 'returned' | 'overdue')

## ✨ Next Steps for Further Enhancement

1. **Database**: Migrate to MongoDB or PostgreSQL
2. **Email Notifications**: Send due date reminders
3. **Fine System**: Calculate late fees for overdue books
4. **User Dashboard**: Personal borrowing statistics
5. **Book Reviews**: Users can review and rate books
6. **Advanced Search**: Filters by genre, publication year
7. **Wishlist**: Users can save books to read later
8. **Admin Analytics**: Charts showing borrowing trends
9. **Two-Factor Authentication**: Enhanced security
10. **Image Upload**: Book cover images

## 📄 License

MIT

---

**Status**: ✅ Complete - Intermediate Level Project  
**Last Updated**: January 29, 2026

# Library Management System - Backend API

A complete Node.js/Express backend for the Library Management System with JWT authentication, user management, and book borrowing functionality.

## Features

### 🔐 Authentication
- User registration with email and password
- Login with JWT token generation
- Password hashing with bcryptjs
- Token-based authorization
- 7-day token expiry

### 📚 Book Management
- View all books in the library
- Search books by title, author, or ISBN
- Get book availability status
- View library statistics
- Track book copies and borrowing

### 📖 Book Borrowing System
- Borrow books with automatic due date calculation
- Return borrowed books
- Track active borrows
- View complete borrow history
- Automatic overdue detection
- 14-day borrowing duration

## Project Structure

```
server/
├── src/
│   ├── controllers/
│   │   ├── authController.ts      # Authentication logic
│   │   ├── bookController.ts      # Book management
│   │   └── borrowController.ts    # Borrowing operations
│   ├── middleware/
│   │   └── auth.ts                # JWT authentication middleware
│   ├── models/
│   │   └── types.ts               # TypeScript types and interfaces
│   ├── routes/
│   │   ├── authRoutes.ts          # Auth endpoints
│   │   ├── bookRoutes.ts          # Book endpoints
│   │   └── borrowRoutes.ts        # Borrow endpoints
│   ├── database/
│   │   └── db.ts                  # Database operations (JSON file)
│   └── server.ts                  # Main server file
├── package.json
├── tsconfig.json
├── .env
└── .gitignore
```

## API Endpoints

### Authentication (`/api/auth`)

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "borrowHistory": ["bookId1", "bookId2"]
  }
}
```

### Books (`/api/books`)

#### Get All Books
```
GET /api/books

Response:
{
  "success": true,
  "message": "Books retrieved successfully",
  "data": [
    {
      "id": "1",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0743273565",
      "description": "A classic novel set in the Jazz Age.",
      "available": true,
      "totalCopies": 3,
      "availableCopies": 3,
      "borrowedBy": [],
      "createdAt": "2024-01-19T10:00:00Z"
    }
  ]
}
```

#### Get Single Book
```
GET /api/books/:id

Response:
{
  "success": true,
  "message": "Book retrieved successfully",
  "data": { ...book object... }
}
```

#### Get Available Books
```
GET /api/books/available

Returns only books with availableCopies > 0
```

#### Search Books
```
GET /api/books/search?query=gatsby

Searches in: title, author, isbn
```

#### Get Library Statistics
```
GET /api/books/stats

Response:
{
  "success": true,
  "message": "Book statistics retrieved",
  "data": {
    "totalBooks": 6,
    "totalCopies": 15,
    "availableCopies": 12,
    "borrowedCopies": 3
  }
}
```

### Borrowing (`/api/borrows`)

#### Borrow Book
```
POST /api/borrows/borrow
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "1"
}

Response:
{
  "success": true,
  "message": "Book borrowed successfully",
  "data": {
    "borrowRecord": {
      "id": "uuid",
      "userId": "uuid",
      "bookId": "1",
      "borrowedAt": "2024-01-19T10:00:00Z",
      "dueDate": "2024-02-02T10:00:00Z",
      "status": "active"
    },
    "book": { ...updated book... }
  }
}
```

#### Return Book
```
POST /api/borrows/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "1"
}

Response:
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "borrowRecord": {
      "id": "uuid",
      "userId": "uuid",
      "bookId": "1",
      "borrowedAt": "2024-01-19T10:00:00Z",
      "dueDate": "2024-02-02T10:00:00Z",
      "returnedAt": "2024-01-25T10:00:00Z",
      "status": "returned"
    },
    "isOverdue": false
  }
}
```

#### Get Active Borrows
```
GET /api/borrows/active
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User borrow records retrieved",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "bookId": "1",
      "borrowedAt": "2024-01-19T10:00:00Z",
      "dueDate": "2024-02-02T10:00:00Z",
      "status": "active",
      "book": { ...book object... },
      "daysLeft": 14
    }
  ]
}
```

#### Get Borrow History
```
GET /api/borrows/history
Authorization: Bearer <token>

Returns all borrow records (active, returned, overdue)
```

## Installation & Setup

### Prerequisites
- Node.js v14 or higher
- npm or yarn

### Installation Steps

1. **Navigate to server directory**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Edit .env file
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
NODE_ENV=development
```

4. **Start the server**
```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Available Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run lint     # Run ESLint
```

## Database

The backend uses a JSON file-based database (`database/library.json`) for simplicity. The database includes:

- **users**: User accounts with hashed passwords
- **books**: Library book catalog with availability status
- **borrowRecords**: All borrowing transactions

### Sample Data

The database comes pre-populated with:
- 6 classic books
- Sample availability data
- Complete book information

## Authentication

### JWT Token Usage

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Token Generation

Tokens are generated on successful login/registration and expire after 7 days.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Detailed error description"
}
```

## Features Explained

### User Registration
- Validates email format and password strength (minimum 6 characters)
- Hashes password using bcryptjs
- Returns JWT token for immediate login
- Prevents duplicate email registrations

### Book Management
- RESTful endpoints for book information
- Search functionality across multiple fields
- Real-time availability tracking
- Library statistics calculation

### Borrowing System
- 14-day borrowing period
- Automatic overdue detection
- Prevents borrowing the same book twice
- Tracks complete borrowing history
- Updates book availability in real-time

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  createdAt: string;
  borrowHistory: string[];
}
```

### Book
```typescript
{
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  borrowedBy: Array<{
    userId: string;
    borrowedAt: string;
    dueDate: string;
  }>;
  createdAt: string;
}
```

### BorrowRecord
```typescript
{
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
}
```

## Technology Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration
- **uuid** - Unique ID generation

## Next Steps

### Database Migration
- Migrate from JSON to MongoDB
- Set up Mongoose schemas
- Implement database migrations

### Enhanced Features
- Book ratings and reviews
- Wishlist functionality
- Email notifications
- Admin panel for book management
- User role management (admin, librarian, member)

### Security Enhancements
- Rate limiting
- Input validation with joi
- HTTPS/SSL configuration
- Refresh token mechanism
- Two-factor authentication

### Scalability
- Add Redis caching
- Implement pagination
- Add request logging
- Set up error tracking
- Performance monitoring

## License

MIT License

## Support

For issues or questions, please refer to the main project README.

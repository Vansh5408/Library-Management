# 🏗️ Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ LoginPage    │         │ SignupPage   │                 │
│  │ (Public)     │         │ (Public)     │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         └────────────┬───────────┘                          │
│                      │                                      │
│         ┌────────────▼──────────────┐                      │
│         │    AuthContext + JWT       │                      │
│         │ (Redux-like state mgmt)    │                      │
│         └────────────┬───────────────┘                      │
│                      │                                      │
│      ┌───────────────┴───────────────┐                     │
│      │                               │                     │
│  ┌───▼──────────────┐      ┌────────▼─────────┐            │
│  │ Protected Route  │      │ LibraryPortal     │            │
│  │ (Auth Guard)     │      │ (Role Router)     │            │
│  └──────────────────┘      └────────┬─────────┘            │
│                                     │                      │
│         ┌───────────────────────────┼──────────────────┐   │
│         │                           │                  │   │
│    ┌────▼──────────────┐    ┌──────▼──────────────┐   │   │
│    │  UserDashboard    │    │  AdminDashboard     │   │   │
│    │  ┌──────────────┐ │    │  ┌──────────────┐   │   │   │
│    │  │ Browse Books │ │    │  │ Manage Books │   │   │   │
│    │  │ Search Books │ │    │  │ View Borrows │   │   │   │
│    │  │ My Borrows   │ │    │  └──────────────┘   │   │   │
│    │  └──────────────┘ │    │  ┌──────────────┐   │   │   │
│    └────┬───────────────┘    │  │ AdminBooks   │   │   │   │
│         │                    │  │ AdminDashbrd │   │   │   │
│         └────────────┬───────┘  └──────────────┘   │   │   │
│                      │                             │   │   │
│         ┌────────────▼────────────┐               │   │   │
│         │    API Client            │◄──────────────┘   │   │
│         │ (fetch + auth headers)   │                  │   │
│         └────────────┬─────────────┘                  │   │
│                      │                               │   │
└──────────────────────┼───────────────────────────────┼───┘
                       │ HTTP + JWT                    │
                       │ Authorization: Bearer         │
                       │                               │
┌──────────────────────▼───────────────────────────────▼───┐
│              BACKEND (Express + TypeScript)               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Request → Middleware Pipeline            │ │
│  │  1. CORS                                            │ │
│  │  2. JSON Parser                                     │ │
│  │  3. Logger                                          │ │
│  │  4. Authentication (optional)                       │ │
│  │  5. Authorization (role check)                      │ │
│  └────────────────────────────┬───────────────────────┘ │
│                               │                          │
│  ┌────────────────────────────▼───────────────────────┐ │
│  │              ROUTES                                │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ /api/auth                                    │ │ │
│  │  │  POST /register (public)                     │ │ │
│  │  │  POST /login (public)                        │ │ │
│  │  │  GET /profile (authenticated)                │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ /api/books                                   │ │ │
│  │  │  GET / (public)                              │ │ │
│  │  │  GET /:id (public)                           │ │ │
│  │  │  POST / (admin only)  ⭐ NEW                 │ │ │
│  │  │  PUT /:id (admin only)  ⭐ NEW               │ │ │
│  │  │  DELETE /:id (admin only)  ⭐ NEW            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ /api/borrows                                 │ │ │
│  │  │  POST /borrow (authenticated)                │ │ │
│  │  │  POST /return (authenticated)                │ │ │
│  │  │  GET /active (authenticated)                 │ │ │
│  │  │  GET /history (authenticated)                │ │ │
│  │  │  GET /admin/all (admin only)  ⭐ NEW         │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────┬──────────────────────┘ │
│                               │                        │
│  ┌────────────────────────────▼──────────────────────┐ │
│  │           CONTROLLERS                              │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ authController.ts                           │ │ │
│  │  │  - register()                                │ │ │
│  │  │  - login() + JWT generation                 │ │ │
│  │  │  - getProfile()                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ bookController.ts                           │ │ │
│  │  │  - getBooks()                                │ │ │
│  │  │  - createBook()  ⭐ NEW Admin only           │ │ │
│  │  │  - editBook()  ⭐ NEW Admin only             │ │ │
│  │  │  - removeBook()  ⭐ NEW Admin only           │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ borrowController.ts                         │ │ │
│  │  │  - borrowBook()                              │ │ │
│  │  │  - returnBook()                              │ │ │
│  │  │  - getAllBorrows()  ⭐ NEW Admin only        │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────┬──────────────────────┘ │
│                               │                        │
│  ┌────────────────────────────▼──────────────────────┐ │
│  │         DATABASE OPERATIONS (db.ts)               │ │
│  │  - getAllUsers(), getUserById(), addUser()       │ │
│  │  - getAllBooks(), getBookById(), addBook()       │ │
│  │  - updateBook(), deleteBook() ⭐ NEW             │ │
│  │  - addBorrowRecord(), getBorrowRecords()        │ │
│  │  - getAllBorrowRecords() ⭐ NEW                  │ │
│  └────────────────────────────┬──────────────────────┘ │
│                               │                        │
│  ┌────────────────────────────▼──────────────────────┐ │
│  │      PERSISTENT STORAGE (library.json)            │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ {                                            │ │ │
│  │  │   "users": [                                 │ │ │
│  │  │     {                                        │ │ │
│  │  │       "id": "uuid",                          │ │ │
│  │  │       "email": "user@example.com",           │ │ │
│  │  │       "password": "$2a$10$...",              │ │ │
│  │  │       "name": "User Name",                   │ │ │
│  │  │       "role": "user|admin" ⭐ NEW            │ │ │
│  │  │     }                                        │ │ │
│  │  │   ],                                         │ │ │
│  │  │   "books": [...],                            │ │ │
│  │  │   "borrowRecords": [...]                     │ │ │
│  │  │ }                                            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Registration Flow
```
User Input (Signup Form)
    ↓
Frontend validates (email format, password length)
    ↓
POST /api/auth/register {email, password, name}
    ↓
Backend validates again
    ↓
Check if email exists
    ↓
Hash password with bcryptjs
    ↓
Create user with role: "user" (default)
    ↓
Save to library.json
    ↓
Generate JWT token (7-day expiry)
    ↓
Return token + user object
    ↓
Frontend stores token + user in:
  - localStorage
  - AuthContext
    ↓
Redirect to LibraryPortal
    ↓
Render UserDashboard (based on role)
```

### User Login Flow
```
User Input (Email + Password)
    ↓
Frontend validates
    ↓
POST /api/auth/login {email, password}
    ↓
Backend finds user by email
    ↓
Compare password with bcrypt hash
    ↓
If password matches:
    - Generate JWT with userId, email, role
    - Return token + user
    ↓
Frontend stores in localStorage & AuthContext
    ↓
ProtectedRoute checks isAuthenticated
    ↓
Route to appropriate dashboard (User or Admin)
    ↓
Dashboard fetches data (books, borrows)
    ↓
Display role-specific UI
```

### Book Borrowing Flow
```
User clicks "Borrow Book"
    ↓
Frontend sends: POST /api/borrows/borrow
  - bookId in request body
  - JWT in Authorization header
    ↓
Backend middleware:
  - Verifies JWT token
  - Extracts userId
  - Validates not expired
    ↓
borrowController.borrowBook():
  - Check book exists and has available copies
  - Check user hasn't already borrowed this book
  - Create BorrowRecord
  - Decrease book.availableCopies
  - Update user.borrowHistory
    ↓
Save to library.json
    ↓
Return success response with:
  - borrowRecord
  - updated book
    ↓
Frontend updates state
    ↓
UI refreshes:
  - Book moves to "My Borrowed Books"
  - Button changes to "Return Now"
  - Availability count decreases
```

### Admin Book Management Flow
```
Admin clicks "+ Add New Book"
    ↓
Form appears with fields:
  - Title, Author, ISBN, Copies, Description
    ↓
Admin fills form & clicks "Add Book"
    ↓
Frontend validates all fields
    ↓
POST /api/books {title, author, isbn, ...}
  - JWT token in Authorization header
    ↓
Backend middleware:
  - Verifies JWT
  - Checks authorizeRole('admin')
  - If not admin → 403 Forbidden
    ↓
bookController.createBook():
  - Validate all fields present
  - Check ISBN not duplicate
  - Create Book object with:
    - id (UUID)
    - available = totalCopies > 0
    - borrowedBy = []
    - availableCopies = totalCopies
    ↓
Save to library.json
    ↓
Return new book object
    ↓
Frontend:
  - Closes form
  - Refreshes book list
  - Shows success message
  - New book appears in table
```

### Admin View All Borrows Flow
```
Admin clicks "Borrow Records" tab
    ↓
GET /api/borrows/admin/all
  - JWT token sent
    ↓
Backend:
  - Verifies JWT
  - Checks authorizeRole('admin')
    ↓
borrowController.getAllBorrows():
  - Gets all borrow records
  - For each record:
    - Joins with book data
    - Joins with user data
  - Returns enriched records
    ↓
Frontend displays table:
  - User name & email
  - Book title & author
  - Borrow date
  - Due date
  - Status badge
    ↓
User can see:
  - Who borrowed what
  - When they borrowed it
  - When it's due back
  - Current status
```

## Authentication & Authorization

```
┌─────────────────────────────────────────────────────────┐
│  AUTHENTICATION (Who are you?)                          │
│                                                         │
│  JWT Token Structure:                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ HEADER          PAYLOAD           SIGNATURE     │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ {alg: "HS256",  {userId: "...",   HMACSHA256(  │  │
│  │  typ: "JWT"}    email: "...",     header.      │  │
│  │                 role: "user|admin",            │  │
│  │                 iat: ...,         payload,     │  │
│  │                 exp: ...}         secret)      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Verification Process:                                │
│  1. Extract token from Authorization header           │
│  2. Decode token                                      │
│  3. Check signature with JWT_SECRET                   │
│  4. Check if expired (exp < now)                      │
│  5. If valid → Attach user data to req.user          │
│  6. If invalid → Return 401/403 error                │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AUTHORIZATION (What can you do?)                       │
│                                                         │
│  Role-Based Access Control (RBAC):                     │
│                                                         │
│  Route Pattern:                                        │
│  POST /api/books                                       │
│    ↓                                                    │
│  authenticateToken (verify JWT)                       │
│    ↓                                                    │
│  authorizeRole('admin') (check role)                  │
│    ↓                                                    │
│  if (user.role === 'admin')                           │
│    → Proceed to controller                            │
│  else                                                  │
│    → Return 403 Forbidden                             │
│                                                         │
│  Middleware Stack:                                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Request                                         │  │
│  │   ↓                                              │  │
│  │ authenticateToken                               │  │
│  │ (decode JWT, check signature & expiry)         │  │
│  │   ↓                                              │  │
│  │ req.user = {userId, email, role}               │  │
│  │   ↓                                              │  │
│  │ authorizeRole('admin')                          │  │
│  │ (check if req.user.role in allowedRoles)      │  │
│  │   ↓                                              │  │
│  │ Controller (bookController.createBook)         │  │
│  │   ↓                                              │  │
│  │ Response                                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Frontend Component Hierarchy

```
App
├── Router
│   └── AuthProvider
│       └── AppContent
│           └── Routes
│               ├── /login → LoginPage
│               ├── /signup → SignupPage
│               └── / → ProtectedRoute
│                   └── LibraryPortal
│                       ├── header (user info, logout)
│                       └── portal-main
│                           ├── if (isAdmin)
│                           │   └── AdminDashboard
│                           │       ├── nav-btn "Manage Books"
│                           │       │   └── AdminBooks
│                           │       │       ├── book-form
│                           │       │       └── books-table
│                           │       └── nav-btn "Borrow Records"
│                           │           └── records-table
│                           └── if (!isAdmin)
│                               └── UserDashboard
│                                   ├── dashboard-stats
│                                   ├── books-section
│                                   │   ├── search-input
│                                   │   └── books-grid
│                                   │       └── book-card (borrow/return)
│                                   └── borrowed-section
│                                       └── borrowed-grid
│                                           └── borrowed-card (return)
```

## Security Architecture

```
┌───────────────────────────────────────────────────────┐
│                 SECURITY LAYERS                       │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Layer 1: PASSWORD SECURITY                          │
│  ├─ Input: Plain password from user                 │
│  ├─ Hashing: bcryptjs (10 salt rounds)              │
│  ├─ Storage: Hash only (never plaintext)            │
│  └─ Verification: bcrypt.compare()                  │
│                                                       │
│ Layer 2: SESSION SECURITY                           │
│  ├─ Token: JWT with 7-day expiry                    │
│  ├─ Payload: {userId, email, role}                 │
│  ├─ Secret: JWT_SECRET from environment            │
│  ├─ Signature: HMACSHA256                           │
│  └─ Storage: localStorage (client)                  │
│                                                       │
│ Layer 3: TRANSPORT SECURITY                         │
│  ├─ Token transmission: Authorization header       │
│  ├─ Format: "Bearer <JWT_TOKEN>"                    │
│  ├─ Protocol: HTTPS (recommended in production)     │
│  └─ CORS: Restricted to frontend domain            │
│                                                       │
│ Layer 4: ROUTE SECURITY                             │
│  ├─ Public routes: No authentication needed         │
│  ├─ Protected routes: JWT verification              │
│  ├─ Admin routes: JWT + role check                  │
│  └─ Error: 401 (no auth) / 403 (wrong role)        │
│                                                       │
│ Layer 5: DATA SECURITY                              │
│  ├─ Input validation: Required fields               │
│  ├─ Type checking: TypeScript                       │
│  ├─ Database: File-based (for demo)                 │
│  └─ Update: Only authorized users                   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

Generated: January 29, 2026

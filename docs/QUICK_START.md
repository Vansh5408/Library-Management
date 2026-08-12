# Quick Start Guide - Enhanced Library Management System

## 🎯 What's New

This enhanced version transforms your basic project into an **intermediate-level full-stack application** with:
- ✅ Real authentication (Signup + Login with password hashing)
- ✅ Role-based access (Admin vs User)
- ✅ Book management (Add, Edit, Delete books)
- ✅ User dashboard (Browse, borrow, return books)
- ✅ Admin dashboard (Manage books & view all borrowings)

## 🚀 Installation & Setup

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment

**Backend** - Create/Update `.env` in `backend/`:
```
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-here
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on: `http://localhost:5173`

## 📝 First Time Users

### Create Your First Account
1. Open http://localhost:5173
2. Click "Sign up here"
3. Fill in: Name, Email, Password
4. Click "Create Account"
5. ✅ You're logged in as a **User**!

### Create an Admin Account (Manually)

Edit `backend/src/database/library.json` and add:

```json
{
  "id": "admin-uuid-here",
  "email": "admin@library.com",
  "password": "$2a$10$...(bcrypt hash)...",
  "name": "Library Admin",
  "role": "admin",
  "createdAt": "2026-01-29T00:00:00.000Z",
  "borrowHistory": []
}
```

Then login with admin@library.com and your password to access admin features.

## 👤 User Features

Once logged in as a regular user:

### 📖 Browse Books
- View all books in the library
- See how many copies are available
- Search by title or author

### 📚 Borrow Books
- Click "Borrow Book" on any available book
- Book appears in "My Borrowed Books" section
- See due date (14 days from borrow date)

### ↩️ Return Books
- Click "Return Now" in your borrowed books
- Book returns to library inventory

### 📋 Track Borrowings
- See all your active borrowed books
- Check days remaining before due date
- View borrowing dates and deadlines

## 👨‍💼 Admin Features

Once logged in as an admin:

### 📖 Manage Books

**Add New Book:**
1. Click "📖 Manage Books" tab
2. Click "+ Add New Book"
3. Fill in all fields:
   - Title
   - Author
   - ISBN
   - Total Copies
   - Description
4. Click "Add Book"

**Edit Existing Book:**
1. Find the book in the table
2. Click "Edit" button
3. Update any fields
4. Click "Update Book"

**Delete Book:**
1. Find the book in the table
2. Click "Delete" button
3. Confirm deletion

### 📋 View Borrow Records

**Track All Borrowings:**
1. Click "📋 Borrow Records" tab
2. See all books borrowed by all users
3. View borrower info, book info, dates
4. Check status: Active, Returned, or Overdue

## 🗂️ Project Structure (Enhanced)

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts    ← Login/Signup logic
│   │   ├── bookController.ts    ← Book management
│   │   └── borrowController.ts  ← Borrow/Return + Admin view
│   ├── middleware/
│   │   └── auth.ts              ← Role-based access control ⭐ NEW
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── bookRoutes.ts        ← Admin endpoints added ⭐
│   │   └── borrowRoutes.ts      ← Admin endpoints added ⭐
│   └── database/
│       └── library.json         ← Now includes users with roles ⭐

frontend/
├── src/
│   ├── pages/
│   │   ├── SignupPage.tsx       ← NEW signup form ⭐
│   │   ├── LoginPage.tsx        ← Updated with signup link
│   │   └── LibraryPortal.tsx    ← Role-based routing ⭐
│   ├── components/
│   │   ├── AdminDashboard.tsx   ← NEW admin interface ⭐
│   │   ├── AdminBooks.tsx       ← NEW book management ⭐
│   │   └── UserDashboard.tsx    ← NEW user dashboard ⭐
│   ├── context/
│   │   └── AuthContext.tsx      ← Updated with roles ⭐
│   └── styles/
│       ├── AdminDashboard.css   ← NEW ⭐
│       ├── AdminBooks.css       ← NEW ⭐
│       └── UserDashboard.css    ← NEW ⭐
```

## 🔐 Security

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Tokens**: Secure 7-day sessions
- **Role Authorization**: Middleware prevents unauthorized access
- **Protected Routes**: Frontend validates user role

## 🐛 Troubleshooting

### "Can't connect to backend"
- Ensure backend is running on port 5000
- Check CORS settings in `backend/src/server.ts`
- Verify frontend URL in backend `.env`

### "Login fails with correct credentials"
- Ensure password is at least 6 characters
- Check that user exists in `library.json`
- Clear browser localStorage and try again

### "Admin features not available"
- Confirm your account has `"role": "admin"` in `library.json`
- Logout and login again
- Check browser console for errors

### "Books won't borrow"
- Ensure book has `availableCopies > 0`
- Check that you're logged in (token in localStorage)
- Try refreshing the page

## 📚 API Documentation

All API endpoints require authentication (except auth routes):

**Request Format:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/books
```

**Response Format:**
```json
{
  "success": true,
  "message": "Books retrieved successfully",
  "data": [...]
}
```

For detailed API docs, see `ENHANCEMENT_GUIDE.md`

## 🎓 Learning Resources

This project demonstrates:
- ✅ Authentication & Authorization
- ✅ Role-Based Access Control (RBAC)
- ✅ RESTful API design
- ✅ Password hashing & security
- ✅ JWT token management
- ✅ Component-based React architecture
- ✅ State management with Context API
- ✅ Protected routes in React Router v6
- ✅ Full-stack TypeScript development

## 📞 Support

For issues or questions:
1. Check error messages in console
2. Review ENHANCEMENT_GUIDE.md for detailed docs
3. Check project structure above for file locations
4. Verify all environment variables are set

## ✨ Next Steps

Want to enhance further? See `ENHANCEMENT_GUIDE.md` for ideas:
- Database migration (MongoDB/PostgreSQL)
- Email notifications
- Fine system for overdue books
- Book reviews and ratings
- Advanced search filters
- And more!

---

**Status**: ✅ Ready to Use - Intermediate Level  
**Last Updated**: January 29, 2026

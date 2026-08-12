# 🚀 Quick Start Guide - Enhanced Library Management System

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A code editor (VS Code recommended)

## Installation & Setup

### 1. Install Dependencies

#### Backend
```powershell
cd backend
npm install
```

#### Frontend
```powershell
cd frontend
npm install
```

### 2. Environment Setup

The backend `.env` file should already exist in the `backend` folder with:
```
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

### 3. Start the Application

#### Option A: Run Both Servers Separately (Recommended)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

#### Option B: Quick Start Script (if available)
```powershell
npm start
```

## 🎯 Test the Application

### 1. Create Test Accounts

#### Create Admin Account:
- Go to: `http://localhost:5173/signup`
- Name: `Admin User`
- Email: `admin@library.com`
- Password: `admin123`
- After registration, manually edit `backend/src/database/library.json`
- Find the user and change `"role": "user"` to `"role": "admin"`
- Restart backend server

#### Create Regular User Account:
- Go to: `http://localhost:5173/signup`
- Name: `John Doe`
- Email: `john@example.com`
- Password: `password123`

### 2. Test User Features

1. **Login as User** (`john@example.com`)
2. **Browse Books**
   - Use search bar
   - Try filters (Available/Borrowed)
   - Try sorting options
3. **Borrow a Book**
   - Click on any available book
   - Click "Borrow This Book"
   - Check "My Borrowed Books" section
4. **View Statistics**
   - See dashboard stats at the top
5. **View History**
   - Click "View History" button
   - See all borrow records

### 3. Test Admin Features

1. **Login as Admin** (`admin@library.com`)
2. **View Overview Dashboard**
   - See all statistics
   - Check financial overview
   - View top 5 borrowed books
   - See recent activity
3. **Manage Books**
   - Click "Manage Books" tab
   - Add a new book
   - Edit existing book
   - Delete a book (optional)
4. **View Borrow Records**
   - Click "Borrow Records" tab
   - Try search functionality
   - Filter by status
   - Click "View" on any record
   - Export to CSV

### 4. Test Fine System

To test fines, you need to manually adjust dates in the database:

1. Borrow a book as a user
2. Stop the backend server
3. Open `backend/src/database/library.json`
4. Find the borrow record
5. Change the `dueDate` to a past date (e.g., 7 days ago)
6. Save and restart backend
7. Return the book - you'll see a fine calculated
8. View history and pay the fine

## 📊 Features to Explore

### User Dashboard
✅ Search, Filter, Sort books
✅ Borrow books with validation
✅ Return books with fine calculation
✅ View borrowed books
✅ Check borrow history
✅ Pay fines
✅ Interactive modals

### Admin Dashboard
✅ Overview with statistics
✅ Financial tracking
✅ Popular books analytics
✅ Recent activity feed
✅ Book management (CRUD)
✅ Borrow records with filters
✅ Export to CSV
✅ Detailed record view

## 🎨 UI Features to Notice

1. **Floating Notifications**: Success/error messages that auto-dismiss
2. **Modal Dialogs**: Click book cards, view history, pay fines
3. **Status Badges**: Color-coded status indicators
4. **Overdue Warnings**: Red highlights for overdue books
5. **Fine Alerts**: Yellow alert box for unpaid fines
6. **Hover Effects**: Interactive card animations
7. **Responsive Design**: Try resizing your browser

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify `.env` file exists in backend folder
- Run `npm install` again in backend folder

### Frontend won't start
- Check if port 5173 is available
- Run `npm install` again in frontend folder
- Clear browser cache

### Can't login/signup
- Check if backend server is running
- Check browser console for errors
- Verify `backend/src/database/library.json` exists

### Books not showing
- Check if backend is running
- Check browser console for CORS errors
- Verify API base URL in `frontend/src/api/apiClient.ts`

### Modal not appearing
- Check browser console for errors
- Try clearing browser cache
- Check if Modal.css is loaded

## 📝 Default Test Data

The system comes with 6 pre-loaded books:
1. The Great Gatsby
2. To Kill a Mockingbird
3. 1984
4. Pride and Prejudice
5. The Catcher in the Rye
6. Brave New World

## 🔧 Configuration

### Change Fine Rate
Edit `backend/src/controllers/borrowController.ts`:
```typescript
const FINE_PER_DAY = 5; // Change this value
```

### Change Borrow Duration
Edit `backend/src/controllers/borrowController.ts`:
```typescript
const BORROW_DURATION_DAYS = 14; // Change this value
```

### Change API Port
Edit `backend/.env`:
```
PORT=5000  # Change this value
```

Then update `frontend/src/api/apiClient.ts`:
```typescript
baseURL: 'http://localhost:5000/api',  // Update port here
```

## 📚 Next Steps

1. Explore all features
2. Test the fine payment system
3. Try the export functionality
4. Test responsive design on mobile
5. Create multiple test users
6. Borrow and return books
7. Check admin analytics

## 🎉 Enjoy Your Enhanced Library Management System!

For detailed feature documentation, see [ENHANCEMENTS_COMPLETE.md](ENHANCEMENTS_COMPLETE.md)

---

Need help? Check the console logs in both terminal windows and browser developer tools.

# 🧪 Testing Guide - Features & Scenarios

## ✅ Pre-Setup Checklist

Before testing, ensure:
- [ ] Both backend and frontend are running
- [ ] Backend: `npm run dev` in `backend/` folder
- [ ] Frontend: `npm run dev` in `frontend/` folder
- [ ] Backend runs on http://localhost:5000
- [ ] Frontend runs on http://localhost:5173
- [ ] No errors in browser console
- [ ] `library.json` database exists with default books

---

## 🧪 Test Scenario 1: User Registration & Login

### Test 1.1: Successful Signup
**Steps:**
1. Open http://localhost:5173
2. You should see Login page
3. Click "Sign up here"
4. You should be on SignupPage
5. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm: "password123"
6. Click "Create Account"

**Expected Result:**
- ✅ Account created successfully
- ✅ Redirected to LibraryPortal
- ✅ User dashboard shows "Test User" in header
- ✅ Role badge shows "👤 User"
- ✅ Token stored in localStorage

**Verify:**
```bash
# In browser console:
localStorage.getItem('token')  # Should return JWT token
localStorage.getItem('user')   # Should return user object
```

### Test 1.2: Signup Validation
**Steps:**
1. Go to signup page
2. Try invalid inputs:
   - Empty fields → "Please fill in all fields"
   - Invalid email (no @) → "Please enter a valid email address"
   - Password < 6 chars → "Password must be at least 6 characters long"
   - Passwords don't match → "Passwords do not match"

**Expected Result:**
- ✅ Each validation shows correct error message
- ✅ Form doesn't submit on invalid input

### Test 1.3: Duplicate Email Prevention
**Steps:**
1. Create account with "test@example.com"
2. Go to signup page again
3. Try signup with same email

**Expected Result:**
- ❌ Error: "User with this email already exists" or similar

### Test 1.4: Password Hashing Verification
**Steps:**
1. Create new user with password "test123456"
2. Check `backend/src/database/library.json`
3. Find user and look at password field

**Expected Result:**
- ✅ Password is hashed (looks like: `$2a$10$...`)
- ✅ Not plaintext
- ✅ Starts with `$2a$` (bcryptjs signature)

### Test 1.5: Logout & Login Again
**Steps:**
1. After signup, click "Logout"
2. Confirm logout
3. You should see login page
4. Click "Don't have an account?"
5. Create another test account with different email
6. Or login with original email and password

**Expected Result:**
- ✅ Logout clears localStorage
- ✅ Redirected to login page
- ✅ Login with new account works
- ✅ JWT token renewed

---

## 📚 Test Scenario 2: User Dashboard & Book Browsing

### Test 2.1: View Books
**Steps:**
1. Login as regular user
2. You should see:
   - Stats cards (Total Books, Available Books, Books Borrowed)
   - Book grid below
   - Each book card shows: Icon, Title, Author, ISBN, Description
   - Available copies badge
   - "Borrow Book" button

**Expected Result:**
- ✅ All 6 default books display
- ✅ Books show correct info
- ✅ Available count correct
- ✅ Book cards are responsive

### Test 2.2: Search Books
**Steps:**
1. In search box, type "Great"
2. Results should filter to show "The Great Gatsby"
3. Type "Harper" (author name)
4. Should show "To Kill a Mockingbird"
5. Clear search
6. All books show again

**Expected Result:**
- ✅ Real-time filtering works
- ✅ Searches by both title and author
- ✅ Case-insensitive matching
- ✅ Clears correctly

### Test 2.3: Book Availability
**Steps:**
1. Look for book with 0 availableCopies
2. "Borrow Book" button should be disabled
3. Book card should look faded
4. Check another available book
5. Button should be enabled and clickable

**Expected Result:**
- ✅ Unavailable books show disabled button
- ✅ Available books have enabled button
- ✅ Visual feedback with styling

---

## 🏦 Test Scenario 3: Borrowing Books (User Feature)

### Test 3.1: Borrow a Book
**Steps:**
1. In book grid, click "Borrow Book" on "The Great Gatsby"
2. Should see success message
3. Book disappears from available books grid OR moves to borrowed section
4. Button changes to "Return Book"

**Expected Result:**
- ✅ Success alert shows
- ✅ Book appears in "My Borrowed Books" section
- ✅ Due date shows (14 days from today)
- ✅ Days left calculated correctly

**Verify in Database:**
```bash
# Check library.json
# User should have bookId in borrowHistory
# Book should have user in borrowedBy
# availableCopies should decrease by 1
```

### Test 3.2: Borrow Same Book Twice
**Steps:**
1. Try to borrow same book again
2. Should get error

**Expected Result:**
- ❌ Error: "You already have an active borrow record for this book"

### Test 3.3: Cannot Borrow Unavailable Books
**Steps:**
1. Find book with availableCopies = 0
2. "Borrow Book" button should be disabled (grayed out)

**Expected Result:**
- ✅ Button is disabled
- ✅ Cannot click it
- ✅ Cursor shows "not-allowed"

### Test 3.4: Track Due Dates
**Steps:**
1. Borrow a book
2. Check "My Borrowed Books" section
3. Verify:
   - Borrow date is correct (today)
   - Due date is 14 days from borrow date
   - Days left shows countdown
   - If < 3 days remaining, text is red

**Expected Result:**
- ✅ All dates correct
- ✅ Countdown calculation correct
- ✅ Visual warning for soon-due books

### Test 3.5: Return Book
**Steps:**
1. In "My Borrowed Books", click "Return Now"
2. Should see success message
3. Book moves back to available books grid
4. Disappears from "My Borrowed Books"

**Expected Result:**
- ✅ Success alert shows
- ✅ Book availability increases
- ✅ Borrowed section updates
- ✅ Button changes back to "Borrow Book"

---

## 👨‍💼 Test Scenario 4: Admin Dashboard & Book Management

### Test 4.1: Access Admin Dashboard (Need Admin Account)
**Steps:**
1. Manually create admin account in `library.json`
2. Add this to users array:
```json
{
  "id": "admin-id-123",
  "email": "admin@test.com",
  "password": "$2a$10$...",  // bcrypt hash of "admin123"
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2026-01-29T00:00:00Z",
  "borrowHistory": []
}
```
3. Logout and login as admin@test.com / admin123

**Expected Result:**
- ✅ LibraryPortal shows role badge "👨‍💼 Admin"
- ✅ See two tabs: "Manage Books" and "Borrow Records"
- ✅ Different UI from user dashboard

### Test 4.2: Add New Book (Admin Only)
**Steps:**
1. In Admin Dashboard, click "+ Add New Book"
2. Form appears with fields:
   - Title
   - Author
   - ISBN
   - Total Copies
   - Description
3. Fill in:
   - Title: "Test Book"
   - Author: "Test Author"
   - ISBN: "999-9999-9999"
   - Copies: 5
   - Description: "Test book for verification"
4. Click "Add Book"

**Expected Result:**
- ✅ Success message shows
- ✅ Form clears
- ✅ New book appears in table
- ✅ Book available in user browsing

**Verify:**
```bash
# In library.json:
# New book should be in books array
# With id, createdAt, availableCopies: 5
```

### Test 4.3: Edit Book (Admin Only)
**Steps:**
1. In books table, click "Edit" on any book
2. Form populates with current values
3. Change:
   - Title: "Updated Title"
   - Total Copies: 10
4. Click "Update Book"

**Expected Result:**
- ✅ Form closes
- ✅ Table updates
- ✅ Changes reflect in user view
- ✅ Available copies might increase/decrease

### Test 4.4: Delete Book (Admin Only)
**Steps:**
1. Click "Delete" button
2. Confirm deletion
3. Book disappears from table

**Expected Result:**
- ✅ Book removed from library
- ✅ No longer appears in user view
- ✅ Users can't borrow deleted books

### Test 4.5: ISBN Duplicate Prevention
**Steps:**
1. Try to add book with ISBN of existing book
2. Should get error

**Expected Result:**
- ❌ Error: "A book with this ISBN already exists"

---

## 📋 Test Scenario 5: Admin Borrow Records View

### Test 5.1: View All Borrowings
**Steps:**
1. As admin, click "Borrow Records" tab
2. See table with columns:
   - User (name + email)
   - Book (title + author)
   - Borrowed Date
   - Due Date
   - Returned Date
   - Status (badge)

**Expected Result:**
- ✅ All borrowing activity visible
- ✅ Shows admin + user borrows
- ✅ Dates format correctly
- ✅ Status badges color-coded

### Test 5.2: Status Badges
**Steps:**
1. Look at status badges in table:
   - Green "Active" - currently borrowed
   - Blue "Returned" - successfully returned
   - Red "Overdue" - past due date

**Expected Result:**
- ✅ Active borrows show green badge
- ✅ Returned books show blue badge
- ✅ Correct color for status

### Test 5.3: User Info in Records
**Steps:**
1. Check each record
2. Verify user information:
   - User name shows (from borrow)
   - User email shows
   - Matches actual user account

**Expected Result:**
- ✅ User info displays correctly
- ✅ Matches login email/name
- ✅ Useful for admin tracking

---

## 🔒 Test Scenario 6: Security & Authorization

### Test 6.1: JWT Token Verification
**Steps:**
1. Login and check token in console:
```javascript
const token = localStorage.getItem('token');
console.log(token);
// Should be JWT format: xxx.xxx.xxx
```
2. Decode token (use jwt.io):
   - Should contain: userId, email, role
   - Should have iat (issued at) and exp (expiry)

**Expected Result:**
- ✅ Token is valid JWT format
- ✅ Contains correct user data
- ✅ Signature valid
- ✅ Not expired

### Test 6.2: Expired Token Behavior
**Steps:**
1. Manually modify token expiry in library.json
2. Set exp to past timestamp
3. Make any API call
4. Should get 403 error

**Expected Result:**
- ❌ API returns 403 Forbidden
- ❌ Redirects to login
- ❌ Token is invalidated

### Test 6.3: Admin Route Protection
**Steps:**
1. Login as regular user
2. Open browser DevTools Network tab
3. Try to call admin endpoint:
```javascript
fetch('http://localhost:5000/api/books', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({title: 'test'})
})
```
4. Should get 403 error

**Expected Result:**
- ❌ API returns 403 Forbidden
- ❌ Message: "Insufficient permissions" or similar
- ❌ Regular users cannot create books via API

### Test 6.4: Missing Token
**Steps:**
1. Make API call without token:
```javascript
fetch('http://localhost:5000/api/borrows/active')
```

**Expected Result:**
- ❌ API returns 401 Unauthorized
- ❌ Message: "No token provided"

### Test 6.5: Invalid Token
**Steps:**
1. Make API call with fake token:
```javascript
fetch('http://localhost:5000/api/borrows/active', {
  headers: {
    'Authorization': 'Bearer invalid_token_here'
  }
})
```

**Expected Result:**
- ❌ API returns 403 Forbidden
- ❌ Message: "Invalid or expired token"

---

## 🔄 Test Scenario 7: End-to-End User Journey

### Complete User Journey
**Steps:**
1. ✅ Open app at http://localhost:5173
2. ✅ See login page
3. ✅ Click signup
4. ✅ Create new account (name, email, password)
5. ✅ Verify redirected to user dashboard
6. ✅ See stats cards (0 books borrowed initially)
7. ✅ Browse available books
8. ✅ Search for a book
9. ✅ Click "Borrow Book" on multiple books
10. ✅ See them in "My Borrowed Books"
11. ✅ Check due dates (14 days away)
12. ✅ Return one book
13. ✅ Verify it's back in available list
14. ✅ Click logout
15. ✅ See login page
16. ✅ Login again with same credentials
17. ✅ Verify previous borrows still there

**Expected Result:**
- ✅ Complete workflow works seamlessly
- ✅ Data persists across logout/login
- ✅ All features functional

---

## 🛠️ Troubleshooting Tests

If tests fail:

### "Cannot connect to backend"
```bash
# Check backend is running
curl http://localhost:5000/api/health
# Should return: {status: 'ok', ...}
```

### "Login fails"
```bash
# Check password hash in library.json
# Password should be bcrypt format: $2a$10$...
# Not plaintext
```

### "Admin features not showing"
```javascript
// Check user role in console:
JSON.parse(localStorage.getItem('user')).role
// Should be 'admin' not 'user'
```

### "Books don't update"
- Refresh page (Ctrl+F5)
- Clear localStorage: `localStorage.clear()`
- Restart backend and frontend

---

## 📊 Test Coverage Summary

| Feature | Test Count | Status |
|---------|-----------|--------|
| Authentication | 5 | ✅ |
| Book Browsing | 3 | ✅ |
| Borrowing | 5 | ✅ |
| Admin Management | 5 | ✅ |
| Admin Records | 3 | ✅ |
| Security | 5 | ✅ |
| E2E Journey | 1 | ✅ |
| **Total** | **27** | ✅ |

---

## ✅ Final Verification Checklist

- [ ] User signup works with validation
- [ ] User login works with JWT token
- [ ] Token stored in localStorage
- [ ] Password is bcrypt hashed
- [ ] User dashboard displays correctly
- [ ] Book browsing works with search
- [ ] Borrowing updates UI and database
- [ ] Returning updates UI and database
- [ ] Admin can add books
- [ ] Admin can edit books
- [ ] Admin can delete books
- [ ] Admin can view all borrows
- [ ] Regular users cannot access admin routes
- [ ] Logout clears session
- [ ] Redirect logic works (login ↔ dashboard)
- [ ] Responsive design works on mobile
- [ ] No errors in console
- [ ] Database updates correctly
- [ ] Role badges display correctly
- [ ] All notifications/messages show

---

**Status**: ✅ All Tests Ready to Run!  
**Last Updated**: January 29, 2026

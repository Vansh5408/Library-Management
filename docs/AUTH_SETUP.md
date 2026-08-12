# 🚀 Authentication System Setup Guide

## Quick Start - Secure Authentication

This guide will help you set up the secure authentication system for the Library Management System.

---

## Prerequisites

- Node.js 18+ installed
- Backend and frontend dependencies installed
- `.env` file configured in backend directory

---

## Step 1: Configure Environment Variables

Create or update `backend/.env`:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

**Generate a secure JWT secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2: Create Admin and Librarian Accounts

Admin and librarian accounts can ONLY be created using the seeding script.

```bash
cd backend
npm run seed:admin
```

**Default credentials created**:

### Admin Account
- **Email**: `admin@library.com`
- **Password**: `Admin@2026!Secure`
- **Role**: `admin`

### Librarian Account
- **Email**: `librarian@library.com`
- **Password**: `Librarian@2026!Secure`
- **Role**: `librarian`

⚠️ **CRITICAL**: Change these passwords immediately after first login!

---

## Step 3: Start the Backend Server

```bash
cd backend
npm run dev
```

Server will start on `http://localhost:5000`

---

## Step 4: Start the Frontend Application

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:5173` (or specified port)

---

## Step 5: Test the Authentication System

### Test User Registration (Public)

1. Navigate to `http://localhost:5173/signup`
2. Create a regular user account with:
   - Email: `user@test.com`
   - Password: `Test@123456`
   - Name: `Test User`

✅ This creates a regular user account with `role: 'user'`

### Test Staff Login

1. Navigate to `http://localhost:5173/librarian/login`
2. Login with librarian credentials:
   - Email: `librarian@library.com`
   - Password: `Librarian@2026!Secure`

✅ You'll be redirected to the librarian dashboard

### Test Admin Login

1. Use the same librarian login page
2. Login with admin credentials:
   - Email: `admin@library.com`
   - Password: `Admin@2026!Secure`

✅ You'll be redirected to the librarian/admin dashboard with full privileges

---

## Security Features Implemented

### ✅ Privilege Separation
- ❌ Cannot create admin/librarian accounts via signup page
- ✅ Admin/librarian accounts only via database seeding
- ✅ Public signup restricted to regular users only

### ✅ Strong Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### ✅ JWT Token Security
- 7-day expiration (reduced from 30 days)
- Role-based claims for authorization
- Issuer and audience validation
- Secure token verification

### ✅ Role-Based Access Control
- User: Browse and borrow books
- Librarian: Manage books and view users
- Admin: Full system access

### ✅ Input Validation
- Email format validation
- Password complexity validation
- Name length validation
- Generic error messages (prevents enumeration)

---

## Common Issues and Solutions

### Issue: "JWT secret not configured"
**Solution**: Make sure `.env` file exists in backend directory with `JWT_SECRET` defined

### Issue: "User already exists"
**Solution**: Use a different email or login with existing credentials

### Issue: "Invalid credentials" when logging in as staff
**Solution**: Make sure you ran `npm run seed:admin` to create staff accounts

### Issue: Frontend can't connect to backend
**Solution**: Verify backend is running on port 5000 and CORS is enabled

---

## Creating Additional Staff Accounts

To create more admin or librarian accounts:

1. Edit `backend/src/scripts/seedAdmin.ts`
2. Add new account to the `DEFAULT_ADMINS` array:

```typescript
{
  name: 'New Librarian Name',
  email: 'newlibrarian@library.com',
  password: 'StrongPassword123!',
  role: 'librarian' as const,
}
```

3. Run the seeding script:
```bash
npm run seed:admin
```

The script will skip existing accounts and only create new ones.

---

## API Endpoints

### Public Endpoints

- `POST /api/auth/register` - Register new user (users only)
- `POST /api/auth/login` - Login (all roles)

### Protected Endpoints

- `GET /api/auth/profile` - Get user profile (requires authentication)
- All book management endpoints (requires librarian/admin role)
- All user management endpoints (requires admin role)

---

## Testing the System

### Test 1: Public User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "name": "Test User"
  }'
```

### Test 2: Attempt to Create Admin via API (Should Fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Test@123456",
    "name": "Test Admin",
    "role": "admin"
  }'
```

Expected: `403 Forbidden - Cannot register privileged accounts`

### Test 3: Staff Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "librarian@library.com",
    "password": "Librarian@2026!Secure"
  }'
```

---

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Generate unique JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up monitoring
- [ ] Configure firewall
- [ ] Enable database backups
- [ ] Review CORS settings

See [SECURITY.md](./SECURITY.md) for complete security documentation.

---

## Next Steps

1. ✅ Set up authentication (you're here!)
2. 📚 Seed books database: `npm run seed:books`
3. 🧪 Test all user flows
4. 🔒 Review security checklist
5. 🚀 Deploy to production

---

## Support

For issues or questions:
- Check [SECURITY.md](./SECURITY.md) for security-related questions
- Review backend logs in console
- Check browser console for frontend errors

---

**Last Updated**: February 5, 2026

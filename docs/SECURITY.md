# 🔒 Security Documentation

## Library Management System - Authentication & Authorization

This document outlines the security architecture, best practices, and production deployment guidelines for the Library Management System.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication System](#authentication-system)
3. [Role-Based Access Control](#role-based-access-control)
4. [Admin Account Management](#admin-account-management)
5. [Password Security](#password-security)
6. [JWT Token Security](#jwt-token-security)
7. [Production Deployment](#production-deployment)
8. [Security Checklist](#security-checklist)

---

## Security Overview

### Key Security Features

✅ **Privilege Separation**: Admin and librarian accounts cannot be created via public APIs  
✅ **Strong Password Requirements**: Enforced complexity with uppercase, lowercase, numbers, and special characters  
✅ **JWT-Based Authentication**: Stateless token authentication with role-based claims  
✅ **Role-Based Authorization**: Middleware-enforced access control  
✅ **Generic Error Messages**: Prevents user enumeration attacks  
✅ **Password Hashing**: BCrypt with 10 salt rounds  
✅ **Input Validation**: Comprehensive validation on all user inputs  

---

## Authentication System

### User Registration (Public)

**Endpoint**: `POST /api/auth/register`

**Allowed Roles**: Regular users only

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Security Controls**:
- ✅ Only creates accounts with `role: 'user'`
- ✅ Blocks any attempt to specify `admin` or `librarian` role
- ✅ Enforces password complexity requirements
- ✅ Validates email format
- ✅ Checks for duplicate emails (without revealing existence)

### Login (All Users)

**Endpoint**: `POST /api/auth/login`

**Supports**: Regular users, librarians, and administrators

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Security Controls**:
- ✅ Generic error messages (prevents email enumeration)
- ✅ BCrypt password verification
- ✅ JWT token generation with role claims
- ⚠️ **TODO**: Implement rate limiting (recommended: 5 attempts per 15 minutes)
- ⚠️ **TODO**: Add account lockout after repeated failures

---

## Role-Based Access Control

### User Roles

| Role | Description | Creation Method |
|------|-------------|-----------------|
| **user** | Regular library patron | Public registration |
| **librarian** | Library staff member | Database seeding script |
| **admin** | System administrator | Database seeding script |

### Permission Matrix

| Action | User | Librarian | Admin |
|--------|------|-----------|-------|
| Browse books | ✅ | ✅ | ✅ |
| Borrow books | ✅ | ✅ | ✅ |
| Reserve books | ✅ | ✅ | ✅ |
| View own records | ✅ | ✅ | ✅ |
| Manage books | ❌ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ✅ |

### Authorization Middleware

```typescript
// Protect endpoints with role-based authorization
router.post('/books', 
  authenticateToken,                    // Verify JWT token
  authorizeRole('admin', 'librarian'),  // Check role
  bookController.createBook             // Handler
);
```

---

## Admin Account Management

### Creating Admin/Librarian Accounts

**⚠️ CRITICAL SECURITY MEASURE**: Admin and librarian accounts can ONLY be created using the database seeding script.

#### Step 1: Run the Seeding Script

```bash
cd backend
npm run seed:admin
```

#### Step 2: Default Credentials

**Default Admin Account**:
- Email: `admin@library.com`
- Password: `Admin@2026!Secure`
- Role: `admin`

**Default Librarian Account**:
- Email: `librarian@library.com`
- Password: `Librarian@2026!Secure`
- Role: `librarian`

#### Step 3: Change Default Passwords

**🚨 MANDATORY**: Change these passwords immediately after first login!

1. Login with default credentials
2. Navigate to profile settings
3. Update password to a unique, strong password
4. Store in a secure password manager

#### Step 4: Create Additional Staff Accounts

To create additional admin or librarian accounts:

1. Edit `backend/src/scripts/seedAdmin.ts`
2. Add new account to the `DEFAULT_ADMINS` array:

```typescript
{
  name: 'Jane Smith',
  email: 'jane.smith@library.com',
  password: 'YourSecurePassword123!',
  role: 'librarian' as const,
}
```

3. Run the seeding script: `npm run seed:admin`
4. The script will skip existing accounts and only create new ones

---

## Password Security

### Password Requirements

All passwords must meet these complexity requirements:

✅ Minimum 8 characters  
✅ At least one uppercase letter (A-Z)  
✅ At least one lowercase letter (a-z)  
✅ At least one number (0-9)  
✅ At least one special character (!@#$%^&*(),.?":{}|<>)  

### Password Storage

- **Hashing Algorithm**: BCrypt
- **Salt Rounds**: 10 (configurable via `SALT_ROUNDS` constant)
- **Password Hash Length**: ~60 characters
- **Never stored in plain text**
- **Never returned in API responses**

### Best Practices

- 🔐 Use unique passwords for each account
- 🔐 Store passwords in a secure password manager
- 🔐 Enable 2FA when available (future enhancement)
- 🔐 Change passwords every 90 days (recommended for production)
- 🔐 Never share credentials via insecure channels

---

## JWT Token Security

### Token Structure

```json
{
  "userId": "uuid-v4-string",
  "email": "user@example.com",
  "role": "user|librarian|admin",
  "iat": 1234567890,
  "exp": 1234567890,
  "iss": "library-management-system",
  "aud": "library-app-users"
}
```

### Token Configuration

- **Algorithm**: HS256 (HMAC SHA-256)
- **Expiration**: 7 days (configurable)
- **Issuer**: `library-management-system`
- **Audience**: `library-app-users`
- **Secret**: Stored in `JWT_SECRET` environment variable

### Token Lifecycle

1. **Generation**: On successful login/registration
2. **Storage**: LocalStorage (client-side)
3. **Transmission**: Authorization header (`Bearer <token>`)
4. **Validation**: On every protected route request
5. **Expiration**: Automatic after 7 days

### Security Recommendations

⚠️ **Current Implementation**: Tokens stored in localStorage  
✅ **Production Recommendation**: Implement one of:

1. **HttpOnly Cookies**: Prevents XSS token theft
2. **Refresh Token Rotation**: Short-lived access tokens (15 min) + refresh tokens
3. **Token Blacklisting**: Maintain revoked token list for logout

---

## Production Deployment

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# MANDATORY - Generate a strong, unique secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional - Database configuration
DB_PATH=./src/database/library.json

# Optional - Server configuration
PORT=5000
NODE_ENV=production
```

### Generate Secure JWT Secret

```bash
# Generate a 256-bit random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Security Hardening Checklist

#### Backend Security

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS/TLS for all communication
- [ ] Generate and secure a strong `JWT_SECRET`
- [ ] Implement rate limiting (e.g., `express-rate-limit`)
- [ ] Add request size limits (body-parser configuration)
- [ ] Enable CORS only for trusted origins
- [ ] Add Helmet.js for HTTP header security
- [ ] Implement logging and monitoring (Winston, Morgan)
- [ ] Remove console.log statements (use proper logging)
- [ ] Add input sanitization (prevent NoSQL injection)
- [ ] Implement CSRF protection for state-changing operations
- [ ] Add account lockout after failed login attempts
- [ ] Enable database backups
- [ ] Use prepared statements/parameterized queries

#### Frontend Security

- [ ] Remove debug logs and console statements
- [ ] Implement Content Security Policy (CSP)
- [ ] Use HTTPS/TLS for all API calls
- [ ] Implement XSS protection
- [ ] Add input validation on client-side
- [ ] Implement session timeout (auto-logout)
- [ ] Clear sensitive data from localStorage on logout
- [ ] Add CSRF token handling
- [ ] Implement proper error boundaries
- [ ] Use SRI (Subresource Integrity) for CDN resources

#### Infrastructure

- [ ] Use a reverse proxy (Nginx, Apache)
- [ ] Enable firewall rules
- [ ] Implement DDoS protection
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Regular security updates and patches
- [ ] Database encryption at rest
- [ ] Secure backup storage
- [ ] Implement intrusion detection
- [ ] Set up security monitoring and alerts

---

## Security Checklist

### Initial Setup

- [x] Admin accounts created via seeding script only
- [x] Librarian accounts created via seeding script only
- [x] Public registration limited to 'user' role
- [x] Strong password requirements enforced
- [x] JWT token validation implemented
- [x] Role-based authorization middleware in place
- [x] Generic error messages (no user enumeration)

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Generate unique JWT_SECRET
- [ ] Remove debug logging
- [ ] Implement rate limiting
- [ ] Add account lockout mechanism
- [ ] Set up HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Add Helmet.js security headers
- [ ] Implement monitoring and logging
- [ ] Test all authentication flows
- [ ] Perform security audit
- [ ] Create incident response plan
- [ ] Document backup and recovery procedures

### Ongoing Security

- [ ] Regular dependency updates (`npm audit`)
- [ ] Periodic security audits
- [ ] Log monitoring and analysis
- [ ] Backup verification
- [ ] Password rotation enforcement
- [ ] Access control reviews
- [ ] Penetration testing (annual)
- [ ] Security training for staff

---

## Additional Resources

### Recommended Security Libraries

- **Helmet.js**: HTTP security headers
- **express-rate-limit**: API rate limiting
- **express-validator**: Input validation and sanitization
- **bcryptjs**: Password hashing (already implemented)
- **jsonwebtoken**: JWT token handling (already implemented)
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management (already implemented)

### Security Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## Contact & Support

For security concerns or to report vulnerabilities:

- **Email**: security@yourlibrary.com
- **Issue Tracker**: Create a private security advisory on GitHub
- **Response Time**: 24-48 hours for critical issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial secure authentication implementation |

---

**Last Updated**: February 5, 2026  
**Reviewed By**: System Administrator  
**Next Review**: May 5, 2026

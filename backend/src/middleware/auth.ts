import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload, UserRole } from '../models/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * JWT Token Authentication Middleware
 * 
 * Validates JWT tokens and attaches user payload to request object.
 * SECURITY: Production deployments should implement:
 * - Rate limiting (e.g., express-rate-limit)
 * - Token blacklisting for logout
 * - Short-lived access tokens with refresh token rotation
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // SECURITY: In production, remove these debug logs or use proper logging service
  if (process.env.NODE_ENV === 'development') {
    console.log('[auth] Authorization header:', authHeader ? 'Present' : 'Missing');
    if (token) console.log('[auth] Token length:', token.length);
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
      error: 'No token provided',
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[auth] CRITICAL: JWT_SECRET not configured');
    res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: 'Authentication service unavailable',
    });
    return;
  }

  // SECURITY: Verify token with proper options
  jwt.verify(
    token, 
    jwtSecret,
    {
      issuer: 'library-management-system',
      audience: 'library-app-users'
    },
    (err, decoded) => {
      if (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth] Token verification failed:', err.message);
        }
        
        // SECURITY: Return generic error messages in production
        const errorMessage = process.env.NODE_ENV === 'development' 
          ? err.message 
          : 'Invalid or expired token';
        
        res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          error: errorMessage,
        });
        return;
      }

      const user = decoded as AuthPayload;
      
      // SECURITY: Validate payload structure
      if (!user.userId || !user.email || !user.role) {
        console.error('[auth] Invalid token payload structure');
        res.status(403).json({
          success: false,
          message: 'Invalid token',
          error: 'Token payload invalid',
        });
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[auth] Token verified for user:', user.email, 'Role:', user.role);
      }
      
      req.user = user;
      next();
    }
  );
}

/**
 * Optional Authentication Middleware
 * 
 * Attaches user to request if valid token is present, but doesn't block the request.
 * Useful for endpoints that work differently for authenticated vs anonymous users.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      jwt.verify(
        token, 
        jwtSecret,
        {
          issuer: 'library-management-system',
          audience: 'library-app-users'
        },
        (err, decoded) => {
          if (!err && decoded) {
            const user = decoded as AuthPayload;
            // SECURITY: Validate payload structure
            if (user.userId && user.email && user.role) {
              req.user = user;
            }
          }
        }
      );
    }
  }

  next();
}

/**
 * Role-Based Authorization Middleware
 * 
 * Restricts endpoint access to specific user roles.
 * Must be used AFTER authenticateToken middleware.
 * 
 * @param allowedRoles - Array of roles that can access the endpoint
 * 
 * @example
 * router.get('/admin/users', authenticateToken, authorizeRole('admin'), handler)
 * router.post('/books', authenticateToken, authorizeRole('admin', 'librarian'), handler)
 */
export function authorizeRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // SECURITY: Log unauthorized access attempts
      console.warn(
        `[auth] Unauthorized access attempt by user ${req.user.email} (${req.user.role}) ` +
        `to endpoint requiring roles: ${allowedRoles.join(', ')}`
      );
      
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

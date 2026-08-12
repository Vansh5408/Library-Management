import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserByEmail,
  addUser,
  getUserById,
} from '../database/db.js';
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  ApiResponse,
  User,
} from '../models/types.js';

const SALT_ROUNDS = 10;

/**
 * User Registration
 * 
 * SECURITY: Only regular 'user' accounts can be created via this endpoint.
 * Admin and librarian accounts MUST be created using the seedAdmin.ts script.
 * This prevents unauthorized privilege escalation.
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'JWT secret not configured',
      } as ApiResponse<null>);
      return;
    }

    const { email, password, name, role } = req.body;

    // SECURITY: Block any attempt to register as admin or librarian
    // Note: req.body is untrusted user input, so we validate at runtime
    if (role && (role === 'admin' || role === 'librarian')) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot register privileged accounts',
        error: 'Admin and librarian accounts must be created by system administrators only',
      } as ApiResponse<null>);
      return;
    }

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
        error: 'Missing required fields',
      } as ApiResponse<null>);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Please provide a valid email address',
      } as ApiResponse<null>);
      return;
    }

    // Password validation - strengthened
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        error: 'Password too short',
      } as ApiResponse<null>);
      return;
    }

    // Password complexity check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character',
        error: 'Password does not meet complexity requirements',
      } as ApiResponse<null>);
      return;
    }

    // Name validation
    if (name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long',
        error: 'Name too short',
      } as ApiResponse<null>);
      return;
    }

    // Check if user already exists
    if (getUserByEmail(email)) {
      res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        error: 'Email already registered',
      } as ApiResponse<null>);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user - ALWAYS with 'user' role for public registration
    const user: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: 'user', // SECURITY: Force user role
      createdAt: new Date().toISOString(),
      borrowHistory: [],
    };

    addUser(user);

    // Generate token with shorter expiration for security
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' } // Reduced from 30d for better security
    );

    const loginResponse: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: loginResponse,
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * User Login
 * 
 * Authenticates users, librarians, and admins.
 * Returns JWT token with role-based claims for authorization.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'JWT secret not configured',
      } as ApiResponse<null>);
      return;
    }

    const { email, password } = req.body as LoginRequest;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Missing credentials',
      } as ApiResponse<null>);
      return;
    }

    // Rate limiting note: In production, implement rate limiting middleware
    // to prevent brute force attacks (e.g., max 5 attempts per 15 minutes)

    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      // SECURITY: Use generic message to prevent email enumeration
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'Authentication failed',
      } as ApiResponse<null>);
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      // SECURITY: Use same generic message as above
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'Authentication failed',
      } as ApiResponse<null>);
      return;
    }

    // Generate token with role-based claims
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { 
        expiresIn: '7d', // Reduced from 30d for better security
        issuer: 'library-management-system',
        audience: 'library-app-users'
      }
    );

    const loginResponse: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: loginResponse,
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * Get User Profile
 * 
 * Returns the authenticated user's profile information.
 * Password hash is excluded from the response.
 */
export function getProfile(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const user = getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist',
      } as ApiResponse<null>);
      return;
    }

    // SECURITY: Never return password hash, even in authenticated responses
    res.status(200).json({
      success: true,
      message: 'Profile retrieved',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        borrowHistory: user.borrowHistory,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

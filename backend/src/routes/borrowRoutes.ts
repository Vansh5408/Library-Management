import { Router } from 'express';
import {
  borrowBook,
  returnBook,
  getUserBorrows,
  getBorrowHistory,
  getAllBorrows,
  payFine,
  getDashboardStats,
} from '../controllers/borrowController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// All borrow routes require authentication
router.post('/borrow', authenticateToken, borrowBook);
router.post('/return', authenticateToken, returnBook);
router.get('/active', authenticateToken, getUserBorrows);
router.get('/history', authenticateToken, getBorrowHistory);
router.post('/pay-fine', authenticateToken, payFine);
router.get('/stats', authenticateToken, getDashboardStats);

// Admin-only routes
router.get('/admin/all', authenticateToken, authorizeRole('admin'), getAllBorrows);

export default router;

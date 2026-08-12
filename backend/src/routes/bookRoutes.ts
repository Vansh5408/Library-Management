import { Router } from 'express';
import multer from 'multer';
import {
  getBooks,
  getBook,
  getAvailableBooks,
  searchBooks,
  getBookStats,
  createBook,
  updateBookHandler,
  deleteBookHandler,
  uploadBookPDF,
} from '../controllers/bookControllerEnhanced.js';
import { optionalAuth, authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

// Public routes
router.get('/available', optionalAuth, getAvailableBooks);
router.get('/search', optionalAuth, searchBooks);
router.get('/stats', optionalAuth, getBookStats);
router.get('/', optionalAuth, getBooks);
router.get('/:id', optionalAuth, getBook);

// Admin-only routes
router.post('/', authenticateToken, authorizeRole('admin'), createBook);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateBookHandler);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteBookHandler);
router.post('/:id/pdf', authenticateToken, authorizeRole('admin'), upload.single('pdf'), uploadBookPDF);

export default router;

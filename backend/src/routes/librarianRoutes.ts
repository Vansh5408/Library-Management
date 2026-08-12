import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  isLibrarian,
  getAllUsersHandler,
  getUserDetailsHandler,
  searchUsersHandler,
  addBookHandler,
  updateBookHandler,
  deleteBookHandler,
  getLibraryStatsHandler,
} from '../controllers/librarianController.js';

const router = Router();

// All routes require authentication and librarian role
router.use(authenticateToken);
router.use(isLibrarian as any);

// User management routes
router.get('/users', getAllUsersHandler);
router.get('/users/search', searchUsersHandler);
router.get('/users/:userId', getUserDetailsHandler);

// Book management routes
router.post('/books', addBookHandler);
router.put('/books/:bookId', updateBookHandler);
router.delete('/books/:bookId', deleteBookHandler);

// Statistics
router.get('/stats', getLibraryStatsHandler);

export default router;

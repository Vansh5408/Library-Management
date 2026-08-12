import { Router } from 'express';
import {
  searchGoogleBooks,
  searchOpenLibrary,
  searchAllBooks,
  getBookByISBN,
  getPopularSubjects,
} from '../controllers/externalBookController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// External book search routes - no authentication required
router.get('/search', optionalAuth, searchAllBooks);
router.get('/search/google', optionalAuth, searchGoogleBooks);
router.get('/search/openlibrary', optionalAuth, searchOpenLibrary);
router.get('/isbn/:isbn', optionalAuth, getBookByISBN);
router.get('/subjects', optionalAuth, getPopularSubjects);

export default router;

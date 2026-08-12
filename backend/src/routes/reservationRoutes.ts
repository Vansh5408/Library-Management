import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import {
  reserveBook,
  getUserReservations,
  cancelUserReservation,
  getBookQueue,
  getAllReservationsAdmin,
} from '../controllers/reservationController.js';

const router = Router();

// User routes (require authentication)
router.post('/reserve', authenticateToken, reserveBook);
router.get('/my-reservations', authenticateToken, getUserReservations);
router.delete('/cancel/:reservationId', authenticateToken, cancelUserReservation);
router.get('/queue/:bookId', getBookQueue);

// Admin routes
router.get('/admin/all', authenticateToken, authorizeRole('admin'), getAllReservationsAdmin);

export default router;

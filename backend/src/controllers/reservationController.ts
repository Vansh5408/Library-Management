import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getBookById,
  getUserById,
  addReservation,
  getReservationsByUser,
  getReservationsByBook,
  getActiveReservation,
  getActiveBorrowRecord,
  getPendingReservationsForBook,
  updateReservation,
  cancelReservation,
  getNextReservationPosition,
  getAllReservations,
} from '../database/db.js';
import { ApiResponse, Reservation, ReserveBookRequest } from '../models/types.js';

const RESERVATION_EXPIRY_HOURS = 48; // Reservation expires after 48 hours when book becomes available

// Reserve a book
export function reserveBook(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const { bookId } = req.body as ReserveBookRequest;

    // Validation
    if (!bookId || typeof bookId !== 'string' || bookId.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid Book ID is required',
        error: 'Missing or invalid book ID',
      } as ApiResponse<null>);
      return;
    }

    const sanitizedBookId = bookId.trim();

    // Check if book exists
    const book = getBookById(sanitizedBookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${sanitizedBookId}`,
      } as ApiResponse<null>);
      return;
    }

    // Check if book is actually available
    if (book.availableCopies > 0) {
      res.status(400).json({
        success: false,
        message: 'Book is currently available',
        error: 'You can borrow this book directly instead of reserving it',
      } as ApiResponse<null>);
      return;
    }

    // Check if user already borrowed this book
    const existingBorrow = getActiveBorrowRecord(req.user.userId, sanitizedBookId);
    if (existingBorrow) {
      res.status(400).json({
        success: false,
        message: 'Already borrowed',
        error: 'You already have an active borrow record for this book',
      } as ApiResponse<null>);
      return;
    }

    // Check if user already has a pending reservation for this book
    const existingReservation = getActiveReservation(req.user.userId, sanitizedBookId);
    if (existingReservation) {
      res.status(400).json({
        success: false,
        message: 'Already reserved',
        error: 'You already have a pending reservation for this book',
      } as ApiResponse<null>);
      return;
    }

    // Get user
    const user = getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist',
      } as ApiResponse<null>);
      return;
    }

    // Get the next position in the reservation queue
    const position = getNextReservationPosition(sanitizedBookId);

    // Create reservation
    const reservedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESERVATION_EXPIRY_HOURS);

    const reservation: Reservation = {
      id: uuidv4(),
      userId: req.user.userId,
      bookId: sanitizedBookId,
      reservedAt: reservedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending',
      notified: false,
      position,
    };

    addReservation(reservation);

    res.status(201).json({
      success: true,
      message: `Book reserved successfully! You are #${position} in the queue.`,
      data: {
        reservation,
        book,
        queuePosition: position,
      },
    } as ApiResponse<{ reservation: Reservation; book: any; queuePosition: number }>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reserve book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get user's reservations
export function getUserReservations(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const reservations = getReservationsByUser(req.user.userId);

    // Enrich with book details
    const enrichedReservations = reservations.map((reservation) => {
      const book = getBookById(reservation.bookId);
      return {
        ...reservation,
        book,
      };
    });

    res.status(200).json({
      success: true,
      message: 'User reservations retrieved',
      data: enrichedReservations,
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reservations',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Cancel a reservation
export function cancelUserReservation(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const { reservationId } = req.params;

    if (!reservationId) {
      res.status(400).json({
        success: false,
        message: 'Reservation ID is required',
        error: 'Missing reservation ID',
      } as ApiResponse<null>);
      return;
    }

    // Get all reservations for this user
    const userReservations = getReservationsByUser(req.user.userId);
    const reservation = userReservations.find((r) => r.id === reservationId);

    if (!reservation) {
      res.status(404).json({
        success: false,
        message: 'Reservation not found',
        error: 'No reservation with this ID found for your account',
      } as ApiResponse<null>);
      return;
    }

    if (reservation.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel reservation',
        error: 'Only pending reservations can be cancelled',
      } as ApiResponse<null>);
      return;
    }

    // Cancel the reservation
    const cancelled = cancelReservation(reservationId);

    if (cancelled) {
      res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: { reservationId },
      } as ApiResponse<{ reservationId: string }>);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel reservation',
        error: 'An error occurred while cancelling the reservation',
      } as ApiResponse<null>);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get queue position for a book
export function getBookQueue(req: Request, res: Response): void {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    const book = getBookById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${bookId}`,
      } as ApiResponse<null>);
      return;
    }

    const pendingReservations = getPendingReservationsForBook(bookId);

    res.status(200).json({
      success: true,
      message: 'Book queue retrieved',
      data: {
        bookId,
        bookTitle: book.title,
        queueLength: pendingReservations.length,
        estimatedWaitDays: pendingReservations.length * 14, // Assuming 14 days per borrow
      },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book queue',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Admin: Get all reservations
export function getAllReservationsAdmin(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const reservations = getAllReservations();

    // Enrich with book and user details
    const enrichedReservations = reservations.map((reservation) => {
      const book = getBookById(reservation.bookId);
      const user = getUserById(reservation.userId);
      return {
        ...reservation,
        book,
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'All reservations retrieved',
      data: enrichedReservations,
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reservations',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

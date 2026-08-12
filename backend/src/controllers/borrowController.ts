import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getBookById,
  updateBook,
  getUserById,
  updateUser,
  addBorrowRecord,
  getBorrowRecordsByUser,
  getActiveBorrowRecord,
  updateBorrowRecord,
  getAllBorrowRecords,
} from '../database/db.js';
import {
  ApiResponse,
  BorrowRecord,
  BorrowBookRequest,
  PayFineRequest,
} from '../models/types.js';

const BORROW_DURATION_DAYS = 14;
const FINE_PER_DAY = 5; // $5 per day late fee

// Helper function to calculate fine
function calculateFine(dueDate: string, returnDate: string): number {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  
  if (returned <= due) {
    return 0;
  }
  
  const daysLate = Math.ceil((returned.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return daysLate * FINE_PER_DAY;
}

export async function borrowBook(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const { bookId } = req.body as BorrowBookRequest;

    // Validation
    if (!bookId) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    // Check if book exists
    const book = getBookById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${bookId}`,
      } as ApiResponse<null>);
      return;
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      res.status(400).json({
        success: false,
        message: 'No copies available',
        error: 'All copies of this book are currently borrowed',
      } as ApiResponse<null>);
      return;
    }

    // Double-check race condition: ensure availableCopies is positive
    if (book.availableCopies < 1) {
      res.status(400).json({
        success: false,
        message: 'Book just became unavailable',
        error: 'Someone just borrowed the last copy',
      } as ApiResponse<null>);
      return;
    }

    // Check if user already has this book
    const existingRecord = getActiveBorrowRecord(req.user.userId, bookId);
    if (existingRecord) {
      res.status(400).json({
        success: false,
        message: 'Book already borrowed',
        error: 'You already have an active borrow record for this book',
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

    // Create borrow record
    const borrowedAt = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    const borrowRecord: BorrowRecord = {
      id: uuidv4(),
      userId: req.user.userId,
      bookId,
      borrowedAt: borrowedAt.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'active',
    };

    // Add borrow record first (atomic operation)
    try {
      addBorrowRecord(borrowRecord);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create borrow record',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse<null>);
      return;
    }

    // Update book availability
    const updatedBook = updateBook(bookId, {
      availableCopies: book.availableCopies - 1,
      borrowedBy: [
        ...book.borrowedBy,
        {
          userId: req.user.userId,
          borrowedAt: borrowedAt.toISOString(),
          dueDate: dueDate.toISOString(),
        },
      ],
    });

    if (!updatedBook) {
      // Rollback: remove the borrow record
      try {
        const { readDatabase, writeDatabase } = await import('../database/db.js');
        const db = readDatabase();
        db.borrowRecords = db.borrowRecords.filter((r: BorrowRecord) => r.id !== borrowRecord.id);
        writeDatabase(db);
        console.log(`Rolled back borrow record ${borrowRecord.id}`);
      } catch (rollbackError) {
        console.error('Failed to rollback borrow record:', rollbackError);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update book',
        error: 'Book update failed',
      } as ApiResponse<null>);
      return;
    }

    // Update user borrow history
    updateUser(req.user.userId, {
      borrowHistory: [...user.borrowHistory, bookId],
    });

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: {
        borrowRecord,
        book: updatedBook,
      },
    } as ApiResponse<{ borrowRecord: BorrowRecord; book: any }>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to borrow book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

export function returnBook(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const { bookId } = req.body as BorrowBookRequest;

    // Validation
    if (!bookId) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    // Get active borrow record
    const borrowRecord = getActiveBorrowRecord(req.user.userId, bookId);
    if (!borrowRecord) {
      res.status(404).json({
        success: false,
        message: 'No active borrow record found',
        error: 'You do not have an active borrow record for this book',
      } as ApiResponse<null>);
      return;
    }

    // Check if book is overdue
    const currentDate = new Date();
    const dueDate = new Date(borrowRecord.dueDate);
    const isOverdue = currentDate > dueDate;
    const returnedAt = new Date().toISOString();
    
    // Calculate fine if overdue
    const fineAmount = isOverdue ? calculateFine(borrowRecord.dueDate, returnedAt) : 0;

    // Get book
    const book = getBookById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${bookId}`,
      } as ApiResponse<null>);
      return;
    }

    // Update borrow record - status is always 'returned' after return
    // Fine information tracks if it was overdue
    updateBorrowRecord(borrowRecord.id, {
      returnedAt,
      status: 'returned',
      fineAmount,
      finePaid: fineAmount === 0, // Automatically mark as paid if no fine
    });

    // Update book availability
    const updatedBook = updateBook(bookId, {
      availableCopies: book.availableCopies + 1,
      borrowedBy: book.borrowedBy.filter((b) => b.userId !== req.user!.userId),
    });

    if (!updatedBook) {
      console.error(`Failed to update book ${bookId} after return`);
      // Record is still updated, just book stats may be inconsistent
    }

    res.status(200).json({
      success: true,
      message: isOverdue
        ? `Book returned (overdue). Fine: $${fineAmount}`
        : 'Book returned successfully',
      data: {
        borrowRecord: {
          ...borrowRecord,
          returnedAt,
          status: 'returned',
          fineAmount,
          finePaid: fineAmount === 0,
        },
        isOverdue,
        fineAmount,
      },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

export function getUserBorrows(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const borrowRecords = getBorrowRecordsByUser(req.user.userId);
    const currentDate = new Date();
    const activeBorrows = borrowRecords
      .filter((r) => r.status === 'active')
      .map((record) => {
        const book = getBookById(record.bookId);
        const dueDate = new Date(record.dueDate);
        const daysLeft = Math.ceil(
          (dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...record,
          book,
          daysLeft,
          isOverdue: currentDate > dueDate,
        };
      });

    res.status(200).json({
      success: true,
      message: 'User borrow records retrieved',
      data: activeBorrows,
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve borrow records',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}
// Pay fine for overdue book
export function payFine(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const { borrowRecordId } = req.body as PayFineRequest;

    if (!borrowRecordId) {
      res.status(400).json({
        success: false,
        message: 'Borrow record ID is required',
        error: 'Missing borrow record ID',
      } as ApiResponse<null>);
      return;
    }

    // Get all borrow records and find the specific one
    const allRecords = getAllBorrowRecords();
    const borrowRecord = allRecords.find(r => r.id === borrowRecordId);

    if (!borrowRecord) {
      res.status(404).json({
        success: false,
        message: 'Borrow record not found',
        error: `No borrow record with ID ${borrowRecordId}`,
      } as ApiResponse<null>);
      return;
    }

    // Check if the record belongs to the user (unless admin)
    if (req.user.role !== 'admin' && borrowRecord.userId !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden',
        error: 'You can only pay fines for your own records',
      } as ApiResponse<null>);
      return;
    }

    // Check if there's a fine to pay
    if (!borrowRecord.fineAmount || borrowRecord.fineAmount === 0) {
      res.status(400).json({
        success: false,
        message: 'No fine to pay',
        error: 'This record has no outstanding fine',
      } as ApiResponse<null>);
      return;
    }

    // Check if fine is already paid
    if (borrowRecord.finePaid) {
      res.status(400).json({
        success: false,
        message: 'Fine already paid',
        error: 'The fine for this record has already been paid',
      } as ApiResponse<null>);
      return;
    }

    // Mark fine as paid
    updateBorrowRecord(borrowRecordId, {
      finePaid: true,
    });

    res.status(200).json({
      success: true,
      message: `Fine of $${borrowRecord.fineAmount} paid successfully`,
      data: {
        borrowRecordId,
        fineAmount: borrowRecord.fineAmount,
        finePaid: true,
      },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to pay fine',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get dashboard statistics
export function getDashboardStats(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const { readDatabase, getAllBooks } = require('../database/db.js');
    const db = readDatabase();
    const allBooks = getAllBooks();
    
    const totalBooks = allBooks.length;
    const availableBooks = allBooks.filter((b: any) => b.availableCopies > 0).length;
    const borrowedBooks = allBooks.reduce((sum: number, b: any) => sum + (b.totalCopies - b.availableCopies), 0);
    
    const activeBorrows = db.borrowRecords.filter((r: any) => r.status === 'active').length;
    const currentDate = new Date();
    const overdueBooks = db.borrowRecords.filter((r: any) => {
      if (r.status !== 'active') return false;
      const dueDate = new Date(r.dueDate);
      return currentDate > dueDate;
    }).length;
    
    const totalUsers = db.users.length;
    
    // User-specific stats
    let userStats = null;
    if (req.user.role === 'user') {
      const userBorrows = db.borrowRecords.filter((r: any) => r.userId === req.user!.userId);
      const activeUserBorrows = userBorrows.filter((r: any) => r.status === 'active');
      const overdueUserBorrows = activeUserBorrows.filter((r: any) => {
        const dueDate = new Date(r.dueDate);
        return currentDate > dueDate;
      });
      const unpaidFines = userBorrows.filter((r: any) => r.fineAmount && r.fineAmount > 0 && !r.finePaid);
      const totalFineAmount = unpaidFines.reduce((sum: number, r: any) => sum + (r.fineAmount || 0), 0);
      
      userStats = {
        totalBorrowed: userBorrows.length,
        activeBorrows: activeUserBorrows.length,
        overdueBorrows: overdueUserBorrows.length,
        unpaidFines: unpaidFines.length,
        totalFineAmount,
      };
    }

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved',
      data: {
        totalBooks,
        availableBooks,
        borrowedBooks,
        overdueBooks,
        totalUsers,
        activeBorrows,
        userStats,
      },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}
export function getBorrowHistory(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const borrowRecords = getBorrowRecordsByUser(req.user.userId);
    const history = borrowRecords.map((record) => {
      const book = getBookById(record.bookId);
      return {
        ...record,
        book,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Borrow history retrieved',
      data: history,
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve borrow history',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}
// Admin: Get all borrow records
export function getAllBorrows(req: Request, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated',
      } as ApiResponse<null>);
      return;
    }

    const borrowRecords = getAllBorrowRecords();
    const enrichedRecords = borrowRecords.map((record) => {
      const book = getBookById(record.bookId);
      const user = getUserById(record.userId);
      return {
        ...record,
        book,
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'All borrow records retrieved',
      data: enrichedRecords,
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve borrow records',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}
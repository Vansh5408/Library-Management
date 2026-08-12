import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  readDatabase,
  getUserById,
  getAllUsers,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getBorrowRecordsByUser,
} from '../database/db.js';
import { Book, ApiResponse, User, BorrowRecord } from '../models/types.js';

// Middleware to check if user is librarian
export function isLibrarian(req: Request, res: Response, next: Function): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'Authentication required',
    } as ApiResponse<null>);
    return;
  }

  if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Forbidden',
      error: 'Librarian access required',
    } as ApiResponse<null>);
    return;
  }

  next();
}

// Get all users (librarian only)
export function getAllUsersHandler(req: Request, res: Response): void {
  try {
    const users = getAllUsers();
    
    // Remove sensitive data (passwords)
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      borrowHistory: user.borrowHistory,
    }));

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: safeUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get specific user details (librarian only)
export function getUserDetailsHandler(req: Request, res: Response): void {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
        error: 'Missing user ID',
      } as ApiResponse<null>);
      return;
    }

    const user = getUserById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'No user exists with this ID',
      } as ApiResponse<null>);
      return;
    }

    // Get user's borrow records
    const borrowRecords = getBorrowRecordsByUser(userId);
    
    // Get active borrows
    const activeBorrows = borrowRecords.filter((r: BorrowRecord) => r.status === 'active');
    const returnedBooks = borrowRecords.filter((r: BorrowRecord) => r.status === 'returned');
    const overdueBooks = borrowRecords.filter((r: BorrowRecord) => r.status === 'overdue');

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        borrowHistory: user.borrowHistory,
        stats: {
          totalBorrowed: borrowRecords.length,
          currentlyBorrowed: activeBorrows.length,
          returned: returnedBooks.length,
          overdue: overdueBooks.length,
        },
        activeBorrows: activeBorrows,
        allBorrowRecords: borrowRecords,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Search users by name or email (librarian only)
export function searchUsersHandler(req: Request, res: Response): void {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: 'Missing search query',
      } as ApiResponse<null>);
      return;
    }

    const users = getAllUsers();
    const searchTerm = query.toLowerCase();
    
    const matchingUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    ).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      borrowHistory: user.borrowHistory,
    }));

    res.status(200).json({
      success: true,
      message: `Found ${matchingUsers.length} users`,
      data: matchingUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Add new book (librarian only)
export function addBookHandler(req: Request, res: Response): void {
  try {
    const { title, author, isbn, description, totalCopies, categories, publisher, publicationYear, pageCount } = req.body;

    // Validation
    if (!title || !author) {
      res.status(400).json({
        success: false,
        message: 'Title and author are required',
        error: 'Missing required fields',
      } as ApiResponse<null>);
      return;
    }

    const newBook: Book = {
      id: uuidv4(),
      title,
      author,
      isbn: isbn || '',
      description: description || '',
      available: true,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
      categories: categories || [],
      publisher: publisher || '',
      publicationYear: publicationYear || new Date().getFullYear(),
      pageCount: pageCount || 0,
    };

    addBook(newBook);

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: newBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Update book (librarian only)
export function updateBookHandler(req: Request, res: Response): void {
  try {
    const { bookId } = req.params;
    const updates = req.body;

    if (!bookId) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    const existingBook = getBookById(bookId);
    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: 'No book exists with this ID',
      } as ApiResponse<null>);
      return;
    }

    // Update allowed fields
    const updatedBook: Book = {
      ...existingBook,
      title: updates.title || existingBook.title,
      author: updates.author || existingBook.author,
      isbn: updates.isbn || existingBook.isbn,
      description: updates.description || existingBook.description,
      totalCopies: updates.totalCopies !== undefined ? updates.totalCopies : existingBook.totalCopies,
      categories: updates.categories || existingBook.categories,
      publisher: updates.publisher || existingBook.publisher,
      publicationYear: updates.publicationYear || existingBook.publicationYear,
      pageCount: updates.pageCount || existingBook.pageCount,
    };

    // Recalculate available copies if total copies changed
    if (updates.totalCopies !== undefined) {
      const borrowedCount = existingBook.totalCopies - existingBook.availableCopies;
      updatedBook.availableCopies = Math.max(0, updates.totalCopies - borrowedCount);
      updatedBook.available = updatedBook.availableCopies > 0;
    } else {
      updatedBook.availableCopies = existingBook.availableCopies;
      updatedBook.available = existingBook.available;
    }

    updateBook(bookId, updatedBook);

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Delete book (librarian only)
export function deleteBookHandler(req: Request, res: Response): void {
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

    const existingBook = getBookById(bookId);
    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: 'No book exists with this ID',
      } as ApiResponse<null>);
      return;
    }

    // Check if book is currently borrowed
    if (existingBook.borrowedBy.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete book that is currently borrowed',
        error: 'Book has active borrows',
      } as ApiResponse<null>);
      return;
    }

    deleteBook(bookId);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get library statistics (librarian only)
export function getLibraryStatsHandler(req: Request, res: Response): void {
  try {
    const db = readDatabase();
    const users = db.users.filter((u: User) => u.role === 'user');
    const books = db.books;
    const borrowRecords = db.borrowRecords || [];

    const totalBooks = books.length;
    const availableBooks = books.filter((b: Book) => b.available).length;
    const borrowedBooks = books.filter((b: Book) => !b.available || b.borrowedBy.length > 0).length;
    
    const activeBorrows = borrowRecords.filter((r: BorrowRecord) => r.status === 'active').length;
    const overdueRecords = borrowRecords.filter((r: BorrowRecord) => r.status === 'overdue').length;
    
    const totalCopies = books.reduce((sum: number, book: Book) => sum + book.totalCopies, 0);
    const availableCopies = books.reduce((sum: number, book: Book) => sum + book.availableCopies, 0);

    res.status(200).json({
      success: true,
      message: 'Library statistics retrieved',
      data: {
        users: {
          total: users.length,
          active: users.filter((u: User) => u.borrowHistory.length > 0).length,
        },
        books: {
          totalTitles: totalBooks,
          totalCopies: totalCopies,
          availableCopies: availableCopies,
          borrowedCopies: totalCopies - availableCopies,
        },
        borrows: {
          active: activeBorrows,
          overdue: overdueRecords,
          total: borrowRecords.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

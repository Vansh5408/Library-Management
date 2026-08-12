import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllBooks, getBookById, addBook, updateBook, deleteBook } from '../database/db.js';
import { ApiResponse, Book } from '../models/types.js';

export function getBooks(req: Request, res: Response): void {
  try {
    const books = getAllBooks();

    res.status(200).json({
      success: true,
      message: 'Books retrieved successfully',
      data: books,
    } as ApiResponse<Book[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

export function getBook(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    const book = getBookById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${id}`,
      } as ApiResponse<null>);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Book retrieved successfully',
      data: book,
    } as ApiResponse<Book>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

export function getAvailableBooks(req: Request, res: Response): void {
  try {
    const books = getAllBooks();
    const availableBooks = books.filter((book) => book.availableCopies > 0);

    res.status(200).json({
      success: true,
      message: 'Available books retrieved successfully',
      data: availableBooks,
    } as ApiResponse<Book[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available books',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

export function searchBooks(req: Request, res: Response): void {
  try {
    const { query, filter, sort, page = '1', pageSize = '50' } = req.query;

    let books = getAllBooks();

    // Search by query
    if (query && typeof query === 'string') {
      const searchQuery = query.toLowerCase();
      books = books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery) ||
          book.author.toLowerCase().includes(searchQuery) ||
          book.isbn.includes(searchQuery) ||
          book.description.toLowerCase().includes(searchQuery)
      );
    }

    // Filter by availability
    if (filter === 'available') {
      books = books.filter((book) => book.availableCopies > 0);
    } else if (filter === 'borrowed') {
      books = books.filter((book) => book.availableCopies < book.totalCopies);
    } else if (filter === 'unavailable') {
      books = books.filter((book) => book.availableCopies === 0);
    }

    // Sort books
    if (sort === 'title') {
      books.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'author') {
      books.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sort === 'availability') {
      books.sort((a, b) => b.availableCopies - a.availableCopies);
    } else if (sort === 'newest') {
      books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * size;
    const endIndex = startIndex + size;
    const paginatedBooks = books.slice(startIndex, endIndex);
    const totalPages = Math.ceil(books.length / size);

    res.status(200).json({
      success: true,
      message: 'Search completed',
      data: {
        books: paginatedBooks,
        total: books.length,
        page: pageNum,
        totalPages: totalPages,
      },
    } as ApiResponse<{ books: Book[]; total: number; page: number; totalPages: number }>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

export function getBookStats(req: Request, res: Response): void {
  try {
    const books = getAllBooks();

    const stats = {
      totalBooks: books.length,
      totalCopies: books.reduce((sum, book) => sum + book.totalCopies, 0),
      availableCopies: books.reduce((sum, book) => sum + book.availableCopies, 0),
      borrowedCopies: books.reduce(
        (sum, book) => sum + (book.totalCopies - book.availableCopies),
        0
      ),
    };

    res.status(200).json({
      success: true,
      message: 'Book statistics retrieved',
      data: stats,
    } as ApiResponse<typeof stats>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Admin: Add a new book
export function createBook(req: Request, res: Response): void {
  try {
    const { title, author, isbn, description, totalCopies } = req.body;

    // Validation
    if (!title || !author || !isbn || !description || totalCopies === undefined) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
        error: 'Missing required fields',
      } as ApiResponse<null>);
      return;
    }

    // Sanitize and validate inputs
    const sanitizedTitle = String(title).trim().substring(0, 500);
    const sanitizedAuthor = String(author).trim().substring(0, 300);
    const sanitizedISBN = String(isbn).trim().substring(0, 50);
    const sanitizedDescription = String(description).trim().substring(0, 5000);

    if (sanitizedTitle.length === 0 || sanitizedAuthor.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Title and author cannot be empty',
        error: 'Invalid input',
      } as ApiResponse<null>);
      return;
    }

    // Validate totalCopies
    if (totalCopies < 0 || !Number.isInteger(totalCopies) || totalCopies > 10000) {
      res.status(400).json({
        success: false,
        message: 'Total copies must be a non-negative integer (max 10000)',
        error: 'Invalid totalCopies value',
      } as ApiResponse<null>);
      return;
    }

    // Validate ISBN format (basic check)
    const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
    if (isbn && !isbnRegex.test(isbn.replace(/[- ]/g, ''))) {
      console.warn(`Invalid ISBN format: ${isbn}`);
      // Don't reject, just warn - some external sources may have non-standard ISBNs
    }

    // Check if ISBN already exists
    const existingBook = getAllBooks().find((b) => b.isbn === isbn);
    if (existingBook) {
      res.status(409).json({
        success: false,
        message: 'A book with this ISBN already exists',
        error: 'ISBN already in use',
      } as ApiResponse<null>);
      return;
    }

    // Create book
    const newBook: Book = {
      id: uuidv4(),
      title: sanitizedTitle,
      author: sanitizedAuthor,
      isbn: sanitizedISBN,
      description: sanitizedDescription,
      available: totalCopies > 0,
      totalCopies,
      availableCopies: totalCopies,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    };

    addBook(newBook);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: newBook,
    } as ApiResponse<Book>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Admin: Update a book
export function editBook(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { title, author, isbn, description, totalCopies } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    // Validate and sanitize inputs if provided
    const sanitizedTitle = title ? String(title).trim().substring(0, 500) : undefined;
    const sanitizedAuthor = author ? String(author).trim().substring(0, 300) : undefined;
    const sanitizedISBN = isbn ? String(isbn).trim().substring(0, 50) : undefined;
    const sanitizedDescription = description ? String(description).trim().substring(0, 5000) : undefined;

    if (sanitizedTitle !== undefined && sanitizedTitle.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Title cannot be empty',
        error: 'Invalid input',
      } as ApiResponse<null>);
      return;
    }

    if (sanitizedAuthor !== undefined && sanitizedAuthor.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Author cannot be empty',
        error: 'Invalid input',
      } as ApiResponse<null>);
      return;
    }

    // Get existing book
    const existingBook = getBookById(id);
    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${id}`,
      } as ApiResponse<null>);
      return;
    }

    // Validate totalCopies if provided
    if (totalCopies !== undefined && (totalCopies < 0 || !Number.isInteger(totalCopies) || totalCopies > 10000)) {
      res.status(400).json({
        success: false,
        message: 'Total copies must be a non-negative integer (max 10000)',
        error: 'Invalid totalCopies value',
      } as ApiResponse<null>);
      return;
    }

    // Calculate borrowed count
    const borrowedCount = existingBook.totalCopies - existingBook.availableCopies;
    
    // If reducing totalCopies, ensure it's not less than borrowed count
    if (totalCopies !== undefined && totalCopies < borrowedCount) {
      res.status(400).json({
        success: false,
        message: 'Cannot reduce total copies below borrowed count',
        error: `Currently ${borrowedCount} copies are borrowed`,
      } as ApiResponse<null>);
      return;
    }

    // Check if new ISBN is already in use by another book
    if (sanitizedISBN && sanitizedISBN !== existingBook.isbn) {
      const conflictingBook = getAllBooks().find((b) => b.isbn === sanitizedISBN && b.id !== id);
      if (conflictingBook) {
        res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists',
          error: 'ISBN already in use',
        } as ApiResponse<null>);
        return;
      }
    }

    // Calculate available copies if totalCopies changed
    let availableCopies = existingBook.availableCopies;
    if (totalCopies !== undefined && totalCopies !== existingBook.totalCopies) {
      const borrowedCount = existingBook.totalCopies - existingBook.availableCopies;
      // New available copies = new total - currently borrowed
      availableCopies = Math.max(0, totalCopies - borrowedCount);
    }

    // Update book with sanitized values
    const updatedBook = updateBook(id, {
      title: sanitizedTitle !== undefined ? sanitizedTitle : existingBook.title,
      author: sanitizedAuthor !== undefined ? sanitizedAuthor : existingBook.author,
      isbn: sanitizedISBN !== undefined ? sanitizedISBN : existingBook.isbn,
      description: sanitizedDescription !== undefined ? sanitizedDescription : existingBook.description,
      totalCopies: totalCopies !== undefined ? totalCopies : existingBook.totalCopies,
      availableCopies: Math.max(0, availableCopies),
      available: availableCopies > 0,
    });

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    } as ApiResponse<Book>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Admin: Delete a book
export function removeBook(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    // Check if book exists
    const book = getBookById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${id}`,
      } as ApiResponse<null>);
      return;
    }

    // Delete book
    const deleted = deleteBook(id);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Book deleted successfully',
        data: { id },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete book',
        error: 'Unknown error',
      } as ApiResponse<null>);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}


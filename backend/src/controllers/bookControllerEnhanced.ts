import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  getAllBooksFromPartitions, 
  searchBooksInPartitions, 
  getBookFromPartitions,
  addBookToPartition,
  updateBookInPartition,
  deleteBookFromPartition,
  getPartitionStats
} from '../database/partitions.js';
import { uploadPDF } from '../database/pdfs.js';
import { ApiResponse, Book } from '../models/types.js';

// Extended Request type for multer file uploads
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Get paginated books with partition support
export function getBooks(req: Request, res: Response): void {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const result = getAllBooksFromPartitions(page, pageSize);

    res.status(200).json({
      success: true,
      message: 'Books retrieved successfully',
      data: result.books,
      pagination: {
        page: result.page,
        pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    } as ApiResponse<Book[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get single book
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

    const book = getBookFromPartitions(id);

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

// Get available books
export function getAvailableBooks(req: Request, res: Response): void {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const result = getAllBooksFromPartitions(page, pageSize);
    const availableBooks = result.books.filter((book) => book.availableCopies > 0);

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

// Search books with partition support
export function searchBooks(req: Request, res: Response): void {
  try {
    const { query, author, isbn, title, filter, sort, page = '1', pageSize = '50' } = req.query;

    let books: Book[] = [];

    // Search by title
    if (title && typeof title === 'string') {
      const sanitizedTitle = title.trim().substring(0, 200); // Limit length
      books = searchBooksInPartitions(sanitizedTitle, 'title');
    } 
    // Search by author
    else if (author && typeof author === 'string') {
      const sanitizedAuthor = author.trim().substring(0, 200);
      books = searchBooksInPartitions(sanitizedAuthor, 'author');
    } 
    // Search by ISBN
    else if (isbn && typeof isbn === 'string') {
      const sanitizedISBN = isbn.trim().substring(0, 50);
      books = searchBooksInPartitions(sanitizedISBN, 'isbn');
    }
    // General query search
    else if (query && typeof query === 'string') {
      const sanitizedQuery = query.trim().substring(0, 200);
      const titleResults = searchBooksInPartitions(sanitizedQuery, 'title');
      const authorResults = searchBooksInPartitions(sanitizedQuery, 'author');
      
      // Merge and deduplicate
      const bookMap = new Map<string, Book>();
      [...titleResults, ...authorResults].forEach(book => {
        bookMap.set(book.id, book);
      });
      books = Array.from(bookMap.values());
    } else {
      // Get all books if no search criteria
      const result = getAllBooksFromPartitions(1, 1000);
      books = result.books;
    }

    // Filter by availability
    if (filter === 'available') {
      books = books.filter((book) => book.availableCopies > 0);
    } else if (filter === 'borrowed') {
      books = books.filter((book) => book.availableCopies < book.totalCopies);
    } else if (filter === 'unavailable') {
      books = books.filter((book) => book.availableCopies === 0);
    } else if (filter === 'with-pdf') {
      books = books.filter((book) => book.pdfUrl);
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
    } else if (sort === 'rating') {
      books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 50;
    const start = (pageNum - 1) * size;
    const paginatedBooks = books.slice(start, start + size);

    res.status(200).json({
      success: true,
      message: 'Search completed',
      data: paginatedBooks,
      pagination: {
        page: pageNum,
        pageSize: size,
        total: books.length,
        totalPages: Math.ceil(books.length / size),
      },
    } as ApiResponse<Book[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get book statistics
export function getBookStats(req: Request, res: Response): void {
  try {
    const partitionStats = getPartitionStats();
    
    // If we have partitions, calculate stats efficiently
    if (partitionStats.totalBooks > 0) {
      // Load a larger sample for better accuracy (up to 5000 books)
      const sampleSize = Math.min(5000, partitionStats.totalBooks);
      const result = getAllBooksFromPartitions(1, sampleSize);
      const sampleBooks = result.books;
      
      if (sampleBooks.length === 0) {
        res.status(200).json({
          success: true,
          message: 'Book statistics retrieved',
          data: {
            totalBooks: partitionStats.totalBooks,
            totalCopies: 0,
            availableCopies: 0,
            borrowedCopies: 0,
            booksWithPDF: 0,
            partitions: partitionStats.totalPartitions,
          },
        } as ApiResponse<any>);
        return;
      }
      
      const availableInSample = sampleBooks.reduce((sum, book) => sum + book.availableCopies, 0);
      const totalInSample = sampleBooks.reduce((sum, book) => sum + book.totalCopies, 0);
      const booksWithPDF = sampleBooks.filter(b => b.pdfUrl).length;
      
      // Use actual count if sample size matches total, otherwise extrapolate
      const ratio = sampleBooks.length < result.total ? result.total / sampleBooks.length : 1;
      
      const stats = {
        totalBooks: result.total,
        totalCopies: ratio === 1 ? totalInSample : Math.round(totalInSample * ratio),
        availableCopies: ratio === 1 ? availableInSample : Math.round(availableInSample * ratio),
        borrowedCopies: ratio === 1 ? (totalInSample - availableInSample) : Math.round((totalInSample - availableInSample) * ratio),
        booksWithPDF: ratio === 1 ? booksWithPDF : Math.round(booksWithPDF * ratio),
        partitions: partitionStats.totalPartitions,
        estimated: ratio > 1, // Flag to indicate if stats are estimated
      };
      
      res.status(200).json({
        success: true,
        message: 'Book statistics retrieved',
        data: stats,
      } as ApiResponse<typeof stats>);
      return;
    }
    
    // Fallback for small datasets
    const result = getAllBooksFromPartitions(1, 10000);
    const books = result.books;

    const stats = {
      totalBooks: result.total,
      totalCopies: books.reduce((sum, book) => sum + book.totalCopies, 0),
      availableCopies: books.reduce((sum, book) => sum + book.availableCopies, 0),
      borrowedCopies: books.reduce(
        (sum, book) => sum + (book.totalCopies - book.availableCopies),
        0
      ),
      booksWithPDF: books.filter(b => b.pdfUrl).length,
      partitions: partitionStats.totalPartitions,
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

// Create new book (admin)
export function createBook(req: Request, res: Response): void {
  try {
    const { 
      title, 
      author, 
      isbn, 
      description, 
      totalCopies,
      publisher,
      publicationYear,
      pageCount,
      categories,
      coverImage
    } = req.body;

    // Validation
    if (!title || !author || !isbn || !description || totalCopies === undefined) {
      res.status(400).json({
        success: false,
        message: 'Title, author, ISBN, description, and totalCopies are required',
        error: 'Missing required fields',
      } as ApiResponse<null>);
      return;
    }

    // Validate totalCopies
    if (totalCopies < 0 || !Number.isInteger(totalCopies)) {
      res.status(400).json({
        success: false,
        message: 'Total copies must be a non-negative integer',
        error: 'Invalid totalCopies value',
      } as ApiResponse<null>);
      return;
    }

    // Check if ISBN already exists
    const existingBooks = searchBooksInPartitions(isbn, 'isbn');
    if (existingBooks.length > 0) {
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
      title,
      author,
      isbn,
      description,
      available: totalCopies > 0,
      totalCopies,
      availableCopies: totalCopies,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
      publisher,
      publicationYear,
      pageCount,
      categories: categories || [],
      coverImage,
    };

    // Add to partition
    addBookToPartition(newBook);

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

// Update book (admin)
export function updateBookHandler(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Book ID is required',
        error: 'Missing book ID',
      } as ApiResponse<null>);
      return;
    }

    const existingBook = getBookFromPartitions(id);
    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${id}`,
      } as ApiResponse<null>);
      return;
    }

    // Update book
    const updatedBook = { ...existingBook, ...updateData, id, createdAt: existingBook.createdAt };
    const success = updateBookInPartition(updatedBook);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        data: updatedBook,
      } as ApiResponse<Book>);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update book',
        error: 'Update operation failed',
      } as ApiResponse<null>);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Delete book (admin)
export function deleteBookHandler(req: Request, res: Response): void {
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

    const success = deleteBookFromPartition(id);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Book deleted successfully',
        data: { id },
      } as ApiResponse<{ id: string }>);
    } else {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${id}`,
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

// Upload PDF for book (admin)
export function uploadBookPDF(req: MulterRequest, res: Response): void {
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

    const book = getBookFromPartitions(id);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
        error: `No book with ID ${id}`,
      } as ApiResponse<null>);
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No PDF file provided',
        error: 'PDF file is required',
      } as ApiResponse<null>);
      return;
    }

    const pdfResult = uploadPDF(id, req.file.buffer, req.file.originalname);
    
    if (!pdfResult) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload PDF',
        error: 'PDF upload failed',
      } as ApiResponse<null>);
      return;
    }

    // Update book with PDF URL
    book.pdfUrl = pdfResult.pdfUrl;
    updateBookInPartition(book);

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        bookId: id,
        pdfUrl: pdfResult.pdfUrl,
        pdfId: pdfResult.pdfId,
      },
    } as ApiResponse<{ bookId: string; pdfUrl: string; pdfId: string }>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload PDF',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database, User, Book, BorrowRecord, Reservation } from '../models/types.js';
import { 
  getBookFromPartitions, 
  updateBookInPartition, 
  getAllBooksFromPartitions,
  searchBooksInPartitions 
} from './partitions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'library.json');

const defaultDatabase: Database = {
  users: [],
  books: [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0743273565',
      description: 'A classic novel set in the Jazz Age.',
      available: true,
      totalCopies: 3,
      availableCopies: 3,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0061120084',
      description: 'A gripping tale of racial injustice and childhood innocence.',
      available: true,
      totalCopies: 2,
      availableCopies: 2,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0451524935',
      description: 'A dystopian novel about totalitarianism.',
      available: true,
      totalCopies: 2,
      availableCopies: 1,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0141439518',
      description: 'A romantic novel about love and social status.',
      available: true,
      totalCopies: 3,
      availableCopies: 3,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '978-0316769174',
      description: 'A story of teenage rebellion and alienation.',
      available: true,
      totalCopies: 2,
      availableCopies: 2,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '6',
      title: 'Brave New World',
      author: 'Aldous Huxley',
      isbn: '978-0060080723',
      description: 'A futuristic novel about a controlled society.',
      available: true,
      totalCopies: 2,
      availableCopies: 2,
      borrowedBy: [],
      createdAt: new Date().toISOString(),
    },
  ],
  borrowRecords: [],
  reservations: [],
};

// Initialize database file if it doesn't exist
export function initializeDatabase(): void {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDatabase, null, 2));
  }
}

// Read database
export function readDatabase(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    
    // Validate database structure
    if (!db.users || !Array.isArray(db.users)) {
      console.error('Invalid database structure: users array missing');
      throw new Error('Invalid database structure');
    }
    if (!db.books || !Array.isArray(db.books)) {
      console.error('Invalid database structure: books array missing');
      throw new Error('Invalid database structure');
    }
    if (!db.borrowRecords || !Array.isArray(db.borrowRecords)) {
      console.error('Invalid database structure: borrowRecords array missing');
      db.borrowRecords = [];
    }
    if (!db.reservations || !Array.isArray(db.reservations)) {
      db.reservations = [];
    }
    
    return db;
  } catch (error) {
    console.error('Error reading database, attempting backup recovery...');
    
    // Try to read from backup
    const backupPath = DB_PATH + '.backup';
    if (fs.existsSync(backupPath)) {
      try {
        const backupData = fs.readFileSync(backupPath, 'utf-8');
        const db = JSON.parse(backupData);
        console.log('Database recovered from backup');
        // Restore the main database file
        fs.copyFileSync(backupPath, DB_PATH);
        return db;
      } catch (backupError) {
        console.error('Backup recovery failed:', backupError);
      }
    }
    
    // Last resort: initialize with defaults
    console.error('Initializing with default database');
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDatabase, null, 2));
    return defaultDatabase;
  }
}

// Write database with backup
export function writeDatabase(data: Database): void {
  try {
    // Create backup before writing
    if (fs.existsSync(DB_PATH)) {
      const backupPath = DB_PATH + '.backup';
      fs.copyFileSync(DB_PATH, backupPath);
    }
    
    // Write new data
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_PATH, jsonData);
  } catch (error) {
    console.error('Failed to write database:', error);
    // Try to restore from backup
    const backupPath = DB_PATH + '.backup';
    if (fs.existsSync(backupPath)) {
      console.log('Attempting to restore from backup...');
      try {
        fs.copyFileSync(backupPath, DB_PATH);
        console.log('Database restored from backup');
      } catch (restoreError) {
        console.error('Failed to restore from backup:', restoreError);
      }
    }
    throw error;
  }
}

// Get all users
export function getAllUsers(): User[] {
  const db = readDatabase();
  return db.users;
}

// Get user by ID
export function getUserById(id: string): User | undefined {
  const db = readDatabase();
  return db.users.find((u) => u.id === id);
}

// Get user by email
export function getUserByEmail(email: string): User | undefined {
  const db = readDatabase();
  return db.users.find((u) => u.email === email);
}

// Add user
export function addUser(user: User): User {
  const db = readDatabase();
  db.users.push(user);
  writeDatabase(db);
  return user;
}

// Update user
export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === id);
  if (user) {
    Object.assign(user, updates);
    writeDatabase(db);
  }
  return user;
}

// Get all books - Now uses partitions for large dataset
export function getAllBooks(): Book[] {
  // First try partitions (for 100K+ books)
  const partitionResult = getAllBooksFromPartitions(1, 100000);
  if (partitionResult.total > 0) {
    return partitionResult.books;
  }
  // Fallback to library.json for backward compatibility
  const db = readDatabase();
  return db.books;
}

// Get book by ID - Now checks both partitions and library.json
export function getBookById(id: string): Book | undefined {
  // First check partitions
  const partitionBook = getBookFromPartitions(id);
  if (partitionBook) {
    return partitionBook;
  }
  // Fallback to library.json
  const db = readDatabase();
  return db.books.find((b) => b.id === id);
}

// Get book by ISBN - Now checks both partitions and library.json
export function getBookByISBN(isbn: string): Book | undefined {
  // First check partitions
  const partitionBooks = searchBooksInPartitions(isbn, 'isbn');
  if (partitionBooks.length > 0) {
    return partitionBooks[0];
  }
  // Fallback to library.json
  const db = readDatabase();
  return db.books.find((b) => b.isbn === isbn);
}

// Add book
export function addBook(book: Book): Book {
  const db = readDatabase();
  db.books.push(book);
  writeDatabase(db);
  return book;
}

// Update book - Now updates in partitions or library.json
export function updateBook(id: string, updates: Partial<Book>): Book | undefined {
  // First try to get from partitions
  const partitionBook = getBookFromPartitions(id);
  if (partitionBook) {
    const updatedBook = { ...partitionBook, ...updates };
    // Ensure availability flag is consistent with availableCopies
    if (updatedBook.availableCopies !== undefined) {
      updatedBook.available = updatedBook.availableCopies > 0;
    }
    // Ensure borrowedBy array consistency
    if (updatedBook.availableCopies !== undefined && updatedBook.totalCopies !== undefined) {
      const expectedBorrowedCount = updatedBook.totalCopies - updatedBook.availableCopies;
      if (updatedBook.borrowedBy && updatedBook.borrowedBy.length !== expectedBorrowedCount) {
        // Keep most recent borrows if array is longer
        updatedBook.borrowedBy = updatedBook.borrowedBy.slice(0, expectedBorrowedCount);
      }
    }
    updateBookInPartition(updatedBook);
    return updatedBook;
  }
  // Fallback to library.json
  const db = readDatabase();
  const book = db.books.find((b) => b.id === id);
  if (book) {
    Object.assign(book, updates);
    // Ensure availability flag is consistent with availableCopies
    if (book.availableCopies !== undefined) {
      book.available = book.availableCopies > 0;
    }
    // Ensure borrowedBy array consistency
    if (book.availableCopies !== undefined && book.totalCopies !== undefined) {
      const expectedBorrowedCount = book.totalCopies - book.availableCopies;
      if (book.borrowedBy && book.borrowedBy.length !== expectedBorrowedCount) {
        // Keep most recent borrows if array is longer
        book.borrowedBy = book.borrowedBy.slice(0, expectedBorrowedCount);
      }
    }
    writeDatabase(db);
  }
  return book;
}

// Delete book
export function deleteBook(id: string): boolean {
  const db = readDatabase();
  const index = db.books.findIndex((b) => b.id === id);
  if (index !== -1) {
    db.books.splice(index, 1);
    writeDatabase(db);
    return true;
  }
  return false;
}

// Add borrow record
export function addBorrowRecord(record: BorrowRecord): BorrowRecord {
  const db = readDatabase();
  db.borrowRecords.push(record);
  writeDatabase(db);
  return record;
}

// Get borrow records by user
export function getBorrowRecordsByUser(userId: string): BorrowRecord[] {
  const db = readDatabase();
  return db.borrowRecords.filter((r) => r.userId === userId);
}

// Get borrow records by book
export function getBorrowRecordsByBook(bookId: string): BorrowRecord[] {
  const db = readDatabase();
  return db.borrowRecords.filter((r) => r.bookId === bookId);
}

// Get active borrow record
export function getActiveBorrowRecord(userId: string, bookId: string): BorrowRecord | undefined {
  const db = readDatabase();
  return db.borrowRecords.find(
    (r) => r.userId === userId && r.bookId === bookId && r.status === 'active'
  );
}

// Update borrow record
export function updateBorrowRecord(
  id: string,
  updates: Partial<BorrowRecord>
): BorrowRecord | undefined {
  try {
    const db = readDatabase();
    const record = db.borrowRecords.find((r) => r.id === id);
    if (record) {
      Object.assign(record, updates);
      writeDatabase(db);
    }
    return record;
  } catch (error) {
    console.error(`Failed to update borrow record ${id}:`, error);
    throw error;
  }
}

// Get all borrow records
export function getAllBorrowRecords(): BorrowRecord[] {
  const db = readDatabase();
  return db.borrowRecords;
}

// ==================== RESERVATION FUNCTIONS ====================

// Add reservation
export function addReservation(reservation: Reservation): Reservation {
  const db = readDatabase();
  if (!db.reservations) {
    db.reservations = [];
  }
  db.reservations.push(reservation);
  writeDatabase(db);
  return reservation;
}

// Get all reservations
export function getAllReservations(): Reservation[] {
  const db = readDatabase();
  return db.reservations || [];
}

// Get reservations by user
export function getReservationsByUser(userId: string): Reservation[] {
  const db = readDatabase();
  return (db.reservations || []).filter((r) => r.userId === userId);
}

// Get reservations by book
export function getReservationsByBook(bookId: string): Reservation[] {
  const db = readDatabase();
  return (db.reservations || []).filter((r) => r.bookId === bookId);
}

// Get active reservation for user and book
export function getActiveReservation(userId: string, bookId: string): Reservation | undefined {
  const db = readDatabase();
  return (db.reservations || []).find(
    (r) => r.userId === userId && r.bookId === bookId && r.status === 'pending'
  );
}

// Get pending reservations for a book (ordered by position)
export function getPendingReservationsForBook(bookId: string): Reservation[] {
  const db = readDatabase();
  return (db.reservations || [])
    .filter((r) => r.bookId === bookId && r.status === 'pending')
    .sort((a, b) => a.position - b.position);
}

// Update reservation
export function updateReservation(
  id: string,
  updates: Partial<Reservation>
): Reservation | undefined {
  const db = readDatabase();
  if (!db.reservations) {
    db.reservations = [];
  }
  const reservation = db.reservations.find((r) => r.id === id);
  if (reservation) {
    Object.assign(reservation, updates);
    writeDatabase(db);
  }
  return reservation;
}

// Get next reservation position for a book
export function getNextReservationPosition(bookId: string): number {
  const pendingReservations = getPendingReservationsForBook(bookId);
  if (pendingReservations.length === 0) return 1;
  return Math.max(...pendingReservations.map((r) => r.position)) + 1;
}

// Cancel reservation
export function cancelReservation(id: string): boolean {
  const db = readDatabase();
  if (!db.reservations) return false;

  const reservation = db.reservations.find((r) => r.id === id);
  if (reservation) {
    reservation.status = 'cancelled';

    // Reorder remaining reservations for this book
    const pendingReservations = db.reservations
      .filter((r) => r.bookId === reservation.bookId && r.status === 'pending' && r.id !== id)
      .sort((a, b) => a.position - b.position);

    pendingReservations.forEach((r, index) => {
      r.position = index + 1;
    });

    writeDatabase(db);
    return true;
  }
  return false;
}

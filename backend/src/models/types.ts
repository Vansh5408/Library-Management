export type UserRole = 'admin' | 'user' | 'librarian';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole; // 'admin' or 'user'
  createdAt: string;
  borrowHistory: string[]; // array of book IDs
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  borrowedBy: Array<{
    userId: string;
    borrowedAt: string;
    dueDate: string;
  }>;
  createdAt: string;
  pdfUrl?: string; // URL to PDF file
  pageCount?: number;
  publicationYear?: number;
  publisher?: string;
  categories?: string[];
  coverImage?: string;
  rating?: number;
}

export interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
  fineAmount?: number;
  finePaid?: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservedAt: string;
  expiresAt: string;
  status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
  notified: boolean;
  position: number; // Position in queue
}

export interface PartitionMetadata {
  partitionId: string;
  startId: string;
  endId: string;
  totalBooks: number;
  createdAt: string;
  lastModified: string;
}

export interface BookSearchIndex {
  title: Map<string, string[]>;
  author: Map<string, string[]>;
  isbn: Map<string, string>;
  categories: Map<string, string[]>;
}

export interface Database {
  users: User[];
  books: Book[];
  borrowRecords: BorrowRecord[];
  reservations: Reservation[];
  partitionMetadata?: PartitionMetadata[];
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'user'; // Only 'user' role allowed via public registration
  // REMOVED: librarianCode - admin/librarian accounts created via script only
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface BorrowBookRequest {
  bookId: string;
}

export interface PayFineRequest {
  borrowRecordId: string;
}

export interface ReserveBookRequest {
  bookId: string;
}

export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalUsers: number;
  activeBorrows: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

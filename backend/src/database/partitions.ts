import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Book, PartitionMetadata } from '../models/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PARTITIONS_DIR = path.join(__dirname, 'partitions');
const PARTITION_SIZE = 10000; // Each partition holds 10,000 books
const METADATA_FILE = path.join(PARTITIONS_DIR, 'metadata.json');

// Initialize partitions directory
export function initializePartitions(): void {
  if (!fs.existsSync(PARTITIONS_DIR)) {
    fs.mkdirSync(PARTITIONS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2));
  }
}

// Get all partition metadata
export function getPartitionMetadata(): PartitionMetadata[] {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(METADATA_FILE, 'utf-8');
    return JSON.parse(data) as PartitionMetadata[];
  } catch (error) {
    console.error('Error reading partition metadata:', error);
    return [];
  }
}

// Save partition metadata
function savePartitionMetadata(metadata: PartitionMetadata[]): void {
  try {
    // Create backup
    if (fs.existsSync(METADATA_FILE)) {
      const backupPath = METADATA_FILE + '.backup';
      fs.copyFileSync(METADATA_FILE, backupPath);
    }
    
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Failed to save partition metadata:', error);
    
    // Try to restore from backup
    const backupPath = METADATA_FILE + '.backup';
    if (fs.existsSync(backupPath)) {
      console.log('Restoring metadata from backup...');
      try {
        fs.copyFileSync(backupPath, METADATA_FILE);
      } catch (restoreError) {
        console.error('Failed to restore metadata:', restoreError);
      }
    }
    throw error;
  }
}

// Get books from a specific partition
export function getBooksFromPartition(partitionId: string): Book[] {
  try {
    const partitionPath = path.join(PARTITIONS_DIR, `${partitionId}.json`);
    if (!fs.existsSync(partitionPath)) {
      return [];
    }
    const data = fs.readFileSync(partitionPath, 'utf-8');
    const partition = JSON.parse(data) as { books: Book[] };
    return Array.isArray(partition.books) ? partition.books : [];
  } catch (error) {
    console.error(`Error reading partition ${partitionId}:`, error);
    return [];
  }
}

// Save books to a partition
function saveBooksToPartition(partitionId: string, books: Book[]): void {
  try {
    const partitionPath = path.join(PARTITIONS_DIR, `${partitionId}.json`);
    const partition = { books: Array.isArray(books) ? books : [] };
    fs.writeFileSync(partitionPath, JSON.stringify(partition, null, 2));
  } catch (error) {
    console.error(`Error saving partition ${partitionId}:`, error);
    throw error; // Re-throw to handle at higher level
  }
}

// Get or create partition for a book ID
function getPartitionIdForBook(bookId: string, totalBooks: number): string {
  const bookIndex = parseInt(bookId) || 0;
  const partitionIndex = Math.floor(bookIndex / PARTITION_SIZE);
  return `partition_${partitionIndex}`;
}

// Add book to appropriate partition
export function addBookToPartition(book: Book): void {
  const metadata = getPartitionMetadata();
  const partitionId = getPartitionIdForBook(book.id, metadata.length * PARTITION_SIZE);
  
  const books = getBooksFromPartition(partitionId);
  books.push(book);
  saveBooksToPartition(partitionId, books);
  
  // Update metadata
  let partitionMeta = metadata.find(m => m.partitionId === partitionId);
  if (!partitionMeta) {
    partitionMeta = {
      partitionId,
      startId: book.id,
      endId: book.id,
      totalBooks: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    metadata.push(partitionMeta);
  } else {
    partitionMeta.endId = book.id;
    partitionMeta.totalBooks = books.length;
    partitionMeta.lastModified = new Date().toISOString();
  }
  
  savePartitionMetadata(metadata);
}

// Search across all partitions
export function searchBooksInPartitions(
  query: string,
  field: 'title' | 'author' | 'isbn' | 'description' = 'title'
): Book[] {
  const metadata = getPartitionMetadata();
  const results: Book[] = [];
  const searchQuery = query.toLowerCase();
  
  for (const meta of metadata) {
    const books = getBooksFromPartition(meta.partitionId);
    const filtered = books.filter(book => {
      if (field === 'isbn') {
        return book.isbn.includes(searchQuery);
      }
      const fieldValue = book[field as keyof Book];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchQuery);
      }
      return false;
    });
    results.push(...filtered);
  }
  
  return results;
}

// Get book by ID across partitions
export function getBookFromPartitions(bookId: string): Book | null {
  const metadata = getPartitionMetadata();
  
  for (const meta of metadata) {
    const books = getBooksFromPartition(meta.partitionId);
    const book = books.find(b => b.id === bookId);
    if (book) return book;
  }
  
  return null;
}

// Get all books across partitions with pagination
export function getAllBooksFromPartitions(page: number = 1, pageSize: number = 50): {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
} {
  const metadata = getPartitionMetadata();
  
  // Calculate total books from metadata
  const total = metadata.reduce((sum, m) => sum + m.totalBooks, 0);
  
  if (total === 0) {
    return { books: [], total: 0, page, totalPages: 0 };
  }
  
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Load only necessary partitions
  const allBooks: Book[] = [];
  let currentIndex = 0;
  
  for (const meta of metadata) {
    const partitionStartIndex = currentIndex;
    const partitionEndIndex = currentIndex + meta.totalBooks;
    
    // Skip partitions that are before our start index
    if (partitionEndIndex <= startIndex) {
      currentIndex = partitionEndIndex;
      continue;
    }
    
    // Stop loading if we've passed our end index
    if (partitionStartIndex >= endIndex) {
      break;
    }
    
    // Load this partition
    const books = getBooksFromPartition(meta.partitionId);
    allBooks.push(...books);
    currentIndex = partitionEndIndex;
  }
  
  // Slice to get exact page
  const paginatedBooks = allBooks.slice(
    Math.max(0, startIndex - (currentIndex - allBooks.length)),
    Math.max(0, endIndex - (currentIndex - allBooks.length))
  );
  
  return {
    books: paginatedBooks,
    total,
    page,
    totalPages,
  };
}

// Update book in partition
export function updateBookInPartition(book: Book): boolean {
  const metadata = getPartitionMetadata();
  
  for (const meta of metadata) {
    const books = getBooksFromPartition(meta.partitionId);
    const index = books.findIndex(b => b.id === book.id);
    
    if (index !== -1) {
      books[index] = book;
      saveBooksToPartition(meta.partitionId, books);
      return true;
    }
  }
  
  return false;
}

// Delete book from partition
export function deleteBookFromPartition(bookId: string): boolean {
  const metadata = getPartitionMetadata();
  
  for (const meta of metadata) {
    const books = getBooksFromPartition(meta.partitionId);
    const index = books.findIndex(b => b.id === bookId);
    
    if (index !== -1) {
      books.splice(index, 1);
      meta.totalBooks = books.length;
      meta.lastModified = new Date().toISOString();
      saveBooksToPartition(meta.partitionId, books);
      savePartitionMetadata(metadata);
      return true;
    }
  }
  
  return false;
}

// Get partition statistics
export function getPartitionStats(): {
  totalPartitions: number;
  totalBooks: number;
  partitionSize: number;
} {
  const metadata = getPartitionMetadata();
  const totalBooks = metadata.reduce((sum, m) => sum + m.totalBooks, 0);
  
  return {
    totalPartitions: metadata.length,
    totalBooks,
    partitionSize: PARTITION_SIZE,
  };
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getAllBooks, 
  getActiveBorrows, 
  borrowBook, 
  returnBook,
} from '../api/apiClient';
import '../styles/UserDashboard.css';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  available: boolean;
  availableCopies: number;
  totalCopies: number;
  createdAt: string;
}

interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
  book?: Book;
  daysLeft?: number;
  fineAmount?: number;
  finePaid?: boolean;
}

const UserDashboard: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBorrows, setActiveBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to handle token expiration errors
  const handleAuthError = (errorMessage: string) => {
    if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('Access token required')) {
      setError('Your session has expired. Please log in again.');
      logout();
      navigate('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchBooks();
    fetchActiveBorrows();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await getAllBooks() as { success: boolean; data: Book[] };
      if (response?.success) {
        setBooks(response.data);
      }
    } catch (err) {
      setError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBorrows = async () => {
    if (!token) return;

    try {
      const response = await getActiveBorrows(token) as { success: boolean; data: BorrowRecord[] };
      if (response?.success && Array.isArray(response.data)) {
        setActiveBorrows(response.data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch active borrows';
      if (!handleAuthError(errorMsg)) {
        console.error('Failed to fetch active borrows:', errorMsg);
      }
    }
  };

  const handleBorrow = async (bookId: string) => {
    if (!token) {
      setError('Please log in to borrow books');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await borrowBook(bookId, token) as { success: boolean; message?: string };
      if (response.success) {
        await fetchBooks();
        await fetchActiveBorrows();
        setSuccess('Book borrowed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to borrow book');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to borrow book';
      if (!handleAuthError(errorMsg)) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookId: string) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = (await returnBook(bookId, token)) as { success: boolean };
      if (response.success) {
        await fetchBooks();
        await fetchActiveBorrows();
        alert('Book returned successfully!');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to return book';
      if (!handleAuthError(errorMsg)) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isBorrowed = (bookId: string) => {
    return activeBorrows.some((b) => b.bookId === bookId);
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Books</h3>
          <p className="stat-value">{books.length}</p>
        </div>
        <div className="stat-card">
          <h3>Available Books</h3>
          <p className="stat-value">{books.filter((b) => b.availableCopies > 0).length}</p>
        </div>
        <div className="stat-card">
          <h3>Books Borrowed</h3>
          <p className="stat-value">{activeBorrows.length}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="books-section">
          <h2>📖 Browse Books</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="search-container">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {loading && <p className="loading">Loading books...</p>}

          {filteredBooks.length === 0 ? (
            <p className="no-data">No books found matching your search.</p>
          ) : (
            <div className="books-grid">
              {filteredBooks.map((book) => {
                const borrowed = isBorrowed(book.id);
                return (
                  <div
                    key={book.id}
                    className={`book-card ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}
                  >
                    <div className="book-header">
                      <div className="book-icon">📖</div>
                      <div className="copy-info">
                        {book.availableCopies}/{book.totalCopies}
                      </div>
                    </div>

                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    <p className="book-isbn">ISBN: {book.isbn}</p>
                    <p className="book-description">{book.description}</p>

                    <div className="book-footer">
                      <span
                        className={`status-badge ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}
                      >
                        {book.availableCopies > 0
                          ? `${book.availableCopies} Available`
                          : 'Unavailable'}
                      </span>

                      {borrowed ? (
                        <button
                          className="btn-return"
                          onClick={() => handleReturn(book.id)}
                          disabled={loading}
                        >
                          Return Book
                        </button>
                      ) : (
                        <button
                          className="btn-borrow"
                          onClick={() => handleBorrow(book.id)}
                          disabled={loading || book.availableCopies === 0}
                        >
                          Borrow Book
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activeBorrows.length > 0 && (
          <div className="borrowed-section">
            <h2>📚 My Borrowed Books</h2>
            <div className="borrowed-grid">
              {activeBorrows.map((record) => (
                <div key={record.id} className="borrowed-card">
                  <div className="borrowed-header">
                    <h3>{record.book?.title || 'Unknown'}</h3>
                    <span className="borrowed-date">
                      {new Date(record.borrowedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="borrowed-author">{record.book?.author || 'Unknown'}</p>

                  <div className="borrowed-dates">
                    <div>
                      <small>Borrowed</small>
                      <span>{new Date(record.borrowedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <small>Due</small>
                      <span className={new Date(record.dueDate) < new Date() ? 'due-date-overdue' : 'due-date-ok'}>
                        {new Date(record.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {record.daysLeft !== undefined && (
                      <div>
                        <small>Days Left</small>
                        <span className={record.daysLeft < 3 ? 'days-left-warning' : 'days-left-ok'}>
                          {Math.max(0, record.daysLeft)} days
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn-return-card"
                    onClick={() => handleReturn(record.bookId)}
                    disabled={loading}
                  >
                    Return Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

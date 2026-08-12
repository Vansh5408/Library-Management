import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getActiveBorrows, 
  getBorrowHistory,
  borrowBook, 
  returnBook,
  searchBooks,
  getDashboardStats,
  payFine,
  reserveBook,
  getMyReservations,
  cancelReservation
} from '../api/apiClient';
import Modal from './Modal';
import { ToastContainer, useToast } from './Toast';
import ExternalBookSearch from './ExternalBookSearch';
import AIRecommendations from './AIRecommendations';
import ReadingInsights from './ReadingInsights';
import '../styles/UserDashboardEnhanced.css';
import '../styles/AIRecommendations.css';
import '../styles/ReadingInsights.css';

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

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservedAt: string;
  expiresAt: string;
  status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
  position: number;
  book?: Book;
}

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalUsers: number;
  activeBorrows: number;
  userStats?: {
    totalBorrowed: number;
    activeBorrows: number;
    overdueBorrows: number;
    unpaidFines: number;
    totalFineAmount: number;
  };
}

const UserDashboardEnhanced: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBorrows, setActiveBorrows] = useState<BorrowRecord[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const pageSize = 50;
  
  // Modal states
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [showReservationsModal, setShowReservationsModal] = useState(false);
  const [selectedFineRecord, setSelectedFineRecord] = useState<BorrowRecord | null>(null);
  
  // Tab state for Library vs External Search vs AI Features
  const [activeTab, setActiveTab] = useState<'library' | 'explore' | 'recommendations' | 'insights'>('library');

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAuthError = (errorMessage: string) => {
    if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('Access token required')) {
      toast.error('Session Expired', 'Please log in again.');
      logout();
      navigate('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchBooks(),
      fetchActiveBorrows(),
      fetchStats(),
      fetchReservations()
    ]);
  };

  const fetchBooks = async (page: number = currentPage) => {
    try {
      const response = await searchBooks(searchQuery, filterBy, sortBy, page, pageSize) as { 
        success: boolean; 
        data: {
          books: Book[];
          total: number;
          page: number;
          totalPages: number;
        };
      };
      if (response?.success) {
        setBooks(response.data.books);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
        setTotalBooks(response.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch books');
    }
  };

  const fetchActiveBorrows = async () => {
    if (!token) return;
    try {
      const response = await getActiveBorrows(token) as { success: boolean; data: BorrowRecord[] };
      if (response.success) {
        setActiveBorrows(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch active borrows');
    }
  };

  const fetchReservations = async () => {
    if (!token) return;
    try {
      const response = await getMyReservations(token) as { success: boolean; data: Reservation[] };
      if (response.success) {
        setReservations(response.data.filter(r => r.status === 'pending'));
      }
    } catch (err) {
      console.error('Failed to fetch reservations');
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await getBorrowHistory(token) as { success: boolean; data: BorrowRecord[] };
      if (response.success) {
        setBorrowHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const response = await getDashboardStats(token) as { success: boolean; data: DashboardStats };
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchBooks(1);
  }, [searchQuery, filterBy, sortBy]);

  const handleBorrow = async (bookId: string) => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await borrowBook(bookId, token) as { success: boolean; message: string };
      if (response.success) {
        toast.success('Success!', response.message || 'Book borrowed successfully!');
        await fetchData();
        setShowBookModal(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to borrow book';
      if (!handleAuthError(errorMsg)) {
        toast.error('Borrow Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookId: string) => {
    if (!token) return;
    setLoading(true);

    try {
      const response = (await returnBook(bookId, token)) as { 
        success: boolean; 
        message: string;
        data?: { fineAmount?: number; isOverdue?: boolean };
      };
      if (response.success) {
        toast.success('Book Returned!', response.message || 'Book returned successfully!');
        await fetchData();
        
        // Check if there's a fine
        if (response.data?.fineAmount && response.data.fineAmount > 0) {
          toast.warning('Late Fee', `You have a late fee of $${response.data.fineAmount}`);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to return book';
      if (!handleAuthError(errorMsg)) {
        toast.error('Return Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (borrowRecordId: string) => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await payFine(borrowRecordId, token) as { success: boolean; message: string };
      if (response.success) {
        toast.success('Fine Paid!', response.message || 'Fine paid successfully!');
        await fetchData();
        await fetchHistory();
        setShowFineModal(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pay fine';
      if (!handleAuthError(errorMsg)) {
        toast.error('Payment Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (bookId: string) => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await reserveBook(bookId, token) as { 
        success: boolean; 
        message: string;
        data?: { queuePosition?: number };
      };
      if (response.success) {
        toast.success('Reserved!', response.message || 'Book reserved successfully!');
        await fetchReservations();
        setShowBookModal(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reserve book';
      if (!handleAuthError(errorMsg)) {
        toast.error('Reservation Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await cancelReservation(reservationId, token) as { success: boolean; message: string };
      if (response.success) {
        toast.success('Cancelled', 'Reservation cancelled successfully');
        await fetchReservations();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel reservation';
      if (!handleAuthError(errorMsg)) {
        toast.error('Cancel Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const openBookDetails = (book: Book) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const openHistory = async () => {
    await fetchHistory();
    setShowHistoryModal(true);
  };

  const openFinePayment = (record: BorrowRecord) => {
    setSelectedFineRecord(record);
    setShowFineModal(true);
  };

  const openReservations = () => {
    setShowReservationsModal(true);
  };

  const isBorrowed = (bookId: string) => {
    return activeBorrows.some((b) => b.bookId === bookId);
  };

  const isReserved = (bookId: string) => {
    return reservations.some((r) => r.bookId === bookId && r.status === 'pending');
  };

  const unpaidFines = activeBorrows.concat(borrowHistory).filter(
    r => r.fineAmount && r.fineAmount > 0 && !r.finePaid
  );

  return (
    <div className="user-dashboard">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Success/Error Messages */}
      {success && <div className="success-message-float">{success}</div>}
      {error && <div className="error-message-float">{error}</div>}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          📚 Our Library ({totalBooks || books.length || 0} books)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          🌐 Explore 1 Lakh+ Books
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          🤖 AI Recommendations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          📊 Reading Insights
        </button>
      </div>

      {activeTab === 'library' && (
        <>
          {/* Enhanced Dashboard Stats */}
          <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Books Borrowed</h3>
            <p className="stat-value">{stats?.userStats?.activeBorrows || 0}</p>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Available Books</h3>
            <p className="stat-value">{stats?.availableBooks || 0}</p>
          </div>
        </div>
        <div className="stat-card stat-info clickable" onClick={openReservations}>
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>My Reservations</h3>
            <p className="stat-value">{reservations.length}</p>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Overdue Books</h3>
            <p className="stat-value">{stats?.userStats?.overdueBorrows || 0}</p>
          </div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Unpaid Fines</h3>
            <p className="stat-value">${stats?.userStats?.totalFineAmount || 0}</p>
          </div>
        </div>
      </div>

      {/* Unpaid Fines Alert */}
      {unpaidFines.length > 0 && (
        <div className="fine-alert">
          <strong>⚠️ You have {unpaidFines.length} unpaid fine(s)</strong>
          <button className="btn-pay-fines" onClick={openHistory}>
            View & Pay
          </button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="books-section">
          <div className="section-header">
            <h2>📖 Browse Books</h2>
            <button className="btn-secondary" onClick={openHistory}>
              📜 View History
            </button>
          </div>

          {/* Search, Filter, Sort Controls */}
          <div className="controls-container">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by title, author, ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-sort-container">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
                aria-label="Filter books by availability"
              >
                <option value="">All Books</option>
                <option value="available">Available Only</option>
                <option value="borrowed">Currently Borrowed</option>
                <option value="unavailable">Unavailable</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                aria-label="Sort books by criteria"
              >
                <option value="">Sort By</option>
                <option value="title">Title (A-Z)</option>
                <option value="author">Author (A-Z)</option>
                <option value="availability">Most Available</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {loading && <p className="loading">Loading...</p>}

          {books.length === 0 ? (
            <p className="no-data">No books found matching your criteria.</p>
          ) : (
            <div className="books-grid">
              {books.map((book) => {
                const borrowed = isBorrowed(book.id);
                return (
                  <div
                    key={book.id}
                    className={`book-card ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}
                    onClick={() => openBookDetails(book)}
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
                    <p className="book-description">{book.description.substring(0, 100)}...</p>

                    <div className="book-footer">
                      <span
                        className={`status-badge ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}
                      >
                        {book.availableCopies > 0
                          ? `${book.availableCopies} Available`
                          : 'Unavailable'}
                      </span>

                      {borrowed && <span className="borrowed-badge">✓ Borrowed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="btn-pagination" 
                onClick={() => fetchBooks(currentPage - 1)}
                disabled={loading || currentPage === 1}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages} ({totalBooks.toLocaleString()} books)
              </span>
              <button 
                className="btn-pagination" 
                onClick={() => fetchBooks(currentPage + 1)}
                disabled={loading || currentPage >= totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Active Borrows Section */}
        {activeBorrows.length > 0 && (
          <div className="borrowed-section">
            <h2>📚 My Borrowed Books</h2>
            <div className="borrowed-grid">
              {activeBorrows.map((record) => {
                const isOverdue = new Date() > new Date(record.dueDate);
                const daysLeft = Math.ceil(
                  (new Date(record.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div key={record.id} className={`borrowed-card ${isOverdue ? 'overdue' : ''}`}>
                    <div className="borrowed-header">
                      <h3>{record.book?.title || 'Unknown'}</h3>
                      {isOverdue && <span className="overdue-badge">⚠️ OVERDUE</span>}
                    </div>

                    <p className="borrowed-author">{record.book?.author || 'Unknown'}</p>

                    <div className="borrowed-dates">
                      <div>
                        <small>Borrowed</small>
                        <span>{new Date(record.borrowedAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <small>Due Date</small>
                        <span className={isOverdue ? 'due-date-overdue' : 'due-date-ok'}>
                          {new Date(record.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <small>Days Left</small>
                        <span className={daysLeft < 3 ? 'days-left-warning' : 'days-left-ok'}>
                          {isOverdue ? `${Math.abs(daysLeft)} overdue` : `${Math.max(0, daysLeft)} days`}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-return-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReturn(record.bookId);
                      }}
                      disabled={loading}
                    >
                      Return Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Book Details Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Book Details"
        size="medium"
      >
        {selectedBook && (
          <div className="book-details-modal">
            <div className="book-detail-row">
              <strong>Title:</strong>
              <span>{selectedBook.title}</span>
            </div>
            <div className="book-detail-row">
              <strong>Author:</strong>
              <span>{selectedBook.author}</span>
            </div>
            <div className="book-detail-row">
              <strong>ISBN:</strong>
              <span>{selectedBook.isbn}</span>
            </div>
            <div className="book-detail-row">
              <strong>Description:</strong>
              <p>{selectedBook.description}</p>
            </div>
            <div className="book-detail-row">
              <strong>Availability:</strong>
              <span>{selectedBook.availableCopies} of {selectedBook.totalCopies} available</span>
            </div>

            <div className="modal-actions">
              {isBorrowed(selectedBook.id) ? (
                <>
                  <span className="already-borrowed">✓ Already Borrowed</span>
                  <button
                    className="btn-primary"
                    onClick={() => handleReturn(selectedBook.id)}
                    disabled={loading}
                  >
                    Return Book
                  </button>
                </>
              ) : isReserved(selectedBook.id) ? (
                <span className="already-reserved">📋 Reserved (In Queue)</span>
              ) : selectedBook.availableCopies === 0 ? (
                <button
                  className="btn-reserve"
                  onClick={() => handleReserve(selectedBook.id)}
                  disabled={loading}
                >
                  📋 Reserve This Book
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => handleBorrow(selectedBook.id)}
                  disabled={loading}
                >
                  Borrow This Book
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowBookModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reservations Modal */}
      <Modal
        isOpen={showReservationsModal}
        onClose={() => setShowReservationsModal(false)}
        title="📋 My Reservations"
        size="large"
      >
        <div className="reservations-modal">
          {reservations.length === 0 ? (
            <p className="no-data">You have no active reservations.</p>
          ) : (
            <div className="reservations-list">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="reservation-card">
                  <div className="reservation-info">
                    <h4>{reservation.book?.title || 'Unknown Book'}</h4>
                    <p>{reservation.book?.author}</p>
                    <div className="reservation-meta">
                      <span className="queue-position">Position: #{reservation.position}</span>
                      <span className="reserved-date">
                        Reserved: {new Date(reservation.reservedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-cancel-reservation"
                    onClick={() => handleCancelReservation(reservation.id)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Borrow History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="📜 Borrow History"
        size="large"
      >
        <div className="history-modal">
          {borrowHistory.length === 0 ? (
            <p className="no-data">No borrow history found.</p>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Due Date</th>
                    <th>Returned</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowHistory.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.book?.title || 'Unknown'}</strong>
                        <br />
                        <small>{record.book?.author}</small>
                      </td>
                      <td>{new Date(record.borrowedAt).toLocaleDateString()}</td>
                      <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                      <td>
                        {record.returnedAt
                          ? new Date(record.returnedAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <span className={`status-badge status-${record.status}`}>
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {record.fineAmount && record.fineAmount > 0 ? (
                          <span className={record.finePaid ? 'fine-paid' : 'fine-unpaid'}>
                            ${record.fineAmount}
                            {record.finePaid && ' ✓'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {record.fineAmount && record.fineAmount > 0 && !record.finePaid && (
                          <button
                            className="btn-pay-fine"
                            onClick={() => openFinePayment(record)}
                          >
                            Pay Fine
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Fine Payment Modal */}
      <Modal
        isOpen={showFineModal}
        onClose={() => setShowFineModal(false)}
        title="💰 Pay Fine"
        size="small"
      >
        {selectedFineRecord && (
          <div className="fine-payment-modal">
            <div className="fine-detail">
              <h3>{selectedFineRecord.book?.title}</h3>
              <p>by {selectedFineRecord.book?.author}</p>
            </div>

            <div className="fine-info">
              <div className="fine-row">
                <span>Due Date:</span>
                <strong>{new Date(selectedFineRecord.dueDate).toLocaleDateString()}</strong>
              </div>
              <div className="fine-row">
                <span>Returned:</span>
                <strong>
                  {selectedFineRecord.returnedAt
                    ? new Date(selectedFineRecord.returnedAt).toLocaleDateString()
                    : 'Not yet returned'}
                </strong>
              </div>
              <div className="fine-row fine-amount-row">
                <span>Fine Amount:</span>
                <strong className="fine-amount">${selectedFineRecord.fineAmount}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => handlePayFine(selectedFineRecord.id)}
                disabled={loading}
              >
                Pay ${selectedFineRecord.fineAmount}
              </button>
              <button className="btn-secondary" onClick={() => setShowFineModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
      </>
      )}

      {activeTab === 'explore' && (
        /* External Book Search Tab - Google Books */
        <ExternalBookSearch />
      )}

      {activeTab === 'recommendations' && (
        /* AI Recommendations Tab */
        <AIRecommendations onViewBook={(book) => {
          setSelectedBook(book as any);
          setShowBookModal(true);
        }} />
      )}

      {activeTab === 'insights' && (
        /* Reading Insights Tab */
        <ReadingInsights />
      )}
    </div>
  );
};

export default UserDashboardEnhanced;

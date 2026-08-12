import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllBorrowRecords, getDashboardStats, getAllBooks, getAllReservations } from '../api/apiClient';
import AdminBooks from './AdminBooks';
import ExternalBookSearch from './ExternalBookSearch';
import Modal from './Modal';
import { ToastContainer, useToast } from './Toast';
import { 
  exportBorrowRecordsToCSV,
  exportBorrowRecordsToPDF,
  exportDashboardStatsToPDF
} from '../utils/exportUtils';
import '../styles/AdminDashboardEnhanced.css';

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservedAt: string;
  expiresAt: string;
  status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
  position: number;
  book?: {
    id: string;
    title: string;
    author: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
  fineAmount?: number;
  finePaid?: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  book?: {
    id: string;
    title: string;
    author: string;
  };
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  availableCopies: number;
  totalCopies: number;
}

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalUsers: number;
  activeBorrows: number;
}

const AdminDashboardEnhanced: React.FC = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'borrows' | 'reservations' | 'explore'>('overview');
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'borrows') {
      fetchBorrowRecords();
    } else if (activeTab === 'overview') {
      fetchBooks();
    } else if (activeTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const statsResponse = await getDashboardStats(token) as { success: boolean; data: DashboardStats };
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrowRecords = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const response = await getAllBorrowRecords(token) as { success: boolean; data: BorrowRecord[] };
      if (response.success) {
        setBorrowRecords(response.data);
      }
    } catch (err) {
      setError('Failed to fetch borrow records');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const response = await getAllReservations(token) as { success: boolean; data: Reservation[] };
      if (response.success) {
        setReservations(response.data);
      }
    } catch (err) {
      setError('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    if (!token) return;
    try {
      const response = await getAllBooks() as { success: boolean; data: Book[] };
      if (response.success) {
        setBooks(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch books');
    }
  };

  const handleExportCSV = () => {
    exportBorrowRecordsToCSV(filteredRecords);
    toast.success('Export Complete', 'CSV file downloaded successfully!');
  };

  const handleExportPDF = () => {
    exportBorrowRecordsToPDF(filteredRecords, stats);
    toast.success('PDF Generated', 'PDF report is ready for printing!');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'returned':
        return 'status-returned';
      case 'overdue':
        return 'status-overdue';
      default:
        return '';
    }
  };

  const filteredRecords = borrowRecords
    .filter(record => {
      if (filterStatus === 'all') return true;
      return record.status === filterStatus;
    })
    .filter(record => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        record.user?.name.toLowerCase().includes(search) ||
        record.user?.email.toLowerCase().includes(search) ||
        record.book?.title.toLowerCase().includes(search) ||
        record.book?.author.toLowerCase().includes(search)
      );
    });

  const openRecordDetails = (record: BorrowRecord) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const totalFines = borrowRecords
    .filter(r => r.fineAmount && r.fineAmount > 0)
    .reduce((sum, r) => sum + (r.fineAmount || 0), 0);

  const unpaidFines = borrowRecords
    .filter(r => r.fineAmount && r.fineAmount > 0 && !r.finePaid)
    .reduce((sum, r) => sum + (r.fineAmount || 0), 0);

  const paidFines = totalFines - unpaidFines;

  const pendingReservations = reservations.filter(r => r.status === 'pending');

  return (
    <div className="admin-dashboard-enhanced">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Navigation Tabs */}
      <div className="admin-navigation">
        <button
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`nav-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          📖 Manage Books
        </button>
        <button
          className={`nav-btn ${activeTab === 'borrows' ? 'active' : ''}`}
          onClick={() => setActiveTab('borrows')}
        >
          📋 Borrow Records
        </button>
        <button
          className={`nav-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📝 Reservations {pendingReservations.length > 0 && <span className="nav-badge">{pendingReservations.length}</span>}
        </button>
        <button
          className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          🌐 Explore 1L+ Books
        </button>
      </div>

      <div className="admin-content">
        {/* Explore External Books Tab */}
        {activeTab === 'explore' && (
          <ExternalBookSearch />
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="section-header">
              <h2>📊 Dashboard Overview</h2>
              <button className="btn-export" onClick={() => exportDashboardStatsToPDF(stats)}>
                📄 Export PDF
              </button>
            </div>

            {/* Main Statistics */}
            <div className="stats-grid">
              <div className="stat-card-enhanced stat-primary">
                <div className="stat-icon-large">📚</div>
                <div className="stat-details">
                  <h3>Total Books</h3>
                  <p className="stat-number">{stats?.totalBooks || 0}</p>
                  <small>{stats?.availableBooks || 0} available</small>
                </div>
              </div>

              <div className="stat-card-enhanced stat-success">
                <div className="stat-icon-large">📖</div>
                <div className="stat-details">
                  <h3>Active Borrows</h3>
                  <p className="stat-number">{stats?.activeBorrows || 0}</p>
                  <small>{stats?.borrowedBooks || 0} copies borrowed</small>
                </div>
              </div>

              <div className="stat-card-enhanced stat-warning">
                <div className="stat-icon-large">⚠️</div>
                <div className="stat-details">
                  <h3>Overdue Books</h3>
                  <p className="stat-number">{stats?.overdueBooks || 0}</p>
                  <small>Need attention</small>
                </div>
              </div>

              <div className="stat-card-enhanced stat-info">
                <div className="stat-icon-large">👥</div>
                <div className="stat-details">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats?.totalUsers || 0}</p>
                  <small>Registered members</small>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="financial-section">
              <h3>💰 Financial Overview</h3>
              <div className="financial-grid">
                <div className="financial-card">
                  <span className="financial-label">Total Fines Collected</span>
                  <span className="financial-amount success">${paidFines.toFixed(2)}</span>
                </div>
                <div className="financial-card">
                  <span className="financial-label">Unpaid Fines</span>
                  <span className="financial-amount danger">${unpaidFines.toFixed(2)}</span>
                </div>
                <div className="financial-card">
                  <span className="financial-label">Total Fines</span>
                  <span className="financial-amount">${totalFines.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Popular Books */}
            <div className="popular-books-section">
              <h3>📈 Most Borrowed Books</h3>
              <div className="popular-books-grid">
                {books
                  .sort((a, b) => (b.totalCopies - b.availableCopies) - (a.totalCopies - a.availableCopies))
                  .slice(0, 5)
                  .map((book, index) => (
                    <div key={book.id} className="popular-book-card">
                      <div className="book-rank">#{index + 1}</div>
                      <div className="book-info-compact">
                        <h4>{book.title}</h4>
                        <p>{book.author}</p>
                        <div className="book-stats-compact">
                          <span>{book.totalCopies - book.availableCopies} borrowed</span>
                          <span>{book.availableCopies} available</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
              <h3>🕐 Recent Activity</h3>
              <div className="activity-list">
                {borrowRecords
                  .sort((a, b) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime())
                  .slice(0, 10)
                  .map((record) => (
                    <div key={record.id} className="activity-item">
                      <div className="activity-icon">
                        {record.status === 'returned' ? '✅' : record.status === 'overdue' ? '⚠️' : '📖'}
                      </div>
                      <div className="activity-details">
                        <strong>{record.user?.name || 'Unknown'}</strong>
                        <span>
                          {record.status === 'returned' ? 'returned' : 'borrowed'}
                          {' '}<strong>{record.book?.title || 'Unknown'}</strong>
                        </span>
                        <small>{new Date(record.borrowedAt).toLocaleDateString()}</small>
                      </div>
                      <span className={`activity-status ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Books Management Tab */}
        {activeTab === 'books' && <AdminBooks />}

        {/* Borrow Records Tab */}
        {activeTab === 'borrows' && (
          <div className="borrow-records-section">
            <div className="section-header">
              <h2>📋 All Borrow Records</h2>
              <div className="header-actions">
                <button className="btn-export" onClick={handleExportCSV}>
                  📥 Export CSV
                </button>
                <button className="btn-export btn-export-pdf" onClick={handleExportPDF}>
                  📄 Export PDF
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Filters */}
            <div className="records-filters">
              <input
                type="text"
                placeholder="Search by user, book, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
                aria-label="Filter borrow records by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="returned">Returned</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Statistics Summary */}
            <div className="records-summary">
              <div className="summary-item">
                <span>Total Records:</span>
                <strong>{borrowRecords.length}</strong>
              </div>
              <div className="summary-item">
                <span>Showing:</span>
                <strong>{filteredRecords.length}</strong>
              </div>
              <div className="summary-item">
                <span>Active:</span>
                <strong>{borrowRecords.filter(r => r.status === 'active').length}</strong>
              </div>
              <div className="summary-item">
                <span>Overdue:</span>
                <strong className="text-danger">
                  {borrowRecords.filter(r => r.status === 'overdue').length}
                </strong>
              </div>
            </div>

            {loading ? (
              <p className="loading">Loading borrow records...</p>
            ) : filteredRecords.length === 0 ? (
              <p className="no-data">No borrow records found matching your criteria.</p>
            ) : (
              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Book</th>
                      <th>Borrowed Date</th>
                      <th>Due Date</th>
                      <th>Returned Date</th>
                      <th>Status</th>
                      <th>Fine</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const isOverdue = record.status === 'active' && new Date() > new Date(record.dueDate);
                      
                      return (
                        <tr key={record.id} className={isOverdue ? 'row-overdue' : ''}>
                          <td>
                            <div className="user-cell">
                              <strong>{record.user?.name || 'Unknown'}</strong>
                              <small>{record.user?.email || 'N/A'}</small>
                            </div>
                          </td>
                          <td>
                            <div className="book-cell">
                              <strong>{record.book?.title || 'Unknown'}</strong>
                              <small>{record.book?.author || 'N/A'}</small>
                            </div>
                          </td>
                          <td>{new Date(record.borrowedAt).toLocaleDateString()}</td>
                          <td className={isOverdue ? 'text-danger' : ''}>
                            {new Date(record.dueDate).toLocaleDateString()}
                            {isOverdue && <span className="overdue-indicator"> ⚠️</span>}
                          </td>
                          <td>
                            {record.returnedAt ? new Date(record.returnedAt).toLocaleDateString() : '-'}
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
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
                            <button
                              className="btn-view-details"
                              onClick={() => openRecordDetails(record)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Borrow Record Details"
        size="medium"
      >
        {selectedRecord && (
          <div className="record-details-modal">
            <div className="detail-section">
              <h4>📖 Book Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Title:</span>
                  <strong>{selectedRecord.book?.title || 'Unknown'}</strong>
                </div>
                <div className="detail-item">
                  <span>Author:</span>
                  <strong>{selectedRecord.book?.author || 'Unknown'}</strong>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>👤 User Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Name:</span>
                  <strong>{selectedRecord.user?.name || 'Unknown'}</strong>
                </div>
                <div className="detail-item">
                  <span>Email:</span>
                  <strong>{selectedRecord.user?.email || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>📅 Borrow Details</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Borrowed Date:</span>
                  <strong>{new Date(selectedRecord.borrowedAt).toLocaleDateString()}</strong>
                </div>
                <div className="detail-item">
                  <span>Due Date:</span>
                  <strong>{new Date(selectedRecord.dueDate).toLocaleDateString()}</strong>
                </div>
                <div className="detail-item">
                  <span>Returned Date:</span>
                  <strong>
                    {selectedRecord.returnedAt
                      ? new Date(selectedRecord.returnedAt).toLocaleDateString()
                      : 'Not yet returned'}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedRecord.status)}`}>
                    {selectedRecord.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {selectedRecord.fineAmount && selectedRecord.fineAmount > 0 && (
              <div className="detail-section fine-section">
                <h4>💰 Fine Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Fine Amount:</span>
                    <strong className="text-danger">${selectedRecord.fineAmount}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Payment Status:</span>
                    <strong className={selectedRecord.finePaid ? 'text-success' : 'text-danger'}>
                      {selectedRecord.finePaid ? 'Paid ✓' : 'Unpaid'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRecordModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboardEnhanced;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllBorrowRecords } from '../api/apiClient';
import AdminBooks from './AdminBooks';
import '../styles/AdminDashboard.css';

interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
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

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'books' | 'borrowRecords'>('books');
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'borrowRecords') {
      fetchBorrowRecords();
    }
  }, [activeTab]);

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

  return (
    <div className="admin-dashboard">
      <div className="admin-navigation">
        <button
          className={`nav-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          📖 Manage Books
        </button>
        <button
          className={`nav-btn ${activeTab === 'borrowRecords' ? 'active' : ''}`}
          onClick={() => setActiveTab('borrowRecords')}
        >
          📋 Borrow Records
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'books' ? (
          <AdminBooks />
        ) : (
          <div className="borrow-records-section">
            <h2>📋 All Borrow Records</h2>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <p className="loading">Loading borrow records...</p>
            ) : borrowRecords.length === 0 ? (
              <p className="no-data">No borrow records found.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {borrowRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div>
                            <strong>{record.user?.name || 'Unknown'}</strong>
                            <br />
                            <small>{record.user?.email || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{record.book?.title || 'Unknown'}</strong>
                            <br />
                            <small>{record.book?.author || 'N/A'}</small>
                          </div>
                        </td>
                        <td>{new Date(record.borrowedAt).toLocaleDateString()}</td>
                        <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                        <td>
                          {record.returnedAt ? new Date(record.returnedAt).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

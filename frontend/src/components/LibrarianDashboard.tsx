import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getAllUsers, 
  searchUsers, 
  getUserDetails, 
  addNewBook, 
  getLibraryStats,
  searchBooks
} from '../api/apiClient';
import '../styles/LibrarianDashboard.css';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  borrowHistory: string[];
}

interface UserDetailsData extends UserData {
  stats: {
    totalBorrowed: number;
    currentlyBorrowed: number;
    returned: number;
    overdue: number;
  };
  activeBorrows: Array<{
    id: string;
    bookId: string;
    borrowedAt: string;
    dueDate: string;
    status: string;
  }>;
}

interface LibraryStats {
  users: { total: number; active: number };
  books: { totalTitles: number; totalCopies: number; availableCopies: number; borrowedCopies: number };
  borrows: { active: number; overdue: number; total: number };
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  availableCopies: number;
  totalCopies: number;
}

type TabType = 'dashboard' | 'users' | 'addBook' | 'books';

const LibrarianDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetailsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Book search
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // New book form
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    totalCopies: 1,
    categories: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    pageCount: 0,
  });

  useEffect(() => {
    if (token) {
      loadStats();
      loadUsers();
    }
  }, [token]);

  const loadStats = async () => {
    if (!token) return;
    try {
      const response = await getLibraryStats(token) as { success: boolean; data: LibraryStats };
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getAllUsers(token) as { success: boolean; data: UserData[] };
      if (response.success) {
        setUsers(response.data.filter(u => u.role === 'user'));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!token || !searchQuery.trim()) {
      loadUsers();
      return;
    }
    setLoading(true);
    try {
      const response = await searchUsers(searchQuery, token) as { success: boolean; data: UserData[] };
      if (response.success) {
        setUsers(response.data.filter(u => u.role === 'user'));
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getUserDetails(userId, token) as { success: boolean; data: UserDetailsData };
      if (response.success) {
        setSelectedUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBooks = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await searchBooks(bookSearchQuery || '', undefined, undefined, page, 20) as { 
        success: boolean;
        data: {
          books: Book[];
          total: number;
          page: number;
          totalPages: number;
        };
      };
      if (response.success && response.data) {
        setBooks(response.data.books || []);
        setTotalBooks(response.data.total || 0);
        setCurrentPage(response.data.page || page);
      }
    } catch (error) {
      console.error('Failed to search books:', error);
      setMessage({ type: 'error', text: 'Failed to load books' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (!newBook.title.trim() || !newBook.author.trim()) {
      setMessage({ type: 'error', text: 'Title and Author are required' });
      return;
    }

    setLoading(true);
    try {
      const bookData = {
        ...newBook,
        categories: newBook.categories.split(',').map(c => c.trim()).filter(c => c),
      };
      
      const response = await addNewBook(bookData, token) as { success: boolean; message: string };
      if (response.success) {
        setMessage({ type: 'success', text: 'Book added successfully!' });
        setNewBook({
          title: '',
          author: '',
          isbn: '',
          description: '',
          totalCopies: 1,
          categories: '',
          publisher: '',
          publicationYear: new Date().getFullYear(),
          pageCount: 0,
        });
        loadStats();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to add book' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add book' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="librarian-dashboard">
      {/* Sidebar */}
      <aside className="librarian-sidebar">
        <div className="sidebar-header">
          <h2>📚 Library</h2>
          <p>Librarian Panel</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
          >
            👥 User Management
          </button>
          <button 
            className={`nav-item ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => { setActiveTab('books'); handleSearchBooks(); }}
          >
            📖 Browse Books
          </button>
          <button 
            className={`nav-item ${activeTab === 'addBook' ? 'active' : ''}`}
            onClick={() => setActiveTab('addBook')}
          >
            ➕ Add New Book
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">Librarian</span>
          </div>
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="librarian-main">
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
            <button onClick={() => setMessage(null)}>×</button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <h1>Library Dashboard</h1>
            
            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{stats.users.total}</h3>
                    <p>Total Users</p>
                    <small>{stats.users.active} active</small>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <h3>{stats.books.totalTitles}</h3>
                    <p>Book Titles</p>
                    <small>{stats.books.totalCopies} total copies</small>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{stats.books.availableCopies}</h3>
                    <p>Available</p>
                    <small>{stats.books.borrowedCopies} borrowed</small>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📖</div>
                  <div className="stat-info">
                    <h3>{stats.borrows.active}</h3>
                    <p>Active Borrows</p>
                    <small>{stats.borrows.overdue} overdue</small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading">Loading statistics...</div>
            )}
            
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('addBook')}>
                  ➕ Add New Book
                </button>
                <button onClick={() => setActiveTab('users')}>
                  👥 View Users
                </button>
                <button onClick={() => { setActiveTab('books'); handleSearchBooks(); }}>
                  📖 Browse Library
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && !selectedUser && (
          <div className="users-content">
            <h1>User Management</h1>
            
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <button onClick={handleSearchUsers}>🔍 Search</button>
              <button onClick={() => { setSearchQuery(''); loadUsers(); }}>Clear</button>
            </div>
            
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Books Borrowed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>{u.borrowHistory.length}</td>
                        <td>
                          <button 
                            className="view-btn"
                            onClick={() => handleViewUser(u.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <p className="no-data">No users found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Details */}
        {activeTab === 'users' && selectedUser && (
          <div className="user-details">
            <button className="back-btn" onClick={() => setSelectedUser(null)}>
              ← Back to Users
            </button>
            
            <div className="user-header">
              <h1>{selectedUser.name}</h1>
              <p>{selectedUser.email}</p>
            </div>
            
            <div className="user-stats">
              <div className="stat">
                <span className="stat-value">{selectedUser.stats.totalBorrowed}</span>
                <span className="stat-label">Total Borrowed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{selectedUser.stats.currentlyBorrowed}</span>
                <span className="stat-label">Currently Borrowed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{selectedUser.stats.returned}</span>
                <span className="stat-label">Returned</span>
              </div>
              <div className="stat overdue">
                <span className="stat-value">{selectedUser.stats.overdue}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>
            
            <div className="user-info-section">
              <h2>Account Information</h2>
              <p><strong>User ID:</strong> {selectedUser.id}</p>
              <p><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
            </div>
            
            {selectedUser.activeBorrows.length > 0 && (
              <div className="active-borrows-section">
                <h2>Active Borrows</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Book ID</th>
                      <th>Borrowed Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.activeBorrows.map((borrow) => (
                      <tr key={borrow.id}>
                        <td>{borrow.bookId}</td>
                        <td>{formatDate(borrow.borrowedAt)}</td>
                        <td>{formatDate(borrow.dueDate)}</td>
                        <td className={`status ${borrow.status}`}>{borrow.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Browse Books Tab */}
        {activeTab === 'books' && (
          <div className="books-content">
            <h1>Library Books</h1>
            
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search books by title or author..."
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchBooks(1)}
              />
              <button onClick={() => handleSearchBooks(1)}>🔍 Search</button>
            </div>
            
            <p className="total-count">Total: {totalBooks} books</p>
            
            {loading ? (
              <div className="loading">Loading books...</div>
            ) : (
              <>
                <div className="books-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Available</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => (
                        <tr key={book.id}>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>{book.isbn || '-'}</td>
                          <td className={book.availableCopies > 0 ? 'available' : 'unavailable'}>
                            {book.availableCopies}
                          </td>
                          <td>{book.totalCopies}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="pagination">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handleSearchBooks(currentPage - 1)}
                  >
                    ← Previous
                  </button>
                  <span>Page {currentPage} of {Math.ceil(totalBooks / 20)}</span>
                  <button 
                    disabled={currentPage >= Math.ceil(totalBooks / 20)}
                    onClick={() => handleSearchBooks(currentPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add Book Tab */}
        {activeTab === 'addBook' && (
          <div className="add-book-content">
            <h1>Add New Book</h1>
            
            <form onSubmit={handleAddBook} className="add-book-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    placeholder="Enter book title"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    placeholder="Enter author name"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ISBN</label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    placeholder="e.g., 978-0-123456-78-9"
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={newBook.totalCopies}
                    onChange={(e) => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value) || 1 })}
                    placeholder="Number of copies"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Publisher</label>
                  <input
                    type="text"
                    value={newBook.publisher}
                    onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                    placeholder="Enter publisher name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Publication Year</label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={newBook.publicationYear}
                    onChange={(e) => setNewBook({ ...newBook, publicationYear: parseInt(e.target.value) || new Date().getFullYear() })}
                    placeholder="Year of publication"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Categories</label>
                  <input
                    type="text"
                    value={newBook.categories}
                    onChange={(e) => setNewBook({ ...newBook, categories: e.target.value })}
                    placeholder="e.g., Fiction, Science, History (comma separated)"
                  />
                </div>
                
                <div className="form-group">
                  <label>Page Count</label>
                  <input
                    type="number"
                    min="0"
                    value={newBook.pageCount}
                    onChange={(e) => setNewBook({ ...newBook, pageCount: parseInt(e.target.value) || 0 })}
                    placeholder="Number of pages"
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  placeholder="Enter book description..."
                  rows={4}
                />
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Adding...' : '➕ Add Book to Library'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default LibrarianDashboard;

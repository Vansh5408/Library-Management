import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createBook,
  updateBook,
  deleteBook,
  getAllBooks,
} from '../api/apiClient';
import '../styles/AdminBooks.css';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
}

interface FormData {
  title: string;
  author: string;
  isbn: string;
  description: string;
  totalCopies: number;
}

const AdminBooks: React.FC = () => {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    author: '',
    isbn: '',
    description: '',
    totalCopies: 1,
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await getAllBooks() as { success: boolean; data: Book[] };
      if (response.success) {
        setBooks(response.data);
      }
    } catch (err) {
      setError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalCopies' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      if (editingId) {
        await updateBook(
          editingId,
          formData.title,
          formData.author,
          formData.isbn,
          formData.description,
          formData.totalCopies,
          token
        );
      } else {
        await createBook(
          formData.title,
          formData.author,
          formData.isbn,
          formData.description,
          formData.totalCopies,
          token
        );
      }

      await fetchBooks();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      totalCopies: book.totalCopies,
    });
    setEditingId(book.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      if (!token) return;

      setLoading(true);
      try {
        await deleteBook(id, token);
        await fetchBooks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete book');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      description: '',
      totalCopies: 1,
    });
    setEditingId(null);
  };

  return (
    <div className="admin-books">
      <div className="admin-header">
        <h2>📖 Book Management</h2>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ Add New Book'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="book-form-container">
          <h3>{editingId ? 'Edit Book' : 'Add New Book'}</h3>
          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Book title"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="author">Author *</label>
                <input
                  id="author"
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="isbn">ISBN *</label>
                <input
                  id="isbn"
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  placeholder="ISBN"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="totalCopies">Total Copies *</label>
                <input
                  id="totalCopies"
                  type="number"
                  name="totalCopies"
                  value={formData.totalCopies}
                  onChange={handleInputChange}
                  min="1"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Book description"
                required
                disabled={loading}
                rows={4}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Book' : 'Add Book'}
            </button>
          </form>
        </div>
      )}

      <div className="books-table-container">
        <h3>All Books ({books.length})</h3>
        {loading && !showForm ? (
          <p className="loading">Loading books...</p>
        ) : books.length === 0 ? (
          <p className="no-data">No books found. Add your first book!</p>
        ) : (
          <table className="books-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Total Copies</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td className="title-cell">{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.isbn}</td>
                  <td className="center">{book.totalCopies}</td>
                  <td className="center">
                    <span className={book.availableCopies > 0 ? 'available' : 'unavailable'}>
                      {book.availableCopies}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-small btn-edit"
                      onClick={() => handleEdit(book)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-small btn-delete"
                      onClick={() => handleDelete(book.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminBooks;

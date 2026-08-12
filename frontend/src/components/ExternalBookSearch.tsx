import React, { useState, useEffect, useCallback } from 'react';
import { 
  searchExternalBooks, 
  getPopularSubjects,
  createBook,
  type ExternalBook,
  type ExternalSearchResult
} from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { useToast } from './Toast';
import '../styles/ExternalBookSearch.css';

interface Subject {
  name: string;
  key: string;
  count: number;
}

const ExternalBookSearch: React.FC = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [isbnQuery, setIsbnQuery] = useState('');
  const [searchSource, setSearchSource] = useState<'all' | 'google' | 'openlibrary'>('all');
  
  // Results state
  const [results, setResults] = useState<ExternalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjects, setShowSubjects] = useState(true);
  
  // Modal state
  const [selectedBook, setSelectedBook] = useState<ExternalBook | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  // Fetch popular subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await getPopularSubjects();
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const performSearch = useCallback(async (
    page: number = 1,
    overrides?: { subject?: string; query?: string; author?: string; isbn?: string }
  ) => {
    const effectiveQuery = overrides?.query ?? searchQuery;
    const effectiveAuthor = overrides?.author ?? authorQuery;
    const effectiveSubject = overrides?.subject ?? subjectQuery;
    const effectiveIsbn = overrides?.isbn ?? isbnQuery;

    if (!effectiveQuery && !effectiveAuthor && !effectiveSubject && !effectiveIsbn) {
      setError('Please enter at least one search criteria');
      return;
    }

    setLoading(true);
    setError('');
    setShowSubjects(false);

    try {
      const response = await searchExternalBooks({
        query: effectiveQuery || undefined,
        author: effectiveAuthor || undefined,
        subject: effectiveSubject || undefined,
        isbn: effectiveIsbn || undefined,
        page,
        pageSize: 40,
        source: searchSource,
      });

      if (response.success) {
        setResults(response.data);
        setCurrentPage(page);
      } else {
        setError('Failed to search books');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, authorQuery, subjectQuery, isbnQuery, searchSource]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1);
  };

  const handleSubjectClick = (subject: Subject) => {
    setSubjectQuery(subject.key);
    setSearchQuery('');
    setAuthorQuery('');
    setIsbnQuery('');
    performSearch(1, { subject: subject.key, query: '', author: '', isbn: '' });
  };

  const handleBookClick = (book: ExternalBook) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const handleAddToLibrary = async () => {
    if (!selectedBook || !token) return;
    
    setAddingToLibrary(true);
    try {
      await createBook(
        selectedBook.title,
        selectedBook.author,
        selectedBook.isbn || `EXT-${Date.now()}`,
        selectedBook.description || 'No description available',
        1,
        token
      );
      toast.success('Book Added', `"${selectedBook.title}" has been added to the library!`);
      setShowBookModal(false);
    } catch (err) {
      toast.error('Failed', err instanceof Error ? err.message : 'Could not add book to library');
    } finally {
      setAddingToLibrary(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAuthorQuery('');
    setSubjectQuery('');
    setIsbnQuery('');
    setResults(null);
    setShowSubjects(true);
    setError('');
  };

  return (
    <div className="external-book-search">
      <div className="search-header">
        <h2>🌐 Explore Millions of Books</h2>
        <p>Search from Google Books & Open Library - Access over 1 Lakh+ books worldwide</p>
      </div>

      {/* Search Form */}
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-inputs">
          <div className="search-row">
            <div className="input-group">
              <label>📚 Book Title / Keywords</label>
              <input
                type="text"
                placeholder="e.g., Harry Potter, Machine Learning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>✍️ Author Name</label>
              <input
                type="text"
                placeholder="e.g., J.K. Rowling, Chetan Bhagat..."
                value={authorQuery}
                onChange={(e) => setAuthorQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="search-row">
            <div className="input-group">
              <label>📂 Subject / Category</label>
              <input
                type="text"
                placeholder="e.g., Java, Python, Fiction, History..."
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>🔢 ISBN</label>
              <input
                type="text"
                placeholder="e.g., 978-0143039648"
                value={isbnQuery}
                onChange={(e) => setIsbnQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="search-options">
          <div className="source-selector">
            <label htmlFor="search-source">Search Source:</label>
            <select 
              id="search-source" 
              title="Select search source" 
              aria-label="Select search source"
              value={searchSource} 
              onChange={(e) => setSearchSource(e.target.value as 'all' | 'google' | 'openlibrary')}
            >
              <option value="all">All Sources</option>
              <option value="google">Google Books</option>
              <option value="openlibrary">Open Library</option>
            </select>
          </div>
          <div className="search-buttons">
            <button type="submit" className="btn-search" disabled={loading}>
              {loading ? '🔍 Searching...' : '🔍 Search Books'}
            </button>
            <button type="button" className="btn-clear" onClick={clearSearch}>
              ✖ Clear
            </button>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Debug Info - Remove after testing */}
      {import.meta.env.DEV && (
        <div className="debug-panel">
          <strong>Debug Info:</strong>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Results exist: {results ? 'Yes' : 'No'}</div>
          <div>Books count: {results?.books?.length || 0}</div>
          <div>Total items: {results?.totalItems || 0}</div>
          <div>Show subjects: {showSubjects ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Popular Subjects */}
      {showSubjects && subjects.length > 0 && (
        <div className="subjects-section">
          <h3>📚 Browse by Category</h3>
          <div className="subjects-grid">
            {subjects.map((subject) => (
              <button
                key={subject.key}
                className="subject-chip"
                onClick={() => handleSubjectClick(subject)}
              >
                {subject.name}
                <span className="count">{(subject.count / 1000).toFixed(0)}K+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results && (
        <div className="results-section">
          <div className="results-header">
            <h3>📖 Search Results</h3>
            <span className="total-count">
              Found {results.totalItems.toLocaleString()} books
            </span>
          </div>

          {results.books.length === 0 ? (
            <div className="no-results">
              <p>No books found. Try different search terms.</p>
            </div>
          ) : (
            <>
              <div className="books-grid">
                {results.books.map((book) => (
                  <div 
                    key={book.id} 
                    className="book-card"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="book-cover">
                      {book.thumbnail ? (
                        <img src={book.thumbnail} alt={book.title} />
                      ) : (
                        <div className="no-cover">📖</div>
                      )}
                      <span className={`source-badge ${book.source}`}>
                        {book.source === 'google' ? 'Google' : 'OpenLib'}
                      </span>
                    </div>
                    <div className="book-info">
                      <h4 className="book-title">{book.title}</h4>
                      <p className="book-author">{book.author}</p>
                      <p className="book-year">{book.publishedDate}</p>
                      {book.categories.length > 0 && (
                        <div className="book-categories">
                          {book.categories.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="category-tag">{cat}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button 
                  className="btn-pagination" 
                  onClick={() => performSearch(currentPage - 1)}
                  disabled={loading || currentPage === 1}
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {currentPage} {results.totalItems > 0 ? `of ${Math.ceil(results.totalItems / 40)}` : ''}
                </span>
                <button 
                  className="btn-pagination" 
                  onClick={() => performSearch(currentPage + 1)}
                  disabled={loading || !results.hasMore}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Book Detail Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Book Details"
        size="large"
      >
        {selectedBook && (
          <div className="book-detail-modal">
            <div className="book-detail-header">
              <div className="book-detail-cover">
                {selectedBook.thumbnail ? (
                  <img src={selectedBook.thumbnail} alt={selectedBook.title} />
                ) : (
                  <div className="no-cover-large">📖</div>
                )}
              </div>
              <div className="book-detail-info">
                <h2>{selectedBook.title}</h2>
                <p className="author">by {selectedBook.author}</p>
                <div className="meta-info">
                  {selectedBook.publisher && (
                    <p><strong>Publisher:</strong> {selectedBook.publisher}</p>
                  )}
                  {selectedBook.publishedDate && (
                    <p><strong>Published:</strong> {selectedBook.publishedDate}</p>
                  )}
                  {selectedBook.pageCount > 0 && (
                    <p><strong>Pages:</strong> {selectedBook.pageCount}</p>
                  )}
                  {selectedBook.isbn && (
                    <p><strong>ISBN:</strong> {selectedBook.isbn}</p>
                  )}
                  {selectedBook.language && (
                    <p><strong>Language:</strong> {selectedBook.language.toUpperCase()}</p>
                  )}
                </div>
                {selectedBook.categories.length > 0 && (
                  <div className="categories">
                    <strong>Categories:</strong>
                    <div className="category-tags">
                      {selectedBook.categories.map((cat, idx) => (
                        <span key={idx} className="category-tag">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="book-description">
              <h3>Description</h3>
              <p dangerouslySetInnerHTML={{ __html: selectedBook.description || 'No description available.' }} />
            </div>

            <div className="book-actions">
              {selectedBook.previewLink && (
                <a 
                  href={selectedBook.previewLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-preview"
                >
                  👁️ Preview Book
                </a>
              )}
              {selectedBook.infoLink && (
                <a 
                  href={selectedBook.infoLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-info"
                >
                  ℹ️ More Info
                </a>
              )}
              {user?.role === 'admin' && (
                <button 
                  className="btn-add-library"
                  onClick={handleAddToLibrary}
                  disabled={addingToLibrary}
                >
                  {addingToLibrary ? '📚 Adding...' : '📚 Add to Library'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExternalBookSearch;

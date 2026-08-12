import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import '../styles/BookDetail.css';

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
  pdfUrl?: string;
  pageCount?: number;
  publicationYear?: number;
  publisher?: string;
  categories?: string[];
  coverImage?: string;
  rating?: number;
}

interface BookDetailProps {
  book: Book;
  onClose: () => void;
  onBorrow?: (bookId: string) => Promise<void>;
  isBorrowing?: boolean;
}

const BookDetail: React.FC<BookDetailProps> = ({ book, onClose, onBorrow, isBorrowing = false }) => {
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  const handleReadPDF = () => {
    if (book.pdfUrl && book.pdfUrl.trim() !== '') {
      // Validate PDF URL format
      if (book.pdfUrl.startsWith('/api/pdfs/') || book.pdfUrl.startsWith('http')) {
        setShowPDFViewer(true);
      } else {
        alert('Invalid PDF URL format');
      }
    } else {
      alert('No PDF available for this book');
    }
  };

  const handleBorrow = async () => {
    if (onBorrow) {
      try {
        await onBorrow(book.id);
      } catch (error) {
        console.error('Error borrowing book:', error);
      }
    }
  };

  if (showPDFViewer && book.pdfUrl) {
    return (
      <PDFViewer
        pdfUrl={book.pdfUrl}
        title={book.title}
        onClose={() => setShowPDFViewer(false)}
      />
    );
  }

  return (
    <div className="book-detail-overlay">
      <div className="book-detail-modal">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="book-detail-content">
          <div className="book-detail-left">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="book-cover" />
            ) : (
              <div className="book-cover-placeholder">
                <span>📖</span>
              </div>
            )}
          </div>

          <div className="book-detail-right">
            <h1 className="book-title">{book.title}</h1>

            <div className="book-author">
              <span className="label">Author:</span>
              <span className="value">{book.author}</span>
            </div>

            {book.publisher && (
              <div className="book-meta">
                <span className="label">Publisher:</span>
                <span className="value">{book.publisher}</span>
              </div>
            )}

            {book.publicationYear && (
              <div className="book-meta">
                <span className="label">Published:</span>
                <span className="value">{book.publicationYear}</span>
              </div>
            )}

            {book.isbn && (
              <div className="book-meta">
                <span className="label">ISBN:</span>
                <span className="value">{book.isbn}</span>
              </div>
            )}

            {book.pageCount && (
              <div className="book-meta">
                <span className="label">Pages:</span>
                <span className="value">{book.pageCount}</span>
              </div>
            )}

            {book.rating && (
              <div className="book-meta">
                <span className="label">Rating:</span>
                <span className="value">
                  {'⭐'.repeat(Math.round(book.rating))} ({book.rating.toFixed(1)}/5)
                </span>
              </div>
            )}

            <div className={`availability ${book.available ? 'available' : 'unavailable'}`}>
              {book.available ? (
                <>
                  <span className="status-badge available-badge">Available</span>
                  <span className="copy-count">{book.availableCopies} of {book.totalCopies} copies available</span>
                </>
              ) : (
                <>
                  <span className="status-badge unavailable-badge">Unavailable</span>
                  <span className="copy-count">All {book.totalCopies} copies are borrowed</span>
                </>
              )}
            </div>

            <div className="book-description">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>

            {book.categories && book.categories.length > 0 && (
              <div className="book-categories">
                <h3>Categories</h3>
                <div className="category-list">
                  {book.categories.map((category, index) => (
                    <span key={index} className="category-tag">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="book-actions">
              {book.pdfUrl && (
                <button
                  className="action-btn btn-read-pdf"
                  onClick={handleReadPDF}
                  title="Read PDF"
                >
                  📖 Read PDF
                </button>
              )}
              {book.available && onBorrow && (
                <button
                  className="action-btn btn-borrow"
                  onClick={handleBorrow}
                  disabled={isBorrowing}
                  title="Borrow this book"
                >
                  {isBorrowing ? 'Borrowing...' : '📚 Borrow Book'}
                </button>
              )}
              <button
                className="action-btn btn-close"
                onClick={onClose}
                title="Close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;

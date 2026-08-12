// AI Recommendations Component - Personalized book suggestions
// Uses machine learning to provide intelligent book recommendations

import React, { useState, useEffect } from 'react';
import { getAIRecommendations, getSimilarBooks } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import '../styles/AIRecommendations.css';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  available: boolean;
  categories?: string[];
  rating?: number;
  coverImage?: string;
}

interface Recommendation {
  book: Book;
  score: number;
  reasons: string[];
  confidence: number;
}

interface AIRecommendationsProps {
  bookId?: string; // If provided, shows similar books instead of personalized
  limit?: number;
  onViewBook?: (book: Book) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ bookId, limit = 6, onViewBook }) => {
  const { token } = useAuth();
  const toast = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [bookId, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      let response: any;
      
      if (bookId) {
        // Get similar books
        response = await getSimilarBooks(bookId, limit);
      } else {
        // Get personalized recommendations
        if (!token) {
          setError('Please log in to see personalized recommendations');
          setLoading(false);
          return;
        }
        response = await getAIRecommendations(limit, token);
      }

      if (response.success) {
        const recs = bookId 
          ? response.data.similarBooks.map((book: any) => ({
              book,
              score: book.similarityScore || 0,
              reasons: ['Similar content and style'],
              confidence: 80,
            }))
          : response.data.recommendations;
        
        setRecommendations(recs);
      } else {
        setError(response.message || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Recommendations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-recommendations">
        <div className="recommendations-header">
          <h2>🤖 {bookId ? 'Similar Books' : 'AI Recommendations for You'}</h2>
          <p>Analyzing your reading preferences...</p>
        </div>
        <div className="loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-recommendations">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchRecommendations} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="ai-recommendations">
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <h3>No recommendations yet</h3>
          <p>
            {bookId 
              ? 'No similar books found at the moment.'
              : 'Start borrowing books to get personalized recommendations!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recommendations">
      <div className="recommendations-header">
        <h2>
          🤖 {bookId ? 'Similar Books You Might Like' : 'AI Picks Just for You'}
        </h2>
        <p>
          {bookId
            ? 'Based on book content and themes'
            : 'Powered by machine learning based on your reading history'}
        </p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((rec) => (
          <div key={rec.book.id} className="recommendation-card">
            {/* Confidence Badge */}
            <div className="confidence-badge">
              <span className="confidence-value">{rec.confidence}%</span>
              <span className="confidence-label">Match</span>
            </div>

            {/* Book Cover */}
            <div className="book-cover-container">
              {rec.book.coverImage ? (
                <img src={rec.book.coverImage} alt={rec.book.title} />
              ) : (
                <div className="no-cover">
                  <span>📖</span>
                </div>
              )}
              {rec.book.rating && (
                <div className="rating-badge">
                  ⭐ {rec.book.rating.toFixed(1)}
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="book-info">
              <h3 className="book-title">{rec.book.title}</h3>
              <p className="book-author">by {rec.book.author}</p>
              
              {rec.book.categories && rec.book.categories.length > 0 && (
                <div className="book-categories">
                  {rec.book.categories.slice(0, 2).map((cat, idx) => (
                    <span key={idx} className="category-tag">{cat}</span>
                  ))}
                </div>
              )}

              {/* AI Reasons */}
              <div className="ai-reasons">
                <p className="reasons-title">Why we recommend this:</p>
                <ul>
                  {rec.reasons.slice(0, 2).map((reason, idx) => (
                    <li key={idx}>
                      <span className="reason-icon">✓</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Availability */}
              <div className={`availability ${rec.book.available ? 'available' : 'unavailable'}`}>
                <span className="availability-dot"></span>
                {rec.book.available ? 'Available now' : 'Currently borrowed'}
              </div>
            </div>

            {/* Action Button */}
            <button
              className="view-book-btn"
              onClick={() => {
                if (onViewBook) {
                  onViewBook(rec.book);
                } else {
                  toast.info('Book Details', `${rec.book.title} by ${rec.book.author}`);
                }
              }}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {!bookId && recommendations.length > 0 && (
        <div className="recommendations-footer">
          <p className="ai-note">
            💡 <strong>AI Tip:</strong> The more you read, the better our recommendations become!
          </p>
          <button onClick={fetchRecommendations} className="refresh-btn">
            🔄 Refresh Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;

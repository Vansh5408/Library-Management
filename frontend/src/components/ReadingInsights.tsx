// User Reading Insights - AI-powered reading analytics and achievements
// Shows personalized statistics, trends, and recommendations

import React, { useState, useEffect, useRef } from 'react';
import { getUserReadingInsights } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/ReadingInsights.css';

interface ReadingInsights {
  totalBooksRead: number;
  currentlyReading: number;
  favoriteGenres: Array<{ genre: string; count: number }>;
  favoriteAuthors: Array<{ author: string; count: number }>;
  readingStreak: number;
  avgBooksPerMonth: number;
  readingSpeed: string;
  diversityScore: number;
  achievements: string[];
}

const ReadingInsights: React.FC = () => {
  const { token } = useAuth();
  const [insights, setInsights] = useState<ReadingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const diversityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      fetchInsights();
    }
  }, [token]);

  useEffect(() => {
    // Apply widths after insights load
    if (insights && diversityRef.current) {
      const diversityFill = diversityRef.current.querySelector('.diversity-fill') as HTMLElement;
      if (diversityFill) {
        diversityFill.style.width = `${insights.diversityScore}%`;
      }

      const barFills = diversityRef.current.querySelectorAll('.bar-fill');
      const maxCount = insights.favoriteGenres[0]?.count || 1;
      barFills.forEach((bar, index) => {
        if (insights.favoriteGenres[index]) {
          const percentage = (insights.favoriteGenres[index].count / maxCount) * 100;
          (bar as HTMLElement).style.width = `${percentage}%`;
        }
      });
    }
  }, [insights]);

  const fetchInsights = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response: any = await getUserReadingInsights(token);
      if (response.success) {
        setInsights(response.data.insights);
      } else {
        setError('Failed to load insights');
      }
    } catch (err) {
      console.error('Insights error:', err);
      setError('Failed to load reading insights');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reading-insights">
        <div className="login-prompt">
          <span className="prompt-icon">🔒</span>
          <h3>Sign in to see your reading insights</h3>
          <p>Track your reading journey with AI-powered analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="reading-insights">
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your reading patterns...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="reading-insights">
        <div className="insights-error">
          <span>⚠️</span>
          <p>{error || 'Unable to load insights'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-insights" ref={diversityRef}>
      <div className="insights-header">
        <h2>📊 Your Reading Journey</h2>
        <p>AI-powered insights into your reading habits</p>
      </div>

      {/* Key Stats */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <span className="stat-icon">📚</span>
          <div className="stat-content">
            <h3>{insights.totalBooksRead}</h3>
            <p>Books Read</p>
          </div>
        </div>

        <div className="stat-card success">
          <span className="stat-icon">📖</span>
          <div className="stat-content">
            <h3>{insights.currentlyReading}</h3>
            <p>Currently Reading</p>
          </div>
        </div>

        <div className="stat-card warning">
          <span className="stat-icon">🔥</span>
          <div className="stat-content">
            <h3>{insights.readingStreak}</h3>
            <p>Month Streak</p>
          </div>
        </div>

        <div className="stat-card info">
          <span className="stat-icon">⚡</span>
          <div className="stat-content">
            <h3>{insights.avgBooksPerMonth}</h3>
            <p>Books/Month</p>
          </div>
        </div>
      </div>

      {/* Reading Profile */}
      <div className="insights-section">
        <h3>📖 Your Reading Profile</h3>
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-header">
              <span className="profile-icon">⏱️</span>
              <h4>Reading Speed</h4>
            </div>
            <div className="profile-value">
              <span className="speed-badge">{insights.readingSpeed}</span>
              <p className="profile-description">
                {insights.readingSpeed === 'Fast' && 'You finish books quickly!'}
                {insights.readingSpeed === 'Moderate' && 'You take your time to enjoy books'}
                {insights.readingSpeed === 'Leisurely' && 'You savor every page'}
              </p>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-header">
              <span className="profile-icon">🎯</span>
              <h4>Diversity Score</h4>
            </div>
            <div className="profile-value">
              <div className="diversity-meter">
                <div className="diversity-fill"></div>
              </div>
              <p className="diversity-number">{insights.diversityScore}%</p>
              <p className="profile-description">
                {insights.diversityScore > 70 && 'Excellent variety in your reading!'}
                {insights.diversityScore > 40 && insights.diversityScore <= 70 && 'Good mix of genres and authors'}
                {insights.diversityScore <= 40 && 'Try exploring new genres!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Genres */}
      {insights.favoriteGenres.length > 0 && (
        <div className="insights-section">
          <h3>🎭 Your Favorite Genres</h3>
          <div className="genres-chart">
            {insights.favoriteGenres.slice(0, 5).map((genre, index) => {
              return (
                <div key={index} className="genre-bar">
                  <div className="genre-label">
                    <span className="genre-name">{genre.genre}</span>
                    <span className="genre-count">{genre.count} books</span>
                  </div>
                  <div className="bar-container">
                    <div className="bar-fill"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Favorite Authors */}
      {insights.favoriteAuthors.length > 0 && (
        <div className="insights-section">
          <h3>✍️ Your Favorite Authors</h3>
          <div className="authors-grid">
            {insights.favoriteAuthors.slice(0, 6).map((author, index) => (
              <div key={index} className="author-card">
                <span className="author-icon">👤</span>
                <h4>{author.author}</h4>
                <p>{author.count} books read</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {insights.achievements.length > 0 && (
        <div className="insights-section achievements-section">
          <h3>🏆 Your Achievements</h3>
          <div className="achievements-grid">
            {insights.achievements.map((achievement, index) => (
              <div key={index} className="achievement-badge">
                <span className="badge-icon">{achievement.split(' ')[0]}</span>
                <p>{achievement.substring(achievement.indexOf(' ') + 1)}</p>
              </div>
            ))}
          </div>
          <div className="achievement-hint">
            <p>💡 Keep reading to unlock more achievements!</p>
          </div>
        </div>
      )}

      {/* AI Tips */}
      <div className="insights-section ai-tips">
        <h3>💡 AI Insights & Tips</h3>
        <div className="tips-container">
          {insights.readingStreak > 0 && (
            <div className="tip-card">
              <span className="tip-icon">🔥</span>
              <p>
                Great job maintaining your {insights.readingStreak}-month reading streak! 
                Keep it up!
              </p>
            </div>
          )}
          
          {insights.diversityScore < 50 && (
            <div className="tip-card">
              <span className="tip-icon">🌟</span>
              <p>
                Try exploring new genres to expand your reading horizons. 
                Check out our AI recommendations!
              </p>
            </div>
          )}
          
          {insights.avgBooksPerMonth > 2 && (
            <div className="tip-card">
              <span className="tip-icon">⭐</span>
              <p>
                You're an avid reader! Consider writing reviews to help others 
                discover great books.
              </p>
            </div>
          )}
          
          {insights.totalBooksRead === 0 && (
            <div className="tip-card">
              <span className="tip-icon">🚀</span>
              <p>
                Start your reading journey today! Browse our collection and 
                borrow your first book.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingInsights;

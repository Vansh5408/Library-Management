import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/LoginPage.css';

/**
 * Librarian/Admin Login Page
 * 
 * This page handles authentication for librarians and administrators.
 * Admin and librarian accounts can only be created via database seeding scripts.
 */
const LibrarianLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (!email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      const user = await login(email, password);
      
      // Verify user has librarian or admin privileges
      if (user.role !== 'librarian' && user.role !== 'admin') {
        setError('Access denied. This portal is for librarians and administrators only.');
        return;
      }
      
      navigate('/librarian');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container librarian-login">
      <div className="login-box">
        <div className="login-header">
          <h1>📚 Library Management</h1>
          <p className="librarian-badge">Librarian & Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn librarian-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Staff'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Not a staff member? <Link to="/login">User Login</Link>
          </p>
          <div className="security-notice">
            <small>
              🔒 Staff accounts are created by system administrators only.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianLoginPage;

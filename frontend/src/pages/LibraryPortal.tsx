import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboardEnhanced from '../components/AdminDashboardEnhanced';
import UserDashboardEnhanced from '../components/UserDashboardEnhanced';
import UserDashboard from '../components/UserDashboard';
import AdminDashboard from '../components/AdminDashboard';
import '../styles/LibraryPortal.css';

const LibraryPortal: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [hasError, setHasError] = React.useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="library-portal">
        <div className="portal-header">
          <div className="header-left">
            <h1>📚 Library Management System</h1>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
        <div className="portal-main">
          {isAdmin ? <AdminDashboard /> : <UserDashboard />}
        </div>
      </div>
    );
  }

  return (
    <div className="library-portal">
      <div className="portal-header">
        <div className="header-left">
          <h1>📚 Library Management System</h1>
          <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
            {isAdmin ? '👨‍💼 Admin' : '👤 User'}
          </span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="portal-main">
        <ErrorBoundary fallback={() => { setHasError(true); return null; }}>
          {isAdmin ? <AdminDashboardEnhanced /> : <UserDashboardEnhanced />}
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
    this.props.fallback();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default LibraryPortal;

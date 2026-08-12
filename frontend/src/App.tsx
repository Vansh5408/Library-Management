import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LibrarianLoginPage from './pages/LibrarianLoginPage';
import LibraryPortal from './pages/LibraryPortal';
import LibrarianDashboard from './components/LibrarianDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatbot from './components/AIChatbot';
import './App.css';
import './styles/AIChatbot.css';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  
  // Redirect librarians and admins to librarian dashboard
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  return (
    <>
      <Routes>
        {/* User Routes */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" />} />
        
        {/* Librarian/Admin Routes */}
        <Route path="/librarian/login" element={!isAuthenticated ? <LibrarianLoginPage /> : <Navigate to="/librarian" />} />
        {/* REMOVED: /librarian/signup route - staff accounts created via database only */}
        <Route
          path="/librarian"
          element={
            <ProtectedRoute>
              {isLibrarian ? <LibrarianDashboard /> : <Navigate to="/" />}
            </ProtectedRoute>
          }
        />
        
        {/* Main User Portal */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {isLibrarian ? <Navigate to="/librarian" /> : <LibraryPortal />}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global AI Chatbot - Shows for authenticated users */}
      {isAuthenticated && <AIChatbot />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

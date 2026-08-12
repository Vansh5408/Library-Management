import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/apiClient';

export type UserRole = 'admin' | 'user' | 'librarian';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  isLibrarian: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * Login function - supports all user roles
   */
  const login = async (email: string, password: string): Promise<User> => {
    const response = (await loginUser(email, password)) as { 
      success: boolean; 
      data?: { user: User; token: string }; 
      message?: string 
    };
    
    if (response.success && response.data) {
      const userData = response.data.user;
      setUser(userData);
      setToken(response.data.token);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.token);
      return userData;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  /**
   * Signup function - ONLY creates regular user accounts
   * Admin and librarian accounts must be created via database seeding
   */
  const signup = async (email: string, password: string, name: string): Promise<User> => {
    // SECURITY: No role parameter - always creates 'user' accounts
    const response = (await registerUser(email, password, name)) as { 
      success: boolean; 
      data?: { user: User; token: string }; 
      message?: string 
    };
    
    if (response.success && response.data) {
      const userData = response.data.user;
      
      // SECURITY: Verify the created account is a regular user
      if (userData.role !== 'user') {
        throw new Error('Registration failed: Invalid account type');
      }
      
      setUser(userData);
      setToken(response.data.token);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.token);
      return userData;
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAdmin = user?.role === 'admin';
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, token, login, signup, logout, isAdmin, isLibrarian }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

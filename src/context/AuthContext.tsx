import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('[AuthContext] Stored token exists:', !!storedToken);
      console.log('[AuthContext] Stored user exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('[AuthContext] Restoring user from localStorage:', parsedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch (error) {
          console.error('[AuthContext] Error parsing stored user:', error);
          // Clear invalid stored data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('[AuthContext] No valid stored authentication found');
      }
      
      setIsLoading(false);
      console.log('[AuthContext] Authentication initialization complete');
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting login for username:', username);
      const { authAPI } = await import('../services/api');
      const response = await authAPI.login(username, password);
      
      console.log('[AuthContext] Login successful, saving to localStorage');
      setToken(response.token);
      setUser(response.user);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log('[AuthContext] User and token saved to localStorage');
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[AuthContext] User logged out and localStorage cleared');
  };

  const validateToken = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.log('[AuthContext] No token to validate');
      return false;
    }

    try {
      // Make a simple authenticated request to validate token
      const { default: axios } = await import('axios');
      const response = await axios.get('/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });
      
      console.log('[AuthContext] Token validation successful', response);
      return true;
    } catch (error: any) {
      // If validation endpoint doesn't exist (404), assume token is still valid
      if (error.response?.status === 404) {
        console.log('[AuthContext] Validation endpoint not found, assuming token is valid');
        return true;
      }
      
      // For other errors (401, 403, etc.), token is invalid
      console.warn('[AuthContext] Token validation failed:', error.response?.status);
      logout();
      return false;
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  registerClient: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in and token is still valid
    const checkAuthStatus = async () => {
      const token = authService.getToken();
      const savedUser = authService.getCurrentUser();

      if (token && savedUser) {
        try {
          // Verify token is still valid by making a test request
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/dashboard`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            setUser(savedUser);
          } else {
            // Token is invalid, clear stored data
            console.log('Token expired or invalid, logging out');
            authService.logout();
          }
        } catch (error) {
          // Network error or other issue, clear stored data to be safe
          console.log('Error verifying token, logging out', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const response = await authService.login(phone, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const registerClient = async (name: string, phone: string, password: string) => {
    try {
      await authService.registerClient({ name, phone, password });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    registerClient,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
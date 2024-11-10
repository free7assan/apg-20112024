import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserModel } from '../models/UserModel';
import { hashPassword, comparePasswords } from '../utils/password';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValid = await comparePasswords(password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const userData = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      throw error;
    }
  };

  const loginWithGoogle = async (accessToken: string): Promise<void> => {
    try {
      setError(null);
      
      // Fetch user info from Google token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Google user info');
      }

      const googleUser: GoogleUser = await response.json();
      
      // Check if user exists
      let user = await UserModel.findByEmail(googleUser.email);
      
      if (!user) {
        // Create new user if doesn't exist
        user = await UserModel.create({
          email: googleUser.email,
          password_hash: await hashPassword(Math.random().toString(36)),
          role: 'user'
        });
      }

      const userData = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Google authentication error:', error);
      setError(error instanceof Error ? error.message : 'Google authentication failed');
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      const hashedPassword = await hashPassword(password);
      
      const newUser = await UserModel.create({
        email,
        password_hash: hashedPassword,
        role: 'user'
      });

      const userData = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    error,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
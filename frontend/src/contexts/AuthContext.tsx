import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  profile_photo_url?: string | null;
  theme_color?: string | null;
  favorite_role?: string | null;
  favorite_agent_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const csrf = () => axios.get('/sanctum/csrf-cookie');

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/user');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.theme_color) {
      document.documentElement.style.setProperty('--color-primary', user.theme_color);
    } else {
      // Revert to default Trickster Yellow
      document.documentElement.style.setProperty('--color-primary', '#FFEB00');
    }
  }, [user?.theme_color]);

  const login = async (data: any) => {
    await csrf();
    await axios.post('/api/v1/auth/session/login', data);
    // Explicitly fetch user so it throws if session is not established
    const response = await axios.get('/api/user');
    setUser(response.data);
    return response.data;
  };

  const register = async (data: any) => {
    await csrf();
    await axios.post('/api/v1/auth/session/register', data);
    // Explicitly fetch user so it throws if session is not established
    const response = await axios.get('/api/user');
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    await csrf();
    await axios.post('/api/v1/auth/session/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

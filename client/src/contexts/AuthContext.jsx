import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { setToken, getToken, removeToken, setUser as saveUser, getUser as loadUser, removeUser } from '../utils/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const savedUser = loadUser();
    
    if (token && savedUser) {
      setUser(savedUser);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext: calling login API');
      const response = await authAPI.login(credentials);
      console.log('AuthContext: login response:', response);
      const { token, provider } = response.data;
      
      console.log('AuthContext: saving token and user', { provider });
      setToken(token);
      saveUser(provider);
      setUser(provider);
      
      return { success: true, user: provider };
    } catch (error) {
      console.error('AuthContext: login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, provider } = response.data;
      
      setToken(token);
      saveUser(provider);
      setUser(provider);
      
      return { success: true, user: provider };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

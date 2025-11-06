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
    const initAuth = async () => {
      const token = getToken();
      const savedUser = loadUser();
      
      if (token && savedUser) {
        try {
          const response = await authAPI.me();
          if (response.data.success && response.data.provider) {
            setUser(response.data.provider);
          } else {
            console.warn('Token validation failed, clearing auth');
            removeToken();
            removeUser();
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to validate token, clearing auth:', error);
          removeToken();
          removeUser();
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext: calling login API');
      const response = await authAPI.login(credentials);
      console.log('AuthContext: login response:', response);
      
      const { success, token, provider, message } = response.data;
      
      if (!success || !provider) {
        console.error('AuthContext: login failed', { success, message });
        return { 
          success: false, 
          error: message || 'Login failed'
        };
      }
      
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
      const { success, token, provider, message } = response.data;
      
      if (!success || !provider) {
        return { 
          success: false, 
          error: message || 'Registration failed'
        };
      }
      
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

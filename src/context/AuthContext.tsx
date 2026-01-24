'use client';

import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean | null;
  loading: boolean;
  user: User | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  register: (formData: any) => Promise<void>;
  login: (formData: any) => Promise<void>;
  logout: () => void;
  clearErrors: () => void;
  loadUser: () => Promise<void>;
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  register: async () => {},
  login: async () => {},
  logout: () => {},
  clearErrors: () => {},
  loadUser: async () => {},
});

const authReducer = (state: AuthState, action: any): AuthState => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
      };
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'REGISTER_FAIL':
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null,
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get('/api/auth');
        dispatch({ type: 'USER_LOADED', payload: res.data });
      } catch (err) {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } else {
        dispatch({ type: 'AUTH_ERROR' });
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const register = async (formData: any) => {
    try {
      const res = await axios.post('/api/register', formData);
      setAuthToken(res.data.token);
      dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    } catch (err: any) {
      dispatch({ type: 'REGISTER_FAIL', payload: err.response?.data?.msg || 'Registration failed' });
      throw err;
    }
  };

  const login = async (formData: any) => {
    try {
      const res = await axios.post('/api/auth', formData);
      setAuthToken(res.data.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    } catch (err: any) {
      const msg = err.response?.data?.msg || 'Login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: msg });
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const clearErrors = () => dispatch({ type: 'CLEAR_ERRORS' });

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        user: state.user,
        error: state.error,
        register,
        login,
        logout,
        clearErrors,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../utils/api';

export const AuthContext = createContext({
  user: null,
  signIn: async (email, password) => {},
  signUp: async (email, password) => {},
  signOut: async () => {},
  openAuthModal: (mode) => {},
  closeAuthModal: () => {},
  authModal: { open: false, mode: 'signin' },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState({ open: false, mode: 'signin' });

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        api.setToken(token);
        setUser(JSON.parse(userStr));
      }
    })();
  }, []);

  const signIn = async (email, password) => {
    try {
      const res = await api.signIn(email, password);
      api.setToken(res.token);
      setUser(res.user);
      await AsyncStorage.setItem('jwtToken', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));
      return true;
    } catch (e) {
      return false;
    }
  };

  const signUp = async (email, password) => {
    try {
      await api.signUp(email, password);
      // Immediately sign in after sign up
      return await signIn(email, password);
    } catch (e) {
      return false;
    }
  };

  const signOut = async () => {
    setUser(null);
    api.setToken('');
    await AsyncStorage.removeItem('jwtToken');
    await AsyncStorage.removeItem('user');
  };

  const openAuthModal = (mode) => setAuthModal({ open: true, mode });
  const closeAuthModal = () => setAuthModal({ open: false, mode: 'signin' });

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, openAuthModal, closeAuthModal, authModal }}>
      {children}
    </AuthContext.Provider>
  );
} 
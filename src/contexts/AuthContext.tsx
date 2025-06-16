import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase';

interface AuthContextType {
  user: firebase.User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  initializing: true,
  isAuthenticated: false,
  signOut: async () => {},
});

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
  const [user, setUser] = useState<firebase.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return;
    }
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    initializing,
    isAuthenticated: !!user,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

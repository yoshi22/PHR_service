import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '../firebase';
import { getUserSettings } from '../services/userSettingsService';

/**
 * User settings interface
 */
interface UserSettings {
  stepGoal: number;
  notificationTime: string;
}

/**
 * Settings context type definition
 */
interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (updates: Partial<UserSettings>) => void;
  clearError: () => void;
  hasSettings: boolean;
}

/**
 * Default context value
 */
const defaultContextValue: SettingsContextType = {
  settings: null,
  isLoading: false,
  error: null,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
  clearError: () => {},
  hasSettings: false,
};

/**
 * Settings context for user settings management
 */
const SettingsContext = createContext<SettingsContextType>(defaultContextValue);

/**
 * Settings provider props
 */
interface SettingsProviderProps {
  children: React.ReactNode;
}

/**
 * Settings provider component for user settings management
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh settings from the server
   */
  const refreshSettings = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) {
      setSettings(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userSettings = await getUserSettings(user.uid);
      setSettings({
        stepGoal: userSettings.stepGoal,
        notificationTime: userSettings.notificationTime,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Error refreshing settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update local settings without server sync
   */
  const updateLocalSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
    clearError();
  }, [clearError]);

  /**
   * Load settings when authentication state changes
   */
  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      if (user) {
        refreshSettings();
      } else {
        setSettings(null);
        setError(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [refreshSettings]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<SettingsContextType>(() => ({
    settings,
    isLoading,
    error,
    refreshSettings,
    updateLocalSettings,
    clearError,
    hasSettings: settings !== null,
  }), [settings, isLoading, error, refreshSettings, updateLocalSettings, clearError]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use settings context
 * @returns Settings context value
 * @throws Error if used outside of SettingsProvider
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

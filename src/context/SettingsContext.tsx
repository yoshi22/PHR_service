import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { getUserSettings } from '../services/userSettingsService';

interface UserSettings {
  stepGoal: number;
  notificationTime: string;
}

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (updates: Partial<UserSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const userSettings = await getUserSettings(user.uid);
      setSettings({
        stepGoal: userSettings.stepGoal,
        notificationTime: userSettings.notificationTime,
      });
    } catch (error) {
      console.error('Error refreshing settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocalSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Load settings when user changes
  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      if (user) {
        refreshSettings();
      } else {
        setSettings(null);
      }
    });

    return unsubscribe;
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      refreshSettings,
      updateLocalSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

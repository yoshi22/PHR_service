import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme as NavigationDarkTheme, Theme } from '@react-navigation/native';
import { colors } from '../styles';

/**
 * Extended theme interface with additional color definitions
 */
export interface ExtendedTheme extends Theme {
  colors: Theme['colors'] & {
    // Navigation colors
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    // Application-specific colors
    accent: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    cardBackground: string;
    buttonBackground: string;
    buttonText: string;
    inputBackground: string;
    shadow: string;
    // Additional semantic colors
    textSecondary: string;
    surface: string;
    overlay: string;
  };
}

/**
 * Light theme configuration
 */
export const LightTheme: ExtendedTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
    accent: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    cardBackground: colors.surface,
    buttonBackground: colors.primary,
    buttonText: colors.textInverse,
    inputBackground: colors.backgroundSecondary,
    shadow: colors.shadow,
    textSecondary: colors.textSecondary,
    surface: colors.surface,
    overlay: colors.overlay,
  },
};

/**
 * Dark theme configuration
 */
export const DarkTheme: ExtendedTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.primary,
    background: '#121212',
    card: '#1E1E1E',
    text: colors.textInverse,
    border: '#2D2D2D',
    notification: colors.error,
    accent: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    cardBackground: '#2D2D2D',
    buttonBackground: colors.primary,
    buttonText: colors.textInverse,
    inputBackground: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
    textSecondary: '#8E8E93',
    surface: '#1E1E1E',
    overlay: colors.overlay,
  },
};

/**
 * Theme context type definition
 */
interface ThemeContextType {
  theme: ExtendedTheme;
  isDarkMode: boolean;
  isLoading: boolean;
  toggleTheme: () => Promise<void>;
  setDarkMode: (isDark: boolean) => Promise<void>;
  resetToSystemTheme: () => Promise<void>;
}

/**
 * Default context value
 */
const defaultContextValue: ThemeContextType = {
  theme: LightTheme,
  isDarkMode: false,
  isLoading: true,
  toggleTheme: async () => {},
  setDarkMode: async () => {},
  resetToSystemTheme: async () => {},
};

/**
 * Theme context for theme management
 */
const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme storage key
 */
const THEME_STORAGE_KEY = 'themePreference';

/**
 * Theme provider component for theme management
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Load theme preference from storage
   */
  const loadThemePreference = useCallback(async () => {
    try {
      const themePreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (themePreference === null) {
        // Use system preference if no saved preference
        setIsDarkMode(colorScheme === 'dark');
      } else {
        // Use saved preference
        setIsDarkMode(themePreference === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      // Fallback to system preference
      setIsDarkMode(colorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  }, [colorScheme]);

  /**
   * Save theme preference to storage
   */
  const saveThemePreference = useCallback(async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  /**
   * Toggle between light and dark theme
   */
  const toggleTheme = useCallback(async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await saveThemePreference(newMode);
  }, [isDarkMode, saveThemePreference]);

  /**
   * Set specific theme mode
   */
  const setDarkMode = useCallback(async (isDark: boolean) => {
    setIsDarkMode(isDark);
    await saveThemePreference(isDark);
  }, [saveThemePreference]);

  /**
   * Reset to system theme preference
   */
  const resetToSystemTheme = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      setIsDarkMode(colorScheme === 'dark');
    } catch (error) {
      console.error('Failed to reset theme preference:', error);
    }
  }, [colorScheme]);

  /**
   * Load theme preference on mount and color scheme change
   */
  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  /**
   * Current theme based on mode
   */
  const theme = useMemo(() => isDarkMode ? DarkTheme : LightTheme, [isDarkMode]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    isDarkMode,
    isLoading,
    toggleTheme,
    setDarkMode,
    resetToSystemTheme,
  }), [theme, isDarkMode, isLoading, toggleTheme, setDarkMode, resetToSystemTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 * @returns Theme context value
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Backward compatibility alias
 * @deprecated Use useTheme instead
 */
export const useThemeContext = useTheme;

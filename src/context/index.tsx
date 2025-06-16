/**
 * Centralized context exports for easy imports and consistent naming
 */
import React from 'react';
import { ErrorProvider, useError } from './ErrorContext';
import { LoadingProvider, useLoading } from './LoadingContext';
import { ToastProvider, useToast } from './ToastContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { SettingsProvider, useSettings } from './SettingsContext';

// Error context
export { ErrorProvider, useError } from './ErrorContext';
export type { ErrorContextType } from './ErrorContext';

// Loading context
export { LoadingProvider, useLoading } from './LoadingContext';
export type { LoadingContextType } from './LoadingContext';

// Settings context
export { SettingsProvider, useSettings } from './SettingsContext';
export type { SettingsContextType, UserSettings } from './SettingsContext';

// Theme context
export { 
  ThemeProvider, 
  useTheme, 
  useThemeContext, // Deprecated, use useTheme
  LightTheme, 
  DarkTheme 
} from './ThemeContext';
export type { ExtendedTheme, ThemeContextType } from './ThemeContext';

// Toast context
export { ToastProvider, useToast } from './ToastContext';
export type { ToastContextType, ToastConfig, ToastType, ToastPosition } from './ToastContext';

/**
 * Combined providers for convenient app-wide setup
 * Usage:
 * ```tsx
 * import { AppProviders } from './context';
 * 
 * function App() {
 *   return (
 *     <AppProviders>
 *       <YourAppContent />
 *     </AppProviders>
 *   );
 * }
 * ```
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorProvider>
      <LoadingProvider>
        <ToastProvider>
          <ThemeProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </ThemeProvider>
        </ToastProvider>
      </LoadingProvider>
    </ErrorProvider>
  );
};

/**
 * Hook to use multiple contexts at once
 * @returns Object containing all context values
 */
export const useAppContext = () => {
  const error = useError();
  const loading = useLoading();
  const settings = useSettings();
  const theme = useTheme();
  const toast = useToast();

  return {
    error,
    loading,
    settings,
    theme,
    toast,
  };
};
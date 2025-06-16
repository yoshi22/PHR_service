import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles';
import ErrorFallback from '../components/ErrorFallback';

/**
 * Error context type definition with comprehensive error handling
 */
interface ErrorContextType {
  error: string | null;
  showError: (message: string, onRetry?: () => void) => void;
  clearError: () => void;
  hasError: boolean;
}

/**
 * Default context value
 */
const defaultContextValue: ErrorContextType = {
  error: null,
  showError: () => {},
  clearError: () => {},
  hasError: false,
};

/**
 * Error context for global error state management
 */
const ErrorContext = createContext<ErrorContextType>(defaultContextValue);

/**
 * Hook to use error context
 * @returns Error context value
 * @throws Error if used outside of ErrorProvider
 */
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

/**
 * Error provider props
 */
interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * Error provider component for global error handling
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | undefined>();

  /**
   * Show error with optional retry callback
   */
  const showError = useCallback((message: string, onRetry?: () => void) => {
    setError(message);
    setRetry(() => onRetry);
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetry(undefined);
  }, []);

  /**
   * Handle retry action
   */
  const handleRetry = useCallback(() => {
    clearError();
    if (retry) {
      retry();
    }
  }, [clearError, retry]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<ErrorContextType>(() => ({
    error,
    showError,
    clearError,
    hasError: error !== null,
  }), [error, showError, clearError]);

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {error && (
        <View style={styles.overlay}>
          <ErrorFallback
            message={error}
            onRetry={handleRetry}
          />
        </View>
      )}
    </ErrorContext.Provider>
  );
};

/**
 * Styles using the design system
 */
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
});

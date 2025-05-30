import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import ErrorFallback from '../components/ErrorFallback';

type ErrorContextType = {
  showError: (message: string, onRetry?: () => void) => void;
  clearError: () => void;
};

const ErrorContext = createContext<ErrorContextType>({
  showError: () => {},
  clearError: () => {},
});

export const useError = (): ErrorContextType => useContext(ErrorContext);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | undefined>();

  const showError = (message: string, onRetry?: () => void) => {
    setError(message);
    setRetry(() => onRetry);
  };

  const clearError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      {error && (
        <View style={styles.overlay}>
          <ErrorFallback
            message={error}
            onRetry={() => {
              clearError();
              retry && retry();
            }}
          />
        </View>
      )}
    </ErrorContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
  },
});

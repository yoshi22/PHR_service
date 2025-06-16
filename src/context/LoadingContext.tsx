import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../styles';

/**
 * Loading context type definition
 */
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

/**
 * Default context value
 */
const defaultContextValue: LoadingContextType = {
  isLoading: false,
  setLoading: () => {},
  startLoading: () => {},
  stopLoading: () => {},
};

/**
 * Loading context for global loading state management
 */
const LoadingContext = createContext<LoadingContextType>(defaultContextValue);

/**
 * Hook to use loading context
 * @returns Loading context value
 * @throws Error if used outside of LoadingProvider
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/**
 * Loading provider props
 */
interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Loading provider component for global loading state management
 */
export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setLoadingState] = useState<boolean>(false);

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading);
  }, []);

  /**
   * Start loading
   */
  const startLoading = useCallback(() => {
    setLoadingState(true);
  }, []);

  /**
   * Stop loading
   */
  const stopLoading = useCallback(() => {
    setLoadingState(false);
  }, []);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<LoadingContextType>(() => ({
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
  }), [isLoading, setLoading, startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {isLoading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </LoadingContext.Provider>
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
  },
});

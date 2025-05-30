import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

type LoadingContextType = {
  setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType>({ setLoading: () => {} });

export const useLoading = (): LoadingContextType => useContext(LoadingContext);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoadingState] = useState(false);

  return (
    <LoadingContext.Provider value={{ setLoading: setLoadingState }}>
      {children}
      {loading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
    </LoadingContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});

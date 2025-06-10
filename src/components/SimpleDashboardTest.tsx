import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Simple test component to verify Dashboard screen mounting
 */
export default function SimpleDashboardTest() {
  console.log('🧪 SimpleDashboardTest: Component function called');
  
  React.useEffect(() => {
    console.log('🧪 SimpleDashboardTest: Component mounted');
    
    return () => {
      console.log('🧪 SimpleDashboardTest: Component unmounted');
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Test</Text>
      <Text style={styles.subtitle}>This component is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

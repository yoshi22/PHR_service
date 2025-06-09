import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'

interface LoadingSpinnerProps {
  message?: string
}

export default function LoadingSpinner({ message = '読み込み中...' }: LoadingSpinnerProps) {
  const displayMessage = message === '' ? '' : (message || '読み込み中...')
  
  return (
    <View style={styles.container} testID="loading-spinner-container">
      <ActivityIndicator size="large" color="#007bff" animating={true} testID="activity-indicator" />
      <Text style={styles.message} testID="loading-message">{displayMessage}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import PrimaryButton from './PrimaryButton'

type ErrorFallbackProps = {
  message: string
  onRetry: () => void
}

export default function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <PrimaryButton title="再試行" onPress={onRetry} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
})

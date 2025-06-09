import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

/**
 * Full-screen loading overlay.
 */
export default function LoadingOverlay() {
  return (
    <View style={styles.overlay} testID="loading-overlay-container">
      <ActivityIndicator size="large" color="#fff" animating={true} testID="activity-indicator" />
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

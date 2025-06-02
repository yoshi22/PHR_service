import React from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import BadgeGallery from '../components/BadgeGallery'
import { useBadges } from '../hooks/useBadges'
import { BadgeMetadata } from '../services/specialBadgeService'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function BadgeGalleryScreen() {
  const { badges, loading, error } = useBadges()

  const handleBadgePress = (metadata: BadgeMetadata, isEarned: boolean) => {
    // Handle badge press - could show more details, achievements, etc.
    console.log('Badge pressed:', metadata.name, 'Earned:', isEarned)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <BadgeGallery 
        earnedBadges={badges}
        onBadgePress={handleBadgePress}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
})

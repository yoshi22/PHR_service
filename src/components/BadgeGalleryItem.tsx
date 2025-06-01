import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { BadgeMetadata } from '../services/specialBadgeService'

// Helper function to get rarity color
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'Common': return '#8B7355'
    case 'Rare': return '#4A90E2'
    case 'Epic': return '#9B59B6'
    case 'Legendary': return '#F39C12'
    default: return '#8B7355'
  }
}

export interface BadgeGalleryItemProps {
  definition: BadgeMetadata
  isEarned: boolean
  earnedDate?: string
  isNew?: boolean
  onPress?: () => void
}

export default function BadgeGalleryItem({ 
  definition, 
  isEarned, 
  earnedDate, 
  isNew = false,
  onPress
}: BadgeGalleryItemProps) {
  // Animation for shining effect on new badges
  const shineAnim = useRef(new Animated.Value(-100)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  // Start animations for new badges
  useEffect(() => {
    if (isNew && isEarned) {
      // Shine animation
      Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 100,
          duration: 1500,
          useNativeDriver: true,
        }),
        { iterations: 3 }
      ).start()

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start()
    }
  }, [isNew, isEarned])

  const rarityColor = getRarityColor(definition.rarity)

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View 
        style={[
          styles.container,
          { 
            borderColor: rarityColor,
            opacity: isEarned ? 1 : 0.4,
            transform: [{ scale: pulseAnim }]
          },
          isNew && isEarned && styles.newBadge,
          !isEarned && styles.unearnedBadge
        ]}
      >
        {/* Shine effect for new badges */}
        {isNew && isEarned && (
          <Animated.View 
            style={[
              styles.shine,
              { transform: [{ translateX: shineAnim }] }
            ]}
          />
        )}

        {/* Badge icon with overlay for unearned */}
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, !isEarned && styles.unearnedIcon]}>
            {isEarned ? definition.icon : '❓'}
          </Text>
          {!isEarned && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </View>

        {/* Badge name */}
        <Text style={[styles.name, !isEarned && styles.unearnedText]} numberOfLines={2}>
          {isEarned ? definition.name : '???'}
        </Text>

        {/* Earned date or description */}
        <Text style={[styles.subtitle, !isEarned && styles.unearnedText]} numberOfLines={2}>
          {isEarned && earnedDate ? earnedDate : definition.description}
        </Text>

        {/* Rarity indicator */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.rarityText}>
            {definition.rarity.charAt(0).toUpperCase() + definition.rarity.slice(1)}
          </Text>
        </View>

        {/* New badge indicator */}
        {isNew && isEarned && (
          <View style={styles.newIndicator}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 6,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadge: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
  },
  unearnedBadge: {
    backgroundColor: '#F5F5F5',
    borderStyle: 'dashed',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    textAlign: 'center',
  },
  unearnedIcon: {
    opacity: 0.5,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#333',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 10,
    color: '#fff',
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    minHeight: 30,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    minHeight: 20,
  },
  unearnedText: {
    color: '#999',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  newIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  newText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  shine: {
    position: 'absolute',
    width: 30,
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '25deg' }],
    top: -20,
  },
})

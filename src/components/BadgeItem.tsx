import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { getBadgeMetadata } from '../services/specialBadgeService'

export type BadgeItemProps = {
  date: string
  type: string
  isNew?: boolean
}

export default function BadgeItem({ date, type, isNew = false }: BadgeItemProps) {
  // Animation for shining effect
  const shineAnim = useRef(new Animated.Value(-100)).current;
  
  // Get badge metadata for display
  const badgeMetadata = getBadgeMetadata(type);
  const label = badgeMetadata?.name || type;
  const icon = badgeMetadata?.icon || '🏅';
  
  // Start shine animation if this is a new badge
  useEffect(() => {
    if (isNew) {
      Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 100,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isNew]);
  
  return (
    <View style={[styles.card, isNew && styles.newCard]}>
      {isNew && (
        <Animated.View 
          style={[
            styles.shine,
            { transform: [{ translateX: shineAnim }] }
          ]}
        />
      )}
      <Text style={styles.icon}>{isNew ? '🌟' : icon}</Text>
      <Text style={[styles.text, isNew && styles.newText]}>{date} {label}</Text>
      {isNew && <Text style={styles.newBadge}>新着</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation for Android
    elevation: 2,
    overflow: 'hidden', // For shine effect
  },
  newCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  newText: {
    fontWeight: 'bold',
    color: '#000',
  },
  newBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  shine: {
    position: 'absolute',
    width: 50,
    height: '300%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '25deg' }],
  }
})

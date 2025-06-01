import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

interface DailyBonusCardProps {
  canClaim: boolean
  consecutiveDays: number
  onPress: () => void
}

/**
 * Daily Bonus Card component for dashboard
 */
export default function DailyBonusCard({ canClaim, consecutiveDays, onPress }: DailyBonusCardProps) {
  const { colors } = useTheme()

  const getBonusIcon = () => {
    if (canClaim) return '🎁'
    return '✅'
  }

  const getBonusText = () => {
    if (canClaim) return 'デイリーボーナス受け取り可能！'
    return '本日のボーナス受け取り済み'
  }

  const getStreakText = () => {
    if (consecutiveDays === 0) return '連続記録を開始しよう'
    return `連続${consecutiveDays}日達成中`
  }

  const getRarityIndicator = () => {
    if (consecutiveDays < 3) return { text: 'コモン', color: '#8E8E93' }
    if (consecutiveDays < 7) return { text: 'レア', color: '#007AFF' }
    return { text: 'エピック', color: '#AF52DE' }
  }

  const rarity = getRarityIndicator()

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.card,
          borderColor: canClaim ? colors.primary : colors.border,
          borderWidth: canClaim ? 2 : 1
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.bonusIcon}>{getBonusIcon()}</Text>
          {canClaim && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Ionicons name="star" size={12} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {getBonusText()}
          </Text>
          <Text style={[styles.streak, { color: colors.text, opacity: 0.7 }]}>
            {getStreakText()}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <View style={[styles.rarityBadge, { backgroundColor: rarity.color }]}>
            <Text style={styles.rarityText}>{rarity.text}</Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.text} 
            style={{ opacity: 0.5 }}
          />
        </View>
      </View>
      
      {canClaim && (
        <View style={styles.pulseContainer}>
          <View style={[styles.pulseRing, { borderColor: colors.primary }]} />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  bonusIcon: {
    fontSize: 32,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  streak: {
    fontSize: 14,
  },
  rightSection: {
    alignItems: 'center',
    gap: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pulseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  pulseRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    opacity: 0.3,
  },
})

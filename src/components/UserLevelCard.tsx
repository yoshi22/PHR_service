import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

interface UserLevelCardProps {
  level: number
  levelTitle: string
  currentExp: number
  nextLevelExp: number
  progressPercentage: number
  totalSteps: number
  onPress?: () => void
}

/**
 * User level display card with experience progress
 */
export default function UserLevelCard({
  level,
  levelTitle,
  currentExp,
  nextLevelExp,
  progressPercentage,
  totalSteps,
  onPress
}: UserLevelCardProps) {
  const { colors } = useTheme()

  const getLevelIcon = (level: number): string => {
    if (level >= 50) return 'trophy'
    if (level >= 30) return 'medal'
    if (level >= 20) return 'ribbon'
    if (level >= 15) return 'star'
    if (level >= 10) return 'flame'
    if (level >= 5) return 'walk'
    return 'footsteps'
  }

  const getLevelColor = (level: number): string => {
    if (level >= 50) return '#FFD700' // Gold
    if (level >= 30) return '#C0C0C0' // Silver
    if (level >= 20) return '#CD7F32' // Bronze
    if (level >= 15) return '#9966CC' // Purple
    if (level >= 10) return '#4169E1' // Royal Blue
    if (level >= 5) return '#32CD32'  // Lime Green
    return '#87CEEB' // Sky Blue
  }

  const levelColor = getLevelColor(level)
  const iconName = getLevelIcon(level) as any

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Level badge */}
      <View style={styles.header}>
        <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
          <Ionicons name={iconName} size={24} color="#fff" />
          <Text style={styles.levelNumber}>Lv.{level}</Text>
        </View>
        
        <View style={styles.levelInfo}>
          <Text style={[styles.levelTitle, { color: colors.text }]}>{levelTitle}</Text>
          <Text style={[styles.totalSteps, { color: colors.text }]}>
            総歩数: {totalSteps.toLocaleString()}歩
          </Text>
        </View>
      </View>

      {/* Experience progress */}
      <View style={styles.expSection}>
        <View style={styles.expHeader}>
          <Text style={[styles.expLabel, { color: colors.text }]}>次のレベルまで</Text>
          <Text style={[styles.expValues, { color: colors.text }]}>
            {currentExp.toLocaleString()} / {nextLevelExp.toLocaleString()} EXP
          </Text>
        </View>
        
        <View style={[styles.expBarContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.expBar,
              {
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: levelColor,
              },
            ]}
          />
          <View style={styles.expPercentageContainer}>
            <Text style={[styles.expPercentage, { color: colors.text }]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
        </View>
        
        {progressPercentage >= 100 && (
          <Text style={[styles.levelUpText, { color: levelColor }]}>
            🎉 レベルアップ可能！
          </Text>
        )}
      </View>

      {/* Tap hint */}
      {onPress && (
        <View style={styles.tapHint}>
          <Ionicons name="chevron-forward" size={16} color={colors.text} />
          <Text style={[styles.tapHintText, { color: colors.text }]}>詳細を見る</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelNumber: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalSteps: {
    fontSize: 14,
    opacity: 0.8,
  },
  expSection: {
    marginBottom: 8,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  expValues: {
    fontSize: 12,
    opacity: 0.8,
  },
  expBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  expBar: {
    height: '100%',
    borderRadius: 6,
    minWidth: 2,
  },
  expPercentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expPercentage: {
    fontSize: 10,
    fontWeight: '600',
  },
  levelUpText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  tapHintText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.6,
  },
})

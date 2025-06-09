import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  streakStatus: string
  isActiveToday: boolean
  daysToMilestone?: { days: number; milestone: string } | null
  onPress?: () => void
}

/**
 * Streak tracking card component
 */
export default function StreakCard({
  currentStreak,
  longestStreak,
  streakStatus,
  isActiveToday,
  daysToMilestone,
  onPress
}: StreakCardProps) {
  const { colors } = useTheme()

  const getStreakColor = (streak: number): string => {
    if (streak >= 100) return '#FFD700' // Gold
    if (streak >= 50) return '#FF6B6B'  // Red
    if (streak >= 30) return '#4ECDC4'  // Teal
    if (streak >= 14) return '#45B7D1'  // Blue
    if (streak >= 7) return '#96CEB4'   // Green
    if (streak >= 3) return '#FECA57'   // Yellow
    return '#95A5A6' // Gray
  }

  const getStreakIcon = (streak: number): string => {
    if (streak >= 100) return 'trophy'
    if (streak >= 50) return 'flame'
    if (streak >= 30) return 'star'
    if (streak >= 14) return 'ribbon'
    if (streak >= 7) return 'medal'
    if (streak >= 3) return 'checkmark-circle'
    return 'footsteps'
  }

  const streakColor = getStreakColor(currentStreak)
  const iconName = getStreakIcon(currentStreak) as any

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header with streak icon and count */}
      <View style={styles.header}>
        <View style={[styles.streakBadge, { backgroundColor: streakColor }]}>
          <Ionicons name={iconName} size={24} color="#fff" />
        </View>
        
        <View style={styles.streakInfo}>
          <Text style={[styles.streakCount, { color: colors.text }]}>
            {currentStreak}日連続
          </Text>
          <Text style={[styles.streakStatus, { color: isActiveToday ? streakColor : colors.text }]}>
            {streakStatus}
          </Text>
        </View>

        {/* Today's status indicator */}
        <View style={[styles.todayIndicator, { backgroundColor: isActiveToday ? '#4CAF50' : '#FFC107' }]}>
          <Ionicons 
            name={isActiveToday ? "checkmark" : "time"} 
            size={16} 
            color="#fff" 
          />
        </View>
      </View>

      {/* Stats section */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text }]}>現在のストリーク</Text>
          <Text 
            style={[styles.statValue, { color: streakColor }]}
            testID="current-streak-value"
          >
            {currentStreak}日
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text }]}>最長記録</Text>
          <Text 
            style={[styles.statValue, { color: colors.text }]}
            testID="longest-streak-value"
          >
            {longestStreak}日
          </Text>
        </View>
      </View>

      {/* Milestone progress */}
      {daysToMilestone && (
        <View style={styles.milestone}>
          <Text style={[styles.milestoneText, { color: colors.text }]}>
            <Ionicons name="flag" size={14} color={streakColor} />
            {' '}あと{daysToMilestone.days}日で{daysToMilestone.milestone}達成！
          </Text>
        </View>
      )}

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
  streakBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  streakStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  milestone: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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

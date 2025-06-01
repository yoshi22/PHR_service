import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { BadgeRecord } from '../services/badgeService'
import { BADGE_DEFINITIONS } from '../constants/badgeDefinitions'

interface BadgeSummaryProps {
  badges: BadgeRecord[]
  onViewAllPress: () => void
}

export default function BadgeSummary({ badges, onViewAllPress }: BadgeSummaryProps) {
  const totalBadges = BADGE_DEFINITIONS.length
  const earnedCount = badges.length
  const progressPercentage = Math.round((earnedCount / totalBadges) * 100)
  
  // Show most recent badges (max 3)
  const recentBadges = badges.slice(0, 3)
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>バッジコレクション</Text>
          <Text style={styles.progress}>
            {earnedCount}/{totalBadges} ({progressPercentage}%)
          </Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>すべて見る</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>
      
      {recentBadges.length > 0 ? (
        <View style={styles.badgeGrid}>
          {recentBadges.map((badge, index) => {
            const badgeDefinition = BADGE_DEFINITIONS.find(def => def.id === badge.type)
            const isNew = badge.isNew || false
            
            return (
              <View key={`${badge.date}_${badge.type}`} style={styles.badgeItem}>
                <View style={[styles.badgeIcon, isNew && styles.newBadgeIcon]}>
                  <Text style={styles.iconText}>
                    {badgeDefinition?.icon || '🏅'}
                  </Text>
                  {isNew && <View style={styles.newIndicator} />}
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {badgeDefinition?.name || badge.type}
                </Text>
              </View>
            )
          })}
          
          {/* Show placeholder for more badges */}
          {earnedCount > 3 && (
            <TouchableOpacity style={styles.moreBadges} onPress={onViewAllPress}>
              <Text style={styles.moreIcon}>+{earnedCount - 3}</Text>
              <Text style={styles.moreText}>他</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏅</Text>
          <Text style={styles.emptyText}>まだバッジがありません</Text>
          <Text style={styles.emptySubtext}>歩数目標を達成してバッジを獲得しよう！</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  newBadgeIcon: {
    borderColor: '#ffd700',
    backgroundColor: '#fffdf5',
  },
  iconText: {
    fontSize: 24,
  },
  newIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4444',
  },
  badgeName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
    lineHeight: 12,
  },
  moreBadges: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  moreIcon: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moreText: {
    fontSize: 10,
    color: '#007bff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
})

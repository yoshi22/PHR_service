import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native'
import { useTheme, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useDailyBonus } from '../hooks/useDailyBonus'
import { useToast } from '../context/ToastContext'
import { BonusReward } from '../services/dailyBonusService'
import SpinWheel from '../components/SpinWheel'

/**
 * Daily Bonus Screen - Gamification feature for user engagement
 */
export default function DailyBonusScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const { showToast } = useToast()
  const { bonusData, loading, error, canClaim, nextRewards, claimBonus } = useDailyBonus()
  const [showWheel, setShowWheel] = useState(false)
  const [claimedReward, setClaimedReward] = useState<BonusReward | null>(null)

  // Handle initial screen state
  useEffect(() => {
    if (canClaim && !loading) {
      setShowWheel(true)
    }
  }, [canClaim, loading])

  // Handle spin wheel completion
  const handleSpinComplete = async (reward: BonusReward) => {
    try {
      const actualReward = await claimBonus()
      if (actualReward) {
        setClaimedReward(actualReward)
        setShowWheel(false)
        showToast('success', `${actualReward.title}を獲得しました！`)
      }
    } catch (err: any) {
      showToast('error', 'ボーナスの受け取りに失敗しました')
    }
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#8E8E93'
      case 'rare': return '#007AFF'
      case 'epic': return '#AF52DE'
      case 'legendary': return '#FF9500'
      default: return colors.text
    }
  }

  // Get streak status
  const getStreakStatus = () => {
    if (!bonusData) return 'ボーナスを受け取って連続記録を開始しましょう！'
    
    const { consecutiveDays } = bonusData
    if (consecutiveDays === 0) return 'ボーナスを受け取って連続記録を開始しましょう！'
    if (consecutiveDays < 3) return `連続${consecutiveDays}日目！レア報酬まであと${3 - consecutiveDays}日`
    if (consecutiveDays < 7) return `連続${consecutiveDays}日目！エピック報酬まであと${7 - consecutiveDays}日`
    return `連続${consecutiveDays}日目！最高レベルの報酬を獲得中🎉`
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            デイリーボーナスを読み込み中...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={50} color="#FF3B30" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>デイリーボーナス</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusHeader}>
            <Ionicons name="gift" size={30} color={colors.primary} />
            <Text style={[styles.statusTitle, { color: colors.text }]}>今日のボーナス</Text>
          </View>
          
          <Text style={[styles.streakText, { color: colors.text }]}>
            {getStreakStatus()}
          </Text>

          {bonusData && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {bonusData.consecutiveDays}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>連続日数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {bonusData.totalBonuses}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>総獲得数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {bonusData.availableBonuses}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>残り回数</Text>
              </View>
            </View>
          )}
        </View>

        {/* Main Content */}
        {showWheel && canClaim ? (
          <View style={[styles.wheelCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.wheelTitle, { color: colors.text }]}>
              🎯 今日のボーナスをスピンしよう！
            </Text>
            <SpinWheel
              rewards={nextRewards}
              onSpinComplete={handleSpinComplete}
              disabled={!canClaim}
            />
          </View>
        ) : claimedReward ? (
          <View style={[styles.rewardCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.congratsTitle, { color: getRarityColor(claimedReward.rarity) }]}>
              🎉 おめでとうございます！
            </Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>
              {claimedReward.title}
            </Text>
            <Text style={[styles.rewardDescription, { color: colors.text }]}>
              {claimedReward.description}
            </Text>
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.completeButtonText}>完了</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.unavailableCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={50} color="#34C759" />
            <Text style={[styles.unavailableTitle, { color: colors.text }]}>
              本日のボーナスは受け取り済みです
            </Text>
            <Text style={[styles.unavailableSubtitle, { color: colors.text }]}>
              明日また新しいボーナスをお楽しみに！
            </Text>
            
            {/* Next rewards preview */}
            <View style={styles.previewSection}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                明日の報酬プレビュー
              </Text>
              <View style={styles.previewRewards}>
                {nextRewards.slice(0, 3).map((reward, index) => (
                  <View key={index} style={[styles.previewReward, { backgroundColor: colors.background }]}>
                    <Text style={[styles.previewRewardText, { color: getRarityColor(reward.rarity) }]}>
                      {reward.title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  streakText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  wheelCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  wheelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  rewardCard: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  completeButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableCard: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  unavailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  unavailableSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  previewSection: {
    width: '100%',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewRewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  previewReward: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  previewRewardText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

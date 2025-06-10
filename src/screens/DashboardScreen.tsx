import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import { useTheme, useNavigation } from '@react-navigation/native'
import { useWeeklyMetrics } from '../hooks/useWeeklyMetrics'
import { useBadges } from '../hooks/useBadges'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
import { useToast } from '../context/ToastContext'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useStreakTracker } from '../hooks/useStreakTracker'
import { useSettings } from '../context/SettingsContext'
import BadgeList from '../components/BadgeList'
import BadgeSummary from '../components/BadgeSummary'
import ProgressBar from '../components/ProgressBar'
import StreakCard from '../components/StreakCard'
import CustomBarChart from '../components/CustomBarChart'

/**
 * Dashboard Screen placeholder for weekly metrics chart
 */
export default function DashboardScreen() {
  const navigation = useNavigation()
  const { data, loading, error, refetch } = useWeeklyMetrics()
  // State for selected bar
  const [selectedBar, setSelectedBar] = useState<{ date: string; steps: number; index: number } | null>(null)
  const { badges, loading: badgesLoading, error: badgesError } = useBadges()
  const { progressData, loading: progressLoading } = useProgressTracking()
  const { streakData, loading: streakLoading, getStreakStatus } = useStreakTracker()
  const { settings } = useSettings()
  const { setLoading } = useLoading()
  const { showError } = useError()
  const { showBadgeAcquired } = useToast()
  const { colors } = useTheme()
  const screenWidth = Dimensions.get('window').width - 32
  
  React.useEffect(() => {
    setLoading(loading || badgesLoading || progressLoading || streakLoading)
  }, [loading, badgesLoading, progressLoading, streakLoading])

  React.useEffect(() => {
    if (error) showError(error, refetch)
    if (badgesError) showError(badgesError, () => {})
  }, [error, badgesError])

  const steps = data.map(d => d.steps)
  
  // Handle chart area touch for clearing selected bar
  const handleChartAreaTouch = () => {
    setSelectedBar(null)
  }

  // Handle bar press event
  const handleBarPress = (item: { date: string; steps: number; index: number }) => {
    setSelectedBar(item)
  }

  // Handle badge gallery navigation
  const handleViewBadgeGallery = () => {
    navigation.navigate('BadgeGallery' as never)
  }
  
  // 値が全て同じ（範囲が0）の場合はチャートを描画せずプレースホルダー表示
  const uniqueSteps = Array.from(new Set(steps))
  if (uniqueSteps.length <= 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>週間ダッシュボード</Text>
        <Text>今週の歩数データが不足しています</Text>
      </View>
    )
  }
  
  // Fallback: if no data, show placeholder instead of chart
  // UI always rendered; global overlay handles loading/error
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>週間ダッシュボード</Text>
        
        {/* Streak Section */}
        <View style={styles.gamificationSection}>
          {/* Streak Card */}
          <StreakCard 
            currentStreak={streakData.currentStreak}
            longestStreak={streakData.longestStreak}
            isActiveToday={streakData.isActiveToday}
            streakStatus={getStreakStatus()}
          />
          
          {/* Progress Bars */}
          <View style={styles.progressSection}>
            <ProgressBar
              progress={progressData.daily.progress}
              label="今日の目標"
              current={progressData.daily.current}
              target={progressData.daily.target}
              unit="歩"
              color={colors.primary}
            />
            <ProgressBar
              progress={progressData.weekly.progress}
              label="今週の目標"
              current={progressData.weekly.current}
              target={progressData.weekly.target}
              unit="歩"
              color="#34C759"
            />
          </View>
        </View>

        {/* Weekly Chart Section */}
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleChartAreaTouch}
          style={styles.chartWrapper}
          testID="chart-area"
        >
          <CustomBarChart
            data={data}
            stepGoal={settings?.stepGoal || 10000}
            width={screenWidth}
            height={220}
            onBarPress={handleBarPress}
            colors={{
              primary: colors.primary,
              secondary: '#007AFF80',
              goal: '#FF6B35',
              average: '#34C759',
              text: colors.text,
              grid: '#E0E0E0',
              background: colors.card
            }}
          />
          
          {/* Selected bar tooltip */}
          {selectedBar && (
            <View 
              style={[styles.tooltipContainer, 
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.primary
                }
              ]}
              testID="tooltip-container"
            > 
              <Text style={[styles.tooltipTitle, { color: colors.primary }]}>{selectedBar.date}</Text>
              <Text style={[styles.tooltipText, { color: colors.text }]}>{selectedBar.steps.toLocaleString()}歩</Text>
              <View style={[styles.tooltipTriangle, { borderTopColor: colors.primary }]} />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Badge section */}
        <View style={styles.badgeSection}>
          {badgesError ? (
            <Text style={{ color: 'red' }}>{badgesError}</Text>
          ) : (
            <BadgeSummary 
              badges={badges} 
              onViewAllPress={handleViewBadgeGallery}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    paddingTop: 5, // SafeAreaViewを使用するのでpaddingTopを減らす
    paddingHorizontal: 10,
    backgroundColor: '#F7F7F7',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  gamificationSection: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  progressSection: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  chartWrapper: { 
    position: 'relative', 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingHorizontal: 0, // 余分なパディングを削除
  },
  badgeSection: { width: '100%', padding: 16, borderTopWidth: 1, borderColor: '#ddd', marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 100,
    alignItems: 'center',
  },
  tooltipTitle: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tooltipTriangle: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#007AFF',
    transform: [{ rotate: '180deg' }]
  },
})

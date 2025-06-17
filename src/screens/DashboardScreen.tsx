import * as React from 'react'
const { useState } = React;
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
import PrimaryButton from '../components/PrimaryButton'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import { colors, modernTypography as typography, spacing, common } from '../styles'

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
  }, [loading, badgesLoading, progressLoading, streakLoading, setLoading])

  React.useEffect(() => {
    if (error) showError(error, refetch)
    if (badgesError) showError(badgesError, () => {})
  }, [error, badgesError, showError, refetch])

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.title, { color: colors.text }]}>週間ダッシュボード</Text>
          <ErrorMessage 
            message="今週の歩数データが不足しています" 
          />
          <PrimaryButton 
            title="データを更新" 
            onPress={refetch}
            size="medium"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
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
              color="#4CAF50"
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
              secondary: `${colors.primary}80`,
              goal: '#FF9800',
              average: '#4CAF50',
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
            <ErrorMessage 
              message={badgesError} 
              onRetry={() => {}}
            />
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
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  title: { 
    fontSize: typography.sizes.xl, 
    fontWeight: '700' as any, 
    marginBottom: spacing.md,
    color: colors.text,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.lg,
  },
  gamificationSection: {
    width: '100%',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  progressSection: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  chartWrapper: { 
    position: 'relative', 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  badgeSection: { 
    width: '100%', 
    padding: spacing.md, 
    borderTopWidth: 1, 
    borderColor: colors.neutral[300], 
    marginTop: spacing.sm 
  },
  sectionTitle: { 
    fontSize: typography.sizes.lg, 
    fontWeight: '600' as any, 
    marginBottom: spacing.xs,
    color: colors.text,
  },
  subTitle: { 
    fontSize: typography.sizes.xl, 
    fontWeight: '600' as any, 
    marginBottom: spacing.xs,
    color: colors.text,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    zIndex: 1000,
    ...common.shadows.medium,
    minWidth: 100,
    alignItems: 'center',
  },
  tooltipTitle: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '600' as any,
    marginBottom: spacing.xs,
  },
  tooltipText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: '700' as any,
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
    borderTopColor: colors.primary,
    transform: [{ rotate: '180deg' }]
  },
})

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useTheme, useNavigation } from '@react-navigation/native'
import { useWeeklyMetrics } from '../hooks/useWeeklyMetrics'
import { useBadges } from '../hooks/useBadges'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
import { useToast } from '../context/ToastContext'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useStreakTracker } from '../hooks/useStreakTracker'
import BadgeList from '../components/BadgeList'
import BadgeSummary from '../components/BadgeSummary'
import ProgressBar from '../components/ProgressBar'
import StreakCard from '../components/StreakCard'

/**
 * Dashboard Screen placeholder for weekly metrics chart
 */
export default function DashboardScreen() {
  const navigation = useNavigation()
  const { data, loading, error, refetch } = useWeeklyMetrics()
  // State for tapped data point with coordinates
  const [selectedPoint, setSelectedPoint] = useState<{ index: number; value: number; x: number; y: number } | null>(null)
  const { badges, loading: badgesLoading, error: badgesError } = useBadges()
  const { progressData, loading: progressLoading } = useProgressTracking()
  const { streakData, loading: streakLoading, getStreakStatus } = useStreakTracker()
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

  // Format day of week for X axis labels
  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }
  
  const formatLabels = (dateStr: string) => {
    // Get month/day and day of week
    const month = dateStr.split('-')[1]
    const day = dateStr.split('-')[2]
    return `${month}/${day}\n${getDayOfWeek(dateStr)}`
  }
  
  const labels = data.map(d => formatLabels(d.date))
  const steps = data.map(d => d.steps)
  
  // Clean up tooltip when touching elsewhere
  const handleChartAreaTouch = () => {
    setSelectedPoint(null)
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
  
  // Calculate min/max for better Y axis display
  const minSteps = Math.max(0, Math.floor(Math.min(...steps) * 0.9))
  const maxSteps = Math.ceil(Math.max(...steps) * 1.1)
  
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
          <LineChart
            data={{ 
              labels, 
              datasets: [{ data: steps }],
              // Add legend
              legend: ["歩数"]
            }}
            width={screenWidth}
            height={220}
            withDots
            withInnerLines
            withVerticalLabels
            withHorizontalLabels
            withVerticalLines={false}
            // display x-axis labels horizontally
            verticalLabelRotation={0}
            xLabelsOffset={0}
            yLabelsOffset={5}
            // Start Y axis from zero for consistent visualization
            fromZero
            // Apply Bezier curve for smoother lines
            bezier
            onDataPointClick={({ value, index, x, y }) => setSelectedPoint({ value, index, x, y })}
            yAxisSuffix="歩"
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0,122,255,${opacity})`,
              labelColor: () => colors.text,
              propsForLabels: { fontSize: 10 },
              propsForBackgroundLines: { stroke: '#e3e3e3' },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#007AFF' },
              // Add grid lines
              strokeWidth: 2,
              // Add area shading under curve
              fillShadowGradient: '#007AFF',
              fillShadowGradientOpacity: 0.1,
              // Custom Y-axis calculation to show appropriate range
              formatYLabel: (value) => parseInt(value).toLocaleString(),
            }}
            style={{ marginVertical: 8, borderRadius: 8 }}
          />
          {/* Enhanced tooltip with animation */}
          {selectedPoint && (
            <View 
              style={[styles.tooltipContainer, 
                { 
                  left: selectedPoint.x - 50, 
                  top: selectedPoint.y - 45,
                  backgroundColor: colors.card,
                  borderColor: colors.primary
                }
              ]}
              testID="tooltip-container"
            > 
              <Text style={[styles.tooltipTitle, { color: colors.primary }]}>{data[selectedPoint.index].date}</Text>
              <Text style={[styles.tooltipText, { color: colors.text }]}>{selectedPoint.value.toLocaleString()}歩</Text>
              <View style={[styles.tooltipTriangle, { borderTopColor: colors.primary }]} />
            </View>
          )}
          {/* Y-axis label */}
          <View style={styles.yAxisLabelContainer}>
            <Text style={styles.yAxisLabel}>歩数</Text>
          </View>
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
  chartWrapper: { position: 'relative', width: '100%', alignItems: 'center', marginBottom: 20 },
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
  yAxisLabelContainer: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#666',
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

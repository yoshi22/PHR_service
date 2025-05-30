import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useWeeklyMetrics } from '../hooks/useWeeklyMetrics'
import { useBadges } from '../hooks/useBadges'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
import { useToast } from '../context/ToastContext'
import BadgeList from '../components/BadgeList'

/**
 * Dashboard Screen placeholder for weekly metrics chart
 */
export default function DashboardScreen() {
  const { data, loading, error, refetch } = useWeeklyMetrics()
  // State for tapped data point with coordinates
  const [selectedPoint, setSelectedPoint] = useState<{ index: number; value: number; x: number; y: number } | null>(null)
  const { badges, loading: badgesLoading, error: badgesError } = useBadges()
  const { setLoading } = useLoading()
  const { showError } = useError()
  const { showBadgeAcquired } = useToast()
  const screenWidth = Dimensions.get('window').width - 32
  
  React.useEffect(() => {
    setLoading(loading || badgesLoading)
  }, [loading, badgesLoading])

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
    <View style={styles.container}>
      <Text style={styles.title}>週間ダッシュボード</Text>
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
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,122,255,${opacity})`,
            labelColor: () => '#333',
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
              { left: selectedPoint.x - 50, top: selectedPoint.y - 45 }
            ]}
            testID="tooltip-container"
          > 
            <Text style={styles.tooltipTitle}>{data[selectedPoint.index].date}</Text>
            <Text style={styles.tooltipText}>{selectedPoint.value.toLocaleString()}歩</Text>
            <View style={styles.tooltipTriangle} />
          </View>
        )}
        {/* Y-axis label */}
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.yAxisLabel}>歩数</Text>
        </View>
      </TouchableOpacity>
      {/* Badge section */}
      <View style={styles.badgeSection}>
        <Text style={styles.subTitle}>獲得バッジ</Text>
        {badgesError ? (
          <Text style={{ color: 'red' }}>{badgesError}</Text>
        ) : (
          <BadgeList badges={badges} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  chartWrapper: { position: 'relative', width: '100%', alignItems: 'center', marginBottom: 20 },
  badgeSection: { width: '100%', padding: 16, borderTopWidth: 1, borderColor: '#ddd', marginTop: 10 },
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

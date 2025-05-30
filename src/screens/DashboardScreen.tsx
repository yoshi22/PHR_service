import React, { useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useWeeklyMetrics } from '../hooks/useWeeklyMetrics'
import { useBadges } from '../hooks/useBadges'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
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
  const screenWidth = Dimensions.get('window').width - 32
  React.useEffect(() => {
    setLoading(loading || badgesLoading)
  }, [loading, badgesLoading])
  React.useEffect(() => {
    if (error) showError(error, refetch)
    if (badgesError) showError(badgesError, () => {})
  }, [error, badgesError])
  const labels = data.map(d => d.date.slice(5))
  const steps = data.map(d => d.steps)
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
    <View style={styles.container}>
      <Text style={styles.title}>週間ダッシュボード</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={{ labels, datasets: [{ data: steps }] }}
          width={screenWidth}
          height={220}
          withDots
          withInnerLines={false}
          withVerticalLines={false}
          // display x-axis labels horizontally
          verticalLabelRotation={0}
          xLabelsOffset={0}
          fromZero
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
            // Add area shading under curve
            fillShadowGradient: '#007AFF',
            fillShadowGradientOpacity: 0.1,
          }}
          style={{ marginVertical: 8, borderRadius: 8 }}
        />
        {/* Tooltip */}
        {selectedPoint && (
          <View style={[styles.tooltipContainer, { left: selectedPoint.x - 30, top: selectedPoint.y - 35 }]}> 
            <Text style={styles.tooltipText}>{labels[selectedPoint.index]}: {selectedPoint.value}歩</Text>
          </View>
        )}
      </View>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  chartWrapper: { position: 'relative', width: '100%', alignItems: 'center' },
  badgeSection: { width: '100%', padding: 16, borderTopWidth: 1, borderColor: '#ddd' },
  subTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1000,
  },
  tooltipText: {
    color: '#333',
    fontSize: 12,
  },
})

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg'

interface CustomBarChartProps {
  data: Array<{ date: string; steps: number }>
  stepGoal: number
  width: number
  height: number
  onBarPress?: (item: { date: string; steps: number; index: number }) => void
  colors: {
    primary: string
    secondary: string
    goal: string
    average: string
    text: string
    grid: string
    background: string
  }
}

/**
 * カスタム棒グラフコンポーネント
 * Y軸を1000歩単位で完全制御し、目標値ラインを表示
 */
export default function CustomBarChart({
  data,
  stepGoal,
  width,
  height,
  onBarPress,
  colors
}: CustomBarChartProps) {
  // チャートの余白設定（右側を広くしてラベル表示スペースを確保）
  const margin = { top: 20, right: 80, bottom: 60, left: 40 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Y軸の範囲を目標値と最大歩数を基にして、4-6個の目盛りになるよう計算
  const calculateYAxisRange = () => {
    const maxSteps = Math.max(...data.map(d => d.steps))
    const minSteps = Math.min(...data.map(d => d.steps), 0)
    
    // 目標値も考慮した最大値を計算
    const considerGoal = Math.max(maxSteps, stepGoal)
    
    // 4-6個の目盛りになるよう目盛り幅を計算
    const range = considerGoal - 0 // 0から開始
    let tickInterval = 1000 // デフォルト1000歩刻み
    
    // 目盛り数が4-6個になるよう調整
    if (range <= 6000) {
      tickInterval = 1000 // 1000歩刻み
    } else if (range <= 12000) {
      tickInterval = 2000 // 2000歩刻み
    } else if (range <= 20000) {
      tickInterval = 4000 // 4000歩刻み
    } else {
      tickInterval = 5000 // 5000歩刻み
    }
    
    const yMax = Math.ceil(considerGoal / tickInterval) * tickInterval
    const yMin = 0
    
    return { min: yMin, max: yMax, tickInterval }
  }

  const yAxisRange = calculateYAxisRange()
  const yAxisStep = yAxisRange.tickInterval
  const yAxisTicks = []
  
  // Y軸の目盛りを生成
  for (let value = yAxisRange.min; value <= yAxisRange.max; value += yAxisStep) {
    yAxisTicks.push(value)
  }

  // 座標変換関数
  const getBarHeight = (steps: number) => {
    return ((steps - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * chartHeight
  }

  const getYPosition = (value: number) => {
    return margin.top + chartHeight - ((value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * chartHeight
  }

  // 棒の幅とX位置の計算
  const barWidth = chartWidth / data.length * 0.7
  const barSpacing = chartWidth / data.length

  // 曜日ラベルの変換
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  // 値のフォーマット（一桁まで表示：例 8,460）
  const formatStepValue = (value: number) => {
    return value.toLocaleString()
  }

  // 平均歩数を計算
  const calculateAverage = () => {
    const totalSteps = data.reduce((sum, item) => sum + item.steps, 0)
    return Math.round(totalSteps / data.length)
  }

  const averageSteps = calculateAverage()
  
  // ラベルの重複を避けるためのY位置調整
  const getLabelYPosition = (value: number, isGoal: boolean) => {
    const baseY = getYPosition(value) - 5
    
    // 目標値と平均値が近い位置にある場合の調整
    if (Math.abs(stepGoal - averageSteps) < yAxisRange.max * 0.1) {
      // 10%以内の差の場合、ラベルをずらす
      if (isGoal) {
        return baseY - 15 // 目標値ラベルを上に
      } else {
        return baseY + 15 // 平均値ラベルを下に
      }
    }
    
    return baseY
  }

  return (
    <View style={styles.container}>
      {/* グラフタイトルと統計情報 */}
      <View style={styles.headerContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          過去1週間の歩数推移
        </Text>
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: colors.text }]}>
            平均: {formatStepValue(averageSteps)}歩 | 目標: {formatStepValue(stepGoal)}歩
          </Text>
        </View>
      </View>
      
      <View style={styles.svgContainer}>
        <Svg width={width} height={height}>
          {/* グラデーション定義 */}
          <Defs>
            <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.8" />
            </LinearGradient>
          </Defs>

        {/* Y軸のグリッドライン */}
        {yAxisTicks.map((value, index) => {
          const y = getYPosition(value)
          return (
            <Line
              key={`grid-${index}`}
              x1={margin.left}
              y1={y}
              x2={width - margin.right}
              y2={y}
              stroke={colors.grid}
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          )
        })}

        {/* 目標値ライン */}
        {stepGoal >= yAxisRange.min && stepGoal <= yAxisRange.max && (
          <>
            <Line
              x1={margin.left}
              y1={getYPosition(stepGoal)}
              x2={width - margin.right}
              y2={getYPosition(stepGoal)}
              stroke={colors.goal}
              strokeWidth="2"
              strokeDasharray="8,4"
              strokeOpacity="0.8"
            />
            <SvgText
              x={width - margin.right + 5}
              y={getLabelYPosition(stepGoal, true)}
              fontSize="10"
              fill={colors.goal}
              textAnchor="start"
              fontWeight="600"
            >
              目標: {formatStepValue(stepGoal)}
            </SvgText>
          </>
        )}

        {/* 平均値ライン */}
        {averageSteps >= yAxisRange.min && averageSteps <= yAxisRange.max && (
          <>
            <Line
              x1={margin.left}
              y1={getYPosition(averageSteps)}
              x2={width - margin.right}
              y2={getYPosition(averageSteps)}
              stroke={colors.average}
              strokeWidth="2"
              strokeDasharray="4,2"
              strokeOpacity="0.7"
            />
            <SvgText
              x={width - margin.right + 5}
              y={getLabelYPosition(averageSteps, false)}
              fontSize="10"
              fill={colors.average}
              textAnchor="start"
              fontWeight="600"
            >
              平均: {formatStepValue(averageSteps)}
            </SvgText>
          </>
        )}

        {/* 棒グラフ */}
        {data.map((item, index) => {
          const barHeight = getBarHeight(item.steps)
          const x = margin.left + index * barSpacing + (barSpacing - barWidth) / 2
          const y = margin.top + chartHeight - barHeight

          return (
            <React.Fragment key={`bar-${index}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="4"
                ry="4"
                onPress={() => onBarPress?.({ ...item, index })}
              />
              
              {/* 棒の上に値を表示 */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="10"
                fill={colors.text}
                textAnchor="middle"
                fontWeight="600"
              >
                {formatStepValue(item.steps)}
              </SvgText>
            </React.Fragment>
          )
        })}

        {/* X軸ラベル（曜日） */}
        {data.map((item, index) => {
          const x = margin.left + index * barSpacing + barSpacing / 2
          const y = height - margin.bottom + 20

          return (
            <SvgText
              key={`x-label-${index}`}
              x={x}
              y={y}
              fontSize="12"
              fill={colors.text}
              textAnchor="middle"
              fontWeight="500"
            >
              {getDayLabel(item.date)}
            </SvgText>
          )
        })}

        {/* 日付ラベル */}
        {data.map((item, index) => {
          const x = margin.left + index * barSpacing + barSpacing / 2
          const y = height - margin.bottom + 35
          const date = new Date(item.date)
          const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`

          return (
            <SvgText
              key={`date-label-${index}`}
              x={x}
              y={y}
              fontSize="10"
              fill={colors.text}
              textAnchor="middle"
              opacity="0.7"
            >
              {dateLabel}
            </SvgText>
          )
        })}
      </Svg>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center', // グラフを中央に配置
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 4,
  },
  statsContainer: {
    marginTop: 4,
  },
  statsText: {
    fontSize: 12,
    textAlign: 'left',
    opacity: 0.7,
  },
})

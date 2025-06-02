import React from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { useTheme } from '@react-navigation/native'

interface ProgressBarProps {
  progress: number // 0-100
  label: string
  current: number
  target: number
  unit: string
  color?: string
  showAnimation?: boolean
}

/**
 * Animated progress bar component for daily/weekly goals
 */
export default function ProgressBar({
  progress,
  label,
  current,
  target,
  unit,
  color,
  showAnimation = true
}: ProgressBarProps) {
  const { colors } = useTheme()
  const animatedWidth = React.useRef(new Animated.Value(0)).current
  
  const progressColor = color || colors.primary || '#007AFF'
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  React.useEffect(() => {
    if (showAnimation) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start()
    } else {
      animatedWidth.setValue(clampedProgress)
    }
  }, [clampedProgress, showAnimation])

  const isCompleted = progress >= 100

  return (
    <View style={styles.container}>
      {/* Label and values */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.values, { color: colors.text }]}>
          <Text style={[styles.current, isCompleted && { color: progressColor }]}>
            {current.toLocaleString()}
          </Text>
          <Text style={styles.separator}> / </Text>
          <Text style={styles.target}>{target.toLocaleString()}</Text>
          <Text style={styles.unit}> {unit}</Text>
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
              backgroundColor: progressColor,
            },
          ]}
        />
        
        {/* Progress percentage overlay */}
        <View style={styles.percentageContainer}>
          <Text style={[
            styles.percentage, 
            { 
              color: clampedProgress > 40 ? '#fff' : colors.text,
            }
          ]}>
            {Math.round(clampedProgress)}%
          </Text>
        </View>
      </View>
      
      {/* Achievement indicator */}
      {isCompleted && (
        <View style={styles.achievementContainer}>
          <Text style={[styles.achievementText, { color: progressColor }]}>
            🎉 目標達成！
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  values: {
    fontSize: 14,
    fontWeight: '500',
  },
  current: {
    fontWeight: '700',
  },
  separator: {
    color: '#999',
  },
  target: {
    color: '#666',
  },
  unit: {
    fontSize: 12,
    color: '#999',
  },
  progressContainer: {
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5E7',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
  },
  achievementContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '600',
  },
})

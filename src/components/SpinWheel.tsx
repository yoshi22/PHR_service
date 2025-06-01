import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native'
import { useTheme } from '@react-navigation/native'
import { BonusReward } from '../services/dailyBonusService'

interface SpinWheelProps {
  rewards: BonusReward[]
  onSpinComplete: (reward: BonusReward) => void
  disabled?: boolean
}

/**
 * SpinWheel component for daily bonus selection
 */
export default function SpinWheel({ rewards, onSpinComplete, disabled = false }: SpinWheelProps) {
  const { colors } = useTheme()
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedReward, setSelectedReward] = useState<BonusReward | null>(null)
  const spinValue = useRef(new Animated.Value(0)).current
  const pulseValue = useRef(new Animated.Value(1)).current

  // Reward colors based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#8E8E93'
      case 'rare': return '#007AFF'
      case 'epic': return '#AF52DE'
      case 'legendary': return '#FF9500'
      default: return colors.text
    }
  }

  // Pulse animation for spin button
  useEffect(() => {
    if (!isSpinning && !selectedReward) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }
  }, [isSpinning, selectedReward])

  const handleSpin = () => {
    if (isSpinning || disabled || rewards.length === 0) return

    setIsSpinning(true)

    // Select random reward
    const randomIndex = Math.floor(Math.random() * rewards.length)
    const reward = rewards[randomIndex]

    // Calculate target rotation (multiple full rotations + final position)
    const fullRotations = 3 + Math.random() * 2 // 3-5 full rotations
    const segmentAngle = 360 / rewards.length
    const targetAngle = fullRotations * 360 + (randomIndex * segmentAngle) + (segmentAngle / 2)

    // Animate wheel spinning
    Animated.timing(spinValue, {
      toValue: targetAngle,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false)
      setSelectedReward(reward)
      
      // Delay callback to show result
      setTimeout(() => {
        onSpinComplete(reward)
      }, 1000)
    })
  }

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={styles.container}>
      {/* Wheel */}
      <View style={styles.wheelContainer}>
        <Animated.View 
          style={[
            styles.wheel, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ rotate: spin }] 
            }
          ]}
        >
          {rewards.map((reward, index) => {
            const angle = (360 / rewards.length) * index
            const isSelected = selectedReward === reward
            
            return (
              <View
                key={index}
                style={[
                  styles.segment,
                  {
                    transform: [{ rotate: `${angle}deg` }],
                    backgroundColor: isSelected ? getRarityColor(reward.rarity) : 'transparent',
                  }
                ]}
              >
                <View style={styles.segmentContent}>
                  <Text 
                    style={[
                      styles.segmentText, 
                      { 
                        color: isSelected ? '#fff' : getRarityColor(reward.rarity),
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }
                    ]}
                    numberOfLines={2}
                  >
                    {reward.title}
                  </Text>
                </View>
              </View>
            )
          })}
        </Animated.View>

        {/* Center pointer */}
        <View style={[styles.pointer, { borderBottomColor: colors.primary }]} />
      </View>

      {/* Spin button */}
      {!selectedReward && (
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
          <TouchableOpacity
            style={[
              styles.spinButton,
              { 
                backgroundColor: disabled ? colors.border : colors.primary,
                borderColor: colors.primary 
              }
            ]}
            onPress={handleSpin}
            disabled={isSpinning || disabled}
            activeOpacity={0.8}
          >
            <Text style={[styles.spinButtonText, { color: disabled ? colors.text : '#fff' }]}>
              {isSpinning ? 'スピン中...' : 'スピン!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Result display */}
      {selectedReward && (
        <View style={[styles.resultContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.resultTitle, { color: getRarityColor(selectedReward.rarity) }]}>
            🎉 {selectedReward.title}
          </Text>
          <Text style={[styles.resultDescription, { color: colors.text }]}>
            {selectedReward.description}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  wheelContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  wheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    width: 140,
    height: 140,
    left: 140,
    top: 140,
    transformOrigin: '0 0',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  segmentContent: {
    position: 'absolute',
    top: -70,
    left: 10,
    width: 120,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  pointer: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 10,
  },
  spinButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    marginTop: 10,
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    minWidth: 250,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
})

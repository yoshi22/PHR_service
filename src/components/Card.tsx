import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { colors, spacing, common } from '../styles'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  padding?: 'none' | 'small' | 'medium' | 'large'
  style?: StyleProp<ViewStyle>
  testID?: string
}

export default function Card({ 
  children, 
  variant = 'default', 
  padding = 'medium',
  style, 
  testID 
}: CardProps) {
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[variant], styles[`${padding}Padding`]];
    return baseStyle;
  };

  return (
    <View style={[...getCardStyle(), style]} testID={testID}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
  },
  
  // Variants
  default: {
    ...common.shadows.light,
  },
  
  outlined: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  
  elevated: {
    ...common.shadows.heavy,
  },
  
  filled: {
    backgroundColor: colors.neutral[50],
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Padding variants
  nonePadding: {
    padding: 0,
  },
  
  smallPadding: {
    padding: spacing.sm,
  },
  
  mediumPadding: {
    padding: spacing.md,
  },
  
  largePadding: {
    padding: spacing.lg,
  },
})
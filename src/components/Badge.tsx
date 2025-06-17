import React from 'react'
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { colors, typography, spacing } from '../styles'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  testID?: string
}

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'medium',
  style, 
  textStyle,
  testID 
}: BadgeProps) {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge, styles[variant], styles[size]];
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`], styles[`${variant}Text`]];
    return baseStyle;
  };

  return (
    <View style={[...getBadgeStyle(), style]} testID={testID}>
      <Text style={[...getTextStyle(), textStyle]}>
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.sm,
    alignSelf: 'flex-start',
  },
  
  // Size variants
  small: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minHeight: 20,
  },
  
  medium: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 24,
  },
  
  large: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },
  
  // Color variants
  default: {
    backgroundColor: colors.neutral[100],
  },
  
  primary: {
    backgroundColor: colors.primary,
  },
  
  secondary: {
    backgroundColor: colors.neutral[600],
  },
  
  success: {
    backgroundColor: colors.status.success,
  },
  
  warning: {
    backgroundColor: colors.status.warning,
  },
  
  error: {
    backgroundColor: colors.status.error,
  },
  
  // Text styles
  text: {
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  
  // Text size variants
  smallText: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  
  mediumText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  
  largeText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.base,
  },
  
  // Text color variants
  defaultText: {
    color: colors.neutral[700],
  },
  
  primaryText: {
    color: colors.surface,
  },
  
  secondaryText: {
    color: colors.surface,
  },
  
  successText: {
    color: colors.surface,
  },
  
  warningText: {
    color: colors.text,
  },
  
  errorText: {
    color: colors.surface,
  },
})
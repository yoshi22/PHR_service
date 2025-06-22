import React from 'react'
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, ActivityIndicator } from 'react-native'
import { colors, modernTypography as typography, spacing, common } from '../styles'

interface PrimaryButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'small' | 'medium' | 'large'
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  testID?: string
}

export default function PrimaryButton({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false,
  variant = 'primary', 
  size = 'medium',
  style, 
  textStyle, 
  testID 
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size as keyof typeof styles]];
    
    if (isDisabled) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant as keyof typeof styles]);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text` as keyof typeof styles]];
    
    if (variant === 'outline' && !isDisabled) {
      baseStyle.push(styles.outlineText);
    } else if (isDisabled) {
      baseStyle.push(styles.disabledText);
    } else {
      baseStyle.push(styles.defaultText);
    }
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={variant === 'outline' ? colors.primary : colors.surface} 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle].flat()}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Base button style
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.sm,
    ...common.shadows.light,
  },
  
  // Size variants
  small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  
  // Color variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.neutral[600],
  },
  danger: {
    backgroundColor: colors.status.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: colors.neutral[300],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 2,
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.sm,
  },
  
  // Text styles
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Text size variants
  smallText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  mediumText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.base,
  },
  largeText: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
  },
  
  // Text color variants
  defaultText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.neutral[500],
  },
})

import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native'
import { colors, typography, spacing } from '../styles'

interface InputFieldProps extends TextInputProps {
  label?: string
  error?: string
  helper?: string
  required?: boolean
  variant?: 'default' | 'outline' | 'filled'
  size?: 'small' | 'medium' | 'large'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
}

export default function InputField({ 
  label, 
  error, 
  helper, 
  required = false,
  variant = 'default', 
  size = 'medium',
  leftIcon,
  rightIcon,
  onRightIconPress,
  style, 
  testID, 
  ...props 
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer, styles[variant], styles[size]];
    
    if (isFocused) {
      baseStyle.push(styles.focused);
    }
    
    if (error) {
      baseStyle.push(styles.error);
    }
    
    if (props.editable === false) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, rightIcon && styles.inputWithRightIcon, style]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={colors.neutral[400]}
          testID={testID}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  
  required: {
    color: colors.status.error,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
  },
  
  // Variants
  default: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  
  outline: {
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: 'transparent',
  },
  
  filled: {
    backgroundColor: colors.neutral[100],
    borderWidth: 0,
  },
  
  // Sizes
  small: {
    minHeight: 36,
  },
  
  medium: {
    minHeight: 44,
  },
  
  large: {
    minHeight: 52,
  },
  
  // States
  focused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  error: {
    borderColor: colors.status.error,
  },
  
  disabled: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  
  inputWithRightIcon: {
    paddingRight: 0,
  },
  
  leftIcon: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  
  rightIcon: {
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
  },
  
  errorText: {
    ...typography.caption,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
  
  helperText: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
})

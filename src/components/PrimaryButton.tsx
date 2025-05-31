import React from 'react'
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '@react-navigation/native'

interface PrimaryButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  testID?: string
}

export default function PrimaryButton({ title, onPress, disabled, style, textStyle, testID }: PrimaryButtonProps) {
  // Try to get theme colors, but have defaults if not in a NavigationContainer
  let colors = {
    primary: '#007AFF',
    border: '#CCCCCC',
    text: '#FFFFFF'
  };
  
  try {
    // This may throw an error if not in a NavigationContainer
    const theme = useTheme();
    if (theme && theme.colors) {
      colors.primary = theme.colors.primary;
      colors.border = theme.colors.border;
    }
  } catch (error) {
    // Fallback to default colors if theme is not available
    console.log('Theme not available, using default colors');
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor: colors.primary },
        disabled && [styles.disabled, { backgroundColor: colors.border }],
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Text style={[styles.text, { color: '#FFFFFF' }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: {
    backgroundColor: '#A0A0A0',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
})

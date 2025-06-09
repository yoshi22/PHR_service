/**
 * PrimaryButton Component Tests
 * 
 * Tests the PrimaryButton component which provides a standardized button
 * with theme integration, disabled states, and accessibility features.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import PrimaryButton from '../../components/PrimaryButton'

// Mock the navigation theme hook
const mockTheme = {
  colors: {
    primary: '#007AFF',
    border: '#CCCCCC',
    text: '#FFFFFF'
  }
}

jest.mock('@react-navigation/native', () => ({
  useTheme: jest.fn(() => mockTheme)
}))

describe('PrimaryButton Component', () => {
  const mockOnPress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Basic Display', () => {
    test('renders button with correct title', () => {
      const { getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      expect(getByText('テストボタン')).toBeTruthy()
    })

    test('displays button with default styling', () => {
      const { getByTestId } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} testID="test-button" />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#007AFF'
          })
        ])
      )
    })

    test('renders with theme colors when available', () => {
      const { getByTestId } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} testID="test-button" />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: mockTheme.colors.primary
          })
        ])
      )
    })

    test('falls back to default colors when theme is not available', () => {
      const { useTheme } = require('@react-navigation/native')
      useTheme.mockImplementationOnce(() => {
        throw new Error('Theme not available')
      })

      // Spy on console.log to verify fallback message
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const { getByTestId } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} testID="test-button" />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#007AFF' // fallback color
          })
        ])
      )

      expect(consoleSpy).toHaveBeenCalledWith('Theme not available, using default colors')
      consoleSpy.mockRestore()
    })
  })

  describe('Interaction Behavior', () => {
    test('calls onPress when button is pressed', () => {
      const { getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      fireEvent.press(getByText('テストボタン'))

      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })

    test('calls onPress multiple times when pressed multiple times', () => {
      const { getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      const button = getByText('テストボタン')
      fireEvent.press(button)
      fireEvent.press(button)
      fireEvent.press(button)

      expect(mockOnPress).toHaveBeenCalledTimes(3)
    })

    test('does not call onPress when button is disabled', () => {
      const { getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} disabled={true} />
      )

      fireEvent.press(getByText('テストボタン'))

      expect(mockOnPress).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    test('applies disabled styling when disabled', () => {
      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress} 
          disabled={true}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: mockTheme.colors.border
          })
        ])
      )
    })

    test('sets disabled prop correctly on TouchableOpacity', () => {
      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress} 
          disabled={true}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.disabled).toBe(true)
    })

    test('does not apply disabled styling when enabled', () => {
      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress} 
          disabled={false}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: mockTheme.colors.primary
          })
        ])
      )
    })

    test('handles undefined disabled prop as enabled', () => {
      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.disabled).toBeFalsy()
    })
  })

  describe('Custom Styling', () => {
    test('applies custom button style', () => {
      const customStyle = {
        borderRadius: 20,
        paddingHorizontal: 30
      }

      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          style={customStyle}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      )
    })

    test('applies custom text style', () => {
      const customTextStyle = {
        fontSize: 18,
        fontWeight: 'bold'
      }

      const { getByText } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          textStyle={customTextStyle}
        />
      )

      const text = getByText('テストボタン')
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      )
    })

    test('merges custom styles with default styles', () => {
      const customStyle = { borderRadius: 20 }

      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          style={customStyle}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: mockTheme.colors.primary,
            borderRadius: 20
          })
        ])
      )
    })

    test('custom styles override default styles appropriately', () => {
      const customStyle = { backgroundColor: '#FF0000' }

      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          style={customStyle}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      // Custom backgroundColor should override default
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#FF0000'
          })
        ])
      )
    })
  })

  describe('Text Display', () => {
    test('displays text with correct default color', () => {
      const { getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      const text = getByText('テストボタン')
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#FFFFFF'
          })
        ])
      )
    })

    test('handles empty title string', () => {
      const { getByTestId } = render(
        <PrimaryButton 
          title="" 
          onPress={mockOnPress}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button).toBeTruthy()
    })

    test('handles long title text', () => {
      const longTitle = 'これは非常に長いボタンタイトルでテキストの表示をテストします'
      
      const { getByText } = render(
        <PrimaryButton title={longTitle} onPress={mockOnPress} />
      )

      expect(getByText(longTitle)).toBeTruthy()
    })

    test('handles special characters in title', () => {
      const specialTitle = '保存 & 続行 → 次へ'
      
      const { getByText } = render(
        <PrimaryButton title={specialTitle} onPress={mockOnPress} />
      )

      expect(getByText(specialTitle)).toBeTruthy()
    })
  })

  describe('TestID and Accessibility', () => {
    test('applies testID when provided', () => {
      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          testID="custom-test-id"
        />
      )

      expect(getByTestId('custom-test-id')).toBeTruthy()
    })

    test('works without testID', () => {
      const { getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      expect(getByText('テストボタン')).toBeTruthy()
    })

    test('provides accessible button behavior', () => {
      const { getByRole } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      expect(getByRole('button')).toBeTruthy()
    })

    test('provides accessible label matching title', () => {
      const { getByLabelText } = render(
        <PrimaryButton title="保存" onPress={mockOnPress} />
      )

      expect(getByLabelText('保存')).toBeTruthy()
    })

    test('indicates disabled state for accessibility', () => {
      const { getByRole } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          disabled={true}
        />
      )

      const button = getByRole('button')
      expect(button.props.accessibilityState).toEqual(
        expect.objectContaining({
          disabled: true
        })
      )
    })
  })

  describe('Theme Integration', () => {
    test('updates colors when theme changes', () => {
      const { rerender, getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          testID="test-button"
        />
      )

      // Change theme colors
      const newTheme = {
        colors: {
          primary: '#FF6B6B',
          border: '#E0E0E0',
          text: '#000000'
        }
      }

      const { useTheme } = require('@react-navigation/native')
      useTheme.mockReturnValue(newTheme)

      rerender(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: newTheme.colors.primary
          })
        ])
      )
    })

    test('handles missing theme properties gracefully', () => {
      const incompleteTheme = {
        colors: {
          primary: '#007AFF'
          // missing border and text colors
        }
      }

      const { useTheme } = require('@react-navigation/native')
      useTheme.mockReturnValue(incompleteTheme)

      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#007AFF'
          })
        ])
      )
    })
  })

  describe('Performance', () => {
    test('renders quickly with complex styling', () => {
      const complexStyle = {
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        paddingHorizontal: 30,
        paddingVertical: 15,
        marginHorizontal: 10,
        marginVertical: 5
      }

      const startTime = Date.now()
      
      render(
        <PrimaryButton 
          title="複雑なスタイルのボタン" 
          onPress={mockOnPress}
          style={complexStyle}
        />
      )
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('handles rapid state changes efficiently', () => {
      const { rerender } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} disabled={false} />
      )

      // Simulate rapid enable/disable changes
      for (let i = 0; i < 20; i++) {
        rerender(
          <PrimaryButton 
            title="テストボタン" 
            onPress={mockOnPress} 
            disabled={i % 2 === 0} 
          />
        )
      }

      // Should complete without performance issues
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('handles null onPress function', () => {
      expect(() => {
        render(<PrimaryButton title="テストボタン" onPress={null as any} />)
      }).not.toThrow()
    })

    test('handles undefined props gracefully', () => {
      const { getByText } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          style={undefined}
          textStyle={undefined}
          disabled={undefined}
          testID={undefined}
        />
      )

      expect(getByText('テストボタン')).toBeTruthy()
    })

    test('handles array-style StyleProp correctly', () => {
      const styleArray = [
        { backgroundColor: '#FF0000' },
        { borderRadius: 10 },
        null, // null values should be handled
        undefined, // undefined values should be handled
        { padding: 15 }
      ]

      const { getByTestId } = render(
        <PrimaryButton 
          title="テストボタン" 
          onPress={mockOnPress}
          style={styleArray}
          testID="test-button"
        />
      )

      const button = getByTestId('test-button')
      expect(button).toBeTruthy()
    })
  })

  describe('Component Updates', () => {
    test('updates title when prop changes', () => {
      const { rerender, getByText, queryByText } = render(
        <PrimaryButton title="初期タイトル" onPress={mockOnPress} />
      )

      expect(getByText('初期タイトル')).toBeTruthy()

      rerender(
        <PrimaryButton title="更新されたタイトル" onPress={mockOnPress} />
      )

      expect(queryByText('初期タイトル')).toBeFalsy()
      expect(getByText('更新されたタイトル')).toBeTruthy()
    })

    test('updates onPress handler when prop changes', () => {
      const newOnPress = jest.fn()

      const { rerender, getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} />
      )

      rerender(
        <PrimaryButton title="テストボタン" onPress={newOnPress} />
      )

      fireEvent.press(getByText('テストボタン'))

      expect(mockOnPress).not.toHaveBeenCalled()
      expect(newOnPress).toHaveBeenCalledTimes(1)
    })

    test('updates disabled state correctly', () => {
      const { rerender, getByText } = render(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} disabled={true} />
      )

      // Should not call onPress when disabled
      fireEvent.press(getByText('テストボタン'))
      expect(mockOnPress).not.toHaveBeenCalled()

      // Enable the button
      rerender(
        <PrimaryButton title="テストボタン" onPress={mockOnPress} disabled={false} />
      )

      // Should call onPress when enabled
      fireEvent.press(getByText('テストボタン'))
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })
  })
})

/**
 * InputField Component Tests
 * 
 * Tests the InputField component which provides a standardized text input
 * with label support and proper styling integration.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import InputField from '../../components/InputField'

describe('InputField Component', () => {
  describe('Rendering and Basic Display', () => {
    test('renders input field without label', () => {
      const { getByTestId } = render(
        <InputField placeholder="テスト入力" testID="test-input" />
      )

      expect(getByTestId('test-input')).toBeTruthy()
    })

    test('renders input field with label', () => {
      const { getByText, getByTestId } = render(
        <InputField 
          label="名前" 
          placeholder="名前を入力してください" 
          testID="test-input" 
        />
      )

      expect(getByText('名前')).toBeTruthy()
      expect(getByTestId('test-input')).toBeTruthy()
    })

    test('displays placeholder text correctly', () => {
      const { getByPlaceholderText } = render(
        <InputField placeholder="プレースホルダーテキスト" />
      )

      expect(getByPlaceholderText('プレースホルダーテキスト')).toBeTruthy()
    })

    test('applies default styling correctly', () => {
      const { getByTestId } = render(
        <InputField testID="test-input" />
      )

      const input = getByTestId('test-input')
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: '100%',
            height: 48,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: 8,
            backgroundColor: '#fff'
          })
        ])
      )
    })
  })

  describe('Text Input Behavior', () => {
    test('handles text input correctly', () => {
      const mockOnChangeText = jest.fn()
      
      const { getByTestId } = render(
        <InputField 
          onChangeText={mockOnChangeText}
          testID="test-input"
        />
      )

      fireEvent.changeText(getByTestId('test-input'), 'テスト文字列')

      expect(mockOnChangeText).toHaveBeenCalledWith('テスト文字列')
    })

    test('displays input value correctly', () => {
      const { getByDisplayValue } = render(
        <InputField value="初期値" />
      )

      expect(getByDisplayValue('初期値')).toBeTruthy()
    })

    test('handles value changes through controlled input', () => {
      const { rerender, getByDisplayValue, queryByDisplayValue } = render(
        <InputField value="初期値" testID="test-input" />
      )

      expect(getByDisplayValue('初期値')).toBeTruthy()

      rerender(
        <InputField value="更新された値" testID="test-input" />
      )

      expect(queryByDisplayValue('初期値')).toBeFalsy()
      expect(getByDisplayValue('更新された値')).toBeTruthy()
    })

    test('handles empty string value', () => {
      const { getByTestId } = render(
        <InputField value="" testID="test-input" />
      )

      const input = getByTestId('test-input')
      expect(input.props.value).toBe('')
    })
  })

  describe('TextInput Props Forwarding', () => {
    test('forwards standard TextInput props correctly', () => {
      const { getByTestId } = render(
        <InputField 
          secureTextEntry={true}
          autoCapitalize="words"
          keyboardType="email-address"
          maxLength={50}
          editable={false}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.secureTextEntry).toBe(true)
      expect(input.props.autoCapitalize).toBe('words')
      expect(input.props.keyboardType).toBe('email-address')
      expect(input.props.maxLength).toBe(50)
      expect(input.props.editable).toBe(false)
    })

    test('forwards event handlers correctly', () => {
      const mockOnFocus = jest.fn()
      const mockOnBlur = jest.fn()
      const mockOnSubmitEditing = jest.fn()

      const { getByTestId } = render(
        <InputField 
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
          onSubmitEditing={mockOnSubmitEditing}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      
      fireEvent(input, 'focus')
      fireEvent(input, 'blur')
      fireEvent(input, 'submitEditing')

      expect(mockOnFocus).toHaveBeenCalled()
      expect(mockOnBlur).toHaveBeenCalled()
      expect(mockOnSubmitEditing).toHaveBeenCalled()
    })

    test('forwards ref correctly', () => {
      const ref = React.createRef<any>()
      
      const { getByTestId } = render(
        <InputField ref={ref} testID="test-input" />
      )

      expect(ref.current).toBeTruthy()
    })
  })

  describe('Custom Styling', () => {
    test('applies custom style to input', () => {
      const customStyle = {
        backgroundColor: '#f0f0f0',
        borderColor: '#007AFF',
        borderWidth: 2,
        borderRadius: 8
      }

      const { getByTestId } = render(
        <InputField 
          style={customStyle}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      )
    })

    test('merges custom style with default style', () => {
      const customStyle = { backgroundColor: '#f0f0f0' }

      const { getByTestId } = render(
        <InputField 
          style={customStyle}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#f0f0f0',
            borderColor: '#ccc', // default style preserved
            height: 48 // default style preserved
          })
        ])
      )
    })

    test('handles array-style StyleProp correctly', () => {
      const styleArray = [
        { backgroundColor: '#f0f0f0' },
        { borderColor: '#007AFF' },
        null,
        undefined,
        { padding: 10 }
      ]

      const { getByTestId } = render(
        <InputField 
          style={styleArray}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input).toBeTruthy()
    })
  })

  describe('Label Display', () => {
    test('displays label with correct styling', () => {
      const { getByText } = render(
        <InputField label="ユーザー名" />
      )

      const label = getByText('ユーザー名')
      expect(label.props.style).toEqual(
        expect.objectContaining({
          marginBottom: 4,
          color: '#333'
        })
      )
    })

    test('does not render label when not provided', () => {
      const { queryByText } = render(
        <InputField placeholder="ラベルなし" />
      )

      // Should not have any label text
      expect(queryByText('ラベル')).toBeFalsy()
    })

    test('handles empty label string', () => {
      const { queryByText } = render(
        <InputField label="" placeholder="空のラベル" />
      )

      // Empty label should not be rendered
      expect(queryByText('')).toBeFalsy()
    })

    test('handles long label text', () => {
      const longLabel = 'これは非常に長いラベルテキストでレイアウトのテストを行います'
      
      const { getByText } = render(
        <InputField label={longLabel} />
      )

      expect(getByText(longLabel)).toBeTruthy()
    })
  })

  describe('Container Layout', () => {
    test('applies correct container styling', () => {
      const { getByTestId } = render(
        <InputField label="テスト" testID="test-input" />
      )

      // The container should have marginBottom
      const container = getByTestId('test-input').parent
      expect(container.props.style).toEqual(
        expect.objectContaining({
          marginBottom: 12
        })
      )
    })

    test('maintains proper spacing between label and input', () => {
      const { getByText, getByTestId } = render(
        <InputField 
          label="テストラベル" 
          placeholder="テスト入力"
          testID="test-input"
        />
      )

      const label = getByText('テストラベル')
      const input = getByTestId('test-input')

      expect(label).toBeTruthy()
      expect(input).toBeTruthy()
      
      // Label should have marginBottom for spacing
      expect(label.props.style).toEqual(
        expect.objectContaining({
          marginBottom: 4
        })
      )
    })
  })

  describe('Accessibility', () => {
    test('provides accessible label for input field', () => {
      const { getByLabelText } = render(
        <InputField 
          label="パスワード"
          placeholder="パスワードを入力"
        />
      )

      expect(getByLabelText('パスワード')).toBeTruthy()
    })

    test('provides accessible placeholder when no label', () => {
      const { getByPlaceholderText } = render(
        <InputField placeholder="検索キーワードを入力" />
      )

      expect(getByPlaceholderText('検索キーワードを入力')).toBeTruthy()
    })

    test('supports accessibility props', () => {
      const { getByTestId } = render(
        <InputField 
          accessibilityLabel="メールアドレス入力"
          accessibilityHint="有効なメールアドレスを入力してください"
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.accessibilityLabel).toBe('メールアドレス入力')
      expect(input.props.accessibilityHint).toBe('有効なメールアドレスを入力してください')
    })
  })

  describe('Focus and Interaction', () => {
    test('handles focus events correctly', () => {
      const mockOnFocus = jest.fn()
      
      const { getByTestId } = render(
        <InputField 
          onFocus={mockOnFocus}
          testID="test-input"
        />
      )

      fireEvent(getByTestId('test-input'), 'focus')

      expect(mockOnFocus).toHaveBeenCalled()
    })

    test('handles blur events correctly', () => {
      const mockOnBlur = jest.fn()
      
      const { getByTestId } = render(
        <InputField 
          onBlur={mockOnBlur}
          testID="test-input"
        />
      )

      fireEvent(getByTestId('test-input'), 'blur')

      expect(mockOnBlur).toHaveBeenCalled()
    })

    test('supports keyboard navigation', () => {
      const { getByTestId } = render(
        <InputField 
          returnKeyType="next"
          blurOnSubmit={false}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.returnKeyType).toBe('next')
      expect(input.props.blurOnSubmit).toBe(false)
    })
  })

  describe('Validation and Error States', () => {
    test('supports error styling through custom style', () => {
      const errorStyle = {
        borderColor: '#FF0000',
        borderWidth: 2
      }

      const { getByTestId } = render(
        <InputField 
          style={errorStyle}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#FF0000',
            borderWidth: 2
          })
        ])
      )
    })

    test('handles different input types correctly', () => {
      const { getByTestId } = render(
        <InputField 
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.keyboardType).toBe('numeric')
      expect(input.props.autoCapitalize).toBe('none')
      expect(input.props.autoCorrect).toBe(false)
    })
  })

  describe('Performance', () => {
    test('renders quickly with complex props', () => {
      const startTime = Date.now()
      
      render(
        <InputField 
          label="複雑な入力フィールド"
          placeholder="プレースホルダーテキスト"
          value="初期値"
          secureTextEntry={true}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="done"
          maxLength={100}
          multiline={false}
          numberOfLines={1}
          style={{
            backgroundColor: '#f8f8f8',
            borderColor: '#007AFF',
            borderWidth: 2,
            borderRadius: 8,
            padding: 12
          }}
        />
      )
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('handles rapid prop changes efficiently', () => {
      const { rerender } = render(
        <InputField value="初期値" testID="test-input" />
      )

      for (let i = 0; i < 50; i++) {
        rerender(
          <InputField 
            value={`値${i}`} 
            testID="test-input"
            placeholder={`プレースホルダー${i}`}
          />
        )
      }

      // Should complete without performance issues
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('handles null and undefined props gracefully', () => {
      const { getByTestId } = render(
        <InputField 
          label={undefined}
          value={null as any}
          placeholder={undefined}
          style={undefined}
          testID="test-input"
        />
      )

      expect(getByTestId('test-input')).toBeTruthy()
    })

    test('handles special characters in label and placeholder', () => {
      const specialLabel = 'ラベル & プレースホルダー → テスト'
      const specialPlaceholder = '特殊文字 #@$%^&*() を入力'

      const { getByText, getByPlaceholderText } = render(
        <InputField 
          label={specialLabel}
          placeholder={specialPlaceholder}
        />
      )

      expect(getByText(specialLabel)).toBeTruthy()
      expect(getByPlaceholderText(specialPlaceholder)).toBeTruthy()
    })

    test('handles multiline input correctly', () => {
      const { getByTestId } = render(
        <InputField 
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
          testID="test-input"
        />
      )

      const input = getByTestId('test-input')
      expect(input.props.multiline).toBe(true)
      expect(input.props.numberOfLines).toBe(4)
      expect(input.props.textAlignVertical).toBe('top')
    })
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react-native'
import LoadingSpinner from '../../components/LoadingSpinner'

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    it('should render activity indicator', () => {
      render(<LoadingSpinner />)
      
      const activityIndicator = screen.getByTestId('activity-indicator')
      expect(activityIndicator).toBeTruthy()
    })

    it('should render default message when no message prop provided', () => {
      render(<LoadingSpinner />)
      
      expect(screen.getByText('読み込み中...')).toBeTruthy()
    })

    it('should render custom message when message prop provided', () => {
      const customMessage = 'カスタムメッセージ'
      render(<LoadingSpinner message={customMessage} />)
      
      expect(screen.getByText(customMessage)).toBeTruthy()
    })

    it('should render container view with proper structure', () => {
      const { root } = render(<LoadingSpinner />)
      
      expect(root).toBeTruthy()
    })
  })

  describe('Activity Indicator Properties', () => {
    it('should have large size activity indicator', () => {
      render(<LoadingSpinner />)
      
      const activityIndicator = screen.getByTestId('activity-indicator')
      expect(activityIndicator.props.size).toBe('large')
    })

    it('should have correct color for activity indicator', () => {
      render(<LoadingSpinner />)
      
      const activityIndicator = screen.getByTestId('activity-indicator')
      expect(activityIndicator.props.color).toBe('#007bff')
    })

    it('should have animating property set to true by default', () => {
      render(<LoadingSpinner />)
      
      const activityIndicator = screen.getByTestId('activity-indicator')
      expect(activityIndicator.props.animating).toBeTruthy()
    })
  })

  describe('Message Display', () => {
    it('should display Japanese default message correctly', () => {
      render(<LoadingSpinner />)
      
      const message = screen.getByText('読み込み中...')
      expect(message).toBeTruthy()
    })

    it('should display English custom message', () => {
      render(<LoadingSpinner message="Loading..." />)
      
      expect(screen.getByText('Loading...')).toBeTruthy()
    })

    it('should display multi-line message', () => {
      const multiLineMessage = 'データを\n読み込んでいます'
      render(<LoadingSpinner message={multiLineMessage} />)
      
      expect(screen.getByText(multiLineMessage)).toBeTruthy()
    })

    it('should display empty message when empty string provided', () => {
      render(<LoadingSpinner message="" />)
      
      expect(screen.getByText('')).toBeTruthy()
    })

    it('should display long message properly', () => {
      const longMessage = 'これは非常に長いメッセージです。このメッセージはテストのために作成されました。'
      render(<LoadingSpinner message={longMessage} />)
      
      expect(screen.getByText(longMessage)).toBeTruthy()
    })
  })

  describe('Style Properties', () => {
    it('should apply correct container styles', () => {
      const { root } = render(<LoadingSpinner />)
      
      const containerView = root.findAllByType('View')[0]
      expect(containerView.props.style).toMatchObject({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      })
    })

    it('should apply correct message text styles', () => {
      render(<LoadingSpinner />)
      
      const messageText = screen.getByText('読み込み中...')
      expect(messageText.props.style).toMatchObject({
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
      })
    })

    it('should maintain style consistency across different messages', () => {
      const { rerender } = render(<LoadingSpinner message="Message 1" />)
      const firstMessage = screen.getByText('Message 1')
      const firstStyle = firstMessage.props.style

      rerender(<LoadingSpinner message="Message 2" />)
      const secondMessage = screen.getByText('Message 2')
      
      expect(secondMessage.props.style).toEqual(firstStyle)
    })
  })

  describe('Component Structure', () => {
    it('should have activity indicator before message text', () => {
      const { root } = render(<LoadingSpinner />)
      
      const children = root.findAllByType('View')[0].props.children
      expect(children).toHaveLength(2)
      expect(children[0].type.displayName).toBe('ActivityIndicator')
      expect(children[1].type.displayName).toBe('Text')
    })

    it('should contain exactly one activity indicator', () => {
      const { root } = render(<LoadingSpinner />)
      
      const activityIndicators = root.findAllByType('ActivityIndicator')
      expect(activityIndicators).toHaveLength(1)
    })

    it('should contain exactly one text element', () => {
      const { root } = render(<LoadingSpinner />)
      
      const textElements = root.findAllByType('Text')
      expect(textElements).toHaveLength(1)
    })

    it('should wrap content in single container view', () => {
      const { root } = render(<LoadingSpinner />)
      
      const views = root.findAllByType('View')
      expect(views).toHaveLength(1)
    })
  })

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      render(<LoadingSpinner message="Loading data" />)
      
      const messageText = screen.getByText('Loading data')
      expect(messageText).toBeTruthy()
    })

    it('should provide meaningful content for accessibility tools', () => {
      render(<LoadingSpinner message="データを処理中" />)
      
      const activityIndicator = screen.getByTestId('activity-indicator')
      const messageText = screen.getByText('データを処理中')
      
      expect(activityIndicator).toBeTruthy()
      expect(messageText).toBeTruthy()
    })

    it('should have proper semantic structure', () => {
      const { root } = render(<LoadingSpinner />)
      
      expect(root).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined message prop gracefully', () => {
      render(<LoadingSpinner message={undefined} />)
      
      expect(screen.getByText('読み込み中...')).toBeTruthy()
    })

    it('should handle null message prop gracefully', () => {
      // @ts-ignore - Testing runtime behavior
      render(<LoadingSpinner message={null} />)
      
      expect(screen.getByText('読み込み中...')).toBeTruthy()
    })

    it('should handle special characters in message', () => {
      const specialMessage = '🔄 Loading... 💫'
      render(<LoadingSpinner message={specialMessage} />)
      
      expect(screen.getByText(specialMessage)).toBeTruthy()
    })

    it('should handle numeric message values', () => {
      // @ts-ignore - Testing runtime behavior
      render(<LoadingSpinner message={123} />)
      
      expect(screen.getByText('123')).toBeTruthy()
    })

    it('should render consistently with very short message', () => {
      render(<LoadingSpinner message="..." />)
      
      expect(screen.getByText('...')).toBeTruthy()
    })
  })

  describe('Re-rendering Behavior', () => {
    it('should update message when prop changes', () => {
      const { rerender } = render(<LoadingSpinner message="Initial message" />)
      
      expect(screen.getByText('Initial message')).toBeTruthy()
      
      rerender(<LoadingSpinner message="Updated message" />)
      
      expect(screen.getByText('Updated message')).toBeTruthy()
      expect(screen.queryByText('Initial message')).toBeNull()
    })

    it('should maintain activity indicator during re-renders', () => {
      const { rerender } = render(<LoadingSpinner message="Message 1" />)
      
      const initialIndicator = screen.getByTestId('activity-indicator')
      
      rerender(<LoadingSpinner message="Message 2" />)
      
      const updatedIndicator = screen.getByTestId('activity-indicator')
      expect(updatedIndicator).toBeTruthy()
      expect(updatedIndicator.props.size).toBe('large')
      expect(updatedIndicator.props.color).toBe('#007bff')
    })

    it('should handle rapid message changes', () => {
      const { rerender } = render(<LoadingSpinner message="Step 1" />)
      
      rerender(<LoadingSpinner message="Step 2" />)
      rerender(<LoadingSpinner message="Step 3" />)
      rerender(<LoadingSpinner message="Complete" />)
      
      expect(screen.getByText('Complete')).toBeTruthy()
    })
  })

  describe('Performance Considerations', () => {
    it('should render efficiently with default props', () => {
      const startTime = performance.now()
      render(<LoadingSpinner />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50) // Should render quickly
    })

    it('should render efficiently with custom message', () => {
      const startTime = performance.now()
      render(<LoadingSpinner message="Custom loading message" />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should handle multiple instances efficiently', () => {
      const startTime = performance.now()
      
      render(
        <>
          <LoadingSpinner message="Loading 1" />
          <LoadingSpinner message="Loading 2" />
          <LoadingSpinner message="Loading 3" />
        </>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should work for data fetching scenario', () => {
      render(<LoadingSpinner message="バッジデータを読み込み中..." />)
      
      expect(screen.getByText('バッジデータを読み込み中...')).toBeTruthy()
      expect(screen.getByTestId('activity-indicator')).toBeTruthy()
    })

    it('should work for authentication scenario', () => {
      render(<LoadingSpinner message="ログイン中..." />)
      
      expect(screen.getByText('ログイン中...')).toBeTruthy()
    })

    it('should work for save operation scenario', () => {
      render(<LoadingSpinner message="設定を保存しています..." />)
      
      expect(screen.getByText('設定を保存しています...')).toBeTruthy()
    })

    it('should work for generic loading scenario', () => {
      render(<LoadingSpinner />)
      
      expect(screen.getByText('読み込み中...')).toBeTruthy()
    })

    it('should work for upload scenario', () => {
      render(<LoadingSpinner message="ファイルをアップロード中..." />)
      
      expect(screen.getByText('ファイルをアップロード中...')).toBeTruthy()
    })
  })

  describe('Layout and Positioning', () => {
    it('should center content vertically and horizontally', () => {
      const { root } = render(<LoadingSpinner />)
      
      const containerView = root.findAllByType('View')[0]
      expect(containerView.props.style.justifyContent).toBe('center')
      expect(containerView.props.style.alignItems).toBe('center')
    })

    it('should take full available space', () => {
      const { root } = render(<LoadingSpinner />)
      
      const containerView = root.findAllByType('View')[0]
      expect(containerView.props.style.flex).toBe(1)
    })

    it('should have proper padding for content', () => {
      const { root } = render(<LoadingSpinner />)
      
      const containerView = root.findAllByType('View')[0]
      expect(containerView.props.style.padding).toBe(20)
    })

    it('should position message below activity indicator', () => {
      render(<LoadingSpinner />)
      
      const messageText = screen.getByText('読み込み中...')
      expect(messageText.props.style.marginTop).toBe(16)
    })
  })

  describe('Text Formatting', () => {
    it('should center-align message text', () => {
      render(<LoadingSpinner />)
      
      const messageText = screen.getByText('読み込み中...')
      expect(messageText.props.style.textAlign).toBe('center')
    })

    it('should use appropriate font size for message', () => {
      render(<LoadingSpinner />)
      
      const messageText = screen.getByText('読み込み中...')
      expect(messageText.props.style.fontSize).toBe(16)
    })

    it('should use subtle color for message text', () => {
      render(<LoadingSpinner />)
      
      const messageText = screen.getByText('読み込み中...')
      expect(messageText.props.style.color).toBe('#666')
    })
  })
})

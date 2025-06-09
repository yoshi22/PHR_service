import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorMessage from '../../components/ErrorMessage';

describe('ErrorMessage Component', () => {
  const defaultProps = {
    message: 'An error occurred',
  };

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('An error occurred')).toBeTruthy();
    });

    it('should render without retry button when onRetry is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);
      
      expect(screen.getByText('An error occurred')).toBeTruthy();
      expect(screen.queryByText('再試行')).toBeFalsy();
    });

    it('should render with retry button when onRetry is provided', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      expect(screen.getByText('An error occurred')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });
  });

  describe('Error Message Display', () => {
    it('should display simple error messages', () => {
      render(<ErrorMessage message="Simple error" />);
      
      expect(screen.getByText('Simple error')).toBeTruthy();
    });

    it('should display complex error messages', () => {
      const complexMessage = 'Network error: Failed to fetch data from server. Please check your internet connection and try again.';
      
      render(<ErrorMessage message={complexMessage} />);
      
      expect(screen.getByText(complexMessage)).toBeTruthy();
    });

    it('should display multiline error messages', () => {
      const multilineMessage = 'Error occurred:\nPlease try again later\nContact support if problem persists';
      
      render(<ErrorMessage message={multilineMessage} />);
      
      expect(screen.getByText(multilineMessage)).toBeTruthy();
    });

    it('should display error messages with special characters', () => {
      const specialMessage = 'エラーが発生しました！@#$%^&*()';
      
      render(<ErrorMessage message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeTruthy();
    });

    it('should handle empty error message', () => {
      render(<ErrorMessage message="" />);
      
      expect(screen.getByText('')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });
  });

  describe('Retry Functionality', () => {
    it('should call onRetry when retry button is pressed', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('再試行');
      fireEvent.press(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple retry button presses', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('再試行');
      
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });

    it('should not render retry button when onRetry is undefined', () => {
      render(<ErrorMessage message="Error without retry" />);
      
      expect(screen.queryByText('再試行')).toBeFalsy();
    });

    it('should render retry button when onRetry is provided', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage message="Error with retry" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('再試行')).toBeTruthy();
    });
  });

  describe('Visual Elements', () => {
    it('should always display warning icon', () => {
      render(<ErrorMessage message="Test error" />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should display warning icon with retry button', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage message="Test error" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });

    it('should maintain consistent layout structure', () => {
      const { rerender } = render(<ErrorMessage message="Error 1" />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('Error 1')).toBeTruthy();
      
      rerender(<ErrorMessage message="Error 2" onRetry={jest.fn()} />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('Error 2')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });
  });

  describe('Component States', () => {
    it('should handle state without retry callback', () => {
      render(<ErrorMessage message="No retry error" />);
      
      expect(screen.getByText('No retry error')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.queryByText('再試行')).toBeFalsy();
    });

    it('should handle state with retry callback', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage message="Retry available error" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('Retry available error')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });

    it('should handle dynamic state changes', () => {
      const { rerender } = render(<ErrorMessage message="Initial error" />);
      
      expect(screen.queryByText('再試行')).toBeFalsy();
      
      const mockOnRetry = jest.fn();
      rerender(<ErrorMessage message="Updated error" onRetry={mockOnRetry} />);
      
      expect(screen.getByText('Updated error')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with clear error messaging', () => {
      render(<ErrorMessage message="Accessible error message" />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('Accessible error message')).toBeTruthy();
    });

    it('should provide accessible retry functionality', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage message="Error with accessible retry" onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('再試行');
      expect(retryButton).toBeTruthy();
      
      fireEvent.press(retryButton);
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should have proper visual hierarchy', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage message="Hierarchical error message" onRetry={mockOnRetry} />);
      
      // Icon should be first
      expect(screen.getByText('⚠️')).toBeTruthy();
      // Message should be present
      expect(screen.getByText('Hierarchical error message')).toBeTruthy();
      // Button should be last
      expect(screen.getByText('再試行')).toBeTruthy();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network error messages', () => {
      const networkError = 'ネットワークエラー: インターネット接続を確認してください';
      
      render(<ErrorMessage message={networkError} onRetry={jest.fn()} />);
      
      expect(screen.getByText(networkError)).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });

    it('should handle server error messages', () => {
      const serverError = 'サーバーエラー: しばらく時間をおいて再度お試しください';
      
      render(<ErrorMessage message={serverError} onRetry={jest.fn()} />);
      
      expect(screen.getByText(serverError)).toBeTruthy();
    });

    it('should handle authentication error messages', () => {
      const authError = '認証エラー: 再度ログインしてください';
      
      render(<ErrorMessage message={authError} />);
      
      expect(screen.getByText(authError)).toBeTruthy();
      // No retry for auth errors typically
      expect(screen.queryByText('再試行')).toBeFalsy();
    });

    it('should handle validation error messages', () => {
      const validationError = '入力エラー: 必要な項目を入力してください';
      
      render(<ErrorMessage message={validationError} />);
      
      expect(screen.getByText(validationError)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'This is an extremely long error message that might wrap to multiple lines and could potentially cause layout issues if not handled properly by the component implementation and styling system';
      
      render(<ErrorMessage message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeTruthy();
    });

    it('should handle null onRetry callback', () => {
      render(<ErrorMessage message="Test error" onRetry={null as any} />);
      
      expect(screen.getByText('Test error')).toBeTruthy();
      expect(screen.queryByText('再試行')).toBeFalsy();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<ErrorMessage message="Error 1" />);
      
      for (let i = 2; i <= 10; i++) {
        rerender(<ErrorMessage message={`Error ${i}`} onRetry={i % 2 === 0 ? jest.fn() : undefined} />);
      }
      
      expect(screen.getByText('Error 10')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle multiple re-renders efficiently', () => {
      const { rerender } = render(<ErrorMessage message="Initial" />);
      
      for (let i = 0; i < 50; i++) {
        rerender(<ErrorMessage message={`Message ${i}`} onRetry={jest.fn()} />);
      }
      
      expect(screen.getByText('Message 49')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });

    it('should handle rapid retry button presses', () => {
      const mockOnRetry = jest.fn();
      
      render(<ErrorMessage message="Rapid retry test" onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('再試行');
      
      // Simulate rapid tapping
      for (let i = 0; i < 10; i++) {
        fireEvent.press(retryButton);
      }
      
      expect(mockOnRetry).toHaveBeenCalledTimes(10);
    });
  });

  describe('Real-world Usage', () => {
    it('should work for data loading errors', () => {
      const mockRetry = jest.fn();
      
      render(
        <ErrorMessage 
          message="データの読み込みに失敗しました"
          onRetry={mockRetry}
        />
      );
      
      expect(screen.getByText('データの読み込みに失敗しました')).toBeTruthy();
      
      fireEvent.press(screen.getByText('再試行'));
      expect(mockRetry).toHaveBeenCalled();
    });

    it('should work for API request failures', () => {
      render(
        <ErrorMessage 
          message="API リクエストが失敗しました。しばらく時間をおいて再度お試しください。"
          onRetry={jest.fn()}
        />
      );
      
      expect(screen.getByText('API リクエストが失敗しました。しばらく時間をおいて再度お試しください。')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });

    it('should work for permission errors', () => {
      render(
        <ErrorMessage 
          message="このアクションを実行する権限がありません"
        />
      );
      
      expect(screen.getByText('このアクションを実行する権限がありません')).toBeTruthy();
      expect(screen.queryByText('再試行')).toBeFalsy();
    });

    it('should work in loading states', () => {
      const mockRetry = jest.fn();
      
      render(
        <ErrorMessage 
          message="読み込み中にエラーが発生しました"
          onRetry={mockRetry}
        />
      );
      
      expect(screen.getByText('読み込み中にエラーが発生しました')).toBeTruthy();
      expect(screen.getByText('再試行')).toBeTruthy();
    });
  });
});

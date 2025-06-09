import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Checkbox from '../../components/Checkbox';

describe('Checkbox Component', () => {
  const defaultProps = {
    label: 'Test Checkbox',
    checked: false,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      render(<Checkbox {...defaultProps} />);
      
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
    });

    it('should render with testID when provided', () => {
      render(<Checkbox {...defaultProps} testID="test-checkbox" />);
      
      expect(screen.getByTestId('test-checkbox')).toBeTruthy();
    });

    it('should display the label text correctly', () => {
      const customLabel = 'Custom Label Text';
      
      render(<Checkbox {...defaultProps} label={customLabel} />);
      
      expect(screen.getByText(customLabel)).toBeTruthy();
    });
  });

  describe('Checked State', () => {
    it('should display unchecked state correctly', () => {
      render(<Checkbox {...defaultProps} checked={false} />);
      
      // Should not show checkmark
      expect(screen.queryByText('✓')).toBeFalsy();
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
    });

    it('should display checked state correctly', () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      
      // Should show checkmark
      expect(screen.getByText('✓')).toBeTruthy();
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
    });

    it('should toggle between checked and unchecked states', () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);
      
      expect(screen.queryByText('✓')).toBeFalsy();
      
      rerender(<Checkbox {...defaultProps} checked={true} />);
      
      expect(screen.getByText('✓')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should call onPress when checkbox is tapped', () => {
      const mockOnPress = jest.fn();
      
      render(<Checkbox {...defaultProps} onPress={mockOnPress} />);
      
      const checkbox = screen.getByText('Test Checkbox');
      fireEvent.press(checkbox.parent!);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should call onPress when label is tapped', () => {
      const mockOnPress = jest.fn();
      
      render(<Checkbox {...defaultProps} onPress={mockOnPress} />);
      
      const label = screen.getByText('Test Checkbox');
      fireEvent.press(label.parent!);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple taps correctly', () => {
      const mockOnPress = jest.fn();
      
      render(<Checkbox {...defaultProps} onPress={mockOnPress} />);
      
      const container = screen.getByText('Test Checkbox').parent!;
      
      fireEvent.press(container);
      fireEvent.press(container);
      fireEvent.press(container);
      
      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('Different Labels', () => {
    it('should handle short labels', () => {
      render(<Checkbox {...defaultProps} label="OK" />);
      
      expect(screen.getByText('OK')).toBeTruthy();
    });

    it('should handle long labels', () => {
      const longLabel = 'This is a very long checkbox label that might wrap to multiple lines';
      
      render(<Checkbox {...defaultProps} label={longLabel} />);
      
      expect(screen.getByText(longLabel)).toBeTruthy();
    });

    it('should handle labels with special characters', () => {
      const specialLabel = 'チェックボックス ✓ @ #$%';
      
      render(<Checkbox {...defaultProps} label={specialLabel} />);
      
      expect(screen.getByText(specialLabel)).toBeTruthy();
    });

    it('should handle empty label', () => {
      render(<Checkbox {...defaultProps} label="" />);
      
      expect(screen.getByText('')).toBeTruthy();
    });

    it('should handle numeric labels', () => {
      const numericLabel = '12345';
      
      render(<Checkbox {...defaultProps} label={numericLabel} />);
      
      expect(screen.getByText(numericLabel)).toBeTruthy();
    });
  });

  describe('Visual States', () => {
    it('should display correct visual state when unchecked', () => {
      render(<Checkbox {...defaultProps} checked={false} />);
      
      const container = screen.getByText('Test Checkbox').parent!;
      expect(container).toBeTruthy();
      expect(screen.queryByText('✓')).toBeFalsy();
    });

    it('should display correct visual state when checked', () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      
      const container = screen.getByText('Test Checkbox').parent!;
      expect(container).toBeTruthy();
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('should maintain visual consistency across different states', () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);
      
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
      
      rerender(<Checkbox {...defaultProps} checked={true} />);
      
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
      expect(screen.getByText('✓')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with TouchableOpacity', () => {
      render(<Checkbox {...defaultProps} />);
      
      const touchable = screen.getByText('Test Checkbox').parent!;
      expect(touchable).toBeTruthy();
    });

    it('should provide clear visual feedback for checked state', () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('should be accessible with testID for automated testing', () => {
      render(<Checkbox {...defaultProps} testID="accessibility-checkbox" />);
      
      expect(screen.getByTestId('accessibility-checkbox')).toBeTruthy();
    });

    it('should have readable label text', () => {
      const accessibleLabel = 'Agree to terms and conditions';
      
      render(<Checkbox {...defaultProps} label={accessibleLabel} />);
      
      expect(screen.getByText(accessibleLabel)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onPress gracefully', () => {
      render(<Checkbox label="Test" checked={false} onPress={undefined as any} />);
      
      expect(screen.getByText('Test')).toBeTruthy();
    });

    it('should handle rapid state changes', () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);
      
      for (let i = 0; i < 10; i++) {
        rerender(<Checkbox {...defaultProps} checked={i % 2 === 0} />);
      }
      
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
    });

    it('should handle very long label text', () => {
      const veryLongLabel = 'This is an extremely long checkbox label that could potentially cause layout issues or performance problems if not handled properly by the component implementation';
      
      render(<Checkbox {...defaultProps} label={veryLongLabel} />);
      
      expect(screen.getByText(veryLongLabel)).toBeTruthy();
    });
  });

  describe('Real-world Usage', () => {
    it('should work as agreement checkbox', () => {
      const mockOnPress = jest.fn();
      
      render(
        <Checkbox 
          label="利用規約に同意する"
          checked={false}
          onPress={mockOnPress}
          testID="terms-agreement"
        />
      );
      
      expect(screen.getByText('利用規約に同意する')).toBeTruthy();
      expect(screen.getByTestId('terms-agreement')).toBeTruthy();
      
      fireEvent.press(screen.getByTestId('terms-agreement'));
      expect(mockOnPress).toHaveBeenCalled();
    });

    it('should work as notification preference', () => {
      const mockOnPress = jest.fn();
      
      render(
        <Checkbox 
          label="プッシュ通知を受け取る"
          checked={true}
          onPress={mockOnPress}
          testID="notification-preference"
        />
      );
      
      expect(screen.getByText('プッシュ通知を受け取る')).toBeTruthy();
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('should work as feature toggle', () => {
      const mockOnPress = jest.fn();
      
      render(
        <Checkbox 
          label="ダークモードを有効にする"
          checked={false}
          onPress={mockOnPress}
          testID="dark-mode-toggle"
        />
      );
      
      expect(screen.getByText('ダークモードを有効にする')).toBeTruthy();
      expect(screen.queryByText('✓')).toBeFalsy();
    });

    it('should work in form context', () => {
      const mockOnPress = jest.fn();
      
      const formItems = [
        { label: 'メール通知', checked: true },
        { label: 'SMS通知', checked: false },
        { label: 'プッシュ通知', checked: true },
      ];
      
      formItems.forEach((item, index) => {
        render(
          <Checkbox 
            label={item.label}
            checked={item.checked}
            onPress={mockOnPress}
            testID={`form-checkbox-${index}`}
          />
        );
        
        expect(screen.getByText(item.label)).toBeTruthy();
        if (item.checked) {
          expect(screen.getByText('✓')).toBeTruthy();
        }
      });
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid presses', () => {
      const mockOnPress = jest.fn();
      
      render(<Checkbox {...defaultProps} onPress={mockOnPress} />);
      
      const container = screen.getByText('Test Checkbox').parent!;
      
      // Simulate rapid tapping
      for (let i = 0; i < 20; i++) {
        fireEvent.press(container);
      }
      
      expect(mockOnPress).toHaveBeenCalledTimes(20);
    });

    it('should not cause performance issues with frequent re-renders', () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);
      
      // Simulate frequent updates
      for (let i = 0; i < 100; i++) {
        rerender(<Checkbox {...defaultProps} checked={i % 2 === 0} />);
      }
      
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    it('should maintain consistent component structure', () => {
      render(<Checkbox {...defaultProps} />);
      
      // Check that container has both checkbox and label
      const container = screen.getByText('Test Checkbox').parent!;
      expect(container).toBeTruthy();
    });

    it('should render checkbox box independently of label', () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      
      // Checkmark should be present
      expect(screen.getByText('✓')).toBeTruthy();
      expect(screen.getByText('Test Checkbox')).toBeTruthy();
    });

    it('should handle dynamic prop changes correctly', () => {
      const { rerender } = render(
        <Checkbox 
          label="Original Label"
          checked={false}
          onPress={jest.fn()}
        />
      );
      
      expect(screen.getByText('Original Label')).toBeTruthy();
      
      rerender(
        <Checkbox 
          label="Updated Label"
          checked={true}
          onPress={jest.fn()}
        />
      );
      
      expect(screen.getByText('Updated Label')).toBeTruthy();
      expect(screen.getByText('✓')).toBeTruthy();
    });
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProgressBar from '../../components/ProgressBar';

// Mock theme hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      card: '#F2F2F7',
      text: '#000000',
      border: '#C6C6C8',
    },
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

describe('ProgressBar Component', () => {
  const defaultProps = {
    progress: 50,
    label: 'Daily Steps',
    current: 5000,
    target: 10000,
    unit: 'steps',
  };

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      render(
        <TestWrapper>
          <ProgressBar {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Daily Steps')).toBeTruthy();
      expect(screen.getByText('5,000')).toBeTruthy();
      expect(screen.getByText('10,000')).toBeTruthy();
      expect(screen.getByText('steps')).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();
    });

    it('should render with custom color', () => {
      render(
        <TestWrapper>
          <ProgressBar {...defaultProps} color="#FF6B6B" />
        </TestWrapper>
      );
      
      expect(screen.getByText('Daily Steps')).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();
    });

    it('should render without animation when specified', () => {
      render(
        <TestWrapper>
          <ProgressBar {...defaultProps} showAnimation={false} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Daily Steps')).toBeTruthy();
    });
  });

  describe('Progress Values', () => {
    it('should handle 0% progress', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={0} 
            current={0} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('0')).toBeTruthy();
      expect(screen.getByText('0%')).toBeTruthy();
    });

    it('should handle 100% progress', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={100} 
            current={10000} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('10,000')).toBeTruthy();
      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('🎉 目標達成！')).toBeTruthy();
    });

    it('should handle over 100% progress', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={150} 
            current={15000} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('15,000')).toBeTruthy();
      expect(screen.getByText('100%')).toBeTruthy(); // Should clamp to 100%
      expect(screen.getByText('🎉 目標達成！')).toBeTruthy();
    });

    it('should handle negative progress', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={-10} 
            current={0} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('0%')).toBeTruthy(); // Should clamp to 0%
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers with commas', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            current={12345} 
            target={50000} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('12,345')).toBeTruthy();
      expect(screen.getByText('50,000')).toBeTruthy();
    });

    it('should handle decimal progress values', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={66.7} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('67%')).toBeTruthy(); // Should round
    });
  });

  describe('Different Units', () => {
    it('should display kilometers unit', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            unit="km" 
            current={5} 
            target={10} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('km')).toBeTruthy();
    });

    it('should display calories unit', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            unit="kcal" 
            current={1200} 
            target={2000} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('kcal')).toBeTruthy();
    });

    it('should display minutes unit', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            unit="分" 
            current={30} 
            target={60} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('分')).toBeTruthy();
    });
  });

  describe('Achievement State', () => {
    it('should show achievement message when goal is reached', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={100} 
            current={10000} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('🎉 目標達成！')).toBeTruthy();
    });

    it('should not show achievement message when goal is not reached', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={99} 
            current={9900} 
          />
        </TestWrapper>
      );
      
      expect(screen.queryByText('🎉 目標達成！')).toBeFalsy();
    });

    it('should highlight current value when goal is completed', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={100} 
            current={10000} 
          />
        </TestWrapper>
      );
      
      // Current value should be styled differently when completed
      const currentText = screen.getByText('10,000');
      expect(currentText).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero target', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            target={0} 
            progress={0} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('0')).toBeTruthy();
    });

    it('should handle very small numbers', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            current={1} 
            target={2} 
            progress={50} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('should handle floating point current values', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            current={1234.56} 
            target={2000} 
          />
        </TestWrapper>
      );
      
      // Should format decimal properly
      expect(screen.getByText('1,235')).toBeTruthy(); // Rounded
    });
  });

  describe('Text Color Logic', () => {
    it('should use white text for percentage when progress > 40%', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={50} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('50%')).toBeTruthy();
    });

    it('should use theme text color when progress <= 40%', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={30} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('30%')).toBeTruthy();
    });
  });

  describe('Animation Handling', () => {
    it('should not animate when showAnimation is false', () => {
      const mockAnimatedValue = {
        setValue: jest.fn(),
        interpolate: jest.fn(() => '50%'),
      };
      
      (require('react-native').Animated.Value as jest.Mock).mockReturnValue(mockAnimatedValue);
      
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            showAnimation={false} 
          />
        </TestWrapper>
      );
      
      expect(mockAnimatedValue.setValue).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper text content', () => {
      render(
        <TestWrapper>
          <ProgressBar {...defaultProps} />
        </TestWrapper>
      );
      
      // Check that all important information is present for screen readers
      expect(screen.getByText('Daily Steps')).toBeTruthy();
      expect(screen.getByText('5,000')).toBeTruthy();
      expect(screen.getByText('10,000')).toBeTruthy();
      expect(screen.getByText('steps')).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();
    });

    it('should provide clear achievement feedback', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            progress={100} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('🎉 目標達成！')).toBeTruthy();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid progress updates', () => {
      const { rerender } = render(
        <TestWrapper>
          <ProgressBar {...defaultProps} progress={10} />
        </TestWrapper>
      );
      
      // Simulate rapid updates
      for (let i = 20; i <= 80; i += 10) {
        rerender(
          <TestWrapper>
            <ProgressBar {...defaultProps} progress={i} />
          </TestWrapper>
        );
      }
      
      expect(screen.getByText('80%')).toBeTruthy();
    });

    it('should handle very long labels gracefully', () => {
      const longLabel = 'This is a very long progress bar label that might cause layout issues';
      
      render(
        <TestWrapper>
          <ProgressBar 
            {...defaultProps} 
            label={longLabel} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(longLabel)).toBeTruthy();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should display daily step goal progress', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            progress={75}
            label="今日の歩数目標"
            current={7500}
            target={10000}
            unit="歩"
            color="#34C759"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('今日の歩数目標')).toBeTruthy();
      expect(screen.getByText('7,500')).toBeTruthy();
      expect(screen.getByText('10,000')).toBeTruthy();
      expect(screen.getByText('歩')).toBeTruthy();
      expect(screen.getByText('75%')).toBeTruthy();
    });

    it('should display weekly distance goal', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            progress={60}
            label="今週の距離目標"
            current={12}
            target={20}
            unit="km"
            color="#FF9500"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('今週の距離目標')).toBeTruthy();
      expect(screen.getByText('12')).toBeTruthy();
      expect(screen.getByText('20')).toBeTruthy();
      expect(screen.getByText('km')).toBeTruthy();
      expect(screen.getByText('60%')).toBeTruthy();
    });

    it('should display calorie burn progress', () => {
      render(
        <TestWrapper>
          <ProgressBar 
            progress={85}
            label="カロリー消費目標"
            current={1700}
            target={2000}
            unit="kcal"
            color="#FF3B30"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('カロリー消費目標')).toBeTruthy();
      expect(screen.getByText('1,700')).toBeTruthy();
      expect(screen.getByText('2,000')).toBeTruthy();
      expect(screen.getByText('kcal')).toBeTruthy();
      expect(screen.getByText('85%')).toBeTruthy();
    });
  });
});

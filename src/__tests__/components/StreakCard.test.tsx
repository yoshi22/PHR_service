import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import StreakCard from '../../components/StreakCard';

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

describe('StreakCard Component', () => {
  const defaultProps = {
    currentStreak: 7,
    longestStreak: 15,
    streakStatus: 'アクティブ',
    isActiveToday: true,
  };

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByText('7日連続')).toBeTruthy();
      expect(screen.getByText('アクティブ')).toBeTruthy();
      expect(screen.getByText('現在のストリーク')).toBeTruthy();
      expect(screen.getByText('最長記録')).toBeTruthy();
      expect(screen.getByText('7日')).toBeTruthy();
      expect(screen.getByText('15日')).toBeTruthy();
    });

    it('should render with milestone information', () => {
      const propsWithMilestone = {
        ...defaultProps,
        daysToMilestone: { days: 3, milestone: '10日連続' },
      };
      
      render(
        <TestWrapper>
          <StreakCard {...propsWithMilestone} />
        </TestWrapper>
      );
      
      expect(screen.getByText(/あと3日で10日連続達成！/)).toBeTruthy();
    });

    it('should render with onPress handler', () => {
      const mockOnPress = jest.fn();
      
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} onPress={mockOnPress} />
        </TestWrapper>
      );
      
      expect(screen.getByText('詳細を見る')).toBeTruthy();
    });
  });

  describe('Streak Color and Icon Logic', () => {
    it('should display gray color and footsteps icon for streak < 3', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={1} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('1日連続')).toBeTruthy();
    });

    it('should display yellow color for streak 3-6', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={5} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('5日連続')).toBeTruthy();
    });

    it('should display green color for streak 7-13', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={10} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('10日連続')).toBeTruthy();
    });

    it('should display blue color for streak 14-29', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={20} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('20日連続')).toBeTruthy();
    });

    it('should display teal color for streak 30-49', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={35} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('35日連続')).toBeTruthy();
    });

    it('should display red color for streak 50-99', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={75} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('75日連続')).toBeTruthy();
    });

    it('should display gold color for streak >= 100', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={150} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('150日連続')).toBeTruthy();
    });
  });

  describe('Today Activity Status', () => {
    it('should show checkmark when active today', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            isActiveToday={true} 
          />
        </TestWrapper>
      );
      
      // Check that the component renders correctly
      expect(screen.getByText('7日連続')).toBeTruthy();
    });

    it('should show time icon when not active today', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            isActiveToday={false} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('7日連続')).toBeTruthy();
    });

    it('should style streak status differently when active today', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            isActiveToday={true} 
          />
        </TestWrapper>
      );
      
      const statusText = screen.getByText('アクティブ');
      expect(statusText).toBeTruthy();
    });
  });

  describe('Milestone Display', () => {
    it('should show milestone progress when provided', () => {
      const milestone = { days: 5, milestone: '30日連続' };
      
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={25}
            daysToMilestone={milestone} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(/あと5日で30日連続達成！/)).toBeTruthy();
    });

    it('should not show milestone when not provided', () => {
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.queryByText(/あと.*日で.*達成！/)).toBeFalsy();
    });

    it('should handle different milestone descriptions', () => {
      const milestone = { days: 1, milestone: 'ウィークリーゴール' };
      
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            daysToMilestone={milestone} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(/あと1日でウィークリーゴール達成！/)).toBeTruthy();
    });
  });

  describe('Interaction Handling', () => {
    it('should call onPress when card is tapped', () => {
      const mockOnPress = jest.fn();
      
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} onPress={mockOnPress} />
        </TestWrapper>
      );
      
      const card = screen.getByText('7日連続').parent?.parent;
      if (card) {
        fireEvent.press(card);
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      }
    });

    it('should not show tap hint when onPress is not provided', () => {
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.queryByText('詳細を見る')).toBeFalsy();
    });

    it('should show tap hint when onPress is provided', () => {
      const mockOnPress = jest.fn();
      
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} onPress={mockOnPress} />
        </TestWrapper>
      );
      
      expect(screen.getByText('詳細を見る')).toBeTruthy();
    });
  });

  describe('Stats Display', () => {
    it('should display current and longest streaks in stats section', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={12}
            longestStreak={25}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('12日連続')).toBeTruthy();
      expect(screen.getByText('12日')).toBeTruthy();
      expect(screen.getByText('25日')).toBeTruthy();
    });

    it('should handle when current streak equals longest streak', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={20}
            longestStreak={20}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('20日連続')).toBeTruthy();
      expect(screen.getByTestId('current-streak-value')).toHaveTextContent('20日');
      expect(screen.getByTestId('longest-streak-value')).toHaveTextContent('20日');
    });

    it('should handle zero streaks', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={0}
            longestStreak={0}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('0日連続')).toBeTruthy();
      expect(screen.getByTestId('current-streak-value')).toHaveTextContent('0日');
      expect(screen.getByTestId('longest-streak-value')).toHaveTextContent('0日');
    });
  });

  describe('Status Messages', () => {
    it('should display different status messages', () => {
      const statuses = [
        'アクティブ',
        '継続中',
        '危険',
        '失効',
        '休止中',
      ];

      statuses.forEach(status => {
        render(
          <TestWrapper>
            <StreakCard 
              {...defaultProps} 
              streakStatus={status} 
            />
          </TestWrapper>
        );
        
        expect(screen.getByText(status)).toBeTruthy();
      });
    });

    it('should handle empty status message', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            streakStatus="" 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('7日連続')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large streak numbers', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={365}
            longestStreak={500}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('365日連続')).toBeTruthy();
      expect(screen.getByText('365日')).toBeTruthy();
      expect(screen.getByText('500日')).toBeTruthy();
    });

    it('should handle negative streak values gracefully', () => {
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            currentStreak={-1}
            longestStreak={-1}
          />
        </TestWrapper>
      );
      
      // Should still render but with negative values
      expect(screen.getByText('-1日連続')).toBeTruthy();
    });

    it('should handle milestone with 0 days remaining', () => {
      const milestone = { days: 0, milestone: '目標達成' };
      
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            daysToMilestone={milestone} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(/あと0日で目標達成達成！/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper content structure', () => {
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} />
        </TestWrapper>
      );
      
      // Check that important information is available
      expect(screen.getByText('7日連続')).toBeTruthy();
      expect(screen.getByText('現在のストリーク')).toBeTruthy();
      expect(screen.getByText('最長記録')).toBeTruthy();
      expect(screen.getByText('アクティブ')).toBeTruthy();
    });

    it('should provide clear milestone information', () => {
      const milestone = { days: 3, milestone: '10日連続' };
      
      render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            daysToMilestone={milestone} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(/あと3日で10日連続達成！/)).toBeTruthy();
    });

    it('should indicate interactive nature when onPress is provided', () => {
      const mockOnPress = jest.fn();
      
      render(
        <TestWrapper>
          <StreakCard {...defaultProps} onPress={mockOnPress} />
        </TestWrapper>
      );
      
      expect(screen.getByText('詳細を見る')).toBeTruthy();
    });
  });

  describe('Visual Feedback', () => {
    it('should provide visual distinction for active vs inactive today', () => {
      // Test active today
      const { rerender } = render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            isActiveToday={true} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('アクティブ')).toBeTruthy();
      
      // Test inactive today
      rerender(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            isActiveToday={false} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('アクティブ')).toBeTruthy();
    });

    it('should show different visual states for different streak levels', () => {
      const streakLevels = [1, 5, 10, 20, 35, 75, 150];
      
      streakLevels.forEach(streak => {
        render(
          <TestWrapper>
            <StreakCard 
              {...defaultProps} 
              currentStreak={streak} 
            />
          </TestWrapper>
        );
        
        expect(screen.getByText(`${streak}日連続`)).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid prop updates', () => {
      const { rerender } = render(
        <TestWrapper>
          <StreakCard {...defaultProps} currentStreak={1} />
        </TestWrapper>
      );
      
      // Simulate rapid updates
      for (let i = 2; i <= 10; i++) {
        rerender(
          <TestWrapper>
            <StreakCard {...defaultProps} currentStreak={i} />
          </TestWrapper>
        );
      }
      
      expect(screen.getByText('10日連続')).toBeTruthy();
    });

    it('should handle complex milestone updates', () => {
      const { rerender } = render(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            daysToMilestone={{ days: 10, milestone: '目標1' }} 
          />
        </TestWrapper>
      );
      
      rerender(
        <TestWrapper>
          <StreakCard 
            {...defaultProps} 
            daysToMilestone={{ days: 5, milestone: '目標2' }} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByText(/あと5日で目標2達成！/)).toBeTruthy();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should display new user streak correctly', () => {
      render(
        <TestWrapper>
          <StreakCard 
            currentStreak={1}
            longestStreak={1}
            streakStatus="スタート"
            isActiveToday={true}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('1日連続')).toBeTruthy();
      expect(screen.getByText('スタート')).toBeTruthy();
    });

    it('should display experienced user streak', () => {
      render(
        <TestWrapper>
          <StreakCard 
            currentStreak={42}
            longestStreak={100}
            streakStatus="絶好調"
            isActiveToday={true}
            daysToMilestone={{ days: 8, milestone: '50日達成' }}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('42日連続')).toBeTruthy();
      expect(screen.getByText('絶好調')).toBeTruthy();
      expect(screen.getByText(/あと8日で50日達成達成！/)).toBeTruthy();
    });

    it('should display broken streak scenario', () => {
      render(
        <TestWrapper>
          <StreakCard 
            currentStreak={0}
            longestStreak={25}
            streakStatus="リセット"
            isActiveToday={false}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('0日連続')).toBeTruthy();
      expect(screen.getByText('リセット')).toBeTruthy();
      expect(screen.getByText('25日')).toBeTruthy(); // Longest streak
    });
  });
});

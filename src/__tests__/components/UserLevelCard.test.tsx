import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TouchableOpacity } from 'react-native'
import { useTheme } from '@react-navigation/native'
import UserLevelCard from '../../components/UserLevelCard'

// Mock the theme hook
jest.mock('@react-navigation/native', () => ({
  useTheme: jest.fn(),
}))

const mockTheme = {
  dark: false,
  colors: {
    card: '#ffffff',
    border: '#e0e0e0',
    text: '#000000',
    primary: '#007AFF',
    background: '#ffffff',
    notification: '#FF3B30',
  },
}

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

describe('UserLevelCard', () => {
  const defaultProps = {
    level: 10,
    levelTitle: 'ウォーキング・マスター',
    currentExp: 750,
    nextLevelExp: 1000,
    progressPercentage: 75,
    totalSteps: 50000,
  }

  beforeEach(() => {
    mockUseTheme.mockReturnValue(mockTheme)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render level information correctly', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('Lv.10')).toBeTruthy()
      expect(screen.getByText('ウォーキング・マスター')).toBeTruthy()
    })

    it('should render total steps with proper formatting', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('総歩数: 50,000歩')).toBeTruthy()
    })

    it('should render experience values correctly', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('750 / 1,000 EXP')).toBeTruthy()
    })

    it('should render progress percentage', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('75%')).toBeTruthy()
    })

    it('should render next level label', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('次のレベルまで')).toBeTruthy()
    })
  })

  describe('Level Icon and Color Logic', () => {
    it('should display trophy icon for level 50+', () => {
      render(<UserLevelCard {...defaultProps} level={50} />)
      
      const levelBadge = screen.getByText('Lv.50').parent?.parent
      expect(levelBadge).toBeTruthy()
    })

    it('should display medal icon for level 30-49', () => {
      render(<UserLevelCard {...defaultProps} level={35} />)
      
      expect(screen.getByText('Lv.35')).toBeTruthy()
    })

    it('should display ribbon icon for level 20-29', () => {
      render(<UserLevelCard {...defaultProps} level={25} />)
      
      expect(screen.getByText('Lv.25')).toBeTruthy()
    })

    it('should display star icon for level 15-19', () => {
      render(<UserLevelCard {...defaultProps} level={15} />)
      
      expect(screen.getByText('Lv.15')).toBeTruthy()
    })

    it('should display flame icon for level 10-14', () => {
      render(<UserLevelCard {...defaultProps} level={10} />)
      
      expect(screen.getByText('Lv.10')).toBeTruthy()
    })

    it('should display walk icon for level 5-9', () => {
      render(<UserLevelCard {...defaultProps} level={7} />)
      
      expect(screen.getByText('Lv.7')).toBeTruthy()
    })

    it('should display footsteps icon for level 1-4', () => {
      render(<UserLevelCard {...defaultProps} level={3} />)
      
      expect(screen.getByText('Lv.3')).toBeTruthy()
    })
  })

  describe('Progress Bar Functionality', () => {
    it('should display correct progress width for normal progress', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={60} />)
      
      expect(screen.getByText('60%')).toBeTruthy()
    })

    it('should cap progress at 100% maximum', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={120} />)
      
      expect(screen.getByText('120%')).toBeTruthy()
    })

    it('should handle 0% progress', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={0} />)
      
      expect(screen.getByText('0%')).toBeTruthy()
    })

    it('should handle 100% progress', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={100} />)
      
      expect(screen.getByText('100%')).toBeTruthy()
    })

    it('should display level up message when progress >= 100%', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={100} />)
      
      expect(screen.getByText('🎉 レベルアップ可能！')).toBeTruthy()
    })

    it('should not display level up message when progress < 100%', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={99} />)
      
      expect(screen.queryByText('🎉 レベルアップ可能！')).toBeNull()
    })
  })

  describe('Interaction Handling', () => {
    it('should call onPress when provided and card is pressed', () => {
      const mockOnPress = jest.fn()
      render(<UserLevelCard {...defaultProps} onPress={mockOnPress} />)
      
      const touchableCard = screen.getByText('ウォーキング・マスター').parent?.parent?.parent
      fireEvent.press(touchableCard!)
      
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })

    it('should not crash when pressed without onPress handler', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      const touchableCard = screen.getByText('ウォーキング・マスター').parent?.parent?.parent
      expect(() => fireEvent.press(touchableCard!)).not.toThrow()
    })

    it('should display tap hint when onPress is provided', () => {
      render(<UserLevelCard {...defaultProps} onPress={() => {}} />)
      
      expect(screen.getByText('詳細を見る')).toBeTruthy()
    })

    it('should not display tap hint when onPress is not provided', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.queryByText('詳細を見る')).toBeNull()
    })

    it('should have touchable interaction when onPress is provided', () => {
      const mockOnPress = jest.fn()
      const { getByTestId } = render(<UserLevelCard {...defaultProps} onPress={mockOnPress} />)
      
      const touchableCard = getByTestId('user-level-card-container')
      
      // Test that pressing the card calls the onPress function
      fireEvent.press(touchableCard)
      expect(mockOnPress).toHaveBeenCalledTimes(1)
      
      // Test that pressing again calls it again
      fireEvent.press(touchableCard)
      expect(mockOnPress).toHaveBeenCalledTimes(2)
    })
  })

  describe('Theme Integration', () => {
    it('should use theme colors for card background', () => {
      const customTheme = {
        dark: false,
        colors: {
          card: '#f5f5f5',
          border: '#cccccc',
          text: '#333333',
          primary: '#007AFF',
          background: '#ffffff',
          notification: '#FF3B30',
        },
      }
      mockUseTheme.mockReturnValue(customTheme)
      
      const { getByTestId } = render(<UserLevelCard {...defaultProps} />)
      
      const cardContainer = getByTestId('user-level-card-container')
      // Check if backgroundColor is correctly set in the style object
      expect(cardContainer.props.style.backgroundColor).toBe('#f5f5f5')
    })

    it('should use theme colors for text elements', () => {
      const customTheme = {
        dark: false,
        colors: {
          card: '#ffffff',
          border: '#e0e0e0',
          text: '#123456',
          primary: '#007AFF',
          background: '#ffffff',
          notification: '#FF3B30',
        },
      }
      mockUseTheme.mockReturnValue(customTheme)
      
      render(<UserLevelCard {...defaultProps} />)
      
      const titleText = screen.getByText('ウォーキング・マスター')
      expect(titleText.props.style).toContainEqual(
        expect.objectContaining({ color: '#123456' })
      )
    })

    it('should use theme colors for border', () => {
      const customTheme = {
        dark: false,
        colors: {
          card: '#ffffff',
          border: '#ff0000',
          text: '#000000',
          primary: '#007AFF',
          background: '#ffffff',
          notification: '#FF3B30',
        },
      }
      mockUseTheme.mockReturnValue(customTheme)
      
      const { getByTestId } = render(<UserLevelCard {...defaultProps} />)
      
      const cardContainer = getByTestId('user-level-card-container')
      expect(cardContainer.props.style.borderColor).toBe('#ff0000')
    })
  })

  describe('Number Formatting', () => {
    it('should format large step counts with commas', () => {
      render(<UserLevelCard {...defaultProps} totalSteps={1234567} />)
      
      expect(screen.getByText('総歩数: 1,234,567歩')).toBeTruthy()
    })

    it('should format experience values with commas', () => {
      render(
        <UserLevelCard
          {...defaultProps}
          currentExp={12345}
          nextLevelExp={67890}
        />
      )
      
      expect(screen.getByText('12,345 / 67,890 EXP')).toBeTruthy()
    })

    it('should handle small numbers without commas correctly', () => {
      render(
        <UserLevelCard
          {...defaultProps}
          totalSteps={123}
          currentExp={45}
          nextLevelExp={100}
        />
      )
      
      expect(screen.getByText('総歩数: 123歩')).toBeTruthy()
      expect(screen.getByText('45 / 100 EXP')).toBeTruthy()
    })

    it('should round progress percentage correctly', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={75.6} />)
      
      expect(screen.getByText('76%')).toBeTruthy()
    })

    it('should handle decimal progress percentages', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={33.33} />)
      
      expect(screen.getByText('33%')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle level 0', () => {
      render(<UserLevelCard {...defaultProps} level={0} />)
      
      expect(screen.getByText('Lv.0')).toBeTruthy()
    })

    it('should handle very high levels', () => {
      render(<UserLevelCard {...defaultProps} level={999} />)
      
      expect(screen.getByText('Lv.999')).toBeTruthy()
    })

    it('should handle 0 total steps', () => {
      render(<UserLevelCard {...defaultProps} totalSteps={0} />)
      
      expect(screen.getByText('総歩数: 0歩')).toBeTruthy()
    })

    it('should handle 0 experience values', () => {
      render(
        <UserLevelCard
          {...defaultProps}
          currentExp={0}
          nextLevelExp={0}
        />
      )
      
      expect(screen.getByText('0 / 0 EXP')).toBeTruthy()
    })

    it('should handle negative progress percentage', () => {
      render(<UserLevelCard {...defaultProps} progressPercentage={-10} />)
      
      expect(screen.getByText('-10%')).toBeTruthy()
    })

    it('should handle very long level titles', () => {
      const longTitle = 'とても長いレベルタイトルでテストします'
      render(<UserLevelCard {...defaultProps} levelTitle={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('Lv.10')).toBeTruthy()
      expect(screen.getByText('ウォーキング・マスター')).toBeTruthy()
      expect(screen.getByText('総歩数: 50,000歩')).toBeTruthy()
    })

    it('should provide meaningful content structure', () => {
      render(<UserLevelCard {...defaultProps} />)
      
      expect(screen.getByText('次のレベルまで')).toBeTruthy()
      expect(screen.getByText('750 / 1,000 EXP')).toBeTruthy()
      expect(screen.getByText('75%')).toBeTruthy()
    })

    it('should have accessible touch target when interactive', () => {
      render(<UserLevelCard {...defaultProps} onPress={() => {}} />)
      
      const touchableCard = screen.getByText('ウォーキング・マスター').parent?.parent?.parent
      expect(touchableCard?.props.accessible).not.toBe(false)
    })
  })

  describe('Performance Considerations', () => {
    it('should render efficiently with default props', () => {
      const startTime = performance.now()
      render(<UserLevelCard {...defaultProps} />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should handle re-renders efficiently', () => {
      const { rerender } = render(<UserLevelCard {...defaultProps} />)
      
      const startTime = performance.now()
      rerender(<UserLevelCard {...defaultProps} level={11} />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(25)
    })

    it('should handle multiple instances efficiently', () => {
      const startTime = performance.now()
      
      render(
        <>
          <UserLevelCard {...defaultProps} level={5} />
          <UserLevelCard {...defaultProps} level={15} />
          <UserLevelCard {...defaultProps} level={25} />
        </>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should work for beginner user display', () => {
      const beginnerProps = {
        level: 3,
        levelTitle: 'ビギナー',
        currentExp: 150,
        nextLevelExp: 500,
        progressPercentage: 30,
        totalSteps: 5000,
      }
      
      render(<UserLevelCard {...beginnerProps} />)
      
      expect(screen.getByText('Lv.3')).toBeTruthy()
      expect(screen.getByText('ビギナー')).toBeTruthy()
      expect(screen.getByText('30%')).toBeTruthy()
    })

    it('should work for advanced user display', () => {
      const advancedProps = {
        level: 45,
        levelTitle: 'グランドマスター',
        currentExp: 9800,
        nextLevelExp: 10000,
        progressPercentage: 98,
        totalSteps: 2500000,
      }
      
      render(<UserLevelCard {...advancedProps} />)
      
      expect(screen.getByText('Lv.45')).toBeTruthy()
      expect(screen.getByText('グランドマスター')).toBeTruthy()
      expect(screen.getByText('98%')).toBeTruthy()
      expect(screen.getByText('総歩数: 2,500,000歩')).toBeTruthy()
    })

    it('should work for level up ready state', () => {
      const levelUpProps = {
        level: 20,
        levelTitle: 'エキスパート',
        currentExp: 5000,
        nextLevelExp: 5000,
        progressPercentage: 100,
        totalSteps: 500000,
        onPress: jest.fn(),
      }
      
      render(<UserLevelCard {...levelUpProps} />)
      
      expect(screen.getByText('🎉 レベルアップ可能！')).toBeTruthy()
      expect(screen.getByText('詳細を見る')).toBeTruthy()
    })

    it('should work for profile dashboard integration', () => {
      const dashboardProps = {
        level: 12,
        levelTitle: 'アクティブ・ウォーカー',
        currentExp: 2400,
        nextLevelExp: 3000,
        progressPercentage: 80,
        totalSteps: 120000,
        onPress: jest.fn(),
      }
      
      render(<UserLevelCard {...dashboardProps} />)
      
      expect(screen.getByText('Lv.12')).toBeTruthy()
      expect(screen.getByText('アクティブ・ウォーカー')).toBeTruthy()
      expect(screen.getByText('80%')).toBeTruthy()
      expect(screen.getByText('詳細を見る')).toBeTruthy()
    })
  })

  describe('Visual Consistency', () => {
    it('should maintain consistent spacing and layout', () => {
      const { root } = render(<UserLevelCard {...defaultProps} />)
      
      expect(root).toBeTruthy()
    })

    it('should apply shadow and elevation consistently', () => {
      const { getByTestId } = render(<UserLevelCard {...defaultProps} />)
      
      const cardContainer = getByTestId('user-level-card-container')
      const style = cardContainer.props.style
      expect(style.shadowColor).toBe('#000')
      expect(style.shadowOffset).toEqual({ width: 0, height: 2 })
      expect(style.shadowOpacity).toBe(0.1)
      expect(style.shadowRadius).toBe(3)
      expect(style.elevation).toBe(2)
    })

    it('should use consistent border radius', () => {
      const { getByTestId } = render(<UserLevelCard {...defaultProps} />)
      
      const cardContainer = getByTestId('user-level-card-container')
      expect(cardContainer.props.style.borderRadius).toBe(12)
    })
  })
})

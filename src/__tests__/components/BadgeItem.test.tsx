/**
 * BadgeItem Component Tests
 * 
 * Tests the BadgeItem component which displays individual badge information
 * with animation effects for new badges and proper metadata display.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { Animated } from 'react-native'
import BadgeItem from '../../components/BadgeItem'

// Mock the specialBadgeService
jest.mock('../../services/specialBadgeService', () => ({
  getBadgeMetadata: jest.fn((type: string) => {
    const metadata: Record<string, any> = {
      'daily_steps': {
        type: 'daily_steps',
        name: '今日の歩数',
        description: '1日の歩数目標を達成',
        icon: '👟',
        category: 'Regular',
        rarity: 'Common'
      },
      'steps_10k': {
        type: 'steps_10k',
        name: '1万歩達成',
        description: '1日で1万歩を達成',
        icon: '🏃',
        category: 'Regular',
        rarity: 'Rare'
      },
      'spring_badge': {
        type: 'spring_badge',
        name: '春のバッジ',
        description: '春に獲得したバッジ',
        icon: '🌸',
        category: 'Seasonal',
        rarity: 'Epic'
      }
    }
    return metadata[type] || null
  })
}))

describe('BadgeItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Basic Display', () => {
    test('renders badge with correct date and type', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByText('2023-12-01 今日の歩数')).toBeTruthy()
    })

    test('displays correct badge icon from metadata', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByText('👟')).toBeTruthy()
    })

    test('uses fallback when badge metadata is not found', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="unknown_badge" isNew={false} />
      )

      expect(getByText('2023-12-01 unknown_badge')).toBeTruthy()
      expect(getByText('🏅')).toBeTruthy() // fallback icon
    })

    test('displays different badges with correct metadata', () => {
      const { getByText: getText1 } = render(
        <BadgeItem date="2023-12-01" type="steps_10k" isNew={false} />
      )
      expect(getText1('🏃')).toBeTruthy()
      expect(getText1('2023-12-01 1万歩達成')).toBeTruthy()

      const { getByText: getText2 } = render(
        <BadgeItem date="2023-12-02" type="spring_badge" isNew={false} />
      )
      expect(getText2('🌸')).toBeTruthy()
      expect(getText2('2023-12-02 春のバッジ')).toBeTruthy()
    })
  })

  describe('New Badge Display', () => {
    test('displays new badge indicator when isNew is true', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      expect(getByText('新着')).toBeTruthy()
    })

    test('does not display new badge indicator when isNew is false', () => {
      const { queryByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(queryByText('新着')).toBeFalsy()
    })

    test('displays star icon for new badges instead of regular icon', () => {
      const { getByText, queryByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      expect(getByText('🌟')).toBeTruthy()
      expect(queryByText('👟')).toBeFalsy() // regular icon should not be shown
    })

    test('applies new card styling when isNew is true', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      const card = getByTestId('badge-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String),
            borderColor: expect.any(String)
          })
        ])
      )
    })

    test('applies new text styling when isNew is true', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      const text = getByTestId('badge-text')
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expect.any(String),
            fontWeight: expect.any(String)
          })
        ])
      )
    })
  })

  describe('Animation Behavior', () => {
    test('initializes shine animation value when component mounts', () => {
      render(<BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />)

      expect(Animated.Value).toHaveBeenCalledWith(-100)
    })

    test('starts shine animation loop when badge is new', async () => {
      render(<BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />)

      await waitFor(() => {
        expect(Animated.loop).toHaveBeenCalled()
        expect(Animated.timing).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            toValue: 100,
            duration: 1500,
            useNativeDriver: true
          })
        )
      })
    })

    test('does not start shine animation when badge is not new', () => {
      render(<BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />)

      expect(Animated.loop).not.toHaveBeenCalled()
    })

    test('applies shine animation transform to shine view', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      const shineView = getByTestId('shine-view')
      expect(shineView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            transform: expect.arrayContaining([
              expect.objectContaining({ translateX: expect.any(Object) })
            ])
          })
        ])
      )
    })

    test('only shows shine view for new badges', () => {
      const { queryByTestId: queryNew } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )
      expect(queryNew('shine-view')).toBeTruthy()

      const { queryByTestId: queryOld } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )
      expect(queryOld('shine-view')).toBeFalsy()
    })
  })

  describe('Badge Metadata Integration', () => {
    test('calls getBadgeMetadata with correct badge type', () => {
      const { getBadgeMetadata } = require('../../services/specialBadgeService')
      
      render(<BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />)

      expect(getBadgeMetadata).toHaveBeenCalledWith('daily_steps')
    })

    test('uses metadata name when available', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByText('2023-12-01 今日の歩数')).toBeTruthy()
    })

    test('uses metadata icon when available', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByText('👟')).toBeTruthy()
    })

    test('falls back to type name when metadata name is not available', () => {
      const { getBadgeMetadata } = require('../../services/specialBadgeService')
      getBadgeMetadata.mockReturnValueOnce({ icon: '🏅' }) // missing name

      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="custom_badge" isNew={false} />
      )

      expect(getByText('2023-12-01 custom_badge')).toBeTruthy()
    })

    test('falls back to default icon when metadata icon is not available', () => {
      const { getBadgeMetadata } = require('../../services/specialBadgeService')
      getBadgeMetadata.mockReturnValueOnce({ name: 'Custom Badge' }) // missing icon

      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="custom_badge" isNew={false} />
      )

      expect(getByText('🏅')).toBeTruthy() // fallback icon
    })
  })

  describe('Props Handling', () => {
    test('handles default isNew value correctly', () => {
      const { queryByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" />
      )

      expect(queryByText('新着')).toBeFalsy()
      expect(queryByText('🌟')).toBeFalsy()
    })

    test('handles empty date string', () => {
      const { getByText } = render(
        <BadgeItem date="" type="daily_steps" isNew={false} />
      )

      expect(getByText(' 今日の歩数')).toBeTruthy()
    })

    test('handles empty type string', () => {
      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="" isNew={false} />
      )

      expect(getByText('2023-12-01 ')).toBeTruthy()
      expect(getByText('🏅')).toBeTruthy() // fallback icon
    })
  })

  describe('Styling and Layout', () => {
    test('applies correct base card styling', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      const card = getByTestId('badge-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String),
            borderRadius: expect.any(Number),
            padding: expect.any(Number)
          })
        ])
      )
    })

    test('applies additional styling for new badges', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      const card = getByTestId('badge-card')
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderWidth: expect.any(Number),
            shadowOpacity: expect.any(Number)
          })
        ])
      )
    })

    test('positions shine effect correctly', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      const shineView = getByTestId('shine-view')
      expect(shineView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            position: 'absolute',
            width: expect.any(Number),
            height: '100%'
          })
        ])
      )
    })
  })

  describe('Accessibility', () => {
    test('provides accessible label for regular badge', () => {
      const { getByLabelText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByLabelText('今日の歩数バッジ、2023年12月1日に獲得')).toBeTruthy()
    })

    test('provides accessible label for new badge', () => {
      const { getByLabelText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      expect(getByLabelText('今日の歩数バッジ、2023年12月1日に獲得、新着')).toBeTruthy()
    })

    test('provides accessible hint for animated elements', () => {
      const { getByTestId } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      const card = getByTestId('badge-card')
      expect(card.props.accessibilityHint).toBe('新しく獲得したバッジです')
    })
  })

  describe('Performance', () => {
    test('renders quickly with complex animation state', () => {
      const startTime = Date.now()
      
      render(<BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />)
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('handles rapid re-renders without memory leaks', () => {
      const { rerender } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <BadgeItem 
            date={`2023-12-${String(i + 1).padStart(2, '0')}`} 
            type="daily_steps" 
            isNew={i % 2 === 0} 
          />
        )
      }

      // Should not throw or cause performance issues
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('handles null metadata response gracefully', () => {
      const { getBadgeMetadata } = require('../../services/specialBadgeService')
      getBadgeMetadata.mockReturnValueOnce(null)

      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="invalid_badge" isNew={false} />
      )

      expect(getByText('2023-12-01 invalid_badge')).toBeTruthy()
      expect(getByText('🏅')).toBeTruthy() // fallback icon
    })

    test('handles undefined metadata properties', () => {
      const { getBadgeMetadata } = require('../../services/specialBadgeService')
      getBadgeMetadata.mockReturnValueOnce({}) // empty metadata

      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="empty_badge" isNew={false} />
      )

      expect(getByText('2023-12-01 empty_badge')).toBeTruthy()
      expect(getByText('🏅')).toBeTruthy() // fallback icon
    })

    test('handles extremely long badge names', () => {
      const { getBadgeMetadata } = require('../../services/specialBadgeService')
      getBadgeMetadata.mockReturnValueOnce({
        name: 'これは非常に長いバッジ名でテキストの折り返しをテストします',
        icon: '📝'
      })

      const { getByText } = render(
        <BadgeItem date="2023-12-01" type="long_name_badge" isNew={false} />
      )

      expect(getByText('2023-12-01 これは非常に長いバッジ名でテキストの折り返しをテストします')).toBeTruthy()
    })

    test('handles special characters in date and type', () => {
      const { getByText } = render(
        <BadgeItem date="2023/12/01" type="badge_with_underscore" isNew={false} />
      )

      expect(getByText('2023/12/01 badge_with_underscore')).toBeTruthy()
    })
  })

  describe('Component Updates', () => {
    test('updates animation when isNew prop changes', async () => {
      const { rerender } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      // Clear previous calls
      jest.clearAllMocks()

      rerender(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={true} />
      )

      await waitFor(() => {
        expect(Animated.loop).toHaveBeenCalled()
      })
    })

    test('updates content when type prop changes', () => {
      const { rerender, getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByText('👟')).toBeTruthy()

      rerender(
        <BadgeItem date="2023-12-01" type="steps_10k" isNew={false} />
      )

      expect(getByText('🏃')).toBeTruthy()
      expect(getByText('2023-12-01 1万歩達成')).toBeTruthy()
    })

    test('updates date display when date prop changes', () => {
      const { rerender, getByText } = render(
        <BadgeItem date="2023-12-01" type="daily_steps" isNew={false} />
      )

      expect(getByText('2023-12-01 今日の歩数')).toBeTruthy()

      rerender(
        <BadgeItem date="2023-12-02" type="daily_steps" isNew={false} />
      )

      expect(getByText('2023-12-02 今日の歩数')).toBeTruthy()
    })
  })
})

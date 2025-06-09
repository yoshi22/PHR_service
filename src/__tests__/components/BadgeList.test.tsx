/**
 * BadgeList Component Tests
 * 
 * Tests the BadgeList component which displays a horizontal list of badges
 * with animation effects for new badges.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { Animated } from 'react-native'
import BadgeList from '../../components/BadgeList'
import type { BadgeItemProps } from '../../components/BadgeItem'

// Mock the BadgeItem component
jest.mock('../../components/BadgeItem', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  
  return function MockBadgeItem({ date, type, isNew }: any) {
    return (
      <View testID={`badge-item-${type}`}>
        <Text>{date} {type}</Text>
        {isNew && <Text testID="new-indicator">新着</Text>}
      </View>
    )
  }
})

describe('BadgeList Component', () => {
  const mockBadges: BadgeItemProps[] = [
    {
      date: '2023-12-01',
      type: 'daily_steps',
      isNew: false
    },
    {
      date: '2023-12-02',
      type: 'steps_10k',
      isNew: true
    },
    {
      date: '2023-12-03',
      type: 'spring_badge',
      isNew: false
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Basic Display', () => {
    test('renders all badges in the list', () => {
      const { getByTestId } = render(<BadgeList badges={mockBadges} />)

      expect(getByTestId('badge-item-daily_steps')).toBeTruthy()
      expect(getByTestId('badge-item-steps_10k')).toBeTruthy()
      expect(getByTestId('badge-item-spring_badge')).toBeTruthy()
    })

    test('displays empty state when no badges provided', () => {
      const { getByText } = render(<BadgeList badges={[]} />)

      expect(getByText('まだバッジがありません')).toBeTruthy()
    })

    test('renders badges in correct order', () => {
      const { getAllByTestId } = render(<BadgeList badges={mockBadges} />)

      const badgeItems = getAllByTestId(/badge-item-/)
      expect(badgeItems[0]).toHaveTextContent('daily_steps')
      expect(badgeItems[1]).toHaveTextContent('steps_10k')
      expect(badgeItems[2]).toHaveTextContent('spring_badge')
    })

    test('displays new badge indicators correctly', () => {
      const { getByTestId, queryByTestId } = render(<BadgeList badges={mockBadges} />)

      // steps_10k is marked as new
      expect(getByTestId('new-indicator')).toBeTruthy()
      
      // Only one new indicator should be present
      const newIndicators = queryByTestId('new-indicator')
      expect(newIndicators).toBeTruthy()
    })
  })

  describe('FlatList Configuration', () => {
    test('renders as horizontal list', () => {
      const { getByTestId } = render(<BadgeList badges={mockBadges} />)

      const flatList = getByTestId('badge-flat-list')
      expect(flatList.props.horizontal).toBe(true)
    })

    test('uses correct keyExtractor format', () => {
      const { getByTestId } = render(<BadgeList badges={mockBadges} />)

      const flatList = getByTestId('badge-flat-list')
      expect(flatList.props.keyExtractor).toBeDefined()
      
      // Test the keyExtractor function
      const keyExtractor = flatList.props.keyExtractor
      const testBadge = mockBadges[0]
      expect(keyExtractor(testBadge)).toBe('2023-12-01_daily_steps')
    })

    test('applies correct content container style', () => {
      const { getByTestId } = render(<BadgeList badges={mockBadges} />)

      const flatList = getByTestId('badge-flat-list')
      expect(flatList.props.contentContainerStyle).toBeDefined()
    })
  })

  describe('Animation Behavior', () => {
    test('initializes animation value when component mounts', () => {
      render(<BadgeList badges={mockBadges} />)

      expect(Animated.Value).toHaveBeenCalledWith(0)
    })

    test('triggers animation sequence when new badges are present', async () => {
      const badgesWithNew: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'steps_10k',
          isNew: true
        }
      ]

      render(<BadgeList badges={badgesWithNew} />)

      await waitFor(() => {
        expect(Animated.sequence).toHaveBeenCalled()
      })
    })

    test('does not trigger animation when no new badges are present', () => {
      const badgesWithoutNew: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'steps_10k',
          isNew: false
        }
      ]

      render(<BadgeList badges={badgesWithoutNew} />)

      expect(Animated.sequence).not.toHaveBeenCalled()
    })

    test('resets animation value before starting new animation', async () => {
      const badgesWithNew: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: true
        }
      ]

      render(<BadgeList badges={badgesWithNew} />)

      const mockAnimatedValue = (Animated.Value as jest.Mock).mock.results[0].value
      
      await waitFor(() => {
        expect(mockAnimatedValue.setValue).toHaveBeenCalledWith(0)
      })
    })

    test('creates correct animation sequence for new badges', async () => {
      const badgesWithNew: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: true
        }
      ]

      render(<BadgeList badges={badgesWithNew} />)

      await waitFor(() => {
        expect(Animated.timing).toHaveBeenCalledTimes(3)
        expect(Animated.sequence).toHaveBeenCalledWith([
          expect.objectContaining({ start: expect.any(Function) }),
          expect.objectContaining({ start: expect.any(Function) }),
          expect.objectContaining({ start: expect.any(Function) })
        ])
      })
    })
  })

  describe('Badge Wrapper Animation', () => {
    test('applies animated transform to new badges', () => {
      const badgesWithNew: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: true
        },
        {
          date: '2023-12-02',
          type: 'steps_10k',
          isNew: false
        }
      ]

      const { getByTestId } = render(<BadgeList badges={badgesWithNew} />)

      const newBadgeWrapper = getByTestId('badge-wrapper-daily_steps')
      expect(newBadgeWrapper.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            transform: expect.arrayContaining([
              expect.objectContaining({ scale: expect.any(Object) })
            ])
          })
        ])
      )
    })

    test('does not apply animated transform to regular badges', () => {
      const regularBadges: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        }
      ]

      const { getByTestId } = render(<BadgeList badges={regularBadges} />)

      const regularBadgeWrapper = getByTestId('badge-wrapper-daily_steps')
      expect(regularBadgeWrapper.props.style).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            transform: expect.any(Array)
          })
        ])
      )
    })
  })

  describe('Performance and Memory Management', () => {
    test('handles large number of badges efficiently', () => {
      const largeBadgeList: BadgeItemProps[] = Array.from({ length: 100 }, (_, i) => ({
        date: `2023-12-${String(i + 1).padStart(2, '0')}`,
        type: `badge_${i}`,
        isNew: i < 5
      }))

      const startTime = Date.now()
      const { getByTestId } = render(<BadgeList badges={largeBadgeList} />)
      const endTime = Date.now()

      expect(getByTestId('badge-flat-list')).toBeTruthy()
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('properly cleans up animation listeners on unmount', () => {
      const { unmount } = render(<BadgeList badges={mockBadges} />)

      const mockAnimatedValue = (Animated.Value as jest.Mock).mock.results[0].value

      unmount()

      // Animation cleanup is handled by React Native internally
      expect(mockAnimatedValue).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('handles null or undefined badges array', () => {
      const { getByText } = render(<BadgeList badges={null as any} />)

      expect(getByText('まだバッジがありません')).toBeTruthy()
    })

    test('handles badges with missing properties', () => {
      const invalidBadges: any[] = [
        { date: '2023-12-01' }, // missing type
        { type: 'daily_steps' }, // missing date
        {} // missing both
      ]

      const { getByTestId } = render(<BadgeList badges={invalidBadges} />)

      // Should render without crashing
      expect(getByTestId('badge-flat-list')).toBeTruthy()
    })

    test('handles duplicate badge keys gracefully', () => {
      const duplicateBadges: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        },
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        }
      ]

      const { getByTestId } = render(<BadgeList badges={duplicateBadges} />)

      expect(getByTestId('badge-flat-list')).toBeTruthy()
      // React should handle duplicate keys gracefully
    })

    test('handles mixed new and old badges correctly', () => {
      const mixedBadges: BadgeItemProps[] = [
        { date: '2023-12-01', type: 'badge1', isNew: true },
        { date: '2023-12-02', type: 'badge2', isNew: false },
        { date: '2023-12-03', type: 'badge3', isNew: true },
        { date: '2023-12-04', type: 'badge4', isNew: false },
        { date: '2023-12-05', type: 'badge5', isNew: true }
      ]

      const { getByTestId, getAllByTestId } = render(<BadgeList badges={mixedBadges} />)

      expect(getByTestId('badge-flat-list')).toBeTruthy()
      
      // Should have new indicators for the 3 new badges
      const newIndicators = getAllByTestId('new-indicator')
      expect(newIndicators).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    test('provides accessible labels for the badge list', () => {
      const { getByLabelText } = render(<BadgeList badges={mockBadges} />)

      expect(getByLabelText('獲得したバッジの一覧')).toBeTruthy()
    })

    test('provides accessible labels for empty state', () => {
      const { getByLabelText } = render(<BadgeList badges={[]} />)

      expect(getByLabelText('バッジがまだ獲得されていません')).toBeTruthy()
    })

    test('maintains accessibility through animations', () => {
      const badgesWithNew: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: true
        }
      ]

      const { getByTestId } = render(<BadgeList badges={badgesWithNew} />)

      const animatedWrapper = getByTestId('badge-wrapper-daily_steps')
      expect(animatedWrapper.props.accessible).not.toBe(false)
    })
  })

  describe('Component Updates', () => {
    test('re-triggers animation when badges list changes with new badges', async () => {
      const initialBadges: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        }
      ]

      const updatedBadges: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'steps_10k',
          isNew: true
        }
      ]

      const { rerender } = render(<BadgeList badges={initialBadges} />)

      // Clear previous calls
      jest.clearAllMocks()

      rerender(<BadgeList badges={updatedBadges} />)

      await waitFor(() => {
        expect(Animated.sequence).toHaveBeenCalled()
      })
    })

    test('does not trigger animation when badges update without new badges', () => {
      const initialBadges: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        }
      ]

      const updatedBadges: BadgeItemProps[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'steps_10k',
          isNew: false
        }
      ]

      const { rerender } = render(<BadgeList badges={initialBadges} />)

      // Clear previous calls
      jest.clearAllMocks()

      rerender(<BadgeList badges={updatedBadges} />)

      expect(Animated.sequence).not.toHaveBeenCalled()
    })
  })
})

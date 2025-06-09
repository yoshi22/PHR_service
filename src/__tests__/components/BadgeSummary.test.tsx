/**
 * BadgeSummary Component Tests
 * 
 * Tests the BadgeSummary component which displays a compact overview
 * of the user's badge collection with progress and recent badges.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import BadgeSummary from '../../components/BadgeSummary'
import { BadgeRecord } from '../../services/badgeService'

// Mock badge definitions
jest.mock('../../constants/badgeDefinitions', () => ({
  BADGE_DEFINITIONS: [
    { id: 'daily_steps', name: '今日の歩数', description: '1日の歩数目標を達成', icon: '👟' },
    { id: 'steps_10k', name: '1万歩達成', description: '1日で1万歩を達成', icon: '🏃' },
    { id: 'spring_badge', name: '春のバッジ', description: '春に獲得したバッジ', icon: '🌸' },
    { id: 'early_bird', name: '早起きバッジ', description: '朝早くに歩数を記録', icon: '🌅' },
    { id: 'weekend_warrior', name: '週末戦士', description: '週末の活動バッジ', icon: '⚔️' },
    { id: 'anniversary_1month', name: '1ヶ月記念', description: 'アプリ使用1ヶ月達成', icon: '🎊' }
  ]
}))

describe('BadgeSummary Component', () => {
  const mockOnViewAllPress = jest.fn()

  const mockBadges: BadgeRecord[] = [
    {
      date: '2023-12-01',
      type: 'daily_steps',
      awardedAt: new Date(1701388800000),
      isNew: false
    },
    {
      date: '2023-12-02',
      type: 'steps_10k',
      awardedAt: new Date(1701475200000),
      isNew: true
    },
    {
      date: '2023-12-03',
      type: 'spring_badge',
      awardedAt: new Date(1701561600000),
      isNew: false
    },
    {
      date: '2023-12-04',
      type: 'early_bird',
      awardedAt: new Date(1701648000000),
      isNew: false
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Basic Display', () => {
    test('renders badge summary with correct title', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('バッジコレクション')).toBeTruthy()
    })

    test('displays correct progress statistics', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      // 4 earned out of 6 total badges = 67%
      expect(getByText('4/6 (67%)')).toBeTruthy()
    })

    test('displays "すべて見る" button', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('すべて見る')).toBeTruthy()
    })

    test('renders with empty badge list', () => {
      const { getByText } = render(
        <BadgeSummary badges={[]} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('0/6 (0%)')).toBeTruthy()
    })
  })

  describe('Progress Bar Display', () => {
    test('displays progress bar with correct percentage width', () => {
      const { getByTestId } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      const progressFill = getByTestId('progress-fill')
      expect(progressFill).toBeTruthy()
      // 4/6 = 67%
      expect(progressFill.props.style).toEqual(
        expect.objectContaining({
          width: '67%'
        })
      )
    })

    test('shows 0% progress when no badges earned', () => {
      const { getByTestId } = render(
        <BadgeSummary badges={[]} onViewAllPress={mockOnViewAllPress} />
      )

      const progressFill = getByTestId('progress-fill')
      expect(progressFill.props.style).toEqual(
        expect.objectContaining({
          width: '0%'
        })
      )
    })

    test('shows 100% progress when all badges earned', () => {
      const allBadges: BadgeRecord[] = [
        { date: '2023-12-01', type: 'daily_steps', awardedAt: new Date(1701388800000), isNew: false },
        { date: '2023-12-02', type: 'steps_10k', awardedAt: new Date(1701475200000), isNew: false },
        { date: '2023-12-03', type: 'spring_badge', awardedAt: new Date(1701561600000), isNew: false },
        { date: '2023-12-04', type: 'early_bird', awardedAt: new Date(1701648000000), isNew: false },
        { date: '2023-12-05', type: 'weekend_warrior', awardedAt: new Date(1701734400000), isNew: false },
        { date: '2023-12-06', type: 'anniversary_1month', awardedAt: new Date(1701820800000), isNew: false }
      ]

      const { getByTestId } = render(
        <BadgeSummary badges={allBadges} onViewAllPress={mockOnViewAllPress} />
      )

      const progressFill = getByTestId('progress-fill')
      expect(progressFill.props.style).toEqual(
        expect.objectContaining({
          width: '100%'
        })
      )
    })
  })

  describe('Recent Badges Display', () => {
    test('displays most recent 3 badges', () => {
      const { getByText, queryByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      // Should show the first 3 badges (most recent)
      expect(getByText('今日の歩数')).toBeTruthy()
      expect(getByText('1万歩達成')).toBeTruthy()
      expect(getByText('春のバッジ')).toBeTruthy()
      
      // Should not show the 4th badge in summary
      expect(queryByText('早起きバッジ')).toBeFalsy()
    })

    test('displays new badge indicator for recent new badges', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      // steps_10k badge is marked as new
      const newBadgeIndicator = getByText('新着')
      expect(newBadgeIndicator).toBeTruthy()
    })

    test('shows empty state when no badges earned', () => {
      const { getByText, queryByText } = render(
        <BadgeSummary badges={[]} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('まだバッジがありません')).toBeTruthy()
      expect(queryByText('今日の歩数')).toBeFalsy()
    })

    test('displays single badge correctly', () => {
      const singleBadge: BadgeRecord[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          awardedAt: new Date(1701388800000),
          isNew: false
        }
      ]

      const { getByText, queryByText } = render(
        <BadgeSummary badges={singleBadge} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('今日の歩数')).toBeTruthy()
      expect(queryByText('まだバッジがありません')).toBeFalsy()
    })

    test('displays badges in correct order (most recent first)', () => {
      const orderedBadges: BadgeRecord[] = [
        {
          date: '2023-12-03',
          type: 'spring_badge',
          awardedAt: new Date(1701561600000),
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'steps_10k',
          awardedAt: new Date(1701475200000),
          isNew: false
        },
        {
          date: '2023-12-01',
          type: 'daily_steps',
          awardedAt: new Date(1701388800000),
          isNew: false
        }
      ]

      const { getAllByTestId } = render(
        <BadgeSummary badges={orderedBadges} onViewAllPress={mockOnViewAllPress} />
      )

      const badgeItems = getAllByTestId(/badge-item-/)
      // First item should be spring_badge (most recent)
      expect(badgeItems[0]).toHaveTextContent('春のバッジ')
      expect(badgeItems[1]).toHaveTextContent('1万歩達成')
      expect(badgeItems[2]).toHaveTextContent('今日の歩数')
    })
  })

  describe('Badge Interaction', () => {
    test('calls onViewAllPress when "すべて見る" button is pressed', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      fireEvent.press(getByText('すべて見る'))

      expect(mockOnViewAllPress).toHaveBeenCalledTimes(1)
    })

    test('does not crash when onViewAllPress is not provided', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={undefined as any} />
      )

      expect(() => {
        fireEvent.press(getByText('すべて見る'))
      }).not.toThrow()
    })
  })

  describe('Badge Definition Matching', () => {
    test('displays correct badge names from definitions', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('今日の歩数')).toBeTruthy()
      expect(getByText('1万歩達成')).toBeTruthy()
      expect(getByText('春のバッジ')).toBeTruthy()
    })

    test('handles badges with missing definitions', () => {
      const badgesWithMissing: BadgeRecord[] = [
        {
          date: '2023-12-01',
          type: 'unknown_badge',
          awardedAt: new Date(1701388800000),
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'daily_steps',
          awardedAt: new Date(1701475200000),
          isNew: false
        }
      ]

      const { getByText, queryByText } = render(
        <BadgeSummary badges={badgesWithMissing} onViewAllPress={mockOnViewAllPress} />
      )

      // Should show known badge
      expect(getByText('今日の歩数')).toBeTruthy()
      // Should handle unknown badge gracefully (show fallback or skip)
      expect(queryByText('unknown_badge')).toBeFalsy()
    })

    test('displays badge icons correctly', () => {
      const { getByText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('👟')).toBeTruthy() // daily_steps icon
      expect(getByText('🏃')).toBeTruthy() // steps_10k icon
      expect(getByText('🌸')).toBeTruthy() // spring_badge icon
    })
  })

  describe('Percentage Calculation', () => {
    test('calculates correct percentage with different badge counts', () => {
      const testCases = [
        { badges: [], expected: '0/6 (0%)' },
        { badges: mockBadges.slice(0, 1), expected: '1/6 (17%)' },
        { badges: mockBadges.slice(0, 2), expected: '2/6 (33%)' },
        { badges: mockBadges.slice(0, 3), expected: '3/6 (50%)' },
        { badges: mockBadges, expected: '4/6 (67%)' }
      ]

      testCases.forEach(({ badges, expected }) => {
        const { getByText } = render(
          <BadgeSummary badges={badges} onViewAllPress={mockOnViewAllPress} />
        )
        expect(getByText(expected)).toBeTruthy()
      })
    })

    test('rounds percentage correctly', () => {
      // 1 out of 6 = 16.67% should round to 17%
      const singleBadge: BadgeRecord[] = [mockBadges[0]]
      const { getByText } = render(
        <BadgeSummary badges={singleBadge} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('1/6 (17%)')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    test('provides accessible labels for interactive elements', () => {
      const { getByLabelText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByLabelText('すべてのバッジを見る')).toBeTruthy()
    })

    test('provides accessible descriptions for progress', () => {
      const { getByLabelText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByLabelText('バッジ進捗: 4個中6個獲得、67%完了')).toBeTruthy()
    })

    test('provides accessible labels for badge items', () => {
      const { getByLabelText } = render(
        <BadgeSummary badges={mockBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByLabelText('今日の歩数バッジ、2023-12-01に獲得')).toBeTruthy()
      expect(getByLabelText('1万歩達成バッジ、2023-12-02に獲得、新着')).toBeTruthy()
    })
  })

  describe('Performance', () => {
    test('handles large badge lists efficiently', () => {
      const largeBadgeList: BadgeRecord[] = Array.from({ length: 1000 }, (_, i) => ({
        date: `2023-12-${String((i % 30) + 1).padStart(2, '0')}`,
        type: `badge_${i}`,
        awardedAt: new Date(1701388800000) + i * 86400000,
        isNew: i < 3
      }))

      const startTime = Date.now()
      const { getByText } = render(
        <BadgeSummary badges={largeBadgeList} onViewAllPress={mockOnViewAllPress} />
      )
      const endTime = Date.now()

      expect(getByText('バッジコレクション')).toBeTruthy()
      // Should render quickly even with large lists
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('only renders first 3 badges regardless of total count', () => {
      const manyBadges = Array.from({ length: 20 }, (_, i) => ({
        date: `2023-12-${String(i + 1).padStart(2, '0')}`,
        type: `daily_steps`,
        awardedAt: new Date(1701388800000) + i * 86400000,
        isNew: false
      }))

      const { getAllByTestId } = render(
        <BadgeSummary badges={manyBadges} onViewAllPress={mockOnViewAllPress} />
      )

      const badgeItems = getAllByTestId(/badge-item-/)
      expect(badgeItems).toHaveLength(3)
    })
  })

  describe('Edge Cases', () => {
    test('handles null or undefined badges gracefully', () => {
      const { getByText } = render(
        <BadgeSummary badges={null as any} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('バッジコレクション')).toBeTruthy()
      expect(getByText('0/6 (0%)')).toBeTruthy()
    })

    test('handles badges with missing required fields', () => {
      const invalidBadges: any[] = [
        { date: '2023-12-01' }, // missing type
        { type: 'daily_steps' }, // missing date
        {} // missing both
      ]

      const { getByText } = render(
        <BadgeSummary badges={invalidBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('バッジコレクション')).toBeTruthy()
      // Should handle gracefully without crashing
    })

    test('handles duplicate badge types correctly', () => {
      const duplicateBadges: BadgeRecord[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          awardedAt: new Date(1701388800000),
          isNew: false
        },
        {
          date: '2023-12-02',
          type: 'daily_steps',
          awardedAt: new Date(1701475200000),
          isNew: false
        }
      ]

      const { getByText } = render(
        <BadgeSummary badges={duplicateBadges} onViewAllPress={mockOnViewAllPress} />
      )

      expect(getByText('2/6 (33%)')).toBeTruthy()
      // Should count each badge instance
    })
  })
})

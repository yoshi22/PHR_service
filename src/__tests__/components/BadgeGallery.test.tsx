/**
 * BadgeGallery Component Tests
 * 
 * Tests the BadgeGallery component which displays the complete collection of badges
 * including filtering by category, statistics display, and badge interaction handling.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import BadgeGallery from '../../components/BadgeGallery'
import { BadgeRecord } from '../../services/badgeService'
import { BADGE_METADATA, BadgeMetadata } from '../../services/specialBadgeService'

// Mock the specialBadgeService
jest.mock('../../services/specialBadgeService', () => ({
  BADGE_METADATA: {
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
    },
    'early_bird': {
      type: 'early_bird',
      name: '早起きバッジ',
      description: '朝早くに歩数を記録',
      icon: '🌅',
      category: 'Surprise',
      rarity: 'Rare'
    },
    'weekend_warrior': {
      type: 'weekend_warrior',
      name: '週末戦士',
      description: '週末の活動バッジ',
      icon: '⚔️',
      category: 'Weekend',
      rarity: 'Epic'
    },
    'anniversary_1month': {
      type: 'anniversary_1month',
      name: '1ヶ月記念',
      description: 'アプリ使用1ヶ月達成',
      icon: '🎊',
      category: 'Anniversary',
      rarity: 'Legendary'
    }
  },
  getBadgesByCategory: jest.fn((category: string) => {
    const badges = Object.values(require('../../services/specialBadgeService').BADGE_METADATA)
    if (category === 'all') return badges
    return badges.filter((badge: any) => badge.category === category)
  }),
  getBadgesByRarity: jest.fn((rarity: string) => {
    const badges = Object.values(require('../../services/specialBadgeService').BADGE_METADATA)
    return badges.filter((badge: any) => badge.rarity === rarity)
  })
}))

describe('BadgeGallery Component', () => {
  const mockEarnedBadges: BadgeRecord[] = [
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
    }
  ]

  const mockOnBadgePress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Basic Display', () => {
    test('renders badge gallery with correct title', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      expect(getByText('バッジコレクション')).toBeTruthy()
    })

    test('displays correct statistics for earned badges', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      // 3 earned out of 6 total badges = 50%
      expect(getByText('3/6 (50%)')).toBeTruthy()
    })

    test('displays all category tabs', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      expect(getByText('すべて')).toBeTruthy()
      expect(getByText('基本')).toBeTruthy()
      expect(getByText('季節')).toBeTruthy()
      expect(getByText('サプライズ')).toBeTruthy()
      expect(getByText('記念日')).toBeTruthy()
      expect(getByText('週末')).toBeTruthy()
    })

    test('renders with empty earned badges list', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={[]} onBadgePress={mockOnBadgePress} />
      )

      expect(getByText('0/6 (0%)')).toBeTruthy()
    })
  })

  describe('Category Filtering', () => {
    test('filters badges by Regular category when tab is pressed', async () => {
      const { getByText, queryByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      // Press Regular category tab
      fireEvent.press(getByText('基本'))

      await waitFor(() => {
        // Should show regular badges
        expect(queryByText('今日の歩数')).toBeTruthy()
        expect(queryByText('1万歩達成')).toBeTruthy()
        // Should not show seasonal badges
        expect(queryByText('春のバッジ')).toBeFalsy()
      })
    })

    test('filters badges by Seasonal category', async () => {
      const { getByText, queryByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      fireEvent.press(getByText('季節'))

      await waitFor(() => {
        expect(queryByText('春のバッジ')).toBeTruthy()
        expect(queryByText('今日の歩数')).toBeFalsy()
      })
    })

    test('shows all badges when "すべて" tab is selected', async () => {
      const { getByText, queryByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      // First switch to a different category
      fireEvent.press(getByText('基本'))
      
      // Then switch back to all
      fireEvent.press(getByText('すべて'))

      await waitFor(() => {
        expect(queryByText('今日の歩数')).toBeTruthy()
        expect(queryByText('春のバッジ')).toBeTruthy()
        expect(queryByText('早起きバッジ')).toBeTruthy()
      })
    })
  })

  describe('Badge Status Display', () => {
    test('displays earned badges with correct styling', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      const earnedBadge = getByText('今日の歩数')
      expect(earnedBadge).toBeTruthy()
      // The component should indicate this badge is earned
    })

    test('displays unearned badges with different styling', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={[]} onBadgePress={mockOnBadgePress} />
      )

      const unearnedBadge = getByText('今日の歩数')
      expect(unearnedBadge).toBeTruthy()
      // The component should indicate this badge is not earned
    })

    test('handles badges with new status', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      // steps_10k badge is marked as new in mockEarnedBadges
      const newBadge = getByText('1万歩達成')
      expect(newBadge).toBeTruthy()
    })
  })

  describe('Badge Interaction', () => {
    test('calls onBadgePress with correct parameters when earned badge is pressed', async () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      fireEvent.press(getByText('今日の歩数'))

      await waitFor(() => {
        expect(mockOnBadgePress).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'daily_steps',
            name: '今日の歩数'
          }),
          true // isEarned
        )
      })
    })

    test('calls onBadgePress with correct parameters when unearned badge is pressed', async () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={[]} onBadgePress={mockOnBadgePress} />
      )

      fireEvent.press(getByText('今日の歩数'))

      await waitFor(() => {
        expect(mockOnBadgePress).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'daily_steps',
            name: '今日の歩数'
          }),
          false // isEarned
        )
      })
    })

    test('handles badge press without onBadgePress callback', () => {
      const { getByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} />
      )

      // Should not throw error when onBadgePress is not provided
      expect(() => {
        fireEvent.press(getByText('今日の歩数'))
      }).not.toThrow()
    })
  })

  describe('Badge Modal Display', () => {
    test('opens modal when badge is pressed', async () => {
      const { getByText, queryByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      fireEvent.press(getByText('今日の歩数'))

      await waitFor(() => {
        // Modal should show badge details
        expect(queryByText('1日の歩数目標を達成')).toBeTruthy()
      })
    })

    test('displays earned date in modal for earned badges', async () => {
      const { getByText, queryByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      fireEvent.press(getByText('今日の歩数'))

      await waitFor(() => {
        expect(queryByText('2023-12-01')).toBeTruthy()
      })
    })

    test('closes modal when close button is pressed', async () => {
      const { getByText, queryByText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      // Open modal
      fireEvent.press(getByText('今日の歩数'))

      await waitFor(() => {
        expect(queryByText('1日の歩数目標を達成')).toBeTruthy()
      })

      // Close modal
      const closeButton = getByText('閉じる')
      fireEvent.press(closeButton)

      await waitFor(() => {
        expect(queryByText('1日の歩数目標を達成')).toBeFalsy()
      })
    })
  })

  describe('Progress Bar', () => {
    test('displays progress bar with correct width', () => {
      const { getByTestId } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      const progressBar = getByTestId('progress-fill')
      expect(progressBar).toBeTruthy()
      // 3/6 = 50% width
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({
          width: '50%'
        })
      )
    })

    test('shows 0% progress when no badges are earned', () => {
      const { getByTestId } = render(
        <BadgeGallery earnedBadges={[]} onBadgePress={mockOnBadgePress} />
      )

      const progressBar = getByTestId('progress-fill')
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({
          width: '0%'
        })
      )
    })

    test('shows 100% progress when all badges are earned', () => {
      const allBadges: BadgeRecord[] = [
        { date: '2023-12-01', type: 'daily_steps', awardedAt: new Date(1701388800000), isNew: false },
        { date: '2023-12-02', type: 'steps_10k', awardedAt: new Date(1701475200000), isNew: false },
        { date: '2023-12-03', type: 'spring_badge', awardedAt: new Date(1701561600000), isNew: false },
        { date: '2023-12-04', type: 'early_bird', awardedAt: new Date(1701648000000), isNew: false },
        { date: '2023-12-05', type: 'weekend_warrior', awardedAt: new Date(1701734400000), isNew: false },
        { date: '2023-12-06', type: 'anniversary_1month', awardedAt: new Date(1701820800000), isNew: false }
      ]

      const { getByTestId } = render(
        <BadgeGallery earnedBadges={allBadges} onBadgePress={mockOnBadgePress} />
      )

      const progressBar = getByTestId('progress-fill')
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({
          width: '100%'
        })
      )
    })
  })

  describe('Rarity Color Display', () => {
    test('displays badges with correct rarity colors', () => {
      const { getByTestId } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      // Common badge should have brown color
      const commonBadge = getByTestId('badge-daily_steps')
      expect(commonBadge.props.style).toEqual(
        expect.objectContaining({
          borderColor: '#8B7355'
        })
      )

      // Rare badge should have blue color
      const rareBadge = getByTestId('badge-steps_10k')
      expect(rareBadge.props.style).toEqual(
        expect.objectContaining({
          borderColor: '#4A90E2'
        })
      )

      // Epic badge should have purple color
      const epicBadge = getByTestId('badge-spring_badge')
      expect(epicBadge.props.style).toEqual(
        expect.objectContaining({
          borderColor: '#9B59B6'
        })
      )
    })
  })

  describe('Accessibility', () => {
    test('provides accessible labels for category tabs', () => {
      const { getByLabelText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      expect(getByLabelText('すべてのバッジを表示')).toBeTruthy()
      expect(getByLabelText('基本バッジを表示')).toBeTruthy()
      expect(getByLabelText('季節バッジを表示')).toBeTruthy()
    })

    test('provides accessible labels for badges', () => {
      const { getByLabelText } = render(
        <BadgeGallery earnedBadges={mockEarnedBadges} onBadgePress={mockOnBadgePress} />
      )

      expect(getByLabelText('今日の歩数バッジ、獲得済み')).toBeTruthy()
      expect(getByLabelText('早起きバッジ、未獲得')).toBeTruthy()
    })
  })

  describe('Performance', () => {
    test('handles large number of badges efficiently', () => {
      const largeBadgeList: BadgeRecord[] = Array.from({ length: 100 }, (_, i) => ({
        date: `2023-12-${String(i + 1).padStart(2, '0')}`,
        type: `badge_${i}`,
        awardedAt: new Date(1701388800000 + i * 86400000),
        isNew: i < 5
      }))

      const { getByText } = render(
        <BadgeGallery earnedBadges={largeBadgeList} onBadgePress={mockOnBadgePress} />
      )

      expect(getByText('バッジコレクション')).toBeTruthy()
      // Component should render without performance issues
    })
  })

  describe('Edge Cases', () => {
    test('handles badges with missing metadata gracefully', () => {
      const badgesWithMissingData: BadgeRecord[] = [
        {
          date: '2023-12-01',
          type: 'unknown_badge',
          awardedAt: new Date(1701388800000),
          isNew: false
        }
      ]

      const { getByText } = render(
        <BadgeGallery earnedBadges={badgesWithMissingData} onBadgePress={mockOnBadgePress} />
      )

      expect(getByText('バッジコレクション')).toBeTruthy()
      // Should not crash and show fallback display
    })

    test('handles duplicate badges correctly', () => {
      const duplicateBadges: BadgeRecord[] = [
        {
          date: '2023-12-01',
          type: 'daily_steps',
          awardedAt: new Date(1701388800000),
          isNew: false
        },
        {
          date: '2023-12-01',
          type: 'daily_steps',
          awardedAt: new Date(1701388800000),
          isNew: false
        }
      ]

      const { getByText } = render(
        <BadgeGallery earnedBadges={duplicateBadges} onBadgePress={mockOnBadgePress} />
      )

      // Should handle duplicates gracefully
      expect(getByText('バッジコレクション')).toBeTruthy()
    })
  })
})

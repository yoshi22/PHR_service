import React from 'react'
import { render } from '@testing-library/react-native'
import BadgeList from '../BadgeList'
import { BadgeItemProps } from '../BadgeItem'

describe('BadgeList', () => {
  it('renders empty message when no badges', () => {
    const { getByText } = render(<BadgeList badges={[]} />)
    expect(getByText('まだバッジがありません')).toBeTruthy()
  })

  it('renders BadgeItem list when badges exist', () => {
    const badges: BadgeItemProps[] = [
      { date: '2025-05-30', type: '7500_steps' },
      { date: '2025-05-29', type: '3days_streak' },
    ]
    const { getByText, getAllByText } = render(<BadgeList badges={badges} />)
    // BadgeItem renders icon for each badge
    expect(getAllByText('🏅')).toHaveLength(badges.length)
    expect(getByText('2025-05-30 1日7500歩達成')).toBeTruthy()
    expect(getByText('2025-05-29 3日連続7500歩達成')).toBeTruthy()
  })
})

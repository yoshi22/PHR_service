import React from 'react'
import { render } from '@testing-library/react-native'
import BadgeItem from '../BadgeItem'

describe('BadgeItem', () => {
  it('renders correct label for 7500_steps badge', () => {
    const { getByText } = render(<BadgeItem date="2025-05-30" type="7500_steps" />)
    // 日付とラベルが正しく表示される
    expect(getByText('🏅')).toBeTruthy()
    expect(getByText('2025-05-30 1日7500歩達成')).toBeTruthy()
  })

  it('renders correct label for 3days_streak badge', () => {
    const { getByText } = render(<BadgeItem date="2025-05-30" type="3days_streak" />)
    // 部分一致で検索
    expect(getByText(/3日連続7500歩達成/)).toBeTruthy()
  })

  it('renders fallback label for unknown badge type', () => {
    const unknownType = 'custom_badge'
    const { getByText } = render(<BadgeItem date="2025-05-30" type={unknownType} />)
    expect(getByText(`2025-05-30 ${unknownType}`)).toBeTruthy()
  })
})

import { renderHook, act } from '@testing-library/react-hooks'
import { useBadges } from '../useBadges'
import { useAuth } from '../useAuth'
import { getBadges } from '../../services/badgeService'

// useAuth をモックしてテストユーザーを返す
jest.mock('../useAuth', () => ({ useAuth: () => ({ user: { uid: 'user1' } }) }))
// バッジサービスをモック
jest.mock('../../services/badgeService', () => ({ getBadges: jest.fn() }))

describe('useBadges', () => {
  beforeEach(() => {
    (getBadges as jest.Mock).mockResolvedValue([
      { date: '2025-05-30', type: '7500_steps', awardedAt: new Date('2025-05-30T12:00:00Z') },
    ])
  })

  it('fetches badges and updates state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useBadges())
    // 初回ロード中
    expect(result.current.loading).toBe(true)
    await waitForNextUpdate()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.badges).toEqual([
      { date: '2025-05-30', type: '7500_steps', awardedAt: new Date('2025-05-30T12:00:00Z') },
    ])
  })

  it('handles error from getBadges', async () => {
    (getBadges as jest.Mock).mockRejectedValueOnce(new Error('fetch error'))
    const { result, waitForNextUpdate } = renderHook(() => useBadges())
    await waitForNextUpdate()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('fetch error')
  })
})

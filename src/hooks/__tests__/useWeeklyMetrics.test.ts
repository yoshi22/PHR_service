import { renderHook, act } from '@testing-library/react-hooks'
import { useWeeklyMetrics } from '../useWeeklyMetrics'
import { useAuth } from '../useAuth'
import { getDocs } from 'firebase/firestore'

// Mock useAuth to return a test user
jest.mock('../useAuth', () => ({ useAuth: () => ({ user: { uid: 'user1' } }) }))
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}))

const mockedGetDocs = getDocs as jest.Mock

describe('useWeeklyMetrics', () => {
  const mockDocs = [
    { data: () => ({ date: '2025-05-30', steps: 100 }) },
    { data: () => ({ date: '2025-05-28', steps: 200 }) },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetDocs.mockResolvedValue({ docs: mockDocs } as any)
  })

  it('fetches and fills 7 days data sorted ascending', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useWeeklyMetrics())
    expect(result.current.loading).toBe(true)
    // wait for initial fetch to complete
    await act(async () => {
      await waitForNextUpdate()
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.data).toHaveLength(7)
    const dates = result.current.data.map(d => d.date)
    expect(dates[6]).toBe('2025-05-30')
    expect(dates[4]).toBe('2025-05-28')
    const steps = result.current.data.map(d => d.steps)
    expect(steps[6]).toBe(100)
    expect(steps[4]).toBe(200)
    expect(steps.filter(s => s === 0)).toHaveLength(5)
  })

  it('allows manual refetch', async () => {
    // initial load
    const { result, waitForNextUpdate } = renderHook(() => useWeeklyMetrics())
    await act(async () => { await waitForNextUpdate() })
    expect(mockedGetDocs).toHaveBeenCalledTimes(1)
    // update mock to return no docs
    mockedGetDocs.mockResolvedValue({ docs: [] } as any)
    await act(async () => {
      await result.current.refetch()
    })
    expect(mockedGetDocs).toHaveBeenCalledTimes(2)
    expect(result.current.data).toHaveLength(7)
  })
})

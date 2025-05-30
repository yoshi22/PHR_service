import { renderHook, act } from '@testing-library/react-hooks'
import { useTodaySteps } from '../useTodaySteps'
import * as healthService from '../../services/healthService'
import * as firestoreService from '../../services/firestoreService'
import * as badgeService from '../../services/badgeService'
import { auth } from '../../firebase'
import { getDocs } from 'firebase/firestore'
import { Platform } from 'react-native'

// モックの設定
jest.mock('../../services/healthService', () => ({
  initHealthKit: jest.fn(),
  getTodayStepsIOS: jest.fn(),
  initGoogleFit: jest.fn(),
  getTodayStepsAndroid: jest.fn(),
}))
jest.mock('../../services/firestoreService', () => ({ saveTodaySteps: jest.fn() }))
jest.mock('../../services/badgeService', () => ({ saveBadge: jest.fn() }))
// mock Firestore getDocs with required functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}))
// mock auth.currentUser and db
jest.mock('../../firebase', () => ({ auth: { currentUser: { uid: 'user1' } }, db: {} }))

describe('useTodaySteps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure query returns a mock query for getDocs
    ;(require('firebase/firestore').query as jest.Mock).mockReturnValue('MOCK_QUERY')
  })

  it('fetches steps < threshold and saves to Firestore', async () => {
    ;(Platform as any).OS = 'ios'
    ;(healthService.getTodayStepsIOS as jest.Mock).mockResolvedValue(5000)
    ;(getDocs as jest.Mock).mockResolvedValue({ docs: [] })

    const { result, waitForNextUpdate } = renderHook(() => useTodaySteps())
    // initial loading true
    expect(result.current.loading).toBe(true)
    // async fetch
    await waitForNextUpdate()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.steps).toBe(5000)
    expect(firestoreService.saveTodaySteps).toHaveBeenCalledWith('user1', 5000)
    // badgeService は未実行（threshold 未達成）
    expect(badgeService.saveBadge).not.toHaveBeenCalled()
  })

  it('fetches steps >= threshold and awards single-day badge', async () => {
    ;(Platform as any).OS = 'android'
    ;(healthService.getTodayStepsAndroid as jest.Mock).mockResolvedValue(8000)
    // ストリーククエリ用の getDocs は単一配列
    ;(getDocs as jest.Mock).mockResolvedValue({ docs: [ { data: () => ({ steps: 8000 }) } ] })

    const { result, waitForNextUpdate } = renderHook(() => useTodaySteps())
    await waitForNextUpdate()
    expect(result.current.steps).toBe(8000)
    expect(badgeService.saveBadge).toHaveBeenCalledWith('user1', expect.any(String), '7500_steps')
    // 連続3日分はないので 3days_streak は未実行
    expect(badgeService.saveBadge).toHaveBeenCalledTimes(1)
  })

  it('handles errors from healthService', async () => {
    ;(Platform as any).OS = 'ios'
    ;(healthService.getTodayStepsIOS as jest.Mock).mockRejectedValue(new Error('permission error'))

    const { result, waitForNextUpdate } = renderHook(() => useTodaySteps())
    await waitForNextUpdate()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('permission error')
    expect(result.current.steps).toBeNull()
  })
})

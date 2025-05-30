import { renderHook, act } from '@testing-library/react-hooks'
import { usePermissions } from '../usePermissions'
import * as healthService from '../../services/healthService'
import { Platform } from 'react-native'

// モック: healthService モジュール
// React Native Platform モックのセットアップ
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  let OS = 'ios'
  return {
    get OS() {
      return OS
    },
    set OS(value) {
      OS = value
    }
  }
})

jest.mock('../../services/healthService', () => ({
  initHealthKit: jest.fn(),
  initGoogleFit: jest.fn(),
}))

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('success on iOS (initHealthKit resolves)', async () => {
    Platform.OS = 'ios'
    (healthService.initHealthKit as jest.Mock).mockResolvedValue(undefined)

    const { result, waitForNextUpdate } = renderHook(() => usePermissions())
    expect(result.current.granted).toBe(false)
    expect(result.current.loading).toBe(false)

    act(() => {
      result.current.request()
    })
    // loading true
    expect(result.current.loading).toBe(true)
    await waitForNextUpdate()

    expect(result.current.granted).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('failure on iOS (initHealthKit rejects)', async () => {
    ;(Platform as any).OS = 'ios'
    (healthService.initHealthKit as jest.Mock).mockRejectedValue(new Error('HealthKit error'))

    const { result, waitForNextUpdate } = renderHook(() => usePermissions())
    act(() => {
      result.current.request()
    })
    await waitForNextUpdate()

    expect(result.current.granted).toBe(false)
    expect(result.current.error).toBe('HealthKit error')
    expect(result.current.loading).toBe(false)
  })

  it('success on Android (initGoogleFit resolves)', async () => {
    ;(Platform as any).OS = 'android'
    (healthService.initGoogleFit as jest.Mock).mockResolvedValue(undefined)

    const { result, waitForNextUpdate } = renderHook(() => usePermissions())
    act(() => {
      result.current.request()
    })
    await waitForNextUpdate()

    expect(result.current.granted).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('failure on Android (initGoogleFit rejects)', async () => {
    ;(Platform as any).OS = 'android'
    (healthService.initGoogleFit as jest.Mock).mockRejectedValue(new Error('GoogleFit error'))

    const { result, waitForNextUpdate } = renderHook(() => usePermissions())
    act(() => {
      result.current.request()
    })
    await waitForNextUpdate()

    expect(result.current.granted).toBe(false)
    expect(result.current.error).toBe('GoogleFit error')
  })
})

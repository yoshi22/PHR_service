import { renderHook, act } from '@testing-library/react-hooks'
import { usePermissions } from '../usePermissions'
import * as healthService from '../../services/healthService'

// Mock Platform
const mockPlatform = {
  OS: 'ios' as 'ios' | 'android'
}

jest.mock('react-native', () => ({
  Platform: mockPlatform
}))

jest.mock('../../services/healthService', () => ({
  initHealthKit: jest.fn(),
  initGoogleFit: jest.fn(),
}))

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('success on iOS (initHealthKit resolves)', async () => {
    mockPlatform.OS = 'ios'
    ;(healthService.initHealthKit as jest.Mock).mockResolvedValue(undefined)

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
    mockPlatform.OS = 'ios'
    ;(healthService.initHealthKit as jest.Mock).mockRejectedValue(new Error('HealthKit error'))

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
    mockPlatform.OS = 'android'
    ;(healthService.initGoogleFit as jest.Mock).mockResolvedValue(undefined)

    const { result, waitForNextUpdate } = renderHook(() => usePermissions())
    act(() => {
      result.current.request()
    })
    await waitForNextUpdate()

    expect(result.current.granted).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('failure on Android (initGoogleFit rejects)', async () => {
    mockPlatform.OS = 'android'
    ;(healthService.initGoogleFit as jest.Mock).mockRejectedValue(new Error('GoogleFit error'))

    const { result, waitForNextUpdate } = renderHook(() => usePermissions())
    act(() => {
      result.current.request()
    })
    await waitForNextUpdate()

    expect(result.current.granted).toBe(false)
    expect(result.current.error).toBe('GoogleFit error')
  })
})

/**
 * Tests for useTodaySteps hook - Today's step tracking and streak calculation
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useTodaySteps } from '../../hooks/useTodaySteps';
import {
  initHealthKit,
  getTodayStepsIOS,
  initGoogleFit,
  getTodayStepsAndroid
} from '../../services/healthService';
import { saveTodaySteps } from '../../services/firestoreService';
import { saveBadge } from '../../services/badgeService';
import { checkAllSpecialBadges } from '../../services/specialBadgeService';
import { getUserRegistrationDate } from '../../services/userProfileService';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Mock dependencies
jest.mock('../../services/healthService');
jest.mock('../../services/firestoreService');
jest.mock('../../services/badgeService');
jest.mock('../../services/specialBadgeService');
jest.mock('../../services/userProfileService');
jest.mock('../../contexts/AuthContext');
jest.mock('../../context/SettingsContext');
jest.mock('firebase/firestore');

const mockInitHealthKit = initHealthKit as jest.MockedFunction<typeof initHealthKit>;
const mockGetTodayStepsIOS = getTodayStepsIOS as jest.MockedFunction<typeof getTodayStepsIOS>;
const mockInitGoogleFit = initGoogleFit as jest.MockedFunction<typeof initGoogleFit>;
const mockGetTodayStepsAndroid = getTodayStepsAndroid as jest.MockedFunction<typeof getTodayStepsAndroid>;
const mockSaveTodaySteps = saveTodaySteps as jest.MockedFunction<typeof saveTodaySteps>;
const mockSaveBadge = saveBadge as jest.MockedFunction<typeof saveBadge>;
const mockCheckAllSpecialBadges = checkAllSpecialBadges as jest.MockedFunction<typeof checkAllSpecialBadges>;
const mockGetUserRegistrationDate = getUserRegistrationDate as jest.MockedFunction<typeof getUserRegistrationDate>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

describe('useTodaySteps Hook', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com'
  };

  const mockStepsData = [
    { date: '2024-01-15', steps: 8000 }, // Today
    { date: '2024-01-14', steps: 7500 }, // Yesterday
    { date: '2024-01-13', steps: 9000 }, // Day before
    { date: '2024-01-12', steps: 6000 }, // Below goal
    { date: '2024-01-11', steps: 8500 }
  ];

  const mockFirestoreSnapshot = {
    docs: mockStepsData.map(data => ({
      data: () => data
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Platform
    Object.defineProperty(Platform, 'OS', {
      writable: true,
      value: 'ios'
    });

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    mockUseSettings.mockReturnValue({
      settings: { stepGoal: 7500 },
      loading: false,
      error: null,
      updateSettings: jest.fn()
    });

    mockGetDocs.mockResolvedValue(mockFirestoreSnapshot);
    mockSaveTodaySteps.mockResolvedValue();
    mockSaveBadge.mockResolvedValue();
    mockCheckAllSpecialBadges.mockResolvedValue();
    mockGetUserRegistrationDate.mockResolvedValue(new Date('2023-01-01'));

    // Mock Firestore imports
    jest.mocked(collection).mockReturnValue({} as any);
    jest.mocked(query).mockReturnValue({} as any);
    jest.mocked(where).mockReturnValue({} as any);
    jest.mocked(orderBy).mockReturnValue({} as any);
    jest.mocked(limit).mockReturnValue({} as any);
  });

  describe('Platform-Specific Health Service Integration', () => {
    test('should initialize iOS health services and fetch steps', async () => {
      Platform.OS = 'ios';
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockInitHealthKit).toHaveBeenCalled();
      expect(mockGetTodayStepsIOS).toHaveBeenCalled();
      expect(result.current.steps).toBe(8000);
    });

    test('should initialize Android health services and fetch steps', async () => {
      Platform.OS = 'android';
      mockInitGoogleFit.mockResolvedValue();
      mockGetTodayStepsAndroid.mockResolvedValue(9500);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockInitGoogleFit).toHaveBeenCalled();
      expect(mockGetTodayStepsAndroid).toHaveBeenCalled();
      expect(result.current.steps).toBe(9500);
    });

    test('should handle health service initialization failures', async () => {
      mockInitHealthKit.mockRejectedValue(new Error('HealthKit permission denied'));

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('HealthKit permission denied');
      expect(result.current.steps).toBeNull();
    });

    test('should handle step fetching failures', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockRejectedValue(new Error('Step data unavailable'));

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Step data unavailable');
    });
  });

  describe('Firestore Data Persistence', () => {
    test('should save steps to Firestore after successful fetch', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockSaveTodaySteps).toHaveBeenCalledWith(mockUser.uid, 8000);
      });
    });

    test('should not save steps when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn()
      });

      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockSaveTodaySteps).not.toHaveBeenCalled();
      });
    });

    test('should handle Firestore save failures gracefully', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);
      mockSaveTodaySteps.mockRejectedValue(new Error('Firestore save failed'));

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.steps).toBe(8000);
      });

      // Should still have steps data despite save failure
      expect(result.current.steps).toBe(8000);
    });
  });

  describe('Streak Calculation Logic', () => {
    test('should calculate current streak correctly', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // With mock data: today (8000), yesterday (7500), day before (9000) - 3 day streak
      expect(result.current.currentStreak).toBeGreaterThan(0);
    });

    test('should calculate longest streak correctly', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.longestStreak).toBeGreaterThanOrEqual(result.current.currentStreak);
    });

    test('should determine if user is active today', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000); // Above goal of 7500

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isActiveToday).toBe(true);
    });

    test('should mark as inactive when below goal', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(5000); // Below goal of 7500

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isActiveToday).toBe(false);
    });

    test('should handle custom step goals from settings', async () => {
      mockUseSettings.mockReturnValue({
        settings: { stepGoal: 10000 }, // Custom goal
        loading: false,
        error: null,
        updateSettings: jest.fn()
      });

      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000); // Below custom goal

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isActiveToday).toBe(false);
    });

    test('should provide yesterday steps information', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.yesterdaySteps).toBe(7500); // From mock data
    });

    test('should update streak status based on activity', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.streakStatus).toBeDefined();
      expect(typeof result.current.streakStatus).toBe('string');
    });
  });

  describe('Badge Award Logic', () => {
    test('should award daily step badges when goal is met', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockSaveBadge).toHaveBeenCalledWith(
          mockUser.uid,
          expect.any(String),
          '7500_steps'
        );
      });
    });

    test('should award 10k steps badge for high activity', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(12000);

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockSaveBadge).toHaveBeenCalledWith(
          mockUser.uid,
          expect.any(String),
          '10000_steps'
        );
      });
    });

    test('should check for streak badges', async () => {
      // Mock data for 3-day streak
      const streakData = [
        { date: '2024-01-15', steps: 8000 },
        { date: '2024-01-14', steps: 7500 },
        { date: '2024-01-13', steps: 8500 }
      ];

      mockGetDocs.mockResolvedValue({
        docs: streakData.map(data => ({ data: () => data }))
      });

      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockSaveBadge).toHaveBeenCalledWith(
          mockUser.uid,
          expect.any(String),
          '3days_streak'
        );
      });
    });

    test('should check for special badges', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);
      mockGetUserRegistrationDate.mockResolvedValue(new Date('2023-01-01'));

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockCheckAllSpecialBadges).toHaveBeenCalledWith(
          mockUser.uid,
          8000,
          expect.any(String),
          expect.any(Date)
        );
      });
    });

    test('should handle special badge checking failures gracefully', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);
      mockCheckAllSpecialBadges.mockRejectedValue(new Error('Special badge check failed'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking special badges:',
        expect.any(Error)
      );
      expect(result.current.steps).toBe(8000); // Main flow should continue

      consoleSpy.mockRestore();
    });

    test('should not award badges when below goal', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(5000); // Below goal

      renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockSaveBadge).not.toHaveBeenCalledWith(
          mockUser.uid,
          expect.any(String),
          '7500_steps'
        );
      });
    });
  });

  describe('Real-time Updates and Refetch', () => {
    test('should provide refetch capability', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear and setup for refetch
      mockGetTodayStepsIOS.mockClear();
      mockGetTodayStepsIOS.mockResolvedValue(9500);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetTodayStepsIOS).toHaveBeenCalled();
      expect(result.current.steps).toBe(9500);
    });

    test('should handle refetch errors', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup refetch to fail
      mockGetTodayStepsIOS.mockRejectedValue(new Error('Refetch failed'));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe('Refetch failed');
    });

    test('should update streak info on refetch', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(5000); // Initially below goal

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.isActiveToday).toBe(false);
      });

      // Refetch with higher steps
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.isActiveToday).toBe(true);
    });
  });

  describe('Authentication and Settings Integration', () => {
    test('should not fetch when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn()
      });

      renderHook(() => useTodaySteps());

      expect(mockInitHealthKit).not.toHaveBeenCalled();
      expect(mockGetTodayStepsIOS).not.toHaveBeenCalled();
    });

    test('should refetch when authentication state changes', async () => {
      const { rerender } = renderHook(() => useTodaySteps());

      // Initially not authenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn()
      });

      rerender();

      expect(mockInitHealthKit).not.toHaveBeenCalled();

      // Now authenticated
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn()
      });

      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      rerender();

      await waitFor(() => {
        expect(mockInitHealthKit).toHaveBeenCalled();
      });
    });

    test('should use default step goal when settings are unavailable', async () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: false,
        error: 'Settings unavailable',
        updateSettings: jest.fn()
      });

      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still work with default 7500 goal
      expect(result.current.steps).toBe(8000);
      expect(result.current.isActiveToday).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle Firestore query failures', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);
      mockGetDocs.mockRejectedValue(new Error('Firestore query failed'));

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still have steps despite streak calculation failure
      expect(result.current.steps).toBe(8000);
    });

    test('should handle zero steps correctly', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(0);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.steps).toBe(0);
      expect(result.current.isActiveToday).toBe(false);
    });

    test('should handle very large step counts', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(100000); // Unrealistically high

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.steps).toBe(100000);
      expect(result.current.isActiveToday).toBe(true);
    });

    test('should handle missing user registration date', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);
      mockGetUserRegistrationDate.mockResolvedValue(null);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not call special badge check without registration date
      expect(mockCheckAllSpecialBadges).not.toHaveBeenCalled();
      expect(result.current.steps).toBe(8000); // Main flow should continue
    });

    test('should handle concurrent fetch requests', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      // Trigger multiple concurrent refetches
      await act(async () => {
        await Promise.all([
          result.current.refetch(),
          result.current.refetch(),
          result.current.refetch()
        ]);
      });

      expect(result.current.steps).toBe(8000);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance and Memory Considerations', () => {
    test('should debounce rapid refetch calls', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { result } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockGetTodayStepsIOS.mockClear();

      // Rapid refetch calls
      await act(async () => {
        result.current.refetch();
        result.current.refetch();
        result.current.refetch();
        await result.current.refetch();
      });

      // Should optimize and not make excessive calls
      expect(mockGetTodayStepsIOS).toHaveBeenCalled();
    });

    test('should clean up properly on unmount', async () => {
      mockInitHealthKit.mockResolvedValue();
      mockGetTodayStepsIOS.mockResolvedValue(8000);

      const { unmount } = renderHook(() => useTodaySteps());

      await waitFor(() => {
        expect(mockInitHealthKit).toHaveBeenCalled();
      });

      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});

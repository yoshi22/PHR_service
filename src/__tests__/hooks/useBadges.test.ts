/**
 * Tests for useBadges hook - Badge state management and business logic
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBadges } from '../../hooks/useBadges';
import { getBadges, subscribeToBadges, onBadgeAcquired, BadgeRecord } from '../../services/badgeService';
import { getBadgeMetadata } from '../../services/specialBadgeService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

// Mock dependencies
jest.mock('../../services/badgeService');
jest.mock('../../services/specialBadgeService');
jest.mock('../../hooks/useAuth');
jest.mock('../../context/ToastContext');

const mockGetBadges = getBadges as jest.MockedFunction<typeof getBadges>;
const mockSubscribeToBadges = subscribeToBadges as jest.MockedFunction<typeof subscribeToBadges>;
const mockOnBadgeAcquired = onBadgeAcquired as jest.MockedFunction<typeof onBadgeAcquired>;
const mockGetBadgeMetadata = getBadgeMetadata as jest.MockedFunction<typeof getBadgeMetadata>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('useBadges Hook', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    displayName: null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase'
  } as any;

  const mockBadges: BadgeRecord[] = [
    {
      date: '2024-01-15',
      type: '7500_steps',
      awardedAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      date: '2024-01-14',
      type: '10000_steps',
      awardedAt: new Date('2024-01-14T15:45:00Z'),
      isNew: true
    }
  ];

  const mockShowBadgeAcquired = jest.fn();
  let mockUnsubscribe: jest.Mock;
  let mockBadgeListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUnsubscribe = jest.fn();
    mockBadgeListener = jest.fn();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      initializing: false,
      isAuthenticated: true,
      signOut: jest.fn()
    });

    mockUseToast.mockReturnValue({
      showToast: jest.fn(),
      showBadgeAcquired: mockShowBadgeAcquired
    });

    mockGetBadgeMetadata.mockImplementation((type: string) => ({
      type,
      name: type === '7500_steps' ? '1日7500歩達成' : '1日10000歩達成',
      description: 'Test badge description',
      icon: '🏅',
      rarity: 'Common' as const,
      category: 'Regular' as const
    }));

    mockSubscribeToBadges.mockReturnValue(mockUnsubscribe);
    mockOnBadgeAcquired.mockReturnValue(mockBadgeListener);
  });

  describe('Initial Loading and Badge Fetching', () => {
    test('should initialize with loading state', () => {
      mockGetBadges.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { result } = renderHook(() => useBadges());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.badges).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.newBadgeCount).toBe(0);
    });

    test('should fetch badges successfully on mount', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockGetBadges).toHaveBeenCalledWith(mockUser.uid);
      expect(result.current.badges).toEqual(mockBadges);
      expect(result.current.error).toBeNull();
    });

    test('should handle badge fetching errors gracefully', async () => {
      const errorMessage = 'Failed to fetch badges';
      mockGetBadges.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.badges).toEqual([]);
    });

    test('should not fetch badges when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        initializing: false,
        isAuthenticated: false,
        signOut: jest.fn()
      });
      
      renderHook(() => useBadges());
      
      expect(mockGetBadges).not.toHaveBeenCalled();
      expect(mockSubscribeToBadges).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Badge Subscription', () => {
    test('should subscribe to badge updates on mount', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(mockSubscribeToBadges).toHaveBeenCalledWith(
          mockUser.uid,
          expect.any(Function)
        );
      });
    });

    test('should update badges when subscription receives new data', async () => {
      mockGetBadges.mockResolvedValue([]);
      let subscriptionCallback: (badges: BadgeRecord[]) => void;
      
      mockSubscribeToBadges.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
        return mockUnsubscribe;
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Simulate new badges from subscription
      const newBadges = [
        ...mockBadges,
        {
          date: '2024-01-16',
          type: 'weekend_warrior',
          awardedAt: new Date('2024-01-16T12:00:00Z'),
          isNew: true
        }
      ];
      
      act(() => {
        subscriptionCallback!(newBadges);
      });
      
      expect(result.current.badges).toEqual(newBadges);
      expect(result.current.loading).toBe(false);
    });

    test('should handle subscription errors without breaking the hook', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      mockSubscribeToBadges.mockImplementation(() => {
        throw new Error('Subscription failed');
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should still have initial badges despite subscription error
      expect(result.current.badges).toEqual(mockBadges);
    });
  });

  describe('Badge Acquisition Event Handling', () => {
    test('should subscribe to badge acquisition events', async () => {
      mockGetBadges.mockResolvedValue([]);
      
      renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(mockOnBadgeAcquired).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    test('should handle new badge acquisition with toast notification', async () => {
      mockGetBadges.mockResolvedValue([]);
      let badgeAcquisitionCallback: (badge: BadgeRecord) => void;
      
      mockOnBadgeAcquired.mockImplementation((callback) => {
        badgeAcquisitionCallback = callback;
        return mockBadgeListener;
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Simulate new badge acquisition
      const newBadge: BadgeRecord = {
        date: '2024-01-16',
        type: 'early_bird',
        awardedAt: new Date(),
        isNew: true
      };
      
      act(() => {
        badgeAcquisitionCallback!(newBadge);
      });
      
      expect(mockShowBadgeAcquired).toHaveBeenCalledWith('早起きの鳥');
      expect(result.current.newBadgeCount).toBe(1);
    });

    test('should not show toast for badges that are not new', async () => {
      mockGetBadges.mockResolvedValue([]);
      let badgeAcquisitionCallback: (badge: BadgeRecord) => void;
      
      mockOnBadgeAcquired.mockImplementation((callback) => {
        badgeAcquisitionCallback = callback;
        return mockBadgeListener;
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(mockOnBadgeAcquired).toHaveBeenCalled();
      });
      
      // Simulate existing badge (not new)
      const existingBadge: BadgeRecord = {
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: new Date(),
        isNew: false
      };
      
      act(() => {
        badgeAcquisitionCallback!(existingBadge);
      });
      
      expect(mockShowBadgeAcquired).not.toHaveBeenCalled();
      expect(result.current.newBadgeCount).toBe(0);
    });

    test('should increment new badge count for each new badge', async () => {
      mockGetBadges.mockResolvedValue([]);
      let badgeAcquisitionCallback: (badge: BadgeRecord) => void;
      
      mockOnBadgeAcquired.mockImplementation((callback) => {
        badgeAcquisitionCallback = callback;
        return mockBadgeListener;
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.newBadgeCount).toBe(0);
      });
      
      // Add multiple new badges
      const newBadges = [
        { date: '2024-01-16', type: 'early_bird', awardedAt: new Date(), isNew: true },
        { date: '2024-01-17', type: 'weekend_warrior', awardedAt: new Date(), isNew: true }
      ];
      
      newBadges.forEach(badge => {
        act(() => {
          badgeAcquisitionCallback!(badge);
        });
      });
      
      expect(result.current.newBadgeCount).toBe(2);
    });
  });

  describe('Badge Label Resolution', () => {
    test('should resolve badge labels from metadata', async () => {
      mockGetBadgeMetadata
        .mockReturnValueOnce({
          type: '7500_steps',
          name: '1日7500歩達成',
          description: 'Test',
          icon: '🏅',
          rarity: 'Common',
          category: 'Regular'
        })
        .mockReturnValueOnce(null); // No metadata found
      
      mockGetBadges.mockResolvedValue([]);
      let badgeAcquisitionCallback: (badge: BadgeRecord) => void;
      
      mockOnBadgeAcquired.mockImplementation((callback) => {
        badgeAcquisitionCallback = callback;
        return mockBadgeListener;
      });
      
      renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(mockOnBadgeAcquired).toHaveBeenCalled();
      });
      
      // Test with metadata available
      act(() => {
        badgeAcquisitionCallback!({
          date: '2024-01-16',
          type: '7500_steps',
          awardedAt: new Date(),
          isNew: true
        });
      });
      
      expect(mockShowBadgeAcquired).toHaveBeenCalledWith('1日7500歩達成');
      
      // Test with no metadata (fallback to type)
      act(() => {
        badgeAcquisitionCallback!({
          date: '2024-01-17',
          type: 'unknown_badge',
          awardedAt: new Date(),
          isNew: true
        });
      });
      
      expect(mockShowBadgeAcquired).toHaveBeenCalledWith('unknown_badge');
    });
  });

  describe('Manual Refetch Functionality', () => {
    test('should provide manual refetch capability', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Clear the mock to test refetch
      mockGetBadges.mockClear();
      mockGetBadges.mockResolvedValue([...mockBadges, {
        date: '2024-01-16',
        type: 'new_badge',
        awardedAt: new Date()
      }]);
      
      await act(async () => {
        await result.current.refetch();
      });
      
      expect(mockGetBadges).toHaveBeenCalledTimes(1);
      expect(mockGetBadges).toHaveBeenCalledWith(mockUser.uid);
    });

    test('should handle refetch errors', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Setup refetch to fail
      mockGetBadges.mockRejectedValue(new Error('Refetch failed'));
      
      await act(async () => {
        await result.current.refetch();
      });
      
      expect(result.current.error).toBe('Refetch failed');
    });
  });

  describe('Cleanup and Unsubscription', () => {
    test('should unsubscribe from all listeners on unmount', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      const { unmount } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(mockSubscribeToBadges).toHaveBeenCalled();
        expect(mockOnBadgeAcquired).toHaveBeenCalled();
      });
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockBadgeListener).toHaveBeenCalled();
    });

    test('should handle cleanup when subscriptions were not established', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        initializing: false,
        isAuthenticated: false,
        signOut: jest.fn()
      });
      
      const { unmount } = renderHook(() => useBadges());
      
      // Should not throw error during cleanup
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('User Authentication Changes', () => {
    test('should refetch badges when user changes', async () => {
      const { rerender } = renderHook(() => useBadges());
      
      mockGetBadges.mockClear();
      
      // Change user
      const newUser = { 
        uid: 'new-user-456', 
        email: 'new@example.com',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: jest.fn(),
        getIdToken: jest.fn(),
        getIdTokenResult: jest.fn(),
        reload: jest.fn(),
        toJSON: jest.fn(),
        displayName: null,
        phoneNumber: null,
        photoURL: null,
        providerId: 'firebase'
      } as any;
      mockUseAuth.mockReturnValue({
        user: newUser,
        initializing: false,
        isAuthenticated: true,
        signOut: jest.fn()
      });
      
      rerender({});
      
      await waitFor(() => {
        expect(mockGetBadges).toHaveBeenCalledWith(newUser.uid);
      });
    });

    test('should clear badges when user logs out', async () => {
      mockGetBadges.mockResolvedValue(mockBadges);
      
      const { result, rerender } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.badges).toEqual(mockBadges);
      });
      
      // Simulate logout
      mockUseAuth.mockReturnValue({
        user: null,
        initializing: false,
        isAuthenticated: false,
        signOut: jest.fn()
      });
      
      rerender({});
      
      // Should stop fetching and clear state
      expect(result.current.badges).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty badge metadata gracefully', async () => {
      mockGetBadgeMetadata.mockReturnValue(null);
      mockGetBadges.mockResolvedValue([]);
      let badgeAcquisitionCallback: (badge: BadgeRecord) => void;
      
      mockOnBadgeAcquired.mockImplementation((callback) => {
        badgeAcquisitionCallback = callback;
        return mockBadgeListener;
      });
      
      renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(mockOnBadgeAcquired).toHaveBeenCalled();
      });
      
      act(() => {
        badgeAcquisitionCallback!({
          date: '2024-01-16',
          type: 'unknown_badge',
          awardedAt: new Date(),
          isNew: true
        });
      });
      
      // Should fall back to badge type as label
      expect(mockShowBadgeAcquired).toHaveBeenCalledWith('unknown_badge');
    });

    test('should handle concurrent badge updates correctly', async () => {
      mockGetBadges.mockResolvedValue([]);
      let subscriptionCallback: (badges: BadgeRecord[]) => void;
      
      mockSubscribeToBadges.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
        return mockUnsubscribe;
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Simulate multiple rapid updates
      const updates = [
        [{ date: '2024-01-15', type: 'badge1', awardedAt: new Date() }],
        [
          { date: '2024-01-15', type: 'badge1', awardedAt: new Date() },
          { date: '2024-01-16', type: 'badge2', awardedAt: new Date() }
        ],
        [
          { date: '2024-01-15', type: 'badge1', awardedAt: new Date() },
          { date: '2024-01-16', type: 'badge2', awardedAt: new Date() },
          { date: '2024-01-17', type: 'badge3', awardedAt: new Date() }
        ]
      ];
      
      updates.forEach(badges => {
        act(() => {
          subscriptionCallback!(badges);
        });
      });
      
      // Should have the latest state
      expect(result.current.badges).toHaveLength(3);
    });

    test('should handle malformed badge data gracefully', async () => {
      const malformedBadges = [
        { date: '2024-01-15', type: '7500_steps', awardedAt: new Date() },
        { date: null, type: '', awardedAt: null }, // Malformed
        { date: '2024-01-16', type: '10000_steps', awardedAt: new Date() }
      ] as any;
      
      mockGetBadges.mockResolvedValue(malformedBadges);
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should include all badges, even malformed ones
      expect(result.current.badges).toEqual(malformedBadges);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance and Memory Considerations', () => {
    test('should not cause memory leaks with multiple badge updates', async () => {
      mockGetBadges.mockResolvedValue([]);
      let subscriptionCallback: (badges: BadgeRecord[]) => void;
      
      mockSubscribeToBadges.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
        return mockUnsubscribe;
      });
      
      const { result } = renderHook(() => useBadges());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Simulate many updates to test memory usage
      for (let i = 0; i < 100; i++) {
        act(() => {
          subscriptionCallback!([{
            date: `2024-01-${String(i + 1).padStart(2, '0')}`,
            type: `badge_${i}`,
            awardedAt: new Date()
          }]);
        });
      }
      
      expect(result.current.badges).toHaveLength(1);
      expect(result.current.badges[0].type).toBe('badge_99');
    });
  });
});

import {
  saveBadge,
  getBadges,
  subscribeToBadges,
  onBadgeAcquired,
  BadgeRecord
} from '../../services/badgeService';

// Mock Firebase and utils
jest.mock('../../firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _seconds: 1640995200, _nanoseconds: 0 })),
  onSnapshot: jest.fn()
}));

jest.mock('../../utils/authUtils', () => ({
  requireAuth: jest.fn()
}));

jest.mock('../../utils/firebaseUtils', () => ({
  getFirestore: jest.fn()
}));

// Import mocked modules
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { requireAuth } from '../../utils/authUtils';
import { getFirestore as getFirestoreUtil } from '../../utils/firebaseUtils';

describe('BadgeService API Client', () => {
  const mockFirestore = {};
  const mockUser = { uid: 'test-user-123' };
  const testUserId = 'test-user-123';
  const testDate = '2024-01-15';
  const testBadgeType = '7500_steps';

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockReturnValue(mockUser);
    (getFirestoreUtil as jest.Mock).mockReturnValue(mockFirestore);
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('saveBadge', () => {
    const mockDocRef = { id: 'test-doc-ref' };
    const mockQuerySnapshot = { empty: true };

    beforeEach(() => {
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
    });

    test('should save a new badge successfully', async () => {
      await saveBadge(testUserId, testDate, testBadgeType);

      // Should check authentication
      expect(requireAuth).toHaveBeenCalled();

      // Should get Firestore instance
      expect(getFirestoreUtil).toHaveBeenCalled();

      // Should create document reference with correct ID format
      expect(doc).toHaveBeenCalledWith(
        mockFirestore,
        'userBadges',
        `${testUserId}_${testDate}_${testBadgeType}`
      );

      // Should check if badge already exists
      expect(getDocs).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'userBadges');

      // Should save the badge with correct data
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          userId: testUserId,
          date: testDate,
          type: testBadgeType,
          awardedAt: expect.any(Object) // serverTimestamp
        },
        { merge: true }
      );
    });

    test('should enforce user authentication', async () => {
      const unauthorizedUserId = 'other-user-456';
      
      await expect(saveBadge(unauthorizedUserId, testDate, testBadgeType))
        .rejects.toThrow('Unauthorized access to badge data');

      expect(setDoc).not.toHaveBeenCalled();
    });

    test('should handle authentication errors', async () => {
      (requireAuth as jest.Mock).mockImplementation(() => {
        throw new Error('User must be authenticated');
      });

      await expect(saveBadge(testUserId, testDate, testBadgeType))
        .rejects.toThrow('User must be authenticated');

      expect(setDoc).not.toHaveBeenCalled();
    });

    test('should handle Firestore errors', async () => {
      const firestoreError = new Error('Firestore permission denied');
      (setDoc as jest.Mock).mockRejectedValue(firestoreError);

      await expect(saveBadge(testUserId, testDate, testBadgeType))
        .rejects.toThrow('Firestore permission denied');
    });

    test('should not notify for existing badges', async () => {
      // Mock existing badge
      (getDocs as jest.Mock).mockResolvedValue({ empty: false });

      const mockListener = jest.fn();
      onBadgeAcquired(mockListener);

      await saveBadge(testUserId, testDate, testBadgeType);

      // Should not call listener for existing badge
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('getBadges', () => {
    const mockQuerySnapshot = {
      docs: [
        {
          data: () => ({
            date: '2024-01-15',
            type: '7500_steps',
            awardedAt: {
              toDate: () => new Date('2024-01-15T10:30:00Z')
            }
          })
        },
        {
          data: () => ({
            date: '2024-01-14',
            type: '10000_steps',
            awardedAt: {
              toDate: () => new Date('2024-01-14T15:45:00Z')
            }
          })
        }
      ]
    };

    beforeEach(() => {
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
    });

    test('should fetch badges with correct query parameters', async () => {
      // Mock return values for query chain
      const mockCollection = { collection: 'userBadges' };
      const mockWhere = { where: 'userId == test-user-123' };
      const mockOrderBy = { orderBy: 'awardedAt desc' };
      const mockQuery = { query: 'complete' };

      (collection as jest.Mock).mockReturnValue(mockCollection);
      (where as jest.Mock).mockReturnValue(mockWhere);
      (orderBy as jest.Mock).mockReturnValue(mockOrderBy);
      (query as jest.Mock).mockReturnValue(mockQuery);

      const result = await getBadges(testUserId);

      // Should build correct query
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'userBadges');
      expect(where).toHaveBeenCalledWith('userId', '==', testUserId);
      expect(orderBy).toHaveBeenCalledWith('awardedAt', 'desc');
      expect(query).toHaveBeenCalledWith(
        mockCollection,
        mockWhere,
        mockOrderBy
      );
    });

    test('should return properly formatted badge records', async () => {
      const result = await getBadges(testUserId);

      expect(result).toHaveLength(2);
      
      expect(result[0]).toEqual({
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: new Date('2024-01-15T10:30:00Z')
      });

      expect(result[1]).toEqual({
        date: '2024-01-14',
        type: '10000_steps',
        awardedAt: new Date('2024-01-14T15:45:00Z')
      });
    });

    test('should handle timestamp conversion errors', async () => {
      const mockQueryWithBadTimestamp = {
        docs: [
          {
            data: () => ({
              date: '2024-01-15',
              type: '7500_steps',
              awardedAt: null // Invalid timestamp
            })
          }
        ]
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQueryWithBadTimestamp);

      const result = await getBadges(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].awardedAt).toBeInstanceOf(Date);
      expect(result[0].date).toBe('2024-01-15');
    });

    test('should handle empty results', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const result = await getBadges(testUserId);

      expect(result).toEqual([]);
    });

    test('should handle Firestore query errors', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(getBadges(testUserId))
        .rejects.toThrow('Network error');
    });
  });

  describe('subscribeToBadges', () => {
    const mockUnsubscribe = jest.fn();
    const mockOnUpdate = jest.fn();
    let storedCallback: any;

    beforeEach(() => {
      (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
        // Store callback for later use
        storedCallback = callback;
        return mockUnsubscribe;
      });
    });

    test('should set up real-time subscription with correct query', () => {
      // Mock return values for query chain
      const mockCollection = { collection: 'userBadges' };
      const mockWhere = { where: 'userId == test-user-123' };
      const mockOrderBy = { orderBy: 'awardedAt desc' };
      const mockQuery = { query: 'complete' };

      (collection as jest.Mock).mockReturnValue(mockCollection);
      (where as jest.Mock).mockReturnValue(mockWhere);
      (orderBy as jest.Mock).mockReturnValue(mockOrderBy);
      (query as jest.Mock).mockReturnValue(mockQuery);

      const unsubscribe = subscribeToBadges(testUserId, mockOnUpdate);

      expect(collection).toHaveBeenCalledWith(mockFirestore, 'userBadges');
      expect(where).toHaveBeenCalledWith('userId', '==', testUserId);
      expect(orderBy).toHaveBeenCalledWith('awardedAt', 'desc');
      expect(query).toHaveBeenCalledWith(
        mockCollection,
        mockWhere,
        mockOrderBy
      );

      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    test('should process snapshot updates correctly', () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'badge1',
            data: () => ({
              date: '2024-01-15',
              type: '7500_steps',
              awardedAt: {
                toDate: () => new Date('2024-01-15T10:30:00Z')
              }
            })
          }
        ],
        docChanges: () => [
          {
            type: 'added',
            doc: { id: 'badge1' }
          }
        ]
      };

      subscribeToBadges(testUserId, mockOnUpdate);
      
      // Simulate snapshot callback
      if (storedCallback) {
        storedCallback(mockSnapshot);
      }

      expect(mockOnUpdate).toHaveBeenCalledWith([
        {
          date: '2024-01-15',
          type: '7500_steps',
          awardedAt: new Date('2024-01-15T10:30:00Z'),
          isNew: true
        }
      ]);
    });

    test('should mark badges as new based on document changes', () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'badge1',
            data: () => ({
              date: '2024-01-15',
              type: '7500_steps',
              awardedAt: { toDate: () => new Date() }
            })
          },
          {
            id: 'badge2',
            data: () => ({
              date: '2024-01-14',
              type: '10000_steps',
              awardedAt: { toDate: () => new Date() }
            })
          }
        ],
        docChanges: () => [
          { type: 'added', doc: { id: 'badge1' } }
          // badge2 is not in docChanges, so it's not new
        ]
      };

      subscribeToBadges(testUserId, mockOnUpdate);
      
      if (storedCallback) {
        storedCallback(mockSnapshot);
      }

      const calledWith = mockOnUpdate.mock.calls[0][0];
      expect(calledWith[0].isNew).toBe(true);  // badge1 is new
      expect(calledWith[1].isNew).toBe(false); // badge2 is not new
    });

    test('should handle timestamp conversion errors in real-time updates', () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'badge1',
            data: () => ({
              date: '2024-01-15',
              type: '7500_steps',
              awardedAt: {
                toDate: () => {
                  throw new Error('Invalid timestamp');
                }
              }
            })
          }
        ],
        docChanges: () => []
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      subscribeToBadges(testUserId, mockOnUpdate);
      
      if (storedCallback) {
        storedCallback(mockSnapshot);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error converting awardedAt timestamp:',
        expect.any(Error)
      );

      const calledWith = mockOnUpdate.mock.calls[0][0];
      expect(calledWith[0].awardedAt).toBeInstanceOf(Date);

      consoleSpy.mockRestore();
    });
  });

  describe('Badge Event System', () => {
    test('should register and notify badge acquisition listeners', () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();

      const unsubscribe1 = onBadgeAcquired(mockListener1);
      const unsubscribe2 = onBadgeAcquired(mockListener2);

      // Mock a new badge being saved
      (getDocs as jest.Mock).mockResolvedValue({ empty: true }); // New badge

      return saveBadge(testUserId, testDate, testBadgeType).then(() => {
        expect(mockListener1).toHaveBeenCalledWith({
          date: testDate,
          type: testBadgeType,
          awardedAt: expect.any(Date),
          isNew: true
        });

        expect(mockListener2).toHaveBeenCalledWith({
          date: testDate,
          type: testBadgeType,
          awardedAt: expect.any(Date),
          isNew: true
        });

        // Test unsubscribe
        unsubscribe1();
        unsubscribe2();
      });
    });

    test('should properly unsubscribe listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = onBadgeAcquired(mockListener);

      unsubscribe();

      // Mock a new badge being saved after unsubscribe
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      return saveBadge(testUserId, testDate, testBadgeType).then(() => {
        expect(mockListener).not.toHaveBeenCalled();
      });
    });

    test('should handle multiple listeners and selective unsubscribing', () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      const mockListener3 = jest.fn();

      const unsubscribe1 = onBadgeAcquired(mockListener1);
      const unsubscribe2 = onBadgeAcquired(mockListener2);
      const unsubscribe3 = onBadgeAcquired(mockListener3);

      // Unsubscribe middle listener
      unsubscribe2();

      // Mock a new badge
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      return saveBadge(testUserId, testDate, testBadgeType).then(() => {
        expect(mockListener1).toHaveBeenCalled();
        expect(mockListener2).not.toHaveBeenCalled(); // Unsubscribed
        expect(mockListener3).toHaveBeenCalled();

        // Clean up
        unsubscribe1();
        unsubscribe3();
      });
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('should handle various badge types and dates', async () => {
      const testCases = [
        { userId: testUserId, date: '2024-12-31', type: 'weekend_warrior' },
        { userId: testUserId, date: '2024-02-29', type: 'leap_day_special' }, // Leap year
        { userId: testUserId, date: '2024-01-01', type: 'new_year_badge' }
      ];

      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      for (const testCase of testCases) {
        await saveBadge(testCase.userId, testCase.date, testCase.type);

        expect(doc).toHaveBeenCalledWith(
          mockFirestore,
          'userBadges',
          `${testCase.userId}_${testCase.date}_${testCase.type}`
        );
      }
    });

    test('should maintain badge record interface consistency', async () => {
      const mockBadgeData = {
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: {
          toDate: () => new Date('2024-01-15T10:30:00Z')
        }
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ data: () => mockBadgeData }]
      });

      const result = await getBadges(testUserId);
      const badge = result[0];

      // Ensure all required fields are present and correctly typed
      expect(typeof badge.date).toBe('string');
      expect(typeof badge.type).toBe('string');
      expect(badge.awardedAt).toBeInstanceOf(Date);
      expect(badge.isNew).toBeUndefined(); // Optional field, should be undefined in getBadges
    });

    test('should handle concurrent badge operations', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      // Simulate multiple concurrent badge saves
      const promises = [
        saveBadge(testUserId, '2024-01-15', '7500_steps'),
        saveBadge(testUserId, '2024-01-15', '10000_steps'),
        saveBadge(testUserId, '2024-01-16', '7500_steps')
      ];

      await Promise.all(promises);

      // Each should have created a unique document ID
      expect(setDoc).toHaveBeenCalledTimes(3);
      expect(doc).toHaveBeenCalledWith(
        mockFirestore,
        'userBadges',
        `${testUserId}_2024-01-15_7500_steps`
      );
      expect(doc).toHaveBeenCalledWith(
        mockFirestore,
        'userBadges',
        `${testUserId}_2024-01-15_10000_steps`
      );
      expect(doc).toHaveBeenCalledWith(
        mockFirestore,
        'userBadges',
        `${testUserId}_2024-01-16_7500_steps`
      );
    });
  });

  describe('Security and Error Handling', () => {
    test('should validate user ID format', async () => {
      const invalidUserIds = ['', ' ', null, undefined];

      for (const invalidUserId of invalidUserIds) {
        await expect(saveBadge(invalidUserId as any, testDate, testBadgeType))
          .rejects.toThrow();
      }
    });

    test('should handle network failures gracefully', async () => {
      const networkError = new Error('Network request failed');
      (getDocs as jest.Mock).mockRejectedValue(networkError);

      await expect(getBadges(testUserId))
        .rejects.toThrow('Network request failed');
    });

    test('should handle Firestore permission errors', async () => {
      // Reset mock from previous test
      (getDocs as jest.Mock).mockReset();
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });
      
      const permissionError = new Error('Permission denied');
      (setDoc as jest.Mock).mockRejectedValue(permissionError);

      await expect(saveBadge(testUserId, testDate, testBadgeType))
        .rejects.toThrow('Permission denied');
    });

    test('should handle malformed Firestore responses', async () => {
      const malformedResponse = {
        docs: [
          {
            data: () => ({
              // Missing required fields
              type: '7500_steps'
              // date and awardedAt are missing
            })
          }
        ]
      };

      (getDocs as jest.Mock).mockResolvedValue(malformedResponse);

      const result = await getBadges(testUserId);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('7500_steps');
      expect(result[0].date).toBeUndefined(); // Gracefully handle missing data
      expect(result[0].awardedAt).toBeInstanceOf(Date); // Should fallback to new Date()
    });
  });
});

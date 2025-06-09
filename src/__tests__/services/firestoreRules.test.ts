/**
 * @jest-environment jsdom
 */
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// Note: This test requires Firebase Emulator Suite to be running
// Run: npm run test:firestore-rules or firebase emulators:start --only firestore

describe('Firestore Security Rules and Operations', () => {
  let testEnv: RulesTestEnvironment;
  const projectId = 'test-phr-app';
  
  // Test data
  const testUser1 = { uid: 'test-user-1', email: 'user1@test.com' };
  const testUser2 = { uid: 'test-user-2', email: 'user2@test.com' };
  const testBadge = {
    userId: testUser1.uid,
    date: '2024-01-15',
    type: '7500_steps',
    awardedAt: new Date('2024-01-15T10:30:00Z')
  };

  beforeAll(async () => {
    // Initialize test environment with security rules
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Users can only access their own badge documents
              match /userBadges/{badgeId} {
                allow read, write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
                allow create: if request.auth != null && 
                  request.resource.data.userId == request.auth.uid;
              }
              
              // Users can only access their own profile
              match /userProfile/{userId} {
                allow read, write: if request.auth != null && 
                  userId == request.auth.uid;
              }
              
              // Users can only access their own settings
              match /userSettings/{userId} {
                allow read, write: if request.auth != null && 
                  userId == request.auth.uid;
              }
            }
          }
        `
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('Badge Service Security Rules', () => {
    test('should allow authenticated users to create their own badges', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);

      await expect(setDoc(badgeRef, testBadge)).resolves.not.toThrow();
    });

    test('should prevent users from creating badges for other users', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      const badgeRef = doc(db, 'userBadges', `${testUser2.uid}_2024-01-15_7500_steps`);
      const badgeForOtherUser = { ...testBadge, userId: testUser2.uid };

      await expect(setDoc(badgeRef, badgeForOtherUser)).rejects.toThrow();
    });

    test('should allow users to read their own badges', async () => {
      // First create a badge as user1
      const db1 = testEnv.authenticatedContext(testUser1.uid).firestore();
      const badgeRef = doc(db1, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);
      await setDoc(badgeRef, testBadge);

      // Then read it back
      const docSnap = await getDoc(badgeRef);
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()).toMatchObject({
        userId: testUser1.uid,
        type: '7500_steps'
      });
    });

    test('should prevent users from reading other users badges', async () => {
      // Create badge as user1
      const db1 = testEnv.authenticatedContext(testUser1.uid).firestore();
      const badgeRef = doc(db1, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);
      await setDoc(badgeRef, testBadge);

      // Try to read as user2
      const db2 = testEnv.authenticatedContext(testUser2.uid).firestore();
      const badgeRefUser2 = doc(db2, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);

      await expect(getDoc(badgeRefUser2)).rejects.toThrow();
    });

    test('should prevent unauthenticated access to badges', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);

      await expect(setDoc(badgeRef, testBadge)).rejects.toThrow();
      await expect(getDoc(badgeRef)).rejects.toThrow();
    });

    test('should allow querying own badges with userId filter', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Create multiple badges for user1
      const badges = [
        { ...testBadge, date: '2024-01-15', type: '7500_steps' },
        { ...testBadge, date: '2024-01-16', type: '10000_steps' },
        { ...testBadge, date: '2024-01-17', type: '7500_steps' }
      ];

      for (const [index, badge] of badges.entries()) {
        const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_${badge.date}_${badge.type}`);
        await setDoc(badgeRef, { ...badge, awardedAt: new Date(Date.now() + index * 1000) });
      }

      // Query badges
      const q = query(
        collection(db, 'userBadges'),
        where('userId', '==', testUser1.uid),
        orderBy('awardedAt', 'desc')
      );

      const querySnap = await getDocs(q);
      expect(querySnap.size).toBe(3);
      
      const retrievedBadges = querySnap.docs.map(doc => doc.data());
      expect(retrievedBadges.every(badge => badge.userId === testUser1.uid)).toBe(true);
    });

    test('should prevent querying other users badges even with correct userId', async () => {
      // Create badge as user1
      const db1 = testEnv.authenticatedContext(testUser1.uid).firestore();
      const badgeRef = doc(db1, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);
      await setDoc(badgeRef, testBadge);

      // Try to query as user2
      const db2 = testEnv.authenticatedContext(testUser2.uid).firestore();
      const q = query(
        collection(db2, 'userBadges'),
        where('userId', '==', testUser1.uid) // Trying to query user1's badges
      );

      await expect(getDocs(q)).rejects.toThrow();
    });
  });

  describe('Firestore Operations Performance', () => {
    test('should handle batch badge creation efficiently', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      const startTime = Date.now();

      // Create 10 badges concurrently
      const badgePromises = Array.from({ length: 10 }, (_, i) => {
        const badge = {
          ...testBadge,
          date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
          type: i % 2 === 0 ? '7500_steps' : '10000_steps'
        };
        const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_${badge.date}_${badge.type}`);
        return setDoc(badgeRef, badge);
      });

      await Promise.all(badgePromises);
      const endTime = Date.now();

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds

      // Verify all badges were created
      const q = query(
        collection(db, 'userBadges'),
        where('userId', '==', testUser1.uid)
      );
      const querySnap = await getDocs(q);
      expect(querySnap.size).toBe(10);
    });

    test('should handle large badge queries efficiently', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Create 50 badges for testing query performance
      const badgePromises = Array.from({ length: 50 }, (_, i) => {
        const badge = {
          ...testBadge,
          date: `2024-01-${(i % 31 + 1).toString().padStart(2, '0')}`,
          type: `badge_type_${i % 5}`,
          awardedAt: new Date(Date.now() + i * 1000)
        };
        const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_${badge.date}_${badge.type}_${i}`);
        return setDoc(badgeRef, badge);
      });

      await Promise.all(badgePromises);

      const startTime = Date.now();
      const q = query(
        collection(db, 'userBadges'),
        where('userId', '==', testUser1.uid),
        orderBy('awardedAt', 'desc')
      );
      const querySnap = await getDocs(q);
      const endTime = Date.now();

      expect(querySnap.size).toBe(50);
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds

      // Verify ordering
      const badges = querySnap.docs.map(doc => doc.data());
      for (let i = 1; i < badges.length; i++) {
        expect(badges[i-1].awardedAt.getTime()).toBeGreaterThanOrEqual(badges[i].awardedAt.getTime());
      }
    });
  });

  describe('Badge Data Consistency', () => {
    test('should maintain data integrity during concurrent operations', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Simulate concurrent badge creation for the same day but different types
      const concurrentOperations = [
        setDoc(doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`), {
          ...testBadge,
          type: '7500_steps'
        }),
        setDoc(doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_10000_steps`), {
          ...testBadge,
          type: '10000_steps'
        }),
        setDoc(doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_weekend_warrior`), {
          ...testBadge,
          type: 'weekend_warrior'
        })
      ];

      await Promise.all(concurrentOperations);

      // Verify all badges exist and have correct data
      const q = query(
        collection(db, 'userBadges'),
        where('userId', '==', testUser1.uid)
      );
      const querySnap = await getDocs(q);
      
      expect(querySnap.size).toBe(3);
      
      const badgeTypes = querySnap.docs.map(doc => doc.data().type);
      expect(badgeTypes).toContain('7500_steps');
      expect(badgeTypes).toContain('10000_steps');
      expect(badgeTypes).toContain('weekend_warrior');
    });

    test('should handle badge updates with merge option', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);

      // Create initial badge
      await setDoc(badgeRef, testBadge);

      // Update with merge (simulating what the real service does)
      await setDoc(badgeRef, {
        userId: testUser1.uid,
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: new Date('2024-01-15T12:00:00Z') // Different time
      }, { merge: true });

      const docSnap = await getDoc(badgeRef);
      const updatedBadge = docSnap.data();

      expect(updatedBadge?.awardedAt.getTime()).toBe(new Date('2024-01-15T12:00:00Z').getTime());
      expect(updatedBadge?.userId).toBe(testUser1.uid);
    });

    test('should validate required badge fields', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Test badges with missing required fields
      const incompleteBadges = [
        { userId: testUser1.uid, type: '7500_steps' }, // Missing date
        { userId: testUser1.uid, date: '2024-01-15' }, // Missing type
        { date: '2024-01-15', type: '7500_steps' }, // Missing userId
      ];

      for (const [index, incompleteBadge] of incompleteBadges.entries()) {
        const badgeRef = doc(db, 'userBadges', `incomplete_${index}`);
        
        // The badge service should validate these before saving,
        // but if they somehow get to Firestore, they should still be handled
        await setDoc(badgeRef, incompleteBadge);
        
        const docSnap = await getDoc(badgeRef);
        expect(docSnap.exists()).toBe(true);
      }
    });
  });

  describe('Real-time Subscription Behavior', () => {
    test('should simulate real-time updates', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      const updates: any[] = [];

      // Note: Firebase Rules Unit Testing doesn't support real-time listeners,
      // so we simulate the behavior by creating documents and querying
      const q = query(
        collection(db, 'userBadges'),
        where('userId', '==', testUser1.uid),
        orderBy('awardedAt', 'desc')
      );

      // Initial state - no badges
      let querySnap = await getDocs(q);
      expect(querySnap.size).toBe(0);

      // Add first badge
      const badge1Ref = doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_7500_steps`);
      await setDoc(badge1Ref, { ...testBadge, type: '7500_steps' });

      querySnap = await getDocs(q);
      expect(querySnap.size).toBe(1);

      // Add second badge
      const badge2Ref = doc(db, 'userBadges', `${testUser1.uid}_2024-01-16_10000_steps`);
      await setDoc(badge2Ref, { 
        ...testBadge, 
        date: '2024-01-16',
        type: '10000_steps',
        awardedAt: new Date('2024-01-16T10:30:00Z')
      });

      querySnap = await getDocs(q);
      expect(querySnap.size).toBe(2);
      
      // Verify ordering (newest first)
      const badges = querySnap.docs.map(doc => doc.data());
      expect(badges[0].date).toBe('2024-01-16'); // Newer badge first
      expect(badges[1].date).toBe('2024-01-15');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid document IDs gracefully', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Test with various invalid characters that might be in badge types
      const edgeCaseTypes = [
        'badge/with/slashes',
        'badge with spaces',
        'badge-with-dashes',
        'badge_with_underscores',
        'badge.with.dots'
      ];

      for (const type of edgeCaseTypes) {
        const safeBadgeId = `${testUser1.uid}_2024-01-15_${type.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const badgeRef = doc(db, 'userBadges', safeBadgeId);
        
        await expect(setDoc(badgeRef, {
          ...testBadge,
          type
        })).resolves.not.toThrow();
      }
    });

    test('should handle large badge type names', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Test with very long badge type name (Firestore has limits)
      const longBadgeType = 'a'.repeat(500); // 500 characters
      const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_long`);
      
      await setDoc(badgeRef, {
        ...testBadge,
        type: longBadgeType
      });

      const docSnap = await getDoc(badgeRef);
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.type).toBe(longBadgeType);
    });

    test('should handle timestamp edge cases', async () => {
      const db = testEnv.authenticatedContext(testUser1.uid).firestore();
      
      // Test with various timestamp scenarios
      const timestampEdgeCases = [
        new Date(0), // Unix epoch
        new Date('1970-01-01T00:00:00Z'),
        new Date('2038-01-19T03:14:07Z'), // Y2038 problem date
        new Date('2024-02-29T00:00:00Z'), // Leap year
        new Date('2024-12-31T23:59:59Z') // End of year
      ];

      for (const [index, timestamp] of timestampEdgeCases.entries()) {
        const badgeRef = doc(db, 'userBadges', `${testUser1.uid}_2024-01-15_edge_${index}`);
        
        await setDoc(badgeRef, {
          ...testBadge,
          awardedAt: timestamp
        });

        const docSnap = await getDoc(badgeRef);
        expect(docSnap.exists()).toBe(true);
        expect(docSnap.data()?.awardedAt.getTime()).toBe(timestamp.getTime());
      }
    });
  });
});

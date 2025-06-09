/**
 * @jest-environment jsdom
 */
import { BadgeRecord } from '../../services/badgeService';

describe('BadgeRecord Data Model', () => {
  describe('BadgeRecord Interface', () => {
    test('should have valid structure', () => {
      const sampleBadge: BadgeRecord = {
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: new Date('2024-01-15T10:30:00Z'),
        isNew: true
      };

      expect(sampleBadge).toHaveProperty('date');
      expect(sampleBadge).toHaveProperty('type');
      expect(sampleBadge).toHaveProperty('awardedAt');
      expect(sampleBadge).toHaveProperty('isNew');
      
      expect(typeof sampleBadge.date).toBe('string');
      expect(typeof sampleBadge.type).toBe('string');
      expect(sampleBadge.awardedAt).toBeInstanceOf(Date);
      expect(typeof sampleBadge.isNew).toBe('boolean');
    });

    test('should handle optional isNew field', () => {
      const badgeWithoutIsNew: BadgeRecord = {
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: new Date('2024-01-15T10:30:00Z')
      };

      expect(badgeWithoutIsNew.isNew).toBeUndefined();
      
      const badgeWithIsNew: BadgeRecord = {
        ...badgeWithoutIsNew,
        isNew: false
      };

      expect(badgeWithIsNew.isNew).toBe(false);
    });
  });

  describe('Badge Date Validation', () => {
    test('should accept valid date formats', () => {
      const validDates = [
        '2024-01-15',
        '2024-12-31',
        '2023-02-28',
        '2024-02-29' // Leap year
      ];

      validDates.forEach(date => {
        const badge: BadgeRecord = {
          date,
          type: 'test_badge',
          awardedAt: new Date()
        };

        expect(badge.date).toBe(date);
        expect(Date.parse(date)).not.toBeNaN();
      });
    });

    test('should handle date consistency', () => {
      const dateStr = '2024-01-15';
      const awardedAt = new Date('2024-01-15T14:30:00Z');
      
      const badge: BadgeRecord = {
        date: dateStr,
        type: 'test_badge',
        awardedAt
      };

      // Date and awardedAt should be for the same day
      const badgeDate = new Date(badge.date);
      expect(badgeDate.getFullYear()).toBe(awardedAt.getFullYear());
      expect(badgeDate.getMonth()).toBe(awardedAt.getMonth());
      expect(badgeDate.getDate()).toBe(awardedAt.getDate());
    });
  });

  describe('Badge Type Validation', () => {
    test('should accept valid badge types', () => {
      const validTypes = [
        '7500_steps',
        '10000_steps',
        '3days_streak',
        'first_step',
        'weekend_warrior',
        'spring_awakening',
        'lucky_day'
      ];

      validTypes.forEach(type => {
        const badge: BadgeRecord = {
          date: '2024-01-15',
          type,
          awardedAt: new Date()
        };

        expect(badge.type).toBe(type);
        expect(badge.type.length).toBeGreaterThan(0);
      });
    });

    test('should handle type string format', () => {
      const badge: BadgeRecord = {
        date: '2024-01-15',
        type: 'test_badge_type',
        awardedAt: new Date()
      };

      // Type should be a non-empty string
      expect(typeof badge.type).toBe('string');
      expect(badge.type.trim().length).toBeGreaterThan(0);
      
      // Type should follow snake_case convention for most badges
      expect(badge.type).toMatch(/^[a-z0-9_]+$/);
    });
  });

  describe('Badge Timestamp Validation', () => {
    test('should handle valid timestamps', () => {
      const now = new Date();
      const pastDate = new Date('2024-01-01T00:00:00Z');
      const futureDate = new Date('2025-12-31T23:59:59Z');

      [now, pastDate, futureDate].forEach(timestamp => {
        const badge: BadgeRecord = {
          date: '2024-01-15',
          type: 'test_badge',
          awardedAt: timestamp
        };

        expect(badge.awardedAt).toBeInstanceOf(Date);
        expect(badge.awardedAt.getTime()).toBe(timestamp.getTime());
      });
    });

    test('should handle timezone considerations', () => {
      const utcDate = new Date('2024-01-15T12:00:00Z');
      const badge: BadgeRecord = {
        date: '2024-01-15',
        type: 'test_badge',
        awardedAt: utcDate
      };

      // Should preserve the exact timestamp
      expect(badge.awardedAt.toISOString()).toBe('2024-01-15T12:00:00.000Z');
    });
  });

  describe('Badge Business Logic', () => {
    test('should support badge comparison and sorting', () => {
      const badges: BadgeRecord[] = [
        {
          date: '2024-01-15',
          type: 'badge_1',
          awardedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          date: '2024-01-14',
          type: 'badge_2',
          awardedAt: new Date('2024-01-14T15:00:00Z')
        },
        {
          date: '2024-01-16',
          type: 'badge_3',
          awardedAt: new Date('2024-01-16T08:00:00Z')
        }
      ];

      // Sort by awardedAt descending (most recent first)
      const sortedBadges = badges.sort((a, b) => 
        b.awardedAt.getTime() - a.awardedAt.getTime()
      );

      expect(sortedBadges[0].type).toBe('badge_3'); // 2024-01-16
      expect(sortedBadges[1].type).toBe('badge_1'); // 2024-01-15
      expect(sortedBadges[2].type).toBe('badge_2'); // 2024-01-14
    });

    test('should support filtering by date range', () => {
      const badges: BadgeRecord[] = [
        {
          date: '2024-01-10',
          type: 'badge_1',
          awardedAt: new Date('2024-01-10T10:00:00Z')
        },
        {
          date: '2024-01-15',
          type: 'badge_2',
          awardedAt: new Date('2024-01-15T15:00:00Z')
        },
        {
          date: '2024-01-20',
          type: 'badge_3',
          awardedAt: new Date('2024-01-20T08:00:00Z')
        }
      ];

      // Filter badges within a date range
      const startDate = new Date('2024-01-12');
      const endDate = new Date('2024-01-18');
      
      const filteredBadges = badges.filter(badge => {
        const badgeDate = new Date(badge.date);
        return badgeDate >= startDate && badgeDate <= endDate;
      });

      expect(filteredBadges.length).toBe(1);
      expect(filteredBadges[0].type).toBe('badge_2');
    });

    test('should support grouping by type', () => {
      const badges: BadgeRecord[] = [
        {
          date: '2024-01-15',
          type: '7500_steps',
          awardedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          date: '2024-01-16',
          type: '10000_steps',
          awardedAt: new Date('2024-01-16T11:00:00Z')
        },
        {
          date: '2024-01-17',
          type: '7500_steps',
          awardedAt: new Date('2024-01-17T12:00:00Z')
        }
      ];

      // Group badges by type
      const groupedBadges = badges.reduce((groups, badge) => {
        const type = badge.type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(badge);
        return groups;
      }, {} as Record<string, BadgeRecord[]>);

      expect(Object.keys(groupedBadges)).toEqual(['7500_steps', '10000_steps']);
      expect(groupedBadges['7500_steps']).toHaveLength(2);
      expect(groupedBadges['10000_steps']).toHaveLength(1);
    });

    test('should support new badge identification', () => {
      const badges: BadgeRecord[] = [
        {
          date: '2024-01-15',
          type: 'badge_1',
          awardedAt: new Date('2024-01-15T10:00:00Z'),
          isNew: true
        },
        {
          date: '2024-01-14',
          type: 'badge_2',
          awardedAt: new Date('2024-01-14T15:00:00Z'),
          isNew: false
        },
        {
          date: '2024-01-13',
          type: 'badge_3',
          awardedAt: new Date('2024-01-13T08:00:00Z')
          // isNew is undefined
        }
      ];

      const newBadges = badges.filter(badge => badge.isNew === true);
      const oldBadges = badges.filter(badge => badge.isNew === false);
      const unknownBadges = badges.filter(badge => badge.isNew === undefined);

      expect(newBadges).toHaveLength(1);
      expect(oldBadges).toHaveLength(1);
      expect(unknownBadges).toHaveLength(1);
    });
  });

  describe('Badge Serialization and Deserialization', () => {
    test('should serialize to JSON correctly', () => {
      const badge: BadgeRecord = {
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: new Date('2024-01-15T10:30:00Z'),
        isNew: true
      };

      const serialized = JSON.stringify(badge);
      expect(serialized).toContain('"date":"2024-01-15"');
      expect(serialized).toContain('"type":"7500_steps"');
      expect(serialized).toContain('"isNew":true');
    });

    test('should handle deserialization from JSON', () => {
      const jsonData = {
        date: '2024-01-15',
        type: '7500_steps',
        awardedAt: '2024-01-15T10:30:00.000Z',
        isNew: true
      };

      // Simulate deserializing from Firestore or API
      const badge: BadgeRecord = {
        ...jsonData,
        awardedAt: new Date(jsonData.awardedAt)
      };

      expect(badge.date).toBe('2024-01-15');
      expect(badge.type).toBe('7500_steps');
      expect(badge.awardedAt).toBeInstanceOf(Date);
      expect(badge.awardedAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
      expect(badge.isNew).toBe(true);
    });
  });
});

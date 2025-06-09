/**
 * Tests for Special Badge Checker Functions - Business logic for earning special badges
 */

import {
  checkSeasonalBadges,
  checkSurpriseBadges,
  checkWeekendBadges,
  checkAnniversaryBadges,
  checkAllSpecialBadges,
  getCurrentSeason,
  isWeekend,
  getDayOfWeek,
  SpecialBadgeType
} from '../../services/specialBadgeService';
import { saveBadge } from '../../services/badgeService';

// Mock dependencies
jest.mock('../../services/badgeService');

const mockSaveBadge = saveBadge as jest.MockedFunction<typeof saveBadge>;

describe('Special Badge Checker Functions', () => {
  const testUserId = 'test-user-123';
  const testDate = '2024-01-15';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date to a known state
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Utility Functions', () => {
    describe('getCurrentSeason', () => {
      test('should return correct season for spring months', () => {
        jest.setSystemTime(new Date('2024-03-15')); // March
        expect(getCurrentSeason()).toBe('spring');
        
        jest.setSystemTime(new Date('2024-04-15')); // April
        expect(getCurrentSeason()).toBe('spring');
        
        jest.setSystemTime(new Date('2024-05-15')); // May
        expect(getCurrentSeason()).toBe('spring');
      });

      test('should return correct season for summer months', () => {
        jest.setSystemTime(new Date('2024-06-15')); // June
        expect(getCurrentSeason()).toBe('summer');
        
        jest.setSystemTime(new Date('2024-07-15')); // July
        expect(getCurrentSeason()).toBe('summer');
        
        jest.setSystemTime(new Date('2024-08-15')); // August
        expect(getCurrentSeason()).toBe('summer');
      });

      test('should return correct season for autumn months', () => {
        jest.setSystemTime(new Date('2024-09-15')); // September
        expect(getCurrentSeason()).toBe('autumn');
        
        jest.setSystemTime(new Date('2024-10-15')); // October
        expect(getCurrentSeason()).toBe('autumn');
        
        jest.setSystemTime(new Date('2024-11-15')); // November
        expect(getCurrentSeason()).toBe('autumn');
      });

      test('should return correct season for winter months', () => {
        jest.setSystemTime(new Date('2024-12-15')); // December
        expect(getCurrentSeason()).toBe('winter');
        
        jest.setSystemTime(new Date('2024-01-15')); // January
        expect(getCurrentSeason()).toBe('winter');
        
        jest.setSystemTime(new Date('2024-02-15')); // February
        expect(getCurrentSeason()).toBe('winter');
      });
    });

    describe('isWeekend', () => {
      test('should return true for Saturday', () => {
        jest.setSystemTime(new Date('2024-01-13T10:00:00Z')); // Saturday
        expect(isWeekend()).toBe(true);
      });

      test('should return true for Sunday', () => {
        jest.setSystemTime(new Date('2024-01-14T10:00:00Z')); // Sunday
        expect(isWeekend()).toBe(true);
      });

      test('should return false for weekdays', () => {
        const weekdays = [
          '2024-01-15', // Monday
          '2024-01-16', // Tuesday
          '2024-01-17', // Wednesday
          '2024-01-18', // Thursday
          '2024-01-19'  // Friday
        ];

        weekdays.forEach(date => {
          jest.setSystemTime(new Date(`${date}T10:00:00Z`));
          expect(isWeekend()).toBe(false);
        });
      });
    });

    describe('getDayOfWeek', () => {
      test('should return correct day names', () => {
        const testCases = [
          { date: '2024-01-14T10:00:00Z', expected: 'sunday' },
          { date: '2024-01-15T10:00:00Z', expected: 'monday' },
          { date: '2024-01-16T10:00:00Z', expected: 'tuesday' },
          { date: '2024-01-17T10:00:00Z', expected: 'wednesday' },
          { date: '2024-01-18T10:00:00Z', expected: 'thursday' },
          { date: '2024-01-19T10:00:00Z', expected: 'friday' },
          { date: '2024-01-13T10:00:00Z', expected: 'saturday' }
        ];

        testCases.forEach(({ date, expected }) => {
          jest.setSystemTime(new Date(date));
          expect(getDayOfWeek()).toBe(expected);
        });
      });
    });
  });

  describe('checkSeasonalBadges', () => {
    test('should award spring badge for good activity in spring', async () => {
      jest.setSystemTime(new Date('2024-03-15T10:00:00Z')); // Spring
      
      await checkSeasonalBadges(testUserId, 8000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SPRING_AWAKENING
      );
    });

    test('should award summer solstice badge for high activity in summer', async () => {
      jest.setSystemTime(new Date('2024-06-21T10:00:00Z')); // Summer Solstice
      
      await checkSeasonalBadges(testUserId, 10000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SUMMER_SOLSTICE
      );
    });

    test('should award regular summer badge for good activity', async () => {
      jest.setSystemTime(new Date('2024-07-15T10:00:00Z')); // Summer but not solstice
      
      await checkSeasonalBadges(testUserId, 7500, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SUMMER_SOLSTICE
      );
    });

    test('should award autumn badge for good activity in autumn', async () => {
      jest.setSystemTime(new Date('2024-10-15T10:00:00Z')); // Autumn
      
      await checkSeasonalBadges(testUserId, 8000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.AUTUMN_LEAVES
      );
    });

    test('should award winter badge for good activity in winter', async () => {
      jest.setSystemTime(new Date('2024-12-15T10:00:00Z')); // Winter
      
      await checkSeasonalBadges(testUserId, 8000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.WINTER_WONDER
      );
    });

    test('should not award seasonal badges for insufficient activity', async () => {
      jest.setSystemTime(new Date('2024-03-15T10:00:00Z')); // Spring
      
      await checkSeasonalBadges(testUserId, 5000, testDate); // Below threshold
      
      expect(mockSaveBadge).not.toHaveBeenCalled();
    });

    test('should handle summer solstice special case correctly', async () => {
      jest.setSystemTime(new Date('2024-06-21T10:00:00Z')); // Exact summer solstice
      
      // Should award solstice badge for high activity
      await checkSeasonalBadges(testUserId, 10000, testDate);
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SUMMER_SOLSTICE
      );
      
      mockSaveBadge.mockClear();
      
      // Should still award for good activity
      await checkSeasonalBadges(testUserId, 7500, testDate);
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SUMMER_SOLSTICE
      );
    });
  });

  describe('checkSurpriseBadges', () => {
    test('should award early bird badge for pre-dawn activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00Z')); // 4:30 AM
      
      await checkSurpriseBadges(testUserId, 1000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.EARLY_BIRD
      );
    });

    test('should not award early bird badge for insufficient early activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00Z')); // 4:30 AM
      
      await checkSurpriseBadges(testUserId, 500, testDate); // Below threshold
      
      expect(mockSaveBadge).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        SpecialBadgeType.EARLY_BIRD
      );
    });

    test('should not award early bird badge for activity after 5 AM', async () => {
      jest.setSystemTime(new Date('2024-01-15T05:30:00Z')); // 5:30 AM
      
      await checkSurpriseBadges(testUserId, 2000, testDate);
      
      expect(mockSaveBadge).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        SpecialBadgeType.EARLY_BIRD
      );
    });

    test('should award midnight walker badge for late night activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T23:30:00Z')); // 11:30 PM
      
      await checkSurpriseBadges(testUserId, 2000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.MIDNIGHT_WALKER
      );
    });

    test('should award midnight walker badge for early morning activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T01:00:00Z')); // 1:00 AM
      
      await checkSurpriseBadges(testUserId, 2000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.MIDNIGHT_WALKER
      );
    });

    test('should not award midnight walker for insufficient late activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T23:30:00Z')); // 11:30 PM
      
      await checkSurpriseBadges(testUserId, 1000, testDate); // Below threshold
      
      expect(mockSaveBadge).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        SpecialBadgeType.MIDNIGHT_WALKER
      );
    });

    test('should have chance to award lucky day badge', async () => {
      // Mock Math.random to return a value that triggers lucky day
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.03); // 3% < 5% threshold
      
      await checkSurpriseBadges(testUserId, 7500, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.LUCKY_DAY
      );
      
      Math.random = originalRandom;
    });

    test('should not award lucky day badge if random chance fails', async () => {
      // Mock Math.random to return a value that doesn't trigger lucky day
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.07); // 7% > 5% threshold
      
      await checkSurpriseBadges(testUserId, 7500, testDate);
      
      expect(mockSaveBadge).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        SpecialBadgeType.LUCKY_DAY
      );
      
      Math.random = originalRandom;
    });

    test('should not award lucky day badge for insufficient activity', async () => {
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.03); // Good random chance
      
      await checkSurpriseBadges(testUserId, 5000, testDate); // Below 7500 threshold
      
      expect(mockSaveBadge).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        SpecialBadgeType.LUCKY_DAY
      );
      
      Math.random = originalRandom;
    });

    test('should have chance to award rainy day hero badge', async () => {
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.05); // 5% < 10% threshold
      
      await checkSurpriseBadges(testUserId, 7500, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.RAINY_DAY_HERO
      );
      
      Math.random = originalRandom;
    });

    test('should handle multiple surprise badges in one call', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00Z')); // Early morning
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.03); // Trigger random badges
      
      await checkSurpriseBadges(testUserId, 8000, testDate);
      
      // Should trigger early bird and potentially lucky day/rainy day
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.EARLY_BIRD
      );
      
      Math.random = originalRandom;
    });
  });

  describe('checkWeekendBadges', () => {
    test('should award weekend warrior badge for high weekend activity', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00Z')); // Saturday
      
      await checkWeekendBadges(testUserId, 10000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.WEEKEND_WARRIOR
      );
    });

    test('should award saturday special badge for good saturday activity', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00Z')); // Saturday
      
      await checkWeekendBadges(testUserId, 8000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SATURDAY_SPECIAL
      );
    });

    test('should award sunday funday badge for good sunday activity', async () => {
      jest.setSystemTime(new Date('2024-01-14T10:00:00Z')); // Sunday
      
      await checkWeekendBadges(testUserId, 8000, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SUNDAY_FUNDAY
      );
    });

    test('should not award weekend badges for weekday activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z')); // Monday
      
      await checkWeekendBadges(testUserId, 12000, testDate);
      
      expect(mockSaveBadge).not.toHaveBeenCalled();
    });

    test('should not award weekend badges for insufficient weekend activity', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00Z')); // Saturday
      
      await checkWeekendBadges(testUserId, 5000, testDate); // Below thresholds
      
      expect(mockSaveBadge).not.toHaveBeenCalled();
    });

    test('should award multiple weekend badges if thresholds are met', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00Z')); // Saturday
      
      await checkWeekendBadges(testUserId, 12000, testDate); // Above both thresholds
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.WEEKEND_WARRIOR
      );
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SATURDAY_SPECIAL
      );
    });
  });

  describe('checkAnniversaryBadges', () => {
    const userRegistrationDate = new Date('2023-01-15T10:00:00Z');

    test('should award one month anniversary badge', async () => {
      jest.setSystemTime(new Date('2023-02-15T10:00:00Z')); // Exactly 31 days later
      
      await checkAnniversaryBadges(testUserId, userRegistrationDate, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.ONE_MONTH_ANNIVERSARY
      );
    });

    test('should award six month anniversary badge', async () => {
      jest.setSystemTime(new Date('2023-07-15T10:00:00Z')); // Exactly 181 days later
      
      await checkAnniversaryBadges(testUserId, userRegistrationDate, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.SIX_MONTH_ANNIVERSARY
      );
    });

    test('should award one year anniversary badge', async () => {
      jest.setSystemTime(new Date('2024-01-16T10:00:00Z')); // Exactly 366 days later
      
      await checkAnniversaryBadges(testUserId, userRegistrationDate, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY
      );
    });

    test('should not award anniversary badges on wrong dates', async () => {
      // Test dates that don't match anniversary thresholds
      const testDates = [
        new Date('2023-02-10T10:00:00Z'), // 26 days (too early for 1 month)
        new Date('2023-02-20T10:00:00Z'), // 36 days (too late for 1 month)
        new Date('2023-07-10T10:00:00Z'), // 176 days (too early for 6 months)
        new Date('2024-01-10T10:00:00Z'), // 360 days (too early for 1 year)
        new Date('2024-01-20T10:00:00Z')  // 370 days (too late for 1 year)
      ];

      for (const testDate of testDates) {
        jest.setSystemTime(testDate);
        mockSaveBadge.mockClear();
        
        await checkAnniversaryBadges(testUserId, userRegistrationDate, '2024-01-15');
        
        expect(mockSaveBadge).not.toHaveBeenCalled();
      }
    });

    test('should handle edge cases around anniversary dates', async () => {
      // Test exactly 30 days (should trigger one month)
      jest.setSystemTime(new Date('2023-02-14T10:00:00Z')); // Exactly 30 days
      
      await checkAnniversaryBadges(testUserId, userRegistrationDate, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.ONE_MONTH_ANNIVERSARY
      );
    });

    test('should handle leap year calculations correctly', async () => {
      const leapYearRegistration = new Date('2024-02-29T10:00:00Z'); // Leap year date
      
      // Test one year later from leap year date
      jest.setSystemTime(new Date('2025-03-01T10:00:00Z')); // 365 days later (no leap day in 2025)
      
      await checkAnniversaryBadges(testUserId, leapYearRegistration, testDate);
      
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY
      );
    });
  });

  describe('checkAllSpecialBadges', () => {
    const userRegistrationDate = new Date('2023-01-15T10:00:00Z');

    test('should run all badge checkers concurrently', async () => {
      jest.setSystemTime(new Date('2024-01-13T04:30:00Z')); // Saturday early morning
      
      await checkAllSpecialBadges(testUserId, 12000, testDate, userRegistrationDate);
      
      // Should have called multiple badge checkers
      expect(mockSaveBadge).toHaveBeenCalledTimes(expect.any(Number));
      
      // Verify specific badges were awarded
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.WINTER_WONDER // Seasonal
      );
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.EARLY_BIRD // Surprise
      );
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.WEEKEND_WARRIOR // Weekend
      );
      expect(mockSaveBadge).toHaveBeenCalledWith(
        testUserId,
        testDate,
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY // Anniversary
      );
    });

    test('should handle errors in individual checkers gracefully', async () => {
      // Mock one of the save badge calls to fail
      mockSaveBadge.mockImplementation((userId, date, type) => {
        if (type === SpecialBadgeType.WINTER_WONDER) {
          throw new Error('Seasonal badge save failed');
        }
        return Promise.resolve();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await checkAllSpecialBadges(testUserId, 10000, testDate, userRegistrationDate);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking special badges:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should complete even if some badge checks fail', async () => {
      // Mock saveBadge to throw error for specific badge types
      mockSaveBadge.mockImplementation((userId, date, type) => {
        if (type === SpecialBadgeType.EARLY_BIRD) {
          throw new Error('Early bird save failed');
        }
        return Promise.resolve();
      });

      jest.setSystemTime(new Date('2024-01-13T04:30:00Z')); // Saturday early morning
      
      // Should not throw error despite individual failures
      await expect(
        checkAllSpecialBadges(testUserId, 10000, testDate, userRegistrationDate)
      ).resolves.toBeUndefined();
    });

    test('should handle concurrent execution correctly', async () => {
      const promises = [];
      
      // Run multiple concurrent badge checks
      for (let i = 0; i < 5; i++) {
        promises.push(
          checkAllSpecialBadges(testUserId, 8000, testDate, userRegistrationDate)
        );
      }
      
      await Promise.all(promises);
      
      // Should complete all without errors
      expect(mockSaveBadge).toHaveBeenCalled();
    });
  });

  describe('Badge Award Thresholds and Conditions', () => {
    test('should respect step count thresholds for different badges', async () => {
      const testCases = [
        { steps: 500, expectEarlyBird: false },
        { steps: 1000, expectEarlyBird: true },
        { steps: 1500, expectMidnight: false },
        { steps: 2000, expectMidnight: true },
        { steps: 6000, expectLucky: false },
        { steps: 7500, expectLucky: true }
      ];

      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.01); // Always trigger random badges
      
      for (const testCase of testCases) {
        mockSaveBadge.mockClear();
        
        // Test early bird
        jest.setSystemTime(new Date('2024-01-15T04:30:00Z'));
        await checkSurpriseBadges(testUserId, testCase.steps, testDate);
        
        if (testCase.expectEarlyBird) {
          expect(mockSaveBadge).toHaveBeenCalledWith(
            testUserId,
            testDate,
            SpecialBadgeType.EARLY_BIRD
          );
        } else {
          expect(mockSaveBadge).not.toHaveBeenCalledWith(
            testUserId,
            testDate,
            SpecialBadgeType.EARLY_BIRD
          );
        }
      }
      
      Math.random = originalRandom;
    });

    test('should handle time-based conditions correctly', async () => {
      const timeTestCases = [
        { time: '2024-01-15T03:00:00Z', hour: 3, expectEarlyBird: true, expectMidnight: false },
        { time: '2024-01-15T05:00:00Z', hour: 5, expectEarlyBird: false, expectMidnight: false },
        { time: '2024-01-15T23:30:00Z', hour: 23, expectEarlyBird: false, expectMidnight: true },
        { time: '2024-01-15T01:30:00Z', hour: 1, expectEarlyBird: true, expectMidnight: true },
        { time: '2024-01-15T12:00:00Z', hour: 12, expectEarlyBird: false, expectMidnight: false }
      ];

      for (const testCase of timeTestCases) {
        mockSaveBadge.mockClear();
        jest.setSystemTime(new Date(testCase.time));
        
        await checkSurpriseBadges(testUserId, 3000, testDate);
        
        if (testCase.expectEarlyBird) {
          expect(mockSaveBadge).toHaveBeenCalledWith(
            testUserId,
            testDate,
            SpecialBadgeType.EARLY_BIRD
          );
        }
        
        if (testCase.expectMidnight) {
          expect(mockSaveBadge).toHaveBeenCalledWith(
            testUserId,
            testDate,
            SpecialBadgeType.MIDNIGHT_WALKER
          );
        }
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle saveBadge failures gracefully', async () => {
      mockSaveBadge.mockRejectedValue(new Error('Firestore save failed'));
      
      // Should not throw error even if save fails
      await expect(
        checkSeasonalBadges(testUserId, 8000, testDate)
      ).resolves.toBeUndefined();
      
      await expect(
        checkSurpriseBadges(testUserId, 8000, testDate)
      ).resolves.toBeUndefined();
      
      await expect(
        checkWeekendBadges(testUserId, 8000, testDate)
      ).resolves.toBeUndefined();
    });

    test('should handle invalid date inputs', async () => {
      const invalidRegistrationDate = new Date('invalid-date');
      
      // Should not throw error with invalid date
      await expect(
        checkAnniversaryBadges(testUserId, invalidRegistrationDate, testDate)
      ).resolves.toBeUndefined();
    });

    test('should handle edge cases in date calculations', async () => {
      // Test with date very close to epoch
      const earlyDate = new Date('1970-01-02');
      
      await expect(
        checkAnniversaryBadges(testUserId, earlyDate, testDate)
      ).resolves.toBeUndefined();
      
      // Test with future date
      const futureDate = new Date('2030-01-01');
      
      await expect(
        checkAnniversaryBadges(testUserId, futureDate, testDate)
      ).resolves.toBeUndefined();
    });
  });
});

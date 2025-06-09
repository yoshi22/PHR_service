import {
  SpecialBadgeType,
  BadgeMetadata,
  BADGE_METADATA,
  getBadgeMetadata,
  getBadgesByCategory,
  getBadgesByRarity,
  getCurrentSeason,
  isWeekend,
  getDayOfWeek,
  checkSeasonalBadges,
  checkSurpriseBadges,
  checkWeekendBadges,
  checkAnniversaryBadges,
  checkAllSpecialBadges
} from '../../services/specialBadgeService';

// Mock the badgeService
jest.mock('../../services/badgeService', () => ({
  saveBadge: jest.fn()
}));

import { saveBadge } from '../../services/badgeService';

describe('SpecialBadgeService', () => {
  const mockUserId = 'test-user-123';
  const mockDate = '2024-01-15';
  const mockUserRegistrationDate = new Date('2023-01-15'); // 1 year ago

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Ensure saveBadge is properly mocked
    (saveBadge as jest.Mock).mockResolvedValue(undefined);
    
    // Mock Date to control test environment
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00Z')); // Monday in winter
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Badge Metadata', () => {
    test('should have metadata for all special badge types', () => {
      // Check that all SpecialBadgeType enum values have metadata
      Object.values(SpecialBadgeType).forEach(badgeType => {
        const metadata = getBadgeMetadata(badgeType);
        expect(metadata).toBeDefined();
        expect(metadata).toHaveProperty('type', badgeType);
        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('icon');
        expect(metadata).toHaveProperty('rarity');
        expect(metadata).toHaveProperty('category');
      });
    });

    test('should return null for unknown badge types', () => {
      const metadata = getBadgeMetadata('unknown_badge_type');
      expect(metadata).toBeNull();
    });

    test('should have correct badge metadata structure', () => {
      const springBadge = getBadgeMetadata(SpecialBadgeType.SPRING_AWAKENING);
      
      expect(springBadge).toEqual({
        type: SpecialBadgeType.SPRING_AWAKENING,
        name: '春の目覚め',
        description: '春の季節に特別な活動を達成しました',
        icon: '🌸',
        rarity: 'Rare',
        category: 'Seasonal'
      });
    });

    test('should include regular badge metadata', () => {
      const regularBadge = getBadgeMetadata('7500_steps');
      
      expect(regularBadge).toEqual({
        type: '7500_steps',
        name: '1日7500歩達成',
        description: '1日で7500歩以上歩きました',
        icon: '🏅',
        rarity: 'Common',
        category: 'Regular'
      });
    });
  });

  describe('Badge Category Filtering', () => {
    test('should filter badges by Seasonal category', () => {
      const seasonalBadges = getBadgesByCategory('Seasonal');
      
      expect(seasonalBadges).toHaveLength(4);
      expect(seasonalBadges.map(b => b.type)).toEqual([
        SpecialBadgeType.SPRING_AWAKENING,
        SpecialBadgeType.SUMMER_SOLSTICE,
        SpecialBadgeType.AUTUMN_LEAVES,
        SpecialBadgeType.WINTER_WONDER
      ]);
    });

    test('should filter badges by Surprise category', () => {
      const surpriseBadges = getBadgesByCategory('Surprise');
      
      expect(surpriseBadges).toHaveLength(4);
      expect(surpriseBadges.map(b => b.type)).toEqual([
        SpecialBadgeType.LUCKY_DAY,
        SpecialBadgeType.MIDNIGHT_WALKER,
        SpecialBadgeType.EARLY_BIRD,
        SpecialBadgeType.RAINY_DAY_HERO
      ]);
    });

    test('should filter badges by Anniversary category', () => {
      const anniversaryBadges = getBadgesByCategory('Anniversary');
      
      expect(anniversaryBadges).toHaveLength(4);
      expect(anniversaryBadges.map(b => b.type)).toEqual([
        SpecialBadgeType.BIRTHDAY_SPECIAL,
        SpecialBadgeType.ONE_MONTH_ANNIVERSARY,
        SpecialBadgeType.SIX_MONTH_ANNIVERSARY,
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY
      ]);
    });

    test('should filter badges by Weekend category', () => {
      const weekendBadges = getBadgesByCategory('Weekend');
      
      expect(weekendBadges).toHaveLength(4);
      expect(weekendBadges.map(b => b.type)).toEqual([
        SpecialBadgeType.WEEKEND_WARRIOR,
        SpecialBadgeType.SATURDAY_SPECIAL,
        SpecialBadgeType.SUNDAY_FUNDAY,
        SpecialBadgeType.WEEKEND_STREAK
      ]);
    });

    test('should return empty array for unknown category', () => {
      const unknownBadges = getBadgesByCategory('Unknown' as any);
      expect(unknownBadges).toEqual([]);
    });
  });

  describe('Badge Rarity Filtering', () => {
    test('should filter badges by Common rarity', () => {
      const commonBadges = getBadgesByRarity('Common');
      
      expect(commonBadges.length).toBeGreaterThan(0);
      commonBadges.forEach(badge => {
        expect(badge.rarity).toBe('Common');
      });
    });

    test('should filter badges by Rare rarity', () => {
      const rareBadges = getBadgesByRarity('Rare');
      
      expect(rareBadges.length).toBeGreaterThan(0);
      rareBadges.forEach(badge => {
        expect(badge.rarity).toBe('Rare');
      });
    });

    test('should filter badges by Epic rarity', () => {
      const epicBadges = getBadgesByRarity('Epic');
      
      expect(epicBadges.length).toBeGreaterThan(0);
      epicBadges.forEach(badge => {
        expect(badge.rarity).toBe('Epic');
      });
    });

    test('should filter badges by Legendary rarity', () => {
      const legendaryBadges = getBadgesByRarity('Legendary');
      
      expect(legendaryBadges.length).toBeGreaterThan(0);
      legendaryBadges.forEach(badge => {
        expect(badge.rarity).toBe('Legendary');
      });
    });
  });

  describe('Date and Time Utilities', () => {
    test('should correctly determine current season', () => {
      // Winter (January)
      jest.setSystemTime(new Date('2024-01-15'));
      expect(getCurrentSeason()).toBe('winter');

      // Spring (April)
      jest.setSystemTime(new Date('2024-04-15'));
      expect(getCurrentSeason()).toBe('spring');

      // Summer (July)
      jest.setSystemTime(new Date('2024-07-15'));
      expect(getCurrentSeason()).toBe('summer');

      // Autumn (October)
      jest.setSystemTime(new Date('2024-10-15'));
      expect(getCurrentSeason()).toBe('autumn');
    });

    test('should correctly identify weekends', () => {
      // Saturday
      jest.setSystemTime(new Date('2024-01-13T10:00:00')); // Saturday
      expect(isWeekend()).toBe(true);

      // Sunday
      jest.setSystemTime(new Date('2024-01-14T10:00:00')); // Sunday
      expect(isWeekend()).toBe(true);

      // Monday
      jest.setSystemTime(new Date('2024-01-15T10:00:00')); // Monday
      expect(isWeekend()).toBe(false);

      // Friday
      jest.setSystemTime(new Date('2024-01-19T10:00:00')); // Friday
      expect(isWeekend()).toBe(false);
    });

    test('should correctly get day of week', () => {
      // Test all days of the week
      jest.setSystemTime(new Date('2024-01-14T10:00:00')); // Sunday
      expect(getDayOfWeek()).toBe('sunday');

      jest.setSystemTime(new Date('2024-01-15T10:00:00')); // Monday
      expect(getDayOfWeek()).toBe('monday');

      jest.setSystemTime(new Date('2024-01-16T10:00:00')); // Tuesday
      expect(getDayOfWeek()).toBe('tuesday');

      jest.setSystemTime(new Date('2024-01-17T10:00:00')); // Wednesday
      expect(getDayOfWeek()).toBe('wednesday');

      jest.setSystemTime(new Date('2024-01-18T10:00:00')); // Thursday
      expect(getDayOfWeek()).toBe('thursday');

      jest.setSystemTime(new Date('2024-01-19T10:00:00')); // Friday
      expect(getDayOfWeek()).toBe('friday');

      jest.setSystemTime(new Date('2024-01-20T10:00:00')); // Saturday
      expect(getDayOfWeek()).toBe('saturday');
    });
  });

  describe('Seasonal Badge Checking', () => {
    test('should award winter badge in winter with sufficient steps', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00')); // Winter
      
      await checkSeasonalBadges(mockUserId, 8000, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.WINTER_WONDER
      );
    });

    test('should award spring badge in spring with sufficient steps', async () => {
      jest.setSystemTime(new Date('2024-04-15T10:00:00')); // Spring
      
      await checkSeasonalBadges(mockUserId, 8000, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.SPRING_AWAKENING
      );
    });

    test('should award summer solstice badge on June 21st with high steps', async () => {
      jest.setSystemTime(new Date('2024-06-21T10:00:00')); // Summer Solstice
      
      await checkSeasonalBadges(mockUserId, 10000, '2024-06-21');

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        '2024-06-21',
        SpecialBadgeType.SUMMER_SOLSTICE
      );
    });

    test('should award autumn badge in autumn with sufficient steps', async () => {
      jest.setSystemTime(new Date('2024-10-15T10:00:00')); // Autumn
      
      await checkSeasonalBadges(mockUserId, 8000, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.AUTUMN_LEAVES
      );
    });

    test('should not award seasonal badge with insufficient steps', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00')); // Winter
      
      await checkSeasonalBadges(mockUserId, 5000, mockDate); // Below 8000 threshold

      expect(saveBadge).not.toHaveBeenCalled();
    });
  });

  describe('Surprise Badge Checking', () => {
    test('should award early bird badge for activity before 5 AM', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00')); // 4:30 AM
      
      await checkSurpriseBadges(mockUserId, 1500, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.EARLY_BIRD
      );
    });

    test('should not award early bird badge with insufficient steps', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00')); // 4:30 AM
      
      await checkSurpriseBadges(mockUserId, 500, mockDate); // Below 1000 threshold

      expect(saveBadge).not.toHaveBeenCalled();
    });

    test('should award midnight walker badge for late night activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T23:30:00')); // 11:30 PM
      
      await checkSurpriseBadges(mockUserId, 2500, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.MIDNIGHT_WALKER
      );
    });

    test('should award midnight walker badge for after midnight activity', async () => {
      jest.setSystemTime(new Date('2024-01-15T00:30:00')); // 12:30 AM
      
      await checkSurpriseBadges(mockUserId, 2500, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.MIDNIGHT_WALKER
      );
    });

    test('should not award midnight walker badge with insufficient steps', async () => {
      jest.setSystemTime(new Date('2024-01-15T23:30:00')); // 11:30 PM
      
      await checkSurpriseBadges(mockUserId, 1500, mockDate); // Below 2000 threshold

      expect(saveBadge).not.toHaveBeenCalled();
    });

    test('should potentially award lucky day badge with good activity', async () => {
      // Mock Math.random to always return 0.04 (within 5% chance)
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.04);
      
      await checkSurpriseBadges(mockUserId, 8000, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.LUCKY_DAY
      );

      mockRandom.mockRestore();
    });

    test('should not award lucky day badge when random chance fails', async () => {
      // Mock Math.random to always return 0.06 (outside 5% chance)
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.06);
      
      await checkSurpriseBadges(mockUserId, 8000, mockDate);

      expect(saveBadge).not.toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.LUCKY_DAY
      );

      mockRandom.mockRestore();
    });

    test('should potentially award rainy day hero badge', async () => {
      // Mock Math.random to always return 0.09 (within 10% chance)
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.09);
      
      await checkSurpriseBadges(mockUserId, 8000, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.RAINY_DAY_HERO
      );

      mockRandom.mockRestore();
    });
  });

  describe('Weekend Badge Checking', () => {
    test('should award weekend warrior badge for high weekend activity', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00')); // Saturday
      
      await checkWeekendBadges(mockUserId, 10500, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.WEEKEND_WARRIOR
      );
    });

    test('should award Saturday special badge', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00')); // Saturday
      
      await checkWeekendBadges(mockUserId, 8500, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.SATURDAY_SPECIAL
      );
    });

    test('should award Sunday funday badge', async () => {
      jest.setSystemTime(new Date('2024-01-14T10:00:00')); // Sunday
      
      await checkWeekendBadges(mockUserId, 8500, mockDate);

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.SUNDAY_FUNDAY
      );
    });

    test('should not award weekend badges on weekdays', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00')); // Monday
      
      await checkWeekendBadges(mockUserId, 12000, mockDate);

      expect(saveBadge).not.toHaveBeenCalled();
    });

    test('should not award weekend badges with insufficient steps', async () => {
      jest.setSystemTime(new Date('2024-01-13T10:00:00')); // Saturday
      
      await checkWeekendBadges(mockUserId, 5000, mockDate); // Below thresholds

      expect(saveBadge).not.toHaveBeenCalled();
    });
  });

  describe('Anniversary Badge Checking', () => {
    test('should award one month anniversary badge', async () => {
      const registrationDate = new Date('2023-12-15'); // 1 month + 1 day ago
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));
      
      await checkAnniversaryBadges(mockUserId, registrationDate, '2024-01-15');

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        '2024-01-15',
        SpecialBadgeType.ONE_MONTH_ANNIVERSARY
      );
    });

    test('should award six month anniversary badge', async () => {
      const registrationDate = new Date('2023-07-15'); // 6 months + 1 day ago
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));
      
      await checkAnniversaryBadges(mockUserId, registrationDate, '2024-01-15');

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        '2024-01-15',
        SpecialBadgeType.SIX_MONTH_ANNIVERSARY
      );
    });

    test('should award one year anniversary badge', async () => {
      const registrationDate = new Date('2023-01-15'); // Exactly 1 year ago
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));
      
      await checkAnniversaryBadges(mockUserId, registrationDate, '2024-01-15');

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        '2024-01-15',
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY
      );
    });

    test('should not award anniversary badges before anniversary date', async () => {
      const registrationDate = new Date('2023-02-15'); // Not quite 1 year
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));
      
      await checkAnniversaryBadges(mockUserId, registrationDate, '2024-01-15');

      expect(saveBadge).not.toHaveBeenCalled();
    });

    test('should not award anniversary badges after the anniversary window', async () => {
      const registrationDate = new Date('2023-01-13'); // More than 1 day past anniversary
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));
      
      await checkAnniversaryBadges(mockUserId, registrationDate, '2024-01-15');

      expect(saveBadge).not.toHaveBeenCalled();
    });
  });

  describe('Comprehensive Badge Checking', () => {
    test('should check all special badge types', async () => {
      const userRegistrationDate = new Date('2023-01-15'); // 1 year ago
      jest.setSystemTime(new Date('2024-01-15T04:30:00')); // Early morning, weekday, winter
      
      // Mock random for surprise badges
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.04);
      
      await checkAllSpecialBadges(mockUserId, 8500, mockDate, userRegistrationDate);

      // Should check seasonal (winter)
      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.WINTER_WONDER
      );

      // Should check surprise (early bird)
      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.EARLY_BIRD
      );

      // Should check anniversary (1 year)
      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY
      );

      // Should not check weekend badges (it's a weekday)
      expect(saveBadge).not.toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.WEEKEND_WARRIOR
      );

      mockRandom.mockRestore();
    });

    test('should handle errors gracefully', async () => {
      // Mock saveBadge to throw an error
      const saveBadgeMock = saveBadge as jest.Mock;
      const originalImpl = saveBadgeMock.getMockImplementation();
      saveBadgeMock.mockRejectedValue(new Error('Database error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await checkAllSpecialBadges(mockUserId, 8000, mockDate, mockUserRegistrationDate);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking special badges:',
        expect.any(Error)
      );

      // Restore original implementation
      consoleSpy.mockRestore();
      if (originalImpl) {
        saveBadgeMock.mockImplementation(originalImpl);
      } else {
        saveBadgeMock.mockResolvedValue(undefined);
      }
    });

    test('should process multiple badge conditions simultaneously', async () => {
      // Set up scenario where multiple badges can be awarded
      jest.setSystemTime(new Date('2024-06-21T23:30:00')); // Summer solstice + midnight
      const registrationDate = new Date('2023-11-21'); // 7 months ago, outside anniversary windows
      
      const mockRandom = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.04) // Lucky day
        .mockReturnValueOnce(0.09); // Rainy day hero
      
      await checkAllSpecialBadges(mockUserId, 12000, '2024-06-21', registrationDate);

      // Should award multiple badges
      expect(saveBadge).toHaveBeenCalledTimes(4); // Summer, midnight walker, lucky day, rainy day
      
      mockRandom.mockRestore();
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should handle invalid user registration dates', async () => {
      const invalidDate = new Date('invalid');
      
      await expect(
        checkAnniversaryBadges(mockUserId, invalidDate, mockDate)
      ).resolves.not.toThrow();
    });

    test('should handle zero or negative steps', async () => {
      await checkSeasonalBadges(mockUserId, 0, mockDate);
      await checkSurpriseBadges(mockUserId, -100, mockDate);
      await checkWeekendBadges(mockUserId, 0, mockDate);

      expect(saveBadge).not.toHaveBeenCalled();
    });

    test('should handle boundary conditions for time checks', async () => {
      // Exactly 5 AM (should not trigger early bird)
      jest.setSystemTime(new Date('2024-01-15T05:00:00'));
      
      await checkSurpriseBadges(mockUserId, 1500, mockDate);

      expect(saveBadge).not.toHaveBeenCalledWith(
        mockUserId,
        mockDate,
        SpecialBadgeType.EARLY_BIRD
      );
    });

    test('should handle leap year anniversary calculations', async () => {
      // Registration on leap day, checking 1 year later 
      const leapDayRegistration = new Date('2020-02-29');
      jest.setSystemTime(new Date('2021-02-28T10:00:00')); // 1 year later (non-leap year)
      
      await checkAnniversaryBadges(mockUserId, leapDayRegistration, '2021-02-28');

      expect(saveBadge).toHaveBeenCalledWith(
        mockUserId,
        '2021-02-28',
        SpecialBadgeType.ONE_YEAR_ANNIVERSARY
      );
    });

    test('should handle concurrent badge checking operations', async () => {
      const promises = [
        checkSeasonalBadges(mockUserId, 8000, mockDate),
        checkSurpriseBadges(mockUserId, 8000, mockDate),
        checkWeekendBadges(mockUserId, 8000, mockDate),
        checkAnniversaryBadges(mockUserId, mockUserRegistrationDate, mockDate)
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    test('should maintain badge type consistency', () => {
      // Ensure all badge types in enum have corresponding metadata
      const metadataTypes = Object.keys(BADGE_METADATA).filter(key => 
        Object.values(SpecialBadgeType).includes(key as SpecialBadgeType)
      );
      
      const enumTypes = Object.values(SpecialBadgeType);
      
      enumTypes.forEach(enumType => {
        expect(metadataTypes).toContain(enumType);
      });
    });
  });
});

/**
 * @jest-environment jsdom
 */
import {
  SpecialBadgeType,
  BadgeMetadata,
  BADGE_METADATA,
  getBadgeMetadata,
  getBadgesByCategory,
  getBadgesByRarity,
  getCurrentSeason,
  isWeekend,
  getDayOfWeek
} from '../../services/specialBadgeService';

describe('Special Badge Service Data Models', () => {
  describe('SpecialBadgeType Enum', () => {
    test('should have all required special badge types', () => {
      // Seasonal badges
      expect(SpecialBadgeType.SPRING_AWAKENING).toBe('spring_awakening');
      expect(SpecialBadgeType.SUMMER_SOLSTICE).toBe('summer_solstice');
      expect(SpecialBadgeType.AUTUMN_LEAVES).toBe('autumn_leaves');
      expect(SpecialBadgeType.WINTER_WONDER).toBe('winter_wonder');
      
      // Surprise badges
      expect(SpecialBadgeType.LUCKY_DAY).toBe('lucky_day');
      expect(SpecialBadgeType.MIDNIGHT_WALKER).toBe('midnight_walker');
      expect(SpecialBadgeType.EARLY_BIRD).toBe('early_bird');
      expect(SpecialBadgeType.RAINY_DAY_HERO).toBe('rainy_day_hero');
      
      // Anniversary badges
      expect(SpecialBadgeType.BIRTHDAY_SPECIAL).toBe('birthday_special');
      expect(SpecialBadgeType.ONE_MONTH_ANNIVERSARY).toBe('one_month_anniversary');
      expect(SpecialBadgeType.SIX_MONTH_ANNIVERSARY).toBe('six_month_anniversary');
      expect(SpecialBadgeType.ONE_YEAR_ANNIVERSARY).toBe('one_year_anniversary');
      
      // Weekend badges
      expect(SpecialBadgeType.WEEKEND_WARRIOR).toBe('weekend_warrior');
      expect(SpecialBadgeType.SATURDAY_SPECIAL).toBe('saturday_special');
      expect(SpecialBadgeType.SUNDAY_FUNDAY).toBe('sunday_funday');
      expect(SpecialBadgeType.WEEKEND_STREAK).toBe('weekend_streak');
    });

    test('should have unique enum values', () => {
      const enumValues = Object.values(SpecialBadgeType);
      const uniqueValues = new Set(enumValues);
      
      expect(uniqueValues.size).toBe(enumValues.length);
    });
  });

  describe('BadgeMetadata Interface', () => {
    test('should have valid metadata structure for all badges', () => {
      Object.values(BADGE_METADATA).forEach(metadata => {
        expect(metadata).toHaveProperty('type');
        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('icon');
        expect(metadata).toHaveProperty('rarity');
        expect(metadata).toHaveProperty('category');
        
        expect(typeof metadata.type).toBe('string');
        expect(typeof metadata.name).toBe('string');
        expect(typeof metadata.description).toBe('string');
        expect(typeof metadata.icon).toBe('string');
        expect(typeof metadata.rarity).toBe('string');
        expect(typeof metadata.category).toBe('string');
      });
    });

    test('should have valid rarity values', () => {
      const validRarities = ['Common', 'Rare', 'Epic', 'Legendary'];
      
      Object.values(BADGE_METADATA).forEach(metadata => {
        expect(validRarities).toContain(metadata.rarity);
      });
    });

    test('should have valid category values', () => {
      const validCategories = ['Seasonal', 'Surprise', 'Anniversary', 'Weekend', 'Regular'];
      
      Object.values(BADGE_METADATA).forEach(metadata => {
        expect(validCategories).toContain(metadata.category);
      });
    });

    test('should have non-empty strings for all fields', () => {
      Object.values(BADGE_METADATA).forEach(metadata => {
        expect(metadata.type.trim().length).toBeGreaterThan(0);
        expect(metadata.name.trim().length).toBeGreaterThan(0);
        expect(metadata.description.trim().length).toBeGreaterThan(0);
        expect(metadata.icon.trim().length).toBeGreaterThan(0);
      });
    });

    test('should have emoji icons', () => {
      Object.values(BADGE_METADATA).forEach(metadata => {
        // Basic check for emoji-like characters
        expect(metadata.icon).toMatch(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
      });
    });
  });

  describe('Badge Metadata Utility Functions', () => {
    describe('getBadgeMetadata', () => {
      test('should return metadata for valid badge type', () => {
        const metadata = getBadgeMetadata(SpecialBadgeType.SPRING_AWAKENING);
        
        expect(metadata).toBeDefined();
        expect(metadata?.type).toBe(SpecialBadgeType.SPRING_AWAKENING);
        expect(metadata?.name).toBe('春の目覚め');
        expect(metadata?.category).toBe('Seasonal');
      });

      test('should return metadata for regular badge type', () => {
        const metadata = getBadgeMetadata('7500_steps');
        
        expect(metadata).toBeDefined();
        expect(metadata?.type).toBe('7500_steps');
        expect(metadata?.name).toBe('1日7500歩達成');
      });

      test('should return null for invalid badge type', () => {
        const metadata = getBadgeMetadata('non_existent_badge');
        
        expect(metadata).toBeNull();
      });

      test('should return null for empty string', () => {
        const metadata = getBadgeMetadata('');
        
        expect(metadata).toBeNull();
      });
    });

    describe('getBadgesByCategory (Special Badges)', () => {
      test('should return all seasonal badges', () => {
        const seasonalBadges = getBadgesByCategory('Seasonal');
        
        expect(seasonalBadges.length).toBeGreaterThan(0);
        seasonalBadges.forEach(badge => {
          expect(badge.category).toBe('Seasonal');
        });
        
        // Should include specific seasonal badges
        const badgeTypes = seasonalBadges.map(b => b.type);
        expect(badgeTypes).toContain(SpecialBadgeType.SPRING_AWAKENING);
        expect(badgeTypes).toContain(SpecialBadgeType.SUMMER_SOLSTICE);
        expect(badgeTypes).toContain(SpecialBadgeType.AUTUMN_LEAVES);
        expect(badgeTypes).toContain(SpecialBadgeType.WINTER_WONDER);
      });

      test('should return all surprise badges', () => {
        const surpriseBadges = getBadgesByCategory('Surprise');
        
        expect(surpriseBadges.length).toBeGreaterThan(0);
        surpriseBadges.forEach(badge => {
          expect(badge.category).toBe('Surprise');
        });
        
        // Should include specific surprise badges
        const badgeTypes = surpriseBadges.map(b => b.type);
        expect(badgeTypes).toContain(SpecialBadgeType.LUCKY_DAY);
        expect(badgeTypes).toContain(SpecialBadgeType.MIDNIGHT_WALKER);
        expect(badgeTypes).toContain(SpecialBadgeType.EARLY_BIRD);
      });

      test('should return all anniversary badges', () => {
        const anniversaryBadges = getBadgesByCategory('Anniversary');
        
        expect(anniversaryBadges.length).toBeGreaterThan(0);
        anniversaryBadges.forEach(badge => {
          expect(badge.category).toBe('Anniversary');
        });
        
        // Should include specific anniversary badges
        const badgeTypes = anniversaryBadges.map(b => b.type);
        expect(badgeTypes).toContain(SpecialBadgeType.ONE_MONTH_ANNIVERSARY);
        expect(badgeTypes).toContain(SpecialBadgeType.SIX_MONTH_ANNIVERSARY);
        expect(badgeTypes).toContain(SpecialBadgeType.ONE_YEAR_ANNIVERSARY);
      });

      test('should return all weekend badges', () => {
        const weekendBadges = getBadgesByCategory('Weekend');
        
        expect(weekendBadges.length).toBeGreaterThan(0);
        weekendBadges.forEach(badge => {
          expect(badge.category).toBe('Weekend');
        });
        
        // Should include specific weekend badges
        const badgeTypes = weekendBadges.map(b => b.type);
        expect(badgeTypes).toContain(SpecialBadgeType.WEEKEND_WARRIOR);
        expect(badgeTypes).toContain(SpecialBadgeType.SATURDAY_SPECIAL);
        expect(badgeTypes).toContain(SpecialBadgeType.SUNDAY_FUNDAY);
      });

      test('should return empty array for invalid category', () => {
        const badges = getBadgesByCategory('InvalidCategory' as any);
        
        expect(badges).toEqual([]);
      });
    });

    describe('getBadgesByRarity (Special Badges)', () => {
      test('should return badges for each rarity level', () => {
        const rarities: BadgeMetadata['rarity'][] = ['Common', 'Rare', 'Epic', 'Legendary'];
        
        rarities.forEach(rarity => {
          const badges = getBadgesByRarity(rarity);
          badges.forEach(badge => {
            expect(badge.rarity).toBe(rarity);
          });
        });
      });

      test('should have legendary badges with appropriate rarity', () => {
        const legendaryBadges = getBadgesByRarity('Legendary');
        
        expect(legendaryBadges.length).toBeGreaterThan(0);
        
        // Check specific legendary badges
        const badgeTypes = legendaryBadges.map(b => b.type);
        expect(badgeTypes).toContain(SpecialBadgeType.LUCKY_DAY);
        expect(badgeTypes).toContain(SpecialBadgeType.ONE_YEAR_ANNIVERSARY);
      });

      test('should return empty array for invalid rarity', () => {
        const badges = getBadgesByRarity('InvalidRarity' as any);
        
        expect(badges).toEqual([]);
      });
    });
  });

  describe('Season and Time Utility Functions', () => {
    describe('getCurrentSeason', () => {
      test('should return valid season', () => {
        const season = getCurrentSeason();
        const validSeasons = ['spring', 'summer', 'autumn', 'winter'];
        
        expect(validSeasons).toContain(season);
      });

      test('should return consistent season for same month', () => {
        // Mock date to ensure consistent testing
        const originalDate = Date;
        
        // Test specific months
        const testCases = [
          { month: 2, expectedSeason: 'spring' }, // March
          { month: 5, expectedSeason: 'summer' }, // June
          { month: 8, expectedSeason: 'autumn' }, // September
          { month: 11, expectedSeason: 'winter' } // December
        ];

        testCases.forEach(({ month, expectedSeason }) => {
          const mockDate = new Date(2024, month, 15); // Middle of month
          jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
          
          const season = getCurrentSeason();
          expect(season).toBe(expectedSeason);
          
          jest.restoreAllMocks();
        });
      });
    });

    describe('isWeekend', () => {
      test('should return true for Saturday and Sunday', () => {
        const originalDate = Date;
        
        // Test Saturday (day 6)
        const saturday = new Date(2024, 0, 6); // January 6, 2024 is a Saturday
        jest.spyOn(global, 'Date').mockImplementation(() => saturday as any);
        expect(isWeekend()).toBe(true);
        
        // Test Sunday (day 0)
        const sunday = new Date(2024, 0, 7); // January 7, 2024 is a Sunday
        jest.spyOn(global, 'Date').mockImplementation(() => sunday as any);
        expect(isWeekend()).toBe(true);
        
        jest.restoreAllMocks();
      });

      test('should return false for weekdays', () => {
        const originalDate = Date;
        
        // Test Monday through Friday
        for (let i = 1; i <= 5; i++) {
          const weekday = new Date(2024, 0, i + 1); // January 2-6, 2024 are Tuesday-Saturday
          if (weekday.getDay() !== 0 && weekday.getDay() !== 6) { // Skip if accidentally weekend
            jest.spyOn(global, 'Date').mockImplementation(() => weekday as any);
            expect(isWeekend()).toBe(false);
          }
        }
        
        jest.restoreAllMocks();
      });
    });

    describe('getDayOfWeek', () => {
      test('should return correct day name', () => {
        const originalDate = Date;
        
        const testCases = [
          { date: new Date(2024, 0, 7), expected: 'sunday' },
          { date: new Date(2024, 0, 1), expected: 'monday' },
          { date: new Date(2024, 0, 2), expected: 'tuesday' },
          { date: new Date(2024, 0, 3), expected: 'wednesday' },
          { date: new Date(2024, 0, 4), expected: 'thursday' },
          { date: new Date(2024, 0, 5), expected: 'friday' },
          { date: new Date(2024, 0, 6), expected: 'saturday' }
        ];

        testCases.forEach(({ date, expected }) => {
          jest.spyOn(global, 'Date').mockImplementation(() => date as any);
          
          const dayOfWeek = getDayOfWeek();
          expect(dayOfWeek).toBe(expected);
          
          jest.restoreAllMocks();
        });
      });
    });
  });

  describe('Badge Business Logic Validation', () => {
    test('should have appropriate rarity distribution', () => {
      const rarityCount = {
        Common: 0,
        Rare: 0,
        Epic: 0,
        Legendary: 0
      };

      Object.values(BADGE_METADATA).forEach(badge => {
        rarityCount[badge.rarity]++;
      });

      // All rarities should exist
      Object.values(rarityCount).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });

      // Legendary should be rarest
      expect(rarityCount.Legendary).toBeLessThan(rarityCount.Common);
    });

    test('should have meaningful category distribution', () => {
      const categoryCount = {
        Seasonal: 0,
        Surprise: 0,
        Anniversary: 0,
        Weekend: 0,
        Regular: 0
      };

      Object.values(BADGE_METADATA).forEach(badge => {
        categoryCount[badge.category]++;
      });

      // All categories should exist
      Object.values(categoryCount).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });

      // Should have 4 seasonal badges (one per season)
      expect(categoryCount.Seasonal).toBe(4);
    });

    test('should have consistent naming patterns', () => {
      // Anniversary badges should mention time periods
      const anniversaryBadges = getBadgesByCategory('Anniversary');
      anniversaryBadges.forEach(badge => {
        expect(badge.name).toMatch(/記念|誕生日/);
      });

      // Weekend badges should mention weekend concepts
      const weekendBadges = getBadgesByCategory('Weekend');
      weekendBadges.forEach(badge => {
        expect(badge.name).toMatch(/週末|土曜|日曜|戦士/);
      });

      // Seasonal badges should mention seasonal concepts
      const seasonalBadges = getBadgesByCategory('Seasonal');
      seasonalBadges.forEach(badge => {
        expect(badge.name).toMatch(/春|夏|秋|冬|季節/);
      });
    });

    test('should have appropriate step thresholds for special badges', () => {
      // Weekend warrior should have high threshold
      const weekendWarrior = getBadgeMetadata(SpecialBadgeType.WEEKEND_WARRIOR);
      expect(weekendWarrior?.description).toContain('10000歩');

      // Early bird should have moderate threshold
      const earlyBird = getBadgeMetadata(SpecialBadgeType.EARLY_BIRD);
      expect(earlyBird?.description).toContain('朝5時前');
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { 
  BadgeDefinition, 
  BADGE_DEFINITIONS, 
  getBadgeDefinition, 
  getBadgesByCategory, 
  getBadgesByRarity,
  getRarityColor,
  getCategoryIcon 
} from '../../constants/badgeDefinitions';

describe('Badge Data Model', () => {
  describe('BadgeDefinition Interface', () => {
    test('should have valid badge definition structure', () => {
      const sampleBadge = BADGE_DEFINITIONS[0];
      
      expect(sampleBadge).toHaveProperty('id');
      expect(sampleBadge).toHaveProperty('name');
      expect(sampleBadge).toHaveProperty('description');
      expect(sampleBadge).toHaveProperty('icon');
      expect(sampleBadge).toHaveProperty('category');
      expect(sampleBadge).toHaveProperty('rarity');
      expect(sampleBadge).toHaveProperty('requirement');
      
      expect(typeof sampleBadge.id).toBe('string');
      expect(typeof sampleBadge.name).toBe('string');
      expect(typeof sampleBadge.description).toBe('string');
      expect(typeof sampleBadge.icon).toBe('string');
      expect(typeof sampleBadge.category).toBe('string');
      expect(typeof sampleBadge.rarity).toBe('string');
      expect(typeof sampleBadge.requirement).toBe('string');
    });

    test('should have valid category values', () => {
      const validCategories = ['steps', 'streak', 'special', 'milestone'];
      
      BADGE_DEFINITIONS.forEach(badge => {
        expect(validCategories).toContain(badge.category);
      });
    });

    test('should have valid rarity values', () => {
      const validRarities = ['common', 'rare', 'epic', 'legendary'];
      
      BADGE_DEFINITIONS.forEach(badge => {
        expect(validRarities).toContain(badge.rarity);
      });
    });

    test('should have unique badge IDs', () => {
      const ids = BADGE_DEFINITIONS.map(badge => badge.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should have non-empty strings for all required fields', () => {
      BADGE_DEFINITIONS.forEach(badge => {
        expect(badge.id.trim().length).toBeGreaterThan(0);
        expect(badge.name.trim().length).toBeGreaterThan(0);
        expect(badge.description.trim().length).toBeGreaterThan(0);
        expect(badge.icon.trim().length).toBeGreaterThan(0);
        expect(badge.requirement.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Badge Utility Functions', () => {
    describe('getBadgeDefinition', () => {
      test('should return badge for valid ID', () => {
        const badge = getBadgeDefinition('7500_steps');
        
        expect(badge).toBeDefined();
        expect(badge?.id).toBe('7500_steps');
        expect(badge?.name).toBe('1日7500歩達成');
      });

      test('should return undefined for invalid ID', () => {
        const badge = getBadgeDefinition('non_existent_badge');
        
        expect(badge).toBeUndefined();
      });

      test('should return undefined for empty string', () => {
        const badge = getBadgeDefinition('');
        
        expect(badge).toBeUndefined();
      });
    });

    describe('getBadgesByCategory', () => {
      test('should return all badges for valid category', () => {
        const stepsBadges = getBadgesByCategory('steps');
        
        expect(stepsBadges.length).toBeGreaterThan(0);
        stepsBadges.forEach(badge => {
          expect(badge.category).toBe('steps');
        });
      });

      test('should return empty array for invalid category', () => {
        const badges = getBadgesByCategory('invalid' as any);
        
        expect(badges).toEqual([]);
      });

      test('should return correct count for each category', () => {
        const categories = ['steps', 'streak', 'special', 'milestone'] as const;
        
        categories.forEach(category => {
          const badges = getBadgesByCategory(category);
          const expectedCount = BADGE_DEFINITIONS.filter(b => b.category === category).length;
          
          expect(badges.length).toBe(expectedCount);
        });
      });
    });

    describe('getBadgesByRarity', () => {
      test('should return all badges for valid rarity', () => {
        const commonBadges = getBadgesByRarity('common');
        
        expect(commonBadges.length).toBeGreaterThan(0);
        commonBadges.forEach(badge => {
          expect(badge.rarity).toBe('common');
        });
      });

      test('should return empty array for invalid rarity', () => {
        const badges = getBadgesByRarity('invalid' as any);
        
        expect(badges).toEqual([]);
      });

      test('should return correct count for each rarity', () => {
        const rarities = ['common', 'rare', 'epic', 'legendary'] as const;
        
        rarities.forEach(rarity => {
          const badges = getBadgesByRarity(rarity);
          const expectedCount = BADGE_DEFINITIONS.filter(b => b.rarity === rarity).length;
          
          expect(badges.length).toBe(expectedCount);
        });
      });
    });

    describe('getRarityColor', () => {
      test('should return correct colors for each rarity', () => {
        expect(getRarityColor('common')).toBe('#6B7280');
        expect(getRarityColor('rare')).toBe('#3B82F6');
        expect(getRarityColor('epic')).toBe('#8B5CF6');
        expect(getRarityColor('legendary')).toBe('#F59E0B');
      });

      test('should return default color for invalid rarity', () => {
        expect(getRarityColor('invalid' as any)).toBe('#6B7280');
      });
    });

    describe('getCategoryIcon', () => {
      test('should return correct icons for each category', () => {
        expect(getCategoryIcon('steps')).toBe('👟');
        expect(getCategoryIcon('streak')).toBe('🔥');
        expect(getCategoryIcon('milestone')).toBe('🎯');
        expect(getCategoryIcon('special')).toBe('⭐');
      });

      test('should return default icon for invalid category', () => {
        expect(getCategoryIcon('invalid' as any)).toBe('🏅');
      });
    });
  });

  describe('Badge Business Logic', () => {
    test('should have proper distribution of rarities', () => {
      const rarityCount = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      };

      BADGE_DEFINITIONS.forEach(badge => {
        rarityCount[badge.rarity]++;
      });

      // Common badges should be most numerous
      expect(rarityCount.common).toBeGreaterThan(0);
      
      // There should be fewer legendary badges than common ones
      expect(rarityCount.legendary).toBeLessThan(rarityCount.common);
      
      // All rarities should exist
      Object.values(rarityCount).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });

    test('should have meaningful step progression in step badges', () => {
      const stepsBadges = getBadgesByCategory('steps')
        .filter(badge => badge.id.includes('steps'))
        .sort((a, b) => {
          const aSteps = parseInt(a.id.replace('_steps', ''));
          const bSteps = parseInt(b.id.replace('_steps', ''));
          return aSteps - bSteps;
        });

      // Should have progression from lower to higher step counts
      expect(stepsBadges.length).toBeGreaterThanOrEqual(2);
      
      for (let i = 1; i < stepsBadges.length; i++) {
        const prevSteps = parseInt(stepsBadges[i-1].id.replace('_steps', ''));
        const currentSteps = parseInt(stepsBadges[i].id.replace('_steps', ''));
        
        expect(currentSteps).toBeGreaterThan(prevSteps);
      }
    });

    test('should have meaningful streak progression in streak badges', () => {
      const streakBadges = getBadgesByCategory('streak')
        .filter(badge => badge.id.includes('days_streak'))
        .sort((a, b) => {
          const aDays = parseInt(a.id.replace('days_streak', ''));
          const bDays = parseInt(b.id.replace('days_streak', ''));
          return aDays - bDays;
        });

      // Should have progression from shorter to longer streaks
      expect(streakBadges.length).toBeGreaterThanOrEqual(2);
      
      for (let i = 1; i < streakBadges.length; i++) {
        const prevDays = parseInt(streakBadges[i-1].id.replace('days_streak', ''));
        const currentDays = parseInt(streakBadges[i].id.replace('days_streak', ''));
        
        expect(currentDays).toBeGreaterThan(prevDays);
      }
    });
  });

  describe('Badge Validation', () => {
    test('should validate step-based badge requirements', () => {
      const stepsBadge = getBadgeDefinition('10000_steps');
      
      expect(stepsBadge).toBeDefined();
      expect(stepsBadge?.requirement).toContain('10000歩');
      expect(stepsBadge?.description).toContain('10000歩');
    });

    test('should validate streak-based badge requirements', () => {
      const streakBadge = getBadgeDefinition('7days_streak');
      
      expect(streakBadge).toBeDefined();
      expect(streakBadge?.requirement).toContain('7日連続');
      expect(streakBadge?.description).toContain('7日連続');
    });

    test('should have consistent naming convention', () => {
      BADGE_DEFINITIONS.forEach(badge => {
        // Badge IDs should use snake_case
        expect(badge.id).toMatch(/^[a-z0-9_]+$/);
        
        // Badge names should not be empty
        expect(badge.name.trim()).not.toBe('');
        
        // Descriptions should end with appropriate punctuation
        expect(badge.description).toMatch(/[。！]$/);
      });
    });
  });
});

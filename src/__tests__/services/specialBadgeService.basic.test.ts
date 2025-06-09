// Simple test to verify Jest is working with specialBadgeService
import { SpecialBadgeType } from '../../services/specialBadgeService';

describe('SpecialBadgeService Basic', () => {
  test('should import SpecialBadgeType enum', () => {
    expect(SpecialBadgeType.SPRING_AWAKENING).toBe('spring_awakening');
  });
});

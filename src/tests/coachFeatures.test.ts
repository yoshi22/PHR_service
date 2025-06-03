import * as coachService from '../services/coachService';

describe('Coach Features', () => {
  const testUserId = 'test-user-id';

  test('getUserGoals should retrieve user goals', async () => {
    try {
      const goals = await coachService.getUserGoals(testUserId);
      // We're mainly testing if this doesn't throw a permission error
      console.log(`Retrieved ${goals.length} goals for user`);
    } catch (error) {
      console.error('Error in getUserGoals test:', error);
      throw error; // Re-throw to make test fail
    }
  });

  test('getTodayCheckin should retrieve or return null', async () => {
    try {
      const checkin = await coachService.getTodayCheckin(testUserId);
      // Just testing if this doesn't throw a permission error
      console.log('Daily checkin retrieved:', checkin ? 'yes' : 'no checkin today');
    } catch (error) {
      console.error('Error in getTodayCheckin test:', error);
      throw error; // Re-throw to make test fail
    }
  });
});

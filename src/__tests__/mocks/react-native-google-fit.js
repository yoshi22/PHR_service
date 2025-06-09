// Mock for react-native-google-fit
export const GoogleFit = {
  checkIsAuthorized: jest.fn(() => Promise.resolve(true)),
  authorize: jest.fn(() => Promise.resolve({ success: true })),
  disconnect: jest.fn(() => Promise.resolve(true)),
  isEnabled: jest.fn(() => Promise.resolve(true)),
  isAvailable: jest.fn(() => Promise.resolve(true)),
  getDailyStepCountSamples: jest.fn(() => Promise.resolve([
    {
      source: {
        appPackage: 'com.google.android.gms',
        name: 'Google Fit',
      },
      steps: [
        {
          date: new Date().toISOString().split('T')[0],
          value: 1000,
        }
      ]
    }
  ])),
  getWeeklySteps: jest.fn(() => Promise.resolve([
    {
      week: new Date().toISOString().split('T')[0],
      value: 7000,
    }
  ])),
  getDailyCalorieSamples: jest.fn(() => Promise.resolve([])),
  getDailyDistanceSamples: jest.fn(() => Promise.resolve([])),
  getActivitySamples: jest.fn(() => Promise.resolve([])),
  getHeartRateSamples: jest.fn(() => Promise.resolve([])),
  getWeightSamples: jest.fn(() => Promise.resolve([])),
  getHeightSamples: jest.fn(() => Promise.resolve([])),
  saveFood: jest.fn(() => Promise.resolve(true)),
  saveWeight: jest.fn(() => Promise.resolve(true)),
  saveHeight: jest.fn(() => Promise.resolve(true)),
  deleteWeight: jest.fn(() => Promise.resolve(true)),
  isEnabledAndroidPermissions: jest.fn(() => Promise.resolve(true)),
  openFit: jest.fn(() => Promise.resolve(true)),
  subscribeToSteps: jest.fn(() => Promise.resolve(true)),
  unsubscribeFromSteps: jest.fn(() => Promise.resolve(true)),
};

export const Scopes = {
  FITNESS_ACTIVITY_READ: 'https://www.googleapis.com/auth/fitness.activity.read',
  FITNESS_ACTIVITY_WRITE: 'https://www.googleapis.com/auth/fitness.activity.write',
  FITNESS_BODY_READ: 'https://www.googleapis.com/auth/fitness.body.read',
  FITNESS_BODY_WRITE: 'https://www.googleapis.com/auth/fitness.body.write',
  FITNESS_LOCATION_READ: 'https://www.googleapis.com/auth/fitness.location.read',
  FITNESS_LOCATION_WRITE: 'https://www.googleapis.com/auth/fitness.location.write',
};

export default GoogleFit;

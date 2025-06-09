// Mock for react-native-health
export const HealthKit = {
  isAvailable: jest.fn(() => Promise.resolve(true)),
  initHealthKit: jest.fn(() => Promise.resolve(true)),
  getAuthStatus: jest.fn(() => Promise.resolve(2)), // authorized
  requestAuthorization: jest.fn(() => Promise.resolve(true)),
  getDailyStepCountSamples: jest.fn(() => Promise.resolve([
    {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      value: 1000,
    }
  ])),
  getStepCount: jest.fn(() => Promise.resolve({ value: 1000 })),
  getSamples: jest.fn(() => Promise.resolve([])),
  saveFood: jest.fn(() => Promise.resolve(true)),
  saveWeight: jest.fn(() => Promise.resolve(true)),
  getLatestWeight: jest.fn(() => Promise.resolve({ value: 70 })),
  getLatestHeight: jest.fn(() => Promise.resolve({ value: 170 })),
  getLatestBmi: jest.fn(() => Promise.resolve({ value: 24.2 })),
  saveSteps: jest.fn(() => Promise.resolve(true)),
  getHeartRateSamples: jest.fn(() => Promise.resolve([])),
  getBloodPressureSamples: jest.fn(() => Promise.resolve([])),
  saveMindfulSession: jest.fn(() => Promise.resolve(true)),
  getWorkout: jest.fn(() => Promise.resolve([])),
  saveWorkout: jest.fn(() => Promise.resolve(true)),
  Constants: {
    Permissions: {
      Steps: {
        Read: 'Steps.Read',
        Write: 'Steps.Write',
      },
      StepCount: {
        Read: 'StepCount.Read',
      },
      Height: {
        Read: 'Height.Read',
        Write: 'Height.Write',
      },
      Weight: {
        Read: 'Weight.Read',
        Write: 'Weight.Write',
      },
      HeartRate: {
        Read: 'HeartRate.Read',
      },
      BloodPressure: {
        Read: 'BloodPressure.Read',
      },
    },
  },
};

// Also export individual items for named imports
export const Permissions = {
  Steps: {
    Read: 'Steps.Read',
    Write: 'Steps.Write',
  },
  StepCount: {
    Read: 'StepCount.Read',
  },
  Height: {
    Read: 'Height.Read',
    Write: 'Height.Write',
  },
  Weight: {
    Read: 'Weight.Read',
    Write: 'Weight.Write',
  },
  HeartRate: {
    Read: 'HeartRate.Read',
  },
  BloodPressure: {
    Read: 'BloodPressure.Read',
  },
};

export const HealthValue = {};
export const HealthKitPermissions = {};

export const Units = {
  count: 'count',
  meter: 'm',
  kilogram: 'kg',
  bpm: 'bpm',
  mmhg: 'mmHg',
};

// Export HealthKit as default (AppleHealthKit)
export default HealthKit;

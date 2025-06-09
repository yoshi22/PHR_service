// Mock for healthService
export const initHealthKit = jest.fn(() => Promise.resolve(true));
export const getTodayStepsIOS = jest.fn(() => Promise.resolve(1000));
export const initGoogleFit = jest.fn(() => Promise.resolve(true));
export const getTodayStepsAndroid = jest.fn(() => Promise.resolve(1000));
export const getStepsData = jest.fn(() => Promise.resolve({ value: 1000 }));
export const requestHealthPermissions = jest.fn(() => Promise.resolve(true));
export const getHealthKitPermissions = jest.fn(() => Promise.resolve(true));
export const getGoogleFitPermissions = jest.fn(() => Promise.resolve(true));
export const saveStepsToHealth = jest.fn(() => Promise.resolve(true));
export const getHistoricalSteps = jest.fn(() => Promise.resolve([]));
export const getWeeklySteps = jest.fn(() => Promise.resolve([]));
export const getMonthlySteps = jest.fn(() => Promise.resolve([]));

export default {
  initHealthKit,
  getTodayStepsIOS,
  initGoogleFit,
  getTodayStepsAndroid,
  getStepsData,
  requestHealthPermissions,
  getHealthKitPermissions,
  getGoogleFitPermissions,
  saveStepsToHealth,
  getHistoricalSteps,
  getWeeklySteps,
  getMonthlySteps,
};

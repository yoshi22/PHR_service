import {
  checkPermissions,
  initHealthKit,
  getTodayStepsIOS,
  initGoogleFit,
  getTodayStepsAndroid,
  getTodaySteps
} from '../../services/healthService';

// Mock React Native and platform detection
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios' // Default to iOS, can be changed in individual tests
  },
  NativeModules: {},
  DeviceEventEmitter: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock AppleHealthKit
jest.mock('react-native-health', () => ({
  isAvailable: jest.fn(),
  initHealthKit: jest.fn(),
  getStepCount: jest.fn(),
  Constants: {
    Permissions: {
      StepCount: 'StepCount',
      Weight: 'Weight',
    },
  },
}));

// Mock GoogleFit
jest.mock('react-native-google-fit', () => ({
  authorize: jest.fn(),
  isAuthorized: jest.fn(),
  getDailyStepCountSamples: jest.fn(),
  Scopes: {
    FITNESS_ACTIVITY_READ: 'FITNESS_ACTIVITY_READ',
  },
}));

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit from 'react-native-health';
import GoogleFit from 'react-native-google-fit';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockAppleHealthKit = AppleHealthKit as jest.Mocked<typeof AppleHealthKit>;
const mockGoogleFit = GoogleFit as jest.Mocked<typeof GoogleFit>;

describe('HealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset platform to iOS by default
    (Platform as any).OS = 'ios';
    // Reset AsyncStorage mock to return resolved promises
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  describe('checkPermissions', () => {
    it('should return true when permissions are granted', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const result = await checkPermissions();

      expect(result).toBe(true);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('health_permissions_granted');
    });

    it('should return false when permissions are not granted', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('false');

      const result = await checkPermissions();

      expect(result).toBe(false);
    });
  });
});

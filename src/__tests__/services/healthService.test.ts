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

    it('should return false when no permissions data is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await checkPermissions();

      expect(result).toBe(false);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await checkPermissions();

      expect(result).toBe(false);
    });
  });

  describe('initHealthKit', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('should initialize HealthKit successfully on iOS', async () => {
      mockAppleHealthKit.initHealthKit.mockImplementation((permissions, callback) => {
        callback('', {
          value: 0,
          startDate: '',
          endDate: ''
        }); // No error, dummy HealthValue for initHealthKit
      });

      await initHealthKit();

      expect(mockAppleHealthKit.initHealthKit).toHaveBeenCalledWith(
        {
          permissions: {
            read: [AppleHealthKit.Constants.Permissions.StepCount, AppleHealthKit.Constants.Permissions.Weight],
            write: [],
          },
        },
        expect.any(Function)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('health_permissions_granted', 'true');
    });

    it('should handle HealthKit initialization failure', async () => {
      mockAppleHealthKit.initHealthKit.mockImplementation((permissions, callback) => {
        callback('Initialization failed', {
          value: 0,
          startDate: '',
          endDate: ''
        }); // Error with dummy HealthValue
      });

      await expect(initHealthKit()).rejects.toThrow('Initialization failed');
    });

    it('should handle HealthKit API not available', async () => {
      (mockAppleHealthKit.initHealthKit as any) = undefined;

      await expect(initHealthKit()).rejects.toThrow('HealthKit initialization failed: API not available');
    });
  });

  describe('getTodayStepsIOS', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      // Mock Date.now() to return a consistent time
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T12:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should get today\'s steps successfully', async () => {
      mockAppleHealthKit.getStepCount.mockImplementation((options, callback) => {
        callback('', { 
          value: 5000,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-15T23:59:59.999Z'
        });
      });

      const result = await getTodayStepsIOS();

      expect(result).toBe(5000);
      expect(mockAppleHealthKit.getStepCount).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        }),
        expect.any(Function)
      );
    });

    it('should handle HealthKit errors', async () => {
      mockAppleHealthKit.getStepCount.mockImplementation((options, callback) => {
        callback('Failed to get steps', { 
          value: 0,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-15T23:59:59.999Z'
        });
      });

      const result = await getTodayStepsIOS();

      expect(result).toBe(0);
    });

    it('should handle missing step data', async () => {
      mockAppleHealthKit.getStepCount.mockImplementation((options, callback) => {
        callback('', { 
          value: 0,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-15T23:59:59.999Z'
        });
      });

      const result = await getTodayStepsIOS();

      expect(result).toBe(0);
    });

    it('should handle edge case: near midnight', async () => {
      // Mock a specific time close to midnight
      const mockDate = new Date('2024-01-15T23:59:59.999Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = jest.fn(() => mockDate.getTime());

      mockAppleHealthKit.getStepCount.mockImplementation((options: any, callback: any) => {
        // Verify date range handles edge case correctly
        const startDate = new Date(options.startDate);
        const endDate = new Date(options.endDate);
        
        expect(startDate.getDate()).toBe(mockDate.getDate());
        expect(endDate.getDate()).toBe(mockDate.getDate());
        
        callback('', { 
          value: 1000,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-15T23:59:59.999Z'
        });
      });

      const result = await getTodayStepsIOS();
      expect(result).toBe(1000);

      // Restore Date
      global.Date = originalDate;
    });
  });

  describe('initGoogleFit', () => {
    beforeEach(() => {
      (Platform as any).OS = 'android';
    });

    it('should initialize Google Fit successfully on Android', async () => {
      mockGoogleFit.authorize.mockResolvedValue({ success: true });

      await initGoogleFit();

      expect(mockGoogleFit.authorize).toHaveBeenCalledWith({
        scopes: ['FITNESS_ACTIVITY_READ'],
      });
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('health_permissions_granted', 'true');
    });

    it('should handle Google Fit authorization failure', async () => {
      mockGoogleFit.authorize.mockResolvedValue({ success: false, message: 'Authorization failed' });

      await expect(initGoogleFit()).rejects.toThrow('Google Fit の接続でエラーが発生しました');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('health_permissions_granted', 'false');
    });

    it('should handle Google Fit authorization errors', async () => {
      mockGoogleFit.authorize.mockRejectedValue(new Error('Network error'));

      await expect(initGoogleFit()).rejects.toThrow('Google Fit の接続でエラーが発生しました');
    });
  });

  describe('getTodayStepsAndroid', () => {
    beforeEach(() => {
      (Platform as any).OS = 'android';
      // Mock Date.now() to return a consistent time
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T12:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should get today\'s steps successfully', async () => {
      const mockStepData = [
        {
          source: 'com.google.android.gms:estimated_steps',
          steps: [{ date: '2024-01-15', value: 3000 }],
          rawSteps: []
        }
      ];
      mockGoogleFit.getDailyStepCountSamples.mockResolvedValue(mockStepData);

      const result = await getTodayStepsAndroid();

      expect(result).toBe(3000);
      expect(mockGoogleFit.getDailyStepCountSamples).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        })
      );
    });

    it('should handle empty step data', async () => {
      mockGoogleFit.getDailyStepCountSamples.mockResolvedValue([]);

      const result = await getTodayStepsAndroid();

      expect(result).toBe(0);
    });

    it('should handle Google Fit errors', async () => {
      mockGoogleFit.getDailyStepCountSamples.mockRejectedValue(new Error('Failed to get steps'));

      const result = await getTodayStepsAndroid();

      expect(result).toBe(0);
    });

    it('should prioritize estimated steps over other sources', async () => {
      const mockStepData = [
        {
          source: 'some.other.source',
          steps: [{ date: '2024-01-15', value: 1000 }],
          rawSteps: []
        },
        {
          source: 'com.google.android.gms:estimated_steps',
          steps: [{ date: '2024-01-15', value: 5000 }],
          rawSteps: []
        }
      ];
      mockGoogleFit.getDailyStepCountSamples.mockResolvedValue(mockStepData);

      const result = await getTodayStepsAndroid();

      expect(result).toBe(5000);
    });

    it('should sum multiple step sources when no estimated steps available', async () => {
      const mockStepData = [
        {
          source: 'source1',
          steps: [{ date: '2024-01-15', value: 1000 }],
          rawSteps: []
        },
        {
          source: 'source2',
          steps: [{ date: '2024-01-15', value: 2000 }],
          rawSteps: []
        }
      ];
      mockGoogleFit.getDailyStepCountSamples.mockResolvedValue(mockStepData);

      const result = await getTodayStepsAndroid();

      expect(result).toBe(3000);
    });
  });

  describe('getTodaySteps', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call iOS function on iOS platform', async () => {
      (Platform as any).OS = 'ios';
      mockAppleHealthKit.getStepCount.mockImplementation((options, callback) => {
        callback('', { 
          value: 4000,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-15T23:59:59.999Z'
        });
      });

      const result = await getTodaySteps();

      expect(result).toBe(4000);
    });

    it('should call Android function on Android platform', async () => {
      (Platform as any).OS = 'android';
      const mockStepData = [
        {
          source: 'com.google.android.gms:estimated_steps',
          steps: [{ date: '2024-01-15', value: 6000 }],
          rawSteps: []
        }
      ];
      mockGoogleFit.getDailyStepCountSamples.mockResolvedValue(mockStepData);

      const result = await getTodaySteps();

      expect(result).toBe(6000);
    });

    it('should throw error for unsupported platforms', async () => {
      (Platform as any).OS = 'web';

      await expect(getTodaySteps()).rejects.toThrow('Unsupported platform: web');
    });

    it('should handle iOS function errors', async () => {
      (Platform as any).OS = 'ios';
      mockAppleHealthKit.getStepCount.mockImplementation((options, callback) => {
        callback('iOS error', { 
          value: 0,
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-15T23:59:59.999Z'
        });
      });

      const result = await getTodaySteps();

      expect(result).toBe(0);
    });

    it('should handle Android function errors', async () => {
      (Platform as any).OS = 'android';
      mockGoogleFit.getDailyStepCountSamples.mockRejectedValue(new Error('Android error'));

      const result = await getTodaySteps();

      expect(result).toBe(0);
    });
  });
});

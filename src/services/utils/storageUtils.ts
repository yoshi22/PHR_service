/**
 * Utility functions for standardized storage operations across services
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheMetadata, ServiceResult } from '../types';
import { CACHE_EXPIRATION_MS, STORAGE_KEYS } from '../constants';
import { createSuccessResult, createErrorResult } from './serviceUtils';

/**
 * Storage utility class for consistent data persistence
 */
export class StorageUtils {
  /**
   * Generates a storage key with user context
   */
  static generateKey(userId: string, type: keyof typeof STORAGE_KEYS): string {
    return `${STORAGE_KEYS[type]}_${userId}`;
  }

  /**
   * Stores data with expiration (generic version)
   */
  static async setWithExpiry<T>(
    key: string,
    data: T,
    ttlMs: number
  ): Promise<void> {
    const expiry = Date.now() + ttlMs;
    const cacheEntry = {
      data,
      expiry,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
  }

  /**
   * Gets data with expiration check (generic version)
   */
  static async getWithExpiry<T>(key: string): Promise<T | null> {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;

    try {
      const cacheEntry = JSON.parse(stored);
      if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      return cacheEntry.data as T;
    } catch {
      return null;
    }
  }

  /**
   * Removes data from storage (generic version)
   */
  static async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  /**
   * Stores data with metadata and expiration
   */
  static async set<T>(
    userId: string,
    type: keyof typeof STORAGE_KEYS,
    data: T,
    expirationMs = CACHE_EXPIRATION_MS
  ): Promise<ServiceResult<void>> {
    try {
      const key = this.generateKey(userId, type);
      const expiry = new Date(Date.now() + expirationMs);
      
      const cacheEntry = {
        data,
        metadata: {
          key,
          expiry,
          version: 1,
          userId,
        } as CacheMetadata,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      return createSuccessResult(undefined);
    } catch (error) {
      console.error('Storage set error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to store data', error);
    }
  }

  /**
   * Retrieves data with expiration check
   */
  static async get<T>(
    userId: string,
    type: keyof typeof STORAGE_KEYS
  ): Promise<ServiceResult<T | null>> {
    try {
      const key = this.generateKey(userId, type);
      const stored = await AsyncStorage.getItem(key);

      if (!stored) {
        return createSuccessResult(null);
      }

      const cacheEntry = JSON.parse(stored);
      const metadata = cacheEntry.metadata as CacheMetadata;

      // Check expiration
      if (metadata.expiry && new Date(metadata.expiry) < new Date()) {
        console.log('Cache expired, removing:', key);
        await this.removeByType(userId, type);
        return createSuccessResult(null);
      }

      return createSuccessResult(cacheEntry.data as T);
    } catch (error) {
      console.error('Storage get error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to retrieve data', error);
    }
  }

  /**
   * Removes data from storage by user and type
   */
  static async removeByType(
    userId: string,
    type: keyof typeof STORAGE_KEYS
  ): Promise<ServiceResult<void>> {
    try {
      const key = this.generateKey(userId, type);
      await AsyncStorage.removeItem(key);
      return createSuccessResult(undefined);
    } catch (error) {
      console.error('Storage remove error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to remove data', error);
    }
  }

  /**
   * Checks if cached data exists and is valid
   */
  static async isValid(
    userId: string,
    type: keyof typeof STORAGE_KEYS
  ): Promise<ServiceResult<boolean>> {
    try {
      const key = this.generateKey(userId, type);
      const stored = await AsyncStorage.getItem(key);

      if (!stored) {
        return createSuccessResult(false);
      }

      const cacheEntry = JSON.parse(stored);
      const metadata = cacheEntry.metadata as CacheMetadata;

      // Check if expired
      if (metadata.expiry && new Date(metadata.expiry) < new Date()) {
        return createSuccessResult(false);
      }

      return createSuccessResult(true);
    } catch (error) {
      console.error('Storage validation error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to validate cache', error);
    }
  }

  /**
   * Gets cache metadata without retrieving data
   */
  static async getMetadata(
    userId: string,
    type: keyof typeof STORAGE_KEYS
  ): Promise<ServiceResult<CacheMetadata | null>> {
    try {
      const key = this.generateKey(userId, type);
      const stored = await AsyncStorage.getItem(key);

      if (!stored) {
        return createSuccessResult(null);
      }

      const cacheEntry = JSON.parse(stored);
      return createSuccessResult(cacheEntry.metadata as CacheMetadata);
    } catch (error) {
      console.error('Storage metadata error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to get metadata', error);
    }
  }

  /**
   * Clears all cached data for a user
   */
  static async clearUserCache(userId: string): Promise<ServiceResult<void>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter(key => key.endsWith(`_${userId}`));
      
      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
      }

      return createSuccessResult(undefined);
    } catch (error) {
      console.error('Clear user cache error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to clear user cache', error);
    }
  }

  /**
   * Gets storage usage statistics
   */
  static async getStorageStats(): Promise<ServiceResult<{
    totalKeys: number;
    estimatedSizeKB: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      let oldestEntry: Date | undefined;
      let newestEntry: Date | undefined;

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            
            // Try to parse metadata for date info
            try {
              const parsed = JSON.parse(value);
              if (parsed.metadata?.expiry) {
                const date = new Date(parsed.metadata.expiry);
                if (!oldestEntry || date < oldestEntry) {
                  oldestEntry = date;
                }
                if (!newestEntry || date > newestEntry) {
                  newestEntry = date;
                }
              }
            } catch {
              // Ignore parsing errors for non-cache entries
            }
          }
        } catch {
          // Ignore individual key errors
        }
      }

      return createSuccessResult({
        totalKeys: keys.length,
        estimatedSizeKB: Math.round(totalSize / 1024),
        oldestEntry,
        newestEntry,
      });
    } catch (error) {
      console.error('Storage stats error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to get storage stats', error);
    }
  }

  /**
   * Cleans up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<ServiceResult<number>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let removedCount = 0;

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed.metadata?.expiry) {
              const expiry = new Date(parsed.metadata.expiry);
              if (expiry < new Date()) {
                await AsyncStorage.removeItem(key);
                removedCount++;
              }
            }
          }
        } catch {
          // Ignore individual key errors
        }
      }

      console.log(`Cleaned up ${removedCount} expired cache entries`);
      return createSuccessResult(removedCount);
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return createErrorResult('STORAGE_ERROR', 'Failed to cleanup cache', error);
    }
  }
}

/**
 * Convenience functions for common storage operations
 */

/**
 * Stores user profile data
 */
export async function storeUserProfile(userId: string, profile: any): Promise<ServiceResult<void>> {
  return StorageUtils.set(userId, 'USER_PROFILE', profile);
}

/**
 * Retrieves user profile data
 */
export async function getUserProfile(userId: string): Promise<ServiceResult<any | null>> {
  return StorageUtils.get(userId, 'USER_PROFILE');
}

/**
 * Stores user settings
 */
export async function storeUserSettings(userId: string, settings: any): Promise<ServiceResult<void>> {
  return StorageUtils.set(userId, 'USER_SETTINGS', settings);
}

/**
 * Retrieves user settings
 */
export async function getUserSettings(userId: string): Promise<ServiceResult<any | null>> {
  return StorageUtils.get(userId, 'USER_SETTINGS');
}

/**
 * Stores cached steps data
 */
export async function storeCachedSteps(userId: string, steps: any): Promise<ServiceResult<void>> {
  return StorageUtils.set(userId, 'CACHED_STEPS', steps, CACHE_EXPIRATION_MS);
}

/**
 * Retrieves cached steps data
 */
export async function getCachedSteps(userId: string): Promise<ServiceResult<any | null>> {
  return StorageUtils.get(userId, 'CACHED_STEPS');
}

/**
 * Records last sync timestamp
 */
export async function recordLastSync(userId: string, timestamp = new Date()): Promise<ServiceResult<void>> {
  return StorageUtils.set(userId, 'LAST_SYNC', timestamp.toISOString());
}

/**
 * Gets last sync timestamp
 */
export async function getLastSync(userId: string): Promise<ServiceResult<Date | null>> {
  const result = await StorageUtils.get<string>(userId, 'LAST_SYNC');
  if (!result.success || !result.data) {
    return createSuccessResult(null);
  }
  
  try {
    return createSuccessResult(new Date(result.data));
  } catch (error) {
    return createErrorResult('DATA_CORRUPTED', 'Invalid sync timestamp format');
  }
}
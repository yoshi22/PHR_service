/**
 * Service-level constants for consistent configuration across business logic
 */

// Cache and storage configuration
export const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SYNC_RETRY_ATTEMPTS = 3;
export const SYNC_RETRY_DELAY_MS = 1000;

// Firebase configuration
export const FIREBASE_REGION = 'asia-northeast1';
export const FIRESTORE_HOST = 'asia-northeast1-firestore.googleapis.com';

// External API endpoints
export const FITBIT_API_BASE_URL = 'https://api.fitbit.com/1';
export const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';

// Date and time formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';

// Collection names
export const COLLECTIONS = {
  USER_PROFILES: 'userProfiles',
  USER_SETTINGS: 'userSettings',
  USER_STEPS: 'userSteps',
  USER_BADGES: 'userBadges',
  HEALTH_DATA: 'healthData',
  COACHING_SESSIONS: 'coachingSessions',
  DAILY_BONUS: 'dailyBonus',
  NOTIFICATIONS: 'notifications',
  VOICE_REMINDERS: 'voiceReminders',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  USER_SETTINGS: 'userSettings',
  LAST_SYNC: 'lastSync',
  CACHED_STEPS: 'cachedSteps',
  FITBIT_TOKEN: 'fitbitToken',
  APPLE_HEALTH_PERMISSION: 'appleHealthPermission',
  NOTIFICATION_SETTINGS: 'notificationSettings',
} as const;

// Health data limits and thresholds
export const HEALTH_LIMITS = {
  MAX_DAILY_STEPS: 100000,
  MIN_DAILY_STEPS: 0,
  MAX_HEART_RATE: 220,
  MIN_HEART_RATE: 30,
  MAX_WEIGHT_KG: 500,
  MIN_WEIGHT_KG: 20,
  DEFAULT_STEP_GOAL: 8000,
} as const;

// Badge thresholds
export const BADGE_THRESHOLDS = {
  STEP_MILESTONES: [5000, 8000, 10000, 15000, 20000],
  STREAK_DAYS: [3, 7, 14, 30, 100],
  WEEKLY_GOALS: [5, 10, 20, 50],
  MONTHLY_GOALS: [20, 30, 60, 100],
} as const;

// Notification timing
export const NOTIFICATION_DEFAULTS = {
  DAILY_REMINDER_TIME: '20:00',
  STEP_GOAL_REMINDER_TIME: '18:00',
  WEEKLY_REVIEW_TIME: '09:00',
  BADGE_CELEBRATION_DELAY_MS: 2000,
} as const;

// AI and coaching parameters
export const AI_CONFIG = {
  MAX_TOKENS: 150,
  TEMPERATURE: 0.7,
  MODEL: 'gpt-3.5-turbo',
  MAX_CONVERSATION_HISTORY: 10,
  RESPONSE_TIMEOUT_MS: 30000,
} as const;

// Voice settings
export const VOICE_CONFIG = {
  DEFAULT_LANGUAGE: 'ja-JP',
  MAX_RECORDING_DURATION_MS: 60000,
  SILENCE_THRESHOLD: 0.1,
  QUALITY_BITRATE: 128000,
} as const;

// Error codes for standardized error handling
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Permission errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PERMISSION_REQUIRED: 'PERMISSION_REQUIRED',
  
  // Data errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_INVALID: 'DATA_INVALID',
  DATA_CORRUPTED: 'DATA_CORRUPTED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Service errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// Type definitions for constants
export type CollectionName = keyof typeof COLLECTIONS;
export type StorageKey = keyof typeof STORAGE_KEYS;
export type ErrorCode = keyof typeof ERROR_CODES;
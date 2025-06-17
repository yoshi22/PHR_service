/**
 * Common type definitions for service layer
 */
import { ERROR_CODES } from './constants';

/**
 * Standard service result pattern for consistent error handling
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

/**
 * Standardized error structure for all services
 */
export interface ServiceError {
  code: keyof typeof ERROR_CODES;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Authentication context for service operations
 */
export interface AuthContext {
  userId: string;
  isAuthenticated: boolean;
  permissions?: string[];
}

/**
 * Cache metadata for storage operations
 */
export interface CacheMetadata {
  key: string;
  expiry: Date;
  version: number;
  userId: string;
}

/**
 * Pagination parameters for data queries
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Date range for time-based queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Common health metrics interface
 */
export interface HealthMetrics {
  steps: number;
  heartRate: number;
  calories: number;
  distance: number;
  timestamp: Date;
}

/**
 * Connection state interface
 */
export interface ConnectionState {
  isConnected: boolean;
  isAuthorized: boolean;
  lastSyncTime: Date | null;
  error?: string;
}

/**
 * Health data point structure
 */
export interface HealthDataPoint {
  id: string;
  userId: string;
  type: HealthDataType;
  value: number;
  unit: string;
  timestamp: Date;
  source: DataSource;
  metadata?: Record<string, any>;
}

/**
 * Health data types
 */
export type HealthDataType = 
  | 'steps'
  | 'heartRate'
  | 'weight'
  | 'sleep'
  | 'calories'
  | 'distance'
  | 'activeMinutes'
  | 'bloodPressure'
  | 'bloodGlucose';

/**
 * Data sources
 */
export type DataSource = 
  | 'apple_health'
  | 'fitbit'
  | 'mi_band'
  | 'manual_entry'
  | 'estimated'
  | 'system';

/**
 * User settings structure
 */
export interface UserSettings {
  stepGoal: number;
  notificationTime: string;
  voiceEnabled: boolean;
  coachingEnabled: boolean;
  privacySettings: PrivacySettings;
  deviceSettings: DeviceSettings;
  preferredUnits: PreferredUnits;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  shareHealthData: boolean;
  allowAnalytics: boolean;
  shareWithCoach: boolean;
  dataRetentionDays: number;
}

/**
 * Device integration settings
 */
export interface DeviceSettings {
  appleHealthEnabled: boolean;
  fitbitEnabled: boolean;
  miBandEnabled: boolean;
  automaticSync: boolean;
  syncInterval: number;
}

/**
 * Preferred units for measurements
 */
export interface PreferredUnits {
  distance: 'km' | 'miles';
  weight: 'kg' | 'lbs';
  temperature: 'celsius' | 'fahrenheit';
  height: 'cm' | 'feet';
}

/**
 * Badge definition structure
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  requirements: BadgeRequirements;
  icon: string;
  color: string;
}

/**
 * Badge rarity levels
 */
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Badge categories
 */
export type BadgeCategory = 
  | 'steps'
  | 'consistency'
  | 'goals'
  | 'milestones'
  | 'special'
  | 'seasonal';

/**
 * Badge requirements
 */
export interface BadgeRequirements {
  type: 'steps' | 'streak' | 'goal' | 'special';
  threshold?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  conditions?: Record<string, any>;
}

/**
 * Notification definition
 */
export interface NotificationDefinition {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: Date;
  data?: Record<string, any>;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'step_reminder'
  | 'goal_achievement'
  | 'badge_earned'
  | 'daily_summary'
  | 'weekly_review'
  | 'coach_message'
  | 'health_alert';

/**
 * Recurrence patterns for notifications
 */
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
}

/**
 * AI coaching context
 */
export interface CoachingContext {
  userId: string;
  conversationHistory: CoachingMessage[];
  userGoals: string[];
  recentActivity: HealthDataPoint[];
  preferences: CoachingPreferences;
}

/**
 * Coaching message structure
 */
export interface CoachingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Coaching preferences
 */
export interface CoachingPreferences {
  style: 'encouraging' | 'neutral' | 'challenging';
  frequency: 'low' | 'medium' | 'high';
  focusAreas: string[];
  language: string;
}

/**
 * Voice interaction data
 */
export interface VoiceInteraction {
  id: string;
  userId: string;
  audioData?: Blob;
  transcription?: string;
  intent?: string;
  response?: string;
  timestamp: Date;
  duration: number;
  confidence?: number;
}

/**
 * Sync operation status
 */
export interface SyncStatus {
  source: DataSource;
  lastSync: Date;
  status: 'success' | 'error' | 'pending' | 'partial';
  recordsProcessed: number;
  errors?: ServiceError[];
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  cache?: boolean;
  auth?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Type guards for service results
 */
export function isServiceSuccess<T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: true; data: T } {
  return result.success === true && result.data !== undefined;
}

export function isServiceError<T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: false; error: ServiceError } {
  return result.success === false && result.error !== undefined;
}

/**
 * Helper type for async service functions
 */
export type AsyncServiceFunction<T = any, P extends any[] = any[]> = (...args: P) => Promise<ServiceResult<T>>;

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  enableLogging: boolean;
  enableCaching: boolean;
  enableRetry: boolean;
  defaultTimeout: number;
  maxRetries: number;
}

/**
 * Export all types for easy importing
 */
export type {
  // Re-export key types for convenience
  ERROR_CODES
} from './constants';
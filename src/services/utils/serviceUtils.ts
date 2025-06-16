/**
 * Common utility functions for service layer operations
 */
import { ServiceResult, ServiceError, AuthContext } from '../types';
import { ERROR_CODES } from '../constants';
import { getCurrentUserSafe } from '../../utils/firebaseUtils';

/**
 * Creates a successful service result
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a failed service result
 */
export function createErrorResult<T = any>(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: any
): ServiceResult<T> {
  const error: ServiceError = {
    code,
    message,
    details,
    timestamp: new Date(),
  };

  return {
    success: false,
    error,
  };
}

/**
 * Wraps a function with standardized error handling
 */
export function withErrorHandling<T, P extends any[]>(
  fn: (...args: P) => Promise<T>,
  defaultErrorMessage = 'Operation failed'
): (...args: P) => Promise<ServiceResult<T>> {
  return async (...args: P): Promise<ServiceResult<T>> => {
    try {
      const result = await fn(...args);
      return createSuccessResult(result);
    } catch (error) {
      console.error('Service operation failed:', error);
      
      if (error instanceof Error) {
        return createErrorResult('UNKNOWN_ERROR', error.message, error);
      }
      
      return createErrorResult('UNKNOWN_ERROR', defaultErrorMessage, error);
    }
  };
}

/**
 * Gets authentication context for current user
 */
export function getAuthContext(): AuthContext | null {
  const user = getCurrentUserSafe();
  
  if (!user) {
    return null;
  }
  
  return {
    userId: user.uid,
    isAuthenticated: true,
    permissions: [], // TODO: Implement permission system
  };
}

/**
 * Validates user authentication for service operations
 */
export function validateAuth(requiredUserId?: string): ServiceResult<AuthContext> {
  const authContext = getAuthContext();
  
  if (!authContext) {
    return createErrorResult('AUTH_REQUIRED', 'User must be authenticated');
  }
  
  if (requiredUserId && authContext.userId !== requiredUserId) {
    return createErrorResult('AUTH_INVALID', 'User is not authorized for this operation');
  }
  
  return createSuccessResult(authContext);
}

/**
 * Safely converts Firestore timestamp to Date
 */
export function safeTimestampToDate(timestamp: any, fallback = new Date()): Date {
  try {
    if (!timestamp) {
      return fallback;
    }
    
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    console.warn('Invalid timestamp format, using fallback:', timestamp);
    return fallback;
  } catch (error) {
    console.warn('Error converting timestamp, using fallback:', error);
    return fallback;
  }
}

/**
 * Generates a consistent document ID for date-based records
 */
export function generateDateDocumentId(userId: string, date: Date | string, type?: string): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const parts = [userId, dateStr];
  
  if (type) {
    parts.push(type);
  }
  
  return parts.join('_');
}

/**
 * Validates required fields in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): ServiceResult<T> {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missingFields.push(String(field));
    }
  }
  
  if (missingFields.length > 0) {
    return createErrorResult(
      'VALIDATION_ERROR',
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
  
  return createSuccessResult(obj);
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`, error);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates date range
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return startDate instanceof Date && 
         endDate instanceof Date && 
         !isNaN(startDate.getTime()) && 
         !isNaN(endDate.getTime()) && 
         startDate <= endDate;
}

/**
 * Formats date to consistent string format
 */
export function formatDateForStorage(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parses date from storage format
 */
export function parseDateFromStorage(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date;
}

/**
 * Debounces a function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}

/**
 * Throttles a function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limitMs);
    }
  };
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned as T;
  }
  
  return obj;
}
/**
 * Base service class providing common functionality for all services
 */
import { ServiceResult, ServiceError, AuthContext, ServiceConfig } from '../types';
import { ERROR_CODES } from '../constants';
import { 
  createSuccessResult, 
  createErrorResult, 
  validateAuth, 
  retryWithBackoff,
  withErrorHandling
} from '../utils/serviceUtils';

/**
 * Abstract base class for all service implementations
 */
export abstract class BaseService {
  protected config: ServiceConfig;
  protected serviceName: string;

  constructor(serviceName: string, config?: Partial<ServiceConfig>) {
    this.serviceName = serviceName;
    this.config = {
      enableLogging: true,
      enableCaching: true,
      enableRetry: true,
      defaultTimeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Logs service operations if logging is enabled
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableLogging) {
      return;
    }

    const logMessage = `[${this.serviceName}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  /**
   * Validates authentication for the current user
   */
  protected async validateAuthentication(requiredUserId?: string): Promise<ServiceResult<AuthContext>> {
    try {
      this.log('info', 'Validating authentication', { requiredUserId });
      return validateAuth(requiredUserId);
    } catch (error) {
      this.log('error', 'Authentication validation failed', error);
      return createErrorResult('AUTH_REQUIRED', 'Authentication validation failed');
    }
  }

  /**
   * Executes an operation with standardized error handling
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: {
      requireAuth?: boolean;
      requiredUserId?: string;
      enableRetry?: boolean;
      timeout?: number;
    }
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    const {
      requireAuth = true,
      requiredUserId,
      enableRetry = this.config.enableRetry,
      timeout = this.config.defaultTimeout,
    } = options || {};

    try {
      this.log('info', `Starting operation: ${operationName}`, { requireAuth, requiredUserId });

      // Validate authentication if required
      if (requireAuth) {
        const authResult = await this.validateAuthentication(requiredUserId);
        if (!authResult.success) {
          return authResult as ServiceResult<T>;
        }
      }

      // Execute operation with optional retry
      let result: T;
      if (enableRetry) {
        result = await retryWithBackoff(operation, this.config.maxRetries);
      } else {
        result = await operation();
      }

      const duration = Date.now() - startTime;
      this.log('info', `Operation completed: ${operationName}`, { duration: `${duration}ms` });

      return createSuccessResult(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', `Operation failed: ${operationName}`, { 
        error: error instanceof Error ? error.message : error,
        duration: `${duration}ms`,
      });

      return this.handleError(error, operationName);
    }
  }

  /**
   * Handles errors in a standardized way
   */
  protected handleError(error: any, context?: string): ServiceResult<any> {
    const contextMessage = context ? ` in ${context}` : '';
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('auth')) {
        return createErrorResult('AUTH_REQUIRED', `Authentication error${contextMessage}: ${error.message}`);
      }
      
      if (error.message.includes('permission')) {
        return createErrorResult('PERMISSION_DENIED', `Permission error${contextMessage}: ${error.message}`);
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return createErrorResult('NETWORK_ERROR', `Network error${contextMessage}: ${error.message}`);
      }
      
      if (error.message.includes('timeout')) {
        return createErrorResult('TIMEOUT_ERROR', `Timeout error${contextMessage}: ${error.message}`);
      }
      
      return createErrorResult('UNKNOWN_ERROR', `Error${contextMessage}: ${error.message}`, error);
    }
    
    return createErrorResult('UNKNOWN_ERROR', `Unknown error${contextMessage}`, error);
  }

  /**
   * Validates required parameters
   */
  protected validateParams<T extends Record<string, any>>(
    params: T,
    requiredFields: (keyof T)[]
  ): ServiceResult<T> {
    const missing: string[] = [];
    
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null) {
        missing.push(String(field));
      }
    }
    
    if (missing.length > 0) {
      return createErrorResult(
        'VALIDATION_ERROR',
        `Missing required parameters: ${missing.join(', ')}`
      );
    }
    
    return createSuccessResult(params);
  }

  /**
   * Creates a timeout promise for operations
   */
  protected createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Executes operation with timeout
   */
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs = this.config.defaultTimeout
  ): Promise<T> {
    return Promise.race([
      operation,
      this.createTimeoutPromise<T>(timeoutMs),
    ]);
  }

  /**
   * Gets service configuration
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * Updates service configuration
   */
  public updateConfig(updates: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.log('info', 'Service configuration updated', updates);
  }

  /**
   * Gets service name
   */
  public getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<ServiceResult<{
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    details?: any;
  }>> {
    try {
      // Override in child classes for specific health checks
      const result = await this.performHealthCheck();
      
      return createSuccessResult({
        service: this.serviceName,
        status: 'healthy',
        timestamp: new Date(),
        details: result,
      });
    } catch (error) {
      return createSuccessResult({
        service: this.serviceName,
        status: 'unhealthy',
        timestamp: new Date(),
        details: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Override this method in child classes for specific health checks
   */
  protected async performHealthCheck(): Promise<any> {
    return { message: 'Base health check passed' };
  }

  /**
   * Disposes of service resources
   */
  public dispose(): void {
    this.log('info', 'Service disposed');
    // Override in child classes to clean up resources
  }
}

/**
 * Service factory for creating service instances
 */
export class ServiceFactory {
  private static instances = new Map<string, BaseService>();

  /**
   * Gets or creates a service instance (singleton pattern)
   */
  static getInstance<T extends BaseService>(
    serviceClass: new (...args: any[]) => T,
    serviceName: string,
    ...args: any[]
  ): T {
    if (!this.instances.has(serviceName)) {
      this.instances.set(serviceName, new serviceClass(serviceName, ...args));
    }
    
    return this.instances.get(serviceName) as T;
  }

  /**
   * Disposes of all service instances
   */
  static disposeAll(): void {
    for (const [name, service] of this.instances) {
      service.dispose();
    }
    this.instances.clear();
  }

  /**
   * Gets all active service instances
   */
  static getAllInstances(): Map<string, BaseService> {
    return new Map(this.instances);
  }
}
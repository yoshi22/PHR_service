/**
 * Centralized service exports for consistent service layer access
 */

// Core service infrastructure
import { BaseService, ServiceFactory } from './base/BaseService';
export { BaseService, ServiceFactory } from './base/BaseService';

// Service utilities
export * from './utils/serviceUtils';
export * from './utils/storageUtils';

// Service types and constants
export * from './types';
export * from './constants';

// Import services first
import { appleWatchService } from './appleWatchService';
import { fitbitService } from './fitbitService';

// Individual services
export { appleWatchService } from './appleWatchService';
export { fitbitService } from './fitbitService';
// export { UserProfileService } from './UserProfileService';
// export { HealthDataService } from './HealthDataService';
// export { BadgeService } from './BadgeService';
// export { NotificationService } from './NotificationService';
// export { CoachingService } from './CoachingService';

/**
 * Service registry for managing service instances
 */
export class ServiceRegistry {
  private static services = new Map<string, any>();

  /**
   * Registers a service instance
   */
  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Gets a registered service
   */
  static get<T>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  /**
   * Checks if a service is registered
   */
  static has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregisters a service
   */
  static unregister(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * Gets all registered service names
   */
  static getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clears all registered services
   */
  static clear(): void {
    this.services.clear();
  }
}

/**
 * Service initialization helper
 */
export class ServiceInitializer {
  private static initialized = false;

  /**
   * Initializes all services with default configuration
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Services already initialized');
      return;
    }

    try {
      console.log('Initializing services...');
      
      // Initialize services here as they are refactored
      console.log('Registering Apple Watch service...');
      ServiceRegistry.register('appleWatch', appleWatchService);
      
      console.log('Registering Fitbit service...');
      ServiceRegistry.register('fitbit', fitbitService);
      
      // Initialize the services
      try {
        await appleWatchService.initialize();
        await fitbitService.initialize();
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
      
      // Example for future services:
      // const userProfileService = ServiceFactory.getInstance(UserProfileService, 'UserProfileService');
      // ServiceRegistry.register('userProfile', userProfileService);

      this.initialized = true;
      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Checks if services are initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Disposes of all services
   */
  static async dispose(): Promise<void> {
    await ServiceFactory.disposeAll();
    ServiceRegistry.clear();
    this.initialized = false;
    console.log('Services disposed');
  }
}

/**
 * Default export for convenience
 */
const Services = {
  ServiceRegistry,
  ServiceInitializer,
  ServiceFactory,
  
  // Service instances
  appleWatch: appleWatchService,
  fitbit: fitbitService,
};

export default Services;
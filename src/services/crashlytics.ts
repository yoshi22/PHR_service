// Crashlytics service (disabled for beta release)
// This service is optional for beta testing and will be enabled for production

export const crashlytics = {
  log: (message: string) => {
    console.log('[Crashlytics]', message);
  },
  
  recordError: (error: Error, context?: any) => {
    console.error('[Crashlytics Error]', error, context);
  },
  
  setUserId: (userId: string) => {
    console.log('[Crashlytics] User ID set:', userId);
  },
  
  setCustomKey: (key: string, value: string | number | boolean) => {
    console.log('[Crashlytics] Custom key set:', key, value);
  },
  
  sendUnsentReports: () => {
    console.log('[Crashlytics] Sending unsent reports (disabled)');
  },
  
  setCrashlyticsCollectionEnabled: (enabled: boolean) => {
    console.log('[Crashlytics] Collection enabled:', enabled);
  },

  logAction: (actionName: string, succeeded: boolean, details?: string) => {
    console.log('[Crashlytics Action]', actionName, succeeded ? 'SUCCESS' : 'FAILED', details);
  }
};

export const initCrashlytics = async () => {
  console.log('[Crashlytics] Initialization skipped for beta release');
};

export const setUserIdentifier = (userId: string | null) => {
  console.log('[Crashlytics] User ID set:', userId);
};

export const logError = (error: Error, additionalData?: Record<string, any>) => {
  console.error('[Crashlytics Error]', error, additionalData);
};

export const logEvent = (name: string, params?: Record<string, any>) => {
  console.log('[Crashlytics Event]', name, params);
};

export const logAction = (actionName: string, succeeded: boolean, details?: string) => {
  console.log('[Crashlytics Action]', actionName, succeeded ? 'SUCCESS' : 'FAILED', details);
};

export default crashlytics;

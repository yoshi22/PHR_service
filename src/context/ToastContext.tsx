import React, { createContext, useContext, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';

/**
 * Toast type definitions
 */
type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastPosition = 'top' | 'bottom';

/**
 * Toast configuration interface
 */
interface ToastConfig {
  type: ToastType;
  text1: string;
  text2?: string;
  position?: ToastPosition;
  visibilityTime?: number;
  autoHide?: boolean;
}

/**
 * Toast context type definition
 */
interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  showSuccess: (text1: string, text2?: string) => void;
  showError: (text1: string, text2?: string) => void;
  showInfo: (text1: string, text2?: string) => void;
  showWarning: (text1: string, text2?: string) => void;
  showBadgeAcquired: (badgeName: string) => void;
  hideToast: () => void;
}

/**
 * Default context value
 */
const defaultContextValue: ToastContextType = {
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
  showBadgeAcquired: () => {},
  hideToast: () => {},
};

/**
 * Toast context for global toast notifications
 */
const ToastContext = createContext<ToastContextType>(defaultContextValue);

/**
 * Toast provider props
 */
interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Toast provider component for global toast management
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  /**
   * Show toast with custom configuration
   */
  const showToast = useCallback((config: ToastConfig) => {
    Toast.show({
      type: config.type,
      text1: config.text1,
      text2: config.text2,
      position: config.position || 'bottom',
      visibilityTime: config.visibilityTime || 3000,
      autoHide: config.autoHide !== false,
    });
  }, []);

  /**
   * Show success toast
   */
  const showSuccess = useCallback((text1: string, text2?: string) => {
    showToast({
      type: 'success',
      text1,
      text2,
      visibilityTime: 3000,
    });
  }, [showToast]);

  /**
   * Show error toast
   */
  const showError = useCallback((text1: string, text2?: string) => {
    showToast({
      type: 'error',
      text1,
      text2,
      visibilityTime: 4000,
    });
  }, [showToast]);

  /**
   * Show info toast
   */
  const showInfo = useCallback((text1: string, text2?: string) => {
    showToast({
      type: 'info',
      text1,
      text2,
      visibilityTime: 3000,
    });
  }, [showToast]);

  /**
   * Show warning toast
   */
  const showWarning = useCallback((text1: string, text2?: string) => {
    showToast({
      type: 'warning',
      text1,
      text2,
      visibilityTime: 3500,
    });
  }, [showToast]);

  /**
   * Show badge acquired notification
   */
  const showBadgeAcquired = useCallback((badgeName: string) => {
    showToast({
      type: 'success',
      text1: '🏅 新しいバッジを獲得しました！',
      text2: badgeName,
      position: 'bottom',
      visibilityTime: 4000,
    });
  }, [showToast]);

  /**
   * Hide current toast
   */
  const hideToast = useCallback(() => {
    Toast.hide();
  }, []);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<ToastContextType>(() => ({
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showBadgeAcquired,
    hideToast,
  }), [showToast, showSuccess, showError, showInfo, showWarning, showBadgeAcquired, hideToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast context
 * @returns Toast context value
 * @throws Error if used outside of ToastProvider
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

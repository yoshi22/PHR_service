import React, { createContext, useContext, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';

/**
 * Toast type definitions
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top' | 'bottom';

/**
 * Toast configuration interface
 */
export interface ToastConfig {
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
export interface ToastContextType {
  showToast: (type: ToastType, text1: string, text2?: string) => void;
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
   * Show toast with backward compatible API
   */
  const showToast = useCallback((type: ToastType, text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'bottom',
      visibilityTime: 3000,
      autoHide: true,
    });
  }, []);

  /**
   * Show success toast
   */
  const showSuccess = useCallback((text1: string, text2?: string) => {
    showToast('success', text1, text2);
  }, [showToast]);

  /**
   * Show error toast
   */
  const showError = useCallback((text1: string, text2?: string) => {
    showToast('error', text1, text2);
  }, [showToast]);

  /**
   * Show info toast
   */
  const showInfo = useCallback((text1: string, text2?: string) => {
    showToast('info', text1, text2);
  }, [showToast]);

  /**
   * Show warning toast
   */
  const showWarning = useCallback((text1: string, text2?: string) => {
    showToast('warning', text1, text2);
  }, [showToast]);

  /**
   * Show badge acquired notification
   */
  const showBadgeAcquired = useCallback((badgeName: string) => {
    showToast('success', '🏅 新しいバッジを獲得しました！', badgeName);
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

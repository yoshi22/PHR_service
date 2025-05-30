import React, { createContext, useContext } from 'react';
import Toast from 'react-native-toast-message';

interface ToastContextType {
  showToast: (type: 'success' | 'error' | 'info', text1: string, text2?: string) => void;
  showBadgeAcquired: (badgeName: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showBadgeAcquired: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'bottom',
      visibilityTime: 3000,
    });
  };

  const showBadgeAcquired = (badgeName: string) => {
    Toast.show({
      type: 'success',
      text1: '🏅 新しいバッジを獲得しました！',
      text2: badgeName,
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  return (
    <ToastContext.Provider value={{ showToast, showBadgeAcquired }}>
      {children}
    </ToastContext.Provider>
  );
}

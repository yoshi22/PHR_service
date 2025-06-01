import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { decode, encode } from 'base-64';
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// Restore native networking layers for Firebase
if ((global as any).originalXMLHttpRequest == null) {
  (global as any).originalXMLHttpRequest = (global as any).XMLHttpRequest;
  (global as any).originalFetch = (global as any).fetch;
  (global as any).originalFormData = (global as any).FormData;
}
(global as any).XMLHttpRequest = (global as any).originalXMLHttpRequest;
(global as any).fetch = (global as any).originalFetch;
(global as any).FormData = (global as any).originalFormData;

import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { ErrorProvider } from './context/ErrorContext'
import { LoadingProvider } from './context/LoadingContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider, useThemeContext } from './context/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Toast from 'react-native-toast-message';

import { useAuth as useFirebaseAuth } from './hooks/useAuth';
import { useAuth } from './contexts/AuthContext';
import { usePermissionStatus } from './hooks/usePermissionStatus';
import AppNavigator from './navigation';
import PermissionsScreen from './screens/PermissionsScreen';
import { initializeNotifications } from './services/notificationService';
import { initializeVoiceReminders } from './services/voiceReminderService';
import { createUserProfileIfNotExists } from './services/userProfileService';

// テーマ対応アプリコンポーネント
const ThemedApp = ({ user }: { user: any }) => {
  const { theme } = useThemeContext();
  
  return (
    <NavigationContainer theme={theme}>
      <AppNavigator signedIn={!!user} />
      <Toast />
    </NavigationContainer>
  );
};

// ─── App エントリーポイント ───────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppMain />
    </AuthProvider>
  );
}

function AppMain() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { permissionsGranted, loading: permLoading, requestPermissions, refreshPermissionStatus } = usePermissionStatus()
  const [forceUpdate, setForceUpdate] = React.useState(0);
  
  // 認証状態が変更されたときにコンソールに出力
  React.useEffect(() => {
    console.log('🔑 Authentication state changed:', { isAuthenticated, uid: user?.uid });
  }, [isAuthenticated, user]);
  
  // Initialize notifications and voice reminders when app starts
  useEffect(() => {
    const initServices = async () => {
      try {
        await initializeNotifications();
        await initializeVoiceReminders();
      } catch (err) {
        console.error('Error initializing services:', err);
      }
    };
    
    initServices();
  }, []);
  
  // Check permissions when user changes - using a ref to avoid dependency issues
  const refreshPermissionStatusRef = React.useRef(refreshPermissionStatus);
  
  // Update the ref when the function changes
  React.useEffect(() => {
    refreshPermissionStatusRef.current = refreshPermissionStatus;
  }, [refreshPermissionStatus]);
  
  // Initialize user profile when user logs in
  useEffect(() => {
    async function initializeUserProfile() {
      if (user && user.uid && user.email) {
        try {
          console.log(`Ensuring user profile exists for: ${user.uid}`);
          // Create user profile, cached level, user level, and daily bonuses if they don't exist
          await createUserProfileIfNotExists(user.uid, {
            email: user.email,
            name: user.displayName || ''
          });
        } catch (error) {
          console.error('Error initializing user profile:', error);
        }
      }
    }
    
    if (user) {
      initializeUserProfile();
      console.log('User state changed, refreshing permissions');
      // Use the ref instead of the function directly
      refreshPermissionStatusRef.current();
    }
  }, [user]); // removed refreshPermissionStatus from dependencies
  
  if (authLoading || permLoading) {
    return <View style={styles.container}><ActivityIndicator size="large"/></View>
  }
  
  // ログインしているがまだ権限を取得していない状態の場合、権限リクエスト画面を表示
  if (user && !permissionsGranted) {
    return (
      <ErrorProvider>
        <LoadingProvider>
          <ToastProvider>
            <ThemeProvider>
              <PermissionsScreen 
                onPermissionGranted={() => {
                  console.log('Permission granted callback in App.tsx');
                  // PermissionsScreen コンポーネントは一度だけこれを呼び出します
                  // 状態を更新して再レンダリングを促す
                  setForceUpdate(prev => prev + 1);
                  // 少し遅延させて権限更新を行う
                  setTimeout(() => {
                    refreshPermissionStatusRef.current();
                  }, 500);
                }} 
              />
              <Toast />
            </ThemeProvider>
          </ToastProvider>
        </LoadingProvider>
      </ErrorProvider>
    )
  }

  return (
    <ErrorProvider>
      <LoadingProvider>
        <ToastProvider>
          <ThemeProvider>
            <ThemedApp user={user} />
          </ThemeProvider>
        </ToastProvider>
      </LoadingProvider>
    </ErrorProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  title: {
    fontSize: 24, marginBottom: 24,
  },
  input: {
    width: '100%', height: 48, borderColor: '#ccc', borderWidth: 1,
    borderRadius: 4, paddingHorizontal: 8, marginBottom: 12,
  },
});

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

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  Text,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation';
import { useAuth } from './hooks/useAuth';
import { usePermissionStatus } from './hooks/usePermissionStatus';
import { useUserProfile } from './hooks/useUserProfile';
import PermissionsScreen from './screens/PermissionsScreen';
import { auth } from './firebase';

import { ErrorProvider } from './context/ErrorContext'
import { LoadingProvider } from './context/LoadingContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider, useThemeContext } from './context/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Toast from 'react-native-toast-message';
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

// Firebase初期化状態を追跡
const useFirebaseInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firebaseの初期化状態を確認する簡単なテスト
    const checkInit = async () => {
      try {
        // authオブジェクトが存在することを確認
        if (auth) {
          // 認証状態への監視設定ができることを確認
          const unsubscribe = auth.onAuthStateChanged(() => {
            // 正常に監視設定できれば初期化済みと判断
            setIsInitialized(true);
            unsubscribe(); // この監視は必要なくなったので解除
          }, (err) => {
            setError(`Firebase Auth初期化エラー: ${err.message}`);
          });
        } else {
          setError('Firebase Authオブジェクトが見つかりません');
        }
      } catch (err: any) {
        setError(`Firebase初期化エラー: ${err.message}`);
      }
    };

    checkInit();
  }, []);

  return { isInitialized, error };
};

// Custom App component with initialization handling
function App() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initAttemptRef = useRef(0);
  const maxAttempts = 3;

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if auth is available
        if (!auth) {
          throw new Error('Firebase Authが初期化されていません');
        }
        
        // Wait for auth initialization
        await new Promise<void>((resolve, reject) => {
          if (!auth) {
            reject(new Error('Firebase Auth not initialized'));
            return;
          }
          const unsubscribe = auth.onAuthStateChanged(
            (user) => {
              unsubscribe();
              resolve();
            },
            (error) => {
              unsubscribe();
              reject(error);
            }
          );
          
          // Timeout after 10 seconds
          setTimeout(() => {
            unsubscribe();
            reject(new Error('Firebase初期化がタイムアウトしました'));
          }, 10000);
        });

        setFirebaseInitialized(true);
        console.log('✅ Firebase initialized successfully');
        
      } catch (error) {
        console.error('Firebase initialization error:', error);
        if (initAttemptRef.current < maxAttempts) {
          initAttemptRef.current += 1;
          console.log(`Retrying Firebase initialization (attempt ${initAttemptRef.current}/${maxAttempts})`);
          setTimeout(initializeFirebase, 1000);
        } else {
          setInitError(error instanceof Error ? error.message : 'Firebase初期化エラー');
        }
      }
    };

    initializeFirebase();
  }, []);

  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>アプリの初期化に失敗しました</Text>
        <Text style={styles.errorDetail}>{initError}</Text>
      </View>
    );
  }

  if (!firebaseInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ErrorProvider>
      <LoadingProvider>
        <ToastProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </ToastProvider>
      </LoadingProvider>
    </ErrorProvider>
  );
}

// Content component with auth and permissions handling
const AppContent = () => {
  const { user, initializing: authLoading, isAuthenticated } = useAuth();
  const { permissionsGranted, loading: permLoading, requestPermissions, refreshPermissionStatus } = usePermissionStatus();
  const { loading: profileLoading, error: profileError } = useUserProfile(user?.uid);
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
    // Profile initialization is now handled by the useUserProfile hook
    if (user) {
      console.log('User state changed, refreshing permissions');
      // Use the ref instead of the function directly
      refreshPermissionStatusRef.current();
    }
  }, [user]); // removed refreshPermissionStatus from dependencies
  
  if (authLoading || permLoading || profileLoading) {
    return <View style={styles.container}><ActivityIndicator size="large"/></View>
  }
  
  if (profileError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>プロフィールの読み込みエラー</Text>
        <Text style={styles.errorDetail}>{profileError}</Text>
      </View>
    );
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24, marginBottom: 24,
  },
  input: {
    width: '100%', height: 48, borderColor: '#ccc', borderWidth: 1,
    borderRadius: 4, paddingHorizontal: 8, marginBottom: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  }
});

export default App;

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { decode, encode } from 'base-64';
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// Restore native networking layers for Firebase
if (global.originalXMLHttpRequest == null) {
  // @ts-ignore
  global.originalXMLHttpRequest = global.XMLHttpRequest;
  // @ts-ignore
  global.originalFetch = global.fetch;
  // @ts-ignore
  global.originalFormData = global.FormData;
}
// @ts-ignore
global.XMLHttpRequest = global.originalXMLHttpRequest;
// @ts-ignore
global.fetch = global.originalFetch;
// @ts-ignore
global.FormData = global.originalFormData;

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
import Toast from 'react-native-toast-message';

import { useAuth } from './hooks/useAuth';
import { usePermissionStatus } from './hooks/usePermissionStatus';
import AppNavigator from './navigation';
import PermissionsScreen from './screens/PermissionsScreen';
import { initializeNotifications } from './services/notificationService';

// ─── App エントリーポイント ───────────────────────────────────────────────
export default function App() {
  const { user, initializing } = useAuth()
  const { permissionsGranted, loading: permLoading, requestPermissions, refreshPermissionStatus } = usePermissionStatus()
  const [forceUpdate, setForceUpdate] = React.useState(0);
  
  // Initialize notifications when app starts
  useEffect(() => {
    initializeNotifications().catch(err => {
      console.error('Error initializing notifications:', err);
    });
  }, []);
  
  // Check permissions when user changes - using a ref to avoid dependency issues
  const refreshPermissionStatusRef = React.useRef(refreshPermissionStatus);
  
  // Update the ref when the function changes
  React.useEffect(() => {
    refreshPermissionStatusRef.current = refreshPermissionStatus;
  }, [refreshPermissionStatus]);
  
  useEffect(() => {
    if (user) {
      console.log('User state changed, refreshing permissions');
      // Use the ref instead of the function directly
      refreshPermissionStatusRef.current();
    }
  }, [user]); // removed refreshPermissionStatus from dependencies
  
  if (initializing || permLoading) {
    return <View style={styles.container}><ActivityIndicator size="large"/></View>
  }
  
  // ログインしているがまだ権限を取得していない状態の場合、権限リクエスト画面を表示
  if (user && !permissionsGranted) {
    return (
      <ErrorProvider>
        <LoadingProvider>
          <ToastProvider>
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
          </ToastProvider>
        </LoadingProvider>
      </ErrorProvider>
    )
  }

  return (
    <ErrorProvider>
      <LoadingProvider>
        <ToastProvider>
          <NavigationContainer>
            <AppNavigator signedIn={!!user} />
          </NavigationContainer>
          <Toast />
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

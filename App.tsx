// App.tsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { decode, encode } from 'base-64';
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;
if (__DEV__) {
  if (global.originalXMLHttpRequest == null) {
    // Expo Dev Client ではこれらが undefined なので保持
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
}

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

// ナビゲーションの画面パラメータ型
type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
};

import { useAuth } from './src/hooks/useAuth';
import AppNavigator from './src/navigation';

// ─── App エントリーポイント ───────────────────────────────────────────────
export default function App() {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <View style={styles.container}><ActivityIndicator size="large"/></View>;
  }

  return (
    <NavigationContainer>
      <AppNavigator signedIn={!!user} />
    </NavigationContainer>
  );
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

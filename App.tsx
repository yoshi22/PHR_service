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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 画面コンポーネント
import SignUpScreen from './src/screens/SignUpScreen';

// Firebase Auth
import { auth } from './src/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

// 歩数取得 ＆ Firestore 保存ロジック
import {
  initHealthKit,
  getTodayStepsIOS,
  initGoogleFit,
  getTodayStepsAndroid,
} from './src/services/healthService';
import { saveTodaySteps } from './src/services/firestoreService';

// ナビゲーションの画面パラメータ型
type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── SignInScreen ─────────────────────────────────────────────────────────
function SignInScreen({ navigation }: { navigation: any }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const onPressLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 成功すると onAuthStateChanged が走って Home に自動遷移
    } catch (e: any) {
      Alert.alert('ログイン失敗', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>サインイン</Text>
      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading
        ? <ActivityIndicator size="large" />
        : <Button title="ログイン" onPress={onPressLogin} />
      }
      {/* ← ここで新規登録画面へリンク */}
      <View style={{ marginTop: 16 }}>
        <Button
          title="新規登録はこちら"
          onPress={() => navigation.navigate('SignUp')}
        />
      </View>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────
function HomeScreen() {
  const [steps, setSteps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let count: number;
        if (Platform.OS === 'ios') {
          await initHealthKit();
          count = await getTodayStepsIOS();
        } else {
          await initGoogleFit();
          count = await getTodayStepsAndroid();
        }
        setSteps(count);
        // Firestore に書き込み
        const u = auth.currentUser;
        if (u) {
          await saveTodaySteps(u.uid, count);
        }
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日の歩数</Text>
      {error
        ? <Text style={{ color: 'red' }}>{error}</Text>
        : steps === null
          ? <ActivityIndicator />
          : <Text style={{ fontSize: 32 }}>{steps} 歩</Text>
      }
      <Button title="ログアウト" onPress={() => signOut(auth)} />
    </View>
  );
}

// ─── App エントリーポイント ───────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState<User | null>(null);
  const [initializing, setInit] = useState(true);

  // Firebase Auth の監視
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (initializing) setInit(false);
    });
    return unsub;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/*
        ここで一つの Navigator に初期ルートを指定。
        未ログイン時は SignIn→SignUp、ログイン後は Home のみ登録。
      */}
      <Stack.Navigator initialRouteName="SignIn">
        {user ? (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'ホーム' }}
          />
        ) : (
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: '新規登録' }}
            />
          </>
        )}
      </Stack.Navigator>
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

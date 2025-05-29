// App.tsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { decode, encode } from 'base-64';
// Base64ポリフィル
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// ネイティブのネットワーク実装を強制的に使う
if (__DEV__) {
  // XMLHttpRequest
  global.XMLHttpRequest =
    global.originalXMLHttpRequest || global.XMLHttpRequest;
  // FormData
  global.FormData =
    global.originalFormData || global.FormData;
  // fetch
  if (global.originalFetch) {
    global.fetch = global.originalFetch;
  }
}

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';            // ナビゲーションのルート管理
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // ネイティブスタックナビゲーター
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
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './src/firebase';                                      // Firebase Auth 初期化
import { signInWithEmailAndPassword } from 'firebase/auth';                 // サインイン関数
import { saveTodaySteps } from './src/services/firestoreService';           // Firestore 保存関数

// スタックの型定義
type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── SignInScreen ─────────────────────────────────────────────────────────
function SignInScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');       // メールアドレス入力値
  const [password, setPassword] = useState(''); // パスワード入力値
  const [loading, setLoading] = useState(false);// ローディング状態

  const onPressLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('ログインエラー:', error);
      // エラー内容をアラートで表示
      Alert.alert('ログイン失敗', error.message);
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
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="ログイン" onPress={onPressLogin} />
      )}
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────
// App.tsx の中にある HomeScreen を以下に置き換え

import { initHealthKit, getTodayStepsIOS, initGoogleFit, getTodayStepsAndroid } from './src/services/healthService';

function HomeScreen() {
  const [steps, setSteps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'ios') {
          await initHealthKit();
          const count = await getTodayStepsIOS();
          setSteps(count);
        } else {
          await initGoogleFit();
          const count = await getTodayStepsAndroid();
          const user = auth.currentUser;
          if (user) {
            await saveTodaySteps(user.uid, count); // Firestore に保存
          }
          setSteps(count);
        }
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日の歩数</Text>
      {error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : steps === null ? (
        <ActivityIndicator />
      ) : (
        <Text style={{ fontSize: 32 }}>{steps} 歩</Text>
      )}
      <Button title="ログアウト" onPress={() => signOut(auth)} />
    </View>
  );
}



// ─── App エントリーポイント ───────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // ① サブスクライブして認証状態を監視
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe; // クリーンアップ
  }, []);

  // ② 初期ロード中はローディング表示
  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // ③ ログイン済みなら Home スタック
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'ホーム' }}
          />
        </Stack.Navigator>
      ) : (
        // ④ 未ログインなら SignIn スタック
        <Stack.Navigator>
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}


// ─── スタイル ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // 画面いっぱいに広げる
    alignItems: 'center',       // 横方向中央揃え
    justifyContent: 'center',   // 縦方向中央揃え
    padding: 16,                // 内側余白
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  input: {
    width: '100%',              // 親幅いっぱい
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
});

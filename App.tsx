// App.tsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, { useState } from 'react';
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
} from 'react-native';
import { auth } from './src/firebase';                                      // Firebase Auth 初期化
import { signInWithEmailAndPassword } from 'firebase/auth';                 // サインイン関数

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
      navigation.replace('Home'); // 認証成功 → Homeへ遷移
    } catch (error: any) {
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
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>メイン画面（Home）</Text>
    </View>
  );
}

// ─── App エントリーポイント ───────────────────────────────────────────────
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }} // ログイン画面はヘッダー非表示
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'ホーム' }}
        />
      </Stack.Navigator>
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

import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import InputField from '../components/InputField'
import PrimaryButton from '../components/PrimaryButton'
import LoadingOverlay from '../components/LoadingOverlay'

export default function SignInScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onPressLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください')
      return
    }
    setLoading(true)
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      // Updated to use proper error handling with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Firebase Auth: Login successful, user ID:', userCredential.user.uid)
      // Auth state observer in useAuth.ts will handle navigation
    } catch (e: any) {
      const errorMessage = e.message || 'ログインに失敗しました'
      console.error('Firebase Auth error:', e.code, errorMessage)
      Alert.alert('ログイン失敗', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>サインイン</Text>
      <InputField
        label="メールアドレス"
        placeholder="例: user@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="email"
      />
      <InputField
        label="パスワード"
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="password"
      />
      {loading && <LoadingOverlay />}
      <PrimaryButton title="ログイン" onPress={onPressLogin} disabled={loading} testID="login-button" />
      <PrimaryButton title="新規登録はこちら" onPress={() => navigation.navigate('SignUp')} testID="signup-link" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16, textAlign: 'center' }
})

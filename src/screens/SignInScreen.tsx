import * as React from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import InputField from '../components/InputField'
import PrimaryButton from '../components/PrimaryButton'
import LoadingOverlay from '../components/LoadingOverlay'
import Checkbox from '../components/Checkbox'
import { saveCredentials, loadCredentials } from '../services/credentialsService'
import { colors, modernTypography as typography, spacing } from '../styles'

const { useState, useEffect } = React;

export default function SignInScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // コンポーネントマウント時に保存された認証情報を読み込む
  useEffect(() => {
    loadSavedCredentials()
  }, [])

  const loadSavedCredentials = async () => {
    try {
      const savedCredentials = await loadCredentials()
      if (savedCredentials) {
        setEmail(savedCredentials.email)
        setPassword(savedCredentials.password)
        setRememberMe(savedCredentials.rememberMe)
        console.log('✅ Loaded saved credentials for:', savedCredentials.email)
      }
    } catch (error) {
      console.error('❌ Error loading saved credentials:', error)
    }
  }

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
      
      // Firebase Auth でログイン実行
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Firebase Auth: Login successful, user ID:', userCredential.user.uid)
      
      // ログイン成功時に認証情報を保存
      await saveCredentials({
        email,
        password,
        rememberMe,
      })
      
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
      <Checkbox
        label="ログイン情報を保存する"
        checked={rememberMe}
        onPress={() => setRememberMe(!rememberMe)}
        testID="remember-me-checkbox"
      />
      {loading && <LoadingOverlay />}
      <View style={styles.buttonContainer}>
        <PrimaryButton title="ログイン" onPress={onPressLogin} disabled={loading} testID="login-button" />
        <PrimaryButton 
          title="新規登録はこちら" 
          onPress={() => navigation.navigate('SignUp')} 
          variant="outline"
          testID="signup-link" 
          style={styles.signupButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: { 
    fontSize: typography.sizes['2xl'], 
    fontWeight: '700' as any,
    marginBottom: spacing.lg, 
    textAlign: 'center',
    color: colors.text,
  },
  buttonContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  signupButton: {
    marginTop: spacing.sm,
  },
})

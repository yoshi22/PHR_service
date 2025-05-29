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
      await signInWithEmailAndPassword(auth, email, password)
      // ログイン成功後の処理（例: onAuthStateChangedで遷移）
    } catch (e: any) {
      Alert.alert('ログイン失敗', e.message)
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
      />
      <InputField
        label="パスワード"
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading && <LoadingOverlay />}
      <PrimaryButton title="ログイン" onPress={onPressLogin} disabled={loading} />
      <PrimaryButton title="新規登録はこちら" onPress={() => navigation.navigate('SignUp')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16, textAlign: 'center' }
})

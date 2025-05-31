import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { signOut } from 'firebase/auth'
import { useTheme } from '@react-navigation/native'
import { auth } from '../firebase'
import { useTodaySteps } from '../hooks/useTodaySteps'
import PrimaryButton from '../components/PrimaryButton'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'
import { usePermissions } from '../hooks/usePermissions'

export default function HomeScreen() {
  const { granted, loading: permLoading, error: permError, request: requestPerms } = usePermissions()
  const { steps, error, loading, refetch } = useTodaySteps()
  const { setLoading } = useLoading()
  const { showError } = useError()
  const { colors } = useTheme()

  // Global loading overlay
  React.useEffect(() => {
    setLoading(loading || permLoading)
  }, [loading, permLoading])
  // Global error overlay
  React.useEffect(() => {
    if (permError) {
      showError(permError, requestPerms)
    } else if (error) {
      showError(error, refetch)
    }
  }, [permError, error])

  // If permissions not granted, show request UI
  if (!granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ヘルスデータのアクセス権限が必要です</Text>
        <PrimaryButton title={permLoading ? '確認中…' : '権限をリクエスト'} onPress={requestPerms} />
      </View>
    )
  }

  // Screen UI always rendered; loading and errors are handled globally
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>今日の歩数</Text>
      <Text style={[styles.steps, { color: colors.text }]}>{steps} 歩</Text>
      <PrimaryButton title="ログアウト" onPress={() => signOut(auth)} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#F7F7F7',
  },
  title: { fontSize: 24, marginBottom: 16 },
  steps: { fontSize: 32, marginBottom: 16 }
})

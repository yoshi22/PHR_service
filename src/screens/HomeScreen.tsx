import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useTodaySteps } from '../hooks/useTodaySteps'
import PrimaryButton from '../components/PrimaryButton'
import { useLoading } from '../context/LoadingContext'
import { useError } from '../context/ErrorContext'

export default function HomeScreen() {
  const { steps, error, loading, refetch } = useTodaySteps()
  const { setLoading } = useLoading()
  const { showError } = useError()

  // Global loading overlay
  React.useEffect(() => {
    setLoading(loading)
  }, [loading])
  // Global error overlay
  React.useEffect(() => {
    if (error) {
      showError(error, refetch)
    }
  }, [error])

  // Screen UI always rendered; loading and errors are handled globally
  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日の歩数</Text>
      <Text style={styles.steps}>{steps} 歩</Text>
      <PrimaryButton title="ログアウト" onPress={() => signOut(auth)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  steps: { fontSize: 32, marginBottom: 16 }
})

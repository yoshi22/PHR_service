import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useTodaySteps } from '../hooks/useTodaySteps'
import PrimaryButton from '../components/PrimaryButton'

export default function HomeScreen() {
  const { steps, error, loading, refetch } = useTodaySteps()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日の歩数</Text>
      {error ? (
        <>
          <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
          <PrimaryButton title="再試行" onPress={refetch} />
          <PrimaryButton title="権限を開く" onPress={() => Linking.openSettings()} />
        </>
      ) : loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.steps}>{steps} 歩</Text>
      )}
      <PrimaryButton title="ログアウト" onPress={() => signOut(auth)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  steps: { fontSize: 32, marginBottom: 16 }
})

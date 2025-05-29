import React from 'react'
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useTodaySteps } from '../hooks/useTodaySteps'

export default function HomeScreen() {
  const { steps, error, loading } = useTodaySteps()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日の歩数</Text>
      {error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.steps}>{steps} 歩</Text>
      )}
      <Button title="ログアウト" onPress={() => signOut(auth)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  steps: { fontSize: 32, marginBottom: 16 }
})

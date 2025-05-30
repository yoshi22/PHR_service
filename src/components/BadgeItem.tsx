import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export type BadgeItemProps = {
  date: string
  type: string
}

export default function BadgeItem({ date, type }: BadgeItemProps) {
  // Determine display label
  let label = ''
  switch (type) {
    case '7500_steps': label = '1日7500歩達成'; break
    case '3days_streak': label = '3日連続7500歩達成'; break
    default: label = type
  }
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🏅</Text>
      <Text style={styles.text}>{date} {label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation for Android
    elevation: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
})

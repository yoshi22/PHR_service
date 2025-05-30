import React from 'react'
import { FlatList, Text, StyleSheet, View } from 'react-native'
import BadgeItem from './BadgeItem'
import type { BadgeItemProps } from './BadgeItem'

export default function BadgeList({ badges }: { badges: BadgeItemProps[] }) {
  if (badges.length === 0) {
    return <Text style={styles.empty}>まだバッジがありません</Text>
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={badges}
        keyExtractor={item => `${item.date}_${item.type}`}
        horizontal
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <BadgeItem date={item.date} type={item.type} />}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  list: { alignItems: 'center' },
  empty: { color: '#999', textAlign: 'center', padding: 16 },
})

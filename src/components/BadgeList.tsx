import React, { useRef, useEffect } from 'react'
import { FlatList, Text, StyleSheet, View, Animated } from 'react-native'
import BadgeItem from './BadgeItem'
import type { BadgeItemProps } from './BadgeItem'

export default function BadgeList({ badges }: { badges: BadgeItemProps[] }) {
  // Animation values for new badge highlight
  const newBadgeAnimation = useRef(new Animated.Value(0)).current;
  
  // Start animation when new badges arrive
  useEffect(() => {
    if (badges.length > 0 && badges.some(b => b.isNew)) {
      // Reset and start animation
      newBadgeAnimation.setValue(0);
      Animated.sequence([
        Animated.timing(newBadgeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(newBadgeAnimation, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(newBadgeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [badges]);

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
        renderItem={({ item, index }) => (
          <Animated.View style={[
            styles.badgeWrapper,
            item.isNew && {
              transform: [
                { scale: newBadgeAnimation },
              ],
              shadowColor: '#FFD700',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: newBadgeAnimation,
              shadowRadius: 10,
            }
          ]}>
            <BadgeItem date={item.date} type={item.type} isNew={item.isNew} />
          </Animated.View>
        )}
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
  badgeWrapper: {
    margin: 4,
  }
})

import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '../screens/DashboardScreen'
import ProfileScreen from '../screens/ProfileScreen'
import ChatScreenEnhanced from '../screens/ChatScreenEnhanced'
import CoachNavigator from './CoachNavigator'
import { Ionicons } from '@expo/vector-icons'
import { RouteProp } from '@react-navigation/native'

export type MainTabParamList = {
  Dashboard: undefined
  Coach: undefined
  Chat: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabs() {
  return (
    // @ts-ignore - React Navigation v7 type definition issue with id prop
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }: { route: RouteProp<MainTabParamList, keyof MainTabParamList> }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'stats-chart'
          if (route.name === 'Coach') {
            iconName = 'fitness'
          } else if (route.name === 'Chat') {
            iconName = 'chatbubble-ellipses'
          } else if (route.name === 'Profile') {
            iconName = 'person'
          }
          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'ダッシュボード' }} />
      <Tab.Screen name="Coach" component={CoachNavigator} options={{ title: 'コーチング' }} />
      <Tab.Screen name="Chat" component={ChatScreenEnhanced} options={{ title: 'AIチャット' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '設定' }} />
    </Tab.Navigator>
  )
}

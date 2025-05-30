import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeScreen from '../screens/HomeScreen'
import DashboardScreen from '../screens/DashboardScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { Ionicons } from '@expo/vector-icons'
import { RouteProp } from '@react-navigation/native'

export type MainTabParamList = {
  Home: undefined
  Dashboard: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }: { route: RouteProp<MainTabParamList, keyof MainTabParamList> }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'home'
          if (route.name === 'Dashboard') {
            iconName = 'stats-chart'
          } else if (route.name === 'Profile') {
            iconName = 'person'
          }
          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'ホーム' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'ダッシュボード' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '設定' }} />
    </Tab.Navigator>
  )
}

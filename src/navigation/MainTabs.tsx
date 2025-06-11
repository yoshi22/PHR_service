import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '../screens/DashboardScreen'
import ProfileNavigator from './ProfileNavigator'
import HealthConsultationNavigator from './HealthConsultationNavigator'
import HealthKitDebugScreenNew from '../components/HealthKitDebugScreenNew'
import { Ionicons } from '@expo/vector-icons'
import { RouteProp } from '@react-navigation/native'

export type MainTabParamList = {
  Dashboard: undefined
  HealthConsultation: undefined
  Profile: undefined
  Debug: undefined
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
          if (route.name === 'HealthConsultation') {
            iconName = 'medical'
          } else if (route.name === 'Profile') {
            iconName = 'person'
          } else if (route.name === 'Debug') {
            iconName = 'bug'
          }
          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'ダッシュボード' }} />
      <Tab.Screen name="HealthConsultation" component={HealthConsultationNavigator} options={{ title: '健康相談' }} />
      <Tab.Screen name="Debug" component={HealthKitDebugScreenNew} options={{ title: 'デバッグ' }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{ title: '設定' }} />
    </Tab.Navigator>
  )
}

// src/navigation/index.tsx
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MainTabs from './MainTabs'

// 各画面コンポーネント
import SignInScreen from '../screens/SignInScreen'
import SignUpScreen from '../screens/SignUpScreen'
import DashboardScreen from '../screens/DashboardScreen'
import BadgeGalleryScreen from '../screens/BadgeGalleryScreen'

export type RootStackParamList = {
  SignIn: undefined
  SignUp: undefined
  Dashboard: undefined
  BadgeGallery: undefined
  MainTabs: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator({ signedIn }: { signedIn: boolean }) {
  return signedIn ? (
    // @ts-ignore - Temporary fix for React Navigation v7 type issue
    <Stack.Navigator initialRouteName="MainTabs">
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BadgeGallery"
        component={BadgeGalleryScreen}
        options={{ 
          title: 'バッジコレクション',
          headerBackTitle: 'ダッシュボード'
        }}
      />
    </Stack.Navigator>
  ) : (
    // @ts-ignore - Temporary fix for React Navigation v7 type issue
    <Stack.Navigator initialRouteName="SignIn">
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: 'ログイン' }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: '新規登録' }}
      />
    </Stack.Navigator>
  )
}
// src/navigation/index.tsx
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MainTabs from './MainTabs'

// 各画面コンポーネント
import SignInScreen from '../screens/SignInScreen'
import SignUpScreen from '../screens/SignUpScreen'
import HomeScreen   from '../screens/HomeScreen'
import DashboardScreen from '../screens/DashboardScreen'

export type RootStackParamList = {
  SignIn: undefined
  SignUp: undefined
  Home: undefined
  Dashboard: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator({ signedIn }: { signedIn: boolean }) {
  return signedIn ? (
    // Use bottom tabs for Home & Dashboard when signed in
    <MainTabs />
  ) : (
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
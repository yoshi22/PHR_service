/**
 * Main App Navigator - Root navigation structure
 * Uses type-safe navigation with centralized route definitions
 */

import * as React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors, modernTypography as typography } from '../styles'
import MainTabs from './MainTabs'
import type { RootStackParamList } from './types'
import { ROUTES } from './types'

// Screen components
import SignInScreen from '../screens/SignInScreen'
import SignUpScreen from '../screens/SignUpScreen'
import BadgeGalleryScreen from '../screens/BadgeGalleryScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

interface AppNavigatorProps {
  signedIn: boolean;
}

/**
 * Default screen options for consistent styling
 */
const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600' as any,
    color: colors.text,
  },
  headerBackTitleStyle: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
};

/**
 * Main App Navigator component
 * Handles authenticated and unauthenticated navigation flows
 */
export default function AppNavigator({ signedIn }: AppNavigatorProps) {
  if (signedIn) {
    return (
      <Stack.Navigator 
        initialRouteName={ROUTES.MAIN_TABS}
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen
          name={ROUTES.MAIN_TABS}
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ROUTES.BADGE_GALLERY}
          component={BadgeGalleryScreen}
          options={{ 
            title: 'バッジコレクション',
            headerBackTitle: 'ダッシュボード',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={ROUTES.SIGN_IN}
      screenOptions={{
        ...defaultScreenOptions,
        headerStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name={ROUTES.SIGN_IN}
        component={SignInScreen}
        options={{ 
          title: 'ログイン',
          headerShown: false, // Clean auth experience
        }}
      />
      <Stack.Screen
        name={ROUTES.SIGN_UP}
        component={SignUpScreen}
        options={{ 
          title: '新規登録',
          headerBackTitle: 'ログイン',
        }}
      />
    </Stack.Navigator>
  );
}

// Export types for use in other files
export type { RootStackParamList } from './types';
export { ROUTES } from './types';
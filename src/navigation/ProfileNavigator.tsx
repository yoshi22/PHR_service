/**
 * Profile Navigator - Stack navigation for profile and settings
 * Uses centralized type definitions and consistent styling
 */

import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import { colors, modernTypography as typography } from '../styles';
import type { ProfileStackParamList } from './types';

// Screen components
import ProfileScreen from '../screens/ProfileScreen';
import MiBandSetupScreen from '../screens/MiBandSetupScreen';
import AppleWatchSetupScreen from '../screens/AppleWatchSetupScreen';
import FitbitSetupScreen from '../screens/FitbitSetupScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Profile Navigator component
 * Manages profile-related screens with consistent styling
 */
const ProfileNavigator = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600' as any,
          fontSize: typography.sizes.lg,
          color: colors.text,
        },
        headerBackTitleStyle: {
          fontSize: typography.sizes.sm,
          color: colors.primary,
        },
        contentStyle: { 
          backgroundColor: colors.background 
        },
        presentation: 'card',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: '設定', 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="MiBandSetup" 
        component={MiBandSetupScreen} 
        options={{ 
          title: 'Mi Band 連携',
          headerBackTitle: '設定',
        }} 
      />
      <Stack.Screen 
        name="AppleWatchSetup" 
        component={AppleWatchSetupScreen} 
        options={{ 
          title: 'Apple Watch 連携',
          headerBackTitle: '設定',
        }} 
      />
      <Stack.Screen 
        name="FitbitSetup" 
        component={FitbitSetupScreen} 
        options={{ 
          title: 'Fitbit 連携',
          headerBackTitle: '設定',
        }} 
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;

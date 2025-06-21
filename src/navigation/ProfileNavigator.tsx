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
    </Stack.Navigator>
  );
};

export default ProfileNavigator;

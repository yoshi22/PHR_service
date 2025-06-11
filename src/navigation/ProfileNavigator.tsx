import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';

import ProfileScreen from '../screens/ProfileScreen';
import MiBandSetupScreen from '../screens/MiBandSetupScreen';
import AppleWatchSetupScreen from '../screens/AppleWatchSetupScreen';
import FitbitSetupScreen from '../screens/FitbitSetupScreen';

// Stack型の定義
export type ProfileStackParamList = {
  ProfileMain: undefined;
  MiBandSetup: undefined;
  AppleWatchSetup: undefined;
  FitbitSetup: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: '設定', headerShown: false }}
      />
      <Stack.Screen 
        name="MiBandSetup" 
        component={MiBandSetupScreen} 
        options={{ title: 'Mi Band 連携' }} 
      />
      <Stack.Screen 
        name="AppleWatchSetup" 
        component={AppleWatchSetupScreen} 
        options={{ title: 'Apple Watch 連携' }} 
      />
      <Stack.Screen 
        name="FitbitSetup" 
        component={FitbitSetupScreen} 
        options={{ title: 'Fitbit 連携' }} 
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';

import CoachHomeScreen from '../screens/CoachHomeScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import GoalListScreen from '../screens/GoalListScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import MiBandSetupScreen from '../screens/MiBandSetupScreen';
import AppleWatchSetupScreen from '../screens/AppleWatchSetupScreen';
import FitbitSetupScreen from '../screens/FitbitSetupScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';

// Stack型の定義を追加
export type CoachStackParamList = {
  CoachHome: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId?: string };
  EditGoal: { goalId: string };
  GoalList: undefined;
  Chat: { initialMessage?: string; systemInstruction?: string };
  MiBandSetup: undefined;
  AppleWatchSetup: undefined;
  FitbitSetup: undefined;
  ExerciseLibrary: undefined;
};

const Stack = createNativeStackNavigator<CoachStackParamList>();

const CoachNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="CoachHome"
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
        name="CoachHome" 
        component={CoachHomeScreen} 
        options={{ title: 'コーチング', headerShown: false }} 
      />
      <Stack.Screen 
        name="CreateGoal" 
        component={CreateGoalScreen} 
        options={{ title: '新しい目標' }} 
      />
      <Stack.Screen 
        name="GoalList" 
        component={GoalListScreen} 
        options={{ title: '目標リスト' }} 
      />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen} 
        options={{ title: '目標の詳細' }} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ title: 'AIコーチ' }} 
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
      <Stack.Screen 
        name="ExerciseLibrary" 
        component={ExerciseLibraryScreen} 
        options={{ title: 'エクササイズライブラリ' }} 
      />
    </Stack.Navigator>
  );
};

export default CoachNavigator;

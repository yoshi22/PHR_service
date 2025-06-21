/**
 * Main Tab Navigator - Bottom tab navigation for authenticated users
 * Uses type-safe navigation with consistent styling
 */

import * as React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import type { RouteProp } from '@react-navigation/native'
import { colors, modernTypography as typography, spacing } from '../styles'
import type { MainTabParamList, TabBarIconProps } from './types'
import { TAB_ROUTES } from './types'

// Screen components
import DashboardScreen from '../screens/DashboardScreen'
import ProfileNavigator from './ProfileNavigator'
import HealthConsultationNavigator from './HealthConsultationNavigator'

const Tab = createBottomTabNavigator<MainTabParamList>()

/**
 * Gets the appropriate icon for each tab
 */
function getTabBarIcon(routeName: keyof MainTabParamList): React.ComponentProps<typeof Ionicons>['name'] {
  const iconMap: Record<keyof MainTabParamList, React.ComponentProps<typeof Ionicons>['name']> = {
    [TAB_ROUTES.DASHBOARD]: 'stats-chart',
    [TAB_ROUTES.HEALTH_CONSULTATION]: 'medical',
    [TAB_ROUTES.PROFILE]: 'person',
  };
  
  return iconMap[routeName] || 'help-circle';
}

/**
 * Main Tabs Navigator component
 * Provides bottom tab navigation for the main app sections
 */
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName={TAB_ROUTES.DASHBOARD}
      screenOptions={({ route }: { route: RouteProp<MainTabParamList, keyof MainTabParamList> }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }: TabBarIconProps) => {
          const iconName = getTabBarIcon(route.name);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: '500' as any,
          marginBottom: spacing.xs,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text + '80', // 50% opacity
      })}
    >
      <Tab.Screen 
        name={TAB_ROUTES.DASHBOARD} 
        component={DashboardScreen} 
        options={{ title: 'ダッシュボード' }} 
      />
      <Tab.Screen 
        name={TAB_ROUTES.HEALTH_CONSULTATION} 
        component={HealthConsultationNavigator} 
        options={{ title: '健康相談' }} 
      />
      <Tab.Screen 
        name={TAB_ROUTES.PROFILE} 
        component={ProfileNavigator} 
        options={{ title: '設定' }} 
      />
    </Tab.Navigator>
  );
}

// Export types for use in other components
export type { MainTabParamList } from './types';

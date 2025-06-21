/**
 * Navigation type definitions for the PHR application
 * Centralized type definitions for type-safe navigation
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator types
export type RootStackParamList = {
  // Authentication Stack
  SignIn: undefined;
  SignUp: undefined;
  
  // Main App Stack
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  BadgeGallery: undefined;
  
  
  // Goal Management
  GoalList: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId: string };
  
  // Exercise
  ExerciseLibrary: undefined;
  
  // Chat and Coaching
  Chat: undefined;
  ChatEnhanced: undefined;
  CoachHome: undefined;
  CoachingInterface: undefined;
  CoachSettings: undefined;
  
  // Health Consultation
  HealthConsultation: undefined;
  
  // Daily Bonus
  DailyBonus: undefined;
  
  // Profile Management
  Profile: undefined;
  ProfileEdit: undefined;
  
  // Permissions
  Permissions: undefined;
};

// Main Tab Navigator types
export type MainTabParamList = {
  Dashboard: undefined;
  HealthConsultation: undefined;
  Profile: undefined;
};

// Profile Stack Navigator types
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  GoalList: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId: string };
  ExerciseLibrary: undefined;
  DailyBonus: undefined;
  CoachSettings: undefined;
};

// Health Consultation Stack Navigator types
export type HealthConsultationStackParamList = {
  HealthConsultationMain: undefined;
  Chat: undefined;
  ChatEnhanced: undefined;
  CoachHome: undefined;
  CoachingInterface: undefined;
};

// Coach Navigator types
export type CoachStackParamList = {
  CoachHome: undefined;
  CoachingInterface: undefined;
  CoachSettings: undefined;
  Chat: undefined;
  ChatEnhanced: undefined;
};

// Navigation prop types for type-safe navigation
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: any; // TODO: Replace with proper typed navigation prop
  route: { params: RootStackParamList[T] };
};

// Screen component type helper
export type ScreenComponent<T extends keyof RootStackParamList> = React.ComponentType<NavigationProps<T>>;

// Tab bar icon props
export type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

// Common navigation options
export interface NavigationOptions {
  headerShown?: boolean;
  title?: string;
  headerBackTitle?: string;
  presentation?: 'modal' | 'fullScreenModal' | 'formSheet';
  gestureEnabled?: boolean;
}

// Theme-aware navigation colors
export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}

/**
 * Navigation route names as constants to prevent typos
 */
export const ROUTES = {
  // Auth
  SIGN_IN: 'SignIn' as const,
  SIGN_UP: 'SignUp' as const,
  
  // Main
  MAIN_TABS: 'MainTabs' as const,
  DASHBOARD: 'Dashboard' as const,
  BADGE_GALLERY: 'BadgeGallery' as const,
  
  
  // Goals
  GOAL_LIST: 'GoalList' as const,
  CREATE_GOAL: 'CreateGoal' as const,
  GOAL_DETAIL: 'GoalDetail' as const,
  
  // Exercise
  EXERCISE_LIBRARY: 'ExerciseLibrary' as const,
  
  // Chat & Coaching
  CHAT: 'Chat' as const,
  CHAT_ENHANCED: 'ChatEnhanced' as const,
  COACH_HOME: 'CoachHome' as const,
  COACHING_INTERFACE: 'CoachingInterface' as const,
  COACH_SETTINGS: 'CoachSettings' as const,
  
  // Health
  HEALTH_CONSULTATION: 'HealthConsultation' as const,
  
  // Profile
  PROFILE: 'Profile' as const,
  PROFILE_EDIT: 'ProfileEdit' as const,
  
  // Bonus
  DAILY_BONUS: 'DailyBonus' as const,
  
  // Permissions
  PERMISSIONS: 'Permissions' as const,
} as const;

/**
 * Tab names as constants
 */
export const TAB_ROUTES = {
  DASHBOARD: 'Dashboard' as const,
  HEALTH_CONSULTATION: 'HealthConsultation' as const,
  PROFILE: 'Profile' as const,
} as const;
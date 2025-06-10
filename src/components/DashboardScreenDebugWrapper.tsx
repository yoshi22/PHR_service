import React from 'react';
import DashboardScreen from '../screens/DashboardScreen';

/**
 * Debug wrapper for DashboardScreen to ensure it's being called
 */
export default function DashboardScreenDebugWrapper() {
  console.log('🔍 DashboardScreenDebugWrapper: Component called');
  console.log('🔍 DashboardScreenDebugWrapper: About to render DashboardScreen');
  console.log('🔍 DashboardScreenDebugWrapper: DashboardScreen type:', typeof DashboardScreen);
  
  React.useEffect(() => {
    console.log('🔍 DashboardScreenDebugWrapper: Component mounted');
  }, []);
  
  return <DashboardScreen />;
}

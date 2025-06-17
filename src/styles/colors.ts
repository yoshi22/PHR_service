/**
 * Application color palette with semantic color definitions
 */
export const colors = {
  // Primary brand colors
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#5DAAFF',
  
  // Secondary colors
  secondary: '#5856D6',
  secondaryDark: '#4240B8',
  secondaryLight: '#8180E8',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  
  // Text colors
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  textInverse: '#FFFFFF',
  
  // Border and divider colors
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  divider: '#D1D1D6',
  
  // Semantic colors
  success: '#4CAF50',
  successDark: '#388E3C',
  successLight: '#A5D6A7',
  
  error: '#FF3B30',
  errorDark: '#D32F2F',
  errorLight: '#FFCDD2',
  
  warning: '#FF9800',
  warningDark: '#F57C00',
  warningLight: '#FFE0B2',
  
  info: '#2196F3',
  infoDark: '#1976D2',
  infoLight: '#BBDEFB',
  
  // Badge and status colors
  badgeCommon: '#6B7280',
  badgeRare: '#3B82F6',
  badgeEpic: '#8B5CF6',
  badgeLegendary: '#F59E0B',
  
  // Service-specific colors
  fitbit: '#00B0B9',
  apple: '#007AFF',
  miband: '#FF6900',
  
  // Chart colors
  chartPrimary: '#007AFF',
  chartSecondary: '#5856D6',
  chartTertiary: '#4CAF50',
  chartQuaternary: '#FF9800',
  
  // Overlay and modal colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBackground: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Neutral color scale for design system
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status colors grouped for design system
  status: {
    success: '#4CAF50',
    error: '#FF3B30',
    warning: '#FF9800',
    info: '#2196F3',
  },
} as const;

// Type definition for color keys
export type ColorKey = keyof typeof colors;

// Default export for backward compatibility
export default colors;

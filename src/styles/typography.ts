import { TextStyle } from 'react-native';

/**
 * Font weight constants for type safety
 */
export const fontWeights = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

/**
 * Application typography system with complete text hierarchy
 */
export const typography: Record<string, TextStyle> = {
  // Display text styles
  displayLarge: {
    fontSize: 57,
    fontWeight: fontWeights.normal,
    lineHeight: 64,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: fontWeights.normal,
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: fontWeights.normal,
    lineHeight: 44,
  },
  
  // Headline text styles
  headlineLarge: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: fontWeights.semibold,
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: fontWeights.semibold,
    lineHeight: 32,
  },
  
  // Title text styles
  titleLarge: {
    fontSize: 22,
    fontWeight: fontWeights.semibold,
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
  },
  
  // Body text styles
  bodyLarge: {
    fontSize: 16,
    fontWeight: fontWeights.normal,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: fontWeights.normal,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: fontWeights.normal,
    lineHeight: 16,
  },
  
  // Label text styles
  labelLarge: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
  },
  
  // Caption and overline
  caption: {
    fontSize: 12,
    fontWeight: fontWeights.normal,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  
  // Backward compatibility aliases
  h1: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: fontWeights.semibold,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: fontWeights.normal,
    lineHeight: 24,
  },
} as const;

// Type definitions
export type FontWeight = keyof typeof fontWeights;
export type TypographyKey = keyof typeof typography;

// Default export for backward compatibility
export default typography;

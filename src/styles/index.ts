/**
 * Centralized style system exports for consistent styling across the application
 */

// Core style systems
export { colors, type ColorKey } from './colors';
export { typography, fontWeights, type FontWeight, type TypographyKey } from './typography';
export { spacing, spacingHelpers, type SpacingKey } from './spacing';
export { 
  commonStyles, 
  layoutStyles, 
  cardStyles, 
  buttonStyles, 
  inputStyles, 
  textStyles 
} from './common';

// Default exports for backward compatibility
export { default as Colors } from './colors';
export { default as Typography } from './typography';
export { default as Spacing } from './spacing';
export { default as CommonStyles } from './common';

// Re-export everything as a theme object for convenience
export const theme = {
  colors,
  typography,
  spacing,
  spacingHelpers,
  commonStyles,
} as const;

// Type definitions for the complete theme
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
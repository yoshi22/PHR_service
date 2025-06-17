/**
 * Centralized style system exports for consistent styling across the application
 */

// Core style systems
export { colors, type ColorKey } from './colors';
export { typography, modernTypography, fontWeights, type FontWeight, type TypographyKey } from './typography';
export { spacing, spacingHelpers, type SpacingKey } from './spacing';
export { 
  commonStyles, 
  layoutStyles, 
  cardStyles, 
  buttonStyles, 
  inputStyles, 
  textStyles,
  shadows,
  common
} from './common';

// Default exports for backward compatibility
export { default as Colors } from './colors';
export { default as Typography } from './typography';
export { default as Spacing } from './spacing';
export { default as CommonStyles } from './common';

// Re-export everything as a theme object for convenience
import { colors as colorsImport } from './colors';
import { typography as typographyImport } from './typography';
import { spacing as spacingImport, spacingHelpers as spacingHelpersImport } from './spacing';
import { commonStyles as commonStylesImport, shadows as shadowsImport, common as commonImport } from './common';

export const theme = {
  colors: colorsImport,
  typography: typographyImport,
  spacing: spacingImport,
  spacingHelpers: spacingHelpersImport,
  commonStyles: commonStylesImport,
  shadows: shadowsImport,
  common: commonImport,
} as const;

// Type definitions for the complete theme
export type Theme = typeof theme;
export type ThemeColors = typeof colorsImport;
export type ThemeTypography = typeof typographyImport;
export type ThemeSpacing = typeof spacingImport;
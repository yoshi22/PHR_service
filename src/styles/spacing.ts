/**
 * Consistent spacing system based on 4px grid
 */
export const spacing = {
  // Base unit (4px)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Specific use cases
  screenPadding: 16,
  sectionSpacing: 24,
  componentSpacing: 12,
  itemSpacing: 8,
  
  // Border radius
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusRound: 999,
  
  // Icon sizes
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,
  iconXxl: 48,
  
  // Button heights
  buttonSm: 32,
  buttonMd: 44,
  buttonLg: 56,
  
  // Input heights
  inputSm: 32,
  inputMd: 44,
  inputLg: 56,
  
  // Card padding
  cardPaddingSm: 12,
  cardPaddingMd: 16,
  cardPaddingLg: 20,
  
  // Header heights
  headerHeight: 56,
  tabBarHeight: 80,
  
  // Modal spacing
  modalPadding: 20,
  modalMargin: 16,
} as const;

// Type definition for spacing keys
export type SpacingKey = keyof typeof spacing;

// Helper functions for common spacing patterns
export const spacingHelpers = {
  /**
   * Get horizontal padding for screen content
   */
  screenHorizontal: () => ({ paddingHorizontal: spacing.screenPadding }),
  
  /**
   * Get vertical padding for screen content
   */
  screenVertical: () => ({ paddingVertical: spacing.screenPadding }),
  
  /**
   * Get all screen padding
   */
  screenPadding: () => ({ padding: spacing.screenPadding }),
  
  /**
   * Get margin bottom for section spacing
   */
  sectionBottom: () => ({ marginBottom: spacing.sectionSpacing }),
  
  /**
   * Get margin for component spacing
   */
  componentMargin: () => ({ margin: spacing.componentSpacing }),
  
  /**
   * Get padding for card components
   */
  cardPadding: (size: 'sm' | 'md' | 'lg' = 'md') => ({
    padding: spacing[`cardPadding${size.charAt(0).toUpperCase()}${size.slice(1)}` as keyof typeof spacing]
  }),
} as const;

// Default export
export default spacing;
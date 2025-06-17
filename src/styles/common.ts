import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

/**
 * Common reusable styles for consistent UI patterns
 */
export const commonStyles = StyleSheet.create({
  // Layout styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screenPadding,
  } as ViewStyle,
  
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusMd,
    padding: spacing.cardPaddingMd,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  
  cardSmall: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusSm,
    padding: spacing.cardPaddingSm,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  
  // Button styles
  button: {
    height: spacing.buttonMd,
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  
  buttonSecondary: {
    height: spacing.buttonMd,
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  
  buttonTextSecondary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  
  // Input styles
  input: {
    height: spacing.inputMd,
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  } as ViewStyle,
  
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  } as ViewStyle,
  
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  } as ViewStyle,
  
  // Text styles
  textPrimary: {
    color: colors.text,
  } as TextStyle,
  
  textSecondary: {
    color: colors.textSecondary,
  } as TextStyle,
  
  textError: {
    color: colors.error,
  } as TextStyle,
  
  textSuccess: {
    color: colors.success,
  } as TextStyle,
  
  textCenter: {
    textAlign: 'center',
  } as TextStyle,
  
  // Border styles
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  } as ViewStyle,
  
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as ViewStyle,
  
  // Spacing utilities
  marginBottomSm: {
    marginBottom: spacing.sm,
  } as ViewStyle,
  
  marginBottomMd: {
    marginBottom: spacing.md,
  } as ViewStyle,
  
  marginBottomLg: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  
  paddingHorizontalMd: {
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  
  paddingVerticalMd: {
    paddingVertical: spacing.md,
  } as ViewStyle,
  
  // Status indicator styles
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: spacing.radiusRound,
    marginRight: spacing.sm,
  } as ViewStyle,
  
  statusSuccess: {
    backgroundColor: colors.success,
  } as ViewStyle,
  
  statusError: {
    backgroundColor: colors.error,
  } as ViewStyle,
  
  statusWarning: {
    backgroundColor: colors.warning,
  } as ViewStyle,
  
  statusInfo: {
    backgroundColor: colors.info,
  } as ViewStyle,
  
  // Badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusLg,
    alignSelf: 'flex-start',
  } as ViewStyle,
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
  
  // Overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  } as ViewStyle,
  
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: spacing.radiusLg,
    padding: spacing.modalPadding,
    margin: spacing.modalMargin,
    minWidth: 280,
    maxWidth: '90%',
  } as ViewStyle,
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  } as ViewStyle,
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  } as ViewStyle,
});

// Export individual style categories for tree-shaking
export const layoutStyles = {
  container: commonStyles.container,
  screenContainer: commonStyles.screenContainer,
  centerContent: commonStyles.centerContent,
  row: commonStyles.row,
  rowBetween: commonStyles.rowBetween,
};

export const cardStyles = {
  card: commonStyles.card,
  cardSmall: commonStyles.cardSmall,
};

export const buttonStyles = {
  button: commonStyles.button,
  buttonSecondary: commonStyles.buttonSecondary,
  buttonText: commonStyles.buttonText,
  buttonTextSecondary: commonStyles.buttonTextSecondary,
};

export const inputStyles = {
  input: commonStyles.input,
  inputFocused: commonStyles.inputFocused,
  inputError: commonStyles.inputError,
};

export const textStyles = {
  textPrimary: commonStyles.textPrimary,
  textSecondary: commonStyles.textSecondary,
  textError: commonStyles.textError,
  textSuccess: commonStyles.textSuccess,
  textCenter: commonStyles.textCenter,
};

/**
 * Shadow definitions for consistent elevation
 */
export const shadows = {
  light: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  heavy: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
};

/**
 * Common object with all reusable styles
 */
export const common = {
  shadows,
  styles: commonStyles,
  layout: layoutStyles,
  cards: cardStyles,
  buttons: buttonStyles,
  inputs: inputStyles,
  text: textStyles,
};

// Default export
export default commonStyles;
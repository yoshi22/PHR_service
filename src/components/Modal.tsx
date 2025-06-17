import React from 'react'
import { 
  Modal as RNModal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native'
import { colors, modernTypography as typography, spacing, common } from '../styles'
import PrimaryButton from './PrimaryButton'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  footer?: React.ReactNode
  testID?: string
}

export default function Modal({ 
  visible, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
  testID 
}: ModalProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const getModalContentStyle = () => {
    const baseStyle = [styles.modalContent];
    
    switch (size) {
      case 'small':
        baseStyle.push({
          width: Math.min(screenWidth * 0.8, 300),
          maxHeight: screenHeight * 0.6,
        });
        break;
      case 'medium':
        baseStyle.push({
          width: Math.min(screenWidth * 0.9, 400),
          maxHeight: screenHeight * 0.8,
        });
        break;
      case 'large':
        baseStyle.push({
          width: Math.min(screenWidth * 0.95, 600),
          maxHeight: screenHeight * 0.9,
        });
        break;
      case 'fullscreen':
        baseStyle.push(styles.fullscreen);
        break;
    }
    
    return baseStyle;
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <View style={getModalContentStyle()}>
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title && <Text style={styles.title}>{title}</Text>}
                {showCloseButton && (
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
            
            {/* Footer */}
            {footer && (
              <View style={styles.footer}>
                {footer}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </RNModal>
  )
}

// Convenience component for confirmation dialogs
interface ConfirmModalProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  testID?: string
}

export function ConfirmModal({
  visible,
  onConfirm,
  onCancel,
  title = '確認',
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmVariant = 'primary',
  testID
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={title}
      size="small"
      closeOnBackdrop={false}
      testID={testID}
      footer={
        <View style={styles.confirmFooter}>
          <PrimaryButton
            title={cancelText}
            onPress={onCancel}
            variant="outline"
            style={styles.confirmButton}
          />
          <PrimaryButton
            title={confirmText}
            onPress={onConfirm}
            variant={confirmVariant}
            style={styles.confirmButton}
          />
        </View>
      }
    >
      <Text style={styles.confirmMessage}>{message}</Text>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    ...common.shadows.heavy,
    maxWidth: '100%',
  },
  
  fullscreen: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    maxWidth: undefined,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: colors.surface,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  
  title: {
    fontSize: typography.sizes['3xl'],
    lineHeight: typography.lineHeights['3xl'],
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
  
  closeButtonText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral[500],
    fontWeight: 'bold',
  },
  
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  
  // Confirm modal styles
  confirmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  
  confirmButton: {
    flex: 1,
  },
  
  confirmMessage: {
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.base,
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
})
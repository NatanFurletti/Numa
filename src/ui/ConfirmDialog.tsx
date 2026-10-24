import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, maxContentWidth, spacing } from './theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação própria (o Alert do React Native não funciona na web). */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel } = props;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button label={cancelLabel} onPress={onCancel} />
            <Button label={confirmLabel} onPress={onConfirm} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '100%',
    maxWidth: maxContentWidth,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    fontSize: 16,
  },
  actions: {
    gap: spacing.sm,
  },
});

import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/ui/theme';

/** Balão da dica única sobre a direção da digitação (GAME_RULES §7). */
export function DirectionTip({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.balloon} accessibilityRole="alert">
      <Text style={styles.text}>{t('review.tip')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('review.tipDismiss')}
        onPress={onDismiss}
        hitSlop={8}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{t('review.tipDismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  balloon: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  buttonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});

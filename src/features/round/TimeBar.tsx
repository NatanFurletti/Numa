import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/ui/theme';

interface TimeBarProps {
  /** Fração do tempo restante (1 → 0), ou null sem tempo-limite. */
  ratio: number | null;
  timeUp: boolean;
}

export function TimeBar({ ratio, timeUp }: TimeBarProps) {
  const { t } = useTranslation();
  if (ratio === null) return null;
  // Tempo esgotado: a barra fica cheia e âmbar.
  const fill = timeUp ? 1 : ratio;

  return (
    <View style={styles.wrapper}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('round.timeLeft')}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
        style={styles.track}
      >
        <View
          style={[
            styles.fill,
            { width: `${fill * 100}%`, backgroundColor: timeUp ? colors.warning : colors.accent },
          ]}
        />
      </View>
      {timeUp ? <Text style={styles.timeUp}>{t('round.timeUp')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  timeUp: {
    color: colors.warning,
    fontSize: 14,
    textAlign: 'center',
  },
});

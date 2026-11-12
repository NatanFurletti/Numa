// Pontos ganhos numa rodada (docs/GAME_RULES.md §14.4): o total, as partes (quando há mais de
// uma) e a trava do dia.

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { GAME_CONFIG } from '@/engine/config/game-config';
import type { PointsBreakdown } from '@/engine/points';
import { colors, spacing } from '@/ui/theme';

const PARTS = ['hits', 'stars', 'newStage'] as const;

export function PointsEarned({ points }: { points: PointsBreakdown | undefined }) {
  const { t } = useTranslation();
  if (!points || (points.total === 0 && !points.capped)) return null;

  const parts = PARTS.filter((part) => points[part] > 0).map((part) =>
    t(`points.${part}`, { count: points[part] }),
  );

  return (
    <View style={styles.block}>
      {points.total > 0 ? (
        <Text style={styles.total}>{t('points.earned', { count: points.total })}</Text>
      ) : null}
      {parts.length > 1 ? <Text style={styles.parts}>{parts.join(' · ')}</Text> : null}
      {points.capped ? (
        <Text style={styles.capped}>
          {t('points.capped', { limit: GAME_CONFIG.points.roundsPerStagePerDay })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  total: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  parts: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  capped: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});

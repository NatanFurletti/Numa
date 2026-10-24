// Início (docs/SCREENS.md §3.2): sequência de dias, "Continuar" e atalhos.

import { StyleSheet, Text, View } from 'react-native';

import { continueStageId } from '@/engine/progression';
import { currentStreak } from '@/engine/streak';
import { stageLabel } from '@/features/levels/names';
import { systemClock } from '@/lib/clock';
import { localDateString } from '@/lib/date';
import { useProgress } from '@/store/progress';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

interface HomeScreenProps {
  onContinue: (stageId: string) => void;
  onLevels: () => void;
}

export function HomeScreen({ onContinue, onLevels }: HomeScreenProps) {
  const stages = useProgress((s) => s.stages);
  const streak = useProgress((s) => s.streak);

  const stageId = continueStageId(stages);
  const neverPlayed = Object.values(stages).every((stage) => stage.attempts === 0);
  const days = currentStreak(streak, localDateString(systemClock.now()));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Numa
        </Text>
        <Text style={styles.subtitle}>Treine sua mente alguns minutos por dia.</Text>
        {days > 0 ? (
          <Text style={styles.streak}>{`🔥 ${days} ${days === 1 ? 'dia' : 'dias'}`}</Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            label={`${neverPlayed ? 'Começar' : 'Continuar'} — ${stageLabel(stageId)}`}
            onPress={() => onContinue(stageId)}
          />
          <Button label="Níveis" onPress={onLevels} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    textAlign: 'center',
  },
  streak: {
    color: colors.warning,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});

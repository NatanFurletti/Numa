// Início (docs/SCREENS.md §3.2): sequência de dias, "Continuar" e atalhos.

import { useTranslation } from 'react-i18next';
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
  onPractice: () => void;
  onSettings: () => void;
}

export function HomeScreen({ onContinue, onLevels, onPractice, onSettings }: HomeScreenProps) {
  const { t } = useTranslation();
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
        <Text style={styles.subtitle}>{t('home.tagline')}</Text>
        {days > 0 ? <Text style={styles.streak}>{t('home.streak', { count: days })}</Text> : null}
        <View style={styles.actions}>
          <Button
            label={t(neverPlayed ? 'home.start' : 'home.continue', {
              stage: stageLabel(t, stageId),
            })}
            onPress={() => onContinue(stageId)}
          />
          <Button label={t('home.levels')} onPress={onLevels} variant="secondary" />
          <Button label={t('home.practice')} onPress={onPractice} variant="secondary" />
          <Button label={t('home.settings')} onPress={onSettings} variant="secondary" />
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

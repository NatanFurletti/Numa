// Tela de níveis (docs/SCREENS.md §3.3) e escolha do treino livre (§3.8).
// No treino livre: a mesma lista, só com as etapas desbloqueadas e sem estrelas.

import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEVELS } from '@/engine/config/levels';
import type { StageProgress } from '@/engine/progression';
import { useProgress } from '@/store/progress';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { levelName, levelTitle } from './names';

interface LevelsScreenProps {
  /** levels: todas as etapas, com estrelas e cadeados. practice: só as desbloqueadas. */
  variant?: 'levels' | 'practice';
  onPlay: (stageId: string) => void;
  onBack: () => void;
}

export function LevelsScreen({ variant = 'levels', onPlay, onBack }: LevelsScreenProps) {
  const { t } = useTranslation();
  const stages = useProgress((s) => s.stages);
  const practice = variant === 'practice';

  const levels = LEVELS.map((level) => ({
    id: level.id,
    stages: level.stages
      .map((stage) => ({ letter: stage.id, id: `${level.id}-${stage.id}` }))
      .filter((stage) => !practice || stages[stage.id]?.unlocked),
  })).filter((level) => level.stages.length > 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onBack}
            hitSlop={12}
            style={styles.back}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {practice ? t('practice.title') : t('levels.title')}
          </Text>
        </View>
        {practice ? <Text style={styles.subtitle}>{t('practice.subtitle')}</Text> : null}

        {levels.map((level) => (
          <View key={level.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.levelTitle}>{levelTitle(t, level.id)}</Text>
              <Text style={styles.levelName}>{levelName(t, level.id)}</Text>
            </View>
            <View style={styles.stages}>
              {level.stages.map((stage) => (
                <StageButton
                  key={stage.id}
                  levelLabel={levelTitle(t, level.id)}
                  letter={stage.letter}
                  progress={stages[stage.id]}
                  showStars={!practice}
                  onPress={() => onPlay(stage.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StageButton({
  levelLabel,
  letter,
  progress,
  showStars,
  onPress,
}: {
  levelLabel: string;
  letter: string;
  progress: StageProgress | undefined;
  showStars: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const unlocked = progress?.unlocked === true;
  const stars = progress?.bestStars ?? 0;
  const params = { level: levelLabel, letter, stars };
  const label = !unlocked
    ? t('levels.stageButtonLocked', params)
    : showStars
      ? t('levels.stageButton', params)
      : t('practice.stageButton', params);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !unlocked }}
      disabled={!unlocked}
      onPress={onPress}
      style={({ pressed }) => [styles.stage, !unlocked && styles.locked, pressed && styles.pressed]}
    >
      <Text style={styles.letter}>{letter}</Text>
      {!unlocked ? (
        <Text style={styles.lock}>🔒</Text>
      ) : showStars ? (
        <Text style={styles.stars}>
          {'★'.repeat(stars)}
          <Text style={styles.emptyStars}>{'☆'.repeat(3 - stars)}</Text>
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.textMuted,
    fontSize: 26,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    gap: 2,
  },
  levelTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  levelName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  stages: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stage: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  locked: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  letter: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  stars: {
    color: colors.warning,
    fontSize: 16,
  },
  emptyStars: {
    color: colors.textMuted,
  },
  lock: {
    fontSize: 16,
  },
});

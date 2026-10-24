// Tela de níveis (docs/SCREENS.md §3.3): níveis com as 3 etapas, estrelas e cadeados.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEVELS } from '@/engine/config/levels';
import type { StageProgress } from '@/engine/progression';
import { useProgress } from '@/store/progress';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { levelName, levelTitle } from './names';

interface LevelsScreenProps {
  onPlay: (stageId: string) => void;
  onBack: () => void;
}

export function LevelsScreen({ onPlay, onBack }: LevelsScreenProps) {
  const stages = useProgress((s) => s.stages);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={onBack}
            hitSlop={12}
            style={styles.back}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Níveis
          </Text>
        </View>

        {LEVELS.map((level) => (
          <View key={level.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.levelTitle}>{levelTitle(level.id)}</Text>
              <Text style={styles.levelName}>{levelName(level.id)}</Text>
            </View>
            <View style={styles.stages}>
              {level.stages.map((stage) => {
                const stageId = `${level.id}-${stage.id}`;
                return (
                  <StageButton
                    key={stageId}
                    levelLabel={levelTitle(level.id)}
                    letter={stage.id}
                    progress={stages[stageId]}
                    onPress={() => onPlay(stageId)}
                  />
                );
              })}
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
  onPress,
}: {
  levelLabel: string;
  letter: string;
  progress: StageProgress | undefined;
  onPress: () => void;
}) {
  const unlocked = progress?.unlocked === true;
  const stars = progress?.bestStars ?? 0;
  const label = unlocked
    ? `${levelLabel}, etapa ${letter}, ${stars} de 3 estrelas`
    : `${levelLabel}, etapa ${letter}, bloqueada`;

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
      {unlocked ? (
        <Text style={styles.stars}>
          {'★'.repeat(stars)}
          <Text style={styles.emptyStars}>{'☆'.repeat(3 - stars)}</Text>
        </Text>
      ) : (
        <Text style={styles.lock}>🔒</Text>
      )}
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

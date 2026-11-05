// Teste de nivelamento (docs/SCREENS.md §2, docs/GAME_RULES.md §10). Sem tela de correção.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { setupCheckpoint } from '@/engine/placement';
import { levelNumber } from '@/engine/stages';
import type { InputDirection } from '@/engine/types';
import type { KeyTarget } from '@/features/keypad/usePhysicalKeyboard';
import { levelName } from '@/features/levels/names';
import { RoundBoard } from '@/features/round/RoundBoard';
import { type RoundEnd, useRound } from '@/features/round/useRound';
import { useSaveRound } from '@/features/round/useSaveRound';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { usePlacement } from './usePlacement';

interface PlacementScreenProps {
  /** Terminou e viu o resultado. */
  onDone: () => void;
  /** Saiu antes de terminar. */
  onExit: () => void;
  /** Seed fixa (testes). */
  seed?: number;
  keyboardTarget?: KeyTarget | null;
}

export function PlacementScreen({ onDone, onExit, seed, keyboardTarget }: PlacementScreenProps) {
  const { t } = useTranslation();
  const placement = usePlacement({ seed });
  const direction = useSettings((s) => s.inputDirection);

  if (placement.phase === 'block' && placement.levelId) {
    return (
      <PlacementBlock
        key={placement.blockSeed}
        levelId={placement.levelId}
        seed={placement.blockSeed}
        direction={direction}
        label={t('placement.block', {
          current: placement.blockNumber,
          total: placement.totalBlocks,
        })}
        onFinished={placement.finishBlock}
        onExit={onExit}
        keyboardTarget={keyboardTarget}
      />
    );
  }

  if (placement.phase === 'between') {
    return (
      <Message title={t('placement.between')} text={t('placement.betweenHint')}>
        <Button label={t('placement.continue')} onPress={placement.next} />
      </Message>
    );
  }

  if (placement.phase === 'done') {
    const [level] = placement.startStageId.split('-');
    const name = levelName(t, level);
    return (
      <Message
        title={t('placement.doneTitle', { n: levelNumber(level) })}
        text={
          placement.startStageId === 'L01-A'
            ? t('placement.doneHintFirst', { name })
            : t('placement.doneHint', { name })
        }
      >
        <Button label={t('placement.go')} onPress={onDone} />
      </Message>
    );
  }

  return (
    <Message title={t('placement.title')} text={t('placement.intro')}>
      <Button label={t('placement.start')} onPress={placement.start} />
      <Button label={t('placement.notNow')} onPress={onExit} variant="secondary" />
    </Message>
  );
}

function PlacementBlock({
  levelId,
  seed,
  direction,
  label,
  onFinished,
  onExit,
  keyboardTarget,
}: {
  levelId: string;
  seed: number;
  direction: InputDirection;
  label: string;
  onFinished: ReturnType<typeof usePlacement>['finishBlock'];
  onExit: () => void;
  keyboardTarget?: KeyTarget | null;
}) {
  const { t } = useTranslation();
  const [setup] = useState(() => setupCheckpoint(levelId, seed));
  const saveRound = useSaveRound();

  const handleEnd = (end: RoundEnd) => {
    const record = saveRound({ stageId: setup.stageId, mode: 'placement', seed, direction, end });
    if (record && end.status === 'completed') onFinished(record);
    else onExit();
  };

  const round = useRound({ setup, direction, onEnd: handleEnd });

  return (
    <RoundBoard
      round={round}
      direction={direction}
      label={label}
      exitTexts={{
        title: t('placement.exitTitle'),
        message: t('placement.exitMessage'),
        confirm: t('placement.exitConfirm'),
        cancel: t('placement.exitCancel'),
      }}
      keyboardTarget={keyboardTarget}
    />
  );
}

function Message({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.text}>{text}</Text>
        <View style={styles.actions}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

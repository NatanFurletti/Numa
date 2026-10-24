import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playModeFor } from '@/engine/progress';
import { buildRoundRecord } from '@/engine/round-record';
import { isKnownStage, type PlayMode } from '@/engine/round-setup';
import type { InputDirection } from '@/engine/types';
import { Keypad } from '@/features/keypad/Keypad';
import { type KeyTarget, usePhysicalKeyboard } from '@/features/keypad/usePhysicalKeyboard';
import { appVersion } from '@/lib/app-info';
import { systemClock } from '@/lib/clock';
import { localDateString } from '@/lib/date';
import { toIsoString } from '@/lib/format';
import { newId } from '@/lib/id';
import { randomSeed } from '@/lib/seed';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { ProblemQueue } from './ProblemQueue';
import { TimeBar } from './TimeBar';
import { type RoundEnd, useRound } from './useRound';

interface PlayScreenProps {
  stageId: string;
  /** Modo pedido. Um desafio vira aquecimento se a etapa tiver aquecimento pendente. */
  mode: PlayMode;
  /** Sem ela, usa a direção das configurações. */
  direction?: InputDirection;
  /** Seed fixa (testes). Sem ela, cada rodada sorteia uma. */
  seed?: number;
  /** Rodada concluída e gravada no histórico. */
  onFinished: (roundId: string) => void;
  onExit: () => void;
  keyboardTarget?: KeyTarget | null;
}

export function PlayScreen({ stageId, ...props }: PlayScreenProps) {
  const { t } = useTranslation();
  const unlocked = useProgress((s) => s.stages[stageId]?.unlocked === true);
  if (!isKnownStage(stageId) || !unlocked) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>
          {isKnownStage(stageId) ? t('common.stageLocked') : t('common.stageNotFound')}
        </Text>
        <Button label={t('common.home')} onPress={props.onExit} />
      </View>
    );
  }
  return <RoundView stageId={stageId} {...props} />;
}

function RoundView({
  stageId,
  mode: requestedMode,
  direction: directionProp,
  seed: seedProp,
  onFinished,
  onExit,
  keyboardTarget,
}: PlayScreenProps) {
  const { t } = useTranslation();
  const [seed] = useState(() => seedProp ?? randomSeed());
  // Decidido uma vez, ao abrir: o fim da rodada muda o progresso, mas não o modo dela.
  const [mode] = useState(() => playModeFor(useProgress.getState(), stageId, requestedMode));
  const recordRound = useProgress((s) => s.recordRound);
  const settingsDirection = useSettings((s) => s.inputDirection);
  const direction = directionProp ?? settingsDirection;
  const addRound = useHistory((s) => s.addRound);

  const handleEnd = ({ status, summary, startedAt, timeLimitMs }: RoundEnd) => {
    // Saiu durante a contagem: nenhuma conta apareceu, não há o que gravar.
    if (startedAt === null) {
      onExit();
      return;
    }
    const id = newId();
    const record = buildRoundRecord({
      id,
      appVersion,
      stageId,
      mode,
      status,
      seed,
      startedAt: toIsoString(startedAt),
      timeLimitMs,
      inputDirection: direction,
      summary,
    });
    addRound(record);
    recordRound(record, localDateString(systemClock.now()));
    if (status === 'completed') onFinished(id);
    else onExit();
  };

  const round = useRound({
    stageId,
    mode,
    seed,
    direction,
    onEnd: handleEnd,
  });
  const [confirmingExit, setConfirmingExit] = useState(false);

  usePhysicalKeyboard({
    onDigit: round.pressDigit,
    onBackspace: round.pressBackspace,
    onSubmit: round.submit,
    enabled: round.phase === 'playing' && !confirmingExit,
    target: keyboardTarget,
  });

  // O onEnd do useRound grava a rodada abandonada e chama o onExit.
  const exit = () => {
    setConfirmingExit(false);
    round.abandon();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('round.exit')}
            onPress={() => setConfirmingExit(true)}
            hitSlop={12}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          {mode === 'warmup' ? <Text style={styles.warmup}>{t('modes.warmup')}</Text> : null}
        </View>

        <TimeBar ratio={round.timeRatio} timeUp={round.timeUp} />

        <View style={styles.middle}>
          {round.phase === 'countdown' ? (
            <Text
              style={styles.countdown}
              accessibilityLabel={t('round.countdown', { n: round.countdown })}
            >
              {round.countdown}
            </Text>
          ) : (
            <ProblemQueue
              problems={round.visible}
              answerText={round.answerText}
              direction={direction}
            />
          )}
        </View>

        <Keypad
          onDigit={round.pressDigit}
          onBackspace={round.pressBackspace}
          onSubmit={round.submit}
          submitDisabled={!round.canSubmit}
        />
      </View>

      <ConfirmDialog
        visible={confirmingExit}
        title={t('round.exitTitle')}
        message={t('round.exitMessage')}
        confirmLabel={t('round.exitConfirm')}
        cancelLabel={t('round.exitCancel')}
        onConfirm={exit}
        onCancel={() => setConfirmingExit(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    gap: spacing.md,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: maxContentWidth,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 24,
  },
  warmup: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    color: colors.text,
    fontSize: 96,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});

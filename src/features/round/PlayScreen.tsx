import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isKnownStage, type PlayMode } from '@/engine/round-setup';
import type { RoundSummary } from '@/engine/round';
import type { InputDirection } from '@/engine/types';
import { Keypad } from '@/features/keypad/Keypad';
import { type KeyTarget, usePhysicalKeyboard } from '@/features/keypad/usePhysicalKeyboard';
import { formatSeconds } from '@/lib/format';
import { randomSeed } from '@/lib/seed';
import { Button } from '@/ui/Button';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { ProblemQueue } from './ProblemQueue';
import { TimeBar } from './TimeBar';
import { useRound } from './useRound';

interface PlayScreenProps {
  stageId: string;
  mode: PlayMode;
  direction?: InputDirection;
  /** Seed fixa (testes). Sem ela, cada rodada sorteia uma. */
  seed?: number;
  onExit: () => void;
  keyboardTarget?: KeyTarget | null;
}

export function PlayScreen({ stageId, ...props }: PlayScreenProps) {
  if (!isKnownStage(stageId)) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>Etapa não encontrada.</Text>
        <Button label="Início" onPress={props.onExit} />
      </View>
    );
  }
  return <PlaySession stageId={stageId} {...props} />;
}

function PlaySession({ seed, ...props }: PlayScreenProps) {
  const [sessionSeed, setSessionSeed] = useState(() => seed ?? randomSeed());
  // Cada "Jogar de novo" monta uma rodada nova, com contas novas.
  return (
    <RoundView
      key={sessionSeed}
      seed={sessionSeed}
      onPlayAgain={() => setSessionSeed(randomSeed())}
      {...props}
    />
  );
}

interface RoundViewProps extends Omit<PlayScreenProps, 'seed'> {
  seed: number;
  onPlayAgain: () => void;
}

function RoundView({
  stageId,
  mode,
  direction = 'ltr',
  seed,
  onExit,
  onPlayAgain,
  keyboardTarget,
}: RoundViewProps) {
  const round = useRound({ stageId, mode, seed, direction });
  const [confirmingExit, setConfirmingExit] = useState(false);

  usePhysicalKeyboard({
    onDigit: round.pressDigit,
    onBackspace: round.pressBackspace,
    onSubmit: round.submit,
    enabled: round.phase === 'playing' && !confirmingExit,
    target: keyboardTarget,
  });

  const exit = () => {
    setConfirmingExit(false);
    round.abandon();
    onExit();
  };

  if (round.phase === 'finished' && round.summary) {
    return (
      <FinishPanel
        summary={round.summary}
        timeLimitMs={round.timeLimitMs}
        onPlayAgain={onPlayAgain}
        onExit={onExit}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair"
            onPress={() => setConfirmingExit(true)}
            hitSlop={12}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          {mode === 'warmup' ? <Text style={styles.warmup}>Aquecimento</Text> : null}
        </View>

        <TimeBar ratio={round.timeRatio} timeUp={round.timeUp} />

        <View style={styles.middle}>
          {round.phase === 'countdown' ? (
            <Text style={styles.countdown} accessibilityLabel={`Começa em ${round.countdown}`}>
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
        title="Sair da rodada?"
        message="Esta rodada não vai contar para o seu progresso."
        confirmLabel="Sair da rodada"
        cancelLabel="Continuar jogando"
        onConfirm={exit}
        onCancel={() => setConfirmingExit(false)}
      />
    </View>
  );
}

// Provisório: substituído pela tela de resultado no M3.
function FinishPanel({
  summary,
  timeLimitMs,
  onPlayAgain,
  onExit,
}: {
  summary: RoundSummary;
  timeLimitMs: number | null;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  const time =
    timeLimitMs === null
      ? formatSeconds(summary.elapsedMs)
      : summary.overtimeMs > 0
        ? `${formatSeconds(summary.elapsedMs)}, passou ${formatSeconds(summary.overtimeMs)}`
        : `${formatSeconds(summary.elapsedMs)} de ${formatSeconds(timeLimitMs)}`;

  return (
    <View style={[styles.screen, styles.centered]}>
      <View style={[styles.content, styles.finish]}>
        <Text style={styles.title}>Rodada concluída!</Text>
        <Text style={styles.score}>{`${summary.correct}/${summary.total}`}</Text>
        <Text style={styles.time}>{time}</Text>
        <Button label="Jogar de novo" onPress={onPlayAgain} />
        <Button label="Início" onPress={onExit} variant="secondary" />
      </View>
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
  finish: {
    flex: 0,
    alignItems: 'stretch',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  score: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  time: {
    color: colors.textMuted,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

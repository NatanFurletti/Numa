// A rodada na tela: sair (com confirmação), barra de tempo, contagem, contas e teclado.
// Usada pela rodada normal (PlayScreen) e pelos blocos do nivelamento.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { InputDirection } from '@/engine/types';
import { Keypad } from '@/features/keypad/Keypad';
import { type KeyTarget, usePhysicalKeyboard } from '@/features/keypad/usePhysicalKeyboard';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { ProblemQueue } from './ProblemQueue';
import { TimeBar } from './TimeBar';
import type { useRound } from './useRound';

export interface ExitTexts {
  title: string;
  message: string;
  confirm: string;
  cancel: string;
}

interface RoundBoardProps {
  round: ReturnType<typeof useRound>;
  direction: InputDirection;
  /** Rótulo no topo (ex.: "Aquecimento"). */
  label?: string;
  exitTexts: ExitTexts;
  keyboardTarget?: KeyTarget | null;
}

export function RoundBoard({
  round,
  direction,
  label,
  exitTexts,
  keyboardTarget,
}: RoundBoardProps) {
  const { t } = useTranslation();
  const [confirmingExit, setConfirmingExit] = useState(false);

  usePhysicalKeyboard({
    onDigit: round.pressDigit,
    onBackspace: round.pressBackspace,
    onSubmit: round.submit,
    enabled: round.phase === 'playing' && !confirmingExit,
    target: keyboardTarget,
  });

  // Quem usa o RoundBoard trata o abandono no onEnd do useRound.
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
          {label ? <Text style={styles.label}>{label}</Text> : null}
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
              layout={round.layout}
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
        title={exitTexts.title}
        message={exitTexts.message}
        confirmLabel={exitTexts.confirm}
        cancelLabel={exitTexts.cancel}
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
  label: {
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
});

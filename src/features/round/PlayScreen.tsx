import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { playModeFor } from '@/engine/progress';
import { isKnownStage, type PlayMode, setupRound } from '@/engine/round-setup';
import type { InputDirection } from '@/engine/types';
import type { KeyTarget } from '@/features/keypad/usePhysicalKeyboard';
import { randomSeed } from '@/lib/seed';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { colors, spacing } from '@/ui/theme';

import { RoundBoard } from './RoundBoard';
import { type RoundEnd, useRound } from './useRound';
import { useSaveRound } from './useSaveRound';

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
      <View style={styles.screen}>
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
  const [setup] = useState(() => setupRound({ stageId, mode, seed }));
  const settingsDirection = useSettings((s) => s.inputDirection);
  const direction = directionProp ?? settingsDirection;
  const saveRound = useSaveRound();

  const handleEnd = (end: RoundEnd) => {
    const record = saveRound({ stageId, mode, seed, direction, end });
    if (record && end.status === 'completed') onFinished(record.id);
    else onExit();
  };

  const round = useRound({ setup, direction, onEnd: handleEnd });

  return (
    <RoundBoard
      round={round}
      direction={direction}
      label={mode === 'warmup' ? t('modes.warmup') : undefined}
      exitTexts={{
        title: t('round.exitTitle'),
        message: t('round.exitMessage'),
        confirm: t('round.exitConfirm'),
        cancel: t('round.exitCancel'),
      }}
      keyboardTarget={keyboardTarget}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});

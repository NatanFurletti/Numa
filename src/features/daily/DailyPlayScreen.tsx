// A rodada do teste do dia (docs/GAME_RULES.md §13): as contas do dia, sem barra de tempo,
// uma tentativa só.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { setupDailyTest } from '@/engine/daily';
import type { KeyTarget } from '@/features/keypad/usePhysicalKeyboard';
import { RoundBoard } from '@/features/round/RoundBoard';
import { type RoundEnd, useRound } from '@/features/round/useRound';
import { systemClock } from '@/lib/clock';
import { localDateString } from '@/lib/date';
import { useDaily } from '@/store/daily';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { colors, spacing } from '@/ui/theme';

interface DailyPlayScreenProps {
  /** A tentativa terminou (ou já tinha sido usada): mostrar o resultado e o ranking. */
  onDone: () => void;
  /** Saiu durante a contagem: nenhuma conta apareceu, a tentativa continua valendo. */
  onExit: () => void;
  keyboardTarget?: KeyTarget | null;
}

export function DailyPlayScreen(props: DailyPlayScreenProps) {
  const { t } = useTranslation();
  const [day] = useState(() => localDateString(systemClock.now()));
  // Decidido ao abrir: terminar o teste grava a tentativa, mas esta tela continua sendo a rodada.
  const [alreadyPlayed] = useState(() => useDaily.getState().attempts[day] !== undefined);

  if (alreadyPlayed) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>{t('daily.alreadyPlayed')}</Text>
        <Button label={t('daily.seeResult')} onPress={props.onDone} />
      </View>
    );
  }
  return <DailyRound day={day} {...props} />;
}

function DailyRound({
  day,
  onDone,
  onExit,
  keyboardTarget,
}: DailyPlayScreenProps & { day: string }) {
  const { t } = useTranslation();
  const [setup] = useState(() => setupDailyTest(day));
  const direction = useSettings((s) => s.inputDirection);
  const startAttempt = useDaily((s) => s.startAttempt);
  const finishAttempt = useDaily((s) => s.finishAttempt);
  const recordPlayedDay = useProgress((s) => s.recordPlayedDay);

  const handleEnd = (end: RoundEnd) => {
    if (end.startedAt === null) {
      onExit();
      return;
    }
    const { correct, total, elapsedMs, problems } = end.summary;
    finishAttempt(day, { correct, total, elapsedMs, problems });
    // Como nas rodadas, só o teste concluído conta como dia jogado.
    if (end.status === 'completed') recordPlayedDay(day);
    onDone();
  };

  const round = useRound({ setup, direction, onEnd: handleEnd });

  // As contas apareceram: a tentativa do dia está usada, mesmo se o app fechar no meio.
  const playing = round.phase === 'playing';
  useEffect(() => {
    if (playing) startAttempt(day);
  }, [playing, day, startAttempt]);

  return (
    <RoundBoard
      round={round}
      direction={direction}
      label={t('daily.title')}
      exitTexts={{
        title: t('daily.exitTitle'),
        message: t('daily.exitMessage'),
        confirm: t('daily.exitConfirm'),
        cancel: t('daily.exitCancel'),
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});

// Tela de resultado (docs/GAME_RULES.md §5, docs/SCREENS.md §3.6).

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { roundOutcome, type RoundOutcome, type RoundRecord } from '@/engine/round-record';
import type { PlayMode } from '@/engine/round-setup';
import { stageLabel } from '@/features/levels/names';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { moodForMessage } from './mascot-mood';
import { MascotMessage } from './MascotMessage';
import { ProblemRow } from './ProblemRow';
import { Stars } from './Stars';
import { comparisonText, messageText, scoreTimeText } from './texts';

interface ResultScreenProps {
  roundId: string;
  onReview: () => void;
  onPlay: (stageId: string, mode: PlayMode) => void;
  onHome: () => void;
}

export function ResultScreen({ roundId, onReview, onPlay, onHome }: ResultScreenProps) {
  const { t } = useTranslation();
  const rounds = useHistory((s) => s.rounds);
  const round = rounds.find((r) => r.id === roundId);
  const warmupNext = useProgress((s) =>
    round ? s.stages[round.stageId]?.pendingWarmup === true : false,
  );
  const outcome = round ? roundOutcome(rounds, roundId) : undefined;

  if (!round || !outcome) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.message}>{t('common.roundNotFound')}</Text>
        <Button label={t('common.home')} onPress={onHome} />
      </View>
    );
  }

  const comparison = comparisonText(t, outcome.comparison);
  const modeLabel =
    round.mode === 'warmup' || round.mode === 'practice' ? t(`modes.${round.mode}`) : null;
  const warmupAhead = warmupNext && round.mode === 'challenge' && !outcome.passed;
  const playAgain = playAgainAction(t, round, outcome, warmupAhead);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stage}>{stageLabel(t, round.stageId)}</Text>
          {modeLabel ? <Text style={styles.mode}>{modeLabel}</Text> : null}
        </View>

        <View style={styles.scoreBlock}>
          <Text style={styles.score}>{`${round.correct}/${round.total}`}</Text>
          <Text style={styles.time}>{scoreTimeText(t, round)}</Text>
        </View>

        {outcome.stars !== null ? <Stars count={outcome.stars} /> : null}
        {outcome.message ? (
          <MascotMessage
            text={messageText(t, outcome.message)}
            mood={moodForMessage(outcome.message.key)}
          />
        ) : null}
        {comparison ? <Text style={styles.comparison}>{comparison}</Text> : null}
        {warmupAhead ? <Text style={styles.warmup}>{t('result.warmupAhead')}</Text> : null}

        <View style={styles.list}>
          {round.problems.map((problem, i) => (
            <ProblemRow key={i} problem={problem} />
          ))}
        </View>

        <View style={styles.actions}>
          {outcome.wrongCount > 0 ? <Button label={t('result.review')} onPress={onReview} /> : null}
          <Button
            label={playAgain.label}
            onPress={() => onPlay(playAgain.stageId, playAgain.mode)}
            variant={outcome.wrongCount > 0 ? 'secondary' : 'primary'}
          />
          <Button label={t('common.home')} onPress={onHome} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}

function playAgainAction(
  t: TFunction,
  round: RoundRecord,
  outcome: RoundOutcome,
  warmupAhead: boolean,
) {
  const same = { stageId: round.stageId, mode: 'challenge' as PlayMode };
  if (round.mode === 'practice') {
    return { ...same, mode: 'practice' as PlayMode, label: t('result.practiceAgain') };
  }
  if (round.mode === 'warmup') return { ...same, label: t('result.backToChallenge') };
  // O pedido continua sendo um desafio: a rodada vira aquecimento sozinha (playModeFor).
  if (warmupAhead) return { ...same, label: t('result.doWarmup') };
  if (!outcome.passed) return { ...same, label: t('result.retry') };
  if (outcome.nextStageId) {
    return { ...same, stageId: outcome.nextStageId, label: t('result.nextStage') };
  }
  return { ...same, label: t('result.playAgain') };
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stage: {
    color: colors.textMuted,
    fontSize: 16,
  },
  mode: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBlock: {
    alignItems: 'center',
  },
  score: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  time: {
    color: colors.textMuted,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  message: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  warmup: {
    color: colors.warning,
    fontSize: 16,
    textAlign: 'center',
  },
  comparison: {
    color: colors.success,
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

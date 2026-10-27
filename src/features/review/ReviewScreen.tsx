// Tela de correção (docs/GAME_RULES.md §7, docs/SCREENS.md §3.7).

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Keypad } from '@/features/keypad/Keypad';
import { type KeyTarget, usePhysicalKeyboard } from '@/features/keypad/usePhysicalKeyboard';
import { formatProblem } from '@/features/round/ProblemQueue';
import { StackedProblem } from '@/features/round/StackedProblem';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { DirectionTip } from './DirectionTip';
import { useReview } from './useReview';

interface ReviewScreenProps {
  roundId: string;
  /** Volta para o resultado. */
  onBack: () => void;
  onHome: () => void;
  keyboardTarget?: KeyTarget | null;
}

export function ReviewScreen({ roundId, onBack, onHome, keyboardTarget }: ReviewScreenProps) {
  const { t } = useTranslation();
  const review = useReview({ roundId });

  usePhysicalKeyboard({
    onDigit: review.pressDigit,
    onBackspace: review.pressBackspace,
    onSubmit: review.submit,
    enabled: review.status === 'answering' || review.status === 'revealed',
    target: keyboardTarget,
  });

  if (!review.found) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>{t('common.roundNotFound')}</Text>
        <Button label={t('common.home')} onPress={onHome} />
      </View>
    );
  }

  if (review.status === 'done' || !review.item) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <View style={[styles.content, styles.done]}>
          <Text style={styles.title}>{t('review.done')}</Text>
          <Button label={t('review.backToResult')} onPress={onBack} />
          <Button label={t('common.home')} onPress={onHome} variant="secondary" />
        </View>
      </View>
    );
  }

  const { item } = review;
  const answer = (
    <Answer
      status={review.status}
      text={review.status === 'revealed' ? String(item.expected) : review.answerText}
      direction={review.direction}
    />
  );

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onBack}
            hitSlop={12}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.progress}>
            {t('review.progress', { current: review.position + 1, total: review.total })}
          </Text>
          <View style={styles.close} />
        </View>

        {review.showTip ? <DirectionTip onDismiss={review.dismissTip} /> : null}

        <View style={styles.middle}>
          <Shake trigger={review.wrongCount}>
            <View style={styles.row}>
              {review.layout === 'vertical' ? (
                <StackedProblem
                  problem={item.problem}
                  answer={answer}
                  accessibilityLabel={formatProblem(item.problem)}
                  testID="current-problem"
                />
              ) : (
                <>
                  <Text testID="current-problem" style={styles.expression}>
                    {formatProblem(item.problem)}
                  </Text>
                  {answer}
                </>
              )}
              {review.status === 'correct' ? (
                <Text
                  style={[styles.expression, styles.correct]}
                  accessibilityLabel={t('review.correct')}
                >
                  ✓
                </Text>
              ) : null}
            </View>
          </Shake>

          <Text style={styles.hint}>
            {review.status === 'revealed'
              ? t('review.revealed')
              : review.lastWrong
                ? t('review.tryAgain')
                : item.roundAnswer === null
                  ? t('review.roundNoAnswer')
                  : t('review.roundAnswer', { answer: item.roundAnswer })}
          </Text>

          {review.canReveal ? (
            <Button label={t('review.reveal')} onPress={review.reveal} variant="secondary" />
          ) : null}
          {review.status === 'revealed' ? (
            <Button label={t('review.next')} onPress={review.next} />
          ) : null}
        </View>

        <Keypad
          onDigit={review.pressDigit}
          onBackspace={review.pressBackspace}
          onSubmit={review.submit}
          submitDisabled={!review.canSubmit}
        />
      </View>
    </View>
  );
}

function Answer({
  status,
  text,
  direction,
}: {
  status: string;
  text: string;
  direction: 'ltr' | 'rtl';
}) {
  const answering = status === 'answering';
  const color =
    status === 'correct' ? styles.correct : status === 'revealed' ? styles.revealed : null;
  return (
    <View testID="review-answer" style={styles.answer}>
      {answering && direction === 'rtl' ? <Text style={styles.cursor}>▌</Text> : null}
      <Text style={[styles.expression, color]}>{text}</Text>
      {answering && direction === 'ltr' ? <Text style={styles.cursor}>▌</Text> : null}
    </View>
  );
}

/** Tremida curta a cada vez que `trigger` muda (resposta errada). */
function Shake({ trigger, children }: { trigger: number; children: React.ReactNode }) {
  const offset = useSharedValue(0);
  useEffect(() => {
    if (trigger === 0) return;
    offset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [trigger, offset]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
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
  done: {
    flex: 0,
    alignItems: 'stretch',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  progress: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expression: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  cursor: {
    color: colors.accent,
    fontSize: 48,
    fontWeight: '700',
  },
  correct: {
    color: colors.success,
  },
  revealed: {
    color: colors.accent,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});

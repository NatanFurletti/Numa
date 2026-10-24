// Tela de correção (docs/GAME_RULES.md §7, docs/SCREENS.md §3.7).

import { useEffect } from 'react';
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
        <Text style={styles.title}>Rodada não encontrada.</Text>
        <Button label="Início" onPress={onHome} />
      </View>
    );
  }

  if (review.status === 'done' || !review.item) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <View style={[styles.content, styles.done]}>
          <Text style={styles.title}>Tudo corrigido! 👏</Text>
          <Button label="Voltar ao resultado" onPress={onBack} />
          <Button label="Início" onPress={onHome} variant="secondary" />
        </View>
      </View>
    );
  }

  const { item } = review;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={onBack}
            hitSlop={12}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.progress}>{`${review.position + 1} de ${review.total}`}</Text>
          <View style={styles.close} />
        </View>

        {review.showTip ? <DirectionTip onDismiss={review.dismissTip} /> : null}

        <View style={styles.middle}>
          <Shake trigger={review.wrongCount}>
            <View style={styles.row}>
              <Text style={styles.expression}>{formatProblem(item.problem)}</Text>
              <Answer
                status={review.status}
                text={review.status === 'revealed' ? String(item.expected) : review.answerText}
                direction={review.direction}
              />
              {review.status === 'correct' ? (
                <Text style={[styles.expression, styles.correct]} accessibilityLabel="Certa!">
                  ✓
                </Text>
              ) : null}
            </View>
          </Shake>

          <Text style={styles.hint}>
            {review.status === 'revealed'
              ? 'Esta é a resposta certa.'
              : review.lastWrong
                ? 'Quase! Tente de novo.'
                : item.roundAnswer === null
                  ? 'Na rodada você não respondeu.'
                  : `Na rodada você respondeu ${item.roundAnswer}`}
          </Text>

          {review.canReveal ? (
            <Button label="Ver resposta" onPress={review.reveal} variant="secondary" />
          ) : null}
          {review.status === 'revealed' ? <Button label="Próxima" onPress={review.next} /> : null}
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

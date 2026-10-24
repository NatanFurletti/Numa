import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { InputDirection, Problem } from '@/engine/types';
import { colors, spacing } from '@/ui/theme';

// Troca de conta curta (≤ 150 ms), sem bloquear a digitação (docs/SCREENS.md §3.4).
const SWAP_MS = 150;

interface ProblemQueueProps {
  /** Conta atual e as próximas (no máximo 2). */
  problems: Problem[];
  answerText: string;
  direction: InputDirection;
}

export function formatProblem(problem: Problem): string {
  const sign = problem.op === 'add' ? '+' : '−';
  return `${problem.a} ${sign} ${problem.b} =`;
}

const problemId = (p: Problem) => `${p.a}${p.op}${p.b}`;

function Cursor() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0, { duration: 530 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[styles.current, styles.cursor, style]}>▌</Animated.Text>;
}

export function ProblemQueue({ problems, answerText, direction }: ProblemQueueProps) {
  const [current, ...next] = problems;
  if (!current) return null;
  const expression = formatProblem(current);

  return (
    <View style={styles.queue}>
      <Animated.View
        key={problemId(current)}
        entering={FadeIn.duration(SWAP_MS)}
        exiting={FadeOutUp.duration(SWAP_MS)}
        layout={LinearTransition.duration(SWAP_MS)}
        style={styles.row}
        accessible
        accessibilityLabel={`${expression} ${answerText}`.trim()}
      >
        <Text testID="current-problem" style={styles.current}>
          {expression}
        </Text>
        <View testID="answer" style={styles.answer}>
          {direction === 'rtl' ? <Cursor /> : null}
          <Text style={styles.current}>{answerText}</Text>
          {direction === 'ltr' ? <Cursor /> : null}
        </View>
      </Animated.View>

      {next.slice(0, 2).map((problem, i) => (
        <Animated.View
          key={problemId(problem)}
          entering={FadeIn.duration(SWAP_MS)}
          layout={LinearTransition.duration(SWAP_MS)}
          style={styles.row}
        >
          <Text style={[styles.upcoming, i === 0 ? styles.second : styles.third]}>
            {i === 0 ? `${formatProblem(problem)} ?` : formatProblem(problem)}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  queue: {
    alignItems: 'center',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  current: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cursor: {
    color: colors.accent,
  },
  upcoming: {
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  second: {
    fontSize: 28,
    opacity: 0.5,
  },
  third: {
    fontSize: 22,
    opacity: 0.3,
  },
});

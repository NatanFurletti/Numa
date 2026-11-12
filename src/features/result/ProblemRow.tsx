// Uma linha da lista de contas (resultado da rodada e do teste do dia): ✓ ou ✗, a conta e,
// se errada, a resposta dada.

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { ProblemAttempt } from '@/engine/types';
import { colors, spacing } from '@/ui/theme';

import { problemLine } from './texts';

export function ProblemRow({ problem }: { problem: ProblemAttempt }) {
  const { t } = useTranslation();
  const line = problemLine(problem);
  const answered =
    problem.answer === null
      ? t('result.noAnswer')
      : t('result.youAnswered', { answer: problem.answer });
  const label = problem.correct
    ? t('result.right', { line })
    : t('result.wrong', { line, answered });

  return (
    <View
      style={[styles.row, !problem.correct && styles.rowWrong]}
      accessible
      accessibilityLabel={label}
    >
      <Text style={[styles.mark, problem.correct ? styles.markRight : styles.markWrong]}>
        {problem.correct ? '✓' : '✗'}
      </Text>
      <Text style={[styles.line, problem.correct && styles.lineRight]}>{line}</Text>
      {problem.correct ? null : <Text style={styles.answered}>{answered}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  rowWrong: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  mark: {
    width: 20,
    fontSize: 18,
    fontWeight: '700',
  },
  markRight: {
    color: colors.success,
    opacity: 0.7,
  },
  markWrong: {
    color: colors.error,
  },
  line: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  lineRight: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  answered: {
    color: colors.error,
    fontSize: 16,
  },
});

// Conta armada, como no papel (D-028):
//
//     432
//   + 257
//   ─────
//     689▌
//
// Os números ficam alinhados pela direita (unidade embaixo de unidade) e a resposta entra
// embaixo da linha. Usada na rodada e na correção dos níveis armados.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Problem } from '@/engine/types';
import { colors, spacing } from '@/ui/theme';

interface StackedProblemProps {
  problem: Problem;
  /** O que aparece embaixo da linha (a resposta, com cursor ou cor). */
  answer: ReactNode;
  /** Rótulo para leitores de tela (a conta lida numa linha só). */
  accessibilityLabel: string;
  testID?: string;
}

export function StackedProblem({
  problem,
  answer,
  accessibilityLabel,
  testID,
}: StackedProblemProps) {
  const sign = problem.op === 'add' ? '+' : '−';
  return (
    <View style={styles.stack} accessible accessibilityLabel={accessibilityLabel} testID={testID}>
      <Text style={[styles.number, styles.top]}>{problem.a}</Text>
      <View style={styles.operandRow}>
        <Text style={styles.number}>{sign}</Text>
        <Text style={styles.number}>{problem.b}</Text>
      </View>
      <View style={styles.line} />
      <View style={styles.answerRow}>{answer}</View>
    </View>
  );
}

export const stackedFontSize = 48;

const styles = StyleSheet.create({
  stack: {
    alignItems: 'stretch',
  },
  number: {
    color: colors.text,
    fontSize: stackedFontSize,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    lineHeight: stackedFontSize * 1.15,
  },
  top: {
    textAlign: 'right',
  },
  operandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  line: {
    height: 4,
    borderRadius: 2,
    marginVertical: spacing.xs,
    backgroundColor: colors.text,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: stackedFontSize * 1.15,
  },
});

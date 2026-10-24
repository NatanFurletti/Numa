// Textos do resultado (docs/GAME_RULES.md §5 e §6), traduzidos (src/i18n).

import type { TFunction } from 'i18next';

import type { PersonalComparison, ResultMessage } from '@/engine/feedback';
import type { Problem } from '@/engine/types';
import { formatProblem } from '@/features/round/ProblemQueue';
import { formatSeconds } from '@/lib/format';

/** "52s de 60s", "68s, passou 8s" ou só "41s" (treino livre). */
export function scoreTimeText(
  t: TFunction,
  round: { elapsedMs: number; timeLimitMs: number | null },
): string {
  const { elapsedMs, timeLimitMs } = round;
  const elapsed = formatSeconds(elapsedMs);
  if (timeLimitMs === null) return elapsed;
  if (elapsedMs > timeLimitMs) {
    return t('result.overtime', { elapsed, over: formatSeconds(elapsedMs - timeLimitMs) });
  }
  return t('result.time', { elapsed, limit: formatSeconds(timeLimitMs) });
}

export function messageText(t: TFunction, message: ResultMessage): string {
  return t(`result.messages.${message.key}`, {
    correct: message.correct,
    total: message.total,
    over: formatSeconds(message.overtimeMs),
  });
}

const seconds = (ms: number) => Math.round(ms / 1000);

/** Uma frase positiva, ou null. Melhoras que somem ao arredondar para segundos não aparecem. */
export function comparisonText(t: TFunction, comparison: PersonalComparison | null): string | null {
  if (!comparison) return null;
  switch (comparison.type) {
    case 'newBestTime':
      if (seconds(comparison.toMs) >= seconds(comparison.fromMs)) return null;
      return t('result.comparison.newBestTime', {
        from: formatSeconds(comparison.fromMs),
        to: formatSeconds(comparison.toMs),
      });
    case 'moreCorrect':
      return t('result.comparison.moreCorrect', { count: comparison.diff });
    case 'faster':
      if (seconds(comparison.diffMs) === 0) return null;
      return t('result.comparison.faster', { diff: formatSeconds(comparison.diffMs) });
  }
}

/** "24 + 73 = 97". */
export function problemLine(problem: Problem & { expected: number }): string {
  return `${formatProblem(problem)} ${problem.expected}`;
}

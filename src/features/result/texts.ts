// Textos do resultado (docs/GAME_RULES.md §5 e §6). Em português direto até o i18n (M5).

import type { PersonalComparison, ResultMessage } from '@/engine/feedback';
import type { Problem } from '@/engine/types';
import { formatProblem } from '@/features/round/ProblemQueue';
import { formatSeconds } from '@/lib/format';

/** "52s de 60s", "68s, passou 8s" ou só "41s" (treino livre). */
export function scoreTimeText(round: { elapsedMs: number; timeLimitMs: number | null }): string {
  const { elapsedMs, timeLimitMs } = round;
  const elapsed = formatSeconds(elapsedMs);
  if (timeLimitMs === null) return elapsed;
  if (elapsedMs > timeLimitMs)
    return `${elapsed}, passou ${formatSeconds(elapsedMs - timeLimitMs)}`;
  return `${elapsed} de ${formatSeconds(timeLimitMs)}`;
}

export function messageText(message: ResultMessage): string {
  switch (message.key) {
    case 'perfect':
      return 'Perfeito! Rápido e certeiro. 🔥';
    case 'stageCleared':
      return 'Etapa concluída! Bora para a próxima.';
    case 'accurateButSlow':
      return (
        `${message.correct} de ${message.total}, mandou muito bem! 🎯 ` +
        `Agora é ganhar velocidade: você passou ${formatSeconds(message.overtimeMs)} do tempo.`
      );
    case 'fastButInaccurate':
      return 'Rápido você já é! Agora foca na precisão, sem pressa.';
    case 'inaccurateAndSlow':
      return 'Começa pela precisão. A velocidade vem com a prática. 💪';
  }
}

const seconds = (ms: number) => Math.round(ms / 1000);

/** Uma frase positiva, ou null. Melhoras que somem ao arredondar para segundos não aparecem. */
export function comparisonText(comparison: PersonalComparison | null): string | null {
  if (!comparison) return null;
  switch (comparison.type) {
    case 'newBestTime':
      if (seconds(comparison.toMs) >= seconds(comparison.fromMs)) return null;
      return `Seu melhor tempo aqui: ${formatSeconds(comparison.fromMs)} → ${formatSeconds(comparison.toMs)}!`;
    case 'moreCorrect':
      return comparison.diff === 1
        ? '1 acerto a mais que da última vez.'
        : `${comparison.diff} acertos a mais que da última vez.`;
    case 'faster':
      if (seconds(comparison.diffMs) === 0) return null;
      return `Você foi ${formatSeconds(comparison.diffMs)} mais rápido que da última vez.`;
  }
}

/** "L07-B" → "Nível 7 · Etapa B". */
export function stageLabel(stageId: string): string {
  const [level, letter] = stageId.split('-');
  return `Nível ${Number(level.slice(1))} · Etapa ${letter}`;
}

/** "24 + 73 = 97". */
export function problemLine(problem: Problem & { expected: number }): string {
  return `${formatProblem(problem)} ${problem.expected}`;
}

// Escolha da mensagem do resultado e da comparação pessoal (docs/GAME_RULES.md §6).
// O engine só escolhe a chave; o texto final fica no i18n.

import { GAME_CONFIG } from './config/game-config';
import { accuracy, calculateStars, qualifiesForRecord, type RoundScore } from './scoring';

export type ResultMessageKey =
  'perfect' | 'stageCleared' | 'accurateButSlow' | 'fastButInaccurate' | 'inaccurateAndSlow';

export interface ResultMessage {
  key: ResultMessageKey;
  correct: number;
  total: number;
  overtimeMs: number;
}

export function resultMessage(score: RoundScore): ResultMessage {
  const stars = calculateStars(score);
  const accurate = accuracy(score.correct, score.total) >= GAME_CONFIG.stars.minAccuracy;
  const overtimeMs = Math.max(0, score.elapsedMs - score.limitMs);
  const inTime = overtimeMs === 0;

  let key: ResultMessageKey;
  if (stars === 3) key = 'perfect';
  else if (stars === 2) key = 'stageCleared';
  else if (accurate) key = 'accurateButSlow';
  else key = inTime ? 'fastButInaccurate' : 'inaccurateAndSlow';

  return { key, correct: score.correct, total: score.total, overtimeMs };
}

export type PersonalComparison =
  | { type: 'newBestTime'; fromMs: number; toMs: number }
  | { type: 'moreCorrect'; diff: number }
  | { type: 'faster'; diffMs: number };

export interface ComparisonInput {
  current: { correct: number; total: number; elapsedMs: number };
  /** Tentativa anterior na mesma etapa. */
  previous?: { correct: number; elapsedMs: number };
  /** Melhor tempo da etapa antes desta rodada. */
  previousBestTimeMs?: number;
}

/**
 * Uma única frase positiva, por ordem de prioridade. Sem melhora, nada.
 * Frases sobre tempo só valem para rodadas com acerto de recorde (records.minAccuracy).
 */
export function personalComparison(input: ComparisonInput): PersonalComparison | null {
  const { current, previous, previousBestTimeMs } = input;
  if (!previous) return null;

  const timeCounts = qualifiesForRecord(current.correct, current.total);
  if (timeCounts && previousBestTimeMs !== undefined && current.elapsedMs < previousBestTimeMs) {
    return { type: 'newBestTime', fromMs: previousBestTimeMs, toMs: current.elapsedMs };
  }
  if (current.correct > previous.correct) {
    return { type: 'moreCorrect', diff: current.correct - previous.correct };
  }
  if (timeCounts && current.elapsedMs < previous.elapsedMs) {
    return { type: 'faster', diffMs: previous.elapsedMs - current.elapsedMs };
  }
  return null;
}

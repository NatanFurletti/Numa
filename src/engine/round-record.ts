// Registro de uma rodada no histórico (docs/DATA.md §1.3) e as leituras que a tela de
// resultado faz a partir dele (docs/GAME_RULES.md §5 e §6).

import { GAME_CONFIG } from './config/game-config';
import {
  personalComparison,
  type PersonalComparison,
  resultMessage,
  type ResultMessage,
} from './feedback';
import type { RoundSummary } from './round';
import { calculateStars, qualifiesForRecord } from './scoring';
import { nextStageId } from './stages';
import type { InputDirection, Mode, ProblemAttempt, Stars } from './types';

export type RoundStatus = 'completed' | 'abandoned';

export interface RoundRecord {
  id: string;
  schemaVersion: 1;
  rulesVersion: number;
  appVersion: string;
  stageId: string;
  mode: Mode;
  status: RoundStatus;
  seed: number;
  /** ISO 8601. */
  startedAt: string;
  elapsedMs: number;
  /** null no treino livre. */
  timeLimitMs: number | null;
  correct: number;
  total: number;
  /** null fora do desafio concluído. */
  stars: Stars | null;
  inputDirection: InputDirection;
  problems: ProblemAttempt[];
}

export interface BuildRoundRecordInput {
  id: string;
  appVersion: string;
  stageId: string;
  mode: Mode;
  status: RoundStatus;
  seed: number;
  startedAt: string;
  timeLimitMs: number | null;
  inputDirection: InputDirection;
  summary: RoundSummary;
}

export function buildRoundRecord(input: BuildRoundRecordInput): RoundRecord {
  const { summary, ...rest } = input;
  const scored = input.mode === 'challenge' && input.status === 'completed';
  const stars =
    scored && input.timeLimitMs !== null
      ? calculateStars({
          correct: summary.correct,
          total: summary.total,
          elapsedMs: summary.elapsedMs,
          limitMs: input.timeLimitMs,
        })
      : null;
  return {
    ...rest,
    schemaVersion: 1,
    rulesVersion: GAME_CONFIG.rulesVersion,
    elapsedMs: summary.elapsedMs,
    correct: summary.correct,
    total: summary.total,
    stars,
    problems: summary.problems,
  };
}

const isCompletedChallenge = (r: RoundRecord, stageId: string) =>
  r.stageId === stageId && r.mode === 'challenge' && r.status === 'completed';

/** Rodadas de desafio concluídas na mesma etapa, antes de `roundId`. */
function earlierChallenges(history: readonly RoundRecord[], roundId: string): RoundRecord[] {
  const index = history.findIndex((r) => r.id === roundId);
  if (index < 0) return [];
  const { stageId } = history[index];
  return history.slice(0, index).filter((r) => isCompletedChallenge(r, stageId));
}

/** Tentativa anterior na mesma etapa (para a comparação pessoal). */
export function previousAttempt(
  history: readonly RoundRecord[],
  roundId: string,
): RoundRecord | undefined {
  return earlierChallenges(history, roundId).at(-1);
}

/** Melhor tempo da etapa antes desta rodada, só entre rodadas 100% certas (D-020). */
export function bestTimeBefore(
  history: readonly RoundRecord[],
  roundId: string,
): number | undefined {
  const times = earlierChallenges(history, roundId)
    .filter((r) => qualifiesForRecord(r.correct, r.total))
    .map((r) => r.elapsedMs);
  return times.length > 0 ? Math.min(...times) : undefined;
}

export interface RoundOutcome {
  /** null fora do desafio. */
  stars: Stars | null;
  message: ResultMessage | null;
  comparison: PersonalComparison | null;
  /** Passou de etapa (⭐⭐ ou mais no desafio). */
  passed: boolean;
  nextStageId: string | null;
  wrongCount: number;
}

const PASSING_STARS = 2;

/** Tudo o que a tela de resultado mostra além do placar. */
export function roundOutcome(
  history: readonly RoundRecord[],
  roundId: string,
): RoundOutcome | undefined {
  const round = history.find((r) => r.id === roundId);
  if (!round) return undefined;
  const wrongCount = round.total - round.correct;

  if (round.stars === null || round.timeLimitMs === null) {
    return {
      stars: null,
      message: null,
      comparison: null,
      passed: false,
      nextStageId: null,
      wrongCount,
    };
  }

  const previous = previousAttempt(history, roundId);
  return {
    stars: round.stars,
    message: resultMessage({
      correct: round.correct,
      total: round.total,
      elapsedMs: round.elapsedMs,
      limitMs: round.timeLimitMs,
    }),
    comparison: personalComparison({
      current: round,
      previous,
      previousBestTimeMs: bestTimeBefore(history, roundId),
    }),
    passed: round.stars >= PASSING_STARS,
    nextStageId: nextStageId(round.stageId),
    wrongCount,
  };
}

/** Mantém só as últimas `max` rodadas (as mais novas ficam no fim). */
export function pruneHistory(
  history: readonly RoundRecord[],
  max: number = GAME_CONFIG.history.maxRounds,
): RoundRecord[] {
  return history.slice(Math.max(0, history.length - max));
}

import { solve } from './carry';
import { GAME_CONFIG, type StarRules } from './config/game-config';
import type { Problem, Stars } from './types';

export interface RoundScore {
  correct: number;
  total: number;
  elapsedMs: number;
  limitMs: number;
}

export function accuracy(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}

/** A rodada tem acerto suficiente para valer como recorde de tempo? */
export function qualifiesForRecord(correct: number, total: number): boolean {
  return accuracy(correct, total) >= GAME_CONFIG.records.minAccuracy;
}

export function isCorrect(problem: Problem, answer: number | null): boolean {
  return answer !== null && answer === solve(problem);
}

/** Estrelas de uma rodada de desafio (docs/GAME_RULES.md §3). */
export function calculateStars(score: RoundScore, rules: StarRules = GAME_CONFIG.stars): Stars {
  const acc = accuracy(score.correct, score.total);
  if (acc < rules.minAccuracy) return 0;
  if (score.elapsedMs > score.limitMs) return 1;
  const fastEnough = score.elapsedMs <= score.limitMs * rules.threeStarTimeRatio;
  if (acc >= rules.threeStarAccuracy && fastEnough) return 3;
  return 2;
}

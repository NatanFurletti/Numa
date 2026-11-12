// Teste do dia (docs/GAME_RULES.md §13): as mesmas contas para todo mundo, uma tentativa por dia.
// O dia chega pronto como 'YYYY-MM-DD' (horário local). Quem converte é src/lib.

import { GAME_CONFIG } from './config/game-config';
import { generateSequence } from './generator';
import type { RoundSetup } from './round-setup';
import { getStage } from './stages';
import { daysBetween } from './streak';
import type { ProblemAttempt } from './types';

/** Seed do dia (hash FNV-1a da data, em 31 bits): igual em todos os aparelhos. */
export function dailySeed(day: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) {
    hash = Math.imul(hash ^ day.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0) % 2 ** 31;
}

/** Um nível que não existe na configuração lança erro (getStage). */
const dailyLevels = () => GAME_CONFIG.daily.levels.map((id) => getStage(`${id}-A`).level);

/** As contas do dia: uma de cada nível da configuração, do mais fácil ao mais difícil. Sem tempo-limite. */
export function setupDailyTest(day: string): RoundSetup {
  return {
    problems: generateSequence(dailyLevels(), dailySeed(day)),
    timeLimitMs: null,
    layout: 'inline',
  };
}

export interface DailyScore {
  correct: number;
  elapsedMs: number;
}

/** Ordem do ranking: mais acertos primeiro; no empate, o menor tempo. */
export function compareDailyScores(a: DailyScore, b: DailyScore): number {
  return b.correct - a.correct || a.elapsedMs - b.elapsedMs;
}

/** A tentativa do dia. `started`: as contas apareceram, mas o teste não chegou ao fim. */
export type DailyAttempt =
  | { status: 'started' }
  | {
      status: 'done';
      correct: number;
      total: number;
      elapsedMs: number;
      problems: ProblemAttempt[];
      /** Já enviada ao ranking. */
      submitted: boolean;
    };

/** Chave: o dia, 'YYYY-MM-DD'. */
export type DailyAttempts = Record<string, DailyAttempt>;

function isRecent(day: string, today: string, keepDays: number): boolean {
  try {
    return daysBetween(day, today) < keepDays;
  } catch {
    return false;
  }
}

/** Mantém só as tentativas dos últimos `keepDays` dias. */
export function pruneDailyAttempts(
  attempts: DailyAttempts,
  today: string,
  keepDays: number = GAME_CONFIG.daily.keepDays,
): DailyAttempts {
  return Object.fromEntries(
    Object.entries(attempts).filter(([day]) => isRecent(day, today, keepDays)),
  );
}

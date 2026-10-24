// Progressão entre etapas e aquecimento (docs/GAME_RULES.md §4 e §8).

import { GAME_CONFIG } from './config/game-config';
import { allStageIds, getStage, nextStageId, previousStageId, stageIndex } from './stages';
import type { Stars } from './types';

/** Progresso de uma etapa (docs/DATA.md §1.2). */
export interface StageProgress {
  unlocked: boolean;
  bestStars: Stars;
  /** Melhor tempo entre as rodadas de desafio com pelo menos 1 estrela. */
  bestTimeMs?: number;
  bestCorrect?: number;
  /** Rodadas de desafio concluídas. */
  attempts: number;
  consecutiveFails: number;
  pendingWarmup: boolean;
}

/** Chave: id da etapa ('L07-B'). */
export type StageProgressMap = Record<string, StageProgress>;

export interface ChallengeResult {
  stars: Stars;
  correct: number;
  elapsedMs: number;
}

const PASSING_STARS = 2;

function lockedStage(): StageProgress {
  return { unlocked: false, bestStars: 0, attempts: 0, consecutiveFails: 0, pendingWarmup: false };
}

export function createInitialStages(): StageProgressMap {
  const stages: StageProgressMap = {};
  for (const id of allStageIds()) stages[id] = lockedStage();
  stages['L01-A'] = { ...stages['L01-A'], unlocked: true };
  return stages;
}

function unlock(stages: StageProgressMap, stageId: string): StageProgressMap {
  const current = stages[stageId] ?? lockedStage();
  if (current.unlocked) return stages;
  return { ...stages, [stageId]: { ...current, unlocked: true } };
}

/** Aplica o resultado de uma rodada de desafio concluída. */
export function applyChallengeResult(
  stages: StageProgressMap,
  stageId: string,
  result: ChallengeResult,
): StageProgressMap {
  const before = stages[stageId] ?? lockedStage();
  const passed = result.stars >= PASSING_STARS;
  const consecutiveFails = passed ? 0 : before.consecutiveFails + 1;
  const countsForTime = result.stars >= 1;
  const bestTimeMs =
    countsForTime && (before.bestTimeMs === undefined || result.elapsedMs < before.bestTimeMs)
      ? result.elapsedMs
      : before.bestTimeMs;

  const updated: StageProgress = {
    ...before,
    unlocked: true,
    bestStars: Math.max(before.bestStars, result.stars) as Stars,
    bestTimeMs,
    bestCorrect: Math.max(before.bestCorrect ?? 0, result.correct),
    attempts: before.attempts + 1,
    consecutiveFails,
    pendingWarmup: !passed && consecutiveFails >= GAME_CONFIG.warmup.failsToTrigger,
  };

  const next = { ...stages, [stageId]: updated };
  const nextId = nextStageId(stageId);
  return passed && nextId ? unlock(next, nextId) : next;
}

/** Depois do aquecimento: zera as falhas. Não conta como tentativa nem mexe nas estrelas. */
export function applyWarmupResult(stages: StageProgressMap, stageId: string): StageProgressMap {
  const before = stages[stageId] ?? lockedStage();
  return { ...stages, [stageId]: { ...before, consecutiveFails: 0, pendingWarmup: false } };
}

export function nextRoundMode(stages: StageProgressMap, stageId: string): 'challenge' | 'warmup' {
  return stages[stageId]?.pendingWarmup ? 'warmup' : 'challenge';
}

/** Tempo do aquecimento: o da etapa atual, ou +50% se não há etapa anterior. */
export function warmupTimeLimitMs(stageId: string): number {
  const limit = getStage(stageId).timeLimitMs;
  if (previousStageId(stageId)) return limit;
  return limit * (1 + GAME_CONFIG.warmup.noPreviousStageTimeBonus);
}

/** Etapa desbloqueada mais avançada (botão "Continuar"). */
export function continueStageId(stages: StageProgressMap): string {
  const unlocked = allStageIds().filter((id) => stages[id]?.unlocked);
  return unlocked[unlocked.length - 1] ?? 'L01-A';
}

/** Desbloqueia todas as etapas até `stageId`, incluindo ela. Usado pelo nivelamento. */
export function unlockThrough(stages: StageProgressMap, stageId: string): StageProgressMap {
  const last = stageIndex(stageId);
  return allStageIds()
    .slice(0, last + 1)
    .reduce(unlock, stages);
}

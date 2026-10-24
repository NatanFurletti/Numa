// Progresso salvo no aparelho (docs/DATA.md §1.2) e como cada rodada terminada o altera.

import {
  applyChallengeResult,
  applyWarmupResult,
  createInitialStages,
  nextRoundMode,
  type StageProgressMap,
} from './progression';
import type { PlayMode } from './round-setup';
import { emptyStreak, recordPlay, type Streak } from './streak';
import type { Stars } from './types';

export interface Progress {
  stages: StageProgressMap;
  placementDone: boolean;
  streak: Streak;
}

/** O que importa de uma rodada terminada para o progresso (um RoundRecord serve). */
export interface FinishedRound {
  stageId: string;
  mode: PlayMode;
  status: 'completed' | 'abandoned';
  stars: Stars | null;
  correct: number;
  total: number;
  elapsedMs: number;
}

export function createInitialProgress(): Progress {
  return { stages: createInitialStages(), placementDone: false, streak: emptyStreak() };
}

export function isStageUnlocked(progress: Progress, stageId: string): boolean {
  return progress.stages[stageId]?.unlocked === true;
}

/** Aplica uma rodada terminada. `today` é a data local, 'YYYY-MM-DD'. */
export function applyRound(progress: Progress, round: FinishedRound, today: string): Progress {
  // Abandono não afeta progresso nem sequência (GAME_RULES §2.4).
  if (round.status !== 'completed') return progress;

  let stages = progress.stages;
  if (round.mode === 'challenge') {
    stages = applyChallengeResult(stages, round.stageId, {
      stars: round.stars ?? 0,
      correct: round.correct,
      total: round.total,
      elapsedMs: round.elapsedMs,
    });
  } else if (round.mode === 'warmup') {
    stages = applyWarmupResult(stages, round.stageId);
  }

  return { ...progress, stages, streak: recordPlay(progress.streak, today) };
}

/** Um desafio vira aquecimento quando a etapa tem aquecimento pendente (GAME_RULES §8). */
export function playModeFor(progress: Progress, stageId: string, requested: PlayMode): PlayMode {
  if (requested !== 'challenge') return requested;
  return nextRoundMode(progress.stages, stageId);
}

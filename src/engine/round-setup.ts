// Monta as contas e o tempo-limite de uma rodada conforme o modo.

import { generateRound, generateWarmupRound } from './generator';
import { warmupTimeLimitMs } from './progression';
import { allStageIds, getStage, previousStageId } from './stages';
import type { Problem } from './types';

export type PlayMode = 'challenge' | 'practice' | 'warmup';

export interface RoundSetup {
  problems: Problem[];
  /** null = sem tempo-limite (treino livre). */
  timeLimitMs: number | null;
}

export function isKnownStage(stageId: string): boolean {
  return allStageIds().includes(stageId);
}

export function setupRound(options: { stageId: string; mode: PlayMode; seed: number }): RoundSetup {
  const { stageId, mode, seed } = options;
  const stage = getStage(stageId);

  if (mode === 'warmup') {
    const previousId = previousStageId(stageId);
    const previous = previousId ? getStage(previousId) : null;
    return {
      problems: generateWarmupRound(stage, previous, seed),
      timeLimitMs: warmupTimeLimitMs(stageId),
    };
  }

  return {
    problems: generateRound(stage, seed),
    timeLimitMs: mode === 'practice' ? null : stage.timeLimitMs,
  };
}

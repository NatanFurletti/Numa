// Monta as contas e o tempo-limite de uma rodada conforme o modo.

import { generateRound, generateWarmupRound } from './generator';
import { warmupTimeLimitMs } from './progression';
import type { ProblemLayout } from './config/levels';
import { allStageIds, getStage, previousStageId, stageLayout } from './stages';
import type { Problem } from './types';

export type PlayMode = 'challenge' | 'practice' | 'warmup';

export interface RoundSetup {
  problems: Problem[];
  /** null = sem tempo-limite (treino livre). */
  timeLimitMs: number | null;
  /** Como as contas aparecem: na linha ou armadas (a da etapa atual, inclusive no aquecimento). */
  layout: ProblemLayout;
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
      layout: stageLayout(stageId),
    };
  }

  return {
    problems: generateRound(stage, seed),
    timeLimitMs: mode === 'practice' ? null : stage.timeLimitMs,
    layout: stageLayout(stageId),
  };
}

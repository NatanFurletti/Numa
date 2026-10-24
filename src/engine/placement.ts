// Teste de nivelamento (docs/GAME_RULES.md §10).

import { GAME_CONFIG } from './config/game-config';
import { LEVELS } from './config/levels';
import { generateRound } from './generator';
import { getStage } from './stages';
import type { Problem } from './types';

const { placement } = GAME_CONFIG;

/** Cada checkpoint usa as regras da etapa B do nível. */
const checkpointStage = (levelId: string) => getStage(`${levelId}-B`);

/** Metade do tempo-limite da etapa B (para metade das contas). */
export function checkpointTimeLimitMs(levelId: string): number {
  return checkpointStage(levelId).timeLimitMs * placement.timeRatio;
}

export function generateCheckpointProblems(levelId: string, seed: number): Problem[] {
  return generateRound(checkpointStage(levelId), seed, placement.problemsPerCheckpoint);
}

export function isCheckpointPassed(
  levelId: string,
  result: { correct: number; elapsedMs: number },
): boolean {
  return (
    result.correct >= placement.minCorrect && result.elapsedMs <= checkpointTimeLimitMs(levelId)
  );
}

/** Próximo checkpoint a testar, ou null se o nivelamento terminou. */
export function nextCheckpoint(results: readonly boolean[]): string | null {
  if (results.includes(false)) return null;
  return placement.checkpoints[results.length] ?? null;
}

/**
 * Etapa inicial: a A do nível seguinte ao último checkpoint aprovado.
 * Nenhum aprovado → L01-A. Aprovado até o último nível → última etapa da tabela.
 */
export function placementStartStageId(results: readonly boolean[]): string {
  const firstFail = results.indexOf(false);
  const passedCount = firstFail < 0 ? results.length : firstFail;
  if (passedCount === 0) return `${LEVELS[0].id}-A`;

  const lastPassed = placement.checkpoints[passedCount - 1];
  const levelIndex = LEVELS.findIndex((l) => l.id === lastPassed);
  const nextLevel = LEVELS[levelIndex + 1];
  if (nextLevel) return `${nextLevel.id}-A`;

  const lastLevel = LEVELS[LEVELS.length - 1];
  return `${lastLevel.id}-${lastLevel.stages[lastLevel.stages.length - 1].id}`;
}

// Teste de nivelamento (docs/GAME_RULES.md §10).

import { GAME_CONFIG } from './config/game-config';
import { LEVELS } from './config/levels';
import { generateRound } from './generator';
import type { RoundSetup } from './round-setup';
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

/** Contas e tempo de um checkpoint. `stageId` é a etapa B usada (vai para o histórico). */
export function setupCheckpoint(levelId: string, seed: number): RoundSetup & { stageId: string } {
  return {
    stageId: checkpointStage(levelId).id,
    problems: generateCheckpointProblems(levelId, seed),
    timeLimitMs: checkpointTimeLimitMs(levelId),
    layout: checkpointStage(levelId).level.layout ?? 'inline',
  };
}

/** Ritmo esperado por conta: o mesmo da etapa B (tempo da B ÷ contas de uma rodada). */
export function checkpointProblemTimeMs(levelId: string): number {
  return checkpointStage(levelId).timeLimitMs / GAME_CONFIG.problemsPerRound;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export interface CheckpointResult {
  correct: number;
  /** Tempo de cada conta do bloco, na ordem. */
  problemTimesMs: readonly number[];
}

/**
 * Passa com acerto mínimo (4 de 5) **e** a mediana do tempo por conta dentro do ritmo da etapa B.
 * A mediana evita que uma única hesitação reprove. No primeiro bloco, a 1ª conta fica de fora do
 * tempo (D-026).
 */
export function isCheckpointPassed(
  levelId: string,
  result: CheckpointResult,
  options: { firstBlock?: boolean } = {},
): boolean {
  if (result.correct < placement.minCorrect || result.problemTimesMs.length === 0) return false;
  const skipFirst = options.firstBlock === true && placement.ignoreFirstProblemTime;
  const times = skipFirst ? result.problemTimesMs.slice(1) : result.problemTimesMs;
  return median(times) <= checkpointProblemTimeMs(levelId);
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

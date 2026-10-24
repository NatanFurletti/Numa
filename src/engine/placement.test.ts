import * as fc from 'fast-check';

import { GAME_CONFIG } from './config/game-config';
import { matchesSpec } from './generator';
import {
  checkpointTimeLimitMs,
  generateCheckpointProblems,
  isCheckpointPassed,
  nextCheckpoint,
  placementStartStageId,
} from './placement';
import { getStage } from './stages';

const checkpoints = GAME_CONFIG.placement.checkpoints; // L02, L05, L07, L10, L12, L15

describe('contas de cada checkpoint', () => {
  it('são 5 contas com as regras da etapa B do nível', () => {
    fc.assert(
      fc.property(fc.constantFrom(...checkpoints), fc.integer(), (levelId, seed) => {
        const problems = generateCheckpointProblems(levelId, seed);
        const level = getStage(`${levelId}-B`).level;
        return (
          problems.length === 5 && problems.every((p) => level.specs.some((s) => matchesSpec(p, s)))
        );
      }),
    );
  });

  it('o tempo é metade do tempo-limite da etapa B', () => {
    expect(checkpointTimeLimitMs('L07')).toBe(32_500); // L07-B = 65s
    expect(checkpointTimeLimitMs('L02')).toBe(27_500); // L02-B = 55s
  });
});

describe('isCheckpointPassed', () => {
  const limit = checkpointTimeLimitMs('L02');

  it('passa com 4 de 5 certas dentro do tempo', () => {
    expect(isCheckpointPassed('L02', { correct: 4, elapsedMs: limit })).toBe(true);
  });

  it('não passa com 3 de 5', () => {
    expect(isCheckpointPassed('L02', { correct: 3, elapsedMs: 1000 })).toBe(false);
  });

  it('não passa com o tempo estourado, mesmo com 5 de 5', () => {
    expect(isCheckpointPassed('L02', { correct: 5, elapsedMs: limit + 1 })).toBe(false);
  });
});

describe('nextCheckpoint', () => {
  it('começa pelo primeiro checkpoint', () => {
    expect(nextCheckpoint([])).toBe('L02');
  });

  it('segue em ordem enquanto a pessoa passa', () => {
    expect(nextCheckpoint([true, true])).toBe('L07');
  });

  it('para no primeiro checkpoint em que a pessoa falhar', () => {
    expect(nextCheckpoint([true, false])).toBeNull();
  });

  it('termina depois do último checkpoint', () => {
    expect(nextCheckpoint(checkpoints.map(() => true))).toBeNull();
  });
});

describe('placementStartStageId', () => {
  it('sem nenhum checkpoint aprovado, começa no L01-A', () => {
    expect(placementStartStageId([false])).toBe('L01-A');
    expect(placementStartStageId([])).toBe('L01-A');
  });

  it('começa na etapa A do nível seguinte ao último checkpoint aprovado', () => {
    expect(placementStartStageId([true, false])).toBe('L03-A');
    expect(placementStartStageId([true, true, true, false])).toBe('L08-A');
  });

  it('aprovado em todos os checkpoints, começa na última etapa (L15-C)', () => {
    expect(placementStartStageId(checkpoints.map(() => true))).toBe('L15-C');
  });

  it('ignora resultados depois da primeira falha', () => {
    expect(placementStartStageId([true, false, true])).toBe('L03-A');
  });
});

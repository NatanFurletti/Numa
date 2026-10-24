import * as fc from 'fast-check';

import { GAME_CONFIG } from './config/game-config';
import { matchesSpec } from './generator';
import {
  checkpointProblemTimeMs,
  checkpointTimeLimitMs,
  generateCheckpointProblems,
  isCheckpointPassed,
  median,
  nextCheckpoint,
  placementStartStageId,
  setupCheckpoint,
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
  // L02-B tem 55s para 10 contas → ritmo de 5,5s por conta.
  const pace = checkpointProblemTimeMs('L02');
  const block = (times: number[], correct = 5) => ({ correct, problemTimesMs: times });

  it('o ritmo por conta é o da etapa B (tempo da B ÷ contas da rodada)', () => {
    expect(pace).toBe(getStage('L02-B').timeLimitMs / GAME_CONFIG.problemsPerRound);
  });

  it('passa com 4 de 5 certas e a mediana do tempo por conta dentro do ritmo', () => {
    expect(isCheckpointPassed('L02', block([pace, pace, pace, pace, pace], 4))).toBe(true);
  });

  it('não passa com 3 de 5, por mais rápido que seja', () => {
    expect(isCheckpointPassed('L02', block([500, 500, 500, 500, 500], 3))).toBe(false);
  });

  it('não passa quando a mediana fica acima do ritmo, mesmo com 5 de 5', () => {
    expect(isCheckpointPassed('L02', block([1000, pace + 1, pace + 1, pace + 1, 1000]))).toBe(
      false,
    );
  });

  it('uma única hesitação longa não reprova (mediana, e não o tempo total)', () => {
    expect(isCheckpointPassed('L02', block([2000, 2000, 60_000, 2000, 2000]))).toBe(true);
  });

  it('no primeiro bloco, a 1ª conta não conta no tempo (a pessoa está conhecendo o teclado)', () => {
    // Sem a 1ª conta sobram 4 tempos: mediana = média dos dois do meio.
    const slowStart = block([30_000, 2000, pace + 2000, pace + 2000, 2000]);

    expect(isCheckpointPassed('L02', slowStart, { firstBlock: true })).toBe(true);
    expect(isCheckpointPassed('L02', slowStart, { firstBlock: false })).toBe(false);
  });

  it('bloco vazio não passa', () => {
    expect(isCheckpointPassed('L02', block([], 0))).toBe(false);
  });
});

describe('median', () => {
  it('ímpar: o valor do meio; par: a média dos dois do meio', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
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

describe('setupCheckpoint', () => {
  it('5 contas com as regras da etapa B e metade do tempo dela', () => {
    const setup = setupCheckpoint('L05', 3);

    expect(setup.problems).toHaveLength(5);
    expect(setup.timeLimitMs).toBe(checkpointTimeLimitMs('L05'));
    expect(setup.stageId).toBe('L05-B');
  });
});

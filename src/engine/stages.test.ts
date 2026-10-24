import { GAME_CONFIG } from './config/game-config';
import { LEVELS } from './config/levels';
import { allStageIds, getStage, nextStageId, previousStageId, stageIndex } from './stages';

describe('tabela de níveis', () => {
  it('tem 15 níveis com 3 etapas cada (45 etapas)', () => {
    expect(LEVELS).toHaveLength(15);
    expect(allStageIds()).toHaveLength(45);
  });

  it('cada nível tem as etapas A, B e C com tempo cada vez mais curto', () => {
    for (const level of LEVELS) {
      const [a, b, c] = level.stages;

      expect(level.stages.map((s) => s.id)).toEqual(['A', 'B', 'C']);
      expect(a.timeLimitMs).toBeGreaterThan(b.timeLimitMs);
      expect(b.timeLimitMs).toBeGreaterThan(c.timeLimitMs);
    }
  });

  it('usa os tempos da tabela do LEVELS.md (exemplos)', () => {
    expect(getStage('L01-A').timeLimitMs).toBe(60_000);
    expect(getStage('L07-B').timeLimitMs).toBe(65_000);
    expect(getStage('L15-C').timeLimitMs).toBe(70_000);
  });

  it('todos os checkpoints do nivelamento existem', () => {
    const ids = LEVELS.map((l) => l.id);

    expect(GAME_CONFIG.placement.checkpoints.every((c) => ids.includes(c))).toBe(true);
  });

  it('os níveis mistos têm specs de soma e de subtração', () => {
    for (const level of LEVELS.filter((l) => l.kind === 'mixed')) {
      const ops = new Set(level.specs.map((s) => s.op));

      expect(ops).toEqual(new Set(['add', 'sub']));
    }
  });
});

describe('getStage', () => {
  it('encontra a etapa pelo id', () => {
    const stage = getStage('L07-B');

    expect(stage).toMatchObject({ id: 'L07-B', levelId: 'L07', letter: 'B' });
    expect(stage.level.id).toBe('L07');
  });

  it('lança erro para id inexistente', () => {
    expect(() => getStage('L99-A')).toThrow();
    expect(() => getStage('L01-D')).toThrow();
    expect(() => getStage('qualquer')).toThrow();
  });
});

describe('ordem das etapas', () => {
  it('segue A → B → C → próximo nível A', () => {
    expect(allStageIds().slice(0, 4)).toEqual(['L01-A', 'L01-B', 'L01-C', 'L02-A']);
  });

  it('nextStageId avança uma etapa e termina no fim da tabela', () => {
    expect(nextStageId('L01-A')).toBe('L01-B');
    expect(nextStageId('L01-C')).toBe('L02-A');
    expect(nextStageId('L15-C')).toBeNull();
  });

  it('previousStageId volta uma etapa e não existe antes de L01-A', () => {
    expect(previousStageId('L02-A')).toBe('L01-C');
    expect(previousStageId('L07-B')).toBe('L07-A');
    expect(previousStageId('L01-A')).toBeNull();
  });

  it('stageIndex dá a posição da etapa na ordem', () => {
    expect(stageIndex('L01-A')).toBe(0);
    expect(stageIndex('L02-A')).toBe(3);
    expect(stageIndex('L15-C')).toBe(44);
  });
});

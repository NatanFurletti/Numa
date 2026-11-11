import { GAME_CONFIG } from './config/game-config';
import { LEVELS } from './config/levels';
import {
  allStageIds,
  getStage,
  levelNumber,
  nextStageId,
  previousStageId,
  stageIndex,
  stageLayout,
} from './stages';

describe('tabela de níveis', () => {
  it('tem 51 níveis com 3 etapas cada (153 etapas)', () => {
    expect(LEVELS).toHaveLength(51);
    expect(allStageIds()).toHaveLength(153);
  });

  it('a partir de 2 dígitos, cada soma e subtração tem a versão armada logo antes (D-028)', () => {
    const ids = LEVELS.map((l) => l.id);
    for (const id of ['L06', 'L09', 'L11', 'L14', 'L16', 'L19', 'L21', 'L24']) {
      expect(ids.indexOf(`${id}V`)).toBe(ids.indexOf(id) - 1);
    }
    // 1 dígito e níveis mistos não têm versão armada.
    for (const id of ['L01', 'L05', 'L10', 'L15', 'L20', 'L25']) {
      expect(ids).not.toContain(`${id}V`);
    }
  });

  it('a versão armada tem as mesmas contas e os mesmos tempos da versão na linha', () => {
    for (const stacked of LEVELS.filter((l) => l.layout === 'vertical')) {
      const twin = LEVELS.find((l) => l.id === stacked.id.replace(/V$/, ''))!;

      expect(stacked.specs).toEqual(twin.specs);
      expect(stacked.stages).toEqual(twin.stages);
      expect(twin.layout ?? 'inline').toBe('inline');
    }
  });

  it('os níveis de 3 dígitos vêm depois dos de 2 e terminam no L25', () => {
    expect(LEVELS[40].id).toBe('L25');
    expect(getStage('L16-A').level.specs[0].a).toEqual({ min: 100, max: 999 });
  });

  it('multiplicação e divisão vêm no fim (L26–L35), só na linha (D-030)', () => {
    const added = LEVELS.slice(41);

    expect(added.map((l) => l.id).join(' ')).toBe('L26 L27 L28 L29 L30 L31 L32 L33 L34 L35');
    expect(added.map((l) => l.kind).join(' ')).toBe('mul mul div div mixed mul mul div div mixed');
    expect(added.every((l) => (l.layout ?? 'inline') === 'inline')).toBe(true);
  });

  it('os níveis de uma operação só têm specs dessa operação', () => {
    for (const level of LEVELS.filter((l) => l.kind !== 'mixed')) {
      expect(level.specs.every((s) => s.op === level.kind)).toBe(true);
    }
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
    expect(getStage('L26-A').timeLimitMs).toBe(60_000);
    expect(getStage('L32-C').timeLimitMs).toBe(80_000);
  });

  it('todos os checkpoints do nivelamento existem', () => {
    const ids = LEVELS.map((l) => l.id);

    expect(GAME_CONFIG.placement.checkpoints.every((c) => ids.includes(c))).toBe(true);
  });

  it('os níveis mistos juntam soma com subtração, ou multiplicação com divisão', () => {
    const ops = (id: string) => [...new Set(getStage(`${id}-A`).level.specs.map((s) => s.op))];

    for (const id of ['L05', 'L10', 'L15', 'L20', 'L25']) expect(ops(id)).toEqual(['add', 'sub']);
    for (const id of ['L30', 'L35']) expect(ops(id)).toEqual(['mul', 'div']);
    expect(LEVELS.filter((l) => l.kind === 'mixed')).toHaveLength(7);
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
    expect(nextStageId('L15-C')).toBe('L16V-A');
    expect(nextStageId('L25-C')).toBe('L26-A');
    expect(nextStageId('L35-C')).toBeNull();
  });

  it('previousStageId volta uma etapa e não existe antes de L01-A', () => {
    expect(previousStageId('L02-A')).toBe('L01-C');
    expect(previousStageId('L07-B')).toBe('L07-A');
    expect(previousStageId('L01-A')).toBeNull();
  });

  it('stageIndex dá a posição da etapa na ordem', () => {
    expect(stageIndex('L01-A')).toBe(0);
    expect(stageIndex('L02-A')).toBe(3);
    expect(stageIndex('L25-C')).toBe(122);
    expect(stageIndex('L35-C')).toBe(152);
  });
});

describe('levelNumber', () => {
  it('é a posição do nível na tabela, que é o número mostrado na tela', () => {
    expect(levelNumber('L01')).toBe(1);
    expect(levelNumber('L06V')).toBe(6);
    expect(levelNumber('L06')).toBe(7);
    expect(levelNumber('L15')).toBe(23);
    expect(levelNumber('L25')).toBe(41);
    expect(levelNumber('L26')).toBe(42);
    expect(levelNumber('L35')).toBe(51);
  });

  it('lança erro para nível inexistente', () => {
    expect(() => levelNumber('L99')).toThrow('L99');
  });
});

describe('stageLayout', () => {
  it('armada ou na linha, conforme o nível da etapa', () => {
    expect(stageLayout('L07V-B')).toBe('vertical');
    expect(stageLayout('L07-B')).toBe('inline');
    expect(stageLayout('L01-A')).toBe('inline');
  });
});

import * as fc from 'fast-check';

import { hasCarry, problemKey, solve } from './carry';
import { LEVELS, type LevelConfig } from './config/levels';
import { generateRound, generateWarmupRound, matchesSpec } from './generator';
import { getStage, type Stage } from './stages';
import type { Problem } from './types';

const levelIds = LEVELS.map((l) => l.id);
const anyStage = fc.constantFrom(...levelIds).map((id) => getStage(`${id}-A`));
const seed = fc.integer();

const matchesLevel = (p: Problem, level: LevelConfig) => level.specs.some((s) => matchesSpec(p, s));

describe('generateRound: propriedades para todos os níveis', () => {
  it('gera a quantidade certa de contas, sem lançar erro', () => {
    fc.assert(fc.property(anyStage, seed, (stage, sd) => generateRound(stage, sd).length === 10));
  });

  it('todas as contas respeitam as specs do nível (faixas, operação, vai um/empresta)', () => {
    fc.assert(
      fc.property(anyStage, seed, (stage, sd) =>
        generateRound(stage, sd).every((p) => matchesLevel(p, stage.level)),
      ),
    );
  });

  it('nunca gera resultado negativo nem operando 0', () => {
    fc.assert(
      fc.property(anyStage, seed, (stage, sd) =>
        generateRound(stage, sd).every((p) => solve(p) >= 0 && p.a !== 0 && p.b !== 0),
      ),
    );
  });

  it('não repete contas (3 + 5 e 5 + 3 contam como iguais)', () => {
    fc.assert(
      fc.property(anyStage, seed, (stage, sd) => {
        const keys = generateRound(stage, sd).map(problemKey);
        return new Set(keys).size === keys.length;
      }),
    );
  });

  it('mesma seed → mesma rodada', () => {
    fc.assert(
      fc.property(anyStage, seed, (stage, sd) => {
        expect(generateRound(stage, sd)).toEqual(generateRound(stage, sd));
      }),
    );
  });

  it('o resultado 0 aparece no máximo 1 vez por rodada', () => {
    fc.assert(
      fc.property(anyStage, seed, (stage, sd) => {
        return generateRound(stage, sd).filter((p) => solve(p) === 0).length <= 1;
      }),
    );
  });

  it('espalha os resultados: nenhum resultado aparece mais de 2 vezes', () => {
    fc.assert(
      fc.property(anyStage, seed, (stage, sd) => {
        const counts = new Map<number, number>();
        for (const p of generateRound(stage, sd)) {
          counts.set(solve(p), (counts.get(solve(p)) ?? 0) + 1);
        }
        return Math.max(...counts.values()) <= 2;
      }),
    );
  });

  it('as etapas A, B e C geram as mesmas regras de conta', () => {
    fc.assert(
      fc.property(fc.constantFrom(...levelIds), seed, (id, sd) =>
        generateRound(getStage(`${id}-C`), sd).every((p) =>
          matchesLevel(p, getStage(`${id}-A`).level),
        ),
      ),
    );
  });
});

describe('generateRound: regras específicas', () => {
  it('L06 nunca gera conta com vai um', () => {
    fc.assert(
      fc.property(seed, (sd) =>
        generateRound(getStage('L06-A'), sd).every((p) => !hasCarry(p.a, p.b)),
      ),
    );
  });

  it('L07 sempre gera conta com vai um', () => {
    fc.assert(
      fc.property(seed, (sd) =>
        generateRound(getStage('L07-A'), sd).every((p) => hasCarry(p.a, p.b)),
      ),
    );
  });

  it('na subtração, o primeiro número é sempre maior ou igual ao segundo', () => {
    fc.assert(
      fc.property(fc.constantFrom('L03', 'L09', 'L14'), seed, (id, sd) =>
        generateRound(getStage(`${id}-A`), sd).every((p) => p.a >= p.b),
      ),
    );
  });

  it('níveis mistos têm metade soma e metade subtração', () => {
    fc.assert(
      fc.property(fc.constantFrom('L05', 'L10', 'L15'), seed, (id, sd) => {
        const problems = generateRound(getStage(`${id}-A`), sd);
        return problems.filter((p) => p.op === 'add').length === 5;
      }),
    );
  });

  it('níveis mistos usam todas as specs do nível', () => {
    const problems = generateRound(getStage('L10-A'), 123);

    for (const spec of getStage('L10-A').level.specs) {
      expect(problems.some((p) => matchesSpec(p, spec))).toBe(true);
    }
  });

  it('na soma 2d + 1d, a ordem dos operandos varia (às vezes 1d + 2d)', () => {
    const problems = Array.from({ length: 20 }, (_, sd) =>
      generateRound(getStage('L06-A'), sd),
    ).flat();

    expect(problems.some((p) => p.a >= 10)).toBe(true);
    expect(problems.some((p) => p.a < 10)).toBe(true);
  });

  it('seeds diferentes geram rodadas diferentes', () => {
    expect(generateRound(getStage('L12-A'), 1)).not.toEqual(generateRound(getStage('L12-A'), 2));
  });

  it('aceita uma quantidade diferente de contas (nivelamento)', () => {
    expect(generateRound(getStage('L10-B'), 5, 5)).toHaveLength(5);
  });

  it('lança erro quando a spec não permite contas distintas suficientes', () => {
    const tiny: Stage = {
      id: 'X-A',
      levelId: 'X',
      letter: 'A',
      timeLimitMs: 1000,
      level: {
        id: 'X',
        kind: 'add',
        specs: [{ op: 'add', a: { min: 1, max: 2 }, b: { min: 1, max: 2 }, carry: 'any' }],
        stages: [{ id: 'A', timeLimitMs: 1000 }],
      },
    };

    expect(() => generateRound(tiny, 1)).toThrow();
  });
});

describe('generateWarmupRound', () => {
  it('mistura 5 contas da etapa anterior e 5 da atual, intercaladas, começando pela anterior', () => {
    fc.assert(
      fc.property(seed, (sd) => {
        const problems = generateWarmupRound(getStage('L07-A'), getStage('L06-C'), sd);

        expect(problems).toHaveLength(10);
        problems.forEach((p, i) => {
          expect(hasCarry(p.a, p.b)).toBe(i % 2 === 1);
        });
      }),
    );
  });

  it('não repete contas quando as duas etapas são do mesmo nível', () => {
    fc.assert(
      fc.property(fc.constantFrom(...levelIds), seed, (id, sd) => {
        const keys = generateWarmupRound(getStage(`${id}-B`), getStage(`${id}-A`), sd).map(
          problemKey,
        );
        return keys.length === 10 && new Set(keys).size === 10;
      }),
    );
  });

  it('sem etapa anterior, usa só contas da etapa atual', () => {
    const problems = generateWarmupRound(getStage('L01-A'), null, 4);

    expect(problems).toHaveLength(10);
    expect(problems.every((p) => matchesLevel(p, getStage('L01-A').level))).toBe(true);
  });

  it('mesma seed → mesmo aquecimento', () => {
    expect(generateWarmupRound(getStage('L03-A'), getStage('L02-C'), 8)).toEqual(
      generateWarmupRound(getStage('L03-A'), getStage('L02-C'), 8),
    );
  });
});

describe('matchesSpec', () => {
  const spec = LEVELS[5].specs[0]; // L06: 2d + 1d sem vai um

  it('aceita a soma nas duas ordens', () => {
    expect(matchesSpec({ a: 42, b: 5, op: 'add' }, spec)).toBe(true);
    expect(matchesSpec({ a: 5, b: 42, op: 'add' }, spec)).toBe(true);
  });

  it('rejeita conta fora da faixa, com vai um ou de outra operação', () => {
    expect(matchesSpec({ a: 142, b: 5, op: 'add' }, spec)).toBe(false);
    expect(matchesSpec({ a: 45, b: 7, op: 'add' }, spec)).toBe(false);
    expect(matchesSpec({ a: 42, b: 5, op: 'sub' }, spec)).toBe(false);
  });

  it('respeita a faixa de resultado', () => {
    const l02 = LEVELS[1].specs[0];

    expect(matchesSpec({ a: 9, b: 2, op: 'add' }, l02)).toBe(true);
    expect(matchesSpec({ a: 4, b: 2, op: 'add' }, l02)).toBe(false);
  });
});

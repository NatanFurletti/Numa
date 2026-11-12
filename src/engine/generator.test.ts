import * as fc from 'fast-check';

import { hasCarry, hasMultiplyCarry, needsRegrouping, problemKey, solve } from './carry';
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

  it('mistos de multiplicação e divisão têm metade de cada (D-030)', () => {
    fc.assert(
      fc.property(fc.constantFrom('L30', 'L35'), seed, (id, sd) => {
        const problems = generateRound(getStage(`${id}-A`), sd);
        return (
          problems.filter((p) => p.op === 'mul').length === 5 &&
          problems.filter((p) => p.op === 'div').length === 5
        );
      }),
    );
  });

  it('misto com quantidade ímpar: a primeira operação fica com a conta a mais', () => {
    const count = (id: string, op: Problem['op']) =>
      generateRound(getStage(`${id}-B`), 9, 5).filter((p) => p.op === op).length;

    expect(count('L10', 'add')).toBe(3);
    expect(count('L30', 'mul')).toBe(3);
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

describe('generateRound: 3 dígitos', () => {
  it('gera rápido mesmo com milhares de contas possíveis (sorteio em vez de lista)', () => {
    const start = performance.now();
    for (let seed = 0; seed < 50; seed++) generateRound(getStage('L24-C'), seed);

    expect(performance.now() - start).toBeLessThan(2000);
  });

  it('L22 (3+3 com vai um) sempre tem vai um; L23 (3−3 sem empresta) nunca empresta', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const withCarry = generateRound(getStage('L22-A'), seed);
        const noBorrow = generateRound(getStage('L23-A'), seed);
        return withCarry.every(needsRegrouping) && !noBorrow.some(needsRegrouping);
      }),
      { numRuns: 30 },
    );
  });

  it('não repete resultados numa rodada de 3 dígitos', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const results = generateRound(getStage('L21-B'), seed).map(solve);
        return new Set(results).size === results.length;
      }),
      { numRuns: 30 },
    );
  });
});

describe('generateRound: multiplicação e divisão (D-030)', () => {
  const mulDiv = ['L26', 'L27', 'L28', 'L29', 'L30', 'L31', 'L32', 'L33', 'L34', 'L35'];
  const rounds = (id: string, sd: number) => generateRound(getStage(`${id}-A`), sd);

  it('a divisão é sempre exata', () => {
    fc.assert(
      fc.property(fc.constantFrom(...mulDiv), seed, (id, sd) =>
        rounds(id, sd)
          .filter((p) => p.op === 'div')
          .every((p) => p.a % p.b === 0),
      ),
    );
  });

  it('nunca usa 1 como fator, divisor ou quociente (conta sem graça)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...mulDiv), seed, (id, sd) =>
        rounds(id, sd).every((p) => p.a > 1 && p.b > 1 && solve(p) > 1),
      ),
    );
  });

  it('L26 é a tabuada do 2 ao 5; L27, do 6 ao 9', () => {
    fc.assert(
      fc.property(seed, (sd) => {
        const easy = rounds('L26', sd).every(
          (p) => Math.min(p.a, p.b) <= 5 && p.a <= 9 && p.b <= 9,
        );
        const hard = rounds('L27', sd).every(
          (p) => Math.max(p.a, p.b) >= 6 && p.a <= 9 && p.b <= 9,
        );
        return easy && hard;
      }),
    );
  });

  it('L28 e L29 são o inverso da tabuada: divisor e quociente de 1 dígito', () => {
    fc.assert(
      fc.property(seed, (sd) => {
        const easy = rounds('L28', sd).every((p) => p.b >= 2 && p.b <= 5 && solve(p) <= 9);
        const hard = rounds('L29', sd).every((p) => p.b >= 6 && p.b <= 9 && solve(p) <= 9);
        return easy && hard;
      }),
    );
  });

  it('L31 (2d × 1d) nunca tem vai um; L32 sempre tem', () => {
    fc.assert(
      fc.property(seed, (sd) => {
        const none = rounds('L31', sd).every((p) => !hasMultiplyCarry(p.a, p.b));
        const all = rounds('L32', sd).every((p) => hasMultiplyCarry(p.a, p.b));
        return none && all;
      }),
    );
  });

  it('na multiplicação 2d × 1d, a ordem dos fatores varia', () => {
    const problems = Array.from({ length: 20 }, (_, sd) => rounds('L32', sd)).flat();

    expect(problems.some((p) => p.a >= 10)).toBe(true);
    expect(problems.some((p) => p.a < 10)).toBe(true);
  });

  it('L33 divide 2 dígitos e L34 divide 3 dígitos, com quociente de 2 dígitos', () => {
    fc.assert(
      fc.property(seed, (sd) => {
        const two = rounds('L33', sd).every((p) => p.a <= 99 && p.b <= 9 && solve(p) >= 10);
        const three = rounds('L34', sd).every(
          (p) => p.a >= 100 && p.b <= 9 && solve(p) >= 10 && solve(p) <= 99,
        );
        return two && three;
      }),
    );
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

  it('multiplicação: aceita os fatores nas duas ordens', () => {
    const l32 = getStage('L32-A').level.specs[0];

    expect(matchesSpec({ a: 47, b: 6, op: 'mul' }, l32)).toBe(true);
    expect(matchesSpec({ a: 6, b: 47, op: 'mul' }, l32)).toBe(true);
    expect(matchesSpec({ a: 23, b: 3, op: 'mul' }, l32)).toBe(false);
  });

  it('divisão: só aceita a conta exata, na ordem dividendo ÷ divisor', () => {
    const l28 = getStage('L28-A').level.specs[0];

    expect(matchesSpec({ a: 12, b: 4, op: 'div' }, l28)).toBe(true);
    expect(matchesSpec({ a: 13, b: 4, op: 'div' }, l28)).toBe(false);
    expect(matchesSpec({ a: 4, b: 12, op: 'div' }, l28)).toBe(false);
    expect(matchesSpec({ a: 4, b: 4, op: 'div' }, l28)).toBe(false);
  });

  it('respeita a faixa de resultado', () => {
    const l02 = LEVELS[1].specs[0];

    expect(matchesSpec({ a: 9, b: 2, op: 'add' }, l02)).toBe(true);
    expect(matchesSpec({ a: 4, b: 2, op: 'add' }, l02)).toBe(false);
  });
});

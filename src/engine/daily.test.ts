import * as fc from 'fast-check';

import { problemKey, solve } from './carry';
import { GAME_CONFIG } from './config/game-config';
import { LEVELS } from './config/levels';
import {
  compareDailyScores,
  type DailyAttempts,
  dailySeed,
  pruneDailyAttempts,
  setupDailyTest,
} from './daily';
import { matchesSpec } from './generator';

const day = fc
  .tuple(
    fc.integer({ min: 2026, max: 2040 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

const level = (id: string) => LEVELS.find((l) => l.id === id)!;

describe('dailySeed', () => {
  it('o mesmo dia dá sempre a mesma seed', () => {
    expect(dailySeed('2026-11-11')).toBe(dailySeed('2026-11-11'));
  });

  it('dias diferentes dão seeds diferentes', () => {
    expect(dailySeed('2026-11-11')).not.toBe(dailySeed('2026-11-12'));
  });

  it('é um inteiro de 31 bits, como as outras seeds', () => {
    fc.assert(
      fc.property(day, (d) => {
        const seed = dailySeed(d);
        return Number.isInteger(seed) && seed >= 0 && seed < 2 ** 31;
      }),
    );
  });
});

describe('setupDailyTest', () => {
  it('todo mundo recebe as mesmas contas no mesmo dia', () => {
    expect(setupDailyTest('2026-11-11')).toEqual(setupDailyTest('2026-11-11'));
  });

  it('o teste muda de um dia para o outro', () => {
    expect(setupDailyTest('2026-11-11').problems).not.toEqual(
      setupDailyTest('2026-11-12').problems,
    );
  });

  it('não tem tempo-limite e as contas aparecem na linha', () => {
    expect(setupDailyTest('2026-11-11')).toMatchObject({ timeLimitMs: null, layout: 'inline' });
  });

  it('os níveis da configuração existem e misturam as quatro operações', () => {
    const kinds = GAME_CONFIG.daily.levels.map((id) => level(id)?.kind);

    expect(kinds).not.toContain(undefined);
    expect(new Set(kinds)).toEqual(new Set(['add', 'sub', 'mul', 'div']));
  });

  it('uma conta por nível da configuração, na ordem (dificuldade crescente)', () => {
    fc.assert(
      fc.property(day, (d) => {
        const { problems } = setupDailyTest(d);
        expect(problems).toHaveLength(GAME_CONFIG.daily.levels.length);
        problems.forEach((p, i) => {
          const specs = level(GAME_CONFIG.daily.levels[i]).specs;
          expect(specs.some((s) => matchesSpec(p, s))).toBe(true);
        });
      }),
    );
  });

  it('não repete contas e nunca dá resultado negativo', () => {
    fc.assert(
      fc.property(day, (d) => {
        const { problems } = setupDailyTest(d);
        const keys = problems.map(problemKey);
        return new Set(keys).size === keys.length && problems.every((p) => solve(p) >= 0);
      }),
    );
  });
});

describe('compareDailyScores (ordem do ranking)', () => {
  it('mais acertos vem primeiro, mesmo com mais tempo', () => {
    const fast = { correct: 8, elapsedMs: 20_000 };
    const accurate = { correct: 9, elapsedMs: 90_000 };

    expect([fast, accurate].sort(compareDailyScores)).toEqual([accurate, fast]);
  });

  it('com os mesmos acertos, o menor tempo vem primeiro', () => {
    const slow = { correct: 10, elapsedMs: 50_000 };
    const quick = { correct: 10, elapsedMs: 41_000 };

    expect([slow, quick].sort(compareDailyScores)).toEqual([quick, slow]);
  });

  it('empate completo: 0', () => {
    const score = { correct: 7, elapsedMs: 30_000 };

    expect(compareDailyScores(score, { ...score })).toBe(0);
  });
});

describe('pruneDailyAttempts', () => {
  const attempts: DailyAttempts = {
    '2026-11-01': { status: 'started' },
    '2026-11-09': { status: 'started' },
    '2026-11-11': { status: 'started' },
  };

  it('mantém só os dias recentes', () => {
    expect(Object.keys(pruneDailyAttempts(attempts, '2026-11-11', 7))).toEqual([
      '2026-11-09',
      '2026-11-11',
    ]);
  });

  it('descarta chaves que não são datas', () => {
    const broken = { ...attempts, lixo: { status: 'started' } } as DailyAttempts;

    expect(Object.keys(pruneDailyAttempts(broken, '2026-11-11', 7))).not.toContain('lixo');
  });

  it('usa o limite da configuração por padrão', () => {
    expect(Object.keys(pruneDailyAttempts(attempts, '2026-11-11'))).toContain('2026-11-09');
  });
});

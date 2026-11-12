import { GAME_CONFIG } from './config/game-config';
import { LEVELS } from './config/levels';
import {
  addAward,
  countEarlierRoundsToday,
  dailyPoints,
  emptyLedger,
  levelWeight,
  NO_POINTS,
  type PointsRound,
  roundPoints,
} from './points';
import type { Stars } from './types';

describe('levelWeight', () => {
  it.each([
    ['L01', 1],
    ['L05', 1],
    ['L06', 2],
    ['L10', 2],
    ['L11', 3],
    ['L16', 4],
    ['L21', 5],
    ['L25', 5],
    ['L26', 2],
    ['L30', 2],
    ['L31', 4],
    ['L35', 4],
  ])('%s tem peso %i', (levelId, weight) => {
    expect(levelWeight(levelId)).toBe(weight);
  });

  it('a versão armada tem o peso da versão na linha', () => {
    expect(levelWeight('L12V')).toBe(levelWeight('L12'));
  });

  it('todo nível da tabela tem um peso', () => {
    for (const level of LEVELS) expect(levelWeight(level.id)).toBeGreaterThan(0);
  });

  it('lança erro para um nível sem faixa', () => {
    expect(() => levelWeight('L99')).toThrow();
  });
});

const challenge = (over: Partial<PointsRound> = {}): PointsRound => ({
  stageId: 'L12-B',
  mode: 'challenge',
  status: 'completed',
  correct: 8,
  total: 10,
  stars: 2,
  ...over,
});

const context = (bestStarsBefore: Stars = 0, earlierRoundsToday = 0) => ({
  bestStarsBefore,
  earlierRoundsToday,
});

describe('roundPoints: desafio concluído', () => {
  it('soma acertos × peso, estrelas novas e etapa nova (exemplo do GAME_RULES §14.1)', () => {
    const points = roundPoints(challenge({ correct: 10, stars: 3 }), context(0));

    expect(points).toEqual({ hits: 30, stars: 45, newStage: 30, total: 105, capped: false });
  });

  it('dá bônus só pelas estrelas acima da melhor nota anterior', () => {
    const points = roundPoints(challenge({ correct: 10, stars: 3 }), context(2));

    expect(points.stars).toBe(15);
    expect(points.newStage).toBe(0);
  });

  it('repetir com a mesma nota rende só os acertos', () => {
    const points = roundPoints(challenge({ correct: 10, stars: 3 }), context(3));

    expect(points).toEqual({ hits: 30, stars: 0, newStage: 0, total: 30, capped: false });
  });

  it('nota menor que a melhor não tira pontos', () => {
    expect(roundPoints(challenge({ stars: 1 }), context(3)).stars).toBe(0);
  });

  it('passar de uma etapa liberada pelo nivelamento (0 estrelas) rende o bônus de etapa nova', () => {
    expect(roundPoints(challenge({ stars: 2 }), context(0)).newStage).toBe(30);
  });

  it('passar de novo uma etapa que já tinha 1 estrela também é etapa nova', () => {
    expect(roundPoints(challenge({ stars: 2 }), context(1)).newStage).toBe(30);
  });

  it('não passar da etapa não rende bônus de etapa nova', () => {
    const points = roundPoints(challenge({ correct: 8, stars: 1 }), context(0));

    expect(points.newStage).toBe(0);
    expect(points.stars).toBe(15);
  });

  it('rende acertos mesmo sem estrelas, a partir de 50% de acerto', () => {
    const points = roundPoints(challenge({ correct: 5, stars: 0 }), context(0));

    expect(points).toEqual({ hits: 15, stars: 0, newStage: 0, total: 15, capped: false });
  });

  it('abaixo de 50% de acerto não rende acertos', () => {
    expect(roundPoints(challenge({ correct: 4, stars: 0 }), context(0))).toEqual(NO_POINTS);
  });

  it('a partir da 4ª rodada da etapa no dia, os acertos não rendem', () => {
    const points = roundPoints(challenge({ correct: 10, stars: 3 }), context(3, 3));

    expect(points).toEqual({ hits: 0, stars: 0, newStage: 0, total: 0, capped: true });
  });

  it('a 3ª rodada do dia ainda rende', () => {
    expect(roundPoints(challenge(), context(2, 2)).hits).toBe(24);
  });

  it('a trava do dia não segura os bônus', () => {
    const points = roundPoints(challenge({ correct: 10, stars: 3 }), context(0, 5));

    expect(points).toEqual({ hits: 0, stars: 45, newStage: 30, total: 75, capped: true });
  });

  it('sem acertos não marca a trava, mesmo depois da 3ª rodada', () => {
    expect(roundPoints(challenge({ correct: 0, stars: 0 }), context(0, 5)).capped).toBe(false);
  });

  it('usa o peso da faixa do nível', () => {
    expect(roundPoints(challenge({ stageId: 'L01-A', stars: 2 }), context(2)).hits).toBe(8);
    expect(roundPoints(challenge({ stageId: 'L22V-C', stars: 2 }), context(2)).hits).toBe(40);
  });
});

describe('roundPoints: o que não rende', () => {
  it.each(['practice', 'warmup', 'placement'] as const)('%s não rende pontos', (mode) => {
    expect(roundPoints(challenge({ mode, stars: null }), context(0))).toEqual(NO_POINTS);
  });

  it('desafio abandonado não rende pontos', () => {
    const round = challenge({ status: 'abandoned', correct: 6, stars: null });

    expect(roundPoints(round, context(0))).toEqual(NO_POINTS);
  });
});

describe('dailyPoints', () => {
  it('vale acertos × 3', () => {
    expect(dailyPoints(7)).toEqual({ hits: 21, stars: 0, newStage: 0, total: 21, capped: false });
  });

  it('sem acertos, 0', () => {
    expect(dailyPoints(0)).toEqual(NO_POINTS);
  });
});

describe('countEarlierRoundsToday', () => {
  const r = (stageId: string, day: string, over: Partial<PointsRound> = {}) => ({
    ...challenge({ stageId, ...over }),
    day,
  });

  it('conta as rodadas de desafio concluídas da mesma etapa no mesmo dia', () => {
    const rounds = [
      r('L12-B', '2026-11-12'),
      r('L12-B', '2026-11-12'),
      r('L12-B', '2026-11-11'),
      r('L12-C', '2026-11-12'),
      r('L12-B', '2026-11-12', { status: 'abandoned' }),
      r('L12-B', '2026-11-12', { mode: 'practice' }),
      r('L12-B', '2026-11-12', { mode: 'warmup' }),
    ];

    expect(countEarlierRoundsToday(rounds, 'L12-B', '2026-11-12')).toBe(2);
  });

  it('sem rodadas, 0', () => {
    expect(countEarlierRoundsToday([], 'L01-A', '2026-11-12')).toBe(0);
  });
});

describe('addAward', () => {
  const award = (id: string, day: string, total: number) => ({
    id,
    day,
    points: { ...NO_POINTS, hits: total, total },
  });

  it('soma no total e no dia', () => {
    let ledger = addAward(emptyLedger(), award('a', '2026-11-12', 30));
    ledger = addAward(ledger, award('b', '2026-11-12', 10));
    ledger = addAward(ledger, award('c', '2026-11-11', 5));

    expect(ledger.total).toBe(45);
    expect(ledger.days).toEqual({ '2026-11-12': 40, '2026-11-11': 5 });
    expect(ledger.awards.map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });

  it('o mesmo id não soma de novo', () => {
    const once = addAward(emptyLedger(), award('a', '2026-11-12', 30));

    expect(addAward(once, award('a', '2026-11-12', 30))).toBe(once);
  });

  it('ganho de 0 pontos não entra', () => {
    const ledger = emptyLedger();

    expect(addAward(ledger, award('a', '2026-11-12', 0))).toBe(ledger);
  });

  it('rodada travada com 0 pontos entra (o resultado explica a trava), sem mudar o total', () => {
    const capped = { id: 'a', day: '2026-11-12', points: { ...NO_POINTS, capped: true } };

    const ledger = addAward(emptyLedger(), capped);

    expect(ledger.awards).toEqual([capped]);
    expect(ledger.total).toBe(0);
    expect(ledger.days).toEqual({ '2026-11-12': 0 });
  });

  it('guarda só os últimos dias da configuração', () => {
    let ledger = addAward(emptyLedger(), award('old', '2026-10-01', 7));
    ledger = addAward(ledger, award('new', '2026-11-12', 3));

    expect(ledger.days).toEqual({ '2026-11-12': 3 });
    expect(ledger.total).toBe(10);
  });

  it('guarda só os últimos ganhos da configuração, sem mexer no total', () => {
    const max = GAME_CONFIG.points.keepAwards;
    let ledger = emptyLedger();
    for (let i = 0; i <= max; i++) ledger = addAward(ledger, award(`r${i}`, '2026-11-12', 1));

    expect(ledger.awards).toHaveLength(max);
    expect(ledger.awards[0].id).toBe('r1');
    expect(ledger.total).toBe(max + 1);
  });
});

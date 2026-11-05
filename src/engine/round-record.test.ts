import { GAME_CONFIG } from './config/game-config';
import type { RoundSummary } from './round';
import {
  bestTimeBefore,
  buildRoundRecord,
  pruneHistory,
  previousAttempt,
  roundOutcome,
  type RoundRecord,
} from './round-record';
import type { ProblemAttempt } from './types';

function attempts(correct: number, total = 10): ProblemAttempt[] {
  return Array.from({ length: total }, (_, i) => ({
    a: i,
    b: 1,
    op: 'add',
    expected: i + 1,
    answer: i < correct ? i + 1 : 0,
    correct: i < correct,
    timeMs: 1000,
    keystrokes: 1,
  }));
}

function summary(correct: number, elapsedMs: number, limitMs = 60_000): RoundSummary {
  return {
    correct,
    total: 10,
    elapsedMs,
    overtimeMs: Math.max(0, elapsedMs - limitMs),
    problems: attempts(correct),
  };
}

const base = {
  appVersion: '0.1.0',
  stageId: 'L01-A',
  seed: 42,
  startedAt: '2026-10-23T12:00:00.000Z',
  inputDirection: 'ltr' as const,
};

function record(
  id: string,
  correct: number,
  elapsedMs: number,
  overrides: Partial<Parameters<typeof buildRoundRecord>[0]> = {},
): RoundRecord {
  return buildRoundRecord({
    ...base,
    id,
    mode: 'challenge',
    status: 'completed',
    timeLimitMs: 60_000,
    summary: summary(correct, elapsedMs),
    ...overrides,
  });
}

describe('buildRoundRecord', () => {
  it('monta o registro no formato do histórico (DATA §1.3)', () => {
    const r = record('r1', 9, 50_000);

    expect(r).toMatchObject({
      id: 'r1',
      schemaVersion: 1,
      rulesVersion: GAME_CONFIG.rulesVersion,
      appVersion: '0.1.0',
      stageId: 'L01-A',
      mode: 'challenge',
      status: 'completed',
      seed: 42,
      startedAt: '2026-10-23T12:00:00.000Z',
      elapsedMs: 50_000,
      timeLimitMs: 60_000,
      correct: 9,
      total: 10,
      stars: 2,
      inputDirection: 'ltr',
    });
    expect(r.problems).toHaveLength(10);
  });

  it('calcula as estrelas só no desafio concluído', () => {
    expect(record('a', 10, 40_000).stars).toBe(3);
    expect(record('b', 10, 40_000, { status: 'abandoned' }).stars).toBeNull();
    expect(record('c', 10, 40_000, { mode: 'warmup' }).stars).toBeNull();
    expect(record('d', 10, 40_000, { mode: 'practice', timeLimitMs: null }).stars).toBeNull();
  });
});

describe('previousAttempt', () => {
  it('é a última rodada de desafio concluída na mesma etapa, antes desta', () => {
    const history = [
      record('old', 6, 50_000),
      record('other-stage', 9, 50_000, { stageId: 'L01-B' }),
      record('practice', 9, 50_000, { mode: 'practice', timeLimitMs: null }),
      record('abandoned', 2, 10_000, { status: 'abandoned' }),
      record('prev', 7, 45_000),
      record('current', 9, 40_000),
      record('later', 3, 40_000),
    ];

    expect(previousAttempt(history, 'current')?.id).toBe('prev');
    expect(previousAttempt(history, 'old')).toBeUndefined();
    expect(previousAttempt(history, 'missing')).toBeUndefined();
  });
});

describe('bestTimeBefore', () => {
  it('é o menor tempo entre os desafios anteriores 100% certos (D-020)', () => {
    const history = [
      record('a', 10, 52_000),
      record('b', 9, 30_000), // não vale: 90%
      record('c', 10, 48_000),
      record('d', 10, 20_000, { stageId: 'L01-B' }),
      record('current', 10, 45_000),
      record('e', 10, 10_000), // depois desta
    ];

    expect(bestTimeBefore(history, 'current')).toBe(48_000);
    expect(bestTimeBefore(history, 'a')).toBeUndefined();
  });
});

describe('roundOutcome', () => {
  it('desafio que passou: mensagem, estrelas e próxima etapa', () => {
    const history = [record('r', 10, 40_000)];

    expect(roundOutcome(history, 'r')).toEqual({
      stars: 3,
      message: { key: 'perfect', correct: 10, total: 10, overtimeMs: 0 },
      comparison: null,
      passed: true,
      nextStageId: 'L01-B',
      wrongCount: 0,
    });
  });

  it('desafio que não passou: sem próxima etapa liberada e com as erradas contadas', () => {
    const outcome = roundOutcome([record('r', 6, 40_000)], 'r');

    expect(outcome?.passed).toBe(false);
    expect(outcome?.wrongCount).toBe(4);
    expect(outcome?.message?.key).toBe('fastButInaccurate');
  });

  it('compara com a tentativa anterior na mesma etapa', () => {
    const history = [record('prev', 6, 40_000), record('r', 8, 50_000)];

    expect(roundOutcome(history, 'r')?.comparison).toEqual({ type: 'moreCorrect', diff: 2 });
  });

  it('usa o melhor tempo anterior para "novo melhor tempo"', () => {
    const history = [record('a', 10, 52_000), record('b', 9, 30_000), record('r', 10, 47_000)];

    expect(roundOutcome(history, 'r')?.comparison).toEqual({
      type: 'newBestTime',
      fromMs: 52_000,
      toMs: 47_000,
    });
  });

  it('a última etapa (L25-C) não tem próxima', () => {
    const history = [record('r', 10, 40_000, { stageId: 'L25-C' })];

    expect(roundOutcome(history, 'r')?.nextStageId).toBeNull();
  });

  it('aquecimento e treino livre: sem estrelas, mensagem nem comparação', () => {
    const history = [
      record('w', 10, 40_000, { mode: 'warmup' }),
      record('p', 4, 40_000, { mode: 'practice', timeLimitMs: null }),
    ];

    expect(roundOutcome(history, 'w')).toMatchObject({
      stars: null,
      message: null,
      comparison: null,
      passed: false,
      wrongCount: 0,
    });
    expect(roundOutcome(history, 'p')?.wrongCount).toBe(6);
  });

  it('rodada inexistente → undefined', () => {
    expect(roundOutcome([], 'nope')).toBeUndefined();
  });
});

describe('pruneHistory', () => {
  it('mantém só as últimas N rodadas (as mais novas)', () => {
    const history = ['a', 'b', 'c', 'd'].map((id) => record(id, 10, 40_000));

    expect(pruneHistory(history, 2).map((r) => r.id)).toEqual(['c', 'd']);
    expect(pruneHistory(history, 10)).toHaveLength(4);
  });

  it('o limite padrão vem da configuração', () => {
    const history = Array.from({ length: GAME_CONFIG.history.maxRounds + 3 }, (_, i) =>
      record(String(i), 10, 40_000),
    );

    expect(pruneHistory(history)).toHaveLength(GAME_CONFIG.history.maxRounds);
  });
});

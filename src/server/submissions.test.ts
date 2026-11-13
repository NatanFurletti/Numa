import { solve } from '../engine/carry';
import { GAME_CONFIG } from '../engine/config/game-config';
import { setupDailyTest } from '../engine/daily';
import { setupRound } from '../engine/round-setup';
import type { Problem } from '../engine/types';
import type { SubmittedAnswer } from '../engine/verify';

import type { DailyResultRow, InsertOutcome, RoundRow, ServerRepo } from './repo';
import { submitDaily, submitRound } from './submissions';

const DAY = '2026-11-12';
/** Meio-dia (UTC) do dia do teste. */
const NOW = Date.UTC(2026, 10, 12, 12);
const TOKEN = 'token-do-aparelho';
const USER = 'user-1';
const RULES = GAME_CONFIG.rulesVersion;

const rightAnswers = (problems: readonly Problem[], timeMs = 3000): SubmittedAnswer[] =>
  problems.map((p) => ({ answer: solve(p), timeMs, keystrokes: 2 }));

const blank: SubmittedAnswer = { answer: null, timeMs: 0, keystrokes: 0 };

function fakeRepo(outcome: InsertOutcome = 'inserted', stored: RoundRow[] = []) {
  const daily: DailyResultRow[] = [];
  const rounds: RoundRow[] = [];
  const repo: ServerRepo = {
    userIdFromToken: jest.fn(async (token: string) => (token === TOKEN ? USER : null)),
    insertDailyResult: jest.fn(async (row: DailyResultRow) => {
      daily.push(row);
      return outcome;
    }),
    insertRound: jest.fn(async (row: RoundRow) => {
      rounds.push(row);
      return outcome;
    }),
    stageRounds: jest.fn(async (userId: string, stageId: string) =>
      [...stored, ...rounds]
        .filter((r) => r.userId === userId && r.stageId === stageId)
        .map(({ day, status, stars }) => ({ day, status, stars })),
    ),
  };
  return { repo, daily, rounds };
}

describe('submitDaily', () => {
  const problems = setupDailyTest(DAY).problems;
  const body = (overrides: object = {}) => ({
    day: DAY,
    nickname: 'Zé',
    rulesVersion: RULES,
    answers: rightAnswers(problems),
    ...overrides,
  });
  const send = (payload: unknown, repo: ServerRepo, token: string | null = TOKEN) =>
    submitDaily({ token, body: payload }, { repo, now: NOW });

  it('grava o placar que o servidor calculou, e não um placar enviado', async () => {
    const { repo, daily } = fakeRepo();
    const answers = rightAnswers(problems);
    answers[0] = { ...answers[0], answer: solve(problems[0]) + 1 };

    const response = await send(body({ answers, correct: 10, elapsedMs: 1 }), repo);

    expect(response).toEqual({
      status: 200,
      body: { ok: true, duplicate: false, correct: 9, total: 10, elapsedMs: 30_000, points: 27 },
    });
    expect(daily).toEqual([
      {
        day: DAY,
        userId: USER,
        nickname: 'Zé',
        correct: 9,
        total: 10,
        elapsedMs: 30_000,
        rulesVersion: RULES,
        points: 27,
      },
    ]);
  });

  it('teste do dia abandonado rende as contas respondidas (GAME_RULES §14.3)', async () => {
    const { repo, daily } = fakeRepo();
    const answers = rightAnswers(problems).map((a, i) => (i < 4 ? a : blank));

    await send(body({ answers }), repo);

    expect(daily[0]).toMatchObject({ correct: 4, points: 12 });
  });

  it('segundo envio do mesmo dia não devolve pontos (já valeram no primeiro)', async () => {
    const { repo } = fakeRepo('duplicate');

    const response = await send(body(), repo);

    expect(response.body.points).toBe(0);
  });

  it('placar falso, sem as respostas, é recusado', async () => {
    const { repo, daily } = fakeRepo();
    const fake = {
      day: DAY,
      nickname: 'Zé',
      correct: 10,
      total: 10,
      elapsedMs: 5000,
      rulesVersion: RULES,
    };

    const response = await send(fake, repo);

    expect(response).toEqual({ status: 400, body: { error: 'invalidBody' } });
    expect(daily).toEqual([]);
  });

  it('sem token, ou com token que não vale: 401, sem gravar', async () => {
    const { repo, daily } = fakeRepo();
    const unauthorized = { status: 401, body: { error: 'unauthorized' } };

    expect(await send(body(), repo, null)).toEqual(unauthorized);
    expect(await send(body(), repo, 'outro')).toEqual(unauthorized);
    expect(daily).toEqual([]);
  });

  it('segundo envio do mesmo dia: avisa que já existia (vale o primeiro)', async () => {
    const { repo } = fakeRepo('duplicate');

    const response = await send(body(), repo);

    expect(response).toMatchObject({ status: 200, body: { ok: true, duplicate: true } });
  });

  it('o apelido é normalizado antes de gravar', async () => {
    const { repo, daily } = fakeRepo();

    await send(body({ nickname: '  Zé   da  Ana ' }), repo);

    expect(daily[0].nickname).toBe('Zé da Ana');
  });

  it.each(['a', 'x'.repeat(17), 'Zé!', 'merda'])(
    'apelido fora das regras é recusado (%p)',
    async (nickname) => {
      const { repo, daily } = fakeRepo();

      const response = await send(body({ nickname }), repo);

      expect(response).toEqual({ status: 422, body: { error: 'invalidNickname' } });
      expect(daily).toEqual([]);
    },
  );

  it('versão das regras diferente da do servidor é recusada', async () => {
    const { repo } = fakeRepo();

    const response = await send(body({ rulesVersion: RULES - 1 }), repo);

    expect(response).toEqual({ status: 409, body: { error: 'rulesMismatch' } });
  });

  it.each(['2026-11-11', '2026-11-13'])(
    'aceita o dia vizinho ao do servidor, por causa dos fusos (%p)',
    async (day) => {
      const { repo } = fakeRepo();
      const answers = rightAnswers(setupDailyTest(day).problems);

      const response = await send(body({ day, answers }), repo);

      expect(response).toMatchObject({ status: 200, body: { correct: 10 } });
    },
  );

  it.each(['2026-11-10', '2026-11-14', '2025-11-12'])(
    'recusa dia longe do dia do servidor (%p)',
    async (day) => {
      const { repo } = fakeRepo();
      const answers = rightAnswers(setupDailyTest(day).problems);

      const response = await send(body({ day, answers }), repo);

      expect(response).toEqual({ status: 422, body: { error: 'dayOutOfRange' } });
    },
  );

  it('respostas que não passam na conferência são recusadas com o motivo', async () => {
    const { repo, daily } = fakeRepo();

    const tooFast = await send(body({ answers: rightAnswers(problems, 10) }), repo);
    const wrongCount = await send(body({ answers: rightAnswers(problems).slice(1) }), repo);
    const invalidDay = await send(body({ day: 'hoje' }), repo);

    expect(tooFast).toEqual({ status: 422, body: { error: 'tooFast' } });
    expect(wrongCount).toEqual({ status: 422, body: { error: 'wrongCount' } });
    expect(invalidDay).toEqual({ status: 422, body: { error: 'invalidDay' } });
    expect(daily).toEqual([]);
  });

  it('teste abandonado no instante em que começou: grava 1 ms (o banco recusa tempo 0)', async () => {
    const { repo, daily } = fakeRepo();

    await send(body({ answers: problems.map(() => blank) }), repo);

    expect(daily[0]).toMatchObject({ correct: 0, elapsedMs: 1 });
  });

  it.each([
    null,
    'texto',
    [],
    { day: 1 },
    { day: DAY, nickname: 'Zé', rulesVersion: '3', answers: [] },
    { day: DAY, nickname: 'Zé', rulesVersion: RULES, answers: 'nenhuma' },
    { day: DAY, nickname: 'Zé', rulesVersion: RULES, answers: [{ answer: '5', timeMs: 1 }] },
    { day: DAY, nickname: 'Zé', rulesVersion: RULES, answers: [{ answer: 5 }] },
    { day: DAY, nickname: 'Zé', rulesVersion: RULES, answers: [null] },
  ])('corpo fora do formato: 400 (%#)', async (payload) => {
    const { repo } = fakeRepo();

    expect(await send(payload, repo)).toEqual({ status: 400, body: { error: 'invalidBody' } });
  });
});

describe('submitRound', () => {
  const STAGE = 'L07-B';
  const SEED = 4242;
  const ID = '3f2c1d7e-8a4b-4c6d-9e0f-1a2b3c4d5e6f';
  const setup = setupRound({ stageId: STAGE, mode: 'challenge', seed: SEED });
  const body = (overrides: object = {}) => ({
    id: ID,
    stageId: STAGE,
    seed: SEED,
    rulesVersion: RULES,
    appVersion: '0.1.0',
    startedAt: '2026-11-12T11:58:00.000Z',
    day: DAY,
    inputDirection: 'rtl',
    answers: rightAnswers(setup.problems),
    ...overrides,
  });
  const send = (payload: unknown, repo: ServerRepo, token: string | null = TOKEN) =>
    submitRound({ token, body: payload }, { repo, now: NOW });

  /** Uma rodada já guardada no servidor, da mesma pessoa e da mesma etapa. */
  const storedRound = (overrides: Partial<RoundRow> = {}): RoundRow => ({
    id: '00000000-0000-4000-8000-000000000000',
    userId: USER,
    stageId: STAGE,
    seed: 1,
    rulesVersion: RULES,
    appVersion: '0.1.0',
    status: 'completed',
    startedAt: '2026-11-12T10:00:00.000Z',
    day: DAY,
    elapsedMs: 30_000,
    timeLimitMs: 60_000,
    correct: 10,
    total: 10,
    stars: 1,
    inputDirection: 'ltr',
    problems: [],
    points: 0,
    ...overrides,
  });

  it('grava a rodada com o placar, as estrelas e os pontos calculados no servidor', async () => {
    const { repo, rounds } = fakeRepo();

    const response = await send(body({ correct: 0, stars: 0, points: 9999 }), repo);

    expect(response).toEqual({
      status: 200,
      body: {
        ok: true,
        duplicate: false,
        correct: 10,
        total: 10,
        elapsedMs: 30_000,
        stars: 3,
        points: 70,
      },
    });
    expect(rounds).toHaveLength(1);
    const { problems, ...row } = rounds[0];
    expect(row).toEqual({
      id: ID,
      userId: USER,
      stageId: STAGE,
      seed: SEED,
      rulesVersion: RULES,
      appVersion: '0.1.0',
      status: 'completed',
      startedAt: '2026-11-12T11:58:00.000Z',
      elapsedMs: 30_000,
      timeLimitMs: setup.timeLimitMs,
      correct: 10,
      total: 10,
      stars: 3,
      inputDirection: 'rtl',
      day: DAY,
      points: 70,
    });
    expect(problems).toHaveLength(10);
    expect(problems.every((p) => p.correct)).toBe(true);
  });

  it('rodada abandonada é gravada sem estrelas e sem pontos', async () => {
    const { repo, rounds } = fakeRepo();
    const answers = rightAnswers(setup.problems).map((a, i) => (i < 3 ? a : blank));

    await send(body({ answers }), repo);

    expect(rounds[0]).toMatchObject({ status: 'abandoned', correct: 3, stars: null, points: 0 });
  });

  it('estrelas novas contam a partir da melhor nota já guardada da etapa', async () => {
    const { repo, rounds } = fakeRepo('inserted', [
      storedRound({ stars: 2 }),
      storedRound({ stars: null, status: 'abandoned' }),
    ]);

    await send(body(), repo);

    // 10 × 2 de acertos + 1 estrela nova × 5 × 2. A etapa já tinha sido passada.
    expect(rounds[0].points).toBe(30);
  });

  it('rodadas de outra pessoa ou de outra etapa não contam', async () => {
    const { repo, rounds } = fakeRepo('inserted', [
      storedRound({ userId: 'user-2', stars: 3 }),
      storedRound({ stageId: 'L07-A', stars: 3 }),
    ]);

    await send(body(), repo);

    expect(rounds[0].points).toBe(70);
  });

  it('trava do dia: da 4ª rodada concluída da etapa no dia em diante, os acertos não rendem', async () => {
    const earlier = [1, 2, 3].map(() => storedRound({ stars: 3 }));
    const { repo, rounds } = fakeRepo('inserted', [
      ...earlier,
      storedRound({ status: 'abandoned', stars: null }),
    ]);

    await send(body(), repo);

    expect(rounds[0].points).toBe(0);
  });

  it('a trava usa o dia local enviado pelo aparelho', async () => {
    const yesterday = [1, 2, 3].map(() => storedRound({ stars: 3, day: '2026-11-11' }));
    const { repo, rounds } = fakeRepo('inserted', yesterday);

    await send(body(), repo);

    expect(rounds[0].points).toBe(20);
  });

  it('rodada guardada antes dos pontos (sem dia) só conta para as estrelas', async () => {
    const old = [1, 2, 3].map(() => storedRound({ stars: 3, day: null }));
    const { repo, rounds } = fakeRepo('inserted', old);

    await send(body(), repo);

    expect(rounds[0].points).toBe(20);
  });

  it('mesma rodada enviada de novo não devolve pontos', async () => {
    const { repo } = fakeRepo('duplicate');

    const response = await send(body(), repo);

    expect(response.body.points).toBe(0);
  });

  it.each(['2026-11-10', '2026-11-14'])(
    'recusa dia local a mais de 1 dia do início da rodada (%p)',
    async (day) => {
      const { repo, rounds } = fakeRepo();

      const response = await send(body({ day }), repo);

      expect(response).toEqual({ status: 422, body: { error: 'dayOutOfRange' } });
      expect(rounds).toEqual([]);
    },
  );

  it.each(['2026-11-11', '2026-11-13'])(
    'aceita o dia local vizinho ao dia do início em UTC, por causa dos fusos (%p)',
    async (day) => {
      const { repo, rounds } = fakeRepo();

      await send(body({ day }), repo);

      expect(rounds[0].day).toBe(day);
    },
  );

  it('sem token válido: 401, sem gravar', async () => {
    const { repo, rounds } = fakeRepo();

    const response = await send(body(), repo, null);

    expect(response).toEqual({ status: 401, body: { error: 'unauthorized' } });
    expect(rounds).toEqual([]);
  });

  it('mesma rodada enviada de novo: avisa que já existia', async () => {
    const { repo } = fakeRepo('duplicate');

    const response = await send(body(), repo);

    expect(response).toMatchObject({ status: 200, body: { duplicate: true } });
  });

  it('versão das regras diferente da do servidor é recusada', async () => {
    const { repo } = fakeRepo();

    const response = await send(body({ rulesVersion: RULES + 1 }), repo);

    expect(response).toEqual({ status: 409, body: { error: 'rulesMismatch' } });
  });

  it('respostas que não passam na conferência são recusadas com o motivo', async () => {
    const { repo, rounds } = fakeRepo();

    const unknownStage = await send(body({ stageId: 'L99-A' }), repo);
    const invalidSeed = await send(body({ seed: -5 }), repo);

    expect(unknownStage).toEqual({ status: 422, body: { error: 'unknownStage' } });
    expect(invalidSeed).toEqual({ status: 422, body: { error: 'invalidSeed' } });
    expect(rounds).toEqual([]);
  });

  it('recusa rodada com início no futuro', async () => {
    const { repo } = fakeRepo();

    const response = await send(body({ startedAt: '2026-11-14T12:00:00.000Z' }), repo);

    expect(response).toEqual({ status: 422, body: { error: 'invalidStart' } });
  });

  it.each([
    { id: 'não é uuid' },
    { startedAt: 'ontem' },
    { startedAt: 12345 },
    { inputDirection: 'cima' },
    { appVersion: 'x'.repeat(40) },
    { appVersion: 1 },
    { stageId: 7 },
    { seed: '1' },
    { answers: {} },
    { day: undefined },
    { day: 20261112 },
    { day: 'hoje' },
    { day: '2026-11-12T00:00' },
  ])('campo fora do formato: 400 (%#)', async (overrides) => {
    const { repo } = fakeRepo();

    expect(await send(body(overrides), repo)).toEqual({
      status: 400,
      body: { error: 'invalidBody' },
    });
  });

  it.each([null, {}, 'texto'])('corpo que não é uma rodada: 400 (%#)', async (payload) => {
    const { repo } = fakeRepo();

    expect(await send(payload, repo)).toEqual({ status: 400, body: { error: 'invalidBody' } });
  });
});

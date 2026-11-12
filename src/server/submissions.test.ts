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

function fakeRepo(outcome: InsertOutcome = 'inserted') {
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
      body: { ok: true, duplicate: false, correct: 9, total: 10, elapsedMs: 30_000 },
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
      },
    ]);
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
    inputDirection: 'rtl',
    answers: rightAnswers(setup.problems),
    ...overrides,
  });
  const send = (payload: unknown, repo: ServerRepo, token: string | null = TOKEN) =>
    submitRound({ token, body: payload }, { repo, now: NOW });

  it('grava a rodada com o placar e as estrelas calculados no servidor', async () => {
    const { repo, rounds } = fakeRepo();

    const response = await send(body({ correct: 0, stars: 0 }), repo);

    expect(response).toEqual({
      status: 200,
      body: { ok: true, duplicate: false, correct: 10, total: 10, elapsedMs: 30_000, stars: 3 },
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
    });
    expect(problems).toHaveLength(10);
    expect(problems.every((p) => p.correct)).toBe(true);
  });

  it('rodada abandonada é gravada sem estrelas', async () => {
    const { repo, rounds } = fakeRepo();
    const answers = rightAnswers(setup.problems).map((a, i) => (i < 3 ? a : blank));

    await send(body({ answers }), repo);

    expect(rounds[0]).toMatchObject({ status: 'abandoned', correct: 3, stars: null });
  });

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

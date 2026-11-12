import * as fc from 'fast-check';

import { solve } from './carry';
import { GAME_CONFIG } from './config/game-config';
import { setupDailyTest } from './daily';
import { createRound, roundReducer, roundSummary, type RoundState } from './round';
import { setupRound } from './round-setup';
import { getStage } from './stages';
import type { Problem } from './types';
import {
  type SubmittedAnswer,
  toSubmittedAnswers,
  verifyAnswers,
  verifyChallengeRound,
  verifyDailyTest,
} from './verify';

const PROBLEMS: Problem[] = [
  { a: 2, b: 3, op: 'add' },
  { a: 9, b: 4, op: 'sub' },
  { a: 6, b: 7, op: 'mul' },
];

const answered = (answer: number, timeMs = 2000): SubmittedAnswer => ({
  answer,
  timeMs,
  keystrokes: 2,
});
const blank = (timeMs = 0): SubmittedAnswer => ({ answer: null, timeMs, keystrokes: 0 });

/** Respostas certas para todas as contas, 2 s cada. */
const allRight = (problems: readonly Problem[]) => problems.map((p) => answered(solve(p)));

/** Joga a rodada no reducer: digita cada resposta e confirma, `stepMs` depois da anterior. */
function play(problems: readonly Problem[], answers: number[], stepMs = 1500): RoundState {
  let state = roundReducer(createRound({ problems, timeLimitMs: null, direction: 'ltr' }), {
    type: 'start',
    at: 1000,
  });
  answers.forEach((answer, i) => {
    for (const digit of String(answer)) {
      state = roundReducer(state, { type: 'digit', digit: Number(digit) });
    }
    state = roundReducer(state, { type: 'submit', at: 1000 + (i + 1) * stepMs });
  });
  return state;
}

describe('verifyAnswers', () => {
  it('refaz o placar a partir das respostas: acertos, total e tempo somado', () => {
    const result = verifyAnswers(PROBLEMS, [answered(5, 1500), answered(4, 2500), answered(42)]);

    expect(result).toEqual({
      ok: true,
      round: expect.objectContaining({ correct: 2, total: 3, elapsedMs: 6000 }),
    });
  });

  it('devolve cada conta com o resultado esperado e se a resposta está certa', () => {
    const result = verifyAnswers(PROBLEMS, [answered(5), answered(4), answered(42)]);

    expect(result.ok && result.round.problems).toEqual([
      { a: 2, b: 3, op: 'add', expected: 5, answer: 5, correct: true, timeMs: 2000, keystrokes: 2 },
      {
        a: 9,
        b: 4,
        op: 'sub',
        expected: 5,
        answer: 4,
        correct: false,
        timeMs: 2000,
        keystrokes: 2,
      },
      {
        a: 6,
        b: 7,
        op: 'mul',
        expected: 42,
        answer: 42,
        correct: true,
        timeMs: 2000,
        keystrokes: 2,
      },
    ]);
  });

  it('rodada abandonada: as contas sem resposta contam como erradas', () => {
    const result = verifyAnswers(PROBLEMS, [answered(5), blank(700), blank()]);

    expect(result).toEqual({
      ok: true,
      round: expect.objectContaining({ correct: 1, total: 3, elapsedMs: 2700 }),
    });
  });

  it('recusa quantidade de respostas diferente da de contas', () => {
    expect(verifyAnswers(PROBLEMS, [answered(5), answered(5)])).toEqual({
      ok: false,
      reason: 'wrongCount',
    });
    expect(verifyAnswers(PROBLEMS, [...allRight(PROBLEMS), answered(1)])).toEqual({
      ok: false,
      reason: 'wrongCount',
    });
  });

  it.each([-1, 1.5, 10_000, Number.NaN, Number.POSITIVE_INFINITY])(
    'recusa resposta que o teclado não produz (%p)',
    (answer) => {
      expect(verifyAnswers(PROBLEMS, [answered(answer), answered(5), answered(42)])).toEqual({
        ok: false,
        reason: 'invalidAnswer',
      });
    },
  );

  it('aceita a maior resposta que cabe no teclado (4 dígitos)', () => {
    expect(verifyAnswers(PROBLEMS, [answered(9999), answered(5), answered(42)]).ok).toBe(true);
  });

  it.each([-1, 0.5, Number.NaN, GAME_CONFIG.verification.maxProblemTimeMs + 1])(
    'recusa tempo inválido (%p)',
    (timeMs) => {
      expect(verifyAnswers(PROBLEMS, [answered(5), answered(5), blank(timeMs)])).toEqual({
        ok: false,
        reason: 'invalidTime',
      });
    },
  );

  it.each([-1, 2.5, Number.NaN])('recusa contagem de teclas inválida (%p)', (keystrokes) => {
    expect(
      verifyAnswers(PROBLEMS, [{ answer: 5, timeMs: 2000, keystrokes }, answered(5), answered(42)]),
    ).toEqual({ ok: false, reason: 'invalidKeystrokes' });
  });

  it('recusa conta respondida depois de uma sem resposta (a rodada para no abandono)', () => {
    expect(verifyAnswers(PROBLEMS, [answered(5), blank(), answered(42)])).toEqual({
      ok: false,
      reason: 'answerAfterBlank',
    });
  });

  it('recusa conta respondida mais rápido do que uma pessoa consegue', () => {
    const tooFast = GAME_CONFIG.verification.minAnswerTimeMs - 1;

    expect(verifyAnswers(PROBLEMS, [answered(5, tooFast), answered(5), answered(42)])).toEqual({
      ok: false,
      reason: 'tooFast',
    });
  });

  it('aceita resposta no tempo mínimo exato', () => {
    const fastest = PROBLEMS.map((p) =>
      answered(solve(p), GAME_CONFIG.verification.minAnswerTimeMs),
    );

    expect(verifyAnswers(PROBLEMS, fastest).ok).toBe(true);
  });

  it('conta sem resposta pode ter tempo 0 (abandono antes de ela aparecer)', () => {
    expect(verifyAnswers(PROBLEMS, [blank(), blank(), blank()])).toEqual({
      ok: true,
      round: expect.objectContaining({ correct: 0, elapsedMs: 0 }),
    });
  });
});

describe('toSubmittedAnswers', () => {
  it('leva só a resposta, o tempo e as teclas de cada conta', () => {
    const summary = roundSummary(play(PROBLEMS, [5, 4, 42]));

    expect(toSubmittedAnswers(summary.problems)).toEqual([
      { answer: 5, timeMs: 1500, keystrokes: 1 },
      { answer: 4, timeMs: 1500, keystrokes: 1 },
      { answer: 42, timeMs: 1500, keystrokes: 2 },
    ]);
  });

  it('o servidor chega ao mesmo placar que o aparelho, em qualquer rodada jogada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.array(fc.integer({ min: 0, max: 9999 }), { minLength: 10, maxLength: 10 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: GAME_CONFIG.verification.minAnswerTimeMs, max: 20_000 }),
        (seed, answers, answeredCount, stepMs) => {
          const { problems } = setupRound({ stageId: 'L12-B', mode: 'challenge', seed });
          let state = play(problems, answers.slice(0, answeredCount), stepMs);
          if (answeredCount < 10) {
            state = roundReducer(state, {
              type: 'abandon',
              at: 1000 + answeredCount * stepMs + 300,
            });
          }
          const summary = roundSummary(state);

          const result = verifyAnswers(problems, toSubmittedAnswers(summary.problems));

          expect(result).toEqual({
            ok: true,
            round: {
              correct: summary.correct,
              total: summary.total,
              elapsedMs: summary.elapsedMs,
              problems: summary.problems,
            },
          });
        },
      ),
    );
  });
});

describe('verifyDailyTest', () => {
  const DAY = '2026-11-12';
  const problems = setupDailyTest(DAY).problems;

  it('confere as respostas contra as contas do dia', () => {
    const answers = allRight(problems);
    answers[3] = answered(solve(problems[3]) + 1);

    expect(verifyDailyTest(DAY, answers)).toEqual({
      ok: true,
      round: expect.objectContaining({ correct: 9, total: 10, elapsedMs: 20_000 }),
    });
  });

  it('as respostas de um dia não servem para outro', () => {
    const result = verifyDailyTest('2026-11-13', allRight(problems));

    expect(result.ok && result.round.correct).toBeLessThan(10);
  });

  it.each(['2026-13-01', '2026-02-30', 'hoje', '', '2026-1-1'])(
    'recusa dia inválido (%p)',
    (day) => {
      expect(verifyDailyTest(day, allRight(problems))).toEqual({ ok: false, reason: 'invalidDay' });
    },
  );

  it('repassa os problemas das respostas', () => {
    expect(verifyDailyTest(DAY, [])).toEqual({ ok: false, reason: 'wrongCount' });
  });
});

describe('verifyChallengeRound', () => {
  const STAGE = 'L07-B';
  const SEED = 12345;
  const { problems, timeLimitMs } = setupRound({ stageId: STAGE, mode: 'challenge', seed: SEED });

  it('refaz as contas pela etapa e pela seed e calcula as estrelas', () => {
    const result = verifyChallengeRound({
      stageId: STAGE,
      seed: SEED,
      answers: allRight(problems),
    });

    expect(result).toEqual({
      ok: true,
      round: expect.objectContaining({
        status: 'completed',
        correct: 10,
        total: 10,
        elapsedMs: 20_000,
        timeLimitMs: getStage(STAGE).timeLimitMs,
        stars: 3,
      }),
    });
    expect(timeLimitMs).toBe(getStage(STAGE).timeLimitMs);
  });

  it('respostas certas de outra seed não valem', () => {
    const result = verifyChallengeRound({
      stageId: STAGE,
      seed: SEED + 1,
      answers: allRight(problems),
    });

    expect(result.ok && result.round.correct).toBeLessThan(10);
  });

  it('tempo acima do limite: no máximo 1 estrela', () => {
    const slow = problems.map((p) => answered(solve(p), getStage(STAGE).timeLimitMs));

    const result = verifyChallengeRound({ stageId: STAGE, seed: SEED, answers: slow });

    expect(result.ok && result.round.stars).toBe(1);
  });

  it('rodada com conta sem resposta é abandonada e não tem estrelas', () => {
    const answers = [
      ...allRight(problems).slice(0, 4),
      ...Array.from({ length: 6 }, () => blank()),
    ];

    const result = verifyChallengeRound({ stageId: STAGE, seed: SEED, answers });

    expect(result).toEqual({
      ok: true,
      round: expect.objectContaining({ status: 'abandoned', correct: 4, stars: null }),
    });
  });

  it('recusa etapa que não existe', () => {
    expect(
      verifyChallengeRound({ stageId: 'L99-Z', seed: SEED, answers: allRight(problems) }),
    ).toEqual({ ok: false, reason: 'unknownStage' });
  });

  it.each([-1, 1.5, 2 ** 31, Number.NaN])('recusa seed inválida (%p)', (seed) => {
    expect(verifyChallengeRound({ stageId: STAGE, seed, answers: allRight(problems) })).toEqual({
      ok: false,
      reason: 'invalidSeed',
    });
  });
});

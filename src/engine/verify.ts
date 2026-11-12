// Conferência de uma rodada enviada (D-034). O servidor refaz as contas e calcula o placar
// a partir das respostas e dos tempos. O placar em si nunca é enviado.

import { solve } from './carry';
import { GAME_CONFIG } from './config/game-config';
import { setupDailyTest } from './daily';
import type { RoundStatus } from './round-record';
import { isKnownStage, setupRound } from './round-setup';
import { calculateStars } from './scoring';
import { daysBetween } from './streak';
import type { Problem, ProblemAttempt, Stars } from './types';

/** O que o app envia de cada conta, na ordem da rodada. */
export interface SubmittedAnswer {
  /** null = não respondida (abandono). */
  answer: number | null;
  timeMs: number;
  keystrokes: number;
}

export type RejectReason =
  | 'invalidDay'
  | 'unknownStage'
  | 'invalidSeed'
  | 'wrongCount'
  | 'invalidAnswer'
  | 'invalidTime'
  | 'invalidKeystrokes'
  | 'answerAfterBlank'
  | 'tooFast';

export interface VerifiedRound {
  correct: number;
  total: number;
  /** Soma dos tempos por conta: é assim que a rodada mede o tempo total. */
  elapsedMs: number;
  problems: ProblemAttempt[];
}

export type Verification<T = VerifiedRound> =
  { ok: true; round: T } | { ok: false; reason: RejectReason };

/** O que o app envia de uma rodada jogada. */
export function toSubmittedAnswers(problems: readonly ProblemAttempt[]): SubmittedAnswer[] {
  return problems.map(({ answer, timeMs, keystrokes }) => ({ answer, timeMs, keystrokes }));
}

const isCount = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;

function answerProblem(
  { answer, timeMs, keystrokes }: SubmittedAnswer,
  afterBlank: boolean,
): RejectReason | null {
  const { minAnswerTimeMs, maxProblemTimeMs, maxKeystrokes } = GAME_CONFIG.verification;
  const maxAnswer = 10 ** GAME_CONFIG.maxAnswerDigits - 1;
  if (answer !== null && !isCount(answer, maxAnswer)) return 'invalidAnswer';
  if (!isCount(timeMs, maxProblemTimeMs)) return 'invalidTime';
  if (!isCount(keystrokes, maxKeystrokes)) return 'invalidKeystrokes';
  if (answer === null) return null;
  if (afterBlank) return 'answerAfterBlank';
  if (timeMs < minAnswerTimeMs) return 'tooFast';
  return null;
}

/** Confere as respostas contra as contas e refaz o placar. */
export function verifyAnswers(
  problems: readonly Problem[],
  answers: readonly SubmittedAnswer[],
): Verification {
  if (answers.length !== problems.length) return { ok: false, reason: 'wrongCount' };

  let afterBlank = false;
  for (const submitted of answers) {
    const reason = answerProblem(submitted, afterBlank);
    if (reason) return { ok: false, reason };
    afterBlank ||= submitted.answer === null;
  }

  const attempts = problems.map((problem, i): ProblemAttempt => {
    const { answer, timeMs, keystrokes } = answers[i];
    const expected = solve(problem);
    return { ...problem, expected, answer, correct: answer === expected, timeMs, keystrokes };
  });
  return {
    ok: true,
    round: {
      correct: attempts.filter((p) => p.correct).length,
      total: attempts.length,
      elapsedMs: attempts.reduce((sum, p) => sum + p.timeMs, 0),
      problems: attempts,
    },
  };
}

function isDay(day: string): boolean {
  try {
    daysBetween(day, day);
    return true;
  } catch {
    return false;
  }
}

/** Teste do dia: as contas saem da data. */
export function verifyDailyTest(day: string, answers: readonly SubmittedAnswer[]): Verification {
  if (!isDay(day)) return { ok: false, reason: 'invalidDay' };
  return verifyAnswers(setupDailyTest(day).problems, answers);
}

export interface VerifiedChallenge extends VerifiedRound {
  /** Vem das respostas: com alguma conta sem resposta, a rodada foi abandonada. */
  status: RoundStatus;
  timeLimitMs: number;
  /** null na rodada abandonada. */
  stars: Stars | null;
}

const isSeed = (seed: number) => Number.isInteger(seed) && seed >= 0 && seed < 2 ** 31;

/** Rodada de desafio: as contas saem da etapa e da seed. */
export function verifyChallengeRound(input: {
  stageId: string;
  seed: number;
  answers: readonly SubmittedAnswer[];
}): Verification<VerifiedChallenge> {
  const { stageId, seed, answers } = input;
  if (!isKnownStage(stageId)) return { ok: false, reason: 'unknownStage' };
  if (!isSeed(seed)) return { ok: false, reason: 'invalidSeed' };

  const setup = setupRound({ stageId, mode: 'challenge', seed });
  const verified = verifyAnswers(setup.problems, answers);
  if (!verified.ok) return verified;

  const { round } = verified;
  // O desafio sempre tem tempo-limite (só o treino livre não tem).
  const timeLimitMs = setup.timeLimitMs!;
  const completed = round.problems.every((p) => p.answer !== null);
  const stars = completed
    ? calculateStars({
        correct: round.correct,
        total: round.total,
        elapsedMs: round.elapsedMs,
        limitMs: timeLimitMs,
      })
    : null;
  return {
    ok: true,
    round: { ...round, status: completed ? 'completed' : 'abandoned', timeLimitMs, stars },
  };
}

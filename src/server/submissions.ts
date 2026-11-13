// Recebe o teste do dia e as rodadas de desafio enviados pelo app (D-034). O servidor refaz as
// contas com o mesmo engine do app, confere as respostas e grava o placar e os pontos que ele
// mesmo calculou (D-035, D-037).
// Aqui não há HTTP nem Supabase: quem liga as duas pontas é http.ts.

import { GAME_CONFIG } from '../engine/config/game-config';
import { nicknameProblem, normalizeNickname } from '../engine/nickname';
import { dailyPoints, type PointsContext, roundPoints } from '../engine/points';
import { daysBetween } from '../engine/streak';
import type { Stars } from '../engine/types';
import { type SubmittedAnswer, verifyChallengeRound, verifyDailyTest } from '../engine/verify';

import type { ServerRepo, StageRoundRow } from './repo';

export interface ApiRequest {
  /** O token do usuário anônimo (cabeçalho Authorization), ou null se não veio. */
  token: string | null;
  /** O JSON recebido, ainda sem conferir. */
  body: unknown;
}

export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

export interface ApiDeps {
  repo: ServerRepo;
  /** Horário do servidor, em ms. */
  now: number;
}

export type ApiHandler = (request: ApiRequest, deps: ApiDeps) => Promise<ApiResponse>;

const refuse = (status: number, error: string): ApiResponse => ({ status, body: { error } });

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number';

/** Só o formato. Os valores são conferidos pelo engine (verify.ts). */
function parseAnswers(value: unknown): SubmittedAnswer[] | null {
  // Bem acima de qualquer rodada: evita percorrer uma lista enorme.
  if (!Array.isArray(value) || value.length > 100) return null;
  const answers: SubmittedAnswer[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const { answer, timeMs, keystrokes } = item;
    if (answer !== null && !isNumber(answer)) return null;
    if (!isNumber(timeMs) || !isNumber(keystrokes)) return null;
    answers.push({ answer, timeMs, keystrokes });
  }
  return answers;
}

/** O dia no servidor (UTC), 'YYYY-MM-DD'. */
const serverDay = (now: number) => new Date(now).toISOString().slice(0, 10);

/** O dia do aparelho é o do horário local: pode estar 1 dia à frente ou atrás do servidor. */
const MAX_DAY_DISTANCE = 1;

/** Distância em dias, ou null se alguma das datas não é 'YYYY-MM-DD' válida. */
function dayDistance(from: string, to: string): number | null {
  try {
    return Math.abs(daysBetween(from, to));
  } catch {
    return null;
  }
}

const isDay = (v: unknown): v is string => isString(v) && dayDistance(v, v) !== null;

async function authenticate({ token }: ApiRequest, { repo }: ApiDeps): Promise<string | null> {
  return token ? repo.userIdFromToken(token) : null;
}

/** Teste do dia: respostas e tempos → resultado no ranking. */
export const submitDaily: ApiHandler = async (request, deps) => {
  const userId = await authenticate(request, deps);
  if (!userId) return refuse(401, 'unauthorized');

  if (!isRecord(request.body)) return refuse(400, 'invalidBody');
  const { day, nickname, rulesVersion } = request.body;
  const answers = parseAnswers(request.body.answers);
  if (!isString(day) || !isString(nickname) || !isNumber(rulesVersion) || !answers) {
    return refuse(400, 'invalidBody');
  }

  if (rulesVersion !== GAME_CONFIG.rulesVersion) return refuse(409, 'rulesMismatch');
  if (nicknameProblem(nickname)) return refuse(422, 'invalidNickname');

  const verification = verifyDailyTest(day, answers);
  if (!verification.ok) return refuse(422, verification.reason);
  if (Math.abs(daysBetween(day, serverDay(deps.now))) > MAX_DAY_DISTANCE) {
    return refuse(422, 'dayOutOfRange');
  }

  const { correct, total } = verification.round;
  // O banco recusa tempo 0 (sair no instante em que a 1ª conta aparece).
  const elapsedMs = Math.max(1, verification.round.elapsedMs);
  const points = dailyPoints(correct).total;
  const outcome = await deps.repo.insertDailyResult({
    day,
    userId,
    nickname: normalizeNickname(nickname),
    correct,
    total,
    elapsedMs,
    rulesVersion,
    points,
  });
  const duplicate = outcome === 'duplicate';
  return {
    status: 200,
    // Os pontos de um envio repetido já valeram no primeiro.
    body: { ok: true, duplicate, correct, total, elapsedMs, points: duplicate ? 0 : points },
  };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const MAX_APP_VERSION_LENGTH = 32;
const DAY_MS = 24 * 60 * 60 * 1000;

const isDirection = (v: unknown): v is 'ltr' | 'rtl' => v === 'ltr' || v === 'rtl';

/** Melhor nota e rodadas do dia, a partir das rodadas já guardadas (a ordem é a de chegada). */
function pointsContext(stored: readonly StageRoundRow[], day: string): PointsContext {
  const completed = stored.filter((r) => r.status === 'completed');
  return {
    bestStarsBefore: completed.reduce<Stars>((best, r) => Math.max(best, r.stars ?? 0) as Stars, 0),
    earlierRoundsToday: completed.filter((r) => r.day === day).length,
  };
}

/** Rodada de desafio: respostas e tempos → rodada conferida, guardada para os pontos (M9). */
export const submitRound: ApiHandler = async (request, deps) => {
  const userId = await authenticate(request, deps);
  if (!userId) return refuse(401, 'unauthorized');

  if (!isRecord(request.body)) return refuse(400, 'invalidBody');
  const { id, stageId, seed, rulesVersion, appVersion, startedAt, day, inputDirection } =
    request.body;
  const answers = parseAnswers(request.body.answers);
  if (
    !isString(id) ||
    !UUID.test(id) ||
    !isString(stageId) ||
    !isNumber(seed) ||
    !isNumber(rulesVersion) ||
    !isString(appVersion) ||
    appVersion.length > MAX_APP_VERSION_LENGTH ||
    !isString(startedAt) ||
    !ISO_TIME.test(startedAt) ||
    Number.isNaN(Date.parse(startedAt)) ||
    !isDay(day) ||
    !isDirection(inputDirection) ||
    !answers
  ) {
    return refuse(400, 'invalidBody');
  }

  if (rulesVersion !== GAME_CONFIG.rulesVersion) return refuse(409, 'rulesMismatch');
  // Relógio do aparelho adiantado é comum; mais de um dia no futuro, não.
  if (Date.parse(startedAt) > deps.now + DAY_MS) return refuse(422, 'invalidStart');
  // O dia local é o do início da rodada no fuso do aparelho.
  if (dayDistance(day, serverDay(Date.parse(startedAt)))! > MAX_DAY_DISTANCE) {
    return refuse(422, 'dayOutOfRange');
  }

  const verification = verifyChallengeRound({ stageId, seed, answers });
  if (!verification.ok) return refuse(422, verification.reason);

  const { round } = verification;
  // Os pontos olham as rodadas que já chegaram: a fila do app envia uma por vez, na ordem.
  const stored = await deps.repo.stageRounds(userId, stageId);
  const points = roundPoints(
    { stageId, mode: 'challenge', ...round },
    pointsContext(stored, day),
  ).total;
  const outcome = await deps.repo.insertRound({
    id: id.toLowerCase(),
    userId,
    stageId,
    seed,
    rulesVersion,
    appVersion,
    status: round.status,
    startedAt,
    elapsedMs: round.elapsedMs,
    timeLimitMs: round.timeLimitMs,
    correct: round.correct,
    total: round.total,
    stars: round.stars,
    inputDirection,
    problems: round.problems,
    day,
    points,
  });
  const duplicate = outcome === 'duplicate';
  return {
    status: 200,
    body: {
      ok: true,
      duplicate,
      correct: round.correct,
      total: round.total,
      elapsedMs: round.elapsedMs,
      stars: round.stars,
      points: duplicate ? 0 : points,
    },
  };
};

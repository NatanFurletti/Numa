import { solve } from '@/engine/carry';
import { buildRoundRecord, type RoundRecord } from '@/engine/round-record';
import type { PlayMode } from '@/engine/round-setup';
import type { Problem, ProblemAttempt } from '@/engine/types';

/** Contas fixas para os testes: 1+1, 2+1, …, 10+1. */
export const TEST_PROBLEMS: Problem[] = Array.from({ length: 10 }, (_, i) => ({
  a: i + 1,
  b: 1,
  op: 'add',
}));

interface BuildRecordOptions {
  id?: string;
  stageId?: string;
  mode?: PlayMode;
  /** Quantas contas certas (as primeiras). As erradas recebem a resposta `expected + 1`. */
  correct?: number;
  elapsedMs?: number;
  timeLimitMs?: number | null;
}

/** Rodada concluída pronta para colocar no histórico. */
export function buildRecord(options: BuildRecordOptions = {}): RoundRecord {
  const {
    id = 'round-1',
    stageId = 'L01-A',
    mode = 'challenge',
    correct = 10,
    elapsedMs = 40_000,
    timeLimitMs = mode === 'practice' ? null : 60_000,
  } = options;
  const problems = TEST_PROBLEMS.map((p, i): ProblemAttempt => {
    const expected = solve(p);
    const answer = i < correct ? expected : expected + 1;
    return { ...p, expected, answer, correct: i < correct, timeMs: 4000, keystrokes: 2 };
  });
  return buildRoundRecord({
    id,
    appVersion: '0.1.0',
    stageId,
    mode,
    status: 'completed',
    seed: 1,
    startedAt: '2026-10-23T12:00:00.000Z',
    timeLimitMs,
    inputDirection: 'ltr',
    summary: {
      correct,
      total: problems.length,
      elapsedMs,
      overtimeMs: timeLimitMs === null ? 0 : Math.max(0, elapsedMs - timeLimitMs),
      problems,
    },
  });
}

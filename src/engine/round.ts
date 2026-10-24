// Máquina de estados da rodada (docs/ARCHITECTURE.md §5.2, docs/GAME_RULES.md §2).
// O tempo vem sempre de marcas de horário (`at`), nunca de ticks somados.

import {
  answerValue,
  type AnswerInput,
  backspace,
  emptyAnswer,
  isAnswerEmpty,
  typeDigit,
} from './answer-input';
import { solve } from './carry';
import { GAME_CONFIG } from './config/game-config';
import type { InputDirection, Problem, ProblemAttempt } from './types';

export type RoundStatus = 'ready' | 'running' | 'finished' | 'abandoned';

export interface RoundState {
  status: RoundStatus;
  problems: readonly Problem[];
  currentIndex: number;
  input: AnswerInput;
  direction: InputDirection;
  maxDigits: number;
  /** null = sem tempo-limite (treino livre). */
  timeLimitMs: number | null;
  startedAt: number | null;
  /** Quando a conta atual virou a atual. */
  currentStartedAt: number | null;
  finishedAt: number | null;
  /** Teclas na conta atual. */
  keystrokes: number;
  results: readonly ProblemAttempt[];
}

export type RoundEvent =
  | { type: 'start'; at: number }
  | { type: 'digit'; digit: number }
  | { type: 'backspace' }
  | { type: 'submit'; at: number }
  | { type: 'abandon'; at: number };

export interface CreateRoundOptions {
  problems: readonly Problem[];
  timeLimitMs: number | null;
  direction: InputDirection;
  maxDigits?: number;
}

export function createRound(options: CreateRoundOptions): RoundState {
  return {
    status: 'ready',
    problems: options.problems,
    currentIndex: 0,
    input: emptyAnswer(),
    direction: options.direction,
    maxDigits: options.maxDigits ?? GAME_CONFIG.maxAnswerDigits,
    timeLimitMs: options.timeLimitMs,
    startedAt: null,
    currentStartedAt: null,
    finishedAt: null,
    keystrokes: 0,
    results: [],
  };
}

function submit(state: RoundState, at: number): RoundState {
  if (isAnswerEmpty(state.input)) return state;
  const problem = state.problems[state.currentIndex];
  const answer = answerValue(state.input, state.direction);
  const expected = solve(problem);
  const result: ProblemAttempt = {
    ...problem,
    expected,
    answer,
    correct: answer === expected,
    // Rodada em andamento sempre tem currentStartedAt.
    timeMs: at - state.currentStartedAt!,
    keystrokes: state.keystrokes,
  };
  const nextIndex = state.currentIndex + 1;
  const isLast = nextIndex >= state.problems.length;
  return {
    ...state,
    status: isLast ? 'finished' : 'running',
    currentIndex: nextIndex,
    input: emptyAnswer(),
    currentStartedAt: at,
    finishedAt: isLast ? at : null,
    keystrokes: 0,
    results: [...state.results, result],
  };
}

export function roundReducer(state: RoundState, event: RoundEvent): RoundState {
  switch (event.type) {
    case 'start':
      if (state.status !== 'ready') return state;
      return { ...state, status: 'running', startedAt: event.at, currentStartedAt: event.at };
    case 'abandon':
      if (state.status !== 'ready' && state.status !== 'running') return state;
      return { ...state, status: 'abandoned', finishedAt: event.at };
  }
  if (state.status !== 'running') return state;
  switch (event.type) {
    case 'digit':
      return {
        ...state,
        input: typeDigit(state.input, event.digit, state.maxDigits),
        keystrokes: state.keystrokes + 1,
      };
    case 'backspace':
      return { ...state, input: backspace(state.input), keystrokes: state.keystrokes + 1 };
    case 'submit':
      return submit(state, event.at);
  }
}

// ---------- Leituras do estado (para a tela) ----------

export function currentProblem(state: RoundState): Problem | null {
  return state.problems[state.currentIndex] ?? null;
}

/** Conta atual e as 2 próximas. */
export function visibleProblems(state: RoundState): Problem[] {
  if (state.status === 'finished' || state.status === 'abandoned') return [];
  return state.problems.slice(state.currentIndex, state.currentIndex + 3);
}

function elapsedAt(state: RoundState, now: number): number {
  if (state.startedAt === null) return 0;
  return (state.finishedAt ?? now) - state.startedAt;
}

export function isTimeUp(state: RoundState, now: number): boolean {
  return state.timeLimitMs !== null && elapsedAt(state, now) > state.timeLimitMs;
}

export function overtimeMs(state: RoundState, now: number): number {
  if (state.timeLimitMs === null) return 0;
  return Math.max(0, elapsedAt(state, now) - state.timeLimitMs);
}

/** Fração da barra de tempo ainda cheia (1 → 0), ou null sem tempo-limite. */
export function timeRemainingRatio(state: RoundState, now: number): number | null {
  if (state.timeLimitMs === null) return null;
  const ratio = 1 - elapsedAt(state, now) / state.timeLimitMs;
  return Math.min(1, Math.max(0, ratio));
}

export interface RoundSummary {
  correct: number;
  total: number;
  elapsedMs: number;
  overtimeMs: number;
  problems: ProblemAttempt[];
}

/** Resumo de uma rodada terminada ou abandonada. */
export function roundSummary(state: RoundState): RoundSummary {
  const end = state.finishedAt;
  if (end === null) throw new Error('A rodada ainda não terminou.');
  const pending = state.problems.slice(state.results.length).map((problem, i): ProblemAttempt => {
    const isCurrent = i === 0 && state.currentStartedAt !== null;
    return {
      ...problem,
      expected: solve(problem),
      answer: null,
      correct: false,
      timeMs: isCurrent ? end - state.currentStartedAt! : 0,
      keystrokes: isCurrent ? state.keystrokes : 0,
    };
  });
  return {
    correct: state.results.filter((r) => r.correct).length,
    total: state.problems.length,
    elapsedMs: elapsedAt(state, end),
    overtimeMs: overtimeMs(state, end),
    problems: [...state.results, ...pending],
  };
}

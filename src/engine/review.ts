// Correção depois da rodada (docs/GAME_RULES.md §7): só as erradas, uma por vez, sem tempo.
// Aqui há retorno: acertou → ✓; errou → tenta de novo; depois de 2 erros, "Ver resposta".

import {
  answerValue,
  type AnswerInput,
  backspace,
  emptyAnswer,
  isAnswerEmpty,
  typeDigit,
} from './answer-input';
import { GAME_CONFIG } from './config/game-config';
import type { InputDirection, Problem, ProblemAttempt } from './types';

export interface ReviewItem {
  /** Posição da conta na rodada original. */
  roundIndex: number;
  problem: Problem;
  expected: number;
  /** Resposta dada na rodada. */
  roundAnswer: number | null;
  /** Tentativas feitas na correção (incluindo a certa). */
  attempts: number;
  wrongTries: number;
  revealed: boolean;
}

/**
 * answering: esperando a resposta.
 * correct / revealed: mostrando o ✓ ou a resposta; o próximo "next" avança.
 * done: todas corrigidas.
 */
export type ReviewStatus = 'answering' | 'correct' | 'revealed' | 'done';

export interface ReviewState {
  status: ReviewStatus;
  items: readonly ReviewItem[];
  /** Conta atual dentro de `items`. */
  position: number;
  input: AnswerInput;
  direction: InputDirection;
  maxDigits: number;
  /** Total de erros na correção. Muda a cada erro, para a tela tremer de novo. */
  wrongCount: number;
}

export type ReviewEvent =
  | { type: 'digit'; digit: number }
  | { type: 'backspace' }
  | { type: 'submit' }
  | { type: 'reveal' }
  | { type: 'next' };

export interface CreateReviewOptions {
  problems: readonly ProblemAttempt[];
  direction: InputDirection;
  maxDigits?: number;
}

export function createReview(options: CreateReviewOptions): ReviewState {
  const items = options.problems.flatMap((p, roundIndex): ReviewItem[] =>
    p.correct
      ? []
      : [
          {
            roundIndex,
            problem: { a: p.a, b: p.b, op: p.op },
            expected: p.expected,
            roundAnswer: p.answer,
            attempts: 0,
            wrongTries: 0,
            revealed: false,
          },
        ],
  );
  return {
    status: items.length === 0 ? 'done' : 'answering',
    items,
    position: 0,
    input: emptyAnswer(),
    direction: options.direction,
    maxDigits: options.maxDigits ?? GAME_CONFIG.maxAnswerDigits,
    wrongCount: 0,
  };
}

export function currentReviewItem(state: ReviewState): ReviewItem | null {
  if (state.status === 'done') return null;
  return state.items[state.position] ?? null;
}

export function canReveal(state: ReviewState): boolean {
  const item = currentReviewItem(state);
  return (
    state.status === 'answering' &&
    item !== null &&
    item.wrongTries >= GAME_CONFIG.review.wrongTriesBeforeReveal
  );
}

function updateCurrent(state: ReviewState, change: Partial<ReviewItem>): readonly ReviewItem[] {
  return state.items.map((item, i) => (i === state.position ? { ...item, ...change } : item));
}

function submit(state: ReviewState): ReviewState {
  if (isAnswerEmpty(state.input)) return state;
  const item = state.items[state.position];
  const attempts = item.attempts + 1;
  if (answerValue(state.input, state.direction) === item.expected) {
    return { ...state, status: 'correct', items: updateCurrent(state, { attempts }) };
  }
  return {
    ...state,
    input: emptyAnswer(),
    items: updateCurrent(state, { attempts, wrongTries: item.wrongTries + 1 }),
    wrongCount: state.wrongCount + 1,
  };
}

function next(state: ReviewState): ReviewState {
  const position = state.position + 1;
  const done = position >= state.items.length;
  return { ...state, status: done ? 'done' : 'answering', position, input: emptyAnswer() };
}

export function reviewReducer(state: ReviewState, event: ReviewEvent): ReviewState {
  if (state.status === 'done') return state;
  if (event.type === 'next') {
    return state.status === 'answering' ? state : next(state);
  }
  if (state.status !== 'answering') return state;
  switch (event.type) {
    case 'digit':
      return { ...state, input: typeDigit(state.input, event.digit, state.maxDigits) };
    case 'backspace':
      return { ...state, input: backspace(state.input) };
    case 'submit':
      return submit(state);
    case 'reveal':
      if (!canReveal(state)) return state;
      return { ...state, status: 'revealed', items: updateCurrent(state, { revealed: true }) };
  }
}

/** Tentativas por conta corrigida, para gravar no histórico (`reviewAttempts`). */
export function reviewAttempts(state: ReviewState): { roundIndex: number; attempts: number }[] {
  return state.items
    .filter((item) => item.attempts > 0)
    .map(({ roundIndex, attempts }) => ({ roundIndex, attempts }));
}

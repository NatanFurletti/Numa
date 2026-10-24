import {
  canReveal,
  createReview,
  currentReviewItem,
  reviewAttempts,
  reviewReducer,
  type ReviewEvent,
  type ReviewState,
} from './review';
import type { ProblemAttempt } from './types';

function attempt(a: number, b: number, answer: number): ProblemAttempt {
  const expected = a + b;
  return {
    a,
    b,
    op: 'add',
    expected,
    answer,
    correct: answer === expected,
    timeMs: 1000,
    keystrokes: 2,
  };
}

// Erradas: índices 1 (5+4=9) e 3 (24+73=97).
const problems = [attempt(2, 3, 5), attempt(5, 4, 8), attempt(1, 1, 2), attempt(24, 73, 79)];

const digits = (...ds: number[]): ReviewEvent[] => ds.map((digit) => ({ type: 'digit', digit }));
const submit: ReviewEvent = { type: 'submit' };

function play(state: ReviewState, events: ReviewEvent[]): ReviewState {
  return events.reduce(reviewReducer, state);
}

function newReview() {
  return createReview({ problems, direction: 'ltr' });
}

describe('createReview', () => {
  it('mostra só as contas erradas, na ordem da rodada', () => {
    const state = newReview();

    expect(state.items.map((item) => item.roundIndex)).toEqual([1, 3]);
    expect(currentReviewItem(state)?.problem).toEqual({ a: 5, b: 4, op: 'add' });
    expect(state.status).toBe('answering');
  });

  it('sem contas erradas, a correção já começa concluída', () => {
    const state = createReview({ problems: [attempt(2, 3, 5)], direction: 'ltr' });

    expect(state.status).toBe('done');
    expect(currentReviewItem(state)).toBeNull();
  });

  it('conta não respondida (answer null) também entra na correção', () => {
    const skipped: ProblemAttempt = { ...attempt(2, 3, 5), answer: null, correct: false };

    expect(createReview({ problems: [skipped], direction: 'ltr' }).items).toHaveLength(1);
  });
});

describe('responder', () => {
  it('acertou: marca como certa e espera o "next" para avançar', () => {
    const state = play(newReview(), [...digits(9), submit]);

    expect(state.status).toBe('correct');
    expect(state.position).toBe(0);

    const next = reviewReducer(state, { type: 'next' });

    expect(next.status).toBe('answering');
    expect(currentReviewItem(next)?.roundIndex).toBe(3);
    expect(next.input.typed).toEqual([]);
  });

  it('errou: conta o erro, limpa a resposta e continua na mesma conta', () => {
    const state = play(newReview(), [...digits(8), submit]);

    expect(state.status).toBe('answering');
    expect(state.position).toBe(0);
    expect(currentReviewItem(state)?.wrongTries).toBe(1);
    expect(state.input.typed).toEqual([]);
  });

  it('cada erro muda o wrongCount (para a tela tremer de novo)', () => {
    const once = play(newReview(), [...digits(8), submit]);
    const twice = play(once, [...digits(7), submit]);

    expect(twice.wrongCount).toBe(once.wrongCount + 1);
  });

  it('respeita a direção da digitação (rtl: 7, 9 → 97)', () => {
    const state = createReview({ problems: [problems[3]], direction: 'rtl' });

    expect(play(state, [...digits(7, 9), submit]).status).toBe('correct');
  });

  it('apagar remove o último dígito digitado', () => {
    const state = play(newReview(), [...digits(8), { type: 'backspace' }, ...digits(9), submit]);

    expect(state.status).toBe('correct');
  });

  it('confirmar vazio não faz nada', () => {
    const state = play(newReview(), [submit]);

    expect(currentReviewItem(state)?.wrongTries).toBe(0);
  });

  it('respeita o limite de dígitos', () => {
    const state = createReview({ problems, direction: 'ltr', maxDigits: 2 });

    expect(play(state, digits(1, 2, 3)).input.typed).toEqual([1, 2]);
  });

  it('ignora teclas enquanto mostra o ✓', () => {
    const state = play(newReview(), [...digits(9), submit, ...digits(1), submit]);

    expect(state.status).toBe('correct');
    expect(state.input.typed).toEqual([9]); // a resposta certa continua na tela, com o ✓
  });
});

describe('ver resposta', () => {
  it('só aparece depois de 2 tentativas erradas na mesma conta', () => {
    const one = play(newReview(), [...digits(1), submit]);
    const two = play(one, [...digits(2), submit]);

    expect(canReveal(newReview())).toBe(false);
    expect(canReveal(one)).toBe(false);
    expect(canReveal(two)).toBe(true);
  });

  it('antes das 2 tentativas, "reveal" não faz nada', () => {
    expect(reviewReducer(newReview(), { type: 'reveal' }).status).toBe('answering');
  });

  it('mostra a resposta e espera o "next"', () => {
    const state = play(newReview(), [
      ...digits(1),
      submit,
      ...digits(2),
      submit,
      { type: 'reveal' },
    ]);

    expect(state.status).toBe('revealed');
    expect(currentReviewItem(state)?.revealed).toBe(true);

    expect(reviewReducer(state, { type: 'next' }).position).toBe(1);
  });

  it('"next" enquanto responde não pula a conta', () => {
    expect(reviewReducer(newReview(), { type: 'next' }).position).toBe(0);
  });
});

describe('fim', () => {
  it('depois da última conta, a correção termina', () => {
    const state = play(newReview(), [
      ...digits(9),
      submit,
      { type: 'next' },
      ...digits(9, 7),
      submit,
      { type: 'next' },
    ]);

    expect(state.status).toBe('done');
    expect(currentReviewItem(state)).toBeNull();
  });

  it('terminada, ignora qualquer evento', () => {
    const done = createReview({ problems: [attempt(2, 3, 5)], direction: 'ltr' });

    expect(play(done, [...digits(1), submit, { type: 'reveal' }, { type: 'next' }])).toBe(done);
  });
});

describe('reviewAttempts', () => {
  it('conta as tentativas de cada conta corrigida (inclui a certa)', () => {
    const state = play(newReview(), [
      ...digits(8),
      submit,
      ...digits(9),
      submit,
      { type: 'next' },
      ...digits(9, 7),
      submit,
    ]);

    expect(reviewAttempts(state)).toEqual([
      { roundIndex: 1, attempts: 2 },
      { roundIndex: 3, attempts: 1 },
    ]);
  });

  it('não inclui contas ainda não tentadas', () => {
    expect(reviewAttempts(newReview())).toEqual([]);
  });
});

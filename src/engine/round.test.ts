import { displayAnswer } from './answer-input';
import {
  createRound,
  currentProblem,
  isTimeUp,
  overtimeMs,
  roundReducer,
  type RoundEvent,
  type RoundState,
  roundSummary,
  timeRemainingRatio,
  visibleProblems,
} from './round';
import type { Problem } from './types';

const problems: Problem[] = [
  { a: 2, b: 3, op: 'add' }, // 5
  { a: 9, b: 4, op: 'sub' }, // 5
  { a: 24, b: 73, op: 'add' }, // 97
];

const T0 = 1_000_000;

function play(state: RoundState, events: RoundEvent[]): RoundState {
  return events.reduce(roundReducer, state);
}

const digits = (...ds: number[]): RoundEvent[] => ds.map((digit) => ({ type: 'digit', digit }));

function newRound(overrides: Partial<Parameters<typeof createRound>[0]> = {}) {
  return createRound({ problems, timeLimitMs: 10_000, direction: 'ltr', ...overrides });
}

function started(overrides: Partial<Parameters<typeof createRound>[0]> = {}) {
  return roundReducer(newRound(overrides), { type: 'start', at: T0 });
}

describe('início', () => {
  it('a rodada começa pronta, na primeira conta, sem resposta', () => {
    const state = newRound();

    expect(state.status).toBe('ready');
    expect(currentProblem(state)).toEqual(problems[0]);
    expect(displayAnswer(state.input, 'ltr')).toBe('');
  });

  it('ignora teclas antes de começar (durante a contagem 3, 2, 1)', () => {
    const state = play(newRound(), [...digits(5), { type: 'submit', at: T0 }]);

    expect(state.status).toBe('ready');
    expect(state.results).toHaveLength(0);
  });

  it('o cronômetro começa quando a primeira conta aparece', () => {
    const state = started();

    expect(state.status).toBe('running');
    expect(state.startedAt).toBe(T0);
  });

  it('começar de novo não reinicia o cronômetro', () => {
    const state = roundReducer(started(), { type: 'start', at: T0 + 5000 });

    expect(state.startedAt).toBe(T0);
  });
});

describe('digitação e confirmação', () => {
  it('mostra os dígitos digitados', () => {
    const state = play(started(), digits(1, 2));

    expect(displayAnswer(state.input, 'ltr')).toBe('12');
  });

  it('confirmar com o campo vazio não faz nada', () => {
    const state = roundReducer(started(), { type: 'submit', at: T0 + 1000 });

    expect(state.currentIndex).toBe(0);
    expect(state.results).toHaveLength(0);
  });

  it('confirmar registra a resposta, sem revelar nada na tela, e passa para a próxima conta', () => {
    const state = play(started(), [...digits(6), { type: 'submit', at: T0 + 1500 }]);

    expect(state.currentIndex).toBe(1);
    expect(currentProblem(state)).toEqual(problems[1]);
    expect(displayAnswer(state.input, 'ltr')).toBe('');
    expect(state.results[0]).toMatchObject({
      answer: 6,
      expected: 5,
      correct: false,
      timeMs: 1500,
    });
  });

  it('mede o tempo de cada conta desde que ela virou a atual', () => {
    const state = play(started(), [
      ...digits(5),
      { type: 'submit', at: T0 + 2000 },
      ...digits(5),
      { type: 'submit', at: T0 + 2700 },
    ]);

    expect(state.results.map((r) => r.timeMs)).toEqual([2000, 700]);
  });

  it('apagar remove o último dígito', () => {
    const state = play(started(), [...digits(4, 7), { type: 'backspace' }]);

    expect(displayAnswer(state.input, 'ltr')).toBe('4');
  });

  it('conta as teclas de cada conta, incluindo apagar', () => {
    const state = play(started(), [
      ...digits(4),
      { type: 'backspace' },
      ...digits(5),
      { type: 'submit', at: T0 + 1000 },
    ]);

    expect(state.results[0].keystrokes).toBe(3);
  });

  it('na direção direita → esquerda, 7 e depois 9 vira 97', () => {
    const state = play(started({ direction: 'rtl' }), [
      ...digits(5),
      { type: 'submit', at: T0 + 1 },
      ...digits(5),
      { type: 'submit', at: T0 + 2 },
      ...digits(7, 9),
      { type: 'submit', at: T0 + 3 },
    ]);

    expect(state.results[2]).toMatchObject({ answer: 97, correct: true });
  });

  it('compara pelo valor numérico: 05 vale 5', () => {
    const state = play(started(), [...digits(0, 5), { type: 'submit', at: T0 + 1 }]);

    expect(state.results[0]).toMatchObject({ answer: 5, correct: true });
  });

  it('respeita o limite de dígitos', () => {
    const state = play(started({ maxDigits: 2 }), digits(1, 2, 3));

    expect(displayAnswer(state.input, 'ltr')).toBe('12');
  });
});

describe('fim da rodada', () => {
  const finished = () =>
    play(started(), [
      ...digits(5),
      { type: 'submit', at: T0 + 1000 },
      ...digits(5),
      { type: 'submit', at: T0 + 2000 },
      ...digits(9, 7),
      { type: 'submit', at: T0 + 4500 },
    ]);

  it('termina ao confirmar a última conta', () => {
    const state = finished();

    expect(state.status).toBe('finished');
    expect(state.finishedAt).toBe(T0 + 4500);
  });

  it('ignora qualquer tecla depois do fim', () => {
    const state = play(finished(), [...digits(1), { type: 'submit', at: T0 + 9000 }]);

    expect(state.results).toHaveLength(3);
    expect(state.finishedAt).toBe(T0 + 4500);
  });

  it('o resumo traz acertos, tempo total e cada conta', () => {
    const summary = roundSummary(finished());

    expect(summary).toMatchObject({ correct: 3, total: 3, elapsedMs: 4500, overtimeMs: 0 });
    expect(summary.problems[2]).toEqual({
      a: 24,
      b: 73,
      op: 'add',
      expected: 97,
      answer: 97,
      correct: true,
      timeMs: 2500,
      keystrokes: 2,
    });
  });
});

describe('tempo', () => {
  it('a barra começa cheia e esvazia com o tempo', () => {
    const state = started();

    expect(timeRemainingRatio(state, T0)).toBe(1);
    expect(timeRemainingRatio(state, T0 + 5000)).toBe(0.5);
    expect(timeRemainingRatio(state, T0 + 20_000)).toBe(0);
  });

  it('o tempo esgota depois do limite', () => {
    const state = started();

    expect(isTimeUp(state, T0 + 10_000)).toBe(false);
    expect(isTimeUp(state, T0 + 10_001)).toBe(true);
  });

  it('com o tempo esgotado, a rodada continua normalmente', () => {
    const state = play(started(), [...digits(5), { type: 'submit', at: T0 + 15_000 }]);

    expect(state.status).toBe('running');
    expect(state.currentIndex).toBe(1);
  });

  it('registra o tempo excedente no resumo', () => {
    const state = play(started(), [
      ...digits(5),
      { type: 'submit', at: T0 + 1000 },
      ...digits(5),
      { type: 'submit', at: T0 + 2000 },
      ...digits(1),
      { type: 'submit', at: T0 + 18_000 },
    ]);

    expect(overtimeMs(state, T0 + 99_999)).toBe(8000);
    expect(roundSummary(state)).toMatchObject({ elapsedMs: 18_000, overtimeMs: 8000, correct: 2 });
  });

  it('sem tempo-limite (treino livre), nunca esgota e não tem barra', () => {
    const state = started({ timeLimitMs: null });

    expect(isTimeUp(state, T0 + 999_999)).toBe(false);
    expect(timeRemainingRatio(state, T0 + 1000)).toBeNull();
    expect(overtimeMs(state, T0 + 999_999)).toBe(0);
  });

  it('antes de começar, a barra está cheia e o tempo não esgota', () => {
    const state = newRound();

    expect(timeRemainingRatio(state, T0)).toBe(1);
    expect(isTimeUp(state, T0 + 999_999)).toBe(false);
  });
});

describe('fila de contas', () => {
  it('mostra a conta atual e as 2 próximas', () => {
    const many: Problem[] = Array.from({ length: 5 }, (_, i) => ({ a: i + 1, b: 1, op: 'add' }));
    const state = started({ problems: many });

    expect(visibleProblems(state)).toEqual(many.slice(0, 3));
  });

  it('perto do fim, mostra só as que restam', () => {
    const state = play(started(), [
      ...digits(5),
      { type: 'submit', at: T0 + 1 },
      ...digits(5),
      { type: 'submit', at: T0 + 2 },
    ]);

    expect(visibleProblems(state)).toEqual([problems[2]]);
  });

  it('depois do fim, a fila fica vazia', () => {
    const state = play(started({ problems: [problems[0]] }), [
      ...digits(5),
      { type: 'submit', at: T0 + 1 },
    ]);

    expect(visibleProblems(state)).toEqual([]);
    expect(currentProblem(state)).toBeNull();
  });
});

describe('abandono', () => {
  it('sair no meio marca a rodada como abandonada', () => {
    const state = play(started(), [
      ...digits(5),
      { type: 'submit', at: T0 + 1000 },
      ...digits(3),
      { type: 'abandon', at: T0 + 3000 },
    ]);

    expect(state.status).toBe('abandoned');
    expect(state.finishedAt).toBe(T0 + 3000);
  });

  it('no resumo, as contas não respondidas ficam sem resposta', () => {
    const state = play(started(), [
      ...digits(5),
      { type: 'submit', at: T0 + 1000 },
      ...digits(3),
      { type: 'abandon', at: T0 + 3000 },
    ]);

    const summary = roundSummary(state);

    expect(summary).toMatchObject({ correct: 1, total: 3, elapsedMs: 3000 });
    expect(summary.problems.map((p) => p.answer)).toEqual([5, null, null]);
    expect(summary.problems[1]).toMatchObject({ correct: false, timeMs: 2000, keystrokes: 1 });
    expect(summary.problems[2]).toMatchObject({ timeMs: 0, keystrokes: 0 });
  });

  it('dá para sair durante a contagem, antes da primeira conta', () => {
    const state = roundReducer(newRound(), { type: 'abandon', at: T0 });

    expect(state.status).toBe('abandoned');
    expect(roundSummary(state)).toMatchObject({ correct: 0, total: 3, elapsedMs: 0 });
  });

  it('não dá para abandonar uma rodada já terminada', () => {
    const done = play(started({ problems: [problems[0]] }), [
      ...digits(5),
      { type: 'submit', at: T0 + 1 },
    ]);

    expect(roundReducer(done, { type: 'abandon', at: T0 + 2 }).status).toBe('finished');
  });
});

it('o reducer não altera o estado anterior', () => {
  const before = started();
  const snapshot = JSON.stringify(before);

  play(before, [...digits(5), { type: 'submit', at: T0 + 1 }, { type: 'abandon', at: T0 + 2 }]);

  expect(JSON.stringify(before)).toBe(snapshot);
});

import { act, renderHook } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import { setupRound } from '@/engine/round-setup';
import type { PlayMode } from '@/engine/round-setup';

import { useRound } from './useRound';

const T0 = 1_700_000_000_000;
const SEED = 42;

beforeEach(() => jest.useFakeTimers({ now: T0 }));
afterEach(() => jest.useRealTimers());

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

async function renderRound(stageId = 'L01-A', mode: PlayMode = 'challenge') {
  const hook = await renderHook(() => useRound({ stageId, mode, seed: SEED, direction: 'ltr' }));
  const problems = setupRound({ stageId, mode, seed: SEED }).problems;
  return { ...hook, problems };
}

async function typeNumber(result: { current: ReturnType<typeof useRound> }, n: number) {
  for (const d of String(n)) {
    await act(() => result.current.pressDigit(Number(d)));
  }
}

/** Passa pela contagem 3, 2, 1 (um segundo por vez, como na tela). */
async function finishCountdown() {
  for (let i = 0; i < 3; i++) await advance(1000);
}

async function startPlaying() {
  const hook = await renderRound();
  await finishCountdown();
  return hook;
}

describe('contagem regressiva', () => {
  it('começa em 3 e desce a cada segundo, sem contas na tela', async () => {
    const { result } = await renderRound();

    expect(result.current.phase).toBe('countdown');
    expect(result.current.countdown).toBe(3);

    await advance(1000);
    expect(result.current.countdown).toBe(2);

    await advance(1000);
    expect(result.current.countdown).toBe(1);
  });

  it('depois do 1, mostra a conta atual e as 2 próximas', async () => {
    const { result, problems } = await startPlaying();

    expect(result.current.phase).toBe('playing');
    expect(result.current.countdown).toBeNull();
    expect(result.current.visible).toEqual(problems.slice(0, 3));
  });

  it('a contagem não conta no tempo da rodada', async () => {
    const { result } = await startPlaying();

    expect(result.current.timeRatio).toBe(1);
  });
});

describe('digitação', () => {
  it('mostra a resposta digitada e libera o confirmar', async () => {
    const { result } = await startPlaying();
    expect(result.current.canSubmit).toBe(false);

    await typeNumber(result, 12);

    expect(result.current.answerText).toBe('12');
    expect(result.current.canSubmit).toBe(true);
  });

  it('apagar remove o último dígito', async () => {
    const { result } = await startPlaying();

    await typeNumber(result, 12);
    await act(() => result.current.pressBackspace());

    expect(result.current.answerText).toBe('1');
  });

  it('confirmar com o campo vazio não faz nada', async () => {
    const { result, problems } = await startPlaying();

    await act(() => result.current.submit());

    expect(result.current.visible[0]).toEqual(problems[0]);
  });
});

describe('rodada completa', () => {
  it('confirmar passa para a próxima conta; depois da 10ª, a rodada termina com o resumo', async () => {
    const { result, problems } = await startPlaying();

    for (const problem of problems) {
      await advance(500);
      await typeNumber(result, solve(problem));
      await act(() => result.current.submit());
    }

    expect(result.current.phase).toBe('finished');
    expect(result.current.summary).toMatchObject({ correct: 10, total: 10, elapsedMs: 5000 });
  });
});

describe('tempo', () => {
  it('a barra esvazia com o tempo (L01-A tem 60s)', async () => {
    const { result } = await startPlaying();

    await advance(30_000);

    expect(result.current.timeRatio).toBeCloseTo(0.5, 1);
    expect(result.current.timeUp).toBe(false);
  });

  it('com o tempo esgotado, avisa e a rodada continua', async () => {
    const { result } = await startPlaying();

    await advance(61_000);

    expect(result.current.timeUp).toBe(true);
    expect(result.current.phase).toBe('playing');
  });

  it('treino livre não tem barra de tempo', async () => {
    const { result } = await renderRound('L01-A', 'practice');
    await finishCountdown();

    expect(result.current.timeRatio).toBeNull();
    expect(result.current.timeLimitMs).toBeNull();
  });

  it('aquecimento na L01-A tem 50% a mais de tempo', async () => {
    const { result } = await renderRound('L01-A', 'warmup');

    expect(result.current.timeLimitMs).toBe(90_000);
  });
});

describe('sair', () => {
  it('sair no meio abandona a rodada', async () => {
    const { result } = await startPlaying();

    await act(() => result.current.abandon());

    expect(result.current.phase).toBe('abandoned');
    expect(result.current.summary).toMatchObject({ correct: 0, total: 10 });
  });

  it('sair durante a contagem interrompe a contagem', async () => {
    const { result } = await renderRound();

    await act(() => result.current.abandon());
    await advance(5000);

    expect(result.current.phase).toBe('abandoned');
    expect(result.current.visible).toEqual([]);
  });
});

describe('aviso de fim (onEnd)', () => {
  async function renderWithOnEnd() {
    const onEnd = jest.fn();
    const hook = await renderHook(() =>
      useRound({ stageId: 'L01-A', mode: 'challenge', seed: SEED, direction: 'ltr', onEnd }),
    );
    const problems = setupRound({ stageId: 'L01-A', mode: 'challenge', seed: SEED }).problems;
    return { ...hook, problems, onEnd };
  }

  it('avisa uma vez ao concluir, com o resumo e o horário de início', async () => {
    const { result, problems, onEnd } = await renderWithOnEnd();
    await finishCountdown();

    for (const problem of problems) {
      await typeNumber(result, solve(problem));
      await act(() => result.current.submit());
    }
    await advance(1000);

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        startedAt: T0 + 3000,
        summary: expect.objectContaining({ correct: 10, total: 10 }),
      }),
    );
  });

  it('avisa ao abandonar no meio', async () => {
    const { result, onEnd } = await renderWithOnEnd();
    await finishCountdown();

    await act(() => result.current.abandon());

    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ status: 'abandoned' }));
  });

  it('abandonar durante a contagem avisa sem horário de início', async () => {
    const { result, onEnd } = await renderWithOnEnd();

    await act(() => result.current.abandon());

    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'abandoned', startedAt: null }),
    );
  });
});

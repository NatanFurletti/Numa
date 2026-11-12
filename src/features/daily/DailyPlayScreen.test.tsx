import { act, render, screen, userEvent } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import { setupDailyTest } from '@/engine/daily';
import { formatProblem } from '@/features/round/ProblemQueue';
import { useDaily } from '@/store/daily';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

import { DailyPlayScreen } from './DailyPlayScreen';

const NOW = new Date(2026, 10, 11, 12).getTime(); // 11/11/2026, horário local
const DAY = '2026-11-11';
const PROBLEMS = setupDailyTest(DAY).problems;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  useDaily.setState(useDaily.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
  useSettings.setState(useSettings.getInitialState(), true);
});
afterEach(() => jest.useRealTimers());

async function finishCountdown() {
  for (let i = 0; i < 3; i++) {
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

async function renderPlay() {
  const onDone = jest.fn();
  const onExit = jest.fn();
  await render(<DailyPlayScreen onDone={onDone} onExit={onExit} />);
  return { onDone, onExit, user: userEvent.setup() };
}

async function answer(user: ReturnType<typeof userEvent.setup>, value: number) {
  for (const d of String(value)) {
    await user.press(screen.getByRole('button', { name: d }));
  }
  await user.press(screen.getByRole('button', { name: 'Confirmar' }));
}

describe('DailyPlayScreen', () => {
  it('mostra as contas do dia, com o rótulo e sem barra de tempo', async () => {
    await renderPlay();
    await finishCountdown();

    expect(screen.getByText('Teste do dia')).toBeOnTheScreen();
    expect(screen.getByText(formatProblem(PROBLEMS[0]))).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });

  it('quando as contas aparecem, a tentativa do dia está usada', async () => {
    await renderPlay();
    expect(useDaily.getState().attempts[DAY]).toBeUndefined();

    await finishCountdown();

    expect(useDaily.getState().attempts[DAY]).toEqual({ status: 'started' });
  });

  it('ao terminar, grava o resultado, conta o dia na sequência e avisa', async () => {
    const { onDone, user } = await renderPlay();
    await finishCountdown();

    await answer(user, solve(PROBLEMS[0]) + 1);
    for (const problem of PROBLEMS.slice(1)) await answer(user, solve(problem));

    expect(useDaily.getState().attempts[DAY]).toMatchObject({
      status: 'done',
      correct: 9,
      total: 10,
      submitted: false,
    });
    expect(useProgress.getState().streak).toMatchObject({ current: 1, lastPlayedDate: DAY });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('o teste do dia não entra no histórico de rodadas nem mexe nas etapas', async () => {
    const { stages } = useProgress.getState();
    const { user } = await renderPlay();
    await finishCountdown();

    for (const problem of PROBLEMS) await answer(user, solve(problem));

    expect(useHistory.getState().rounds).toEqual([]);
    expect(useProgress.getState().stages).toBe(stages);
  });

  it('sair no meio encerra a tentativa com o que foi respondido, sem contar o dia', async () => {
    const { onDone, user } = await renderPlay();
    await finishCountdown();
    await answer(user, solve(PROBLEMS[0]));

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    expect(screen.getByText('Sair do teste do dia?')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Sair do teste' }));

    expect(useDaily.getState().attempts[DAY]).toMatchObject({ status: 'done', correct: 1 });
    expect(useProgress.getState().streak.current).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sair durante a contagem não usa a tentativa', async () => {
    const { onDone, onExit, user } = await renderPlay();

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    await user.press(screen.getByRole('button', { name: 'Sair do teste' }));

    expect(useDaily.getState().attempts[DAY]).toBeUndefined();
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('quem já fez o teste de hoje não joga de novo', async () => {
    useDaily.getState().startAttempt(DAY);
    const { onDone, user } = await renderPlay();

    expect(screen.getByText('Você já fez o teste de hoje.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Ver o resultado' }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

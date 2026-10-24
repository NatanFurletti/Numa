import { render, screen, userEvent } from '@testing-library/react-native';

import { useProgress } from '@/store/progress';

import { HomeScreen } from './HomeScreen';

const TODAY = new Date(2026, 9, 23, 12).getTime(); // 23/10/2026, horário local

beforeEach(() => {
  jest.useFakeTimers({ now: TODAY });
  useProgress.setState(useProgress.getInitialState(), true);
});
afterEach(() => jest.useRealTimers());

function setStage(stageId: string, change: { unlocked?: boolean; attempts?: number }) {
  useProgress.setState((s) => ({
    stages: { ...s.stages, [stageId]: { ...s.stages[stageId], ...change } },
  }));
}

async function renderHome() {
  const onContinue = jest.fn();
  const onLevels = jest.fn();
  await render(<HomeScreen onContinue={onContinue} onLevels={onLevels} />);
  return {
    onContinue,
    onLevels,
    user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime }),
  };
}

describe('HomeScreen', () => {
  it('mostra o nome do app', async () => {
    await renderHome();

    expect(screen.getByText('Numa')).toBeOnTheScreen();
  });

  it('sem nada jogado: "Começar" na L01-A', async () => {
    const { onContinue, user } = await renderHome();

    await user.press(screen.getByRole('button', { name: 'Começar — Nível 1 · Etapa A' }));

    expect(onContinue).toHaveBeenCalledWith('L01-A');
  });

  it('"Continuar" leva à etapa desbloqueada mais avançada', async () => {
    setStage('L01-A', { attempts: 2 });
    setStage('L01-B', { unlocked: true });
    setStage('L01-C', { unlocked: true });
    const { onContinue, user } = await renderHome();

    await user.press(screen.getByRole('button', { name: 'Continuar — Nível 1 · Etapa C' }));

    expect(onContinue).toHaveBeenCalledWith('L01-C');
  });

  it('o botão "Níveis" abre a lista de níveis', async () => {
    const { onLevels, user } = await renderHome();

    await user.press(screen.getByRole('button', { name: 'Níveis' }));

    expect(onLevels).toHaveBeenCalledTimes(1);
  });

  it('mostra a sequência de dias (jogou ontem)', async () => {
    useProgress.setState({ streak: { current: 5, best: 7, lastPlayedDate: '2026-10-22' } });
    await renderHome();

    expect(screen.getByText('🔥 5 dias')).toBeOnTheScreen();
  });

  it('um dia só, no singular', async () => {
    useProgress.setState({ streak: { current: 1, best: 1, lastPlayedDate: '2026-10-23' } });
    await renderHome();

    expect(screen.getByText('🔥 1 dia')).toBeOnTheScreen();
  });

  it('sequência perdida (não jogou ontem nem hoje): não mostra', async () => {
    useProgress.setState({ streak: { current: 5, best: 7, lastPlayedDate: '2026-10-20' } });
    await renderHome();

    expect(screen.queryByText(/🔥/)).not.toBeOnTheScreen();
  });
});

import { render, screen, userEvent } from '@testing-library/react-native';

import i18n from '@/i18n';
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
  const onPractice = jest.fn();
  const onSettings = jest.fn();
  await render(
    <HomeScreen
      onContinue={onContinue}
      onLevels={onLevels}
      onPractice={onPractice}
      onSettings={onSettings}
    />,
  );
  return {
    onContinue,
    onLevels,
    onPractice,
    onSettings,
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

  it('atalhos: "Níveis", "Treino livre" e "Configurações"', async () => {
    const { onLevels, onPractice, onSettings, user } = await renderHome();

    await user.press(screen.getByRole('button', { name: 'Níveis' }));
    await user.press(screen.getByRole('button', { name: 'Treino livre' }));
    await user.press(screen.getByRole('button', { name: '⚙️ Configurações' }));

    expect(onLevels).toHaveBeenCalledTimes(1);
    expect(onPractice).toHaveBeenCalledTimes(1);
    expect(onSettings).toHaveBeenCalledTimes(1);
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

describe('HomeScreen em inglês', () => {
  afterEach(() => i18n.changeLanguage('pt'));

  it('mostra os textos em inglês, com o plural certo', async () => {
    await i18n.changeLanguage('en');
    useProgress.setState({ streak: { current: 2, best: 2, lastPlayedDate: '2026-10-23' } });
    await renderHome();

    expect(screen.getByText('Train your mind a few minutes a day.')).toBeOnTheScreen();
    expect(screen.getByText('🔥 2 days')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Start — Level 1 · Stage A' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '⚙️ Settings' })).toBeOnTheScreen();
  });
});

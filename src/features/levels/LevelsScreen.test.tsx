import { render, screen, userEvent } from '@testing-library/react-native';

import { useProgress } from '@/store/progress';

import { LevelsScreen } from './LevelsScreen';

beforeEach(() => useProgress.setState(useProgress.getInitialState(), true));

function setStage(stageId: string, change: { unlocked?: boolean; bestStars?: 0 | 1 | 2 | 3 }) {
  useProgress.setState((s) => ({
    stages: { ...s.stages, [stageId]: { ...s.stages[stageId], ...change } },
  }));
}

async function renderLevels() {
  const onPlay = jest.fn();
  const onBack = jest.fn();
  await render(<LevelsScreen onPlay={onPlay} onBack={onBack} />);
  return { onPlay, onBack, user: userEvent.setup() };
}

describe('LevelsScreen', () => {
  it('lista os 41 níveis com o nome curto', async () => {
    await renderLevels();

    expect(screen.getByText('Nível 1')).toBeOnTheScreen();
    expect(screen.getByText('Soma até 10')).toBeOnTheScreen();
    expect(screen.getByText('Nível 41')).toBeOnTheScreen();
    expect(screen.getByText('Misto 3 e 3 dígitos')).toBeOnTheScreen();
    expect(screen.getByText('Soma 2+1 sem vai um (armada)')).toBeOnTheScreen();
  });

  it('cada etapa desbloqueada mostra a melhor nota em estrelas', async () => {
    setStage('L01-A', { bestStars: 2 });
    setStage('L01-B', { unlocked: true });
    await renderLevels();

    expect(
      screen.getByRole('button', { name: 'Nível 1, etapa A, 2 de 3 estrelas' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Nível 1, etapa B, 0 de 3 estrelas' }),
    ).toBeOnTheScreen();
  });

  it('etapas bloqueadas aparecem com cadeado e não abrem', async () => {
    const { onPlay, user } = await renderLevels();

    const locked = screen.getByRole('button', { name: 'Nível 1, etapa C, bloqueada' });
    expect(locked).toBeDisabled();

    await user.press(locked);

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('tocar numa etapa desbloqueada inicia a rodada', async () => {
    const { onPlay, user } = await renderLevels();

    await user.press(screen.getByRole('button', { name: 'Nível 1, etapa A, 0 de 3 estrelas' }));

    expect(onPlay).toHaveBeenCalledWith('L01-A');
  });

  it('o botão de voltar leva ao início', async () => {
    const { onBack, user } = await renderLevels();

    await user.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('LevelsScreen no treino livre', () => {
  async function renderPractice() {
    const onPlay = jest.fn();
    await render(<LevelsScreen variant="practice" onPlay={onPlay} onBack={jest.fn()} />);
    return { onPlay, user: userEvent.setup() };
  }

  it('mostra só as etapas desbloqueadas, sem estrelas', async () => {
    setStage('L01-A', { bestStars: 3 });
    setStage('L01-B', { unlocked: true });
    await renderPractice();

    expect(screen.getByText('Treino livre')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Nível 1, etapa A' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Nível 1, etapa B' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /etapa C/ })).not.toBeOnTheScreen();
    expect(screen.queryByText(/★/)).not.toBeOnTheScreen();
  });

  it('esconde os níveis sem nenhuma etapa desbloqueada', async () => {
    await renderPractice();

    expect(screen.getByText('Nível 1')).toBeOnTheScreen();
    expect(screen.queryByText('Nível 2')).not.toBeOnTheScreen();
  });

  it('tocar numa etapa inicia o treino', async () => {
    const { onPlay, user } = await renderPractice();

    await user.press(screen.getByRole('button', { name: 'Nível 1, etapa A' }));

    expect(onPlay).toHaveBeenCalledWith('L01-A');
  });
});

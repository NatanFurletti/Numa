import { render, screen, userEvent, within } from '@testing-library/react-native';

import type { RoundRecord } from '@/engine/round-record';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { buildRecord } from '@/test-utils/rounds';

import { ResultScreen } from './ResultScreen';

beforeEach(() => {
  useHistory.setState(useHistory.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
});

async function renderResult(...rounds: RoundRecord[]) {
  useHistory.setState({ rounds });
  const handlers = { onReview: jest.fn(), onPlay: jest.fn(), onHome: jest.fn() };
  const roundId = rounds.at(-1)?.id ?? 'missing';
  await render(<ResultScreen roundId={roundId} {...handlers} />);
  return { ...handlers, user: userEvent.setup() };
}

describe('ResultScreen', () => {
  it('mostra o placar e o tempo', async () => {
    await renderResult(buildRecord({ correct: 7, elapsedMs: 52_000 }));

    expect(screen.getByText('7/10')).toBeOnTheScreen();
    expect(screen.getByText('52s de 60s')).toBeOnTheScreen();
    expect(screen.getByText('Nível 1 · Etapa A')).toBeOnTheScreen();
  });

  it('com o tempo estourado, mostra quanto passou', async () => {
    await renderResult(buildRecord({ correct: 10, elapsedMs: 68_000 }));

    expect(screen.getByText('68s, passou 8s')).toBeOnTheScreen();
  });

  it('mostra as estrelas e a mensagem', async () => {
    await renderResult(buildRecord({ correct: 10, elapsedMs: 40_000 }));

    expect(screen.getByLabelText('3 de 3 estrelas')).toBeOnTheScreen();
    expect(screen.getByText('Perfeito! Rápido e certeiro. 🔥')).toBeOnTheScreen();
  });

  it('mostra a comparação com a tentativa anterior na mesma etapa', async () => {
    await renderResult(
      buildRecord({ id: 'prev', correct: 6 }),
      buildRecord({ id: 'now', correct: 8, elapsedMs: 50_000 }),
    );

    expect(screen.getByText('2 acertos a mais que da última vez.')).toBeOnTheScreen();
  });

  it('lista as 10 contas: certas com ✓ e erradas com ✗ e a resposta dada', async () => {
    await renderResult(buildRecord({ correct: 9 }));

    const right = screen.getByLabelText('1 + 1 = 2, certa');
    expect(within(right).getByText('✓')).toBeOnTheScreen();

    // A última conta (10 + 1) está errada, com a resposta 12.
    const wrong = screen.getByLabelText('10 + 1 = 11, errada, você respondeu 12');
    expect(within(wrong).getByText('✗')).toBeOnTheScreen();
    expect(within(wrong).getByText('você respondeu 12')).toBeOnTheScreen();
  });

  it('passou: "Corrigir erradas", "Próxima etapa" e "Início"', async () => {
    const { onReview, onPlay, onHome, user } = await renderResult(
      buildRecord({ correct: 9, elapsedMs: 50_000 }),
    );

    await user.press(screen.getByRole('button', { name: 'Corrigir erradas' }));
    await user.press(screen.getByRole('button', { name: 'Próxima etapa' }));
    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith('L01-B', 'challenge');
    expect(onHome).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeOnTheScreen();
  });

  it('sem erradas, não oferece a correção', async () => {
    await renderResult(buildRecord({ correct: 10 }));

    expect(screen.queryByRole('button', { name: 'Corrigir erradas' })).not.toBeOnTheScreen();
  });

  it('não passou: "Tentar de novo" na mesma etapa', async () => {
    const { onPlay, user } = await renderResult(buildRecord({ correct: 5 }));

    await user.press(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(onPlay).toHaveBeenCalledWith('L01-A', 'challenge');
    expect(screen.queryByRole('button', { name: 'Próxima etapa' })).not.toBeOnTheScreen();
  });

  it('depois da 3ª falha seguida: avisa do aquecimento e o botão vira "Fazer aquecimento"', async () => {
    useProgress.setState((s) => ({
      stages: { ...s.stages, 'L01-A': { ...s.stages['L01-A'], pendingWarmup: true } },
    }));
    const { onPlay, user } = await renderResult(buildRecord({ correct: 5 }));

    expect(screen.getByText(/próxima rodada é um aquecimento/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Fazer aquecimento' }));

    expect(onPlay).toHaveBeenCalledWith('L01-A', 'challenge');
  });

  it('última etapa concluída: "Jogar de novo" no lugar de "Próxima etapa"', async () => {
    const { onPlay, user } = await renderResult(buildRecord({ stageId: 'L15-C', correct: 10 }));

    await user.press(screen.getByRole('button', { name: 'Jogar de novo' }));

    expect(onPlay).toHaveBeenCalledWith('L15-C', 'challenge');
  });

  it('aquecimento: sem estrelas nem mensagem; volta para o desafio', async () => {
    const { onPlay, user } = await renderResult(buildRecord({ mode: 'warmup', correct: 10 }));

    expect(screen.getByText('Aquecimento')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/estrelas/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Perfeito! Rápido e certeiro. 🔥')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Voltar ao desafio' }));

    expect(onPlay).toHaveBeenCalledWith('L01-A', 'challenge');
  });

  it('treino livre: só acertos e tempo; "Treinar de novo"', async () => {
    const { onPlay, user } = await renderResult(
      buildRecord({ mode: 'practice', correct: 8, elapsedMs: 41_000 }),
    );

    expect(screen.getByText('Treino livre')).toBeOnTheScreen();
    expect(screen.getByText('41s')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/estrelas/)).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Treinar de novo' }));

    expect(onPlay).toHaveBeenCalledWith('L01-A', 'practice');
  });

  it('rodada inexistente: aviso e botão de início', async () => {
    const { onHome, user } = await renderResult();

    expect(screen.getByText('Rodada não encontrada.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onHome).toHaveBeenCalledTimes(1);
  });
});

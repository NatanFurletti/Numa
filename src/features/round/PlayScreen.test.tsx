import { act, render, screen, userEvent } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import { setupRound } from '@/engine/round-setup';
import type { PlayMode } from '@/engine/round-setup';

import { PlayScreen } from './PlayScreen';
import { formatProblem } from './ProblemQueue';

const SEED = 7;

beforeEach(() => jest.useFakeTimers({ now: 1_700_000_000_000 }));
afterEach(() => jest.useRealTimers());

async function finishCountdown() {
  for (let i = 0; i < 3; i++) {
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

async function renderPlay(mode: PlayMode = 'challenge', stageId = 'L01-A') {
  const onExit = jest.fn();
  await render(<PlayScreen stageId={stageId} mode={mode} seed={SEED} onExit={onExit} />);
  const problems = setupRound({ stageId, mode, seed: SEED }).problems;
  return { onExit, problems, user: userEvent.setup() };
}

async function answer(user: ReturnType<typeof userEvent.setup>, value: number) {
  for (const d of String(value)) {
    await user.press(screen.getByRole('button', { name: d }));
  }
  await user.press(screen.getByRole('button', { name: 'Confirmar' }));
}

describe('PlayScreen', () => {
  it('mostra a contagem 3, 2, 1 e depois a primeira conta', async () => {
    const { problems } = await renderPlay();

    expect(screen.getByLabelText('Começa em 3')).toBeOnTheScreen();
    expect(screen.queryByText(formatProblem(problems[0]))).not.toBeOnTheScreen();

    await finishCountdown();

    expect(screen.getByText(formatProblem(problems[0]))).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('digitar pelo teclado mostra a resposta; confirmar passa para a próxima conta', async () => {
    const { problems, user } = await renderPlay();
    await finishCountdown();

    await user.press(screen.getByRole('button', { name: '1' }));
    expect(screen.getByTestId('answer')).toHaveTextContent('1▌');

    await user.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByText(formatProblem(problems[1]))).toBeOnTheScreen();
    expect(screen.getByTestId('answer')).toHaveTextContent('▌');
  });

  it('no aquecimento, mostra o rótulo "Aquecimento"', async () => {
    await renderPlay('warmup');

    expect(screen.getByText('Aquecimento')).toBeOnTheScreen();
  });

  it('no treino livre, não tem barra de tempo', async () => {
    await renderPlay('practice');
    await finishCountdown();

    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });

  it('sair pede confirmação; "Continuar jogando" volta para a rodada', async () => {
    const { onExit, problems, user } = await renderPlay();
    await finishCountdown();

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    expect(screen.getByText('Sair da rodada?')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Continuar jogando' }));

    expect(screen.queryByText('Sair da rodada?')).not.toBeOnTheScreen();
    expect(screen.getByText(formatProblem(problems[0]))).toBeOnTheScreen();
    expect(onExit).not.toHaveBeenCalled();
  });

  it('confirmar a saída abandona a rodada e volta', async () => {
    const { onExit, user } = await renderPlay();
    await finishCountdown();

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    await user.press(screen.getByRole('button', { name: 'Sair da rodada' }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('ao terminar as 10 contas, mostra o placar; "Jogar de novo" recomeça com a contagem', async () => {
    const { problems, user } = await renderPlay();
    await finishCountdown();

    for (const problem of problems) await answer(user, solve(problem));

    expect(screen.getByText('Rodada concluída!')).toBeOnTheScreen();
    expect(screen.getByText('10/10')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Jogar de novo' }));

    expect(screen.getByLabelText('Começa em 3')).toBeOnTheScreen();
  });

  it('com o tempo estourado, o placar mostra quanto passou (L01-A: 60s)', async () => {
    const { problems, user } = await renderPlay();
    await finishCountdown();

    for (const problem of problems.slice(0, 9)) await answer(user, solve(problem));
    await act(() => {
      jest.advanceTimersByTime(70_000);
    });
    await answer(user, solve(problems[9]));

    expect(screen.getByText(/^\d+s, passou \d+s$/)).toBeOnTheScreen();
  });

  it('no treino livre, o placar mostra só o tempo', async () => {
    const { problems, user } = await renderPlay('practice');
    await finishCountdown();

    for (const problem of problems) await answer(user, solve(problem));

    expect(screen.getByText(/^\d+s$/)).toBeOnTheScreen();
  });

  it('etapa inexistente mostra um aviso com o botão de voltar', async () => {
    const onExit = jest.fn();
    const user = userEvent.setup();
    await render(<PlayScreen stageId="L99-A" mode="challenge" onExit={onExit} />);

    expect(screen.getByText('Etapa não encontrada.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

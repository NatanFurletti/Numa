import { act, render, screen, userEvent } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import { setupRound } from '@/engine/round-setup';
import type { PlayMode } from '@/engine/round-setup';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

import { PlayScreen } from './PlayScreen';
import { formatProblem } from './ProblemQueue';

const SEED = 7;

beforeEach(() => {
  jest.useFakeTimers({ now: 1_700_000_000_000 });
  useHistory.setState(useHistory.getInitialState(), true);
  useSettings.setState(useSettings.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
});
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
  const onFinished = jest.fn();
  await render(
    <PlayScreen
      stageId={stageId}
      mode={mode}
      seed={SEED}
      onExit={onExit}
      onFinished={onFinished}
    />,
  );
  const problems = setupRound({ stageId, mode, seed: SEED }).problems;
  return { onExit, onFinished, problems, user: userEvent.setup() };
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

  it('confirmar a saída abandona a rodada, grava no histórico e volta', async () => {
    const { onExit, onFinished, user } = await renderPlay();
    await finishCountdown();

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    await user.press(screen.getByRole('button', { name: 'Sair da rodada' }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onFinished).not.toHaveBeenCalled();
    expect(useHistory.getState().rounds).toEqual([
      expect.objectContaining({ status: 'abandoned', stageId: 'L01-A', stars: null }),
    ]);
  });

  it('sair durante a contagem volta sem gravar nada', async () => {
    const { onExit, user } = await renderPlay();

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    await user.press(screen.getByRole('button', { name: 'Sair da rodada' }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(useHistory.getState().rounds).toEqual([]);
  });

  it('ao terminar as 10 contas, grava a rodada e avisa com o id dela', async () => {
    const { problems, onFinished, user } = await renderPlay();
    await finishCountdown();

    for (const problem of problems) await answer(user, solve(problem));

    const [round] = useHistory.getState().rounds;
    expect(round).toMatchObject({
      status: 'completed',
      mode: 'challenge',
      stageId: 'L01-A',
      seed: SEED,
      correct: 10,
      total: 10,
      stars: 3,
      inputDirection: 'ltr',
      startedAt: new Date(1_700_000_003_000).toISOString(),
    });
    expect(onFinished).toHaveBeenCalledWith(round.id);
  });

  it('com o tempo estourado, grava o tempo total (L01-A: 60s)', async () => {
    const { problems, user } = await renderPlay();
    await finishCountdown();

    for (const problem of problems.slice(0, 9)) await answer(user, solve(problem));
    await act(() => {
      jest.advanceTimersByTime(70_000);
    });
    await answer(user, solve(problems[9]));

    const [round] = useHistory.getState().rounds;
    expect(round.elapsedMs).toBeGreaterThan(60_000);
    expect(round.stars).toBe(1);
  });

  it('no treino livre, grava sem tempo-limite e sem estrelas', async () => {
    const { problems, user } = await renderPlay('practice');
    await finishCountdown();

    for (const problem of problems) await answer(user, solve(problem));

    expect(useHistory.getState().rounds[0]).toMatchObject({ timeLimitMs: null, stars: null });
  });

  it('usa a direção de digitação das configurações', async () => {
    useSettings.getState().setInputDirection('rtl');
    const { user } = await renderPlay();
    await finishCountdown();

    await user.press(screen.getByRole('button', { name: '1' }));
    await user.press(screen.getByRole('button', { name: '2' }));

    expect(screen.getByTestId('answer')).toHaveTextContent('▌21');
  });

  it('ao terminar, atualiza o progresso: estrelas, próxima etapa e sequência de dias', async () => {
    const { problems, user } = await renderPlay();
    await finishCountdown();

    for (const problem of problems) await answer(user, solve(problem));

    const { stages, streak } = useProgress.getState();
    expect(stages['L01-A']).toMatchObject({ bestStars: 3, attempts: 1 });
    expect(stages['L01-B'].unlocked).toBe(true);
    expect(streak.current).toBe(1);
  });

  it('desafio com aquecimento pendente vira aquecimento', async () => {
    useProgress.setState((s) => ({
      stages: { ...s.stages, 'L01-A': { ...s.stages['L01-A'], pendingWarmup: true } },
    }));

    await renderPlay('challenge');

    expect(screen.getByText('Aquecimento')).toBeOnTheScreen();
  });

  it('etapa bloqueada mostra um aviso com o botão de voltar', async () => {
    const onExit = jest.fn();
    const user = userEvent.setup();
    await render(
      <PlayScreen stageId="L05-B" mode="challenge" onExit={onExit} onFinished={jest.fn()} />,
    );

    expect(screen.getByText('Esta etapa ainda está bloqueada.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('etapa inexistente mostra um aviso com o botão de voltar', async () => {
    const onExit = jest.fn();
    const user = userEvent.setup();
    await render(
      <PlayScreen stageId="L99-A" mode="challenge" onExit={onExit} onFinished={jest.fn()} />,
    );

    expect(screen.getByText('Etapa não encontrada.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

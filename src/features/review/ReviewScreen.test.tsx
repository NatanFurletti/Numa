import { act, render, screen, userEvent } from '@testing-library/react-native';

import type { RoundRecord } from '@/engine/round-record';
import { useHistory } from '@/store/history';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { ReviewScreen } from './ReviewScreen';

// 8 de 10: erradas são 9 + 1 (respondeu 11) e 10 + 1 (respondeu 12).
const ROUND = buildRecord({ id: 'r1', correct: 8 });

beforeEach(() => {
  jest.useFakeTimers();
  useHistory.setState(useHistory.getInitialState(), true);
  // A dica de direção tem testes próprios; nos outros, já foi vista.
  useSettings.setState({ ...useSettings.getInitialState(), hasSeenDirectionTip: true }, true);
});
afterEach(() => jest.useRealTimers());

async function renderReview(round: RoundRecord | null = ROUND) {
  useHistory.setState({ rounds: round ? [round] : [] });
  const onBack = jest.fn();
  const onHome = jest.fn();
  await render(
    <ReviewScreen
      roundId={round?.id ?? 'missing'}
      onBack={onBack}
      onHome={onHome}
      keyboardTarget={null}
    />,
  );
  return { onBack, onHome, user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime }) };
}

type User = ReturnType<typeof userEvent.setup>;

async function answer(user: User, value: number) {
  for (const d of String(value)) {
    await user.press(screen.getByRole('button', { name: d }));
  }
  await user.press(screen.getByRole('button', { name: 'Confirmar' }));
}

const waitCorrectPause = () =>
  act(() => {
    jest.advanceTimersByTime(1000);
  });

describe('ReviewScreen', () => {
  it('mostra só as erradas, uma por vez, com o indicador "1 de 2"', async () => {
    await renderReview();

    expect(screen.getByText('1 de 2')).toBeOnTheScreen();
    expect(screen.getByText('9 + 1 =')).toBeOnTheScreen();
    expect(screen.getByText('Na rodada você respondeu 11')).toBeOnTheScreen();
  });

  it('acertou: mostra o ✓ e passa para a próxima', async () => {
    const { user } = await renderReview();

    await answer(user, 10);

    expect(screen.getByLabelText('Certa!')).toBeOnTheScreen();

    await waitCorrectPause();

    expect(screen.getByText('2 de 2')).toBeOnTheScreen();
    expect(screen.getByText('10 + 1 =')).toBeOnTheScreen();
  });

  it('errou: pede para tentar de novo, na mesma conta', async () => {
    const { user } = await renderReview();

    await answer(user, 7);

    expect(screen.getByText('Quase! Tente de novo.')).toBeOnTheScreen();
    expect(screen.getByText('1 de 2')).toBeOnTheScreen();
    expect(screen.getByTestId('review-answer')).toHaveTextContent('▌');
  });

  it('"Ver resposta" só aparece depois de 2 erros e mostra a resposta certa', async () => {
    const { user } = await renderReview();

    await answer(user, 7);
    expect(screen.queryByRole('button', { name: 'Ver resposta' })).not.toBeOnTheScreen();

    await answer(user, 8);
    await user.press(screen.getByRole('button', { name: 'Ver resposta' }));

    expect(screen.getByTestId('review-answer')).toHaveTextContent('10');

    await user.press(screen.getByRole('button', { name: 'Próxima' }));

    expect(screen.getByText('2 de 2')).toBeOnTheScreen();
  });

  it('no fim: "Tudo corrigido! 👏", voltar ao resultado ou ao início', async () => {
    const { user, onBack, onHome } = await renderReview();

    await answer(user, 10);
    await waitCorrectPause();
    await answer(user, 11);
    await waitCorrectPause();

    expect(screen.getByText('Tudo corrigido! 👏')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Voltar ao resultado' }));
    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('grava as tentativas da correção no histórico', async () => {
    const { user } = await renderReview();

    await answer(user, 7);
    await answer(user, 10);

    const problems = useHistory.getState().rounds[0].problems;
    expect(problems[8].reviewAttempts).toBe(2);
    expect(problems[9].reviewAttempts).toBeUndefined();
  });

  it('o ✕ volta para o resultado', async () => {
    const { user, onBack } = await renderReview();

    await user.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('usa a direção da digitação das configurações (rtl: 0, 1 → 10)', async () => {
    useSettings.getState().setInputDirection('rtl');
    const { user } = await renderReview();

    await user.press(screen.getByRole('button', { name: '0' }));
    await user.press(screen.getByRole('button', { name: '1' }));
    await user.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByLabelText('Certa!')).toBeOnTheScreen();
  });

  it('rodada sem erradas: já mostra "Tudo corrigido! 👏"', async () => {
    await renderReview(buildRecord({ id: 'perfect', correct: 10 }));

    expect(screen.getByText('Tudo corrigido! 👏')).toBeOnTheScreen();
  });

  it('rodada inexistente: aviso e botão de início', async () => {
    const { user, onHome } = await renderReview(null);

    expect(screen.getByText('Rodada não encontrada.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Início' }));

    expect(onHome).toHaveBeenCalledTimes(1);
  });
});

describe('ReviewScreen de um nível armado', () => {
  it('mostra a conta armada, como na rodada', async () => {
    const { user } = await renderReview(
      buildRecord({ id: 'stacked', stageId: 'L07V-A', correct: 9 }),
    );

    expect(screen.getByTestId('current-problem')).toHaveAccessibleName('10 + 1 =');
    expect(screen.getByText('10')).toBeOnTheScreen();
    expect(screen.getByText('+')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: '1' }));
    await user.press(screen.getByRole('button', { name: '1' }));
    await user.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByLabelText('Certa!')).toBeOnTheScreen();
  });
});

describe('dica da direção da digitação', () => {
  beforeEach(() => useSettings.setState(useSettings.getInitialState(), true));

  it('aparece na primeira correção e some com "Entendi"', async () => {
    const { user } = await renderReview();

    expect(screen.getByText(/direção da digitação/)).toBeOnTheScreen();
    expect(useSettings.getState().hasSeenDirectionTip).toBe(true);

    await user.press(screen.getByRole('button', { name: 'Entendi' }));

    expect(screen.queryByText(/direção da digitação/)).not.toBeOnTheScreen();
  });

  it('não aparece de novo depois de vista', async () => {
    useSettings.getState().markDirectionTipSeen();
    await renderReview();

    expect(screen.queryByText(/direção da digitação/)).not.toBeOnTheScreen();
  });
});

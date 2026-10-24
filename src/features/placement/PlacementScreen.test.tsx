import { act, render, screen, userEvent } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import { setupCheckpoint } from '@/engine/placement';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

import { PlacementScreen } from './PlacementScreen';

const SEED = 11;

beforeEach(() => {
  jest.useFakeTimers({ now: 1_700_000_000_000 });
  useHistory.setState(useHistory.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
  useSettings.setState(useSettings.getInitialState(), true);
});
afterEach(() => jest.useRealTimers());

type User = ReturnType<typeof userEvent.setup>;

async function renderPlacement() {
  const onDone = jest.fn();
  const onExit = jest.fn();
  await render(
    <PlacementScreen seed={SEED} onDone={onDone} onExit={onExit} keyboardTarget={null} />,
  );
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  return { onDone, onExit, user };
}

async function finishCountdown() {
  for (let i = 0; i < 3; i++) {
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

async function type(user: User, value: number) {
  for (const d of String(value)) await user.press(screen.getByRole('button', { name: d }));
  await user.press(screen.getByRole('button', { name: 'Confirmar' }));
}

/** Joga o bloco `index` (0 = L02): todas certas, ou todas erradas. */
async function playBlock(user: User, index: number, levelId: string, right: boolean) {
  await finishCountdown();
  const { problems } = setupCheckpoint(levelId, SEED + index);
  for (const problem of problems) {
    const answer = solve(problem);
    await type(user, right ? answer : answer + 1);
  }
}

describe('PlacementScreen', () => {
  it('começa explicando o teste; "Agora não" sai', async () => {
    const { onExit, user } = await renderPlacement();

    expect(screen.getByText('Teste de nivelamento')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Agora não' }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('bloco aprovado: "Muito bem!" e o próximo bloco, mais difícil', async () => {
    const { user } = await renderPlacement();
    await user.press(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByText('Nivelamento · bloco 1 de 6')).toBeOnTheScreen();
    await playBlock(user, 0, 'L02', true);

    expect(screen.getByText('Muito bem! ✓')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('Nivelamento · bloco 2 de 6')).toBeOnTheScreen();
    expect(screen.getByLabelText('Começa em 3')).toBeOnTheScreen();
  });

  it('falhou no 1º bloco: começa no Nível 1 e conclui as boas-vindas', async () => {
    const { onDone, user } = await renderPlacement();
    await user.press(screen.getByRole('button', { name: 'Começar' }));

    await playBlock(user, 0, 'L02', false);

    expect(screen.getByText('Você começa no Nível 1!')).toBeOnTheScreen();
    expect(useProgress.getState().placementDone).toBe(true);
    expect(useSettings.getState().onboardingDone).toBe(true);

    await user.press(screen.getByRole('button', { name: 'Vamos lá' }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('passou 2 blocos e falhou no 3º: começa no Nível 6, com o que vem antes liberado', async () => {
    const { user } = await renderPlacement();
    await user.press(screen.getByRole('button', { name: 'Começar' }));

    await playBlock(user, 0, 'L02', true);
    await user.press(screen.getByRole('button', { name: 'Continuar' }));
    await playBlock(user, 1, 'L05', true);
    await user.press(screen.getByRole('button', { name: 'Continuar' }));
    await playBlock(user, 2, 'L07', false);

    expect(screen.getByText('Você começa no Nível 6!')).toBeOnTheScreen();
    const { stages } = useProgress.getState();
    expect(stages['L06-A'].unlocked).toBe(true);
    expect(stages['L06-B'].unlocked).toBe(false);
  });

  it('cada bloco vai para o histórico como nivelamento, sem contar na sequência de dias', async () => {
    const { user } = await renderPlacement();
    await user.press(screen.getByRole('button', { name: 'Começar' }));

    await playBlock(user, 0, 'L02', false);

    expect(useHistory.getState().rounds).toEqual([
      expect.objectContaining({ mode: 'placement', stageId: 'L02-B', total: 5, stars: null }),
    ]);
    expect(useProgress.getState().streak.current).toBe(0);
  });

  it('sair no meio de um bloco pede confirmação e não aplica nada', async () => {
    const { onExit, user } = await renderPlacement();
    await user.press(screen.getByRole('button', { name: 'Começar' }));
    await finishCountdown();

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    expect(screen.getByText('Sair do nivelamento?')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Sair do teste' }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(useProgress.getState().placementDone).toBe(false);
  });
});

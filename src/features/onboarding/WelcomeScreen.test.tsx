import { renderHook, render, screen, userEvent } from '@testing-library/react-native';

import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { useNeedsWelcome } from './useNeedsWelcome';
import { WelcomeScreen } from './WelcomeScreen';

beforeEach(() => {
  useSettings.setState(useSettings.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
});

async function renderWelcome() {
  const onPlacement = jest.fn();
  const onStart = jest.fn();
  await render(<WelcomeScreen onPlacement={onPlacement} onStart={onStart} />);
  return { onPlacement, onStart, user: userEvent.setup() };
}

describe('WelcomeScreen', () => {
  it('oferece o nivelamento como opção principal', async () => {
    const { onPlacement, user } = await renderWelcome();

    expect(
      screen.getByText('Quer fazer um teste rápido para começar no seu nível?'),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Fazer teste de nivelamento' }));

    expect(onPlacement).toHaveBeenCalledTimes(1);
    expect(useSettings.getState().onboardingDone).toBe(false);
  });

  it('"Começar do início" conclui as boas-vindas', async () => {
    const { onStart, user } = await renderWelcome();

    await user.press(screen.getByRole('button', { name: 'Começar do início' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(useSettings.getState().onboardingDone).toBe(true);
  });

  it('tem um seletor de idioma discreto', async () => {
    const { user } = await renderWelcome();

    await user.press(screen.getByRole('button', { name: 'English' }));

    expect(useSettings.getState().language).toBe('en');
  });
});

describe('useNeedsWelcome', () => {
  it('primeiro acesso: mostra as boas-vindas', async () => {
    const { result } = await renderHook(() => useNeedsWelcome());

    expect(result.current).toBe(true);
  });

  it('depois das boas-vindas, não mostra mais', async () => {
    useSettings.getState().markOnboardingDone();
    const { result } = await renderHook(() => useNeedsWelcome());

    expect(result.current).toBe(false);
  });

  it('quem já jogava antes (sem onboardingDone) não vê as boas-vindas', async () => {
    useHistory.getState().addRound(buildRecord());
    const { result } = await renderHook(() => useNeedsWelcome());

    expect(result.current).toBe(false);
  });

  it('quem já fez o nivelamento não vê as boas-vindas', async () => {
    useProgress.getState().completePlacement([false]);
    const { result } = await renderHook(() => useNeedsWelcome());

    expect(result.current).toBe(false);
  });
});

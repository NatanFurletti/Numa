import { render, screen, userEvent } from '@testing-library/react-native';

import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { SettingsScreen } from './SettingsScreen';

beforeEach(() => {
  useSettings.setState(useSettings.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
});

async function renderSettings() {
  const onBack = jest.fn();
  await render(<SettingsScreen onBack={onBack} />);
  return { onBack, user: userEvent.setup() };
}

describe('SettingsScreen', () => {
  it('troca o idioma', async () => {
    const { user } = await renderSettings();

    expect(screen.getByRole('button', { name: 'Português, selecionado' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'English' }));

    expect(useSettings.getState().language).toBe('en');
  });

  it('troca a direção da digitação, com um exemplo de cada', async () => {
    const { user } = await renderSettings();

    expect(screen.getByText('Digitando 2, 1, 1 aparece 112, como no papel.')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Esquerda → direita, selecionado' }),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Direita → esquerda' }));

    expect(useSettings.getState().inputDirection).toBe('rtl');
  });

  it('apagar progresso pede confirmação duas vezes e então apaga tudo', async () => {
    useProgress.getState().recordRound(buildRecord({ correct: 10 }), '2026-10-24');
    useHistory.getState().addRound(buildRecord());
    useSettings.getState().setInputDirection('rtl');
    const { user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Apagar progresso' }));
    expect(screen.getByText('Apagar todo o progresso?')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Tem certeza?')).toBeOnTheScreen();
    expect(useProgress.getState().stages['L01-B'].unlocked).toBe(true);

    await user.press(screen.getByRole('button', { name: 'Apagar tudo' }));

    expect(useProgress.getState().stages['L01-B'].unlocked).toBe(false);
    expect(useProgress.getState().streak.current).toBe(0);
    expect(useHistory.getState().rounds).toEqual([]);
    expect(useSettings.getState().inputDirection).toBe('rtl');
    expect(screen.getByText('Progresso apagado.')).toBeOnTheScreen();
  });

  it('cancelar em qualquer uma das confirmações não apaga nada', async () => {
    useHistory.getState().addRound(buildRecord());
    const { user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Apagar progresso' }));
    await user.press(screen.getByRole('button', { name: 'Cancelar' }));
    await user.press(screen.getByRole('button', { name: 'Apagar progresso' }));
    await user.press(screen.getByRole('button', { name: 'Continuar' }));
    await user.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(useHistory.getState().rounds).toHaveLength(1);
    expect(screen.queryByText('Tem certeza?')).not.toBeOnTheScreen();
  });

  it('o botão de voltar leva ao início', async () => {
    const { onBack, user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

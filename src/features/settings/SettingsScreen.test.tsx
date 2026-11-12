import { render, screen, userEvent } from '@testing-library/react-native';

import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { SettingsScreen } from './SettingsScreen';

beforeEach(() => {
  useSettings.setState(useSettings.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
  useOutbox.setState(useOutbox.getInitialState(), true);
});

async function renderSettings(canShare = true) {
  const onBack = jest.fn();
  const onRedoPlacement = jest.fn();
  const onOpenPrivacy = jest.fn();
  await render(
    <SettingsScreen
      onBack={onBack}
      onRedoPlacement={onRedoPlacement}
      onOpenPrivacy={onOpenPrivacy}
      canShare={canShare}
    />,
  );
  return { onBack, onRedoPlacement, onOpenPrivacy, user: userEvent.setup() };
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

  it('"Refazer nivelamento" abre o teste', async () => {
    const { onRedoPlacement, user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Refazer nivelamento' }));

    expect(onRedoPlacement).toHaveBeenCalledTimes(1);
  });

  it('quem ainda não foi perguntado sobre o envio não tem nenhuma opção marcada', async () => {
    await renderSettings();

    expect(screen.getByRole('button', { name: 'Enviar minhas rodadas' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Não enviar' })).toBeOnTheScreen();
  });

  it('liga o envio de rodadas', async () => {
    const { user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Enviar minhas rodadas' }));

    expect(useSettings.getState().shareRounds).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Enviar minhas rodadas, selecionado' }),
    ).toBeOnTheScreen();
  });

  it('desligar o envio guarda a recusa e esvazia a fila de envio', async () => {
    useSettings.getState().setShareRounds(true);
    useOutbox.getState().enqueue('round-1');
    const { user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Não enviar' }));

    expect(useSettings.getState().shareRounds).toBe(false);
    expect(useOutbox.getState().roundIds).toEqual([]);
    expect(screen.getByRole('button', { name: 'Não enviar, selecionado' })).toBeOnTheScreen();
  });

  it('sem servidor neste build, a opção de envio não aparece', async () => {
    await renderSettings(false);

    expect(screen.queryByRole('button', { name: 'Enviar minhas rodadas' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Política de privacidade' })).toBeOnTheScreen();
  });

  it('"Política de privacidade" abre a política', async () => {
    const { onOpenPrivacy, user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Política de privacidade' }));

    expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it('o botão de voltar leva ao início', async () => {
    const { onBack, user } = await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

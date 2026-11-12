import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { DailyRanking, RankingService } from '@/services/ranking';
import { useDaily } from '@/store/daily';
import { NO_POINTS } from '@/engine/points';
import { useOutbox } from '@/store/outbox';
import { usePoints } from '@/store/points';
import { useSettings } from '@/store/settings';

import { DailyScreen } from './DailyScreen';

const NOW = new Date(2026, 10, 11, 12).getTime(); // 11/11/2026, horário local
const DAY = '2026-11-11';

const RANKING: DailyRanking = {
  totalPlayers: 2,
  entries: [
    { rank: 1, nickname: 'Ana', correct: 10, elapsedMs: 30_000, isMe: false },
    { rank: 2, nickname: 'Zé', correct: 1, elapsedMs: 41_500, isMe: true },
  ],
};
const RESULT = {
  correct: 1,
  total: 2,
  elapsedMs: 41_500,
  problems: [
    {
      a: 1,
      b: 1,
      op: 'add' as const,
      expected: 2,
      answer: 2,
      correct: true,
      timeMs: 1,
      keystrokes: 1,
    },
    {
      a: 2,
      b: 2,
      op: 'add' as const,
      expected: 4,
      answer: 5,
      correct: false,
      timeMs: 1,
      keystrokes: 1,
    },
  ],
};

function fakeService(ranking: DailyRanking = RANKING): RankingService {
  return { submit: jest.fn(async () => {}), fetchRanking: jest.fn(async () => ranking) };
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  useDaily.setState(useDaily.getInitialState(), true);
  useOutbox.setState(useOutbox.getInitialState(), true);
  useSettings.setState(useSettings.getInitialState(), true);
  usePoints.setState(usePoints.getInitialState(), true);
  // A pessoa já aceitou enviar (D-034). O pedido em si é testado mais abaixo.
  useSettings.getState().setShareRounds(true);
});
afterEach(() => jest.useRealTimers());

async function renderDaily(service: RankingService | null = fakeService()) {
  const onStart = jest.fn();
  const onBack = jest.fn();
  const onOpenPrivacy = jest.fn();
  await render(
    <DailyScreen
      onStart={onStart}
      onBack={onBack}
      onOpenPrivacy={onOpenPrivacy}
      service={service}
    />,
  );
  return {
    onStart,
    onBack,
    onOpenPrivacy,
    user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime }),
  };
}

describe('DailyScreen antes de jogar', () => {
  it('explica o teste e mostra o ranking de hoje', async () => {
    await renderDaily();

    expect(screen.getByText(/uma tentativa por dia/)).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText('Ana')).toBeOnTheScreen());
    expect(screen.getByLabelText('1º, Ana, 10 certas, 30.0s')).toBeOnTheScreen();
  });

  it('com apelido válido, guarda o apelido (sem espaços sobrando) e começa', async () => {
    const { onStart, user } = await renderDaily();

    await fireEvent.changeText(screen.getByLabelText('Seu apelido no ranking'), '  Zé  ');
    await user.press(screen.getByRole('button', { name: 'Começar o teste' }));

    expect(useDaily.getState().nickname).toBe('Zé');
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('sem apelido, avisa e não começa', async () => {
    const { onStart, user } = await renderDaily();

    await user.press(screen.getByRole('button', { name: 'Começar o teste' }));

    expect(screen.getByText('Use pelo menos 2 caracteres.')).toBeOnTheScreen();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('o aviso some quando a pessoa volta a digitar', async () => {
    const { user } = await renderDaily();
    await user.press(screen.getByRole('button', { name: 'Começar o teste' }));

    await fireEvent.changeText(screen.getByLabelText('Seu apelido no ranking'), 'Z');

    expect(screen.queryByText('Use pelo menos 2 caracteres.')).not.toBeOnTheScreen();
  });

  it('junto do apelido, leva à política de privacidade', async () => {
    const { onOpenPrivacy, user } = await renderDaily();

    await user.press(screen.getByRole('link', { name: 'Política de privacidade' }));

    expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it('já vem com o apelido usado da última vez', async () => {
    useDaily.getState().setNickname('Zé');
    await renderDaily();

    expect(screen.getByLabelText('Seu apelido no ranking')).toHaveDisplayValue('Zé');
  });

  it('ninguém jogou ainda: avisa', async () => {
    await renderDaily(fakeService({ entries: [], totalPlayers: 0 }));

    await waitFor(() =>
      expect(screen.getByText('Ninguém fez o teste de hoje ainda.')).toBeOnTheScreen(),
    );
  });

  it('sem ranking neste build: não pede apelido e deixa jogar', async () => {
    const { onStart, user } = await renderDaily(null);

    expect(screen.queryByLabelText('Seu apelido no ranking')).not.toBeOnTheScreen();
    expect(screen.getByText('O ranking não está disponível nesta versão.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Começar o teste' }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('ranking fora do ar: mostra o erro e tenta de novo', async () => {
    const service = fakeService();
    (service.fetchRanking as jest.Mock).mockRejectedValueOnce(new Error('sem rede'));
    const { user } = await renderDaily(service);
    await waitFor(() =>
      expect(screen.getByText(/Não deu para carregar o ranking/)).toBeOnTheScreen(),
    );

    await user.press(screen.getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() => expect(screen.getByText('Ana')).toBeOnTheScreen());
  });

  it('"Voltar" volta', async () => {
    const { onBack, user } = await renderDaily();

    await user.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('DailyScreen depois de jogar', () => {
  beforeEach(() => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
  });

  it('mostra o placar, o tempo, a posição e as respostas, sem botão de começar', async () => {
    await renderDaily();

    expect(screen.getByText('1/2')).toBeOnTheScreen();
    expect(screen.getByText('em 42s')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText('Você ficou em 2º de 2.')).toBeOnTheScreen());
    expect(screen.getByText('Zé (você)')).toBeOnTheScreen();
    expect(screen.getByLabelText('2 + 2 = 4, errada, você respondeu 5')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Começar o teste' })).not.toBeOnTheScreen();
  });

  it('mostra os pontos ganhos no teste', async () => {
    usePoints.getState().award({
      id: `daily:${DAY}`,
      day: DAY,
      points: { ...NO_POINTS, hits: 3, total: 3 },
    });
    await renderDaily();

    expect(screen.getByText('+3 pontos')).toBeOnTheScreen();
  });

  it('envio falhou: avisa que o resultado ainda não foi enviado', async () => {
    const service = fakeService();
    (service.submit as jest.Mock).mockRejectedValue(new Error('sem rede'));
    await renderDaily(service);

    await waitFor(() =>
      expect(screen.getByText(/Seu resultado ainda não foi enviado/)).toBeOnTheScreen(),
    );
  });

  it('sem ranking neste build: mostra o resultado, sem aviso de envio', async () => {
    await renderDaily(null);

    expect(screen.getByText('1/2')).toBeOnTheScreen();
    expect(screen.queryByText(/ainda não foi enviado/)).not.toBeOnTheScreen();
  });
});

describe('DailyScreen: pedido para enviar os resultados (D-034)', () => {
  beforeEach(() => useSettings.setState({ shareRounds: null }));

  it('quem ainda não respondeu vê o pedido antes do apelido e do botão de começar', async () => {
    await renderDaily();

    expect(screen.getByRole('header', { name: 'Quer entrar no ranking?' })).toBeOnTheScreen();
    expect(screen.getByText(/envia ao servidor o seu apelido/)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Seu apelido no ranking')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Começar o teste' })).not.toBeOnTheScreen();
  });

  it('quem já tinha apelido de antes também vê o pedido', async () => {
    useDaily.getState().setNickname('Zé');
    await renderDaily();

    expect(screen.getByRole('button', { name: 'Aceitar e entrar no ranking' })).toBeOnTheScreen();
  });

  it('o ranking aparece mesmo antes de responder', async () => {
    await renderDaily();

    await waitFor(() => expect(screen.getByText('Ana')).toBeOnTheScreen());
  });

  it('o pedido leva à política de privacidade', async () => {
    const { onOpenPrivacy, user } = await renderDaily();

    await user.press(screen.getByRole('link', { name: 'Política de privacidade' }));

    expect(onOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it('aceitar guarda o consentimento e pede o apelido', async () => {
    const { user } = await renderDaily();

    await user.press(screen.getByRole('button', { name: 'Aceitar e entrar no ranking' }));

    expect(useSettings.getState().shareRounds).toBe(true);
    expect(screen.getByLabelText('Seu apelido no ranking')).toBeOnTheScreen();
    expect(screen.queryByText('Quer entrar no ranking?')).not.toBeOnTheScreen();
  });

  it('recusar deixa jogar sem apelido e avisa que fica fora do ranking', async () => {
    const { onStart, user } = await renderDaily();

    await user.press(screen.getByRole('button', { name: 'Jogar sem enviar' }));

    expect(useSettings.getState().shareRounds).toBe(false);
    expect(screen.queryByLabelText('Seu apelido no ranking')).not.toBeOnTheScreen();
    expect(screen.getByText(/fica fora do ranking/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Começar o teste' }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('recusar esvazia a fila de rodadas que esperavam envio', async () => {
    useOutbox.getState().enqueue('round-1');
    const { user } = await renderDaily();

    await user.press(screen.getByRole('button', { name: 'Jogar sem enviar' }));

    expect(useOutbox.getState().roundIds).toEqual([]);
  });

  it('sem ranking neste build, não há pedido', async () => {
    await renderDaily(null);

    expect(screen.queryByText('Quer entrar no ranking?')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Começar o teste' })).toBeOnTheScreen();
  });

  it('já jogou hoje e ainda não respondeu: nada é enviado até aceitar', async () => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();
    const { user } = await renderDaily(service);
    await waitFor(() => expect(screen.getByText('Ana')).toBeOnTheScreen());

    expect(screen.getByText('1/2')).toBeOnTheScreen();
    expect(service.submit).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Aceitar e entrar no ranking' }));

    await waitFor(() => expect(service.submit).toHaveBeenCalledTimes(1));
    expect(useDaily.getState().attempts[DAY]).toMatchObject({ submitted: true });
  });

  it('quem recusou e já jogou vê o resultado e o aviso, sem envio', async () => {
    useSettings.setState({ shareRounds: false });
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();
    await renderDaily(service);
    await waitFor(() => expect(screen.getByText('Ana')).toBeOnTheScreen());

    expect(screen.getByText('1/2')).toBeOnTheScreen();
    expect(screen.getByText(/fica fora do ranking/)).toBeOnTheScreen();
    expect(screen.queryByText(/ainda não foi enviado/)).not.toBeOnTheScreen();
    expect(service.submit).not.toHaveBeenCalled();
  });

  it('aceitou depois de jogar sem apelido: escolhe o apelido e o resultado é enviado', async () => {
    useSettings.setState({ shareRounds: true });
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();
    const { user } = await renderDaily(service);

    await user.press(screen.getByRole('button', { name: 'Entrar no ranking' }));
    expect(screen.getByText('Use pelo menos 2 caracteres.')).toBeOnTheScreen();
    expect(service.submit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Seu apelido no ranking'), 'Zé');
    await user.press(screen.getByRole('button', { name: 'Entrar no ranking' }));

    await waitFor(() =>
      expect(service.submit).toHaveBeenCalledWith(expect.objectContaining({ nickname: 'Zé' })),
    );
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Entrar no ranking' })).not.toBeOnTheScreen(),
    );
  });
});

describe('DailyScreen com o teste interrompido', () => {
  it('avisa que a tentativa de hoje acabou, sem botão de começar', async () => {
    useDaily.getState().startAttempt(DAY);
    await renderDaily();

    expect(screen.getByText(/foi interrompido antes do fim/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Começar o teste' })).not.toBeOnTheScreen();
  });
});

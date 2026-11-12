import { act, renderHook, waitFor } from '@testing-library/react-native';

import { GAME_CONFIG } from '@/engine/config/game-config';
import type { DailyRanking, RankingService } from '@/services/ranking';
import { useDaily } from '@/store/daily';
import { useSettings } from '@/store/settings';

import { useDailyRanking } from './useDailyRanking';

const DAY = '2026-11-11';
const RANKING: DailyRanking = {
  totalPlayers: 1,
  entries: [{ rank: 1, nickname: 'Ana', correct: 10, elapsedMs: 30_000, isMe: false }],
};
const PROBLEM = {
  a: 2,
  b: 3,
  op: 'add' as const,
  expected: 5,
  answer: 5,
  correct: true,
  timeMs: 41_500,
  keystrokes: 1,
};
const RESULT = { correct: 1, total: 1, elapsedMs: 41_500, problems: [PROBLEM] };

function fakeService(overrides: Partial<RankingService> = {}) {
  return {
    submit: jest.fn(async () => {}),
    fetchRanking: jest.fn(async () => RANKING),
    ...overrides,
  };
}

beforeEach(() => {
  useDaily.setState(useDaily.getInitialState(), true);
  useSettings.setState(useSettings.getInitialState(), true);
  // A pessoa já aceitou enviar (D-034), como em quase todos os casos abaixo.
  useSettings.getState().setShareRounds(true);
});

describe('useDailyRanking', () => {
  it('sem serviço (build sem Supabase): indisponível', async () => {
    const { result } = await renderHook(() => useDailyRanking(DAY, null));

    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('carrega o ranking do dia', async () => {
    const service = fakeService();

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'ready', ranking: RANKING }),
    );
    expect(service.fetchRanking).toHaveBeenCalledWith(DAY);
    expect(service.submit).not.toHaveBeenCalled();
  });

  it('envia as respostas pendentes (e não o placar) antes de buscar, e marca como enviado', async () => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(service.submit).toHaveBeenCalledWith({
      day: DAY,
      nickname: 'Zé',
      rulesVersion: GAME_CONFIG.rulesVersion,
      answers: [{ answer: 5, timeMs: 41_500, keystrokes: 1 }],
    });
    expect(useDaily.getState().attempts[DAY]).toMatchObject({ submitted: true });
  });

  it.each([null, false])('sem consentimento (%p), não envia nada', async (shareRounds) => {
    useSettings.setState({ shareRounds });
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(service.submit).not.toHaveBeenCalled();
    expect(useDaily.getState().attempts[DAY]).toMatchObject({ submitted: false });
  });

  it('aceitar o envio com a tela aberta envia o que estava esperando', async () => {
    useSettings.setState({ shareRounds: null });
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();
    const { result } = await renderHook(() => useDailyRanking(DAY, service));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => useSettings.getState().setShareRounds(true));

    await waitFor(() => expect(service.submit).toHaveBeenCalledTimes(1));
  });

  it('escolher o apelido depois de jogar envia o que estava esperando', async () => {
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();
    const { result } = await renderHook(() => useDailyRanking(DAY, service));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(service.submit).not.toHaveBeenCalled();

    await act(async () => useDaily.getState().setNickname('Zé'));

    await waitFor(() => expect(service.submit).toHaveBeenCalledTimes(1));
  });

  it('não envia de novo um resultado já enviado', async () => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    useDaily.getState().markSubmitted(DAY);
    const service = fakeService();

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(service.submit).not.toHaveBeenCalled();
  });

  it('envio falhou: o resultado fica pendente, mas o ranking aparece', async () => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService({ submit: jest.fn().mockRejectedValue(new Error('sem rede')) });

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(useDaily.getState().attempts[DAY]).toMatchObject({ submitted: false });
  });

  it('busca falhou: erro; "tentar de novo" busca outra vez', async () => {
    const fetchRanking = jest
      .fn<Promise<DailyRanking>, [string]>()
      .mockRejectedValueOnce(new Error('sem rede'))
      .mockResolvedValue(RANKING);
    const service = fakeService({ fetchRanking });
    const { result } = await renderHook(() => useDailyRanking(DAY, service));
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error' }));

    await act(async () => result.current.reload());

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(fetchRanking).toHaveBeenCalledTimes(2);
  });

  it('terminar o teste com a tela aberta envia o resultado e busca de novo', async () => {
    useDaily.getState().setNickname('Zé');
    const service = fakeService();
    const { result } = await renderHook(() => useDailyRanking(DAY, service));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => useDaily.getState().finishAttempt(DAY, RESULT));

    await waitFor(() => expect(service.submit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(service.fetchRanking).toHaveBeenCalledTimes(2));
  });

  it('tela fechada antes da resposta: ignora o resultado', async () => {
    let resolve: (ranking: DailyRanking) => void = () => {};
    const fetchRanking = jest.fn(() => new Promise<DailyRanking>((r) => (resolve = r)));
    const { result, unmount } = await renderHook(() =>
      useDailyRanking(DAY, fakeService({ fetchRanking })),
    );
    await waitFor(() => expect(fetchRanking).toHaveBeenCalled());

    await unmount();
    await act(async () => resolve(RANKING));

    expect(result.current.state).toEqual({ status: 'loading' });
  });
});

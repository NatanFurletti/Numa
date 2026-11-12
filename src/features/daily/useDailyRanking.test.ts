import { act, renderHook, waitFor } from '@testing-library/react-native';

import { GAME_CONFIG } from '@/engine/config/game-config';
import type { DailyRanking, RankingService } from '@/services/ranking';
import { useDaily } from '@/store/daily';

import { useDailyRanking } from './useDailyRanking';

const DAY = '2026-11-11';
const RANKING: DailyRanking = {
  totalPlayers: 1,
  entries: [{ rank: 1, nickname: 'Ana', correct: 10, elapsedMs: 30_000, isMe: false }],
};
const RESULT = { correct: 9, total: 10, elapsedMs: 41_500, problems: [] };

function fakeService(overrides: Partial<RankingService> = {}) {
  return {
    submit: jest.fn(async () => {}),
    fetchRanking: jest.fn(async () => RANKING),
    ...overrides,
  };
}

beforeEach(() => useDaily.setState(useDaily.getInitialState(), true));

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

  it('envia o resultado pendente antes de buscar, e marca como enviado', async () => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, RESULT);
    const service = fakeService();

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(service.submit).toHaveBeenCalledWith({
      day: DAY,
      nickname: 'Zé',
      correct: 9,
      total: 10,
      elapsedMs: 41_500,
      rulesVersion: GAME_CONFIG.rulesVersion,
    });
    expect(useDaily.getState().attempts[DAY]).toMatchObject({ submitted: true });
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

  it('tempo 0 vai como 1 ms (o banco recusa 0)', async () => {
    useDaily.getState().setNickname('Zé');
    useDaily.getState().finishAttempt(DAY, { ...RESULT, elapsedMs: 0 });
    const service = fakeService();

    const { result } = await renderHook(() => useDailyRanking(DAY, service));

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(service.submit).toHaveBeenCalledWith(expect.objectContaining({ elapsedMs: 1 }));
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

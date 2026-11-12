import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { RoundSyncService } from '@/services/rounds';
import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { useRoundSync } from './useRoundSync';

const fakeService = (): RoundSyncService => ({ submitRound: jest.fn(async () => 'sent' as const) });

function queue(id: string) {
  useHistory.getState().addRound(buildRecord({ id }));
  useOutbox.getState().enqueue(id);
}

beforeEach(() => {
  useSettings.setState(useSettings.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
  useOutbox.setState(useOutbox.getInitialState(), true);
  useSettings.getState().setShareRounds(true);
});

describe('useRoundSync', () => {
  it('ao abrir o app, envia o que ficou na fila', async () => {
    queue('a');
    const service = fakeService();

    await renderHook(() => useRoundSync(true, service));

    await waitFor(() => expect(useOutbox.getState().roundIds).toEqual([]));
    expect(service.submitRound).toHaveBeenCalledTimes(1);
  });

  it('envia a rodada que acabou de entrar na fila', async () => {
    const service = fakeService();
    await renderHook(() => useRoundSync(true, service));
    expect(service.submitRound).not.toHaveBeenCalled();

    await act(async () => queue('a'));

    await waitFor(() => expect(service.submitRound).toHaveBeenCalledTimes(1));
  });

  it('espera os dados salvos carregarem', async () => {
    queue('a');
    const service = fakeService();

    await renderHook(() => useRoundSync(false, service));

    expect(service.submitRound).not.toHaveBeenCalled();
  });

  it('sem consentimento, não envia', async () => {
    queue('a');
    useSettings.setState({ shareRounds: false });
    const service = fakeService();

    await renderHook(() => useRoundSync(true, service));

    expect(service.submitRound).not.toHaveBeenCalled();
  });

  it('sem servidor neste build: não faz nada', async () => {
    queue('a');

    await renderHook(() => useRoundSync(true, null));

    expect(useOutbox.getState().roundIds).toEqual(['a']);
  });

  it('quando a internet volta, tenta de novo', async () => {
    const listeners: Record<string, () => void> = {};
    const target = globalThis as unknown as {
      addEventListener?: unknown;
      removeEventListener?: unknown;
    };
    const original = { add: target.addEventListener, remove: target.removeEventListener };
    target.addEventListener = jest.fn((name: string, fn: () => void) => (listeners[name] = fn));
    target.removeEventListener = jest.fn((name: string) => delete listeners[name]);
    queue('a');
    const submitRound = jest
      .fn<Promise<'sent'>, []>()
      .mockRejectedValueOnce(new Error('sem rede'))
      .mockResolvedValue('sent');

    const { unmount } = await renderHook(() => useRoundSync(true, { submitRound }));
    await waitFor(() => expect(submitRound).toHaveBeenCalledTimes(1));
    expect(useOutbox.getState().roundIds).toEqual(['a']);

    await act(async () => listeners.online());

    await waitFor(() => expect(useOutbox.getState().roundIds).toEqual([]));

    await unmount();
    expect(listeners.online).toBeUndefined();
    target.addEventListener = original.add;
    target.removeEventListener = original.remove;
  });
});

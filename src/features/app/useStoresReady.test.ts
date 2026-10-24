import { renderHook, waitFor } from '@testing-library/react-native';

import { useProgress } from '@/store/progress';

import { useStoresReady } from './useStoresReady';

describe('useStoresReady', () => {
  it('fica pronto quando os três stores terminam de carregar', async () => {
    const { result } = await renderHook(() => useStoresReady());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('espera um store que ainda está carregando e avisa quando ele termina', async () => {
    const hasHydrated = jest.spyOn(useProgress.persist, 'hasHydrated').mockReturnValue(false);

    const { result } = await renderHook(() => useStoresReady());
    expect(result.current).toBe(false);

    hasHydrated.mockRestore();
    await useProgress.persist.rehydrate();

    await waitFor(() => expect(result.current).toBe(true));
  });
});

import { act, renderHook, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';
import { useSettings } from '@/store/settings';

import { useAppReady } from './useAppReady';

beforeEach(() => useSettings.setState(useSettings.getInitialState(), true));
afterEach(() => i18n.changeLanguage('pt'));

describe('useAppReady', () => {
  it('fica pronto quando os dados carregam e o idioma entra', async () => {
    const { result } = await renderHook(() => useAppReady());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('trocar o idioma depois de pronto não esconde as telas (bug: voltava ao início)', async () => {
    const seen: boolean[] = [];
    const { result } = await renderHook(() => {
      const ready = useAppReady();
      seen.push(ready);
      return ready;
    });
    await waitFor(() => expect(result.current).toBe(true));
    seen.length = 0;

    await act(() => useSettings.getState().setLanguage('en'));

    expect(i18n.language).toBe('en');
    expect(seen.every(Boolean)).toBe(true);
  });
});

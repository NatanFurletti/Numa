import { act, renderHook } from '@testing-library/react-native';

import i18n from '@/i18n';
import { useSettings } from '@/store/settings';

import { useLanguageSync } from './useLanguageSync';

beforeEach(() => useSettings.setState(useSettings.getInitialState(), true));
afterEach(() => i18n.changeLanguage('pt'));

describe('useLanguageSync', () => {
  it('aplica o idioma das configurações e acompanha as trocas', async () => {
    const { result } = await renderHook(() => useLanguageSync());

    expect(result.current).toBe(true);
    expect(i18n.t('home.levels')).toBe('Níveis');

    await act(() => useSettings.getState().setLanguage('en'));

    expect(result.current).toBe(true);
    expect(i18n.language).toBe('en');
    expect(i18n.t('home.levels')).toBe('Levels');
  });
});

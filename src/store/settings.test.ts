import { getLocales } from 'expo-localization';

import { createSettingsStore, useSettings } from './settings';

beforeEach(() => useSettings.setState(useSettings.getInitialState(), true));

describe('useSettings', () => {
  it('padrões: digitação da esquerda para a direita e dica ainda não vista', () => {
    expect(useSettings.getState()).toMatchObject({
      inputDirection: 'ltr',
      hasSeenDirectionTip: false,
    });
  });

  it('marca a dica de direção como vista', () => {
    useSettings.getState().markDirectionTipSeen();

    expect(useSettings.getState().hasSeenDirectionTip).toBe(true);
  });

  it('troca a direção da digitação', () => {
    useSettings.getState().setInputDirection('rtl');

    expect(useSettings.getState().inputDirection).toBe('rtl');
  });
});

describe('idioma padrão', () => {
  it('segue o aparelho quando ele está em inglês', () => {
    jest
      .mocked(getLocales)
      .mockReturnValueOnce([{ languageTag: 'en-GB', languageCode: 'en' } as never]);

    expect(createSettingsStore().getState().language).toBe('en');
  });

  it('português para qualquer outro idioma do aparelho', () => {
    jest
      .mocked(getLocales)
      .mockReturnValueOnce([{ languageTag: 'es-ES', languageCode: 'es' } as never]);

    expect(createSettingsStore().getState().language).toBe('pt');
  });

  it('troca o idioma', () => {
    useSettings.getState().setLanguage('en');

    expect(useSettings.getState().language).toBe('en');
  });
});

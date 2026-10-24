// i18n (docs/ARCHITECTURE.md §2, D-014): português e inglês.
// O idioma escolhido fica nas configurações; src/features/app/useLanguageSync aplica aqui.

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en';
import { pt } from './pt';

export const LANGUAGES = ['pt', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Nome de cada idioma no próprio idioma (o seletor não traduz). */
export const LANGUAGE_NAMES: Record<Language, string> = {
  pt: 'Português',
  en: 'English',
};

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: 'pt',
  fallbackLng: 'pt',
  // React já escapa o texto.
  interpolation: { escapeValue: false },
  // Os textos estão no próprio código: carrega na hora, sem esperar.
  initAsync: false,
});

export default i18n;

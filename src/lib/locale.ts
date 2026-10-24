import { getLocales } from 'expo-localization';

/** Idioma do aparelho, se for português ou inglês; senão, português (GAME_RULES §12). */
export function deviceLanguage(): 'pt' | 'en' {
  const code = getLocales()[0]?.languageCode;
  return code === 'en' ? 'en' : 'pt';
}

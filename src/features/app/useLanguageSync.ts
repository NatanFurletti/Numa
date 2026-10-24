import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettings } from '@/store/settings';

/** Aplica no i18n o idioma das configurações. true quando o i18n já está nele. */
export function useLanguageSync(): boolean {
  const language = useSettings((s) => s.language);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [i18n, language]);

  return i18n.language === language;
}

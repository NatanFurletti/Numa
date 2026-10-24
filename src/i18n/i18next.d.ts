// Chaves de tradução tipadas: `t('home.levels')` existe; `t('home.lvels')` não compila.
import 'i18next';

import type { Translation } from './pt';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}

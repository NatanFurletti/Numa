import { useState } from 'react';

import { useLanguageSync } from './useLanguageSync';
import { useStoresReady } from './useStoresReady';

/**
 * true quando o app pode mostrar as telas: dados salvos carregados e idioma escolhido aplicado.
 * Depois de pronto uma vez, fica pronto. Trocar o idioma nas configurações não pode esconder
 * as telas, porque isso desmontaria a navegação e voltaria ao início.
 */
export function useAppReady(): boolean {
  const storesReady = useStoresReady();
  const languageReady = useLanguageSync();
  const [wasReady, setWasReady] = useState(false);

  const ready = storesReady && languageReady;
  // Ajuste de estado durante a renderização (padrão do React para "lembrar" um valor).
  if (ready && !wasReady) setWasReady(true);
  return ready || wasReady;
}

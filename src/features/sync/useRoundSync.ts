// Mantém a fila de rodadas andando: envia ao abrir o app, quando uma rodada termina e quando
// a internet volta. Fica no layout raiz, uma vez só.

import { useEffect, useState } from 'react';

import { defaultRoundSyncService } from '@/services/api-rounds';
import type { RoundSyncService } from '@/services/rounds';
import { useOutbox } from '@/store/outbox';
import { useSettings } from '@/store/settings';

import { flushOutbox } from './outbox';

type OnlineTarget = Partial<Pick<Window, 'addEventListener' | 'removeEventListener'>>;

/**
 * @param enabled os dados salvos já carregaram (antes disso a fila ainda está vazia).
 * @param serviceProp sem ele, usa o servidor de verdade (ou nenhum, se o build não tem).
 */
export function useRoundSync(enabled: boolean, serviceProp?: RoundSyncService | null): void {
  const [service] = useState(() =>
    serviceProp === undefined ? defaultRoundSyncService() : serviceProp,
  );
  const pending = useOutbox((s) => s.roundIds.length);
  const sharing = useSettings((s) => s.shareRounds === true);
  const active = enabled && sharing && service !== null;

  // Cada envio que dá certo diminui a fila e passa por aqui de novo; uma falha não muda nada,
  // então não há tentativa em laço.
  useEffect(() => {
    if (active && service && pending > 0) void flushOutbox(service);
  }, [active, service, pending]);

  // Só o navegador avisa quando a internet volta. Nos apps nativos, vale a próxima abertura.
  useEffect(() => {
    const target: OnlineTarget = globalThis;
    if (!active || !service || !target.addEventListener) return;
    const retry = () => void flushOutbox(service);
    target.addEventListener('online', retry);
    return () => target.removeEventListener?.('online', retry);
  }, [active, service]);
}

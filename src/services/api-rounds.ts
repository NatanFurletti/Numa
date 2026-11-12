// Envio das rodadas de desafio pela função do servidor (api/rounds).

import { type ApiClient, defaultApiClient } from './api';
import type { RoundSyncService } from './rounds';

/** Respostas que não mudam se a mesma rodada for enviada de novo. */
const PERMANENT_REFUSALS = [400, 409, 413, 422];

export function createApiRoundSync(api: ApiClient): RoundSyncService {
  return {
    async submitRound(round) {
      const status = await api.post('/api/rounds', round);
      if (status === 200) return 'sent';
      if (PERMANENT_REFUSALS.includes(status)) return 'rejected';
      throw new Error(`O servidor não recebeu a rodada (${status}).`);
    },
  };
}

let service: RoundSyncService | undefined;

/** O envio de verdade, ou null se o servidor não está configurado neste build. */
export function defaultRoundSyncService(): RoundSyncService | null {
  if (service) return service;
  const api = defaultApiClient();
  if (!api) return null;
  service = createApiRoundSync(api);
  return service;
}

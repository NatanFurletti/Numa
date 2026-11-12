import { defaultApiClient } from './api';
import type { RankingService } from './ranking';
import { getSupabase } from './supabase';
import { createSupabaseRanking } from './supabase-ranking';

let service: RankingService | undefined;

/** O ranking de verdade, ou null se o servidor não está configurado neste build. */
export function defaultRankingService(): RankingService | null {
  if (service) return service;
  const client = getSupabase();
  const api = defaultApiClient();
  if (!client || !api) return null;
  service = createSupabaseRanking(client, api);
  return service;
}

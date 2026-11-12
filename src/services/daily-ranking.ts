import type { RankingService } from './ranking';
import { getSupabase } from './supabase';
import { createSupabaseRanking } from './supabase-ranking';

let service: RankingService | undefined;

/** O ranking de verdade, ou null se o Supabase não está configurado neste build. */
export function defaultRankingService(): RankingService | null {
  if (service) return service;
  const client = getSupabase();
  if (!client) return null;
  service = createSupabaseRanking(client);
  return service;
}

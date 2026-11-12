// Ranking do teste do dia. Ler: função `daily_ranking` do Supabase (supabase/migrations).
// Gravar: pela função do servidor, que confere as respostas (api/daily, D-034).

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ApiClient } from './api';
import type { DailyRanking, RankingService } from './ranking';

interface RankingRow {
  rank: number;
  nickname: string;
  correct: number;
  elapsed_ms: number;
  is_me: boolean;
  total_players: number;
}

export function createSupabaseRanking(client: SupabaseClient, api: ApiClient): RankingService {
  return {
    async submit(submission) {
      const status = await api.post('/api/daily', submission);
      if (status !== 200) throw new Error(`O servidor não aceitou o resultado (${status}).`);
    },

    async fetchRanking(day): Promise<DailyRanking> {
      const { data, error } = await client.rpc('daily_ranking', { p_day: day });
      if (error) throw error;
      const rows = (data ?? []) as RankingRow[];
      return {
        entries: rows.map((row) => ({
          rank: Number(row.rank),
          nickname: row.nickname,
          correct: row.correct,
          elapsedMs: row.elapsed_ms,
          isMe: row.is_me === true,
        })),
        totalPlayers: Number(rows[0]?.total_players ?? 0),
      };
    },
  };
}

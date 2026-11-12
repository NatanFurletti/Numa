// Ranking do teste do dia no Supabase (tabela e função em supabase/migrations).

import type { SupabaseClient } from '@supabase/supabase-js';

import type { DailyRanking, RankingService } from './ranking';

/** Código do Postgres para chave repetida: este aparelho já enviou o resultado do dia. */
const UNIQUE_VIOLATION = '23505';

interface RankingRow {
  rank: number;
  nickname: string;
  correct: number;
  elapsed_ms: number;
  is_me: boolean;
  total_players: number;
}

/** Cada aparelho é um usuário anônimo do Supabase (sem e-mail nem senha), criado no primeiro envio. */
async function ensureSession(client: SupabaseClient): Promise<void> {
  const { data } = await client.auth.getSession();
  if (data.session) return;
  const { error } = await client.auth.signInAnonymously();
  if (error) throw error;
}

export function createSupabaseRanking(client: SupabaseClient): RankingService {
  return {
    async submit({ day, nickname, correct, total, elapsedMs, rulesVersion }) {
      await ensureSession(client);
      const { error } = await client.from('daily_results').insert({
        day,
        nickname,
        correct,
        total,
        elapsed_ms: elapsedMs,
        rules_version: rulesVersion,
      });
      if (error && error.code !== UNIQUE_VIOLATION) throw error;
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

// O banco das funções do servidor, no Supabase (tabelas em supabase/migrations).
// O cliente usa a chave secreta: passa por cima das políticas das tabelas, então só existe aqui.

import type { SupabaseClient } from '@supabase/supabase-js';

import type { InsertOutcome, ServerRepo, StageRoundRow } from './repo';

/** Código do Postgres para chave repetida. */
const UNIQUE_VIOLATION = '23505';

function outcomeOf(error: { code?: string } | null): InsertOutcome {
  if (!error) return 'inserted';
  if (error.code === UNIQUE_VIOLATION) return 'duplicate';
  throw error;
}

export function createSupabaseRepo(client: SupabaseClient): ServerRepo {
  return {
    async userIdFromToken(token) {
      const { data, error } = await client.auth.getUser(token);
      if (!error) return data.user?.id ?? null;
      // 4xx: o Supabase recusou o token. O resto (rede, 5xx) é falha nossa, não do aparelho.
      const status = (error as { status?: number }).status;
      if (status !== undefined && status >= 400 && status < 500) return null;
      throw error;
    },

    async insertDailyResult(row) {
      const { error } = await client.from('daily_results').insert({
        day: row.day,
        user_id: row.userId,
        nickname: row.nickname,
        correct: row.correct,
        total: row.total,
        elapsed_ms: row.elapsedMs,
        rules_version: row.rulesVersion,
        verified: true,
        points: row.points,
      });
      return outcomeOf(error);
    },

    async insertRound(row) {
      const { error } = await client.from('round_records').insert({
        id: row.id,
        user_id: row.userId,
        stage_id: row.stageId,
        seed: row.seed,
        rules_version: row.rulesVersion,
        app_version: row.appVersion,
        status: row.status,
        started_at: row.startedAt,
        elapsed_ms: row.elapsedMs,
        time_limit_ms: row.timeLimitMs,
        correct: row.correct,
        total: row.total,
        stars: row.stars,
        input_direction: row.inputDirection,
        problems: row.problems,
        day: row.day,
        points: row.points,
      });
      return outcomeOf(error);
    },

    async stageRounds(userId, stageId) {
      const { data, error } = await client
        .from('round_records')
        .select('day, status, stars')
        .eq('user_id', userId)
        .eq('stage_id', stageId);
      if (error) throw error;
      return (data ?? []) as StageRoundRow[];
    },
  };
}

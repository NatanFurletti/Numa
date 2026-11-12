// Ranking do teste do dia (docs/ARCHITECTURE.md §8). As telas só conhecem esta interface;
// a implementação com o Supabase fica em supabase-ranking.ts, e os testes usam uma falsa.

export interface RankingEntry {
  /** Posição no dia, começando em 1. */
  rank: number;
  nickname: string;
  correct: number;
  elapsedMs: number;
  /** É o resultado deste aparelho. */
  isMe: boolean;
}

export interface DailyRanking {
  /** Os primeiros colocados e, se estiver fora deles, o resultado deste aparelho. */
  entries: RankingEntry[];
  /** Quantas pessoas fizeram o teste do dia. */
  totalPlayers: number;
}

export interface DailySubmission {
  /** 'YYYY-MM-DD'. */
  day: string;
  nickname: string;
  correct: number;
  total: number;
  elapsedMs: number;
  rulesVersion: number;
}

export interface RankingService {
  /** Envia o resultado do dia. Enviar de novo o mesmo dia não muda nada (vale o primeiro). */
  submit(submission: DailySubmission): Promise<void>;
  fetchRanking(day: string): Promise<DailyRanking>;
}

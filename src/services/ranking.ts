// Ranking do teste do dia (docs/ARCHITECTURE.md §7). As telas só conhecem esta interface;
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

/** O que vai de cada conta, na ordem da rodada. O placar não vai: o servidor calcula (D-034). */
export interface AnswerPayload {
  /** null = não respondida. */
  answer: number | null;
  timeMs: number;
  keystrokes: number;
}

export interface DailySubmission {
  /** 'YYYY-MM-DD'. */
  day: string;
  nickname: string;
  rulesVersion: number;
  answers: AnswerPayload[];
}

export interface RankingService {
  /**
   * Envia as respostas do teste do dia. Enviar de novo o mesmo dia não muda nada (vale o
   * primeiro). Lança erro se o resultado não entrou: sem internet, ou recusado pelo servidor.
   */
  submit(submission: DailySubmission): Promise<void>;
  fetchRanking(day: string): Promise<DailyRanking>;
}

// O que as funções do servidor precisam do banco (D-034). A implementação com o Supabase fica
// em supabase-repo.ts, e os testes usam uma falsa.

import type { ProblemAttempt } from '../engine/types';

export interface DailyResultRow {
  /** 'YYYY-MM-DD'. */
  day: string;
  userId: string;
  nickname: string;
  correct: number;
  total: number;
  elapsedMs: number;
  rulesVersion: number;
  /** Pontos do teste do dia, calculados no servidor (GAME_RULES §14.3). */
  points: number;
}

export interface RoundRow {
  /** uuid criado no aparelho: enviar de novo a mesma rodada não grava outra. */
  id: string;
  userId: string;
  stageId: string;
  seed: number;
  rulesVersion: number;
  appVersion: string;
  status: 'completed' | 'abandoned';
  /** ISO 8601. */
  startedAt: string;
  elapsedMs: number;
  timeLimitMs: number;
  correct: number;
  total: number;
  stars: number | null;
  inputDirection: 'ltr' | 'rtl';
  problems: ProblemAttempt[];
  /** Data local do aparelho no início, 'YYYY-MM-DD' (trava por dia). null nas rodadas de antes do M9. */
  day: string | null;
  /** Pontos da rodada, calculados no servidor (GAME_RULES §14). */
  points: number;
}

/** O que os pontos precisam das rodadas já guardadas da pessoa numa etapa. */
export type StageRoundRow = Pick<RoundRow, 'day' | 'status' | 'stars'>;

/** `duplicate`: já existia (mesmo dia e usuário, ou mesmo id de rodada). Vale o primeiro. */
export type InsertOutcome = 'inserted' | 'duplicate';

export interface ServerRepo {
  /** O usuário anônimo dono do token, ou null se o token não vale. */
  userIdFromToken(token: string): Promise<string | null>;
  insertDailyResult(row: DailyResultRow): Promise<InsertOutcome>;
  insertRound(row: RoundRow): Promise<InsertOutcome>;
  /** Rodadas já guardadas da pessoa nessa etapa (para a melhor nota e a trava do dia). */
  stageRounds(userId: string, stageId: string): Promise<StageRoundRow[]>;
}

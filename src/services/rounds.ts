// Envio das rodadas de desafio ao servidor (D-034). As telas só conhecem esta interface;
// a implementação fica em api-rounds.ts, e os testes usam uma falsa.

import type { AnswerPayload } from './ranking';

export interface RoundSubmission {
  /** uuid da rodada no histórico: enviar de novo não grava outra. */
  id: string;
  stageId: string;
  seed: number;
  rulesVersion: number;
  appVersion: string;
  /** ISO 8601. */
  startedAt: string;
  /** Data local do início, 'YYYY-MM-DD': a trava dos pontos é por dia local (D-035). */
  day: string;
  inputDirection: 'ltr' | 'rtl';
  answers: AnswerPayload[];
}

/**
 * `sent`: está no servidor (agora ou de antes).
 * `rejected`: o servidor recusou e vai recusar sempre (não adianta tentar de novo).
 */
export type RoundSyncOutcome = 'sent' | 'rejected';

export interface RoundSyncService {
  /** Lança erro quando vale tentar depois: sem internet ou servidor fora do ar. */
  submitRound(round: RoundSubmission): Promise<RoundSyncOutcome>;
}

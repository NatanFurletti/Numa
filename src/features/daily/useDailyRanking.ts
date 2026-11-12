// Ranking do dia: envia o resultado deste aparelho, se ainda falta, e busca a lista.

import { useCallback, useEffect, useState } from 'react';

import { GAME_CONFIG } from '@/engine/config/game-config';
import { toSubmittedAnswers } from '@/engine/verify';
import { isSharing } from '@/features/sync/outbox';
import type { DailyRanking, RankingService } from '@/services/ranking';
import { useDaily } from '@/store/daily';
import { useSettings } from '@/store/settings';

export type RankingState =
  /** Build sem o Supabase configurado. */
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; ranking: DailyRanking };

/**
 * Envia o teste do dia, se houver um ainda não enviado e a pessoa aceitou enviar (D-034).
 * Vão as respostas e os tempos; o placar é o servidor que calcula.
 * Falhar aqui não impede ver o ranking.
 */
async function submitPending(day: string, service: RankingService): Promise<void> {
  const { attempts, nickname, markSubmitted } = useDaily.getState();
  const attempt = attempts[day];
  if (attempt?.status !== 'done' || attempt.submitted || !nickname || !isSharing()) return;
  try {
    await service.submit({
      day,
      nickname,
      rulesVersion: GAME_CONFIG.rulesVersion,
      answers: toSubmittedAnswers(attempt.problems),
    });
    markSubmitted(day);
  } catch {
    // Sem internet, ou o servidor recusou: fica pendente e tenta de novo na próxima visita.
  }
}

export function useDailyRanking(day: string, service: RankingService | null) {
  const [state, setState] = useState<RankingState>(
    service ? { status: 'loading' } : { status: 'unavailable' },
  );
  const [request, setRequest] = useState(0);
  // Terminar o teste com esta tela aberta (por baixo da rodada) envia o resultado e atualiza a lista.
  const done = useDaily((s) => s.attempts[day]?.status === 'done');
  // Aceitar o envio ou escolher o apelido depois de jogar também envia o que estava esperando.
  const canSubmit = useSettings((s) => s.shareRounds === true);
  const hasNickname = useDaily((s) => s.nickname !== null);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    const load = async (): Promise<RankingState> => {
      await submitPending(day, service);
      try {
        return { status: 'ready', ranking: await service.fetchRanking(day) };
      } catch {
        return { status: 'error' };
      }
    };
    void load().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [day, service, request, done, canSubmit, hasNickname]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setRequest((n) => n + 1);
  }, []);

  return { state, reload };
}

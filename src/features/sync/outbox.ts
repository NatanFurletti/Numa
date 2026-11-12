// Envio das rodadas de desafio que estão na fila (`numa.outbox`), e o consentimento que o
// libera (D-034). Só `shareRounds === true` deixa alguma coisa sair do aparelho.

import type { RoundRecord } from '@/engine/round-record';
import { toSubmittedAnswers } from '@/engine/verify';
import type { RoundSubmission, RoundSyncService } from '@/services/rounds';
import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { useSettings } from '@/store/settings';

/** Guarda a resposta ao pedido de consentimento. Recusar também esvazia a fila. */
export function setSharing(share: boolean): void {
  useSettings.getState().setShareRounds(share);
  if (!share) useOutbox.getState().clear();
}

export const isSharing = () => useSettings.getState().shareRounds === true;

/** O que vai para o servidor: a seed, as respostas e os tempos. O placar ele mesmo calcula. */
function toSubmission(round: RoundRecord): RoundSubmission {
  return {
    id: round.id,
    stageId: round.stageId,
    seed: round.seed,
    rulesVersion: round.rulesVersion,
    appVersion: round.appVersion,
    startedAt: round.startedAt,
    inputDirection: round.inputDirection,
    answers: toSubmittedAnswers(round.problems),
  };
}

async function sendAll(service: RoundSyncService): Promise<void> {
  const { remove } = useOutbox.getState();
  // Relê a fila a cada volta: rodadas terminadas durante o envio entram na mesma leva.
  for (;;) {
    if (!isSharing()) return;
    const id = useOutbox.getState().roundIds[0];
    if (id === undefined) return;

    const round = useHistory.getState().rounds.find((r) => r.id === id);
    if (round) {
      try {
        await service.submitRound(toSubmission(round));
      } catch {
        // Sem internet ou servidor fora do ar: fica na fila para a próxima vez.
        return;
      }
    }
    // Enviada, recusada de vez, ou não está mais no histórico.
    remove(id);
  }
}

let running: Promise<void> | null = null;

/** Envia o que está na fila, uma rodada por vez. Chamar de novo durante um envio não duplica. */
export function flushOutbox(service: RoundSyncService): Promise<void> {
  running ??= sendAll(service).finally(() => {
    running = null;
  });
  return running;
}

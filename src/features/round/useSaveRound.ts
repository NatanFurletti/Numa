// Grava uma rodada terminada no histórico e aplica no progresso (rodadas e blocos do nivelamento).
// As rodadas de desafio de quem aceitou enviar entram na fila de envio (D-034).

import { useCallback } from 'react';

import { buildRoundRecord, type RoundRecord } from '@/engine/round-record';
import type { InputDirection, Mode } from '@/engine/types';
import { isSharing } from '@/features/sync/outbox';
import { appVersion } from '@/lib/app-info';
import { systemClock } from '@/lib/clock';
import { localDateString } from '@/lib/date';
import { toIsoString } from '@/lib/format';
import { newId } from '@/lib/id';
import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { useProgress } from '@/store/progress';

import type { RoundEnd } from './useRound';

export interface SaveRoundInput {
  stageId: string;
  mode: Mode;
  seed: number;
  direction: InputDirection;
  end: RoundEnd;
}

/** Devolve o registro gravado, ou null se a pessoa saiu na contagem (nenhuma conta apareceu). */
export function useSaveRound(): (input: SaveRoundInput) => RoundRecord | null {
  const addRound = useHistory((s) => s.addRound);
  const recordRound = useProgress((s) => s.recordRound);
  const enqueue = useOutbox((s) => s.enqueue);

  return useCallback(
    ({ stageId, mode, seed, direction, end }: SaveRoundInput) => {
      if (end.startedAt === null) return null;
      const record = buildRoundRecord({
        id: newId(),
        appVersion,
        stageId,
        mode,
        status: end.status,
        seed,
        startedAt: toIsoString(end.startedAt),
        timeLimitMs: end.timeLimitMs,
        inputDirection: direction,
        summary: end.summary,
      });
      addRound(record);
      recordRound(record, localDateString(systemClock.now()));
      if (mode === 'challenge' && isSharing()) enqueue(record.id);
      return record;
    },
    [addRound, recordRound, enqueue],
  );
}

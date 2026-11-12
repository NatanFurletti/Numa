// Fila de envio (docs/DATA.md §1.5), salva em `numa.outbox`: os ids das rodadas de desafio que
// ainda não chegaram ao servidor. As rodadas em si ficam no histórico.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { GAME_CONFIG } from '@/engine/config/game-config';
import type { DocumentSpec } from '@/storage/document';
import { deviceStorage } from '@/storage/device-storage';
import type { KeyValueStorage } from '@/storage/key-value';

import { documentStorage, isString } from './persist';

interface OutboxData {
  /** Da mais antiga para a mais nova. */
  roundIds: string[];
}

interface OutboxState extends OutboxData {
  enqueue: (roundId: string) => void;
  /** A rodada chegou ao servidor, foi recusada por ele ou não existe mais no histórico. */
  remove: (roundId: string) => void;
  clear: () => void;
}

export const OUTBOX_KEY = 'numa.outbox';

/** Mantém só as últimas `max` (as mais novas ficam no fim). */
const prune = (ids: string[], max: number = GAME_CONFIG.sync.maxPendingRounds) =>
  ids.slice(Math.max(0, ids.length - max));

export const outboxSpec: DocumentSpec<OutboxData> = {
  version: 1,
  parse: (doc) => ({
    roundIds: Array.isArray(doc.roundIds) ? prune(doc.roundIds.filter(isString)) : [],
  }),
};

export function createOutboxStore(storage: KeyValueStorage = deviceStorage) {
  return create<OutboxState>()(
    persist(
      (set) => ({
        roundIds: [],
        enqueue: (roundId) =>
          set((state) =>
            state.roundIds.includes(roundId)
              ? state
              : { roundIds: prune([...state.roundIds, roundId]) },
          ),
        remove: (roundId) =>
          set((state) => ({ roundIds: state.roundIds.filter((id) => id !== roundId) })),
        clear: () => set({ roundIds: [] }),
      }),
      {
        name: OUTBOX_KEY,
        version: outboxSpec.version,
        storage: documentStorage(storage, outboxSpec),
        partialize: ({ roundIds }) => ({ roundIds }),
      },
    ),
  );
}

export const useOutbox = createOutboxStore();

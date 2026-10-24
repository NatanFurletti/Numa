// Histórico de rodadas (docs/DATA.md §1.3), salvo em `numa.history`.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { pruneHistory, type RoundRecord } from '@/engine/round-record';
import type { DocumentSpec } from '@/storage/document';
import { deviceStorage } from '@/storage/device-storage';
import type { KeyValueStorage } from '@/storage/key-value';

import { documentStorage, isCount, isRecord, isString } from './persist';

interface HistoryData {
  /** Da mais antiga para a mais nova. */
  rounds: RoundRecord[];
}

interface HistoryState extends HistoryData {
  addRound: (round: RoundRecord) => void;
  clearHistory: () => void;
  saveReviewAttempts: (
    roundId: string,
    attempts: { roundIndex: number; attempts: number }[],
  ) => void;
}

export const HISTORY_KEY = 'numa.history';

const MODES = ['challenge', 'practice', 'warmup'];
const STATUSES = ['completed', 'abandoned'];

/** Checagem leve: o suficiente para as telas não quebrarem com um registro estragado. */
function isRoundRecord(value: unknown): value is RoundRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.stageId) &&
    MODES.includes(value.mode as string) &&
    STATUSES.includes(value.status as string) &&
    isCount(value.correct) &&
    isCount(value.total) &&
    isCount(value.elapsedMs) &&
    Array.isArray(value.problems)
  );
}

export const historySpec: DocumentSpec<HistoryData> = {
  version: 1,
  parse: (doc) =>
    Array.isArray(doc.rounds) ? { rounds: pruneHistory(doc.rounds.filter(isRoundRecord)) } : null,
};

export function createHistoryStore(storage: KeyValueStorage = deviceStorage) {
  return create<HistoryState>()(
    persist(
      (set) => ({
        rounds: [],
        addRound: (round) => set((state) => ({ rounds: pruneHistory([...state.rounds, round]) })),
        clearHistory: () => set({ rounds: [] }),
        saveReviewAttempts: (roundId, attempts) =>
          set((state) => {
            if (!state.rounds.some((r) => r.id === roundId)) return state;
            const byIndex = new Map(attempts.map((a) => [a.roundIndex, a.attempts]));
            return {
              rounds: state.rounds.map((round) =>
                round.id !== roundId
                  ? round
                  : {
                      ...round,
                      problems: round.problems.map((p, i) =>
                        byIndex.has(i) ? { ...p, reviewAttempts: byIndex.get(i) } : p,
                      ),
                    },
              ),
            };
          }),
      }),
      {
        name: HISTORY_KEY,
        version: historySpec.version,
        storage: documentStorage(storage, historySpec),
        partialize: ({ rounds }) => ({ rounds }),
      },
    ),
  );
}

export const useHistory = createHistoryStore();

// Histórico de rodadas (docs/DATA.md §1.3).
// Provisório (M3): só em memória. No M4 ganha persistência e migrações.

import { create } from 'zustand';

import { pruneHistory, type RoundRecord } from '@/engine/round-record';

interface HistoryState {
  /** Da mais antiga para a mais nova. */
  rounds: RoundRecord[];
  addRound: (round: RoundRecord) => void;
  saveReviewAttempts: (
    roundId: string,
    attempts: { roundIndex: number; attempts: number }[],
  ) => void;
}

export const useHistory = create<HistoryState>()((set) => ({
  rounds: [],
  addRound: (round) => set((state) => ({ rounds: pruneHistory([...state.rounds, round]) })),
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
}));

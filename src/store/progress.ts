// Progresso (docs/DATA.md §1.2), salvo em `numa.progress`.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  applyPlacement,
  applyRound,
  createInitialProgress,
  type FinishedRound,
  type Progress,
} from '@/engine/progress';
import {
  continueStageId,
  createInitialStages,
  type StageProgress,
  unlockThrough,
} from '@/engine/progression';
import type { Streak } from '@/engine/streak';
import type { Stars } from '@/engine/types';
import type { DocumentSpec } from '@/storage/document';
import { deviceStorage } from '@/storage/device-storage';
import type { KeyValueStorage } from '@/storage/key-value';

import { documentStorage, isBoolean, isCount, isRecord, isString, pick } from './persist';

interface ProgressState extends Progress {
  /** Aplica uma rodada terminada. `today` é a data local, 'YYYY-MM-DD'. */
  recordRound: (round: FinishedRound, today: string) => void;
  /** Resultado do nivelamento: aprovado ou não em cada checkpoint, na ordem. */
  completePlacement: (results: readonly boolean[]) => void;
  /** Apagar progresso (configurações): volta ao início, como no primeiro acesso. */
  resetProgress: () => void;
}

export const PROGRESS_KEY = 'numa.progress';

const isStars = (v: unknown): v is Stars => v === 0 || v === 1 || v === 2 || v === 3;

function parseStage(value: unknown): StageProgress | null {
  if (!isRecord(value)) return null;
  const {
    unlocked,
    bestStars,
    bestTimeMs,
    bestCorrect,
    attempts,
    consecutiveFails,
    pendingWarmup,
  } = value;
  if (!isBoolean(unlocked) || !isStars(bestStars) || !isCount(attempts)) return null;
  if (!isCount(consecutiveFails) || !isBoolean(pendingWarmup)) return null;
  return {
    unlocked,
    bestStars,
    attempts,
    consecutiveFails,
    pendingWarmup,
    ...(isCount(bestTimeMs) ? { bestTimeMs } : {}),
    ...(isCount(bestCorrect) ? { bestCorrect } : {}),
  };
}

function parseStreak(value: unknown): Streak {
  if (!isRecord(value) || !isCount(value.current) || !isCount(value.best)) {
    return createInitialProgress().streak;
  }
  const { current, best, lastPlayedDate } = value;
  return isString(lastPlayedDate) ? { current, best, lastPlayedDate } : { current, best };
}

export const progressSpec: DocumentSpec<Progress> = {
  version: 1,
  parse: (doc) => {
    // Parte das etapas atuais: etapas novas entram bloqueadas; etapas que não existem mais saem.
    const stages = createInitialStages();
    const saved = isRecord(doc.stages) ? doc.stages : {};
    for (const id of Object.keys(stages)) {
      const stage = parseStage(saved[id]);
      if (stage) stages[id] = stage;
    }
    // Níveis inseridos numa atualização antes do ponto onde a pessoa já está (ex.: as versões
    // armadas, D-028) entram liberados, com 0 estrelas, como no nivelamento.
    return {
      stages: unlockThrough(stages, continueStageId(stages)),
      placementDone: pick(doc.placementDone, isBoolean, false),
      streak: parseStreak(doc.streak),
    };
  },
};

export function createProgressStore(storage: KeyValueStorage = deviceStorage) {
  return create<ProgressState>()(
    persist(
      (set) => ({
        ...createInitialProgress(),
        recordRound: (round, today) => set((state) => applyRound(state, round, today)),
        completePlacement: (results) => set((state) => applyPlacement(state, results)),
        resetProgress: () => set(createInitialProgress()),
      }),
      {
        name: PROGRESS_KEY,
        version: progressSpec.version,
        storage: documentStorage(storage, progressSpec),
        partialize: ({ stages, placementDone, streak }) => ({ stages, placementDone, streak }),
      },
    ),
  );
}

export const useProgress = createProgressStore();

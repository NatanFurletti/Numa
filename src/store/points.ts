// Pontos (docs/DATA.md §1.6), salvos em `numa.points`: total, pontos de cada dia e os últimos ganhos.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  addAward,
  emptyLedger,
  type PointsAward,
  type PointsBreakdown,
  type PointsLedger,
} from '@/engine/points';
import type { DocumentSpec } from '@/storage/document';
import { deviceStorage } from '@/storage/device-storage';
import type { KeyValueStorage } from '@/storage/key-value';

import { documentStorage, isBoolean, isCount, isRecord, isString, pick } from './persist';

interface PointsState extends PointsLedger {
  /** Soma um ganho. O mesmo id não soma de novo. */
  award: (award: PointsAward) => void;
  /** Apagar progresso (configurações). */
  resetPoints: () => void;
}

export const POINTS_KEY = 'numa.points';

function parseBreakdown(value: unknown): PointsBreakdown | null {
  if (!isRecord(value)) return null;
  const { hits, stars, newStage, total, capped } = value;
  if (!isCount(hits) || !isCount(stars) || !isCount(newStage) || !isCount(total)) return null;
  if (!isBoolean(capped)) return null;
  return { hits, stars, newStage, total, capped };
}

function parseAward(value: unknown): PointsAward | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.day)) return null;
  const points = parseBreakdown(value.points);
  return points && { id: value.id, day: value.day, points };
}

export const pointsSpec: DocumentSpec<PointsLedger> = {
  version: 1,
  parse: (doc) => {
    const savedDays = isRecord(doc.days) ? doc.days : {};
    const days = Object.fromEntries(Object.entries(savedDays).filter(([, v]) => isCount(v)));
    const awards = Array.isArray(doc.awards) ? doc.awards.map(parseAward) : [];
    return {
      total: pick(doc.total, isCount, 0),
      days: days as Record<string, number>,
      awards: awards.filter((a): a is PointsAward => a !== null),
    };
  },
};

export function createPointsStore(storage: KeyValueStorage = deviceStorage) {
  return create<PointsState>()(
    persist(
      (set) => ({
        ...emptyLedger(),
        award: (award) => set((state) => addAward(state, award)),
        resetPoints: () => set(emptyLedger()),
      }),
      {
        name: POINTS_KEY,
        version: pointsSpec.version,
        storage: documentStorage(storage, pointsSpec),
        partialize: ({ total, days, awards }) => ({ total, days, awards }),
      },
    ),
  );
}

export const usePoints = createPointsStore();

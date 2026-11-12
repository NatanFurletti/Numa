// Teste do dia (docs/DATA.md §1.5), salvo em `numa.daily`: o apelido e a tentativa de cada dia.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type DailyAttempt, type DailyAttempts, pruneDailyAttempts } from '@/engine/daily';
import type { ProblemAttempt } from '@/engine/types';
import type { DocumentSpec } from '@/storage/document';
import { deviceStorage } from '@/storage/device-storage';
import type { KeyValueStorage } from '@/storage/key-value';

import { documentStorage, isBoolean, isCount, isRecord, isString, pick } from './persist';

interface DailyData {
  /** Apelido no ranking. null = ainda não escolhido. */
  nickname: string | null;
  attempts: DailyAttempts;
}

export interface DailyResult {
  correct: number;
  total: number;
  elapsedMs: number;
  problems: ProblemAttempt[];
}

interface DailyState extends DailyData {
  setNickname: (nickname: string) => void;
  /** As contas do dia apareceram: a tentativa do dia está usada. `day` é a data local. */
  startAttempt: (day: string) => void;
  /** Uma tentativa por dia: um resultado já gravado não é trocado. */
  finishAttempt: (day: string, result: DailyResult) => void;
  /** O resultado do dia chegou ao ranking. */
  markSubmitted: (day: string) => void;
}

export const DAILY_KEY = 'numa.daily';

const isNickname = (v: unknown): v is string | null => v === null || isString(v);

function parseAttempt(value: unknown): DailyAttempt | null {
  if (!isRecord(value)) return null;
  if (value.status === 'started') return { status: 'started' };
  const { status, correct, total, elapsedMs, problems, submitted } = value;
  if (status !== 'done' || !isCount(correct) || !isCount(total) || !isCount(elapsedMs)) return null;
  if (!Array.isArray(problems) || !isBoolean(submitted)) return null;
  return { status, correct, total, elapsedMs, problems, submitted };
}

export const dailySpec: DocumentSpec<DailyData> = {
  version: 1,
  parse: (doc) => {
    const saved = isRecord(doc.attempts) ? doc.attempts : {};
    const attempts: DailyAttempts = {};
    for (const [day, value] of Object.entries(saved)) {
      const attempt = parseAttempt(value);
      if (attempt) attempts[day] = attempt;
    }
    return { nickname: pick(doc.nickname, isNickname, null), attempts };
  },
};

export function createDailyStore(storage: KeyValueStorage = deviceStorage) {
  return create<DailyState>()(
    persist(
      (set) => ({
        nickname: null,
        attempts: {},
        setNickname: (nickname) => set({ nickname }),
        startAttempt: (day) =>
          set((state) =>
            state.attempts[day]
              ? state
              : {
                  attempts: pruneDailyAttempts(
                    { ...state.attempts, [day]: { status: 'started' } },
                    day,
                  ),
                },
          ),
        finishAttempt: (day, result) =>
          set((state) =>
            state.attempts[day]?.status === 'done'
              ? state
              : {
                  attempts: {
                    ...state.attempts,
                    [day]: { status: 'done', ...result, submitted: false },
                  },
                },
          ),
        markSubmitted: (day) =>
          set((state) => {
            const attempt = state.attempts[day];
            if (attempt?.status !== 'done') return state;
            return { attempts: { ...state.attempts, [day]: { ...attempt, submitted: true } } };
          }),
      }),
      {
        name: DAILY_KEY,
        version: dailySpec.version,
        storage: documentStorage(storage, dailySpec),
        partialize: ({ nickname, attempts }) => ({ nickname, attempts }),
      },
    ),
  );
}

export const useDaily = createDailyStore();

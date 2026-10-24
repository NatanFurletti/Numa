// Liga o `persist` do Zustand aos documentos de src/storage (schemaVersion + migrações).

import type { PersistStorage } from 'zustand/middleware';

import { type DocumentSpec, readDocument, writeDocument } from '@/storage/document';
import type { KeyValueStorage } from '@/storage/key-value';

function reportError(key: string, problem: unknown) {
  if (problem instanceof Error) console.warn(`[numa] não deu para ler ${key}:`, problem);
  else console.warn(`[numa] não deu para ler ${key}: ${String(problem)}. Usando os padrões.`);
}

export function documentStorage<T extends object>(
  storage: KeyValueStorage,
  spec: DocumentSpec<T>,
): PersistStorage<T> {
  return {
    getItem: async (key) => {
      try {
        const { data, error } = readDocument(await storage.getItem(key), spec);
        if (error) reportError(key, error);
        return data === null ? null : { state: data, version: spec.version };
      } catch (problem) {
        reportError(key, problem);
        return null;
      }
    },
    setItem: (key, value) => storage.setItem(key, writeDocument(value.state, spec)),
    removeItem: (key) => storage.removeItem(key),
  };
}

// ---------- Validação campo a campo ----------

export const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
export const isString = (v: unknown): v is string => typeof v === 'string';
export const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0;
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Valor salvo se passar no teste; senão, o padrão. */
export function pick<T>(value: unknown, test: (v: unknown) => v is T, fallback: T): T {
  return test(value) ? value : fallback;
}

export function oneOf<T extends string>(options: readonly T[]) {
  return (v: unknown): v is T =>
    typeof v === 'string' && (options as readonly string[]).includes(v);
}

/** Armazenamento chave → texto (docs/ARCHITECTURE.md §3). Na Fase 2, ganha uma versão com sincronização. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Versão em memória, para os testes. */
export function memoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
    dump: () => Object.fromEntries(data),
  };
}

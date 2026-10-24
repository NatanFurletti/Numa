// Persistência dos três stores (docs/DATA.md §1): grava no formato do DATA, lê de volta,
// e volta aos padrões quando o dado está ilegível.

import { createInitialStages } from '@/engine/progression';
import { memoryStorage } from '@/storage/key-value';
import { buildRecord } from '@/test-utils/rounds';

import { createHistoryStore, HISTORY_KEY } from './history';
import { createProgressStore, PROGRESS_KEY } from './progress';
import { createSettingsStore, SETTINGS_KEY } from './settings';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('numa.settings', () => {
  it('grava com schemaVersion e lê de volta numa nova sessão', async () => {
    const storage = memoryStorage();
    const first = createSettingsStore(storage);
    await first.persist.rehydrate();

    first.getState().setInputDirection('rtl');
    first.getState().markDirectionTipSeen();
    await flush();

    expect(JSON.parse(storage.dump()[SETTINGS_KEY])).toEqual({
      schemaVersion: 1,
      language: 'pt',
      inputDirection: 'rtl',
      onboardingDone: false,
      hasSeenDirectionTip: true,
    });

    const second = createSettingsStore(storage);
    await second.persist.rehydrate();

    expect(second.getState()).toMatchObject({ inputDirection: 'rtl', hasSeenDirectionTip: true });
  });

  it('campos com valores inválidos voltam ao padrão, os outros são mantidos', async () => {
    const storage = memoryStorage({
      [SETTINGS_KEY]: JSON.stringify({
        schemaVersion: 1,
        language: 'xx',
        inputDirection: 'rtl',
        hasSeenDirectionTip: 'sim',
      }),
    });
    const store = createSettingsStore(storage);
    await store.persist.rehydrate();

    expect(store.getState()).toMatchObject({
      language: 'pt',
      inputDirection: 'rtl',
      hasSeenDirectionTip: false,
    });
  });

  it('dado ilegível: volta aos padrões e registra o erro', async () => {
    const storage = memoryStorage({ [SETTINGS_KEY]: '{quebrado' });
    const store = createSettingsStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().inputDirection).toBe('ltr');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(SETTINGS_KEY));
  });

  it('falha ao ler o armazenamento: volta aos padrões e registra o erro', async () => {
    const storage = { ...memoryStorage(), getItem: () => Promise.reject(new Error('cheio')) };
    const store = createSettingsStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().inputDirection).toBe('ltr');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(SETTINGS_KEY), expect.any(Error));
  });
});

describe('numa.progress', () => {
  it('grava estágios, nivelamento e sequência, e lê de volta', async () => {
    const storage = memoryStorage();
    const first = createProgressStore(storage);
    await first.persist.rehydrate();

    first.getState().recordRound(buildRecord({ correct: 10 }), '2026-10-23');
    await flush();

    const saved = JSON.parse(storage.dump()[PROGRESS_KEY]);
    expect(saved.schemaVersion).toBe(1);
    expect(saved.stages['L01-A']).toMatchObject({ bestStars: 3, attempts: 1 });
    expect(saved.streak).toEqual({ current: 1, best: 1, lastPlayedDate: '2026-10-23' });

    const second = createProgressStore(storage);
    await second.persist.rehydrate();

    expect(second.getState().stages['L01-B'].unlocked).toBe(true);
    expect(second.getState().streak.current).toBe(1);
  });

  it('etapas faltando ou estragadas voltam ao padrão (ex.: níveis novos numa atualização)', async () => {
    const storage = memoryStorage({
      [PROGRESS_KEY]: JSON.stringify({
        schemaVersion: 1,
        stages: {
          'L01-A': {
            unlocked: true,
            bestStars: 2,
            attempts: 3,
            consecutiveFails: 0,
            pendingWarmup: false,
          },
          'L01-B': { unlocked: 'talvez' },
          'L99-Z': {
            unlocked: true,
            bestStars: 3,
            attempts: 1,
            consecutiveFails: 0,
            pendingWarmup: false,
          },
        },
        placementDone: true,
        streak: { current: 'x' },
      }),
    });
    const store = createProgressStore(storage);
    await store.persist.rehydrate();

    const { stages, placementDone, streak } = store.getState();
    expect(stages['L01-A']).toMatchObject({ bestStars: 2, attempts: 3 });
    expect(stages['L01-B']).toEqual(createInitialStages()['L01-B']);
    expect(stages['L15-C']).toEqual(createInitialStages()['L15-C']);
    expect(stages['L99-Z']).toBeUndefined();
    expect(placementDone).toBe(true);
    expect(streak).toEqual({ current: 0, best: 0 });
  });
});

describe('numa.history', () => {
  it('grava as rodadas e lê de volta, descartando registros estragados', async () => {
    const storage = memoryStorage();
    const first = createHistoryStore(storage);
    await first.persist.rehydrate();

    first.getState().addRound(buildRecord({ id: 'a' }));
    await flush();

    const saved = JSON.parse(storage.dump()[HISTORY_KEY]);
    expect(saved.schemaVersion).toBe(1);
    expect(saved.rounds).toHaveLength(1);

    saved.rounds.push({ id: 'estragado' });
    await storage.setItem(HISTORY_KEY, JSON.stringify(saved));

    const second = createHistoryStore(storage);
    await second.persist.rehydrate();

    expect(second.getState().rounds.map((r) => r.id)).toEqual(['a']);
  });

  it('sem a lista de rodadas: conteúdo inválido, volta ao padrão', async () => {
    const storage = memoryStorage({ [HISTORY_KEY]: '{"schemaVersion":1,"rounds":"nada"}' });
    const store = createHistoryStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().rounds).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

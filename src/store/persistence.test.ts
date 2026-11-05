// Persistência dos três stores (docs/DATA.md §1): grava no formato do DATA, lê de volta,
// e volta aos padrões quando o dado está ilegível.

import { getLocales } from 'expo-localization';

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
afterEach(() => {
  warn.mockRestore();
  jest
    .mocked(getLocales)
    .mockImplementation(() => [{ languageTag: 'pt-BR', languageCode: 'pt' } as never]);
});

describe('numa.settings', () => {
  it('grava com schemaVersion e lê de volta numa nova sessão', async () => {
    const storage = memoryStorage();
    const first = createSettingsStore(storage);
    await first.persist.rehydrate();

    first.getState().setInputDirection('rtl');
    first.getState().markDirectionTipSeen();
    await flush();

    expect(JSON.parse(storage.dump()[SETTINGS_KEY])).toEqual({
      schemaVersion: 2,
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
        schemaVersion: 2,
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

  it('migra da v1 (M4): o idioma salvo não foi escolhido, então volta a seguir o aparelho', async () => {
    jest
      .mocked(getLocales)
      .mockReturnValue([{ languageTag: 'en-US', languageCode: 'en' } as never]);
    // Fixture real gravada pelo M4.
    const fixture =
      '{"schemaVersion":1,"language":"pt","inputDirection":"rtl","onboardingDone":false,"hasSeenDirectionTip":true}';
    const storage = memoryStorage({ [SETTINGS_KEY]: fixture });
    const store = createSettingsStore(storage);
    await store.persist.rehydrate();

    expect(store.getState()).toMatchObject({
      language: 'en',
      inputDirection: 'rtl',
      hasSeenDirectionTip: true,
    });
  });

  it('o idioma escolhido fica salvo', async () => {
    const storage = memoryStorage();
    const first = createSettingsStore(storage);
    await first.persist.rehydrate();

    first.getState().setLanguage('en');
    await flush();

    const second = createSettingsStore(storage);
    await second.persist.rehydrate();
    expect(second.getState().language).toBe('en');
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
  it('o nivelamento desbloqueia até a etapa inicial e fica salvo', async () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    await store.persist.rehydrate();

    store.getState().completePlacement([true, true, false]);
    await flush();

    const saved = JSON.parse(storage.dump()[PROGRESS_KEY]);
    expect(saved.placementDone).toBe(true);
    expect(saved.stages['L06V-A'].unlocked).toBe(true);
  });

  it('apagar o progresso volta ao início e salva', async () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    await store.persist.rehydrate();
    store.getState().recordRound(buildRecord({ correct: 10 }), '2026-10-23');

    store.getState().resetProgress();
    await flush();

    expect(store.getState().stages).toEqual(createInitialStages());
    expect(store.getState().streak).toEqual({ current: 0, best: 0 });
    expect(JSON.parse(storage.dump()[PROGRESS_KEY]).stages['L01-B'].unlocked).toBe(false);
  });

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

  it('níveis inseridos antes do ponto onde a pessoa está ficam liberados (versões armadas, D-028)', async () => {
    const open = {
      unlocked: true,
      bestStars: 2,
      attempts: 1,
      consecutiveFails: 0,
      pendingWarmup: false,
    };
    // Progresso salvo antes das versões armadas: liberado até o L07-A.
    const old: Record<string, typeof open> = {};
    for (const id of ['L01', 'L02', 'L03', 'L04', 'L05', 'L06']) {
      for (const letter of ['A', 'B', 'C']) old[`${id}-${letter}`] = open;
    }
    old['L07-A'] = { ...open, bestStars: 0, attempts: 0 };
    const storage = memoryStorage({
      [PROGRESS_KEY]: JSON.stringify({ schemaVersion: 1, stages: old, placementDone: false }),
    });
    const store = createProgressStore(storage);
    await store.persist.rehydrate();

    const { stages } = store.getState();
    expect(stages['L06V-A'].unlocked).toBe(true);
    expect(stages['L07V-C'].unlocked).toBe(true);
    expect(stages['L07V-C'].bestStars).toBe(0);
    expect(stages['L06-C']).toMatchObject({ bestStars: 2, attempts: 1 });
    expect(stages['L07-B'].unlocked).toBe(false);
    expect(stages['L08V-A'].unlocked).toBe(false);
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
  it('apagar o histórico remove todas as rodadas', async () => {
    const store = createHistoryStore(memoryStorage());
    await store.persist.rehydrate();
    store.getState().addRound(buildRecord({ id: 'a' }));

    store.getState().clearHistory();

    expect(store.getState().rounds).toEqual([]);
  });

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

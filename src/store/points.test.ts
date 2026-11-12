import { NO_POINTS } from '@/engine/points';
import { memoryStorage } from '@/storage/key-value';

import { createPointsStore, POINTS_KEY, usePoints } from './points';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const award = (id: string, total: number, day = '2026-11-12') => ({
  id,
  day,
  points: { ...NO_POINTS, hits: total, total },
});

beforeEach(() => usePoints.setState(usePoints.getInitialState(), true));

describe('usePoints', () => {
  it('começa do zero (sem pontos retroativos)', () => {
    const { total, days, awards } = usePoints.getState();

    expect({ total, days, awards }).toEqual({ total: 0, days: {}, awards: [] });
  });

  it('soma cada ganho uma vez só', () => {
    usePoints.getState().award(award('a', 30));
    usePoints.getState().award(award('a', 30));
    usePoints.getState().award(award('b', 5));

    expect(usePoints.getState().total).toBe(35);
    expect(usePoints.getState().days).toEqual({ '2026-11-12': 35 });
  });

  it('zera os pontos (apagar progresso)', () => {
    usePoints.getState().award(award('a', 30));

    usePoints.getState().resetPoints();

    expect(usePoints.getState().total).toBe(0);
    expect(usePoints.getState().awards).toEqual([]);
  });
});

describe('numa.points', () => {
  it('grava com schemaVersion e lê de volta numa nova sessão', async () => {
    const storage = memoryStorage();
    const first = createPointsStore(storage);
    await first.persist.rehydrate();
    first.getState().award(award('a', 30));
    await flush();

    expect(JSON.parse(storage.dump()[POINTS_KEY])).toEqual({
      schemaVersion: 1,
      total: 30,
      days: { '2026-11-12': 30 },
      awards: [award('a', 30)],
    });

    const second = createPointsStore(storage);
    await second.persist.rehydrate();
    expect(second.getState().total).toBe(30);
    expect(second.getState().awards).toEqual([award('a', 30)]);
  });

  it('itens estragados são descartados', async () => {
    const storage = memoryStorage({
      [POINTS_KEY]: JSON.stringify({
        schemaVersion: 1,
        total: 40,
        days: { '2026-11-12': 40, '2026-11-11': -3, x: 'a' },
        awards: [award('a', 40), { id: 'b' }, null, { ...award('c', 1), points: { total: 'x' } }],
      }),
    });
    const store = createPointsStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().total).toBe(40);
    expect(store.getState().days).toEqual({ '2026-11-12': 40 });
    expect(store.getState().awards).toEqual([award('a', 40)]);
  });

  it('total estragado volta a zero', async () => {
    const storage = memoryStorage({
      [POINTS_KEY]: JSON.stringify({ schemaVersion: 1, total: -5 }),
    });
    const store = createPointsStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().total).toBe(0);
    expect(store.getState().awards).toEqual([]);
  });
});

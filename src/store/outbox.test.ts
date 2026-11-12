import { GAME_CONFIG } from '@/engine/config/game-config';
import { memoryStorage } from '@/storage/key-value';

import { createOutboxStore, OUTBOX_KEY, useOutbox } from './outbox';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => useOutbox.setState(useOutbox.getInitialState(), true));

describe('useOutbox', () => {
  it('começa vazia', () => {
    expect(useOutbox.getState().roundIds).toEqual([]);
  });

  it('guarda as rodadas na ordem em que foram jogadas, sem repetir', () => {
    useOutbox.getState().enqueue('a');
    useOutbox.getState().enqueue('b');
    useOutbox.getState().enqueue('a');

    expect(useOutbox.getState().roundIds).toEqual(['a', 'b']);
  });

  it('tira da fila as rodadas resolvidas', () => {
    ['a', 'b', 'c'].forEach((id) => useOutbox.getState().enqueue(id));

    useOutbox.getState().remove('b');

    expect(useOutbox.getState().roundIds).toEqual(['a', 'c']);
  });

  it('esvazia a fila (quem desliga o envio não manda o que estava esperando)', () => {
    useOutbox.getState().enqueue('a');

    useOutbox.getState().clear();

    expect(useOutbox.getState().roundIds).toEqual([]);
  });

  it('fila cheia: descarta as mais antigas', () => {
    const max = GAME_CONFIG.sync.maxPendingRounds;

    for (let i = 0; i <= max; i++) useOutbox.getState().enqueue(`r${i}`);

    const { roundIds } = useOutbox.getState();
    expect(roundIds).toHaveLength(max);
    expect(roundIds[0]).toBe('r1');
    expect(roundIds.at(-1)).toBe(`r${max}`);
  });
});

describe('numa.outbox', () => {
  it('grava com schemaVersion e lê de volta numa nova sessão', async () => {
    const storage = memoryStorage();
    const first = createOutboxStore(storage);
    await first.persist.rehydrate();
    first.getState().enqueue('a');
    await flush();

    expect(JSON.parse(storage.dump()[OUTBOX_KEY])).toEqual({ schemaVersion: 1, roundIds: ['a'] });

    const second = createOutboxStore(storage);
    await second.persist.rehydrate();
    expect(second.getState().roundIds).toEqual(['a']);
  });

  it('itens estragados são descartados', async () => {
    const storage = memoryStorage({
      [OUTBOX_KEY]: JSON.stringify({ schemaVersion: 1, roundIds: ['a', 7, null, 'b'] }),
    });
    const store = createOutboxStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().roundIds).toEqual(['a', 'b']);
  });

  it('sem a lista: fila vazia', async () => {
    const storage = memoryStorage({ [OUTBOX_KEY]: JSON.stringify({ schemaVersion: 1 }) });
    const store = createOutboxStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().roundIds).toEqual([]);
  });
});

import { memoryStorage } from '@/storage/key-value';

import { createDailyStore, DAILY_KEY, useDaily } from './daily';

const DAY = '2026-11-11';
const RESULT = {
  correct: 1,
  total: 1,
  elapsedMs: 4000,
  problems: [
    {
      a: 1,
      b: 1,
      op: 'add' as const,
      expected: 2,
      answer: 2,
      correct: true,
      timeMs: 4000,
      keystrokes: 1,
    },
  ],
};

beforeEach(() => useDaily.setState(useDaily.getInitialState(), true));

describe('useDaily', () => {
  it('começa sem apelido e sem tentativas', () => {
    expect(useDaily.getState()).toMatchObject({ nickname: null, attempts: {} });
  });

  it('guarda o apelido', () => {
    useDaily.getState().setNickname('Zé');

    expect(useDaily.getState().nickname).toBe('Zé');
  });

  it('marca a tentativa do dia como começada', () => {
    useDaily.getState().startAttempt(DAY);

    expect(useDaily.getState().attempts[DAY]).toEqual({ status: 'started' });
  });

  it('terminar guarda o resultado, ainda não enviado ao ranking', () => {
    useDaily.getState().startAttempt(DAY);
    useDaily.getState().finishAttempt(DAY, RESULT);

    expect(useDaily.getState().attempts[DAY]).toEqual({
      status: 'done',
      ...RESULT,
      submitted: false,
    });
  });

  it('uma tentativa por dia: o resultado já gravado não é trocado', () => {
    useDaily.getState().finishAttempt(DAY, RESULT);

    useDaily.getState().startAttempt(DAY);
    useDaily.getState().finishAttempt(DAY, { ...RESULT, correct: 0 });

    expect(useDaily.getState().attempts[DAY]).toMatchObject({ status: 'done', correct: 1 });
  });

  it('marca o resultado como enviado', () => {
    useDaily.getState().finishAttempt(DAY, RESULT);

    useDaily.getState().markSubmitted(DAY);

    expect(useDaily.getState().attempts[DAY]).toMatchObject({ submitted: true });
  });

  it('marcar como enviado um dia sem resultado não faz nada', () => {
    useDaily.getState().startAttempt(DAY);

    useDaily.getState().markSubmitted(DAY);
    useDaily.getState().markSubmitted('2026-11-12');

    expect(useDaily.getState().attempts).toEqual({ [DAY]: { status: 'started' } });
  });

  it('ao começar um dia novo, descarta as tentativas antigas', () => {
    useDaily.getState().startAttempt('2026-10-01');

    useDaily.getState().startAttempt(DAY);

    expect(Object.keys(useDaily.getState().attempts)).toEqual([DAY]);
  });
});

describe('persistência do teste do dia', () => {
  it('salva e recarrega o apelido e as tentativas', async () => {
    const storage = memoryStorage();
    const store = createDailyStore(storage);
    store.getState().setNickname('Zé');
    store.getState().finishAttempt(DAY, RESULT);

    const reloaded = createDailyStore(storage);
    await reloaded.persist.rehydrate();

    expect(JSON.parse(storage.dump()[DAILY_KEY])).toMatchObject({ schemaVersion: 1 });
    expect(reloaded.getState().nickname).toBe('Zé');
    expect(reloaded.getState().attempts[DAY]).toMatchObject({ status: 'done', correct: 1 });
  });

  it('descarta tentativas estragadas e mantém o resto', async () => {
    const storage = memoryStorage({
      [DAILY_KEY]: JSON.stringify({
        schemaVersion: 1,
        nickname: 42,
        attempts: {
          '2026-11-10': { status: 'started' },
          '2026-11-11': { status: 'done', correct: 'muitas' },
          '2026-11-12': 'lixo',
        },
      }),
    });
    const store = createDailyStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().nickname).toBeNull();
    expect(store.getState().attempts).toEqual({ '2026-11-10': { status: 'started' } });
  });

  it('documento sem tentativas: começa vazio', async () => {
    const storage = memoryStorage({ [DAILY_KEY]: JSON.stringify({ schemaVersion: 1 }) });
    const store = createDailyStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().attempts).toEqual({});
  });
});

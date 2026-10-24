import { systemClock } from './clock';
import { formatSeconds, toIsoString } from './format';
import { localDateString } from './date';
import { newId } from './id';
import { randomSeed } from './seed';

describe('systemClock', () => {
  it('lê o horário atual do sistema', () => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });

    expect(systemClock.now()).toBe(1_700_000_000_000);

    jest.useRealTimers();
  });
});

describe('randomSeed', () => {
  it('gera um inteiro não negativo de 31 bits', () => {
    const seeds = Array.from({ length: 50 }, randomSeed);

    expect(seeds.every((s) => Number.isInteger(s) && s >= 0 && s < 2 ** 31)).toBe(true);
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });
});

describe('formatSeconds', () => {
  it('mostra segundos inteiros arredondados', () => {
    expect(formatSeconds(52_000)).toBe('52s');
    expect(formatSeconds(52_400)).toBe('52s');
    expect(formatSeconds(52_600)).toBe('53s');
    expect(formatSeconds(0)).toBe('0s');
  });
});

describe('toIsoString', () => {
  it('converte o horário em ISO 8601 (UTC)', () => {
    expect(toIsoString(Date.UTC(2026, 9, 23, 12, 0, 0))).toBe('2026-10-23T12:00:00.000Z');
  });
});

describe('newId', () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('gera um uuid v4 diferente a cada chamada', () => {
    const ids = Array.from({ length: 20 }, newId);

    expect(ids.every((id) => UUID.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(20);
  });

  it('funciona sem crypto.randomUUID (aparelhos antigos)', () => {
    const original = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: undefined,
      configurable: true,
    });

    try {
      expect(newId()).toMatch(UUID);
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: original,
        configurable: true,
      });
    }
  });
});

describe('localDateString', () => {
  it('data local no formato YYYY-MM-DD', () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
    expect(localDateString(new Date(2026, 11, 31, 0, 1).getTime())).toBe('2026-12-31');
  });
});

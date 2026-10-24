import { systemClock } from './clock';
import { formatSeconds } from './format';
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

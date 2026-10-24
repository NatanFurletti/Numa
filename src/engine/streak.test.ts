import { currentStreak, daysBetween, emptyStreak, recordPlay, type Streak } from './streak';

const streak = (current: number, best: number, lastPlayedDate?: string): Streak => ({
  current,
  best,
  lastPlayedDate,
});

describe('recordPlay', () => {
  it('a primeira rodada começa a sequência em 1', () => {
    expect(recordPlay(emptyStreak(), '2026-10-23')).toEqual(streak(1, 1, '2026-10-23'));
  });

  it('jogar de novo no mesmo dia não muda a sequência', () => {
    const s = streak(4, 6, '2026-10-23');

    expect(recordPlay(s, '2026-10-23')).toEqual(s);
  });

  it('jogou ontem e hoje → soma 1', () => {
    expect(recordPlay(streak(4, 6, '2026-10-22'), '2026-10-23')).toEqual(
      streak(5, 6, '2026-10-23'),
    );
  });

  it('pulou um dia ou mais → volta a 1, mantendo o recorde', () => {
    expect(recordPlay(streak(4, 6, '2026-10-20'), '2026-10-23')).toEqual(
      streak(1, 6, '2026-10-23'),
    );
  });

  it('atualiza o recorde quando a sequência passa dele', () => {
    expect(recordPlay(streak(6, 6, '2026-10-22'), '2026-10-23').best).toBe(7);
  });

  it('funciona na virada do mês e do ano', () => {
    expect(recordPlay(streak(2, 2, '2026-10-31'), '2026-11-01').current).toBe(3);
    expect(recordPlay(streak(2, 2, '2026-12-31'), '2027-01-01').current).toBe(3);
  });

  it('respeita anos bissextos', () => {
    expect(recordPlay(streak(2, 2, '2028-02-28'), '2028-02-29').current).toBe(3);
    expect(recordPlay(streak(2, 2, '2027-02-28'), '2027-03-01').current).toBe(3);
  });

  it('se o relógio do aparelho voltou no tempo, não quebra a sequência nem conta dia', () => {
    const s = streak(4, 6, '2026-10-23');

    expect(recordPlay(s, '2026-10-21')).toEqual(s);
  });
});

describe('currentStreak (o que aparece no início)', () => {
  it('mostra a sequência se a pessoa jogou hoje ou ontem', () => {
    expect(currentStreak(streak(5, 5, '2026-10-23'), '2026-10-23')).toBe(5);
    expect(currentStreak(streak(5, 5, '2026-10-22'), '2026-10-23')).toBe(5);
  });

  it('mostra 0 se a sequência já foi perdida', () => {
    expect(currentStreak(streak(5, 5, '2026-10-20'), '2026-10-23')).toBe(0);
  });

  it('mostra 0 se nunca jogou', () => {
    expect(currentStreak(emptyStreak(), '2026-10-23')).toBe(0);
  });
});

describe('daysBetween', () => {
  it('conta os dias entre duas datas', () => {
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
    expect(daysBetween('2028-01-01', '2028-12-31')).toBe(365);
    expect(daysBetween('2026-10-23', '2026-10-20')).toBe(-3);
  });

  it('lança erro para data em formato inválido', () => {
    expect(() => daysBetween('23/10/2026', '2026-10-23')).toThrow();
    expect(() => daysBetween('2026-13-01', '2026-10-23')).toThrow();
  });
});

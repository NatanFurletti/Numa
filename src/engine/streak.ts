// Sequência de dias (docs/GAME_RULES.md §11).
// As datas chegam prontas no horário local, como 'YYYY-MM-DD'. Quem converte é src/lib.

export interface Streak {
  current: number;
  best: number;
  /** 'YYYY-MM-DD', horário local. */
  lastPlayedDate?: string;
}

export function emptyStreak(): Streak {
  return { current: 0, best: 0 };
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Número de dias desde 1970-01-01 (calendário gregoriano). */
function dayNumber(date: string): number {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new Error(`Data inválida: ${date}`);
  const [year, month, day] = match.slice(1).map(Number);
  const monthDays = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  if (!monthDays || day < 1 || day > monthDays) throw new Error(`Data inválida: ${date}`);

  // Algoritmo "days from civil" (Howard Hinnant).
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** Dias de `from` até `to` (negativo se `to` vem antes). */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

/** Registra que a pessoa concluiu uma rodada em `today`. */
export function recordPlay(streak: Streak, today: string): Streak {
  if (!streak.lastPlayedDate) {
    return { current: 1, best: Math.max(streak.best, 1), lastPlayedDate: today };
  }
  const gap = daysBetween(streak.lastPlayedDate, today);
  if (gap <= 0) return streak;
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastPlayedDate: today };
}

/** Sequência a mostrar hoje: 0 se a pessoa não jogou nem hoje nem ontem. */
export function currentStreak(streak: Streak, today: string): number {
  if (!streak.lastPlayedDate) return 0;
  return daysBetween(streak.lastPlayedDate, today) <= 1 ? streak.current : 0;
}

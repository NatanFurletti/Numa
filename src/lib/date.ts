/** Data local 'YYYY-MM-DD' (a sequência de dias usa o horário local, GAME_RULES §11). */
export function localDateString(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

import type { Problem } from './types';

/** Dígitos da unidade para cima: 52 → [2, 5]. */
function digitsFromUnits(n: number): number[] {
  const digits: number[] = [];
  let rest = n;
  do {
    digits.push(rest % 10);
    rest = Math.floor(rest / 10);
  } while (rest > 0);
  return digits;
}

function columns(a: number, b: number): [number, number][] {
  const da = digitsFromUnits(a);
  const db = digitsFromUnits(b);
  const size = Math.max(da.length, db.length);
  return Array.from({ length: size }, (_, i) => [da[i] ?? 0, db[i] ?? 0]);
}

/** Vai um: alguma coluna soma 10 ou mais. */
export function hasCarry(a: number, b: number): boolean {
  return columns(a, b).some(([x, y]) => x + y >= 10);
}

/** Empresta: em alguma coluna o dígito de cima é menor que o de baixo. */
export function hasBorrow(a: number, b: number): boolean {
  return columns(a, b).some(([x, y]) => x < y);
}

export function needsRegrouping(problem: Problem): boolean {
  return problem.op === 'add' ? hasCarry(problem.a, problem.b) : hasBorrow(problem.a, problem.b);
}

export function solve(problem: Problem): number {
  return problem.op === 'add' ? problem.a + problem.b : problem.a - problem.b;
}

/** Chave para detectar repetição. Na soma, a ordem dos operandos não importa. */
export function problemKey(problem: Problem): string {
  if (problem.op === 'add') {
    const [low, high] = problem.a <= problem.b ? [problem.a, problem.b] : [problem.b, problem.a];
    return `${low}+${high}`;
  }
  return `${problem.a}-${problem.b}`;
}

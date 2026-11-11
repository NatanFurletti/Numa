import type { Operation, Problem } from './types';

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

/**
 * Vai um na multiplicação por 1 dígito: alguma coluna, fora a mais alta, passa de 9
 * (47 × 6: 7 × 6 = 42, vai 4). A coluna mais alta não leva nada: só deixa o resultado maior
 * (72 × 3 = 216). A ordem dos fatores não importa. Multiplicador de 2+ dígitos sempre reagrupa.
 */
export function hasMultiplyCarry(a: number, b: number): boolean {
  const [multiplier, multiplicand] = a <= b ? [a, b] : [b, a];
  if (multiplier >= 10) return true;
  let carry = 0;
  for (const digit of digitsFromUnits(multiplicand).slice(0, -1)) {
    carry = Math.floor((digit * multiplier + carry) / 10);
    if (carry > 0) return true;
  }
  return false;
}

/** Vai um (soma e multiplicação) ou empresta (subtração). A divisão nunca reagrupa. */
export function needsRegrouping(problem: Problem): boolean {
  const { a, b } = problem;
  switch (problem.op) {
    case 'add':
      return hasCarry(a, b);
    case 'sub':
      return hasBorrow(a, b);
    case 'mul':
      return hasMultiplyCarry(a, b);
    case 'div':
      return false;
  }
}

export function solve(problem: Problem): number {
  const { a, b } = problem;
  switch (problem.op) {
    case 'add':
      return a + b;
    case 'sub':
      return a - b;
    case 'mul':
      return a * b;
    case 'div':
      return a / b;
  }
}

/** Soma e multiplicação: a ordem dos operandos não muda a conta (3 + 5 = 5 + 3). */
export function isCommutative(op: Operation): boolean {
  return op === 'add' || op === 'mul';
}

const KEY_SIGNS: Record<Operation, string> = { add: '+', sub: '-', mul: 'x', div: '/' };

/** Chave para detectar repetição. Na soma e na multiplicação, a ordem não importa. */
export function problemKey(problem: Problem): string {
  const { a, b, op } = problem;
  const [first, second] = isCommutative(op) && a > b ? [b, a] : [a, b];
  return `${first}${KEY_SIGNS[op]}${second}`;
}

import type { InputDirection } from './types';

/** Resposta sendo digitada. Os dígitos ficam na ordem em que foram digitados. */
export interface AnswerInput {
  readonly typed: readonly number[];
}

export function emptyAnswer(): AnswerInput {
  return { typed: [] };
}

export function isAnswerEmpty(input: AnswerInput): boolean {
  return input.typed.length === 0;
}

/** Acrescenta um dígito. Ignora o que não for 0–9 e o que passar do limite. */
export function typeDigit(input: AnswerInput, digit: number, maxDigits: number): AnswerInput {
  const isDigit = Number.isInteger(digit) && digit >= 0 && digit <= 9;
  if (!isDigit || input.typed.length >= maxDigits) return input;
  return { typed: [...input.typed, digit] };
}

/** Remove o último dígito digitado, qualquer que seja a direção. */
export function backspace(input: AnswerInput): AnswerInput {
  if (isAnswerEmpty(input)) return input;
  return { typed: input.typed.slice(0, -1) };
}

/**
 * Texto mostrado na tela.
 * ltr: cada dígito novo entra à direita. rtl: cada dígito novo entra à esquerda.
 */
export function displayAnswer(input: AnswerInput, direction: InputDirection): string {
  const ordered = direction === 'ltr' ? input.typed : [...input.typed].reverse();
  return ordered.join('');
}

/** Valor numérico da resposta (`07` = 7), ou null se vazia. */
export function answerValue(input: AnswerInput, direction: InputDirection): number | null {
  if (isAnswerEmpty(input)) return null;
  return Number(displayAnswer(input, direction));
}

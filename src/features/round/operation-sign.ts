import type { Operation } from '@/engine/types';

// Sinais tipográficos (− e não o hífen, × e não a letra x).
const SIGNS: Record<Operation, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

export function operationSign(op: Operation): string {
  return SIGNS[op];
}

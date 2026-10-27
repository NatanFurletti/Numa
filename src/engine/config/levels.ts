// Tabela de níveis (docs/LEVELS.md §3). É configuração, não código.
// Mudou algo aqui? Suba o rulesVersion em game-config.ts.
//
// Os ids (L01…L25, e L06V… para as versões armadas) ficam fixos: o progresso salvo usa eles.
// O número que aparece na tela é a posição na tabela (levelNumber em stages.ts).

import type { Operation } from '../types';

export type Carry = 'none' | 'required' | 'any';
export type StageLetter = 'A' | 'B' | 'C';

export interface Range {
  min: number;
  max: number;
}

export interface ProblemSpec {
  op: Operation;
  /** Faixa do 1º operando (na soma, a ordem é sorteada na hora de mostrar). */
  a: Range;
  /** Faixa do 2º operando. */
  b: Range;
  /** Vai um (soma) ou empresta (subtração). */
  carry: Carry;
  result?: { min?: number; max?: number };
}

/** inline: "24 + 73 =" numa linha. vertical: armada, um número em cima do outro (D-028). */
export type ProblemLayout = 'inline' | 'vertical';

export interface LevelConfig {
  id: string;
  /** Padrão: inline. */
  layout?: ProblemLayout;
  kind: Operation | 'mixed';
  specs: ProblemSpec[];
  stages: { id: StageLetter; timeLimitMs: number }[];
}

const D1: Range = { min: 1, max: 9 };
const D2: Range = { min: 10, max: 99 };
const D3: Range = { min: 100, max: 999 };

const s = (seconds: number) => seconds * 1000;
const stages = (a: number, b: number, c: number): LevelConfig['stages'] => [
  { id: 'A', timeLimitMs: s(a) },
  { id: 'B', timeLimitMs: s(b) },
  { id: 'C', timeLimitMs: s(c) },
];

// Faixa 1: 1 dígito
const L01: ProblemSpec = { op: 'add', a: D1, b: D1, carry: 'any', result: { max: 10 } };
const L02: ProblemSpec = { op: 'add', a: D1, b: D1, carry: 'any', result: { min: 11, max: 18 } };
const L03: ProblemSpec = { op: 'sub', a: D1, b: D1, carry: 'any', result: { min: 0 } };
const L04: ProblemSpec = {
  op: 'sub',
  a: { min: 11, max: 18 },
  b: D1,
  carry: 'any',
  result: { min: 1, max: 9 },
};

// Faixa 2: 2 dígitos com 1 dígito
const L06: ProblemSpec = { op: 'add', a: D2, b: D1, carry: 'none' };
const L07: ProblemSpec = { op: 'add', a: D2, b: D1, carry: 'required' };
const L08: ProblemSpec = { op: 'sub', a: D2, b: D1, carry: 'none' };
const L09: ProblemSpec = { op: 'sub', a: D2, b: D1, carry: 'required' };

// Faixa 3: 2 dígitos com 2 dígitos
const L11: ProblemSpec = { op: 'add', a: D2, b: D2, carry: 'none' };
const L12: ProblemSpec = { op: 'add', a: D2, b: D2, carry: 'required' };
const L13: ProblemSpec = { op: 'sub', a: D2, b: D2, carry: 'none' };
const L14: ProblemSpec = { op: 'sub', a: D2, b: D2, carry: 'required' };

// Faixa 4: 3 dígitos com 2 dígitos
const L16: ProblemSpec = { op: 'add', a: D3, b: D2, carry: 'none' };
const L17: ProblemSpec = { op: 'add', a: D3, b: D2, carry: 'required' };
const L18: ProblemSpec = { op: 'sub', a: D3, b: D2, carry: 'none' };
const L19: ProblemSpec = { op: 'sub', a: D3, b: D2, carry: 'required' };

// Faixa 5: 3 dígitos com 3 dígitos
const L21: ProblemSpec = { op: 'add', a: D3, b: D3, carry: 'none' };
const L22: ProblemSpec = { op: 'add', a: D3, b: D3, carry: 'required' };
const L23: ProblemSpec = { op: 'sub', a: D3, b: D3, carry: 'none' };
const L24: ProblemSpec = { op: 'sub', a: D3, b: D3, carry: 'required' };

/** A versão armada (mesmas contas e tempos) entra logo antes da versão na linha. */
const stackedFirst = (level: LevelConfig): LevelConfig[] => [
  { ...level, id: `${level.id}V`, layout: 'vertical' },
  level,
];

export const LEVELS: LevelConfig[] = [
  // Faixa 1: 1 dígito
  { id: 'L01', kind: 'add', specs: [L01], stages: stages(60, 45, 35) },
  { id: 'L02', kind: 'add', specs: [L02], stages: stages(70, 55, 40) },
  { id: 'L03', kind: 'sub', specs: [L03], stages: stages(60, 45, 35) },
  { id: 'L04', kind: 'sub', specs: [L04], stages: stages(70, 55, 40) },
  { id: 'L05', kind: 'mixed', specs: [L01, L02, L03, L04], stages: stages(70, 55, 40) },
  // Faixa 2: 2 dígitos com 1
  ...stackedFirst({ id: 'L06', kind: 'add', specs: [L06], stages: stages(70, 55, 45) }),
  ...stackedFirst({ id: 'L07', kind: 'add', specs: [L07], stages: stages(80, 65, 50) }),
  ...stackedFirst({ id: 'L08', kind: 'sub', specs: [L08], stages: stages(70, 55, 45) }),
  ...stackedFirst({ id: 'L09', kind: 'sub', specs: [L09], stages: stages(80, 65, 50) }),
  { id: 'L10', kind: 'mixed', specs: [L06, L07, L08, L09], stages: stages(85, 70, 55) },
  // Faixa 3: 2 dígitos com 2
  ...stackedFirst({ id: 'L11', kind: 'add', specs: [L11], stages: stages(80, 65, 50) }),
  ...stackedFirst({ id: 'L12', kind: 'add', specs: [L12], stages: stages(100, 80, 65) }),
  ...stackedFirst({ id: 'L13', kind: 'sub', specs: [L13], stages: stages(80, 65, 50) }),
  ...stackedFirst({ id: 'L14', kind: 'sub', specs: [L14], stages: stages(100, 80, 65) }),
  { id: 'L15', kind: 'mixed', specs: [L11, L12, L13, L14], stages: stages(100, 85, 70) },
  // Faixa 4: 3 dígitos com 2 (tempos iniciais, a calibrar)
  ...stackedFirst({ id: 'L16', kind: 'add', specs: [L16], stages: stages(90, 75, 60) }),
  ...stackedFirst({ id: 'L17', kind: 'add', specs: [L17], stages: stages(110, 90, 75) }),
  ...stackedFirst({ id: 'L18', kind: 'sub', specs: [L18], stages: stages(90, 75, 60) }),
  ...stackedFirst({ id: 'L19', kind: 'sub', specs: [L19], stages: stages(120, 100, 80) }),
  { id: 'L20', kind: 'mixed', specs: [L16, L17, L18, L19], stages: stages(115, 95, 80) },
  // Faixa 5: 3 dígitos com 3 (tempos iniciais, a calibrar)
  ...stackedFirst({ id: 'L21', kind: 'add', specs: [L21], stages: stages(100, 80, 65) }),
  ...stackedFirst({ id: 'L22', kind: 'add', specs: [L22], stages: stages(130, 105, 85) }),
  ...stackedFirst({ id: 'L23', kind: 'sub', specs: [L23], stages: stages(100, 80, 65) }),
  ...stackedFirst({ id: 'L24', kind: 'sub', specs: [L24], stages: stages(140, 115, 90) }),
  { id: 'L25', kind: 'mixed', specs: [L21, L22, L23, L24], stages: stages(130, 110, 90) },
];

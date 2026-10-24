export type Operation = 'add' | 'sub';

/** Uma conta: `a op b`. */
export interface Problem {
  a: number;
  b: number;
  op: Operation;
}

export type Stars = 0 | 1 | 2 | 3;

export type InputDirection = 'ltr' | 'rtl';

export type Mode = 'challenge' | 'practice' | 'warmup' | 'placement';

/** Uma conta respondida (ou não) numa rodada. Mesmo formato do histórico (docs/DATA.md §1.3). */
export interface ProblemAttempt {
  a: number;
  b: number;
  op: Operation;
  expected: number;
  /** null = não respondida (abandono). */
  answer: number | null;
  correct: boolean;
  timeMs: number;
  /** Teclas pressionadas, incluindo apagar. Mede hesitação. */
  keystrokes: number;
  /** Tentativas na tela de correção (só nas contas corrigidas). */
  reviewAttempts?: number;
}

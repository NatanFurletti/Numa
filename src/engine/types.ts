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

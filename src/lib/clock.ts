/** Relógio injetável. Em produção lê o horário do sistema; nos testes, os timers falsos do Jest. */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

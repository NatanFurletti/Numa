/** Seed nova para o gerador de contas (inteiro de 31 bits). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

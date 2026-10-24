// Nomes curtos dos níveis (docs/LEVELS.md §3). Em português direto até o i18n (M5).

const LEVEL_NAMES: Record<string, string> = {
  L01: 'Soma até 10',
  L02: 'Soma passando de 10',
  L03: 'Subtração de 1 dígito',
  L04: 'Subtração de 11 a 18',
  L05: 'Misto com 1 dígito',
  L06: 'Soma 2+1 sem vai um',
  L07: 'Soma 2+1 com vai um',
  L08: 'Subtração 2−1 sem empresta',
  L09: 'Subtração 2−1 com empresta',
  L10: 'Misto 2 e 1 dígito',
  L11: 'Soma 2+2 sem vai um',
  L12: 'Soma 2+2 com vai um',
  L13: 'Subtração 2−2 sem empresta',
  L14: 'Subtração 2−2 com empresta',
  L15: 'Misto 2 e 2 dígitos',
};

/** "L07" → "Soma 2+1 com vai um". */
export function levelName(levelId: string): string {
  return LEVEL_NAMES[levelId] ?? levelId;
}

/** "L07" → "Nível 7". */
export function levelTitle(levelId: string): string {
  return `Nível ${Number(levelId.slice(1))}`;
}

/** "L07-B" → "Nível 7 · Etapa B". */
export function stageLabel(stageId: string): string {
  const [level, letter] = stageId.split('-');
  return `${levelTitle(level)} · Etapa ${letter}`;
}

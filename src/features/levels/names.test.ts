import { allStageIds } from '@/engine/stages';

import { levelName, levelTitle, stageLabel } from './names';

describe('nomes dos níveis', () => {
  it('todo nível tem um nome curto', () => {
    const levelIds = new Set(allStageIds().map((id) => id.split('-')[0]));

    for (const id of levelIds) expect(levelName(id)).not.toBe(id);
    expect(levelName('L07')).toBe('Soma 2+1 com vai um');
  });

  it('nível desconhecido mostra o próprio id', () => {
    expect(levelName('L99')).toBe('L99');
  });

  it('"L07" → "Nível 7"; "L07-B" → "Nível 7 · Etapa B"', () => {
    expect(levelTitle('L07')).toBe('Nível 7');
    expect(stageLabel('L07-B')).toBe('Nível 7 · Etapa B');
    expect(stageLabel('L15-C')).toBe('Nível 15 · Etapa C');
  });
});

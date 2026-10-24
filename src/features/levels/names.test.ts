import { allStageIds } from '@/engine/stages';
import i18n from '@/i18n';

import { levelName, levelTitle, stageLabel } from './names';

const t = i18n.getFixedT('pt');
const tEn = i18n.getFixedT('en');

describe('nomes dos níveis', () => {
  it('todo nível tem um nome curto, nos dois idiomas', () => {
    const levelIds = new Set(allStageIds().map((id) => id.split('-')[0]));

    for (const id of levelIds) {
      expect(levelName(t, id)).not.toBe(id);
      expect(levelName(tEn, id)).not.toBe(id);
    }
    expect(levelName(t, 'L07')).toBe('Soma 2+1 com vai um');
    expect(levelName(tEn, 'L07')).toBe('Add 2+1, with carrying');
  });

  it('nível desconhecido mostra o próprio id', () => {
    expect(levelName(t, 'L99')).toBe('L99');
  });

  it('"L07" → "Nível 7"; "L07-B" → "Nível 7 · Etapa B"', () => {
    expect(levelTitle(t, 'L07')).toBe('Nível 7');
    expect(stageLabel(t, 'L07-B')).toBe('Nível 7 · Etapa B');
    expect(stageLabel(t, 'L15-C')).toBe('Nível 15 · Etapa C');
    expect(stageLabel(tEn, 'L07-B')).toBe('Level 7 · Stage B');
  });
});

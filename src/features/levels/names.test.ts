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

  it('o número na tela é a posição na tabela, não o id', () => {
    expect(levelTitle(t, 'L01')).toBe('Nível 1');
    expect(levelTitle(t, 'L07V')).toBe('Nível 8');
    expect(levelTitle(t, 'L07')).toBe('Nível 9');
    expect(stageLabel(t, 'L07-B')).toBe('Nível 9 · Etapa B');
    expect(stageLabel(t, 'L25-C')).toBe('Nível 41 · Etapa C');
    expect(stageLabel(tEn, 'L07-B')).toBe('Level 9 · Stage B');
  });

  it('a versão armada leva "(armada)" no nome', () => {
    expect(levelName(t, 'L12V')).toBe('Soma 2+2 com vai um (armada)');
    expect(levelName(tEn, 'L12V')).toBe('Add 2+2, with carrying (stacked)');
  });
});

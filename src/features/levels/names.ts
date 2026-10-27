// Nomes e rótulos dos níveis e etapas, traduzidos (src/i18n).

import type { TFunction } from 'i18next';

import { levelNumber } from '@/engine/stages';
import type { Translation } from '@/i18n/pt';

type LevelId = keyof Translation['levels']['names'];

/** "L07" → "Soma 2+1 com vai um". Nível desconhecido mostra o próprio id. */
export function levelName(t: TFunction, levelId: string): string {
  return t(`levels.names.${levelId as LevelId}`, { defaultValue: levelId });
}

/** "L07" → "Nível 9": o número é a posição na tabela, não o id (D-028). */
export function levelTitle(t: TFunction, levelId: string): string {
  return t('levels.level', { n: levelNumber(levelId) });
}

/** "L07-B" → "Nível 9 · Etapa B". */
export function stageLabel(t: TFunction, stageId: string): string {
  const [level, letter] = stageId.split('-');
  return t('levels.stage', { n: levelNumber(level), letter });
}

import { allStageIds } from '@/engine/stages';

/** Ids de todas as etapas jogáveis (para gerar as páginas estáticas da web). */
export function playableStageIds(): string[] {
  return allStageIds();
}

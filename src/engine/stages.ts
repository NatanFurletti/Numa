import { LEVELS, type LevelConfig, type ProblemLayout, type StageLetter } from './config/levels';

export interface Stage {
  /** Ex.: 'L07-B'. */
  id: string;
  levelId: string;
  letter: StageLetter;
  timeLimitMs: number;
  level: LevelConfig;
}

function buildStages(levels: LevelConfig[]): Stage[] {
  return levels.flatMap((level) =>
    level.stages.map((st) => ({
      id: `${level.id}-${st.id}`,
      levelId: level.id,
      letter: st.id,
      timeLimitMs: st.timeLimitMs,
      level,
    })),
  );
}

const STAGES = buildStages(LEVELS);

/** Ids de todas as etapas, na ordem de progressão. */
export function allStageIds(): string[] {
  return STAGES.map((st) => st.id);
}

export function stageIndex(stageId: string): number {
  const index = STAGES.findIndex((st) => st.id === stageId);
  if (index < 0) throw new Error(`Etapa inexistente: ${stageId}`);
  return index;
}

export function getStage(stageId: string): Stage {
  return STAGES[stageIndex(stageId)];
}

export function nextStageId(stageId: string): string | null {
  return STAGES[stageIndex(stageId) + 1]?.id ?? null;
}

export function previousStageId(stageId: string): string | null {
  return STAGES[stageIndex(stageId) - 1]?.id ?? null;
}

/** Número do nível na tela: a posição na tabela ('L06V' → 6, 'L06' → 7). */
export function levelNumber(levelId: string): number {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  if (index < 0) throw new Error(`Nível inexistente: ${levelId}`);
  return index + 1;
}

/** Como as contas da etapa aparecem: na linha ou armadas. */
export function stageLayout(stageId: string): ProblemLayout {
  return getStage(stageId).level.layout ?? 'inline';
}

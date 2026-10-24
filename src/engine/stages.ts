import { LEVELS, type LevelConfig, type StageLetter } from './config/levels';

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

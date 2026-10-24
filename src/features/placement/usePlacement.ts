// Fluxo do teste de nivelamento (docs/GAME_RULES.md §10, D-026):
// introdução → blocos de 5 contas, um por checkpoint → para no primeiro bloco reprovado → resultado.

import { useState } from 'react';

import { GAME_CONFIG } from '@/engine/config/game-config';
import { isCheckpointPassed, nextCheckpoint, placementStartStageId } from '@/engine/placement';
import type { RoundRecord } from '@/engine/round-record';
import { randomSeed } from '@/lib/seed';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

export type PlacementPhase = 'intro' | 'block' | 'between' | 'done';

export function usePlacement({ seed }: { seed?: number } = {}) {
  const [baseSeed] = useState(() => seed ?? randomSeed());
  const [phase, setPhase] = useState<PlacementPhase>('intro');
  const [results, setResults] = useState<boolean[]>([]);
  const completePlacement = useProgress((s) => s.completePlacement);
  const markOnboardingDone = useSettings((s) => s.markOnboardingDone);

  /** Checkpoint em jogo (ou o próximo, entre blocos). */
  const levelId = nextCheckpoint(results);

  const finishBlock = (record: RoundRecord) => {
    const passed = isCheckpointPassed(
      levelId!,
      { correct: record.correct, problemTimesMs: record.problems.map((p) => p.timeMs) },
      { firstBlock: results.length === 0 },
    );
    const next = [...results, passed];
    setResults(next);
    if (nextCheckpoint(next)) {
      setPhase('between');
      return;
    }
    // Acabou: aplica já, para valer mesmo se a pessoa fechar o app nesta tela.
    completePlacement(next);
    markOnboardingDone();
    setPhase('done');
  };

  return {
    phase,
    levelId,
    /** Número do bloco atual (1, 2, …) e o total de blocos possíveis. */
    blockNumber: results.length + 1,
    totalBlocks: GAME_CONFIG.placement.checkpoints.length,
    /** Seed de cada bloco: uma por bloco, para as contas não se repetirem. */
    blockSeed: baseSeed + results.length,
    startStageId: placementStartStageId(results),
    start: () => setPhase('block'),
    next: () => setPhase('block'),
    finishBlock,
  };
}

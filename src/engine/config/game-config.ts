// Números ajustáveis do jogo (marcados com ⚙️ em docs/GAME_RULES.md).
// Mudou algum valor aqui ou em levels.ts? Suba o rulesVersion.

export interface StarRules {
  /** Acerto mínimo para 1 e 2 estrelas. */
  minAccuracy: number;
  /** Acerto mínimo para 3 estrelas. */
  threeStarAccuracy: number;
  /** Fração máxima do tempo-limite usada para 3 estrelas. */
  threeStarTimeRatio: number;
}

export interface GameConfig {
  rulesVersion: number;
  problemsPerRound: number;
  maxAnswerDigits: number;
  stars: StarRules;
  records: {
    /** Acerto mínimo para a rodada valer como melhor tempo ou "mais rápido que da última vez". */
    minAccuracy: number;
  };
  warmup: {
    /** Falhas seguidas na mesma etapa que disparam o aquecimento. */
    failsToTrigger: number;
    /** Tempo extra quando não existe etapa anterior (0.5 = +50%). */
    noPreviousStageTimeBonus: number;
  };
  placement: {
    checkpoints: string[];
    problemsPerCheckpoint: number;
    minCorrect: number;
    /** Fração do tempo-limite da etapa B. */
    timeRatio: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  rulesVersion: 1,
  problemsPerRound: 10,
  maxAnswerDigits: 4,
  stars: {
    minAccuracy: 0.8,
    threeStarAccuracy: 0.95,
    threeStarTimeRatio: 0.75,
  },
  records: {
    minAccuracy: 1,
  },
  warmup: {
    failsToTrigger: 3,
    noPreviousStageTimeBonus: 0.5,
  },
  placement: {
    checkpoints: ['L02', 'L05', 'L07', 'L10', 'L12', 'L15'],
    problemsPerCheckpoint: 5,
    minCorrect: 4,
    timeRatio: 0.5,
  },
};

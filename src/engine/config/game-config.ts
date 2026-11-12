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
  review: {
    /** Tentativas erradas na mesma conta antes de aparecer "Ver resposta". */
    wrongTriesBeforeReveal: number;
  };
  history: {
    /** Rodadas guardadas no histórico. As mais antigas são descartadas. */
    maxRounds: number;
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
    /** Fração do tempo-limite da etapa B (para o bloco de contas; a barra de tempo usa este valor). */
    timeRatio: number;
    /** No primeiro bloco, ignora o tempo da 1ª conta (a pessoa ainda está conhecendo o teclado). */
    ignoreFirstProblemTime: boolean;
  };
  daily: {
    /** Teste do dia: uma conta de cada nível, na ordem (do mais fácil ao mais difícil). */
    levels: string[];
    /** Dias de tentativas guardados no aparelho. */
    keepDays: number;
    nickname: {
      minLength: number;
      maxLength: number;
      /** Palavras recusadas no apelido (comparadas sem acento e sem maiúsculas). */
      blockedWords: string[];
    };
  };
  /** Conferência das rodadas no servidor (D-034). */
  verification: {
    /** Tempo mínimo de uma conta respondida. Abaixo disso, a rodada enviada é recusada. */
    minAnswerTimeMs: number;
    /** Tempo máximo de uma conta (o teste do dia não tem limite, mas o envio tem). */
    maxProblemTimeMs: number;
    /** Máximo de teclas contadas em uma conta. */
    maxKeystrokes: number;
  };
  sync: {
    /** Rodadas esperando envio guardadas no aparelho. As mais antigas são descartadas. */
    maxPendingRounds: number;
  };
  /** Pontos (docs/GAME_RULES.md §14, D-035). */
  points: {
    /** Peso de cada faixa de níveis, pelo número do id (L07V e L07 → 7). */
    levelWeights: { from: number; to: number; weight: number }[];
    /** Acerto mínimo para os acertos renderem. */
    minAccuracy: number;
    /** Rodadas de desafio concluídas por etapa e por dia em que os acertos rendem. */
    roundsPerStagePerDay: number;
    /** Bônus por estrela acima da melhor nota anterior (× peso). */
    perNewStar: number;
    /** Bônus da primeira vez que passa da etapa (× peso). */
    newStage: number;
    /** Peso de cada acerto do teste do dia. */
    dailyWeight: number;
    /** Dias de pontos guardados no aparelho (para o ranking da semana). */
    keepDays: number;
    /** Ganhos guardados no aparelho (a tela de resultado lê daqui). */
    keepAwards: number;
  };
}

export const GAME_CONFIG: GameConfig = {
  rulesVersion: 4,
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
  review: {
    wrongTriesBeforeReveal: 2,
  },
  history: {
    maxRounds: 500,
  },
  warmup: {
    failsToTrigger: 3,
    noPreviousStageTimeBonus: 0.5,
  },
  placement: {
    // prettier-ignore
    checkpoints: [
      'L02', 'L05', 'L07', 'L10', 'L12', 'L15', 'L17', 'L20', 'L22', 'L25',
      'L27', 'L30', 'L32', 'L35',
    ],
    problemsPerCheckpoint: 5,
    minCorrect: 4,
    timeRatio: 0.5,
    ignoreFirstProblemTime: true,
  },
  daily: {
    // Soma, subtração, tabuada, divisão; depois as mesmas quatro, mais difíceis.
    levels: ['L02', 'L04', 'L07', 'L09', 'L27', 'L29', 'L12', 'L14', 'L32', 'L33'],
    keepDays: 7,
    nickname: {
      minLength: 2,
      maxLength: 16,
      // prettier-ignore
      blockedWords: [
        'merda', 'porra', 'caralho', 'puta', 'puto', 'buceta', 'cu', 'viado', 'foda', 'fodase',
        'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigger', 'nigga', 'fag',
      ],
    },
  },
  verification: {
    minAnswerTimeMs: 250,
    maxProblemTimeMs: 24 * 60 * 60 * 1000,
    maxKeystrokes: 1000,
  },
  sync: {
    maxPendingRounds: 200,
  },
  points: {
    levelWeights: [
      { from: 1, to: 5, weight: 1 }, // 1 dígito
      { from: 6, to: 10, weight: 2 }, // 2d ± 1d
      { from: 11, to: 15, weight: 3 }, // 2d ± 2d
      { from: 16, to: 20, weight: 4 }, // 3d ± 2d
      { from: 21, to: 25, weight: 5 }, // 3d ± 3d
      { from: 26, to: 30, weight: 2 }, // tabuada e divisão de 1 dígito
      { from: 31, to: 35, weight: 4 }, // 2d × 1d e divisão de 2 dígitos
    ],
    minAccuracy: 0.5,
    roundsPerStagePerDay: 3,
    perNewStar: 5,
    newStage: 10,
    dailyWeight: 3,
    keepDays: 14,
    keepAwards: 100,
  },
};

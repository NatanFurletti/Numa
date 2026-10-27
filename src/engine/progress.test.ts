import {
  applyPlacement,
  applyRound,
  createInitialProgress,
  isStageUnlocked,
  playModeFor,
  type Progress,
  type FinishedRound,
} from './progress';

const DAY1 = '2026-10-23';
const DAY2 = '2026-10-24';

function round(overrides: Partial<FinishedRound> = {}): FinishedRound {
  return {
    stageId: 'L01-A',
    mode: 'challenge',
    status: 'completed',
    stars: 2,
    correct: 9,
    total: 10,
    elapsedMs: 50_000,
    ...overrides,
  };
}

function failTimes(progress: Progress, times: number): Progress {
  let p = progress;
  for (let i = 0; i < times; i++) p = applyRound(p, round({ stars: 0, correct: 5 }), DAY1);
  return p;
}

describe('createInitialProgress', () => {
  it('só a L01-A desbloqueada, sem nivelamento e sem sequência', () => {
    const progress = createInitialProgress();

    expect(isStageUnlocked(progress, 'L01-A')).toBe(true);
    expect(isStageUnlocked(progress, 'L01-B')).toBe(false);
    expect(progress.placementDone).toBe(false);
    expect(progress.streak).toEqual({ current: 0, best: 0 });
  });
});

describe('applyRound', () => {
  it('desafio com ⭐⭐ guarda a nota e desbloqueia a próxima etapa', () => {
    const progress = applyRound(createInitialProgress(), round(), DAY1);

    expect(progress.stages['L01-A']).toMatchObject({ bestStars: 2, attempts: 1 });
    expect(isStageUnlocked(progress, 'L01-B')).toBe(true);
  });

  it('qualquer rodada concluída conta para a sequência de dias', () => {
    const p1 = applyRound(createInitialProgress(), round({ mode: 'practice', stars: null }), DAY1);
    const p2 = applyRound(p1, round({ mode: 'warmup', stars: null }), DAY2);

    expect(p2.streak).toEqual({ current: 2, best: 2, lastPlayedDate: DAY2 });
  });

  it('rodada abandonada não muda nada', () => {
    const before = createInitialProgress();

    expect(applyRound(before, round({ status: 'abandoned', stars: null }), DAY1)).toBe(before);
  });

  it('treino livre não mexe nas etapas', () => {
    const before = createInitialProgress();

    const after = applyRound(before, round({ mode: 'practice', stars: null }), DAY1);

    expect(after.stages).toBe(before.stages);
  });

  it('3 falhas seguidas marcam o aquecimento; o aquecimento zera as falhas', () => {
    const failed = failTimes(createInitialProgress(), 3);

    expect(failed.stages['L01-A']).toMatchObject({ consecutiveFails: 3, pendingWarmup: true });

    const warmedUp = applyRound(failed, round({ mode: 'warmup', stars: null }), DAY1);

    expect(warmedUp.stages['L01-A']).toMatchObject({ consecutiveFails: 0, pendingWarmup: false });
    expect(warmedUp.stages['L01-A'].attempts).toBe(3);
  });

  it('desafio sem estrelas calculadas é tratado como 0 estrelas', () => {
    const progress = applyRound(createInitialProgress(), round({ stars: null }), DAY1);

    expect(progress.stages['L01-A']).toMatchObject({ bestStars: 0, consecutiveFails: 1 });
  });
});

describe('playModeFor', () => {
  it('pedido de desafio vira aquecimento quando a etapa tem aquecimento pendente', () => {
    const failed = failTimes(createInitialProgress(), 3);

    expect(playModeFor(failed, 'L01-A', 'challenge')).toBe('warmup');
    expect(playModeFor(createInitialProgress(), 'L01-A', 'challenge')).toBe('challenge');
  });

  it('treino livre e aquecimento continuam como foram pedidos', () => {
    const failed = failTimes(createInitialProgress(), 3);

    expect(playModeFor(failed, 'L01-A', 'practice')).toBe('practice');
    expect(playModeFor(createInitialProgress(), 'L01-A', 'warmup')).toBe('warmup');
  });
});

describe('isStageUnlocked', () => {
  it('etapa desconhecida não está desbloqueada', () => {
    expect(isStageUnlocked(createInitialProgress(), 'L99-A')).toBe(false);
  });
});

describe('applyPlacement', () => {
  it('desbloqueia tudo até a etapa inicial, com 0 estrelas, e marca o nivelamento como feito', () => {
    // Passou L02 e L05, falhou no L07 → começa no nível seguinte ao L05: o L06V (armado).
    const progress = applyPlacement(createInitialProgress(), [true, true, false]);

    expect(progress.placementDone).toBe(true);
    expect(isStageUnlocked(progress, 'L05-C')).toBe(true);
    expect(isStageUnlocked(progress, 'L06V-A')).toBe(true);
    expect(isStageUnlocked(progress, 'L06V-B')).toBe(false);
    expect(progress.stages['L05-C'].bestStars).toBe(0);
  });

  it('refazer com resultado pior nunca bloqueia o que já estava liberado', () => {
    const advanced = applyPlacement(createInitialProgress(), [true, true, true]);

    const redone = applyPlacement(advanced, [false]);

    expect(isStageUnlocked(redone, 'L08V-A')).toBe(true);
  });

  it('nivelamento não conta para a sequência de dias nem mexe nas etapas', () => {
    const before = createInitialProgress();

    const after = applyRound(before, round({ mode: 'placement', stars: null }), DAY1);

    expect(after).toBe(before);
  });
});

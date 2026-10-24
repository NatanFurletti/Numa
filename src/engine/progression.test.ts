import {
  applyChallengeResult,
  applyWarmupResult,
  continueStageId,
  createInitialStages,
  nextRoundMode,
  type StageProgressMap,
  unlockThrough,
  warmupTimeLimitMs,
} from './progression';
import { allStageIds } from './stages';
import type { Stars } from './types';

const result = (stars: Stars, correct = 8, elapsedMs = 50_000) => ({
  stars,
  correct,
  total: 10,
  elapsedMs,
});

function failTimes(stages: StageProgressMap, stageId: string, times: number): StageProgressMap {
  let current = stages;
  for (let i = 0; i < times; i++) current = applyChallengeResult(current, stageId, result(1));
  return current;
}

describe('estado inicial', () => {
  it('só a L01-A começa desbloqueada, todas com 0 estrelas', () => {
    const stages = createInitialStages();

    expect(Object.keys(stages)).toEqual(allStageIds());
    expect(allStageIds().filter((id) => stages[id].unlocked)).toEqual(['L01-A']);
    expect(Object.values(stages).every((s) => s.bestStars === 0 && s.attempts === 0)).toBe(true);
  });
});

describe('applyChallengeResult', () => {
  it('passa de etapa com 2 estrelas: desbloqueia a próxima', () => {
    const stages = applyChallengeResult(createInitialStages(), 'L01-A', result(2));

    expect(stages['L01-B'].unlocked).toBe(true);
  });

  it('a última etapa de um nível desbloqueia a A do próximo nível', () => {
    const stages = applyChallengeResult(createInitialStages(), 'L01-C', result(3));

    expect(stages['L02-A'].unlocked).toBe(true);
  });

  it('passar da última etapa da tabela não quebra nada', () => {
    const stages = applyChallengeResult(createInitialStages(), 'L15-C', result(3));

    expect(stages['L15-C'].bestStars).toBe(3);
  });

  it('com 0 ou 1 estrela, repete a etapa: nada novo é desbloqueado', () => {
    const one = applyChallengeResult(createInitialStages(), 'L01-A', result(1));
    const zero = applyChallengeResult(createInitialStages(), 'L01-A', result(0, 5));

    expect(one['L01-B'].unlocked).toBe(false);
    expect(zero['L01-B'].unlocked).toBe(false);
  });

  it('guarda a melhor nota, mesmo se a nova rodada for pior', () => {
    let stages = applyChallengeResult(createInitialStages(), 'L01-A', result(3, 10));

    stages = applyChallengeResult(stages, 'L01-A', result(1, 8));

    expect(stages['L01-A'].bestStars).toBe(3);
    expect(stages['L01-A'].bestCorrect).toBe(10);
  });

  it('guarda o melhor tempo entre as rodadas 100% certas', () => {
    let stages = applyChallengeResult(createInitialStages(), 'L01-A', result(3, 10, 50_000));

    stages = applyChallengeResult(stages, 'L01-A', result(3, 10, 47_000));
    stages = applyChallengeResult(stages, 'L01-A', result(1, 10, 70_000));

    expect(stages['L01-A'].bestTimeMs).toBe(47_000);
  });

  it('uma rodada mais rápida com 1 erro não vira melhor tempo', () => {
    let stages = applyChallengeResult(createInitialStages(), 'L01-A', result(3, 10, 50_000));

    stages = applyChallengeResult(stages, 'L01-A', result(2, 9, 30_000));

    expect(stages['L01-A'].bestTimeMs).toBe(50_000);
  });

  it('uma rodada rápida mas com muitos erros não vira melhor tempo', () => {
    const stages = applyChallengeResult(createInitialStages(), 'L01-A', result(0, 3, 10_000));

    expect(stages['L01-A'].bestTimeMs).toBeUndefined();
  });

  it('conta as tentativas', () => {
    const stages = failTimes(createInitialStages(), 'L01-A', 2);

    expect(stages['L01-A'].attempts).toBe(2);
  });

  it('rejogar uma etapa antiga nunca bloqueia nada', () => {
    let stages = applyChallengeResult(createInitialStages(), 'L01-A', result(2));
    stages = applyChallengeResult(stages, 'L01-B', result(2));

    stages = applyChallengeResult(stages, 'L01-A', result(0, 2));

    expect(stages['L01-B'].unlocked).toBe(true);
    expect(stages['L01-C'].unlocked).toBe(true);
  });

  it('não altera o estado anterior', () => {
    const before = createInitialStages();

    applyChallengeResult(before, 'L01-A', result(3));

    expect(before['L01-B'].unlocked).toBe(false);
    expect(before['L01-A'].attempts).toBe(0);
  });
});

describe('aquecimento', () => {
  it('conta as falhas seguidas (rodadas com menos de 2 estrelas)', () => {
    const stages = failTimes(createInitialStages(), 'L01-A', 2);

    expect(stages['L01-A'].consecutiveFails).toBe(2);
    expect(nextRoundMode(stages, 'L01-A')).toBe('challenge');
  });

  it('depois de 3 falhas seguidas, a próxima rodada é aquecimento', () => {
    const stages = failTimes(createInitialStages(), 'L01-A', 3);

    expect(stages['L01-A'].pendingWarmup).toBe(true);
    expect(nextRoundMode(stages, 'L01-A')).toBe('warmup');
  });

  it('depois do aquecimento, o contador volta a 0 e a próxima rodada é desafio', () => {
    const stages = applyWarmupResult(failTimes(createInitialStages(), 'L01-A', 3), 'L01-A');

    expect(stages['L01-A']).toMatchObject({ consecutiveFails: 0, pendingWarmup: false });
    expect(nextRoundMode(stages, 'L01-A')).toBe('challenge');
  });

  it('o aquecimento não conta como tentativa nem muda estrelas', () => {
    const before = failTimes(createInitialStages(), 'L01-A', 3);

    const after = applyWarmupResult(before, 'L01-A');

    expect(after['L01-A'].attempts).toBe(3);
    expect(after['L01-A'].bestStars).toBe(1);
  });

  it('passar de etapa zera o contador de falhas', () => {
    const stages = applyChallengeResult(
      failTimes(createInitialStages(), 'L01-A', 2),
      'L01-A',
      result(2),
    );

    expect(stages['L01-A'].consecutiveFails).toBe(0);
  });

  it('com etapa anterior, o aquecimento usa o tempo-limite da etapa atual', () => {
    expect(warmupTimeLimitMs('L07-B')).toBe(65_000);
  });

  it('sem etapa anterior (L01-A), o aquecimento tem 50% a mais de tempo', () => {
    expect(warmupTimeLimitMs('L01-A')).toBe(90_000);
  });
});

describe('continueStageId', () => {
  it('leva à etapa desbloqueada mais avançada', () => {
    let stages = applyChallengeResult(createInitialStages(), 'L01-A', result(2));
    stages = applyChallengeResult(stages, 'L01-B', result(2));

    expect(continueStageId(stages)).toBe('L01-C');
  });

  it('no começo, leva à L01-A', () => {
    expect(continueStageId(createInitialStages())).toBe('L01-A');
  });
});

describe('unlockThrough (nivelamento)', () => {
  it('desbloqueia todas as etapas até a indicada, com 0 estrelas', () => {
    const stages = unlockThrough(createInitialStages(), 'L03-A');

    const unlocked = allStageIds().filter((id) => stages[id].unlocked);

    expect(unlocked).toEqual(['L01-A', 'L01-B', 'L01-C', 'L02-A', 'L02-B', 'L02-C', 'L03-A']);
    expect(stages['L02-C'].bestStars).toBe(0);
    expect(continueStageId(stages)).toBe('L03-A');
  });

  it('mantém o que já tinha sido conquistado', () => {
    const before = applyChallengeResult(createInitialStages(), 'L01-A', result(3));

    const stages = unlockThrough(before, 'L01-C');

    expect(stages['L01-A'].bestStars).toBe(3);
  });
});

describe('progresso salvo sem algumas etapas (ex.: níveis novos numa versão futura)', () => {
  it('trata a etapa ausente como bloqueada e sem estrelas', () => {
    const stages = applyChallengeResult({}, 'L01-A', result(2));

    expect(stages['L01-A']).toMatchObject({ unlocked: true, bestStars: 2, attempts: 1 });
    expect(stages['L01-B'].unlocked).toBe(true);
  });

  it('o aquecimento funciona mesmo sem a etapa salva', () => {
    expect(applyWarmupResult({}, 'L01-A')['L01-A'].pendingWarmup).toBe(false);
  });

  it('o nivelamento desbloqueia etapas que não estavam salvas', () => {
    expect(unlockThrough({}, 'L01-B')['L01-B'].unlocked).toBe(true);
  });

  it('sem nada salvo, "Continuar" leva à L01-A', () => {
    expect(continueStageId({})).toBe('L01-A');
  });
});

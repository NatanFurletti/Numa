import { generateRound, generateWarmupRound } from './generator';
import { isKnownStage, setupRound } from './round-setup';
import { getStage } from './stages';

describe('setupRound', () => {
  it('desafio: contas da etapa e o tempo-limite dela', () => {
    const setup = setupRound({ stageId: 'L07-B', mode: 'challenge', seed: 11 });

    expect(setup.problems).toEqual(generateRound(getStage('L07-B'), 11));
    expect(setup.timeLimitMs).toBe(65_000);
  });

  it('treino livre: mesmas contas, sem tempo-limite', () => {
    const setup = setupRound({ stageId: 'L07-B', mode: 'practice', seed: 11 });

    expect(setup.problems).toEqual(generateRound(getStage('L07-B'), 11));
    expect(setup.timeLimitMs).toBeNull();
  });

  it('aquecimento: mistura com a etapa anterior, com o tempo da etapa atual', () => {
    const setup = setupRound({ stageId: 'L07-B', mode: 'warmup', seed: 11 });

    expect(setup.problems).toEqual(generateWarmupRound(getStage('L07-B'), getStage('L07-A'), 11));
    expect(setup.timeLimitMs).toBe(65_000);
  });

  it('aquecimento na L01-A: só contas da etapa, com 50% a mais de tempo', () => {
    const setup = setupRound({ stageId: 'L01-A', mode: 'warmup', seed: 3 });

    expect(setup.problems).toEqual(generateWarmupRound(getStage('L01-A'), null, 3));
    expect(setup.timeLimitMs).toBe(90_000);
  });

  it('lança erro para etapa inexistente', () => {
    expect(() => setupRound({ stageId: 'L99-A', mode: 'challenge', seed: 1 })).toThrow();
  });
});

describe('isKnownStage', () => {
  it('diz se a etapa existe', () => {
    expect(isKnownStage('L01-A')).toBe(true);
    expect(isKnownStage('L99-A')).toBe(false);
  });
});

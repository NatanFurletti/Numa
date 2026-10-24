import { personalComparison, resultMessage } from './feedback';

const limitMs = 60_000;

describe('resultMessage', () => {
  it('3 estrelas → perfeito', () => {
    expect(resultMessage({ correct: 10, total: 10, elapsedMs: 40_000, limitMs }).key).toBe(
      'perfect',
    );
  });

  it('2 estrelas → etapa concluída', () => {
    expect(resultMessage({ correct: 8, total: 10, elapsedMs: 55_000, limitMs }).key).toBe(
      'stageCleared',
    );
  });

  it('acerto bom com tempo estourado → foco em velocidade, com o tempo excedente', () => {
    const message = resultMessage({ correct: 10, total: 10, elapsedMs: 68_000, limitMs });

    expect(message).toEqual({ key: 'accurateButSlow', correct: 10, total: 10, overtimeMs: 8000 });
  });

  it('acerto baixo dentro do tempo → foco em precisão', () => {
    expect(resultMessage({ correct: 5, total: 10, elapsedMs: 30_000, limitMs }).key).toBe(
      'fastButInaccurate',
    );
  });

  it('acerto baixo e tempo estourado → começar pela precisão', () => {
    expect(resultMessage({ correct: 5, total: 10, elapsedMs: 70_000, limitMs }).key).toBe(
      'inaccurateAndSlow',
    );
  });
});

describe('personalComparison', () => {
  const perfect = { correct: 10, total: 10, elapsedMs: 47_000 };

  it('sem tentativa anterior, não mostra nada', () => {
    expect(personalComparison({ current: perfect })).toBeNull();
  });

  it('prioridade 1: novo melhor tempo na etapa (rodada 100% certa)', () => {
    const comparison = personalComparison({
      current: perfect,
      previous: { correct: 7, elapsedMs: 50_000 },
      previousBestTimeMs: 52_000,
    });

    expect(comparison).toEqual({ type: 'newBestTime', fromMs: 52_000, toMs: 47_000 });
  });

  it('prioridade 2: mais acertos que a tentativa anterior', () => {
    const comparison = personalComparison({
      current: { correct: 9, total: 10, elapsedMs: 47_000 },
      previous: { correct: 7, elapsedMs: 50_000 },
      previousBestTimeMs: 40_000,
    });

    expect(comparison).toEqual({ type: 'moreCorrect', diff: 2 });
  });

  it('prioridade 3: mais rápido que a tentativa anterior (rodada 100% certa)', () => {
    const comparison = personalComparison({
      current: perfect,
      previous: { correct: 10, elapsedMs: 51_000 },
      previousBestTimeMs: 40_000,
    });

    expect(comparison).toEqual({ type: 'faster', diffMs: 4000 });
  });

  it('sem melhora, não mostra nada (nunca diz "você piorou")', () => {
    const comparison = personalComparison({
      current: perfect,
      previous: { correct: 10, elapsedMs: 30_000 },
      previousBestTimeMs: 30_000,
    });

    expect(comparison).toBeNull();
  });

  it('rodada mais rápida com 1 erro não conta como recorde nem como "mais rápido"', () => {
    const comparison = personalComparison({
      current: { correct: 9, total: 10, elapsedMs: 30_000 },
      previous: { correct: 9, elapsedMs: 50_000 },
      previousBestTimeMs: 45_000,
    });

    expect(comparison).toBeNull();
  });

  it('rodada rápida com muitos erros não mostra nada', () => {
    const comparison = personalComparison({
      current: { correct: 3, total: 10, elapsedMs: 20_000 },
      previous: { correct: 3, elapsedMs: 50_000 },
      previousBestTimeMs: 45_000,
    });

    expect(comparison).toBeNull();
  });

  it('primeira rodada 100% certa, sem recorde anterior: compara com a tentativa anterior', () => {
    const comparison = personalComparison({
      current: perfect,
      previous: { correct: 10, elapsedMs: 49_000 },
    });

    expect(comparison).toEqual({ type: 'faster', diffMs: 2000 });
  });
});

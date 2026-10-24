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
  const current = { correct: 9, total: 10, elapsedMs: 47_000 };

  it('sem tentativa anterior, não mostra nada', () => {
    expect(personalComparison({ current })).toBeNull();
  });

  it('prioridade 1: novo melhor tempo na etapa', () => {
    const comparison = personalComparison({
      current,
      previous: { correct: 7, elapsedMs: 50_000 },
      previousBestTimeMs: 52_000,
    });

    expect(comparison).toEqual({ type: 'newBestTime', fromMs: 52_000, toMs: 47_000 });
  });

  it('prioridade 2: mais acertos que a tentativa anterior', () => {
    const comparison = personalComparison({
      current,
      previous: { correct: 7, elapsedMs: 50_000 },
      previousBestTimeMs: 40_000,
    });

    expect(comparison).toEqual({ type: 'moreCorrect', diff: 2 });
  });

  it('prioridade 3: mais rápido que a tentativa anterior', () => {
    const comparison = personalComparison({
      current,
      previous: { correct: 9, elapsedMs: 51_000 },
      previousBestTimeMs: 40_000,
    });

    expect(comparison).toEqual({ type: 'faster', diffMs: 4000 });
  });

  it('sem melhora, não mostra nada (nunca diz "você piorou")', () => {
    const comparison = personalComparison({
      current,
      previous: { correct: 10, elapsedMs: 30_000 },
      previousBestTimeMs: 30_000,
    });

    expect(comparison).toBeNull();
  });

  it('rodada rápida com muitos erros não conta como novo melhor tempo', () => {
    const comparison = personalComparison({
      current: { correct: 3, total: 10, elapsedMs: 20_000 },
      previous: { correct: 3, elapsedMs: 50_000 },
      previousBestTimeMs: 45_000,
    });

    expect(comparison).toEqual({ type: 'faster', diffMs: 30_000 });
  });

  it('primeiro melhor tempo com tentativas anteriores ruins: compara com a anterior', () => {
    const comparison = personalComparison({ current, previous: { correct: 9, elapsedMs: 49_000 } });

    expect(comparison).toEqual({ type: 'faster', diffMs: 2000 });
  });
});

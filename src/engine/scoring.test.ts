import { accuracy, calculateStars, isCorrect } from './scoring';

const limitMs = 60_000;

describe('calculateStars', () => {
  it('dá 0 estrelas abaixo de 80% de acerto', () => {
    expect(calculateStars({ correct: 7, total: 10, elapsedMs: 30_000, limitMs })).toBe(0);
  });

  it('dá 1 estrela com 80% de acerto quando o tempo estoura', () => {
    expect(calculateStars({ correct: 8, total: 10, elapsedMs: 61_000, limitMs })).toBe(1);
  });

  it('dá no máximo 1 estrela quando o tempo estoura, mesmo com 10/10', () => {
    expect(calculateStars({ correct: 10, total: 10, elapsedMs: 61_000, limitMs })).toBe(1);
  });

  it('dá 2 estrelas com 80% de acerto dentro do tempo', () => {
    expect(calculateStars({ correct: 8, total: 10, elapsedMs: 59_000, limitMs })).toBe(2);
  });

  it('terminar exatamente no limite conta como dentro do tempo', () => {
    expect(calculateStars({ correct: 8, total: 10, elapsedMs: 60_000, limitMs })).toBe(2);
  });

  it('dá 3 estrelas com 10/10 e 25% do tempo sobrando', () => {
    expect(calculateStars({ correct: 10, total: 10, elapsedMs: 45_000, limitMs })).toBe(3);
  });

  it('dá 2 estrelas com 10/10 quando sobra menos de 25% do tempo', () => {
    expect(calculateStars({ correct: 10, total: 10, elapsedMs: 45_001, limitMs })).toBe(2);
  });

  it('9/10 rápido não chega a 3 estrelas (90% < 95%)', () => {
    expect(calculateStars({ correct: 9, total: 10, elapsedMs: 20_000, limitMs })).toBe(2);
  });

  it('aceita 95% exatos para 3 estrelas', () => {
    expect(calculateStars({ correct: 19, total: 20, elapsedMs: 10_000, limitMs })).toBe(3);
  });

  it('usa limites configurados quando informados', () => {
    const stars = { minAccuracy: 0.5, threeStarAccuracy: 0.9, threeStarTimeRatio: 0.5 };

    expect(calculateStars({ correct: 5, total: 10, elapsedMs: 59_000, limitMs }, stars)).toBe(2);
  });
});

describe('accuracy', () => {
  it('é a fração de contas certas', () => {
    expect(accuracy(7, 10)).toBe(0.7);
  });

  it('é 0 quando não há contas', () => {
    expect(accuracy(0, 0)).toBe(0);
  });
});

describe('isCorrect', () => {
  it('compara a resposta com o resultado da conta', () => {
    expect(isCorrect({ a: 24, b: 73, op: 'add' }, 97)).toBe(true);
    expect(isCorrect({ a: 24, b: 73, op: 'add' }, 96)).toBe(false);
  });

  it('resposta vazia nunca está certa', () => {
    expect(isCorrect({ a: 5, b: 5, op: 'sub' }, null)).toBe(false);
  });
});

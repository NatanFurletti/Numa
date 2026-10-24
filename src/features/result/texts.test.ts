import { comparisonText, messageText, problemLine, scoreTimeText } from './texts';

describe('scoreTimeText', () => {
  it('dentro do tempo: "52s de 60s"', () => {
    expect(scoreTimeText({ elapsedMs: 52_000, timeLimitMs: 60_000 })).toBe('52s de 60s');
  });

  it('tempo estourado: "68s, passou 8s"', () => {
    expect(scoreTimeText({ elapsedMs: 68_000, timeLimitMs: 60_000 })).toBe('68s, passou 8s');
  });

  it('treino livre: só o tempo', () => {
    expect(scoreTimeText({ elapsedMs: 41_000, timeLimitMs: null })).toBe('41s');
  });
});

describe('messageText', () => {
  const base = { correct: 10, total: 10, overtimeMs: 0 };

  it('uma mensagem para cada situação (GAME_RULES §6.1)', () => {
    expect(messageText({ ...base, key: 'perfect' })).toBe('Perfeito! Rápido e certeiro. 🔥');
    expect(messageText({ ...base, key: 'stageCleared' })).toBe(
      'Etapa concluída! Bora para a próxima.',
    );
    expect(messageText({ ...base, key: 'fastButInaccurate' })).toBe(
      'Rápido você já é! Agora foca na precisão, sem pressa.',
    );
    expect(messageText({ ...base, key: 'inaccurateAndSlow' })).toBe(
      'Começa pela precisão. A velocidade vem com a prática. 💪',
    );
  });

  it('acerto bom com tempo estourado mostra o placar e quanto passou', () => {
    expect(messageText({ key: 'accurateButSlow', correct: 9, total: 10, overtimeMs: 8000 })).toBe(
      '9 de 10, mandou muito bem! 🎯 Agora é ganhar velocidade: você passou 8s do tempo.',
    );
  });
});

describe('comparisonText', () => {
  it('novo melhor tempo', () => {
    expect(comparisonText({ type: 'newBestTime', fromMs: 52_000, toMs: 47_000 })).toBe(
      'Seu melhor tempo aqui: 52s → 47s!',
    );
  });

  it('mais acertos, no singular e no plural', () => {
    expect(comparisonText({ type: 'moreCorrect', diff: 1 })).toBe(
      '1 acerto a mais que da última vez.',
    );
    expect(comparisonText({ type: 'moreCorrect', diff: 2 })).toBe(
      '2 acertos a mais que da última vez.',
    );
  });

  it('mais rápido', () => {
    expect(comparisonText({ type: 'faster', diffMs: 4000 })).toBe(
      'Você foi 4s mais rápido que da última vez.',
    );
  });

  it('não mostra melhoras que somem no arredondamento para segundos', () => {
    expect(comparisonText({ type: 'faster', diffMs: 300 })).toBeNull();
    expect(comparisonText({ type: 'newBestTime', fromMs: 47_400, toMs: 47_100 })).toBeNull();
  });

  it('sem comparação → nada', () => {
    expect(comparisonText(null)).toBeNull();
  });
});

describe('problemLine', () => {
  it('a conta com a resposta certa', () => {
    expect(problemLine({ a: 24, b: 73, op: 'add', expected: 97 })).toBe('24 + 73 = 97');
    expect(problemLine({ a: 52, b: 17, op: 'sub', expected: 35 })).toBe('52 − 17 = 35');
  });
});

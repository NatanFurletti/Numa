import {
  type AnswerInput,
  answerValue,
  backspace,
  displayAnswer,
  emptyAnswer,
  isAnswerEmpty,
  typeDigit,
} from './answer-input';

const typeAll = (digits: number[], maxDigits = 4): AnswerInput =>
  digits.reduce((input, d) => typeDigit(input, d, maxDigits), emptyAnswer());

describe('answer-input', () => {
  it('começa vazia e sem valor', () => {
    const input = emptyAnswer();

    expect(isAnswerEmpty(input)).toBe(true);
    expect(answerValue(input, 'ltr')).toBeNull();
    expect(displayAnswer(input, 'ltr')).toBe('');
  });

  describe('esquerda → direita', () => {
    it('digitando 1, 1, 2 mostra 1 → 11 → 112', () => {
      const shown = [0, 1, 2].map((i) => displayAnswer(typeAll([1, 1, 2].slice(0, i + 1)), 'ltr'));

      expect(shown).toEqual(['1', '11', '112']);
      expect(answerValue(typeAll([1, 1, 2]), 'ltr')).toBe(112);
    });
  });

  describe('direita → esquerda', () => {
    it('digitando 2, 1, 1 mostra 2 → 12 → 112', () => {
      const shown = [0, 1, 2].map((i) => displayAnswer(typeAll([2, 1, 1].slice(0, i + 1)), 'rtl'));

      expect(shown).toEqual(['2', '12', '112']);
      expect(answerValue(typeAll([2, 1, 1]), 'rtl')).toBe(112);
    });
  });

  it('apagar remove o último dígito digitado, em qualquer direção', () => {
    const input = backspace(typeAll([2, 1, 5]));

    expect(displayAnswer(input, 'ltr')).toBe('21');
    expect(displayAnswer(input, 'rtl')).toBe('12');
  });

  it('apagar com o campo vazio não faz nada', () => {
    expect(isAnswerEmpty(backspace(emptyAnswer()))).toBe(true);
  });

  it('ignora dígitos além do limite', () => {
    const input = typeAll([1, 2, 3, 4, 5, 6]);

    expect(displayAnswer(input, 'ltr')).toBe('1234');
  });

  it('respeita um limite configurado', () => {
    expect(displayAnswer(typeAll([9, 9, 9], 2), 'ltr')).toBe('99');
  });

  it('compara pelo valor numérico: 07 vale 7', () => {
    expect(answerValue(typeAll([0, 7]), 'ltr')).toBe(7);
    expect(answerValue(typeAll([7, 0]), 'rtl')).toBe(7);
  });

  it('ignora teclas que não são dígitos de 0 a 9', () => {
    const input = [10, -1, 2.5].reduce((acc, d) => typeDigit(acc, d, 4), emptyAnswer());

    expect(isAnswerEmpty(input)).toBe(true);
  });

  it('não altera a entrada anterior (imutável)', () => {
    const before = typeAll([3]);

    typeDigit(before, 4, 4);
    backspace(before);

    expect(displayAnswer(before, 'ltr')).toBe('3');
  });
});

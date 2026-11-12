import { nicknameProblem, normalizeNickname } from './nickname';

describe('normalizeNickname', () => {
  it('tira os espaços das pontas e junta espaços repetidos', () => {
    expect(normalizeNickname('  Ana   Banana ')).toBe('Ana Banana');
  });
});

describe('nicknameProblem', () => {
  it('aceita letras (com acento), números, espaço, ponto, hífen e sublinhado', () => {
    expect(nicknameProblem('Zé_10')).toBeNull();
    expect(nicknameProblem('Ana B.')).toBeNull();
    expect(nicknameProblem('lu-ca')).toBeNull();
  });

  it('recusa apelido curto demais (menos de 2 caracteres)', () => {
    expect(nicknameProblem('a')).toBe('tooShort');
    expect(nicknameProblem('   ')).toBe('tooShort');
  });

  it('recusa apelido longo demais (mais de 16 caracteres)', () => {
    expect(nicknameProblem('a'.repeat(17))).toBe('tooLong');
    expect(nicknameProblem('a'.repeat(16))).toBeNull();
  });

  it('recusa símbolos e emojis', () => {
    expect(nicknameProblem('ana@casa')).toBe('invalidChars');
    expect(nicknameProblem('ana🔥')).toBe('invalidChars');
  });

  it('recusa palavrões, com ou sem maiúsculas e acentos', () => {
    expect(nicknameProblem('MERDA')).toBe('blocked');
    expect(nicknameProblem('o mérda 2')).toBe('blocked');
  });

  it('não confunde palavras comuns que contêm um palavrão', () => {
    expect(nicknameProblem('computador')).toBeNull();
  });

  it('avalia o apelido já normalizado', () => {
    expect(nicknameProblem('  a  ')).toBe('tooShort');
  });
});

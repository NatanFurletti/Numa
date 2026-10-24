import { hasBorrow, hasCarry, needsRegrouping, problemKey, solve } from './carry';

describe('hasCarry (soma)', () => {
  it.each([
    [17, 38, true],
    [23, 14, false],
    [5, 5, true],
    [4, 5, false],
    [45, 7, true],
    [42, 7, false],
    [56, 56, true],
    [50, 60, true],
    [31, 8, false],
  ])('%i + %i → %s', (a, b, expected) => {
    expect(hasCarry(a, b)).toBe(expected);
  });
});

describe('hasBorrow (subtração)', () => {
  it.each([
    [52, 17, true],
    [57, 12, false],
    [15, 7, true],
    [9, 4, false],
    [40, 1, true],
    [48, 8, false],
    [30, 30, false],
    [100, 1, true],
  ])('%i − %i → %s', (a, b, expected) => {
    expect(hasBorrow(a, b)).toBe(expected);
  });
});

describe('needsRegrouping', () => {
  it('usa vai um na soma e empresta na subtração', () => {
    expect(needsRegrouping({ a: 17, b: 38, op: 'add' })).toBe(true);
    expect(needsRegrouping({ a: 52, b: 17, op: 'sub' })).toBe(true);
    expect(needsRegrouping({ a: 57, b: 12, op: 'sub' })).toBe(false);
  });
});

describe('solve', () => {
  it('calcula o resultado da conta', () => {
    expect(solve({ a: 24, b: 73, op: 'add' })).toBe(97);
    expect(solve({ a: 15, b: 7, op: 'sub' })).toBe(8);
  });
});

describe('problemKey', () => {
  it('trata 3 + 5 e 5 + 3 como a mesma conta', () => {
    expect(problemKey({ a: 3, b: 5, op: 'add' })).toBe(problemKey({ a: 5, b: 3, op: 'add' }));
  });

  it('diferencia subtrações e operações diferentes', () => {
    expect(problemKey({ a: 9, b: 4, op: 'sub' })).not.toBe(problemKey({ a: 4, b: 9, op: 'sub' }));
    expect(problemKey({ a: 9, b: 4, op: 'sub' })).not.toBe(problemKey({ a: 9, b: 4, op: 'add' }));
  });
});

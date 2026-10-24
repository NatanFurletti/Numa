import * as fc from 'fast-check';

import { createRng, randomInt, shuffle } from './rng';

const take = (rng: () => number, n: number) => Array.from({ length: n }, () => rng());

describe('createRng', () => {
  it('gera a mesma sequência para a mesma seed', () => {
    const first = take(createRng(42), 20);

    const second = take(createRng(42), 20);

    expect(second).toEqual(first);
  });

  it('gera sequências diferentes para seeds diferentes', () => {
    const a = take(createRng(1), 5);

    const b = take(createRng(2), 5);

    expect(a).not.toEqual(b);
  });

  it('sempre gera valores em [0, 1), para qualquer seed', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        return take(createRng(seed), 200).every((v) => v >= 0 && v < 1);
      }),
    );
  });
});

describe('randomInt', () => {
  it('gera inteiros dentro da faixa, incluindo as pontas', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: -50, max: 50 }),
        fc.nat(20),
        (seed, min, size) => {
          const rng = createRng(seed);
          const max = min + size;

          return take(() => randomInt(rng, min, max), 50).every(
            (v) => Number.isInteger(v) && v >= min && v <= max,
          );
        },
      ),
    );
  });

  it('alcança o mínimo e o máximo da faixa', () => {
    const rng = createRng(7);

    const values = new Set(take(() => randomInt(rng, 1, 3), 200));

    expect([...values].sort()).toEqual([1, 2, 3]);
  });
});

describe('shuffle', () => {
  it('devolve uma permutação dos mesmos itens', () => {
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.integer()), (seed, items) => {
        const result = shuffle(createRng(seed), items);

        return (
          result.length === items.length &&
          [...result].sort((x, y) => x - y).join() === [...items].sort((x, y) => x - y).join()
        );
      }),
    );
  });

  it('não altera a lista original', () => {
    const items = [1, 2, 3, 4, 5];

    shuffle(createRng(3), items);

    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('embaralha igual para a mesma seed', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);

    expect(shuffle(createRng(9), items)).toEqual(shuffle(createRng(9), items));
  });
});

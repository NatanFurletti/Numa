import { playableStageIds } from './stages';

it('lista as 123 etapas jogáveis, começando pela L01-A', () => {
  const ids = playableStageIds();

  expect(ids).toHaveLength(123);
  expect(ids[0]).toBe('L01-A');
});

import { playableStageIds } from './stages';

it('lista as 45 etapas jogáveis, começando pela L01-A', () => {
  const ids = playableStageIds();

  expect(ids).toHaveLength(45);
  expect(ids[0]).toBe('L01-A');
});

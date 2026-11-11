import { playableStageIds } from './stages';

it('lista as 153 etapas jogáveis, começando pela L01-A', () => {
  const ids = playableStageIds();

  expect(ids).toHaveLength(153);
  expect(ids[0]).toBe('L01-A');
});

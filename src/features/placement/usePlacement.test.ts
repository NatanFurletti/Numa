import { act, renderHook } from '@testing-library/react-native';

import { usePlacement } from './usePlacement';

describe('usePlacement', () => {
  it('sem seed fixa, sorteia uma; começa na introdução, no 1º checkpoint', async () => {
    const { result } = await renderHook(() => usePlacement());

    expect(Number.isInteger(result.current.blockSeed)).toBe(true);
    expect(result.current).toMatchObject({
      phase: 'intro',
      levelId: 'L02',
      blockNumber: 1,
      totalBlocks: 10,
      startStageId: 'L01-A',
    });

    await act(() => result.current.start());

    expect(result.current.phase).toBe('block');
  });
});

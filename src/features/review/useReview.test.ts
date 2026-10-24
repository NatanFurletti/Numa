import { act, renderHook } from '@testing-library/react-native';

import { useHistory } from '@/store/history';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { useReview } from './useReview';

beforeEach(() => {
  jest.useFakeTimers();
  useHistory.setState(
    { ...useHistory.getInitialState(), rounds: [buildRecord({ id: 'r1', correct: 9 })] },
    true,
  );
  useSettings.setState(useSettings.getInitialState(), true);
});
afterEach(() => jest.useRealTimers());

describe('useReview', () => {
  it('depois do ✓, espera a pausa antes de ir para a próxima', async () => {
    const { result } = await renderHook(() => useReview({ roundId: 'r1', correctPauseMs: 500 }));

    await act(() => result.current.pressDigit(1));
    await act(() => result.current.pressDigit(1));
    await act(() => result.current.submit());
    expect(result.current.status).toBe('correct');

    await act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current.status).toBe('correct');

    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.status).toBe('done');
  });

  it('Enter com a resposta à mostra passa para a próxima', async () => {
    const { result } = await renderHook(() => useReview({ roundId: 'r1' }));

    for (const d of [1, 2]) {
      await act(() => result.current.pressDigit(d));
      await act(() => result.current.submit());
    }
    await act(() => result.current.reveal());
    expect(result.current.status).toBe('revealed');

    await act(() => result.current.submit());

    expect(result.current.status).toBe('done');
  });

  it('apagar remove o último dígito', async () => {
    const { result } = await renderHook(() => useReview({ roundId: 'r1' }));

    await act(() => result.current.pressDigit(1));
    await act(() => result.current.pressBackspace());

    expect(result.current.canSubmit).toBe(false);
  });
});

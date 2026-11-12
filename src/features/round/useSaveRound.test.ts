import { renderHook } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import type { Mode, ProblemAttempt } from '@/engine/types';
import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { TEST_PROBLEMS } from '@/test-utils/rounds';

import type { RoundEnd } from './useRound';
import { useSaveRound } from './useSaveRound';

const problems = TEST_PROBLEMS.map((p): ProblemAttempt => {
  const expected = solve(p);
  return { ...p, expected, answer: expected, correct: true, timeMs: 3000, keystrokes: 1 };
});

const END: RoundEnd = {
  status: 'completed',
  startedAt: Date.UTC(2026, 10, 12, 12),
  timeLimitMs: 60_000,
  summary: { correct: 10, total: 10, elapsedMs: 30_000, overtimeMs: 0, problems },
};

async function save(mode: Mode, end: RoundEnd = END) {
  const { result } = await renderHook(() => useSaveRound());
  return result.current({ stageId: 'L01-A', mode, seed: 7, direction: 'ltr', end });
}

beforeEach(() => {
  useSettings.setState(useSettings.getInitialState(), true);
  useProgress.setState(useProgress.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
  useOutbox.setState(useOutbox.getInitialState(), true);
});

describe('useSaveRound', () => {
  it('grava a rodada no histórico e aplica no progresso', async () => {
    const record = await save('challenge');

    expect(useHistory.getState().rounds).toEqual([record]);
    expect(record).toMatchObject({ stageId: 'L01-A', mode: 'challenge', seed: 7, stars: 3 });
    expect(useProgress.getState().stages['L01-A'].bestStars).toBe(3);
  });

  it('saiu durante a contagem: não grava nada', async () => {
    const record = await save('challenge', { ...END, status: 'abandoned', startedAt: null });

    expect(record).toBeNull();
    expect(useHistory.getState().rounds).toEqual([]);
  });

  describe('fila de envio (D-034)', () => {
    it('quem aceitou enviar: a rodada de desafio entra na fila', async () => {
      useSettings.getState().setShareRounds(true);

      const record = await save('challenge');

      expect(useOutbox.getState().roundIds).toEqual([record?.id]);
    });

    it('rodada de desafio abandonada também entra na fila', async () => {
      useSettings.getState().setShareRounds(true);

      const record = await save('challenge', { ...END, status: 'abandoned' });

      expect(useOutbox.getState().roundIds).toEqual([record?.id]);
    });

    it.each([null, false])('sem consentimento (%p), nada entra na fila', async (shareRounds) => {
      useSettings.setState({ shareRounds });

      await save('challenge');

      expect(useOutbox.getState().roundIds).toEqual([]);
    });

    it.each(['practice', 'warmup', 'placement'] as const)(
      'rodada de %s não é enviada',
      async (mode) => {
        useSettings.getState().setShareRounds(true);

        await save(mode);

        expect(useOutbox.getState().roundIds).toEqual([]);
      },
    );
  });
});

import { renderHook } from '@testing-library/react-native';

import { solve } from '@/engine/carry';
import type { Mode, ProblemAttempt } from '@/engine/types';
import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { usePoints } from '@/store/points';
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
  usePoints.setState(usePoints.getInitialState(), true);
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

  describe('pontos (GAME_RULES §14)', () => {
    it('desafio concluído: soma os pontos da rodada, pelo id dela e no dia em que começou', async () => {
      const record = await save('challenge');

      // L01-A (peso 1), 10/10 com 3 estrelas pela primeira vez: 10 + 3 × 5 + 10.
      expect(usePoints.getState().total).toBe(35);
      expect(usePoints.getState().awards).toEqual([
        {
          id: record?.id,
          day: '2026-11-12',
          points: { hits: 10, stars: 15, newStage: 10, total: 35, capped: false },
        },
      ]);
    });

    it('repetir a etapa com a mesma nota rende só os acertos', async () => {
      await save('challenge');
      await save('challenge');

      expect(usePoints.getState().total).toBe(45);
    });

    it('da 4ª rodada da etapa no dia em diante, os acertos não rendem', async () => {
      for (let i = 0; i < 3; i++) await save('challenge');

      await save('challenge');

      expect(usePoints.getState().total).toBe(55);
      expect(usePoints.getState().awards.at(-1)?.points).toMatchObject({ total: 0, capped: true });
    });

    it.each(['practice', 'warmup', 'placement'] as const)('%s não rende pontos', async (mode) => {
      await save(mode);

      expect(usePoints.getState().total).toBe(0);
    });

    it('desafio abandonado não rende pontos', async () => {
      await save('challenge', { ...END, status: 'abandoned' });

      expect(usePoints.getState().total).toBe(0);
    });
  });
});

// Liga o reducer da rodada (src/engine/round.ts) ao relógio, à contagem 3-2-1 e à barra de tempo.
// Toda a regra fica no engine; aqui só entram timers e o horário atual.

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { displayAnswer, isAnswerEmpty } from '@/engine/answer-input';
import {
  createRound,
  isTimeUp,
  roundReducer,
  roundSummary,
  timeRemainingRatio,
  visibleProblems,
} from '@/engine/round';
import { type PlayMode, setupRound } from '@/engine/round-setup';
import type { InputDirection } from '@/engine/types';
import { type Clock, systemClock } from '@/lib/clock';

export type RoundPhase = 'countdown' | 'playing' | 'finished' | 'abandoned';

interface UseRoundOptions {
  stageId: string;
  mode: PlayMode;
  seed: number;
  direction: InputDirection;
  clock?: Clock;
  /** Início da contagem regressiva (3, 2, 1). */
  countdownFrom?: number;
  /** De quanto em quanto tempo a barra de tempo é redesenhada. */
  tickMs?: number;
}

const COUNTDOWN_STEP_MS = 1000;

export function useRound({
  stageId,
  mode,
  seed,
  direction,
  clock = systemClock,
  countdownFrom = 3,
  tickMs = 100,
}: UseRoundOptions) {
  const [setup] = useState(() => setupRound({ stageId, mode, seed }));
  const [state, dispatch] = useReducer(roundReducer, undefined, () =>
    createRound({ problems: setup.problems, timeLimitMs: setup.timeLimitMs, direction }),
  );
  const [countdown, setCountdown] = useState<number | null>(countdownFrom);
  const [now, setNow] = useState(() => clock.now());

  // Contagem regressiva: as contas só aparecem (e o tempo só começa) depois do 1.
  useEffect(() => {
    if (countdown === null || state.status !== 'ready') return;
    const id = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
        return;
      }
      const at = clock.now();
      setCountdown(null);
      setNow(at);
      dispatch({ type: 'start', at });
    }, COUNTDOWN_STEP_MS);
    return () => clearTimeout(id);
  }, [countdown, state.status, clock]);

  // Atualiza o horário para redesenhar a barra. O tempo em si vem das marcas de horário.
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => setNow(clock.now()), tickMs);
    return () => clearInterval(id);
  }, [state.status, clock, tickMs]);

  const pressDigit = useCallback((digit: number) => dispatch({ type: 'digit', digit }), []);
  const pressBackspace = useCallback(() => dispatch({ type: 'backspace' }), []);
  const submit = useCallback(() => dispatch({ type: 'submit', at: clock.now() }), [clock]);
  const abandon = useCallback(() => dispatch({ type: 'abandon', at: clock.now() }), [clock]);

  const ended = state.status === 'finished' || state.status === 'abandoned';
  const summary = useMemo(() => (ended ? roundSummary(state) : null), [ended, state]);

  const phase: RoundPhase =
    state.status === 'ready' ? 'countdown' : state.status === 'running' ? 'playing' : state.status;

  return {
    phase,
    countdown: state.status === 'ready' ? countdown : null,
    visible: state.status === 'running' ? visibleProblems(state) : [],
    answerText: displayAnswer(state.input, direction),
    canSubmit: state.status === 'running' && !isAnswerEmpty(state.input),
    timeLimitMs: setup.timeLimitMs,
    timeRatio: timeRemainingRatio(state, now),
    timeUp: isTimeUp(state, now),
    summary,
    pressDigit,
    pressBackspace,
    submit,
    abandon,
  };
}

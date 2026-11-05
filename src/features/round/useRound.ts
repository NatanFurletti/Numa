// Liga o reducer da rodada (src/engine/round.ts) ao relógio, à contagem 3-2-1 e à barra de tempo.
// Toda a regra fica no engine; aqui só entram timers e o horário atual.

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { displayAnswer, isAnswerEmpty } from '@/engine/answer-input';
import {
  createRound,
  isTimeUp,
  roundReducer,
  roundSummary,
  type RoundSummary,
  timeRemainingRatio,
  visibleProblems,
} from '@/engine/round';
import type { RoundSetup } from '@/engine/round-setup';
import type { InputDirection } from '@/engine/types';
import { type Clock, systemClock } from '@/lib/clock';

export type RoundPhase = 'countdown' | 'playing' | 'finished' | 'abandoned';

export interface RoundEnd {
  status: 'completed' | 'abandoned';
  summary: RoundSummary;
  /** Quando a primeira conta apareceu, ou null se saiu durante a contagem. */
  startedAt: number | null;
  /** null no treino livre. */
  timeLimitMs: number | null;
}

interface UseRoundOptions {
  /** Contas e tempo-limite (setupRound para as rodadas; setupCheckpoint para o nivelamento). */
  setup: RoundSetup;
  direction: InputDirection;
  clock?: Clock;
  /** Início da contagem regressiva (3, 2, 1). */
  countdownFrom?: number;
  /** De quanto em quanto tempo a barra de tempo é redesenhada. */
  tickMs?: number;
  /** Chamado uma vez, quando a rodada termina ou é abandonada. */
  onEnd?: (end: RoundEnd) => void;
}

const COUNTDOWN_STEP_MS = 1000;

export function useRound({
  setup: initialSetup,
  direction,
  clock = systemClock,
  countdownFrom = 3,
  tickMs = 100,
  onEnd,
}: UseRoundOptions) {
  // Fixado ao montar: a rodada não muda de contas no meio.
  const [setup] = useState(initialSetup);
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

  // Avisa o fim uma única vez (quem chama grava no histórico e navega).
  const notifyEnd = useEffectEvent((end: RoundEnd) => onEnd?.(end));
  const notified = useRef(false);
  useEffect(() => {
    if (!summary || notified.current) return;
    notified.current = true;
    notifyEnd({
      status: state.status === 'finished' ? 'completed' : 'abandoned',
      summary,
      startedAt: state.startedAt,
      timeLimitMs: setup.timeLimitMs,
    });
  }, [summary, state.status, state.startedAt, setup.timeLimitMs]);

  const phase: RoundPhase =
    state.status === 'ready' ? 'countdown' : state.status === 'running' ? 'playing' : state.status;

  return {
    phase,
    countdown: state.status === 'ready' ? countdown : null,
    visible: state.status === 'running' ? visibleProblems(state) : [],
    answerText: displayAnswer(state.input, direction),
    canSubmit: state.status === 'running' && !isAnswerEmpty(state.input),
    timeLimitMs: setup.timeLimitMs,
    layout: setup.layout,
    timeRatio: timeRemainingRatio(state, now),
    timeUp: isTimeUp(state, now),
    summary,
    pressDigit,
    pressBackspace,
    submit,
    abandon,
  };
}

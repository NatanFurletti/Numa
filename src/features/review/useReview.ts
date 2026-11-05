// Liga a correção (src/engine/review.ts) ao histórico, às configurações e à pausa do ✓.

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { displayAnswer, isAnswerEmpty } from '@/engine/answer-input';
import {
  canReveal,
  createReview,
  currentReviewItem,
  reviewAttempts,
  reviewReducer,
} from '@/engine/review';
import { isKnownStage } from '@/engine/round-setup';
import { stageLayout } from '@/engine/stages';
import { useHistory } from '@/store/history';
import { useSettings } from '@/store/settings';

interface UseReviewOptions {
  roundId: string;
  /** Quanto tempo o ✓ verde fica na tela antes da próxima conta. */
  correctPauseMs?: number;
}

export function useReview({ roundId, correctPauseMs = 700 }: UseReviewOptions) {
  const round = useHistory((s) => s.rounds.find((r) => r.id === roundId));
  const saveReviewAttempts = useHistory((s) => s.saveReviewAttempts);
  const direction = useSettings((s) => s.inputDirection);
  const hasSeenTip = useSettings((s) => s.hasSeenDirectionTip);
  const markTipSeen = useSettings((s) => s.markDirectionTipSeen);

  const [state, dispatch] = useReducer(reviewReducer, undefined, () =>
    createReview({ problems: round?.problems ?? [], direction }),
  );

  // Dica única (GAME_RULES §7): mostrada na primeira correção com contas para corrigir.
  const [showTip, setShowTip] = useState(() => !hasSeenTip && state.status !== 'done');
  useEffect(() => {
    if (showTip) markTipSeen();
  }, [showTip, markTipSeen]);

  // Acertou: o ✓ fica um instante na tela e a próxima conta entra sozinha.
  useEffect(() => {
    if (state.status !== 'correct') return;
    const id = setTimeout(() => dispatch({ type: 'next' }), correctPauseMs);
    return () => clearTimeout(id);
  }, [state.status, state.position, correctPauseMs]);

  // As tentativas vão para o histórico a cada resposta (vale mesmo se a pessoa sair no meio).
  const attempts = useMemo(() => reviewAttempts(state), [state]);
  useEffect(() => {
    if (attempts.length > 0) saveReviewAttempts(roundId, attempts);
  }, [attempts, roundId, saveReviewAttempts]);

  const pressDigit = useCallback((digit: number) => dispatch({ type: 'digit', digit }), []);
  const pressBackspace = useCallback(() => dispatch({ type: 'backspace' }), []);
  const reveal = useCallback(() => dispatch({ type: 'reveal' }), []);
  const next = useCallback(() => dispatch({ type: 'next' }), []);
  // Enter/✓: confirma a resposta, ou avança quando a resposta certa está à mostra.
  const submit = useCallback(
    () => dispatch({ type: state.status === 'revealed' ? 'next' : 'submit' }),
    [state.status],
  );

  const item = currentReviewItem(state);
  return {
    found: round !== undefined,
    /** Mesmo formato da rodada: na linha ou armada. */
    layout: round && isKnownStage(round.stageId) ? stageLayout(round.stageId) : 'inline',
    status: state.status,
    item,
    position: state.position,
    total: state.items.length,
    direction,
    answerText: displayAnswer(state.input, direction),
    canSubmit: state.status === 'answering' && !isAnswerEmpty(state.input),
    canReveal: canReveal(state),
    /** Muda a cada erro (para a tela tremer de novo). */
    wrongCount: state.wrongCount,
    /** A última tentativa nesta conta foi errada. */
    lastWrong: state.status === 'answering' && (item?.wrongTries ?? 0) > 0,
    showTip,
    dismissTip: () => setShowTip(false),
    pressDigit,
    pressBackspace,
    submit,
    reveal,
    next,
  };
}

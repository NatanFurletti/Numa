import { GAME_CONFIG } from '@/engine/config/game-config';
import { buildRoundRecord, type RoundRecord } from '@/engine/round-record';

import { useHistory } from './history';

function record(id: string): RoundRecord {
  return buildRoundRecord({
    id,
    appVersion: '0.1.0',
    stageId: 'L01-A',
    mode: 'challenge',
    status: 'completed',
    seed: 1,
    startedAt: '2026-10-23T12:00:00.000Z',
    timeLimitMs: 60_000,
    inputDirection: 'ltr',
    summary: {
      correct: 1,
      total: 2,
      elapsedMs: 10_000,
      overtimeMs: 0,
      problems: [
        { a: 1, b: 1, op: 'add', expected: 2, answer: 2, correct: true, timeMs: 1, keystrokes: 1 },
        { a: 2, b: 2, op: 'add', expected: 4, answer: 5, correct: false, timeMs: 1, keystrokes: 1 },
      ],
    },
  });
}

beforeEach(() => useHistory.setState(useHistory.getInitialState(), true));

describe('useHistory', () => {
  it('começa vazio', () => {
    expect(useHistory.getState().rounds).toEqual([]);
  });

  it('guarda as rodadas na ordem em que terminam', () => {
    useHistory.getState().addRound(record('a'));
    useHistory.getState().addRound(record('b'));

    expect(useHistory.getState().rounds.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it(`descarta as mais antigas depois de ${GAME_CONFIG.history.maxRounds} rodadas`, () => {
    for (let i = 0; i <= GAME_CONFIG.history.maxRounds; i++) {
      useHistory.getState().addRound(record(String(i)));
    }

    const { rounds } = useHistory.getState();
    expect(rounds).toHaveLength(GAME_CONFIG.history.maxRounds);
    expect(rounds[0].id).toBe('1');
  });

  it('registra as tentativas da correção em cada conta corrigida', () => {
    useHistory.getState().addRound(record('a'));

    useHistory.getState().saveReviewAttempts('a', [{ roundIndex: 1, attempts: 3 }]);

    const [round] = useHistory.getState().rounds;
    expect(round.problems[1].reviewAttempts).toBe(3);
    expect(round.problems[0].reviewAttempts).toBeUndefined();
  });

  it('a correção de uma rodada não mexe nas outras', () => {
    useHistory.getState().addRound(record('a'));
    useHistory.getState().addRound(record('b'));
    const [before] = useHistory.getState().rounds;

    useHistory.getState().saveReviewAttempts('b', [{ roundIndex: 1, attempts: 2 }]);

    const [a, b] = useHistory.getState().rounds;
    expect(a).toBe(before);
    expect(b.problems[1].reviewAttempts).toBe(2);
  });

  it('rodada inexistente na correção não muda nada', () => {
    useHistory.getState().addRound(record('a'));
    const before = useHistory.getState().rounds;

    useHistory.getState().saveReviewAttempts('x', [{ roundIndex: 0, attempts: 1 }]);

    expect(useHistory.getState().rounds).toBe(before);
  });
});

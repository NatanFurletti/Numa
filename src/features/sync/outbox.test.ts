import { localDateString } from '@/lib/date';
import type { RoundSubmission, RoundSyncOutcome, RoundSyncService } from '@/services/rounds';
import { useHistory } from '@/store/history';
import { useOutbox } from '@/store/outbox';
import { useSettings } from '@/store/settings';
import { buildRecord } from '@/test-utils/rounds';

import { flushOutbox, setSharing } from './outbox';

function fakeService(outcome: RoundSyncOutcome = 'sent') {
  const sent: RoundSubmission[] = [];
  const service: RoundSyncService = {
    submitRound: jest.fn(async (round: RoundSubmission) => {
      sent.push(round);
      return outcome;
    }),
  };
  return { service, sent };
}

/** Coloca a rodada no histórico e na fila. */
function queue(id: string) {
  useHistory.getState().addRound(buildRecord({ id }));
  useOutbox.getState().enqueue(id);
}

beforeEach(() => {
  useSettings.setState(useSettings.getInitialState(), true);
  useHistory.setState(useHistory.getInitialState(), true);
  useOutbox.setState(useOutbox.getInitialState(), true);
  useSettings.getState().setShareRounds(true);
});

describe('flushOutbox', () => {
  it('envia as rodadas da fila, na ordem, e esvazia a fila', async () => {
    queue('a');
    queue('b');
    const { service, sent } = fakeService();

    await flushOutbox(service);

    expect(sent.map((r) => r.id)).toEqual(['a', 'b']);
    expect(useOutbox.getState().roundIds).toEqual([]);
  });

  it('envia a seed, as respostas, os tempos e o dia local, e não o placar', async () => {
    queue('a');
    const { service, sent } = fakeService();

    await flushOutbox(service);

    expect(sent[0]).toEqual({
      id: 'a',
      stageId: 'L01-A',
      seed: 1,
      rulesVersion: useHistory.getState().rounds[0].rulesVersion,
      appVersion: '0.1.0',
      startedAt: '2026-10-23T12:00:00.000Z',
      // O mesmo dia que os pontos usaram no aparelho (trava por dia, D-035).
      day: localDateString(Date.parse('2026-10-23T12:00:00.000Z')),
      inputDirection: 'ltr',
      answers: expect.arrayContaining([{ answer: 2, timeMs: 4000, keystrokes: 2 }]),
    });
    expect(sent[0].answers).toHaveLength(10);
  });

  it('sem internet: para na primeira falha e deixa tudo na fila', async () => {
    queue('a');
    queue('b');
    const service: RoundSyncService = {
      submitRound: jest.fn().mockRejectedValue(new Error('sem rede')),
    };

    await flushOutbox(service);

    expect(service.submitRound).toHaveBeenCalledTimes(1);
    expect(useOutbox.getState().roundIds).toEqual(['a', 'b']);
  });

  it('rodada recusada pelo servidor sai da fila (não adianta tentar de novo)', async () => {
    queue('a');
    const { service } = fakeService('rejected');

    await flushOutbox(service);

    expect(useOutbox.getState().roundIds).toEqual([]);
  });

  it('rodada que não está mais no histórico sai da fila sem ser enviada', async () => {
    useOutbox.getState().enqueue('apagada');
    queue('a');
    const { service, sent } = fakeService();

    await flushOutbox(service);

    expect(sent.map((r) => r.id)).toEqual(['a']);
    expect(useOutbox.getState().roundIds).toEqual([]);
  });

  it('sem consentimento, não envia nada', async () => {
    queue('a');
    useSettings.setState({ shareRounds: null });
    const { service } = fakeService();

    await flushOutbox(service);

    expect(service.submitRound).not.toHaveBeenCalled();
  });

  it('consentimento desligado no meio do envio: para antes da próxima rodada', async () => {
    queue('a');
    queue('b');
    const service: RoundSyncService = {
      submitRound: jest.fn(async () => {
        useSettings.getState().setShareRounds(false);
        return 'sent' as const;
      }),
    };

    await flushOutbox(service);

    expect(service.submitRound).toHaveBeenCalledTimes(1);
  });

  it('dois pedidos ao mesmo tempo não enviam a mesma rodada duas vezes', async () => {
    queue('a');
    const { service } = fakeService();

    await Promise.all([flushOutbox(service), flushOutbox(service)]);

    expect(service.submitRound).toHaveBeenCalledTimes(1);
  });
});

describe('setSharing', () => {
  it('aceitar guarda o consentimento e mantém a fila', () => {
    useSettings.setState({ shareRounds: null });
    useOutbox.getState().enqueue('a');

    setSharing(true);

    expect(useSettings.getState().shareRounds).toBe(true);
    expect(useOutbox.getState().roundIds).toEqual(['a']);
  });

  it('recusar guarda a recusa e esvazia a fila', () => {
    useOutbox.getState().enqueue('a');

    setSharing(false);

    expect(useSettings.getState().shareRounds).toBe(false);
    expect(useOutbox.getState().roundIds).toEqual([]);
  });
});

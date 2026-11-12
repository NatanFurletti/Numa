import type { SupabaseClient } from '@supabase/supabase-js';

import type { ApiClient } from './api';
import { createSupabaseRanking } from './supabase-ranking';

const SUBMISSION = {
  day: '2026-11-11',
  nickname: 'Zé',
  rulesVersion: 3,
  answers: [{ answer: 5, timeMs: 2000, keystrokes: 1 }],
};

const fakeApi = (status = 200): ApiClient => ({ post: jest.fn(async () => status) });

function fakeClient(options: { rpc?: { data: unknown; error: Error | null } }) {
  const rpc = jest.fn(async () => options.rpc ?? { data: [], error: null });
  const from = jest.fn();
  return { client: { rpc, from } as unknown as SupabaseClient, rpc, from };
}

describe('createSupabaseRanking.submit', () => {
  it('envia as respostas para a função do servidor, e não grava no banco direto', async () => {
    const { client, from } = fakeClient({});
    const api = fakeApi();

    await createSupabaseRanking(client, api).submit(SUBMISSION);

    expect(api.post).toHaveBeenCalledWith('/api/daily', SUBMISSION);
    expect(from).not.toHaveBeenCalled();
  });

  it.each([401, 409, 422, 500])('servidor não aceitou (%p): erro', async (status) => {
    const { client } = fakeClient({});

    await expect(createSupabaseRanking(client, fakeApi(status)).submit(SUBMISSION)).rejects.toThrow(
      String(status),
    );
  });

  it('sem internet: o erro é repassado', async () => {
    const { client } = fakeClient({});
    const api: ApiClient = { post: jest.fn().mockRejectedValue(new Error('sem rede')) };

    await expect(createSupabaseRanking(client, api).submit(SUBMISSION)).rejects.toThrow('sem rede');
  });
});

describe('createSupabaseRanking.fetchRanking', () => {
  it('converte as linhas do banco', async () => {
    const row = { correct: 10, elapsed_ms: 30_000, total_players: 2 };
    const { client, rpc } = fakeClient({
      rpc: {
        data: [
          { ...row, rank: 1, nickname: 'Ana', is_me: false },
          { ...row, rank: 2, nickname: 'Zé', correct: 9, is_me: true },
        ],
        error: null,
      },
    });

    const ranking = await createSupabaseRanking(client, fakeApi()).fetchRanking('2026-11-11');

    expect(rpc).toHaveBeenCalledWith('daily_ranking', { p_day: '2026-11-11' });
    expect(ranking).toEqual({
      totalPlayers: 2,
      entries: [
        { rank: 1, nickname: 'Ana', correct: 10, elapsedMs: 30_000, isMe: false },
        { rank: 2, nickname: 'Zé', correct: 9, elapsedMs: 30_000, isMe: true },
      ],
    });
  });

  it('ninguém jogou ainda: ranking vazio', async () => {
    const { client } = fakeClient({ rpc: { data: null, error: null } });

    await expect(
      createSupabaseRanking(client, fakeApi()).fetchRanking('2026-11-11'),
    ).resolves.toEqual({
      entries: [],
      totalPlayers: 0,
    });
  });

  it('erro na consulta é repassado', async () => {
    const { client } = fakeClient({ rpc: { data: null, error: new Error('fora do ar') } });

    await expect(
      createSupabaseRanking(client, fakeApi()).fetchRanking('2026-11-11'),
    ).rejects.toThrow('fora do ar');
  });
});

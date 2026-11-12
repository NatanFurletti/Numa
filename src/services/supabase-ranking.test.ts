import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseRanking } from './supabase-ranking';

const SUBMISSION = {
  day: '2026-11-11',
  nickname: 'Zé',
  correct: 9,
  total: 10,
  elapsedMs: 41_500,
  rulesVersion: 3,
};

function fakeClient(options: {
  session?: object | null;
  signInError?: Error | null;
  insertError?: { code: string } | null;
  rpc?: { data: unknown; error: Error | null };
}) {
  const insert = jest.fn(async () => ({ error: options.insertError ?? null }));
  const signInAnonymously = jest.fn(async () => ({ error: options.signInError ?? null }));
  const rpc = jest.fn(async () => options.rpc ?? { data: [], error: null });
  const from = jest.fn(() => ({ insert }));
  const client = {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: options.session ?? null } })),
      signInAnonymously,
    },
    from,
    rpc,
  };
  return { client: client as unknown as SupabaseClient, insert, signInAnonymously, rpc, from };
}

describe('createSupabaseRanking.submit', () => {
  it('sem sessão, entra como anônimo e grava o resultado', async () => {
    const { client, insert, signInAnonymously, from } = fakeClient({});

    await createSupabaseRanking(client).submit(SUBMISSION);

    expect(signInAnonymously).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('daily_results');
    expect(insert).toHaveBeenCalledWith({
      day: '2026-11-11',
      nickname: 'Zé',
      correct: 9,
      total: 10,
      elapsed_ms: 41_500,
      rules_version: 3,
    });
  });

  it('com sessão, não entra de novo', async () => {
    const { client, signInAnonymously } = fakeClient({ session: {} });

    await createSupabaseRanking(client).submit(SUBMISSION);

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('resultado do dia já enviado (chave repetida) conta como enviado', async () => {
    const { client } = fakeClient({ session: {}, insertError: { code: '23505' } });

    await expect(createSupabaseRanking(client).submit(SUBMISSION)).resolves.toBeUndefined();
  });

  it('outros erros do banco são repassados', async () => {
    const { client } = fakeClient({ session: {}, insertError: { code: '42501' } });

    await expect(createSupabaseRanking(client).submit(SUBMISSION)).rejects.toEqual({
      code: '42501',
    });
  });

  it('falha ao entrar como anônimo é repassada, sem gravar', async () => {
    const { client, insert } = fakeClient({ signInError: new Error('sem rede') });

    await expect(createSupabaseRanking(client).submit(SUBMISSION)).rejects.toThrow('sem rede');
    expect(insert).not.toHaveBeenCalled();
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

    const ranking = await createSupabaseRanking(client).fetchRanking('2026-11-11');

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

    await expect(createSupabaseRanking(client).fetchRanking('2026-11-11')).resolves.toEqual({
      entries: [],
      totalPlayers: 0,
    });
  });

  it('erro na consulta é repassado', async () => {
    const { client } = fakeClient({ rpc: { data: null, error: new Error('fora do ar') } });

    await expect(createSupabaseRanking(client).fetchRanking('2026-11-11')).rejects.toThrow(
      'fora do ar',
    );
  });
});

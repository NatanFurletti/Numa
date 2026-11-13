import type { SupabaseClient } from '@supabase/supabase-js';

import type { DailyResultRow, RoundRow } from './repo';
import { createSupabaseRepo } from './supabase-repo';

const DAILY: DailyResultRow = {
  day: '2026-11-12',
  userId: 'user-1',
  nickname: 'Zé',
  correct: 9,
  total: 10,
  elapsedMs: 41_500,
  rulesVersion: 3,
  points: 27,
};

const ROUND: RoundRow = {
  id: '3f2c1d7e-8a4b-4c6d-9e0f-1a2b3c4d5e6f',
  userId: 'user-1',
  stageId: 'L07-B',
  seed: 4242,
  rulesVersion: 3,
  appVersion: '0.1.0',
  status: 'completed',
  startedAt: '2026-11-12T11:58:00.000Z',
  elapsedMs: 30_000,
  timeLimitMs: 60_000,
  correct: 10,
  total: 10,
  stars: 3,
  inputDirection: 'ltr',
  problems: [],
  day: '2026-11-12',
  points: 70,
};

function fakeClient(options: {
  user?: { id: string } | null;
  authError?: { status?: number } | null;
  insertError?: { code: string } | null;
  selectRows?: unknown[] | null;
  selectError?: { code: string } | null;
}) {
  const insert = jest.fn(async () => ({ error: options.insertError ?? null }));
  const result = { data: options.selectRows ?? null, error: options.selectError ?? null };
  // select(...).eq(...).eq(...): cada passo devolve a mesma consulta, que no fim é aguardada.
  const query = {
    eq: jest.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  query.eq.mockReturnValue(query);
  const select = jest.fn(() => query);
  const from = jest.fn(() => ({ insert, select }));
  const getUser = jest.fn(async () => ({
    data: { user: options.user ?? null },
    error: options.authError ?? null,
  }));
  const client = { auth: { getUser }, from };
  return { client: client as unknown as SupabaseClient, insert, from, getUser, select, query };
}

describe('createSupabaseRepo.userIdFromToken', () => {
  it('devolve o id do usuário dono do token', async () => {
    const { client, getUser } = fakeClient({ user: { id: 'user-1' } });

    await expect(createSupabaseRepo(client).userIdFromToken('token')).resolves.toBe('user-1');
    expect(getUser).toHaveBeenCalledWith('token');
  });

  it('token sem usuário: null', async () => {
    const { client } = fakeClient({ user: null });

    await expect(createSupabaseRepo(client).userIdFromToken('token')).resolves.toBeNull();
  });

  it('token recusado pelo Supabase: null', async () => {
    const { client } = fakeClient({ authError: { status: 403 } });

    await expect(createSupabaseRepo(client).userIdFromToken('velho')).resolves.toBeNull();
  });

  it('Supabase fora do ar não vira "token inválido": o erro é repassado', async () => {
    const down = { status: 503 };
    const { client } = fakeClient({ authError: down });

    await expect(createSupabaseRepo(client).userIdFromToken('token')).rejects.toBe(down);
  });

  it('erro sem status (rede) é repassado', async () => {
    const offline = {};
    const { client } = fakeClient({ authError: offline });

    await expect(createSupabaseRepo(client).userIdFromToken('token')).rejects.toBe(offline);
  });
});

describe('createSupabaseRepo.insertDailyResult', () => {
  it('grava o resultado como conferido', async () => {
    const { client, insert, from } = fakeClient({});

    const outcome = await createSupabaseRepo(client).insertDailyResult(DAILY);

    expect(outcome).toBe('inserted');
    expect(from).toHaveBeenCalledWith('daily_results');
    expect(insert).toHaveBeenCalledWith({
      day: '2026-11-12',
      user_id: 'user-1',
      nickname: 'Zé',
      correct: 9,
      total: 10,
      elapsed_ms: 41_500,
      rules_version: 3,
      verified: true,
      points: 27,
    });
  });

  it('o usuário já tem resultado nesse dia: duplicate', async () => {
    const { client } = fakeClient({ insertError: { code: '23505' } });

    await expect(createSupabaseRepo(client).insertDailyResult(DAILY)).resolves.toBe('duplicate');
  });

  it('outros erros do banco são repassados', async () => {
    const { client } = fakeClient({ insertError: { code: '42501' } });

    await expect(createSupabaseRepo(client).insertDailyResult(DAILY)).rejects.toEqual({
      code: '42501',
    });
  });
});

describe('createSupabaseRepo.insertRound', () => {
  it('grava a rodada', async () => {
    const { client, insert, from } = fakeClient({});

    const outcome = await createSupabaseRepo(client).insertRound(ROUND);

    expect(outcome).toBe('inserted');
    expect(from).toHaveBeenCalledWith('round_records');
    expect(insert).toHaveBeenCalledWith({
      id: ROUND.id,
      user_id: 'user-1',
      stage_id: 'L07-B',
      seed: 4242,
      rules_version: 3,
      app_version: '0.1.0',
      status: 'completed',
      started_at: '2026-11-12T11:58:00.000Z',
      elapsed_ms: 30_000,
      time_limit_ms: 60_000,
      correct: 10,
      total: 10,
      stars: 3,
      input_direction: 'ltr',
      problems: [],
      day: '2026-11-12',
      points: 70,
    });
  });

  it('rodada já gravada (mesmo id): duplicate', async () => {
    const { client } = fakeClient({ insertError: { code: '23505' } });

    await expect(createSupabaseRepo(client).insertRound(ROUND)).resolves.toBe('duplicate');
  });

  it('outros erros do banco são repassados', async () => {
    const { client } = fakeClient({ insertError: { code: '23503' } });

    await expect(createSupabaseRepo(client).insertRound(ROUND)).rejects.toEqual({ code: '23503' });
  });
});

describe('createSupabaseRepo.stageRounds', () => {
  it('lê o dia, a situação e as estrelas das rodadas da pessoa nessa etapa', async () => {
    const rows = [
      { day: '2026-11-12', status: 'completed', stars: 2 },
      { day: null, status: 'abandoned', stars: null },
    ];
    const { client, from, select, query } = fakeClient({ selectRows: rows });

    const result = await createSupabaseRepo(client).stageRounds('user-1', 'L07-B');

    expect(result).toEqual(rows);
    expect(from).toHaveBeenCalledWith('round_records');
    expect(select).toHaveBeenCalledWith('day, status, stars');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.eq).toHaveBeenCalledWith('stage_id', 'L07-B');
  });

  it('nenhuma rodada: lista vazia', async () => {
    const { client } = fakeClient({ selectRows: [] });

    await expect(createSupabaseRepo(client).stageRounds('user-1', 'L07-B')).resolves.toEqual([]);
  });

  it('erro do banco é repassado', async () => {
    const { client } = fakeClient({ selectError: { code: '42P01' } });

    await expect(createSupabaseRepo(client).stageRounds('user-1', 'L07-B')).rejects.toEqual({
      code: '42P01',
    });
  });
});

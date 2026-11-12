import type { SupabaseClient } from '@supabase/supabase-js';

import { apiBaseUrl, createApiClient } from './api';

function fakeClient(options: { token?: string | null; signInError?: Error | null }) {
  let session = options.token ? { access_token: options.token } : null;
  const signInAnonymously = jest.fn(async () => {
    if (options.signInError) return { data: { session: null }, error: options.signInError };
    session = { access_token: 'novo-token' };
    return { data: { session }, error: null };
  });
  const client = {
    auth: { getSession: jest.fn(async () => ({ data: { session } })), signInAnonymously },
  };
  return { client: client as unknown as SupabaseClient, signInAnonymously };
}

const fakeFetch = (status = 200) => jest.fn(async () => ({ status }) as Response);

describe('apiBaseUrl', () => {
  const saved = process.env.EXPO_PUBLIC_API_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = saved;
    jest.dontMock('react-native');
    jest.resetModules();
  });

  it('usa o endereço configurado, sem a barra do fim', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://homolog.numa.test/';

    expect(apiBaseUrl()).toBe('https://homolog.numa.test');
  });

  it('app nativo sem endereço configurado: não há servidor', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(apiBaseUrl()).toBeNull();
  });

  it('na web, as funções ficam no mesmo endereço do site', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const web = require('./api') as typeof import('./api');

    expect(web.apiBaseUrl()).toBe('');
  });
});

describe('createApiClient.post', () => {
  it('envia o JSON com o token do aparelho e devolve o status', async () => {
    const { client, signInAnonymously } = fakeClient({ token: 'token-salvo' });
    const fetchFn = fakeFetch(422);

    const status = await createApiClient(client, 'https://numa.test', fetchFn).post('/api/daily', {
      day: '2026-11-12',
    });

    expect(status).toBe(422);
    expect(signInAnonymously).not.toHaveBeenCalled();
    expect(fetchFn).toHaveBeenCalledWith('https://numa.test/api/daily', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-salvo', 'Content-Type': 'application/json' },
      body: '{"day":"2026-11-12"}',
    });
  });

  it('sem sessão, entra como anônimo antes de enviar', async () => {
    const { client, signInAnonymously } = fakeClient({});
    const fetchFn = fakeFetch();

    await createApiClient(client, '', fetchFn).post('/api/rounds', {});

    expect(signInAnonymously).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/rounds',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer novo-token' }),
      }),
    );
  });

  it('falha ao entrar como anônimo é repassada, sem enviar', async () => {
    const { client } = fakeClient({ signInError: new Error('sem rede') });
    const fetchFn = fakeFetch();

    await expect(createApiClient(client, '', fetchFn).post('/api/daily', {})).rejects.toThrow(
      'sem rede',
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('sem internet: o erro do fetch é repassado', async () => {
    const { client } = fakeClient({ token: 't' });
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(createApiClient(client, '', fetchFn).post('/api/daily', {})).rejects.toThrow(
      'Failed to fetch',
    );
  });
});

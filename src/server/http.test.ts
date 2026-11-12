/** @jest-environment node */

import { endpoint, repoFromEnv } from './http';
import type { ServerRepo } from './repo';
import type { ApiHandler } from './submissions';

const repo = {} as ServerRepo;
const NOW = 1_700_000_000_000;

function setup(handler: ApiHandler, createRepo: () => ServerRepo | null = () => repo) {
  return endpoint(handler, { createRepo, now: () => NOW });
}

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://numa.test/api/daily', { method: 'POST', body, headers });

describe('repoFromEnv', () => {
  const VARS = ['SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY'] as const;
  const saved = VARS.map((name) => process.env[name]);

  beforeEach(() => VARS.forEach((name) => delete process.env[name]));
  afterAll(() =>
    VARS.forEach((name, i) => {
      if (saved[i] === undefined) delete process.env[name];
      else process.env[name] = saved[i];
    }),
  );

  it('sem a chave secreta ou sem o endereço: null (a função responde 503)', async () => {
    expect(repoFromEnv()).toBeNull();

    process.env.SUPABASE_URL = 'https://numa.supabase.test';
    expect(repoFromEnv()).toBeNull();

    const response = await endpoint(jest.fn())(
      new Request('https://numa.test/api/daily', { method: 'POST', body: '{}' }),
    );
    expect(response.status).toBe(503);
  });

  it('usa o endereço do Supabase que o app já tem e a chave secreta do servidor', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://numa.supabase.test';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_teste';

    const repo = repoFromEnv();

    expect(repo).not.toBeNull();
    // Criado uma vez e reaproveitado nas chamadas seguintes da mesma instância.
    expect(repoFromEnv()).toBe(repo);
  });
});

describe('endpoint', () => {
  it('entrega ao handler o token, o JSON, o banco e o horário, e devolve a resposta dele', async () => {
    const handler = jest.fn<ReturnType<ApiHandler>, Parameters<ApiHandler>>(async () => ({
      status: 200,
      body: { ok: true },
    }));

    const response = await setup(handler)(
      post('{"day":"2026-11-12"}', { Authorization: 'Bearer abc.def' }),
    );

    expect(handler).toHaveBeenCalledWith(
      { token: 'abc.def', body: { day: '2026-11-12' } },
      { repo, now: NOW },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('sem o cabeçalho Authorization (ou fora do formato Bearer): token null', async () => {
    const handler = jest.fn<ReturnType<ApiHandler>, Parameters<ApiHandler>>(async () => ({
      status: 401,
      body: { error: 'unauthorized' },
    }));

    await setup(handler)(post('{}'));
    await setup(handler)(post('{}', { Authorization: 'Basic abc' }));

    expect(handler.mock.calls.map(([request]) => request.token)).toEqual([null, null]);
  });

  it('JSON ilegível chega ao handler como corpo vazio (ele responde 400)', async () => {
    const handler = jest.fn<ReturnType<ApiHandler>, Parameters<ApiHandler>>(async () => ({
      status: 400,
      body: { error: 'invalidBody' },
    }));

    const response = await setup(handler)(post('{isso não é json'));

    expect(handler.mock.calls[0][0].body).toBeUndefined();
    expect(response.status).toBe(400);
  });

  it('corpo grande demais: 413, sem chamar o handler', async () => {
    const handler = jest.fn();

    const response = await setup(handler)(post(JSON.stringify({ lixo: 'x'.repeat(40_000) })));

    expect(response.status).toBe(413);
    expect(handler).not.toHaveBeenCalled();
  });

  it('servidor sem as variáveis do Supabase: 503', async () => {
    const handler = jest.fn();

    const response = await setup(handler, () => null)(post('{}'));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'notConfigured' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('erro inesperado (banco fora do ar): 500, sem vazar o erro', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const handler: ApiHandler = async () => {
      throw new Error('senha do banco: 123');
    };

    const response = await setup(handler)(post('{}'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'serverError' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('responde ao preflight do navegador (OPTIONS) sem chamar o handler', async () => {
    const handler = jest.fn();

    const response = await setup(handler)(
      new Request('https://numa.test/api/daily', { method: 'OPTIONS' }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-headers')).toMatch(/authorization/i);
    expect(handler).not.toHaveBeenCalled();
  });

  it('outros métodos: 405', async () => {
    const response = await setup(jest.fn())(new Request('https://numa.test/api/daily'));

    expect(response.status).toBe(405);
  });

  it('as respostas liberam o uso por outras origens (app nativo e desenvolvimento local)', async () => {
    const response = await setup(async () => ({ status: 200, body: {} }))(post('{}'));

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});

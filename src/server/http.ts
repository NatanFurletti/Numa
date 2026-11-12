// Liga uma requisição HTTP (Vercel Function, em api/) a um handler de submissions.ts.

import { createClient } from '@supabase/supabase-js';

import type { ServerRepo } from './repo';
import type { ApiHandler } from './submissions';
import { createSupabaseRepo } from './supabase-repo';

/** Uma rodada enviada tem poucos KB. Acima disso, nem lê. */
const MAX_BODY_CHARS = 20_000;

// Sem cookies: quem identifica o aparelho é o token no cabeçalho. Por isso qualquer origem
// pode chamar (o app nativo e o `npm run web` local chamam de fora do site).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });

function bearerToken(request: Request): string | null {
  const match = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '');
  return match ? match[1] : null;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

let cached: ServerRepo | undefined;

/** O banco de verdade, ou null se faltam as variáveis no servidor. */
export function repoFromEnv(): ServerRepo | null {
  if (cached) return cached;
  // A URL é a mesma que o app usa; a chave secreta só existe no servidor.
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  cached = createSupabaseRepo(client);
  return cached;
}

export interface EndpointOptions {
  createRepo?: () => ServerRepo | null;
  now?: () => number;
}

export function endpoint(
  handler: ApiHandler,
  { createRepo = repoFromEnv, now = Date.now }: EndpointOptions = {},
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return json(405, { error: 'methodNotAllowed' });

    try {
      const repo = createRepo();
      if (!repo) return json(503, { error: 'notConfigured' });

      const text = await request.text();
      if (text.length > MAX_BODY_CHARS) return json(413, { error: 'tooLarge' });

      const { status, body } = await handler(
        { token: bearerToken(request), body: parseJson(text) },
        { repo, now: now() },
      );
      return json(status, body);
    } catch (problem) {
      console.error('[numa] erro na função:', problem);
      return json(500, { error: 'serverError' });
    }
  };
}

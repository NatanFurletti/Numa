// Chamadas às funções do servidor (api/, D-034). Quem envia é sempre o usuário anônimo do
// aparelho: o token dele vai no cabeçalho, e o servidor descobre o id a partir do token.

import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getSupabase } from './supabase';

export interface ApiClient {
  /** Devolve o status HTTP. Sem internet (ou sem conseguir a sessão), lança o erro. */
  post(path: string, body: unknown): Promise<number>;
}

/** Cada aparelho é um usuário anônimo do Supabase (sem e-mail nem senha), criado no primeiro envio. */
async function accessToken(client: SupabaseClient): Promise<string> {
  const { data } = await client.auth.getSession();
  if (data.session) return data.session.access_token;
  const created = await client.auth.signInAnonymously();
  if (created.error) throw created.error;
  if (!created.data.session) throw new Error('O Supabase não devolveu uma sessão.');
  return created.data.session.access_token;
}

export function createApiClient(
  client: SupabaseClient,
  baseUrl: string,
  fetchFn: typeof fetch = fetch,
): ApiClient {
  return {
    async post(path, body) {
      const token = await accessToken(client);
      const response = await fetchFn(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.status;
    },
  };
}

/**
 * Onde ficam as funções. Na web, no mesmo endereço do site ('' = caminho relativo).
 * Nos apps nativos e no `npm run web` local, vem de EXPO_PUBLIC_API_URL. null = sem servidor.
 */
export function apiBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  return Platform.OS === 'web' ? '' : null;
}

let api: ApiClient | undefined;

/** null quando o build não tem o Supabase ou o endereço das funções. */
export function defaultApiClient(): ApiClient | null {
  if (api) return api;
  const client = getSupabase();
  const baseUrl = apiBaseUrl();
  if (!client || baseUrl === null) return null;
  // `fetch` é lido na hora da chamada, e não ao criar o cliente.
  api = createApiClient(client, baseUrl, (input, init) => fetch(input, init));
  return api;
}

// Cliente do Supabase (D-031). Criado só quando alguém pede, nunca ao importar o arquivo:
// na geração das páginas estáticas da web não há `window` nem sessão para ler.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

let client: SupabaseClient | undefined;

/** null quando o app foi gerado sem as variáveis do Supabase (o ranking fica indisponível). */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isStaticRender = Platform.OS === 'web' && typeof window === 'undefined';
  if (!url || !key || isStaticRender) return null;

  const supabase = createClient(url, key, {
    auth: {
      // A sessão anônima fica no aparelho, como o resto dos dados (na web, localStorage).
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Nos apps nativos, a renovação da sessão só roda com o app aberto (guia do Expo para o Supabase).
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
  }
  client = supabase;
  return client;
}

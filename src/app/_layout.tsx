import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import '@/i18n';
import { useAppReady } from '@/features/app/useAppReady';
import { useRoundSync } from '@/features/sync/useRoundSync';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  // Espera os dados salvos carregarem (nenhuma tela abre com o progresso zerado)
  // e o idioma escolhido entrar (nenhuma tela pisca no idioma errado).
  const ready = useAppReady();
  // Envia as rodadas de desafio que estão na fila, para quem aceitou enviar (D-034).
  useRoundSync(ready);

  return (
    <>
      <StatusBar style="light" />
      {ready ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      )}
    </>
  );
}

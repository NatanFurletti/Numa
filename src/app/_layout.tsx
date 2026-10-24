import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { useStoresReady } from '@/features/app/useStoresReady';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  // Espera os dados salvos carregarem, para nenhuma tela abrir com o progresso zerado.
  const ready = useStoresReady();

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

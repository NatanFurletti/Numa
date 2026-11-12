import { router } from 'expo-router';

import { DailyPlayScreen } from '@/features/daily/DailyPlayScreen';

export default function DailyPlay() {
  // Volta para a tela do teste do dia, que fica por baixo. Aberta direto pelo endereço, troca por ela.
  const toDaily = () => (router.canGoBack() ? router.back() : router.replace('/daily'));
  return <DailyPlayScreen onDone={toDaily} onExit={toDaily} />;
}

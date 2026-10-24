import { Redirect, router } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';
import { useNeedsWelcome } from '@/features/onboarding/useNeedsWelcome';

export default function Index() {
  // Primeiro acesso: boas-vindas (SCREENS §2).
  const needsWelcome = useNeedsWelcome();
  if (needsWelcome) return <Redirect href="/welcome" />;

  return (
    <HomeScreen
      onContinue={(stageId) => router.push({ pathname: '/play/[stageId]', params: { stageId } })}
      onLevels={() => router.push('/levels')}
      onPractice={() => router.push('/practice')}
      onSettings={() => router.push('/settings')}
    />
  );
}

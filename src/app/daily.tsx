import { router } from 'expo-router';

import { DailyScreen } from '@/features/daily/DailyScreen';

export default function Daily() {
  return (
    <DailyScreen
      onStart={() => router.push('/daily-play')}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onOpenPrivacy={() => router.push('/privacy')}
    />
  );
}

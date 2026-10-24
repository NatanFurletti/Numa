import { router } from 'expo-router';

import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';

export default function Welcome() {
  return (
    <WelcomeScreen
      onPlacement={() => router.push('/placement')}
      onStart={() => router.replace('/')}
    />
  );
}

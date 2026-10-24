import { router } from 'expo-router';

import { PlacementScreen } from '@/features/placement/PlacementScreen';

export default function Placement() {
  return (
    <PlacementScreen
      onDone={() => router.dismissTo('/')}
      onExit={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

import { router } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';

export default function Index() {
  return (
    <HomeScreen
      onContinue={(stageId) => router.push({ pathname: '/play/[stageId]', params: { stageId } })}
      onLevels={() => router.push('/levels')}
    />
  );
}

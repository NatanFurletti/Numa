import { router } from 'expo-router';

import { LevelsScreen } from '@/features/levels/LevelsScreen';

export default function Levels() {
  return (
    <LevelsScreen
      onPlay={(stageId) => router.push({ pathname: '/play/[stageId]', params: { stageId } })}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

import { router } from 'expo-router';

import { LevelsScreen } from '@/features/levels/LevelsScreen';

export default function Practice() {
  return (
    <LevelsScreen
      variant="practice"
      onPlay={(stageId) =>
        router.push({ pathname: '/play/[stageId]', params: { stageId, mode: 'practice' } })
      }
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

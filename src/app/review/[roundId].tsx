import { router, useLocalSearchParams } from 'expo-router';

import { ReviewScreen } from '@/features/review/ReviewScreen';

export default function Review() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const backToResult = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/result/[roundId]', params: { roundId } });
  return (
    <ReviewScreen roundId={roundId} onBack={backToResult} onHome={() => router.dismissTo('/')} />
  );
}

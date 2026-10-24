import { router, useLocalSearchParams } from 'expo-router';

import { ResultScreen } from '@/features/result/ResultScreen';

export default function Result() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  return (
    <ResultScreen
      roundId={roundId}
      onReview={() => router.push({ pathname: '/review/[roundId]', params: { roundId } })}
      // replace: o "voltar" do aparelho não deve reabrir este resultado.
      onPlay={(stageId, mode) =>
        router.replace({ pathname: '/play/[stageId]', params: { stageId, mode } })
      }
      onHome={() => router.dismissTo('/')}
    />
  );
}

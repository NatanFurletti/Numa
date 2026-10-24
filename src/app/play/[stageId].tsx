import { router, useLocalSearchParams } from 'expo-router';

import { PlayScreen } from '@/features/round/PlayScreen';
import { playableStageIds } from '@/features/round/stages';

type Mode = 'challenge' | 'practice' | 'warmup';

function parseMode(value: string | undefined): Mode {
  return value === 'practice' || value === 'warmup' ? value : 'challenge';
}

// Uma página estática por etapa (web), para abrir /play/L07-B direto e funcionar offline.
export function generateStaticParams(): { stageId: string }[] {
  return playableStageIds().map((stageId) => ({ stageId }));
}

export default function Play() {
  const { stageId, mode } = useLocalSearchParams<{ stageId: string; mode?: string }>();
  const exit = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // replace: o "voltar" do resultado não deve reabrir a rodada já terminada.
  const showResult = (roundId: string) =>
    router.replace({ pathname: '/result/[roundId]', params: { roundId } });
  return (
    <PlayScreen
      // Uma rodada nova a cada etapa ou modo (ex.: "Próxima etapa" a partir do resultado).
      key={`${stageId}:${mode ?? ''}`}
      stageId={stageId}
      mode={parseMode(mode)}
      onExit={exit}
      onFinished={showResult}
    />
  );
}

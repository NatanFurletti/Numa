import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/**
 * Primeiro acesso: ainda não passou pelas boas-vindas e nunca jogou.
 * Quem já jogava antes do M6 (sem `onboardingDone`) não vê as boas-vindas (D-026).
 */
export function useNeedsWelcome(): boolean {
  const onboardingDone = useSettings((s) => s.onboardingDone);
  const placementDone = useProgress((s) => s.placementDone);
  const played = useProgress((s) => Object.values(s.stages).some((stage) => stage.attempts > 0));
  const hasHistory = useHistory((s) => s.rounds.length > 0);
  return !onboardingDone && !placementDone && !played && !hasHistory;
}

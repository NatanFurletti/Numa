// Humor do mascote para cada mensagem do resultado (docs/GAME_RULES.md §6.1).

import type { ResultMessageKey } from '@/engine/feedback';
import type { MascotMood } from '@/ui/Mascot';

const MOODS: Record<ResultMessageKey, MascotMood> = {
  perfect: 'party',
  stageCleared: 'happy',
  accurateButSlow: 'happy',
  fastButInaccurate: 'focus',
  inaccurateAndSlow: 'support',
};

export function moodForMessage(key: ResultMessageKey): MascotMood {
  return MOODS[key];
}

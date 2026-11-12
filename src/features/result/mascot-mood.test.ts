import type { ResultMessageKey } from '@/engine/feedback';
import type { MascotMood } from '@/ui/Mascot';

import { moodForMessage } from './mascot-mood';

describe('moodForMessage', () => {
  it.each<[ResultMessageKey, MascotMood]>([
    ['perfect', 'party'],
    ['stageCleared', 'happy'],
    ['accurateButSlow', 'happy'],
    ['fastButInaccurate', 'focus'],
    ['inaccurateAndSlow', 'support'],
  ])('%s → %s', (key, mood) => {
    expect(moodForMessage(key)).toBe(mood);
  });
});

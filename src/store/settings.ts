// Configurações (docs/DATA.md §1.1).
// Provisório (M3): só em memória e só com o que a rodada e a correção usam. No M4 ganha persistência.

import { create } from 'zustand';

import type { InputDirection } from '@/engine/types';

interface SettingsState {
  inputDirection: InputDirection;
  hasSeenDirectionTip: boolean;
  setInputDirection: (direction: InputDirection) => void;
  markDirectionTipSeen: () => void;
}

export const useSettings = create<SettingsState>()((set) => ({
  inputDirection: 'ltr',
  hasSeenDirectionTip: false,
  setInputDirection: (inputDirection) => set({ inputDirection }),
  markDirectionTipSeen: () => set({ hasSeenDirectionTip: true }),
}));

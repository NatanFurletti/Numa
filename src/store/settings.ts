// Configurações (docs/DATA.md §1.1), salvas em `numa.settings`.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { InputDirection } from '@/engine/types';
import type { DocumentSpec } from '@/storage/document';
import { deviceStorage } from '@/storage/device-storage';
import type { KeyValueStorage } from '@/storage/key-value';

import { documentStorage, isBoolean, oneOf, pick } from './persist';

export type Language = 'pt' | 'en';

export interface SettingsData {
  language: Language;
  inputDirection: InputDirection;
  onboardingDone: boolean;
  hasSeenDirectionTip: boolean;
}

interface SettingsState extends SettingsData {
  setInputDirection: (direction: InputDirection) => void;
  markDirectionTipSeen: () => void;
}

export const SETTINGS_KEY = 'numa.settings';

// O idioma do aparelho entra no M5 (i18n). Até lá, português.
const DEFAULTS: SettingsData = {
  language: 'pt',
  inputDirection: 'ltr',
  onboardingDone: false,
  hasSeenDirectionTip: false,
};

export const settingsSpec: DocumentSpec<SettingsData> = {
  version: 1,
  parse: (doc) => ({
    language: pick(doc.language, oneOf(['pt', 'en'] as const), DEFAULTS.language),
    inputDirection: pick(
      doc.inputDirection,
      oneOf(['ltr', 'rtl'] as const),
      DEFAULTS.inputDirection,
    ),
    onboardingDone: pick(doc.onboardingDone, isBoolean, DEFAULTS.onboardingDone),
    hasSeenDirectionTip: pick(doc.hasSeenDirectionTip, isBoolean, DEFAULTS.hasSeenDirectionTip),
  }),
};

export function createSettingsStore(storage: KeyValueStorage = deviceStorage) {
  return create<SettingsState>()(
    persist(
      (set) => ({
        ...DEFAULTS,
        setInputDirection: (inputDirection) => set({ inputDirection }),
        markDirectionTipSeen: () => set({ hasSeenDirectionTip: true }),
      }),
      {
        name: SETTINGS_KEY,
        version: settingsSpec.version,
        storage: documentStorage(storage, settingsSpec),
        partialize: ({ language, inputDirection, onboardingDone, hasSeenDirectionTip }) => ({
          language,
          inputDirection,
          onboardingDone,
          hasSeenDirectionTip,
        }),
      },
    ),
  );
}

export const useSettings = createSettingsStore();

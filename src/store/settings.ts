// Configurações (docs/DATA.md §1.1), salvas em `numa.settings`.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { InputDirection } from '@/engine/types';
import { deviceLanguage } from '@/lib/locale';
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
  setLanguage: (language: Language) => void;
  setInputDirection: (direction: InputDirection) => void;
  markDirectionTipSeen: () => void;
}

export const SETTINGS_KEY = 'numa.settings';

const defaults = (): SettingsData => ({
  language: deviceLanguage(),
  inputDirection: 'ltr',
  onboardingDone: false,
  hasSeenDirectionTip: false,
});

export const settingsSpec: DocumentSpec<SettingsData> = {
  version: 2,
  migrations: {
    // v1 (M4): o idioma era sempre 'pt', sem a pessoa escolher. Volta a seguir o aparelho.
    1: ({ language: _notChosen, ...rest }) => rest,
  },
  parse: (doc) => {
    const fallback = defaults();
    return {
      language: pick(doc.language, oneOf(['pt', 'en'] as const), fallback.language),
      inputDirection: pick(
        doc.inputDirection,
        oneOf(['ltr', 'rtl'] as const),
        fallback.inputDirection,
      ),
      onboardingDone: pick(doc.onboardingDone, isBoolean, fallback.onboardingDone),
      hasSeenDirectionTip: pick(doc.hasSeenDirectionTip, isBoolean, fallback.hasSeenDirectionTip),
    };
  },
};

export function createSettingsStore(storage: KeyValueStorage = deviceStorage) {
  return create<SettingsState>()(
    persist(
      (set) => ({
        ...defaults(),
        setLanguage: (language) => set({ language }),
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

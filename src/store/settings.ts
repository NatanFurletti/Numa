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
  /**
   * Consentimento para enviar rodadas ao servidor (D-034).
   * null = ainda não foi perguntado. Só `true` libera o envio.
   */
  shareRounds: boolean | null;
}

interface SettingsState extends SettingsData {
  setLanguage: (language: Language) => void;
  setInputDirection: (direction: InputDirection) => void;
  markDirectionTipSeen: () => void;
  /** Boas-vindas vistas (escolheu o nivelamento ou começar do início). */
  markOnboardingDone: () => void;
  setShareRounds: (share: boolean) => void;
}

export const SETTINGS_KEY = 'numa.settings';

const defaults = (): SettingsData => ({
  language: deviceLanguage(),
  inputDirection: 'ltr',
  onboardingDone: false,
  hasSeenDirectionTip: false,
  shareRounds: null,
});

const isConsent = (v: unknown): v is boolean | null => v === null || isBoolean(v);

export const settingsSpec: DocumentSpec<SettingsData> = {
  version: 3,
  migrations: {
    // v1 (M4): o idioma era sempre 'pt', sem a pessoa escolher. Volta a seguir o aparelho.
    1: ({ language: _notChosen, ...rest }) => rest,
    // v2 (antes do M8): não existia o consentimento. Todo mundo é perguntado, inclusive quem
    // já tinha apelido no ranking (D-034).
    2: (doc) => ({ ...doc, shareRounds: null }),
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
      shareRounds: pick(doc.shareRounds, isConsent, fallback.shareRounds),
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
        markOnboardingDone: () => set({ onboardingDone: true }),
        setShareRounds: (shareRounds) => set({ shareRounds }),
      }),
      {
        name: SETTINGS_KEY,
        version: settingsSpec.version,
        storage: documentStorage(storage, settingsSpec),
        partialize: ({
          language,
          inputDirection,
          onboardingDone,
          hasSeenDirectionTip,
          shareRounds,
        }) => ({ language, inputDirection, onboardingDone, hasSeenDirectionTip, shareRounds }),
      },
    ),
  );
}

export const useSettings = createSettingsStore();

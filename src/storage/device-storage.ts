import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { KeyValueStorage } from './key-value';

/** Armazenamento do aparelho (AsyncStorage; na web, `localStorage`). */
export const asyncStorage: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

/** Sem armazenamento: nada salvo, nada lido. */
const noStorage: KeyValueStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

/**
 * Na geração das páginas estáticas da web (`expo export`) não há `window` nem `localStorage`.
 * Ali, nada é lido nem salvo; o navegador carrega os dados de verdade ao abrir a página.
 */
export function pickDeviceStorage(isWeb: boolean, hasWindow: boolean): KeyValueStorage {
  return isWeb && !hasWindow ? noStorage : asyncStorage;
}

export const deviceStorage = pickDeviceStorage(
  Platform.OS === 'web',
  typeof window !== 'undefined',
);

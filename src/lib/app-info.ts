import Constants from 'expo-constants';

/** Versão do app (app.json), gravada em cada rodada do histórico. */
export const appVersion: string = Constants.expoConfig?.version ?? '0.0.0';

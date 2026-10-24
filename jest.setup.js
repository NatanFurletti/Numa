// AsyncStorage em memória nos testes (mock oficial do pacote).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Aparelho em português nos testes (TESTING §3.4: buscas por texto em pt).
// Os testes de idioma trocam o retorno com mockReturnValue.
jest.mock('expo-localization', () => ({
  ...jest.requireActual('expo-localization'),
  getLocales: jest.fn(() => [{ languageTag: 'pt-BR', languageCode: 'pt' }]),
}));

// Inicializa o i18n (em pt) antes de cada arquivo de teste, como o layout raiz faz no app.
require('./src/i18n');

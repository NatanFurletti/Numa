// AsyncStorage em memória nos testes (mock oficial do pacote).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

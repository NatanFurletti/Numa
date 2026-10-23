// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

// Fronteiras entre camadas (docs/ARCHITECTURE.md §4).
const layer = (name) => ({
  group: [`@/${name}`, `@/${name}/*`, `**/${name}/*`],
  message: `Esta camada não pode importar src/${name} (ver docs/ARCHITECTURE.md §4).`,
});

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*'],
  },
  {
    // engine: TypeScript puro, só importa a si mesmo.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
              ],
              message: 'src/engine é TS puro: sem React, React Native ou Expo.',
            },
            layer('store'),
            layer('storage'),
            layer('i18n'),
            layer('features'),
            layer('ui'),
            layer('lib'),
            layer('app'),
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'Use o Clock injetado (ARCHITECTURE §5.1).' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use o Rng com seed (ARCHITECTURE §5.1).' },
      ],
    },
  },
  {
    files: ['src/store/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [layer('features'), layer('app'), layer('ui')] },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [layer('app')] }],
    },
  },
  {
    // Rotas não falam com o engine diretamente: passam pelos hooks de src/features.
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [layer('engine'), layer('store'), layer('storage')] },
      ],
    },
  },
]);

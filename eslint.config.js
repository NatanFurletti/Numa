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
            layer('services'),
            layer('server'),
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
        {
          patterns: [
            layer('features'),
            layer('app'),
            layer('ui'),
            layer('services'),
            layer('server'),
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [layer('app'), layer('server')] }],
    },
  },
  {
    // Serviços externos: só falam com o servidor por HTTP, nunca importando o código dele.
    files: ['src/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [layer('server')] }],
    },
  },
  {
    // Servidor (Vercel Functions, D-034): só o engine e o Supabase. Roda fora do app, sem React
    // nem Expo, e a Vercel não lê os atalhos `@/` do tsconfig.
    files: ['src/server/**/*.ts', 'api/**/*.ts'],
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
              message: 'O servidor roda fora do app: sem React, React Native ou Expo.',
            },
            {
              group: ['@/*'],
              message:
                'No servidor, use imports relativos: a Vercel não lê os atalhos do tsconfig.',
            },
            {
              group: [
                '**/store/*',
                '**/storage/*',
                '**/i18n/*',
                '**/features/*',
                '**/ui/*',
                '**/lib/*',
                '**/services/*',
                '**/app/*',
              ],
              message: 'O servidor só importa src/engine e src/server (ARCHITECTURE §4).',
            },
          ],
        },
      ],
    },
  },
  {
    // Rotas não falam com o engine diretamente: passam pelos hooks de src/features.
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('engine'),
            layer('store'),
            layer('storage'),
            layer('services'),
            layer('server'),
          ],
        },
      ],
    },
  },
]);

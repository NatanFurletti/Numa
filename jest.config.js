const fs = require('fs');
const path = require('path');

// Limites de cobertura de docs/TESTING.md §2.
// Cada limite só entra quando a pasta já tem arquivos que casam com ele,
// porque o Jest falha quando um limite não encontra nenhum arquivo.
const thresholds = [
  { glob: './src/engine/**/*.ts', dir: 'src/engine', match: /\.ts$/, min: 95 },
  { glob: './src/store/**/*.ts', dir: 'src/store', match: /\.ts$/, min: 85 },
  {
    glob: './src/features/**/use*.ts',
    dir: 'src/features',
    match: /(^|[\\/])use[^\\/]*\.ts$/,
    min: 85,
  },
  { glob: './src/features/**/*.tsx', dir: 'src/features', match: /\.tsx$/, min: 80 },
  { glob: './src/ui/**/*.tsx', dir: 'src/ui', match: /\.tsx$/, min: 80 },
];

function hasSourceFile(dir, match) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir, { recursive: true }).some((file) => {
    const name = String(file);
    return match.test(name) && !/\.test\.tsx?$/.test(name);
  });
}

const coverageThreshold = Object.fromEntries(
  thresholds
    .filter((t) => hasSourceFile(path.join(__dirname, t.dir), t.match))
    .map((t) => [t.glob, { lines: t.min, branches: t.min }]),
);

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Necessário para o Reanimated 4 rodar no Jest.
  resolver: 'react-native-reanimated/jest/resolver',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-utils/**',
    '!src/app/**',
  ],
  coverageThreshold,
};

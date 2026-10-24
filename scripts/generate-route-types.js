// Gera os tipos das rotas (.expo/types/router.d.ts) sem subir o servidor do Expo.
// O Expo só faz isso no `expo start`; sem este script, o typecheck do CI e o local divergem.
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const cliDir = path.dirname(
  require.resolve('@expo/cli/package.json', {
    paths: [path.dirname(require.resolve('expo/package.json'))],
  }),
);
const typedRoutesPath = require.resolve('@expo/router-server/build/typed-routes', {
  paths: [cliDir],
});

process.env.EXPO_ROUTER_APP_ROOT = path.join(projectRoot, 'src', 'app');
const typedRoutes = require(typedRoutesPath);
typedRoutes.regenerateDeclarations(path.join(projectRoot, '.expo', 'types'), {});

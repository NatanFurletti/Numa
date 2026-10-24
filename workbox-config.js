// Service worker do PWA (docs/ARCHITECTURE.md §6), gerado depois do `expo export`.
// Guarda todos os arquivos do site para o app abrir offline depois da primeira visita.
// Um deploy novo chega na visita seguinte: o service worker novo baixa os arquivos
// em segundo plano e assume na próxima vez que o app abre (D-027).

/** @type {import('workbox-build').GenerateSWOptions} */
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,html,css,ttf,ico,png,json}'],
  swDest: 'dist/sw.js',
  // /play/L01-A?mode=practice usa o mesmo arquivo de /play/L01-A.
  ignoreURLParametersMatching: [/^mode$/, /^utm_/, /^fbclid$/],
  // /result/<id> e /review/<id> não têm um arquivo por id (o id nasce no aparelho).
  // Offline, recarregar uma dessas páginas abre o app pelo index.html, e o roteador
  // mostra a tela certa pelo endereço.
  navigateFallback: '/index.html',
  navigateFallbackAllowlist: [/^\/(result|review)\//],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
};

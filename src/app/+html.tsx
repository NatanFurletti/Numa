// HTML de cada página da web (só roda no build, no Node). Liga o PWA: manifest, ícones,
// cor do tema e o service worker que deixa o app abrir offline (docs/ARCHITECTURE.md §6).
//
// SDK 58: `headNodes` e `bodyNodes` (de useServerDocumentContext) trazem os estilos e os
// scripts do app. Sem eles, a página abre em branco.

import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { colors } from '@/ui/theme';

// Registra o service worker gerado pelo Workbox (npm run build:web).
// Só no build de produção: o servidor de desenvolvimento não tem o sw.js.
const registerServiceWorker = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.warn('[numa] service worker não registrado:', error);
    });
  });
}`;

// Fundo escuro já no HTML, para a página não piscar em branco antes do app carregar.
const baseStyle = `body { background-color: ${colors.background}; }`;

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  const production = process.env.NODE_ENV === 'production';

  return (
    <html lang="pt-BR" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content={colors.background} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Numa" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: baseStyle }} />
        {production ? <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} /> : null}
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

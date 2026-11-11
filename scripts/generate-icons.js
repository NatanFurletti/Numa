// Gera os ícones do Numa a partir do mascote (docs/DECISIONS.md D-029):
// PWA (public/icons), favicon, ícone do app, ícone adaptativo do Android e tela de abertura.
// O desenho é o mesmo de src/ui/Mascot.tsx (humor "happy"). Mudou lá? Mude aqui e rode de novo.
// Uso: node scripts/generate-icons.js   (precisa do Chromium do Playwright: npx playwright install chromium)

const path = require('path');
const { chromium } = require('@playwright/test');

const BACKGROUND = '#0F1115';
const ACCENT = '#4F8CFF';
const MUTED = '#A3A8B3';
const SUCCESS = '#3DD68C';
const WARNING = '#F5B544';
const ERROR = '#FF6B6B';
const WHITE = '#FFFFFF';

/** O mascote em uma grade de 120 × 120. `mono`: tudo branco, para o ícone monocromático. */
function mascot({ mono = false } = {}) {
  const frame = mono ? WHITE : ACCENT;
  const ink = mono ? WHITE : BACKGROUND;
  const color = (c) => (mono ? WHITE : c);
  const bead = (cx, cy, c) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="6.5" ry="7.5" fill="${color(c)}"/>`;
  const rod = (y) =>
    `<line x1="27" y1="${y}" x2="93" y2="${y}" stroke="${color(MUTED)}" stroke-width="3" stroke-linecap="round"/>`;
  const arm = (d, cx, cy) =>
    `<path d="${d}" fill="none" stroke="${frame}" stroke-width="6" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="5" fill="${frame}"/>`;

  // No monocromático só o contorno conta: olhos e boca viram furos na cabeça.
  const head = mono
    ? `<mask id="face"><rect width="120" height="120" fill="white"/>` +
      `<circle cx="44" cy="27" r="11.5" fill="black"/><circle cx="76" cy="27" r="11.5" fill="black"/>` +
      `<path d="M52 42 Q60 52 68 42 Z" fill="black" stroke="black" stroke-width="2.5" stroke-linejoin="round"/></mask>` +
      `<rect x="9" y="6" width="102" height="48" rx="24" fill="${WHITE}" mask="url(#face)"/>` +
      `<circle cx="45" cy="28" r="6" fill="${WHITE}"/><circle cx="77" cy="28" r="6" fill="${WHITE}"/>`
    : `<rect x="9" y="6" width="102" height="48" rx="24" fill="${frame}"/>` +
      `<path d="M52 42 Q60 52 68 42 Z" fill="${ink}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<circle cx="44" cy="27" r="11.5" fill="${WHITE}"/><circle cx="76" cy="27" r="11.5" fill="${WHITE}"/>` +
      `<circle cx="45" cy="28" r="6" fill="${ink}"/><circle cx="77" cy="28" r="6" fill="${ink}"/>` +
      `<circle cx="47.2" cy="25.8" r="2.2" fill="${WHITE}"/><circle cx="79.2" cy="25.8" r="2.2" fill="${WHITE}"/>`;

  return (
    arm('M17 68 Q5 73 7 88', 7, 90) +
    arm('M103 68 Q117 63 114 47', 114, 45) +
    `<rect x="27" y="104" width="19" height="10" rx="5" fill="${frame}"/>` +
    `<rect x="74" y="104" width="19" height="10" rx="5" fill="${frame}"/>` +
    `<rect x="17" y="48" width="10" height="52" rx="5" fill="${frame}"/>` +
    `<rect x="93" y="48" width="10" height="52" rx="5" fill="${frame}"/>` +
    `<rect x="13" y="96" width="94" height="11" rx="5.5" fill="${frame}"/>` +
    rod(70) +
    rod(87) +
    bead(38, 70, WARNING) +
    bead(52, 70, WARNING) +
    bead(82, 70, ERROR) +
    bead(38, 87, SUCCESS) +
    bead(68, 87, SUCCESS) +
    bead(82, 87, SUCCESS) +
    head
  );
}

/**
 * Um ícone quadrado. `fill` é a fração do lado ocupada pelo mascote
 * (0.62 cabe na área segura dos ícones "maskable" e adaptativos).
 */
function iconSvg({ size, fill, background = null, mono = false, draw = true }) {
  const scale = (size * fill) / 120;
  const offset = (size * (1 - fill)) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    (background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '') +
    (draw
      ? `<g transform="translate(${offset} ${offset}) scale(${scale})">${mascot({ mono })}</g>`
      : '') +
    `</svg>`
  );
}

const ICONS = [
  // PWA: fundo cheio, mascote dentro da área segura.
  { file: 'public/icons/icon-192.png', size: 192, fill: 0.62, background: BACKGROUND },
  { file: 'public/icons/icon-512.png', size: 512, fill: 0.62, background: BACKGROUND },
  { file: 'public/icons/apple-touch-icon.png', size: 180, fill: 0.72, background: BACKGROUND },
  // Expo (app.json)
  { file: 'assets/images/icon.png', size: 1024, fill: 0.72, background: BACKGROUND },
  { file: 'assets/images/favicon.png', size: 48, fill: 1 },
  { file: 'assets/images/splash-icon.png', size: 480, fill: 1 },
  { file: 'assets/images/android-icon-foreground.png', size: 512, fill: 0.56 },
  {
    file: 'assets/images/android-icon-background.png',
    size: 512,
    background: BACKGROUND,
    draw: false,
    fill: 1,
  },
  { file: 'assets/images/android-icon-monochrome.png', size: 432, fill: 0.56, mono: true },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { file, ...icon } of ICONS) {
    await page.setViewportSize({ width: icon.size, height: icon.size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${iconSvg(icon)}</body></html>`,
    );
    await page.screenshot({
      path: path.join(__dirname, '..', file),
      omitBackground: true,
      clip: { x: 0, y: 0, width: icon.size, height: icon.size },
    });
    console.log(file);
  }
  await browser.close();
})();

// Gera os ícones do PWA em public/icons (provisório até existir um logo do Numa).
// Desenho: fundo escuro do tema, círculo azul (accent) e um "+" branco.
// O círculo ocupa 80% do ícone, dentro da área segura dos ícones "maskable".
// Uso: node scripts/generate-pwa-icons.js

const path = require('path');
const Jimp = require('jimp-compact');

const BACKGROUND = [0x0f, 0x11, 0x15];
const ACCENT = [0x4f, 0x8c, 0xff];
const WHITE = [0xff, 0xff, 0xff];

function pixelColor(x, y, size) {
  const c = (size - 1) / 2;
  const dx = x - c;
  const dy = y - c;
  const radius = size * 0.4;
  if (dx * dx + dy * dy > radius * radius) return BACKGROUND;
  const arm = size * 0.2; // meio comprimento do "+"
  const half = size * 0.045; // meia espessura do "+"
  const inPlus =
    (Math.abs(dx) <= arm && Math.abs(dy) <= half) || (Math.abs(dy) <= arm && Math.abs(dx) <= half);
  return inPlus ? WHITE : ACCENT;
}

async function icon(size, file) {
  const image = await Jimp.create(size, size, 0x000000ff);
  image.scan(0, 0, size, size, function (x, y, idx) {
    const [r, g, b] = pixelColor(x, y, size);
    this.bitmap.data[idx] = r;
    this.bitmap.data[idx + 1] = g;
    this.bitmap.data[idx + 2] = b;
    this.bitmap.data[idx + 3] = 0xff;
  });
  await image.writeAsync(path.join(__dirname, '..', 'public', 'icons', file));
  console.log(`public/icons/${file}`);
}

(async () => {
  await icon(192, 'icon-192.png');
  await icon(512, 'icon-512.png');
  await icon(180, 'apple-touch-icon.png');
})();

// Renderiza as imagens estáticas a partir da própria cena 3D (não é foto, não é IA):
//   public/cena-poster(-800).webp   topo (mostrado antes do 3D e no celular)
//   public/telhado-close(-900).webp close do bloco 4
//   public/og.png             imagem de compartilhamento
//   public/favicon.svg        sol da logo
// Uso: npm run stills   (sobe um Vite temporário e usa o Edge/Chrome instalado)
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { coresDaLogo } from '../vite.config.js';
import { navegador } from './navegador.mjs';

const pub = (f) => new URL(`../public/${f}`, import.meta.url);

const { sun } = coresDaLogo();
writeFileSync(pub('favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="${sun}"/><g stroke="${sun}" stroke-width="2.4" stroke-linecap="round"><path d="M16 2.5v3M16 26.5v3M2.5 16h3M26.5 16h3M6.5 6.5l2.1 2.1M23.4 23.4l2.1 2.1M6.5 25.5l2.1-2.1M23.4 8.6l2.1-2.1"/></g></svg>\n`);

const servidor = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await servidor.listen();
const base = 'http://localhost:5199';
const browser = await chromium.launch({ executablePath: navegador(), args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function render(arquivo, { tiro, w, h, tipo = 'image/webp', fundo }) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const q = new URLSearchParams({ tiro, ...(fundo ? { fundo } : {}) });
  await page.goto(`${base}/render.html?${q}`);
  await page.waitForFunction(() => window.__pronto === true, null, { timeout: 60000 });
  const dataUrl = await page.evaluate(([t]) => window.__imagem(t, 0.9), [tipo]);
  writeFileSync(pub(arquivo), Buffer.from(dataUrl.split(',')[1], 'base64'));
  await page.close();
  console.log('ok', arquivo);
}

try {
  await render('cena-poster.webp', { tiro: 'hero', w: 1200, h: 1200 });
  await render('cena-poster-800.webp', { tiro: 'hero', w: 800, h: 800 });
  await render('telhado-close.webp', { tiro: 'close', w: 1200, h: 900, fundo: '#ebe2d3' });
  await render('telhado-close-900.webp', { tiro: 'close', w: 900, h: 675, fundo: '#ebe2d3' });
  await render('cena-og.png', { tiro: 'og', w: 700, h: 610, tipo: 'image/png' });

  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/og.html`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') });
  console.log('ok og.png');
} finally {
  if (existsSync(pub('cena-og.png'))) unlinkSync(pub('cena-og.png'));
  await browser.close();
  await servidor.close();
}

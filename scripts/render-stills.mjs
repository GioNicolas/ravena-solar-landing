// Renderiza as imagens estáticas a partir das próprias cenas 3D (não é foto, não é IA):
//   public/casa-{vazio,compensa,nao}(-800).webp  topo: antes do 3D e no celular, por estado
//   public/telhado-{montado,separado}(-900).webp vista explodida, no celular
//   src/cena/rotulos.json                        posição dos rótulos sobre a vista separada
//   public/og.png                                imagem de compartilhamento
//   public/favicon.svg                           sol da logo
// Uso: npm run stills   (sobe um Vite temporário e usa o Edge/Chrome instalado)
import { writeFileSync, unlinkSync, existsSync, readdirSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { coresDaLogo } from '../vite.config.js';
import { navegador } from './navegador.mjs';

const pub = (f) => new URL(`../public/${f}`, import.meta.url);
const caminho = (u) => decodeURIComponent(u.pathname).replace(/^\/(\w:)/, '$1');

// Remove imagens de versões anteriores da cena.
for (const f of readdirSync(new URL('../public/', import.meta.url))) {
  if (/^(cena-|telhado-close)/.test(f)) unlinkSync(pub(f));
}

const { sun } = coresDaLogo();
writeFileSync(pub('favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="${sun}"/><g stroke="${sun}" stroke-width="2.4" stroke-linecap="round"><path d="M16 2.5v3M16 26.5v3M2.5 16h3M26.5 16h3M6.5 6.5l2.1 2.1M23.4 23.4l2.1 2.1M6.5 25.5l2.1-2.1M23.4 8.6l2.1-2.1"/></g></svg>\n`);

const servidor = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await servidor.listen();
const base = 'http://localhost:5199';
const browser = await chromium.launch({ executablePath: navegador(), args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function render(arquivo, params, { w, h, tipo = 'image/webp' }) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`${base}/render.html?${new URLSearchParams(params)}`);
  await page.waitForFunction(() => window.__pronto === true, null, { timeout: 60000 });
  const dataUrl = await page.evaluate(([t]) => window.__imagem(t, 0.88), [tipo]);
  writeFileSync(pub(arquivo), Buffer.from(dataUrl.split(',')[1], 'base64'));
  const rotulos = await page.evaluate(() => window.__rotulos?.());
  await page.close();
  console.log('ok', arquivo);
  return rotulos;
}

try {
  await render('casa-vazio.webp', { estado: 'vazio' }, { w: 1200, h: 1200 });
  for (const estado of ['vazio', 'compensa', 'nao-compensa']) {
    await render(`casa-${estado.replace('-compensa', '')}-800.webp`, { estado }, { w: 800, h: 800 });
  }

  const fundo = '#ebe2d3';
  await render('telhado-montado.webp', { cena: 'explodida', separacao: 0, fundo }, { w: 1200, h: 900 });
  await render('telhado-montado-900.webp', { cena: 'explodida', separacao: 0, fundo }, { w: 900, h: 675 });
  await render('telhado-separado-900.webp', { cena: 'explodida', separacao: 1, fundo }, { w: 900, h: 675 });
  const rotulos = await render('telhado-separado.webp', { cena: 'explodida', separacao: 1, fundo }, { w: 1200, h: 900 });
  const r = (p) => [Number(p.x.toFixed(4)), Number(p.y.toFixed(4))];
  writeFileSync(
    new URL('../src/cena/rotulos.json', import.meta.url),
    JSON.stringify({ telhado: r(rotulos.telhado), estrutura: r(rotulos.estrutura), painel: r(rotulos.painel) }, null, 2) + '\n',
  );
  console.log('ok rotulos.json');

  await render('casa-og.png', { tiro: 'og', estado: 'compensa' }, { w: 720, h: 630, tipo: 'image/png' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/og.html`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: caminho(pub('og.png')) });
  console.log('ok og.png');
} finally {
  if (existsSync(pub('casa-og.png'))) unlinkSync(pub('casa-og.png'));
  await browser.close();
  await servidor.close();
}

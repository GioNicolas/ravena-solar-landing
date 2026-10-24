// Evidência do card de clima: uma captura com a Open-Meteo de verdade e outra com a rota
// apontada para uma URL que responde 429. Uso: npm run build && node scripts/captura-clima.mjs
import { createServer } from 'node:http';
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { navegador } from './navegador.mjs';

const raiz = (nome) => decodeURIComponent(new URL(`../${nome}`, import.meta.url).pathname).replace(/^\/(\w:)/, '$1');
const quebrado = createServer((_, res) => res.writeHead(429).end('Too Many Requests')).listen(4187);
const servidor = await preview({ preview: { port: 4198, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch({ executablePath: navegador() });

async function capturar(arquivo) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const resposta = page.waitForResponse((r) => r.url().endsWith('/api/clima'));
  await page.goto('http://localhost:4198/', { waitUntil: 'networkidle' });
  const corpo = await (await resposta).json();
  await page.waitForTimeout(800);
  const card = await page.locator('#clima').innerText();
  console.log(arquivo, JSON.stringify(corpo), '->', card);
  await page.screenshot({ path: raiz(arquivo) });
  await page.close();
}

delete process.env.CLIMA_URL;
await capturar('screenshot-clima-sucesso.png');
process.env.CLIMA_URL = 'http://localhost:4187/';
await capturar('screenshot-clima-falha.png');

await browser.close();
await servidor.close();
quebrado.close();

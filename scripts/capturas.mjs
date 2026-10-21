// Capturas de verificação a partir do build (dist/), servido pelo vite preview.
// Uso: npm run build && npm run capturas   (opcional: URL=https://... para a página no ar)
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { navegador } from './navegador.mjs';

const pasta = new URL('../verificacao/capturas/', import.meta.url);
mkdirSync(pasta, { recursive: true });
const arquivo = (nome) => decodeURIComponent(new URL(nome, pasta).pathname).replace(/^\/(\w:)/, '$1');

let servidor = null;
let base = process.env.URL;
if (!base) {
  servidor = await preview({ preview: { port: 4199, strictPort: true }, logLevel: 'error' });
  base = 'http://localhost:4199';
}

const browser = await chromium.launch({ executablePath: navegador(), args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const TELAS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function abrir(tela) {
  const page = await browser.newPage(TELAS[tela]);
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { page, erros };
}

async function revelarTudo(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.revela').forEach((el) => el.classList.add('visto'));
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
  });
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
  await page.waitForTimeout(700);
}

const relatorio = [];
try {
  for (const tela of Object.keys(TELAS)) {
    const { page, erros } = await abrir(tela);
    await page.waitForTimeout(tela === 'desktop' ? 3500 : 800); // dá tempo do 3D entrar no desktop
    await page.screenshot({ path: arquivo(`${tela}-1-topo.png`) });

    await page.fill('#sim-conta', '300');
    await page.waitForTimeout(900);
    await page.locator('#simulador').screenshot({ path: arquivo(`${tela}-2-simulador-300.png`) });
    if (tela === 'desktop') await page.screenshot({ path: arquivo(`${tela}-2b-topo-300.png`) });

    await page.fill('#sim-conta', '780');
    await page.waitForTimeout(1200);
    await page.locator('#simulador').screenshot({ path: arquivo(`${tela}-3-simulador-780.png`) });
    if (tela === 'desktop') await page.screenshot({ path: arquivo(`${tela}-3b-topo-780.png`) });

    await revelarTudo(page);
    await page.screenshot({ path: arquivo(`${tela}-4-pagina-inteira.png`), fullPage: true });

    // Pedido: o botão do simulador leva a conta para o formulário.
    await page.click('[data-leva-conta]');
    await page.waitForTimeout(900);
    // Nas fotos de seção, o cabeçalho e o botão fixos ficariam por cima do formulário.
    await page.addStyleTag({ content: '.topo-barra{position:static!important}.cta-fixo{display:none!important}' });
    const contaLevada = await page.inputValue('#f-conta');
    await page.click('#form-pedido button[type="submit"]');
    await page.waitForTimeout(300);
    await page.locator('#pedido').screenshot({ path: arquivo(`${tela}-5-pedido-erros.png`) });
    await page.fill('#f-nome', 'Maria Teste');
    await page.fill('#f-whatsapp', '15991234567');
    await page.selectOption('#f-cidade', 'Votorantim');
    await page.click('#form-pedido button[type="submit"]');
    await page.waitForSelector('#enviado:not([hidden])', { timeout: 10000 });
    await page.waitForTimeout(700); // fim da animação de entrada
    await page.locator('#pedido').screenshot({ path: arquivo(`${tela}-6-pedido-enviado.png`) });

    // Mede o estouro real de cada elemento, porque overflow: clip esconderia do scrollWidth.
    const larguraExtra = await page.evaluate(() =>
      Math.max(0, ...[...document.querySelectorAll('main *, header *')]
        .filter((el) => !el.closest('.hero__cena, .form__isca, .pular'))
        .map((el) => Math.ceil(el.getBoundingClientRect().right - innerWidth))),
    );
    const cena3d = await page.evaluate(() => document.querySelector('.hero__cena').classList.contains('viva'));
    relatorio.push({ tela, contaLevada, larguraExtra, cena3d, erros });
    await page.close();
  }
} finally {
  await browser.close();
  servidor?.httpServer.close();
}
console.log(JSON.stringify(relatorio, null, 2));

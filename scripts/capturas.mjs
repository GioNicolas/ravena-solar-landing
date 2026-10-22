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
    // Dispara todas as animações de entrada de uma vez, como se a pessoa tivesse rolado a página.
    document.querySelectorAll('.revela, .contas, .linha-tempo, .passos, .prazo, .mapa').forEach((el) => el.classList.add('visto'));
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
  });
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(3500); // fim das animações (a mais longa leva ~3 s)
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

    // Vista explodida: mouse em cima separa (desktop); toque alterna (celular).
    await page.locator('#explodida').scrollIntoViewIfNeeded();
    if (tela === 'desktop') await page.hover('#explodida');
    else {
      await page.tap('#explodida'); // estava aberta da primeira vez: monta
      await page.waitForTimeout(400);
      await page.tap('#explodida'); // e separa de novo
    }
    await page.waitForTimeout(1800);
    await page.locator('#telhado').screenshot({ path: arquivo(`${tela}-4b-telhado-separado.png`) });
    if (tela === 'desktop') {
      await page.mouse.move(5, 5);
      await page.waitForTimeout(1600);
      await page.locator('#explodida').screenshot({ path: arquivo(`${tela}-4c-telhado-montado.png`) });
    }

    // Caminho das etapas no meio da rolagem.
    await page.evaluate(() => {
      const j = document.getElementById('jornada');
      scrollTo(0, j.getBoundingClientRect().top + scrollY - innerHeight * 0.62 + j.offsetHeight * 0.55);
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: arquivo(`${tela}-4d-etapas-rolando.png`) });

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
    await page.selectOption('#f-cidade', 'Outra cidade da região');
    await page.waitForTimeout(500);
    await page.locator('#pedido').screenshot({ path: arquivo(`${tela}-5b-pedido-outra-cidade.png`) });
    await page.selectOption('#f-cidade', 'Itu');
    await page.waitForTimeout(500);
    await page.locator('#mapa').screenshot({ path: arquivo(`${tela}-5c-mapa-itu.png`) });
    await page.click('#form-pedido button[type="submit"]');
    await page.waitForSelector('#enviado:not([hidden])', { timeout: 10000 });
    await page.waitForTimeout(700); // fim da animação de entrada
    await page.locator('#pedido').screenshot({ path: arquivo(`${tela}-6-pedido-enviado.png`) });

    // Mede o estouro real de cada elemento, porque overflow: clip esconderia do scrollWidth.
    const estouros = await page.evaluate(() =>
      [...document.querySelectorAll('main *, header *')]
        .filter((el) => !el.closest('.hero__cena, .form__isca, .pular'))
        .map((el) => ({ el: `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}`, px: Math.ceil(el.getBoundingClientRect().right - innerWidth) }))
        .filter((x) => x.px > 0)
        .slice(0, 5),
    );
    const larguraExtra = Math.max(0, ...estouros.map((x) => x.px));
    const cena3d = await page.evaluate(() => document.querySelector('.hero__cena').classList.contains('viva'));
    relatorio.push({ tela, contaLevada, larguraExtra, estouros, cena3d, erros });
    await page.close();
  }
} finally {
  await browser.close();
  servidor?.httpServer.close();
}
console.log(JSON.stringify(relatorio, null, 2));

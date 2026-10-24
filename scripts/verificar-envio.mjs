// Prova, num navegador de verdade, que o envio do pedido aguenta rede ruim sem perder nem duplicar lead.
// Sobe o build (dist/) com a função api/simulacao.js de verdade e um interruptor de falha na frente dela.
// Uso: npm run build && npm run verificar-envio
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { navegador } from './navegador.mjs';
import { POST } from '../api/simulacao.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };

// O que a função registrou (o "destino") e o que chegou na porta dela.
const registrados = [];
const log = console.log;
console.log = (tag, json) => (tag === '[pedido de simulação]' ? registrados.push(JSON.parse(json)) : log(tag, json));

let modo = 'ok';       // ok | 503 | queda | perde-resposta
let falhasRestantes = 0;
let chegadas = 0;

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/simulacao' && req.method === 'POST') {
    chegadas++;
    const falhar = modo !== 'ok' && falhasRestantes-- > 0;
    if (falhar && modo === 'queda') return req.socket.destroy();
    if (falhar && modo === '503') { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"ok":false}'); }
    const corpo = Buffer.concat(await Array.fromAsync(req));
    const resposta = await POST(new Request(url, { method: 'POST', headers: req.headers, body: corpo, duplex: 'half' }));
    // O servidor registrou o lead, mas a resposta nunca chega ao navegador.
    if (falhar && modo === 'perde-resposta') return req.socket.destroy();
    res.writeHead(resposta.status, Object.fromEntries(resposta.headers));
    return res.end(Buffer.from(await resposta.arrayBuffer()));
  }
  try {
    const arq = url.pathname === '/' ? '/index.html' : url.pathname;
    res.writeHead(200, { 'content-type': TIPOS[extname(arq)] ?? 'application/octet-stream' });
    res.end(await readFile(join(dist, arq)));
  } catch {
    res.writeHead(404).end();
  }
}).listen(4188);

const browser = await chromium.launch({ executablePath: navegador() });
const resultados = [];
let falhou = false;

function conferir(cenario, condicao, detalhe) {
  resultados.push({ cenario, ok: !!condicao, detalhe });
  if (!condicao) falhou = true;
  log(`${condicao ? 'PASSOU' : 'FALHOU'}  ${cenario}  [${detalhe}]`);
}

async function novaPagina() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('http://localhost:4188/', { waitUntil: 'load' });
  return { context, page, erros };
}

async function preencherEEnviar(page, nome = 'Maria Souza') {
  await page.fill('#f-nome', nome);
  await page.fill('#f-whatsapp', '15991234567');
  await page.selectOption('#f-cidade', 'Itu');
  await page.fill('#f-conta', '780');
  await page.click('#form-pedido button[type="submit"]');
}

const fila = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ravena:pedidos-pendentes') ?? '[]').length);
const confirmado = (page) => page.locator('#enviado').isVisible();
const zerar = (m, f = 0) => { registrados.length = 0; chegadas = 0; modo = m; falhasRestantes = f; };

try {
  // A. Servidor instável: duas respostas 503 e a terceira passa.
  zerar('503', 2);
  let { context, page, erros } = await novaPagina();
  await preencherEEnviar(page);
  await page.waitForSelector('#erro-geral:not([hidden])');
  const aviso = await page.textContent('#erro-geral');
  await page.waitForSelector('#enviado:not([hidden])', { timeout: 15000 });
  conferir('A. 503, 503, depois ok', chegadas === 3 && registrados.length === 1 && /Tentando de novo/.test(aviso),
    `tentativas=${chegadas}, leads registrados=${registrados.length}, aviso="${aviso}"`);
  conferir('A. confirmação mostra o nome e a fila continua vazia', (await page.textContent('#enviado')).includes('Maria') && (await fila(page)) === 0,
    `fila=${await fila(page)}`);
  conferir('A. sem erro de JavaScript', erros.length === 0, `erros=${JSON.stringify(erros)}`);
  await context.close();

  // B. A resposta se perde depois de o servidor registrar o lead: a nova tentativa não pode duplicar.
  zerar('perde-resposta', 1);
  ({ context, page, erros } = await novaPagina());
  await preencherEEnviar(page, 'Ana Lima');
  await page.waitForSelector('#enviado:not([hidden])', { timeout: 15000 });
  const ids = new Set(registrados.map((r) => r.id));
  conferir('B. resposta perdida: 2 tentativas chegam, 1 lead registrado', chegadas === 2 && registrados.length === 1,
    `tentativas=${chegadas}, leads registrados=${registrados.length}, ids distintos=${ids.size}`);
  await context.close();

  // C. Sem rede nenhuma: o pedido fica guardado e sai sozinho quando a rede volta (evento "online").
  zerar('ok');
  ({ context, page, erros } = await novaPagina());
  await context.setOffline(true);
  await preencherEEnviar(page, 'Carla Dias');
  await page.waitForFunction(() => /Guardamos o pedido/.test(document.getElementById('erro-geral').textContent), null, { timeout: 15000 });
  conferir('C. offline: aviso de pedido guardado, nada na tela de confirmação', !(await confirmado(page)) && (await fila(page)) === 1 && registrados.length === 0,
    `fila=${await fila(page)}, leads registrados=${registrados.length}, aviso="${await page.textContent('#erro-geral')}"`);
  await context.setOffline(false);
  await page.waitForSelector('#enviado:not([hidden])', { timeout: 15000 });
  conferir('C. rede volta: fila esvazia e o lead chega uma vez', (await fila(page)) === 0 && registrados.length === 1 && registrados[0].nome === 'Carla Dias',
    `fila=${await fila(page)}, leads registrados=${registrados.length} (${registrados.map((r) => r.nome)})`);
  await context.close();

  // D. Servidor fora do ar, a pessoa fecha e reabre a página: o pedido guardado sai na abertura.
  zerar('queda', 99);
  ({ context, page, erros } = await novaPagina());
  await preencherEEnviar(page, 'Bia Rocha');
  await page.waitForFunction(() => /Guardamos o pedido/.test(document.getElementById('erro-geral').textContent), null, { timeout: 15000 });
  const guardado = await fila(page);
  zerar('ok');
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#enviado:not([hidden])', { timeout: 15000 });
  conferir('D. reabrir a página reenvia o que ficou guardado', guardado === 1 && (await fila(page)) === 0 && registrados.length === 1 && registrados[0].nome === 'Bia Rocha',
    `fila antes=${guardado}, fila depois=${await fila(page)}, leads registrados=${registrados.length}`);
  await context.close();

  // E. Dado inválido no servidor (422) não é repetido nem guardado.
  zerar('ok');
  ({ context, page, erros } = await novaPagina());
  await page.route('**/api/simulacao', (rota) => rota.fulfill({ status: 422, contentType: 'application/json', body: '{"ok":false,"erros":{"whatsapp":"Informe o WhatsApp com DDD."}}' }));
  let pedidos422 = 0;
  page.on('request', (r) => r.url().endsWith('/api/simulacao') && pedidos422++);
  await preencherEEnviar(page, 'Davi Melo');
  await page.waitForFunction(() => /não passou na conferência/.test(document.getElementById('erro-geral').textContent), null, { timeout: 15000 });
  conferir('E. 422 é recusa: 1 tentativa só, nada guardado', pedidos422 === 1 && (await fila(page)) === 0 && !(await confirmado(page)),
    `tentativas=${pedidos422}, fila=${await fila(page)}`);
  await context.close();
} finally {
  await browser.close();
  servidor.close();
  console.log = log;
}

const ok = resultados.filter((r) => r.ok).length;
log(`\n${ok} de ${resultados.length} conferências passaram.`);
process.exit(falhou ? 1 : 0);

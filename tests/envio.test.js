import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarEnvio, CHAVE_FILA } from '../src/envio.js';
import { POST } from '../api/simulacao.js';

const campos = { nome: 'Maria Souza', whatsapp: '(15) 99123-4567', cidade: 'Itu', conta: '780', empresa: '' };

const memoria = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
};
const resposta = (status, corpo) => ({ ok: status < 400, status, json: async () => corpo });
const montar = (respostas, extra = {}) => {
  const chamadas = [];
  const fetch = async (url, init) => {
    chamadas.push({ url, init });
    const r = respostas[Math.min(chamadas.length - 1, respostas.length - 1)];
    if (r instanceof Error) throw r;
    return typeof r === 'function' ? r(init) : r;
  };
  const esperas = [];
  const storage = memoria();
  const envio = criarEnvio({ url: '/api/simulacao', fetch, storage, esperar: async (ms) => esperas.push(ms), ...extra });
  return { envio, chamadas, esperas, storage };
};

test('sucesso na primeira tentativa não guarda nada', async () => {
  const { envio, chamadas, storage } = montar([resposta(200, { ok: true })]);
  assert.deepEqual(await envio.enviar(campos), { estado: 'enviado' });
  assert.equal(chamadas.length, 1);
  assert.equal(storage.getItem(CHAVE_FILA), null);
});

test('falha de rede e 503 são repetidos com espera crescente até dar certo', async () => {
  const { envio, chamadas, esperas } = montar([new TypeError('fetch failed'), resposta(503, {}), resposta(200, { ok: true })]);
  assert.deepEqual(await envio.enviar(campos), { estado: 'enviado' });
  assert.equal(chamadas.length, 3);
  assert.deepEqual(esperas, [800, 1600]);
});

test('o mesmo id vai em todas as tentativas (o servidor não duplica o lead)', async () => {
  const { envio, chamadas } = montar([new TypeError('x'), resposta(200, { ok: true })]);
  await envio.enviar(campos);
  const ids = chamadas.map((c) => c.init.body.get('idPedido'));
  assert.equal(ids[0], ids[1]);
  assert.ok(ids[0].length > 10);
});

test('422 é recusa: não repete, não guarda, devolve os erros', async () => {
  const { envio, chamadas, storage } = montar([resposta(422, { ok: false, erros: { whatsapp: 'x' } })]);
  const r = await envio.enviar(campos);
  assert.equal(r.estado, 'recusado');
  assert.deepEqual(r.erros, { whatsapp: 'x' });
  assert.equal(chamadas.length, 1);
  assert.equal(storage.getItem(CHAVE_FILA), null);
});

test('sem rede depois de todas as tentativas, o pedido fica guardado', async () => {
  const { envio, chamadas, storage } = montar([new TypeError('offline')]);
  const r = await envio.enviar(campos);
  assert.equal(r.estado, 'guardado');
  assert.equal(chamadas.length, 3);
  const fila = JSON.parse(storage.getItem(CHAVE_FILA));
  assert.equal(fila.length, 1);
  assert.equal(fila[0].campos.nome, 'Maria Souza');
  assert.equal(envio.pendentes(), 1);
});

test('tempo esgotado conta como falha de rede', async () => {
  const preso = (init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('abort'))));
  const { envio, chamadas } = montar([preso], { timeoutMs: 20, tentativas: 2 });
  assert.equal((await envio.enviar(campos)).estado, 'guardado');
  assert.equal(chamadas.length, 2);
});

test('200 sem o JSON esperado (portal de Wi-Fi) não vira "enviado"', async () => {
  const html = { ok: true, status: 200, json: async () => { throw new SyntaxError('html'); } };
  const { envio } = montar([html]);
  assert.equal((await envio.enviar(campos)).estado, 'guardado');
});

test('pedido guardado com anexo avisa que o anexo não foi guardado', async () => {
  const { envio } = montar([new TypeError('offline')]);
  assert.equal((await envio.enviar(campos, new Blob(['x']))).semAnexo, true);
});

test('reenviar o mesmo WhatsApp não acumula duplicatas na fila', async () => {
  const { envio } = montar([new TypeError('offline')]);
  await envio.enviar(campos);
  await envio.enviar({ ...campos, nome: 'Maria S.' });
  assert.equal(envio.pendentes(), 1);
});

test('quando a rede volta, a fila sai e esvazia', async () => {
  const off = montar([new TypeError('offline')]);
  await off.envio.enviar(campos);
  const on = criarEnvio({
    url: '/api/simulacao', storage: off.storage, esperar: async () => {},
    fetch: async () => resposta(200, { ok: true }),
  });
  assert.deepEqual(await on.reenviarPendentes(), { enviados: ['Maria Souza'], restantes: 0 });
  assert.equal(off.storage.getItem(CHAVE_FILA), null);
});

test('rede ainda fora na reenvio: a fila é mantida', async () => {
  const off = montar([new TypeError('offline')]);
  await off.envio.enviar(campos);
  assert.deepEqual(await off.envio.reenviarPendentes(), { enviados: [], restantes: 1 });
});

test('sem storage (navegação privada) o resultado é "falhou", não perda silenciosa', async () => {
  const quebrado = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem() {} };
  const { envio } = montar([new TypeError('offline')], { storage: quebrado });
  assert.equal((await envio.enviar(campos)).estado, 'falhou');
});

test('API registra o pedido uma vez só quando o mesmo id chega repetido', async () => {
  const log = console.log;
  let registros = 0;
  console.log = () => registros++;
  try {
    const req = () => {
      const fd = new FormData();
      for (const [k, v] of Object.entries({ nome: 'Ana Lima', whatsapp: '(15) 99123-4567', cidade: 'Itu', conta: '780', idPedido: 'abc-123' })) fd.append(k, v);
      return new Request('http://localhost/api/simulacao', { method: 'POST', body: fd, headers: { accept: 'application/json' } });
    };
    assert.equal((await POST(req())).status, 200);
    assert.equal((await POST(req())).status, 200);
    assert.equal(registros, 1);
  } finally {
    console.log = log;
  }
});

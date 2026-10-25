import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarPedido, mascaraWhatsapp, CIDADES } from '../src/validacao.js';
import { POST, GET } from '../api/simulacao.js';

const valido = { nome: 'Maria Souza', whatsapp: '(15) 99123-4567', cidade: 'Itu', conta: '780' };

test('pedido completo passa', () => {
  const r = validarPedido(valido);
  assert.equal(r.ok, true);
  assert.deepEqual(r.pedido, { nome: 'Maria Souza', whatsapp: '15991234567', cidade: 'Itu', conta: 780 });
});

test('os quatro campos do brief são obrigatórios; o anexo não', () => {
  const r = validarPedido({});
  assert.deepEqual(Object.keys(r.erros).sort(), ['cidade', 'conta', 'nome', 'whatsapp']);
});

test('as cidades são as do brief, mais a região', () => {
  assert.deepEqual(CIDADES.slice(0, 4), ['Sorocaba', 'Votorantim', 'Itu', 'Salto']);
  assert.equal(validarPedido({ ...valido, cidade: 'Campinas' }).ok, false);
});

test('conta abaixo de R$ 450 não bloqueia o pedido (só avisa na tela)', () => {
  assert.equal(validarPedido({ ...valido, conta: '200' }).ok, true);
});

test('conta com centavos é lida em reais', () => {
  assert.equal(validarPedido({ ...valido, conta: '780,00' }).pedido.conta, 780);
});

test('WhatsApp precisa de DDD', () => {
  assert.equal(validarPedido({ ...valido, whatsapp: '99123-4567' }).ok, false);
  assert.equal(validarPedido({ ...valido, whatsapp: '1532123456' }).ok, true);
});

test('anexo grande ou de tipo errado é recusado', () => {
  const grande = { size: 5 * 1024 * 1024, type: 'image/jpeg' };
  const zip = { size: 1000, type: 'application/zip' };
  assert.ok(validarPedido({ ...valido, anexo: grande }).erros.anexo);
  assert.ok(validarPedido({ ...valido, anexo: zip }).erros.anexo);
  assert.equal(validarPedido({ ...valido, anexo: { size: 1000, type: 'application/pdf' } }).ok, true);
});

test('máscara do WhatsApp', () => {
  assert.equal(mascaraWhatsapp('15991234567'), '(15) 99123-4567');
  assert.equal(mascaraWhatsapp('1532123456'), '(15) 3212-3456');
  assert.equal(mascaraWhatsapp('15'), '(15');
});

function requisicao(campos, accept = 'application/json') {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.append(k, v);
  return new Request('http://localhost/api/simulacao', { method: 'POST', body: fd, headers: { accept } });
}

test('API aceita pedido válido (com JavaScript)', async () => {
  const r = await POST(requisicao(valido));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
});

test('API recusa pedido inválido com os erros', async () => {
  const r = await POST(requisicao({ ...valido, whatsapp: '123' }));
  assert.equal(r.status, 422);
  assert.ok((await r.json()).erros.whatsapp);
});

test('API sem JavaScript redireciona para a confirmação', async () => {
  const r = await POST(requisicao(valido, 'text/html'));
  assert.equal(r.status, 303);
  assert.match(r.headers.get('location'), /pedido=enviado&nome=Maria#pedido$/);
});

test('API descarta robô que preenche o campo invisível', async () => {
  const log = console.log;
  let registrou = false;
  console.log = () => (registrou = true);
  try {
    const r = await POST(requisicao({ ...valido, empresa: 'spam' }));
    assert.equal(r.status, 200);
    assert.equal(registrou, false);
  } finally {
    console.log = log;
  }
});

test('API rota GET informa status da integração sem expor segredos', async () => {
  const r = await GET();
  assert.equal(r.status, 200);
  const json = await r.json();
  assert.equal(json.ok, true);
  assert.equal(typeof json.supabase, 'string');
  assert.equal(json.supabase === 'configurado' || json.supabase === 'ausente', true);
  assert.equal('key' in json, false);
  assert.equal('token' in json, false);
});

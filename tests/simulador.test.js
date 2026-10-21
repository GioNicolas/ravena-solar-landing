import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular, lerValor, reais, CONTA_MINIMA } from '../src/simulador.js';

test('o corte é R$ 450, como no brief', () => {
  assert.equal(CONTA_MINIMA, 450);
  assert.equal(simular(449).estado, 'nao-compensa');
  assert.equal(simular(450).estado, 'compensa');
});

test('sem valor, nada é estimado', () => {
  for (const v of [null, 0, -10, NaN]) assert.equal(simular(v).estado, 'vazio');
});

test('caso real do brief: R$ 780 cai para dentro da faixa e R$ 118 está nela', () => {
  const r = simular(780);
  assert.deepEqual(r.contaDepois, { min: 80, max: 200 });
  assert.ok(118 >= r.contaDepois.min && 118 <= r.contaDepois.max);
  assert.deepEqual(r.economiaAno, { min: 7020, max: 8420 });
});

test('a estimativa usa só 75% a 90% de redução', () => {
  const r = simular(1000);
  assert.deepEqual(r.contaDepois, { min: 100, max: 250 });
  assert.deepEqual(r.economiaAno, { min: 9000, max: 10800 });
});

test('a conta nunca é estimada em zero', () => {
  for (const v of [450, 451, 999, 5000, 99999]) assert.ok(simular(v).contaDepois.min > 0, `conta ${v}`);
});

test('lê o que a pessoa digita', () => {
  assert.equal(lerValor('R$ 1.250'), 1250);
  assert.equal(lerValor('780,00'), 780); // centavos ignorados, não R$ 78.000
  assert.equal(lerValor('R$ 1.250,90'), 1250);
  assert.equal(lerValor(''), null);
  assert.equal(lerValor('abc'), null);
});

test('formata em reais brasileiros', () => {
  assert.equal(reais(8420), 'R$ 8.420');
  assert.equal(reais(80), 'R$ 80');
});

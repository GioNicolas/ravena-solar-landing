import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../api/clima.js';

const original = globalThis.fetch;
const warn = console.warn;
afterEach(() => { globalThis.fetch = original; console.warn = warn; });
const FALLBACK = { ok: false, fallback: true, mediaDiaria: '4,8 kWh/m²' };

const aberta = (corpo, status = 200) => async () => new Response(JSON.stringify(corpo), { status });

test('dia: devolve temperatura e irradiação formatadas', async () => {
  globalThis.fetch = aberta({ current: { is_day: 1, temperature_2m: 27.4, direct_normal_irradiance: 640 } });
  const r = await GET();
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, fallback: false, isDay: true, temperatura: 27.4, irradiacao: 640 });
});

test('noite: isDay falso', async () => {
  globalThis.fetch = aberta({ current: { is_day: 0, temperature_2m: 18, direct_normal_irradiance: 0 } });
  assert.equal((await (await GET()).json()).isDay, false);
});

test('429 da Open-Meteo vira fallback com status 200', async () => {
  console.warn = () => {};
  globalThis.fetch = aberta({ reason: 'limite' }, 429);
  const r = await GET();
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), FALLBACK);
});

test('erro de rede vira fallback', async () => {
  console.warn = () => {};
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  assert.deepEqual(await (await GET()).json(), FALLBACK);
});

test('timeout vira fallback', async () => {
  console.warn = () => {};
  globalThis.fetch = async (_url, { signal }) => {
    assert.ok(signal, 'a requisição precisa levar um sinal de timeout');
    throw new DOMException('timeout', 'TimeoutError');
  };
  assert.deepEqual(await (await GET()).json(), FALLBACK);
});

test('resposta sem is_day vira fallback', async () => {
  console.warn = () => {};
  globalThis.fetch = aberta({ current: {} });
  assert.deepEqual(await (await GET()).json(), FALLBACK);
});

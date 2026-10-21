import '@fontsource-variable/geist';
import './styles/main.css';
import { lerValor, simular, reais } from './simulador.js';
import { iniciarFormulario, preencherConta } from './formulario.js';

const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Simulador ----------
const entrada = document.getElementById('sim-conta');
const estados = document.querySelectorAll('#sim-saida [data-estado]');
const campo = (nome) => document.querySelector(`[data-campo="${nome}"]`);
let cena = null;
let ultimoEstado = 'vazio';

function contar(el, alvo) {
  const inicio = lerValor(el.textContent) ?? 0;
  if (reduzMovimento || inicio === alvo) return void (el.textContent = reais(alvo));
  const t0 = performance.now();
  const passo = (t) => {
    const p = Math.min(1, (t - t0) / 300);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = reais(Math.round((inicio + (alvo - inicio) * e) / 10) * 10);
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function atualizar() {
  const conta = lerValor(entrada.value);
  entrada.value = conta ? conta.toLocaleString('pt-BR') : '';
  const r = simular(conta);

  estados.forEach((el) => (el.hidden = el.dataset.estado !== r.estado));
  if (r.estado === 'compensa') {
    contar(campo('depois-min'), r.contaDepois.min);
    contar(campo('depois-max'), r.contaDepois.max);
    contar(campo('ano-min'), r.economiaAno.min);
    contar(campo('ano-max'), r.economiaAno.max);
  }
  if (r.estado !== ultimoEstado) {
    ultimoEstado = r.estado;
    cena?.definirEstado(r.estado);
  }
}

entrada.addEventListener('input', atualizar);
document.getElementById('simulador').addEventListener('submit', (e) => {
  e.preventDefault();
  if (ultimoEstado === 'compensa') irParaPedido(lerValor(entrada.value));
});

// ---------- Botões de ação ----------
function irParaPedido(conta) {
  if (conta) preencherConta(conta);
  const pedido = document.getElementById('pedido');
  pedido.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth' });
  setTimeout(() => document.getElementById('f-nome')?.focus({ preventScroll: true }), reduzMovimento ? 0 : 600);
}

document.querySelectorAll('[data-cta]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    irParaPedido(a.hasAttribute('data-leva-conta') ? lerValor(entrada.value) : null);
  }),
);

iniciarFormulario();

// ---------- Cabeçalho e botão fixo no celular ----------
const barra = document.querySelector('.topo-barra');
const ctaFixo = document.querySelector('.cta-fixo');
ctaFixo.hidden = false;
const visiveis = new Set();
new IntersectionObserver((itens) => {
  itens.forEach((i) => (i.isIntersecting ? visiveis.add(i.target.id) : visiveis.delete(i.target.id)));
  ctaFixo.classList.toggle('visivel', !visiveis.has('simulador') && !visiveis.has('pedido'));
}).observe(document.getElementById('simulador'));
new IntersectionObserver((itens) => {
  itens.forEach((i) => (i.isIntersecting ? visiveis.add('pedido') : visiveis.delete('pedido')));
  ctaFixo.classList.toggle('visivel', !visiveis.has('simulador') && !visiveis.has('pedido'));
}).observe(document.getElementById('pedido'));
addEventListener('scroll', () => barra.classList.toggle('rolou', scrollY > 8), { passive: true });

// ---------- Entrada das seções ----------
const revela = new IntersectionObserver(
  (itens) => itens.forEach((i) => {
    if (i.isIntersecting) {
      i.target.classList.add('visto');
      revela.unobserve(i.target);
    }
  }),
  { rootMargin: '0px 0px -8% 0px' },
);
document.querySelectorAll('.revela').forEach((el) => revela.observe(el));

// ---------- Cena 3D: só depois da página utilizável, e só onde faz sentido ----------
function podeTer3D() {
  if (reduzMovimento) return false;
  if (!matchMedia('(min-width: 960px)').matches) return false;
  if (navigator.connection?.saveData) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

function carregarCena() {
  if (!podeTer3D()) return;
  import('./cena/cena.js').then(async ({ criarCena }) => {
    const figura = document.querySelector('.hero__cena');
    cena = await criarCena(document.getElementById('cena'));
    cena.definirEstado(ultimoEstado, true);
    requestAnimationFrame(() => figura.classList.add('viva'));
  }).catch((erro) => console.warn('Cena 3D indisponível; seguindo com a imagem estática.', erro));
}

addEventListener('load', () => {
  (window.requestIdleCallback ?? ((f) => setTimeout(f, 200)))(carregarCena, { timeout: 2000 });
});

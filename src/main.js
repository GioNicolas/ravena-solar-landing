import { lerValor, simular, reais } from './simulador.js';
import { iniciarFormulario, preencherConta } from './formulario.js';
import { rolar, odometrosAoAparecer } from './odometro.js';
import rotulosEstaticos from './cena/rotulos.json';

const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width: 960px)');
const quandoOcioso = (f) => (window.requestIdleCallback ?? ((g) => setTimeout(g, 200)))(f, { timeout: 2000 });

function podeTer3D() {
  if (reduzMovimento || !desktop.matches || navigator.connection?.saveData) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

// ---------- Simulador ----------
const sim = document.getElementById('simulador');
const entrada = document.getElementById('sim-conta');
const figura = document.querySelector('.hero__cena');
const campo = (nome) => sim.querySelector(`[data-campo="${nome}"]`);
const texto = (nome) => sim.querySelector(`[data-texto="${nome}"]`);
let casa3d = null;
let ultimoEstado = 'vazio';

function mostrarEstado(estado) {
  sim.dataset.estado = estado;
  figura.dataset.estado = estado;
  sim.querySelectorAll('#sim-saida [data-estado]').forEach((el) => (el.hidden = el.dataset.estado !== estado));
  casa3d?.definirEstado(estado);
}

function atualizar() {
  const conta = lerValor(entrada.value);
  entrada.value = conta ? conta.toLocaleString('pt-BR') : '';
  const r = simular(conta);

  if (r.estado !== ultimoEstado) {
    mostrarEstado(r.estado);
    if (r.estado === 'compensa') {
      // As barras partem cheias e encolhem até a faixa: a conta diminuindo na tela.
      sim.classList.remove('encolheu');
      void sim.offsetWidth;
      requestAnimationFrame(() => sim.classList.add('encolheu'));
    }
    ultimoEstado = r.estado;
  }
  if (r.estado !== 'compensa') return;

  const brl = (v) => reais(v).replace('R$ ', 'R$ ');
  rolar(campo('hoje'), brl(r.conta), { duracao: 500 });
  rolar(campo('depois-min'), brl(r.contaDepois.min), { duracao: 800, atraso: 120 });
  rolar(campo('depois-max'), brl(r.contaDepois.max), { duracao: 800, atraso: 180 });
  rolar(campo('ano-min'), brl(r.economiaAno.min), { duracao: 900, atraso: 240 });
  rolar(campo('ano-max'), brl(r.economiaAno.max), { duracao: 900, atraso: 300 });
  texto('depois-min').textContent = reais(r.contaDepois.min);
  texto('depois-max').textContent = reais(r.contaDepois.max);
  sim.style.setProperty('--depois-min', `${(r.contaDepois.min / r.conta) * 100}%`);
  sim.style.setProperty('--depois-max', `${(r.contaDepois.max / r.conta) * 100}%`);
}

entrada.addEventListener('input', atualizar);
sim.addEventListener('submit', (e) => {
  e.preventDefault();
  if (ultimoEstado === 'compensa') irParaPedido(lerValor(entrada.value));
});

// ---------- Botões de ação ----------
function irParaPedido(conta) {
  if (conta) preencherConta(conta);
  document.getElementById('pedido').scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth' });
  setTimeout(() => document.getElementById('f-nome')?.focus({ preventScroll: true }), reduzMovimento ? 0 : 650);
}

document.querySelectorAll('[data-cta]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    irParaPedido(a.hasAttribute('data-leva-conta') ? lerValor(entrada.value) : null);
  }),
);

// ---------- Formulário e mapa ----------
const mapa = document.getElementById('mapa');
iniciarFormulario({
  aoEscolherCidade(cidade) {
    mapa.querySelectorAll('.mapa__cidade').forEach((g) => g.classList.toggle('ativa', g.dataset.cidade === cidade));
    mapa.classList.toggle('fora', cidade === 'Outra cidade da região');
  },
});

// ---------- Cabeçalho e botão fixo no celular ----------
const barra = document.querySelector('.topo-barra');
const ctaFixo = document.querySelector('.cta-fixo');
ctaFixo.hidden = false;
const visiveis = new Set();
const vigiaCta = new IntersectionObserver((itens) => {
  itens.forEach((i) => (i.isIntersecting ? visiveis.add(i.target.id) : visiveis.delete(i.target.id)));
  ctaFixo.classList.toggle('visivel', !visiveis.has('simulador') && !visiveis.has('pedido'));
});
vigiaCta.observe(sim);
vigiaCta.observe(document.getElementById('pedido'));
addEventListener('scroll', () => barra.classList.toggle('rolou', scrollY > 8), { passive: true });

// ---------- Menu: marca a seção que está na tela ----------
const linksMenu = [...document.querySelectorAll('.menu a')];
const secoesMenu = linksMenu.map((a) => document.querySelector(a.getAttribute('href')));
// Marca a seção que cruza o meio da tela; fora das quatro (topo, caso, telhado, pedido), nenhuma.
const espiao = new IntersectionObserver(() => {
  const meio = innerHeight / 2;
  const atual = secoesMenu.find((s) => {
    const r = s.getBoundingClientRect();
    return r.top < meio && r.bottom > meio;
  });
  linksMenu.forEach((a, k) => a.classList.toggle('atual', secoesMenu[k] === atual));
}, { rootMargin: '-50% 0px -50% 0px' });
secoesMenu.forEach((s) => espiao.observe(s));

// ---------- Entrada das seções e números ----------
const revela = new IntersectionObserver(
  (itens) => itens.forEach((i) => {
    if (!i.isIntersecting) return;
    i.target.classList.add('visto');
    revela.unobserve(i.target);
  }),
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('.revela, .contas, .regua, .mapa').forEach((el) => revela.observe(el));
odometrosAoAparecer();

// ---------- Caminho das etapas: se preenche conforme a página rola ----------
// Só lê a posição da rolagem; nunca prende nem controla a rolagem.
const jornada = document.getElementById('jornada');
const marcos = [...jornada.querySelectorAll('.marco')];
let pedidoQuadro = false;

const centro = (el) => {
  const r = el.querySelector('.marco__no').getBoundingClientRect();
  return r.top + r.height / 2;
};

function atualizarJornada() {
  pedidoQuadro = false;
  const caixa = jornada.getBoundingClientRect();
  // O trilho vai do centro do primeiro marco ao centro do último.
  const ini = centro(marcos[0]) - caixa.top;
  const fim = centro(marcos.at(-1)) - caixa.top;
  jornada.style.setProperty('--trilho-ini', `${ini}px`);
  jornada.style.setProperty('--trilho-fim', `${caixa.height - fim}px`);
  const linha = innerHeight * 0.62; // o caminho acompanha um ponto um pouco abaixo do meio da tela
  const progresso = reduzMovimento ? 1 : Math.min(1, Math.max(0, (linha - caixa.top - ini) / (fim - ini)));
  jornada.style.setProperty('--progresso', progresso.toFixed(4));
  for (const m of marcos) {
    const no = m.querySelector('.marco__no').getBoundingClientRect();
    m.classList.toggle('ativo', reduzMovimento || no.top + no.height / 2 <= linha);
  }
}
addEventListener('scroll', () => {
  if (!pedidoQuadro) {
    pedidoQuadro = true;
    requestAnimationFrame(atualizarJornada);
  }
}, { passive: true });
addEventListener('resize', atualizarJornada);
atualizarJornada();

// ---------- Dúvidas: abrir e fechar com a altura animada ----------
// Sem JavaScript ou com movimento reduzido, o <details> abre e fecha do jeito nativo.
if (!reduzMovimento) {
  document.querySelectorAll('.faq details').forEach((d) => {
    const corpo = d.querySelector('.faq__corpo');
    let anim = null;
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      const abrir = !d.open || d.classList.contains('fechando');
      // Fechado, o Chrome ainda mede a altura cheia do conteúdo oculto: parte de 0.
      const de = d.open ? corpo.getBoundingClientRect().height : 0;
      anim?.cancel();
      d.classList.toggle('fechando', !abrir);
      d.open = true;
      const ate = abrir ? corpo.scrollHeight : 0;
      anim = corpo.animate(
        { height: [`${de}px`, `${ate}px`], opacity: abrir ? [0.2, 1] : [1, 0], transform: abrir ? ['translateY(-6px)', 'none'] : ['none', 'translateY(-6px)'] },
        { duration: abrir ? 420 : 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
      anim.onfinish = () => {
        anim = null;
        if (!abrir) {
          d.open = false;
          d.classList.remove('fechando');
        }
      };
    });
  });
}

// ---------- Botões que puxam o cursor (só mouse) ----------
if (!reduzMovimento && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.botao:not(.cta-fixo)').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.12}px ${(e.clientY - r.top - r.height / 2) * 0.2}px`;
    });
    b.addEventListener('pointerleave', () => (b.style.translate = ''));
  });
}

// ---------- Vista explodida do telhado ----------
const explodida = document.getElementById('explodida');
let cena3dTelhado = null;

function posicionarRotulos(r) {
  for (const nome of ['telhado', 'estrutura', 'painel']) {
    const el = explodida.querySelector(`[data-rotulo="${nome}"]`);
    const p = r[nome];
    const [x, y] = Array.isArray(p) ? p : [p.x, p.y];
    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    el.classList.toggle('rotulo--esquerda', x > 0.55); // texto do lado de dentro da imagem
  }
  if (r.separacao != null) explodida.style.setProperty('--separacao', r.separacao);
}
posicionarRotulos(rotulosEstaticos);

function camadas(separar) {
  explodida.dataset.estado = separar ? 'separado' : 'montado';
  explodida.setAttribute('aria-pressed', String(separar));
  if (cena3dTelhado) separar ? cena3dTelhado.separar() : cena3dTelhado.montar();
}

// Na primeira vez que aparece, abre sozinho e fica aberto. Depois: mouse em cima
// abre, mouse fora monta; no toque, cada toque alterna; no teclado, foco abre.
new IntersectionObserver(([i], obs) => {
  if (!i.isIntersecting) return;
  obs.disconnect();
  setTimeout(() => !explodida.classList.contains('mexeu') && camadas(true), reduzMovimento ? 0 : 500);
}, { threshold: 0.55 }).observe(explodida);

const mexeu = () => explodida.classList.add('mexeu');
explodida.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (mexeu(), camadas(true)));
explodida.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && camadas(false));
explodida.addEventListener('click', (e) => {
  if (e.pointerType === 'mouse') return;
  mexeu();
  camadas(explodida.dataset.estado !== 'separado');
});
explodida.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  mexeu();
  camadas(explodida.dataset.estado !== 'separado');
});

// ---------- Cenas 3D: só depois da página utilizável, e só onde faz sentido ----------
function carregarCasa() {
  if (!podeTer3D()) return;
  import('./cena/casa.js').then(async ({ criarCasa }) => {
    casa3d = await criarCasa(document.getElementById('cena'));
    casa3d.definirEstado(ultimoEstado, true);
    requestAnimationFrame(() => figura.classList.add('viva'));
  }).catch((erro) => console.warn('Cena 3D indisponível; seguindo com as imagens.', erro));
}

function carregarTelhado() {
  if (!podeTer3D()) return;
  new IntersectionObserver(([i], obs) => {
    if (!i.isIntersecting) return;
    obs.disconnect();
    import('./cena/explodida.js').then(async ({ criarExplodida }) => {
      cena3dTelhado = await criarExplodida(document.getElementById('cena-explodida'));
      cena3dTelhado.aoMover(posicionarRotulos);
      if (explodida.dataset.estado === 'separado') cena3dTelhado.separar();
      requestAnimationFrame(() => explodida.classList.add('viva'));
    }).catch((erro) => console.warn('Vista explodida 3D indisponível; seguindo com as imagens.', erro));
  }, { rootMargin: '400px 0px' }).observe(explodida);
}

// No celular (e sem 3D), as imagens dos outros estados da casa chegam depois.
function carregarImagensDosEstados() {
  figura.querySelectorAll('img[data-src]').forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}

addEventListener('load', () => quandoOcioso(() => {
  carregarCasa();
  carregarTelhado();
  if (!podeTer3D()) carregarImagensDosEstados();
}));

import { validarPedido, mascaraWhatsapp } from './validacao.js';
import { lerValor, CONTA_MINIMA } from './simulador.js';

const $ = (id) => document.getElementById(id);

export function preencherConta(conta) {
  const el = $('f-conta');
  el.value = conta.toLocaleString('pt-BR');
  avisoConta();
}

function avisoConta() {
  const v = lerValor($('f-conta').value);
  $('aviso-conta').hidden = !(v && v < CONTA_MINIMA);
}

function mostrarErros(erros) {
  for (const nome of ['nome', 'whatsapp', 'cidade', 'conta', 'anexo']) {
    const msg = $(`erro-${nome}`);
    const input = $(`f-${nome}`);
    msg.hidden = !erros[nome];
    msg.textContent = erros[nome] ?? '';
    input.setAttribute('aria-invalid', erros[nome] ? 'true' : 'false');
    if (erros[nome]) input.setAttribute('aria-describedby', `erro-${nome}`);
    else input.removeAttribute('aria-describedby');
  }
  const primeiro = Object.keys(erros)[0];
  if (primeiro && primeiro !== 'geral') $(`f-${primeiro}`).focus();
}

function confirmar(nome) {
  $('form-pedido').hidden = true;
  const caixa = $('enviado');
  caixa.querySelector('[data-enviado-nome]').textContent = nome ? `, ${nome}` : '';
  caixa.hidden = false;
  caixa.focus();
}

export function iniciarFormulario() {
  const form = $('form-pedido');
  const whatsapp = $('f-whatsapp');
  const conta = $('f-conta');
  const anexo = $('f-anexo');
  const botao = form.querySelector('button[type="submit"]');
  const geral = $('erro-geral');

  whatsapp.addEventListener('input', () => (whatsapp.value = mascaraWhatsapp(whatsapp.value)));
  conta.addEventListener('input', () => {
    const v = lerValor(conta.value);
    conta.value = v ? v.toLocaleString('pt-BR') : '';
    avisoConta();
  });
  anexo.addEventListener('change', () => {
    const arquivo = anexo.files[0];
    anexo.closest('.anexo').classList.toggle('tem', !!arquivo);
    form.querySelector('[data-anexo-nome]').textContent = arquivo ? arquivo.name : 'Escolher arquivo';
  });

  // Volta do envio sem JavaScript (a função redireciona com ?pedido=...).
  const params = new URLSearchParams(location.search);
  if (params.get('pedido') === 'enviado') confirmar(params.get('nome'));
  if (params.get('pedido') === 'erro') {
    geral.hidden = false;
    geral.textContent = 'Algo no pedido não passou na conferência. Revise os campos e tente de novo.';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    geral.hidden = true;
    const dados = new FormData(form);
    const arquivo = anexo.files[0] ?? null;
    const { ok, erros, pedido } = validarPedido({
      nome: dados.get('nome'),
      whatsapp: dados.get('whatsapp'),
      cidade: dados.get('cidade'),
      conta: dados.get('conta'),
      anexo: arquivo,
    });
    mostrarErros(erros);
    if (!ok) return;

    botao.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch(form.action, { method: 'POST', body: dados, headers: { Accept: 'application/json' } });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok && corpo.ok) return confirmar(pedido.nome.split(' ')[0]);
      if (corpo.erros) mostrarErros(corpo.erros);
      throw new Error('recusado');
    } catch {
      geral.hidden = false;
      geral.textContent = 'Não conseguimos enviar agora. Seus dados continuam aqui; tente de novo em instantes.';
    } finally {
      botao.removeAttribute('aria-busy');
    }
  });
}

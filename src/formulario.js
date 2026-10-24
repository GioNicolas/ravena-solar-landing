import { validarPedido, mascaraWhatsapp } from './validacao.js';
import { lerValor, CONTA_MINIMA } from './simulador.js';
import { criarEnvio } from './envio.js';

const $ = (id) => document.getElementById(id);

export function preencherConta(conta) {
  $('f-conta').value = conta.toLocaleString('pt-BR');
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

export function iniciarFormulario({ aoEscolherCidade = () => {} } = {}) {
  const form = $('form-pedido');
  const whatsapp = $('f-whatsapp');
  const conta = $('f-conta');
  const cidade = $('f-cidade');
  const anexo = $('f-anexo');
  const botao = form.querySelector('button[type="submit"]');
  const geral = $('erro-geral');
  const envio = criarEnvio({ url: form.action });

  // Pedidos que ficaram guardados por falta de rede saem ao abrir a página e quando a rede volta.
  let reenviando = false;
  const reenviar = async () => {
    if (reenviando || !envio.pendentes()) return;
    reenviando = true;
    const { enviados } = await envio.reenviarPendentes();
    reenviando = false;
    if (enviados.length) confirmar(enviados[0].split(' ')[0]);
  };
  addEventListener('online', reenviar);
  reenviar();

  // O erro de um campo some assim que a pessoa mexe nele.
  for (const nome of ['nome', 'whatsapp', 'cidade', 'conta', 'anexo']) {
    const limpar = () => {
      $(`erro-${nome}`).hidden = true;
      $(`f-${nome}`).setAttribute('aria-invalid', 'false');
      $(`f-${nome}`).removeAttribute('aria-describedby');
    };
    $(`f-${nome}`).addEventListener('input', limpar);
    $(`f-${nome}`).addEventListener('change', limpar);
  }

  whatsapp.addEventListener('input', () => (whatsapp.value = mascaraWhatsapp(whatsapp.value)));
  conta.addEventListener('input', () => {
    const v = lerValor(conta.value);
    conta.value = v ? v.toLocaleString('pt-BR') : '';
    avisoConta();
  });
  cidade.addEventListener('change', () => {
    $('aviso-cidade').hidden = cidade.value !== 'Outra cidade da região';
    aoEscolherCidade(cidade.value);
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
    const campos = Object.fromEntries([...dados].filter(([, v]) => typeof v === 'string'));
    const r = await envio.enviar(campos, arquivo, {
      aoTentar: (n, total) => {
        if (n === 1) return;
        geral.hidden = false;
        geral.textContent = `Conexão instável. Tentando de novo (${n} de ${total})…`;
      },
    });
    botao.removeAttribute('aria-busy');
    geral.hidden = true;
    if (r.estado === 'enviado') return confirmar(pedido.nome.split(' ')[0]);
    geral.hidden = false;
    if (r.estado === 'recusado') {
      mostrarErros(r.erros);
      geral.textContent = 'Algo no pedido não passou na conferência. Revise os campos e tente de novo.';
    } else if (r.estado === 'guardado') {
      geral.textContent = 'Sem conexão com o nosso servidor. Guardamos o pedido neste aparelho e enviamos sozinhos quando a conexão voltar; mantenha esta página aberta.'
        + (r.semAnexo ? ' A foto da conta não fica guardada: se quiser, envie de novo com ela depois.' : '');
    } else {
      geral.textContent = 'Não conseguimos enviar agora. Seus dados continuam aqui; tente de novo em instantes.';
    }
  });
}

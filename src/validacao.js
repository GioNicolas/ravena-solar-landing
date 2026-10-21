// Validação do pedido de simulação, usada no navegador e na função /api/simulacao.
import { lerValor } from './simulador.js';

export const CIDADES = ['Sorocaba', 'Votorantim', 'Itu', 'Salto', 'Outra cidade da região'];
export const ANEXO_MAX_BYTES = 4 * 1024 * 1024;
export const ANEXO_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

export const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');

export function validarPedido({ nome, whatsapp, cidade, conta, anexo }) {
  const erros = {};
  const n = String(nome ?? '').trim();
  const w = soDigitos(whatsapp);
  const c = lerValor(conta) ?? 0;

  if (n.length < 2) erros.nome = 'Diga seu nome para a gente saber com quem falar.';
  if (w.length < 10 || w.length > 11) erros.whatsapp = 'Confira o número com DDD, por exemplo (15) 99123-4567.';
  if (!CIDADES.includes(cidade)) erros.cidade = 'Escolha a cidade.';
  if (!c) erros.conta = 'Informe o valor médio da conta de luz.';

  if (anexo && anexo.size > 0) {
    if (anexo.size > ANEXO_MAX_BYTES) erros.anexo = 'O arquivo passa de 4 MB. Envie uma foto menor ou mande depois pelo WhatsApp.';
    else if (anexo.type && !ANEXO_TIPOS.includes(anexo.type)) erros.anexo = 'Envie uma foto ou um PDF da conta.';
  }

  return {
    ok: Object.keys(erros).length === 0,
    erros,
    pedido: { nome: n, whatsapp: w, cidade, conta: c },
  };
}

export function mascaraWhatsapp(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Recebe o pedido de simulação. Função da Vercel (Node, assinatura Web).
// Com JavaScript, o navegador pede JSON; sem JavaScript, o formulário é enviado
// direto e a resposta redireciona de volta para a página com a confirmação.

import { validarPedido } from '../src/validacao.js';

// DESTINO DE DEMONSTRAÇÃO. O cliente ainda não informou para onde vão os pedidos
// (SPEC.md, pendências). Hoje o pedido fica registrado no log da Vercel; trocar
// aqui por e-mail ou CRM da Ravena quando o destino real chegar.
async function enviarPedido(pedido, anexo) {
  console.log('[pedido de simulação]', JSON.stringify({
    ...pedido,
    anexo: anexo ? { nome: anexo.name, tipo: anexo.type, bytes: anexo.size } : null,
    recebidoEm: new Date().toISOString(),
  }));
}

export async function POST(request) {
  const querJson = (request.headers.get('accept') ?? '').includes('application/json');
  const responder = (status, corpo, destino) =>
    querJson
      ? Response.json(corpo, { status })
      : Response.redirect(new URL(destino, request.url), 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return responder(400, { ok: false, erros: { geral: 'Não conseguimos ler o pedido.' } }, '/?pedido=erro#pedido');
  }

  // Campo invisível: gente não preenche, robô preenche. Responde como sucesso e descarta.
  if (form.get('empresa')) return responder(200, { ok: true }, '/?pedido=enviado#pedido');

  const anexo = form.get('anexo');
  const arquivo = anexo && typeof anexo === 'object' && anexo.size > 0 ? anexo : null;
  const { ok, erros, pedido } = validarPedido({
    nome: form.get('nome'),
    whatsapp: form.get('whatsapp'),
    cidade: form.get('cidade'),
    conta: form.get('conta'),
    anexo: arquivo,
  });

  if (!ok) return responder(422, { ok: false, erros }, '/?pedido=erro#pedido');

  await enviarPedido(pedido, arquivo);
  return responder(200, { ok: true }, `/?pedido=enviado&nome=${encodeURIComponent(pedido.nome.split(' ')[0])}#pedido`);
}

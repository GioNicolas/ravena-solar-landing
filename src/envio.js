// Envio do pedido que não perde lead: tenta de novo com espera crescente, separa
// "o servidor recusou" de "não deu para falar com o servidor" e, se a rede não
// voltar, guarda o pedido no aparelho para reenviar depois. Lógica pura: fetch,
// storage e espera entram por parâmetro, para o teste não precisar de rede.

export const CHAVE_FILA = 'ravena:pedidos-pendentes';

// Falha de rede, tempo esgotado, 408, 429 e 5xx valem nova tentativa; 4xx não.
const transitorio = (status) => status === 408 || status === 429 || status >= 500;

async function umaTentativa(fetchFn, url, form, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetchFn(url, { method: 'POST', body: form, headers: { Accept: 'application/json' }, signal: ctl.signal });
    const corpo = await r.json().catch(() => ({}));
    if (r.ok && corpo.ok) return { tipo: 'ok' };
    // 200 sem o JSON esperado é proxy ou portal de Wi-Fi no meio: trata como rede.
    if (r.ok || transitorio(r.status)) return { tipo: 'transitorio' };
    return { tipo: 'recusado', erros: corpo.erros ?? {} };
  } catch {
    return { tipo: 'transitorio' };
  } finally {
    clearTimeout(timer);
  }
}

function montar(campos, id, arquivo) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) form.append(k, v);
  form.append('idPedido', id);
  if (arquivo) form.append('anexo', arquivo);
  return form;
}

export function criarEnvio({
  url,
  fetch: fetchFn = (...args) => globalThis.fetch(...args),
  storage = globalThis.localStorage,
  esperar = (ms) => new Promise((r) => setTimeout(r, ms)),
  tentativas = 3,
  timeoutMs = 10000,
  espera = 800,
} = {}) {
  const ler = () => {
    try {
      const fila = JSON.parse(storage.getItem(CHAVE_FILA) ?? '[]');
      return Array.isArray(fila) ? fila : [];
    } catch {
      return [];
    }
  };
  const gravar = (fila) => {
    try {
      if (fila.length) storage.setItem(CHAVE_FILA, JSON.stringify(fila));
      else storage.removeItem(CHAVE_FILA);
      return true;
    } catch {
      return false; // navegação privada ou cota cheia
    }
  };

  async function tentar(campos, id, arquivo, aoTentar) {
    let ultimo;
    for (let n = 1; n <= tentativas; n++) {
      aoTentar?.(n, tentativas);
      ultimo = await umaTentativa(fetchFn, url, montar(campos, id, arquivo), timeoutMs);
      if (ultimo.tipo !== 'transitorio') return ultimo;
      if (n < tentativas) await esperar(espera * 2 ** (n - 1));
    }
    return ultimo;
  }

  return {
    pendentes: () => ler().length,

    // -> { estado: 'enviado' | 'recusado' | 'guardado' | 'falhou', erros?, semAnexo? }
    async enviar(campos, arquivo = null, { aoTentar } = {}) {
      const id = globalThis.crypto.randomUUID();
      const r = await tentar(campos, id, arquivo, aoTentar);
      if (r.tipo === 'ok') return { estado: 'enviado' };
      if (r.tipo === 'recusado') return { estado: 'recusado', erros: r.erros };
      // Um pedido pendente por WhatsApp: reenviar o formulário não duplica o lead.
      const fila = ler().filter((p) => p.campos.whatsapp !== campos.whatsapp);
      fila.push({ id, campos, criadoEm: new Date().toISOString(), semAnexo: !!arquivo });
      return gravar(fila) ? { estado: 'guardado', semAnexo: !!arquivo } : { estado: 'falhou' };
    },

    // Tenta de novo o que ficou guardado. Chamado ao abrir a página e quando a rede volta.
    async reenviarPendentes() {
      const enviados = [];
      for (const p of ler()) {
        const r = await tentar(p.campos, p.id, null);
        if (r.tipo === 'transitorio') break; // rede ainda fora: mantém o resto
        gravar(ler().filter((x) => x.id !== p.id));
        if (r.tipo === 'ok') enviados.push(p.campos.nome);
      }
      return { enviados, restantes: ler().length };
    },
  };
}

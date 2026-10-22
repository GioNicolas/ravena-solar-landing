import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { POST } from './api/simulacao.js';

const LOGO = new URL('./src/assets/logo.svg', import.meta.url);

// As cores da marca saem da logo, nunca digitadas (brief: "sempre pegamos do arquivo").
// Sol = o círculo; telhado = o path; "SOLAR" = o texto laranja.
export function coresDaLogo(svg = readFileSync(LOGO, 'utf8')) {
  const pega = (re, nome) => {
    const m = svg.match(re);
    if (!m) throw new Error(`brand: não achei a cor "${nome}" em logo.svg`);
    return m[1].toUpperCase();
  };
  return {
    sun: pega(/<circle[^>]*fill="(#[0-9a-fA-F]{6})"/, 'sun'),
    navy: pega(/<path[^>]*fill="(#[0-9a-fA-F]{6})"/, 'navy'),
    ember: pega(/<text[^>]*fill="(#[0-9a-fA-F]{6})"[^>]*>SOLAR</, 'ember'),
  };
}

function brand() {
  const ID = 'virtual:brand';
  return {
    name: 'brand',
    resolveId: (id) => (id === ID ? '\0' + ID : null),
    load(id) {
      if (id !== '\0' + ID) return null;
      this.addWatchFile(fileURLToPath(LOGO));
      return `export default ${JSON.stringify(coresDaLogo())};`;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const c = coresDaLogo();
        const css = `:root{--navy:${c.navy};--sun:${c.sun};--ember:${c.ember}}`;
        return html.replace('</head>', `<style id="brand">${css}</style></head>`);
      },
    },
  };
}

// Em dev e preview, /api/simulacao roda a mesma função que vai para a Vercel.
function apiLocal() {
  const middleware = async (req, res, next) => {
    if (!req.url.startsWith('/api/simulacao')) return next();
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.end();
    }
    const request = new Request(new URL(req.url, `http://${req.headers.host}`), {
      method: 'POST',
      headers: req.headers,
      body: Readable.toWeb(req),
      duplex: 'half',
    });
    const resposta = await POST(request);
    res.statusCode = resposta.status;
    resposta.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await resposta.arrayBuffer()));
  };
  return {
    name: 'api-local',
    // Bloco com chaves: se o hook retornar uma função, o Vite a trata como pós-hook.
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

// No build, o CSS vai dentro do HTML: a página pinta já estilizada, sem piscar
// o HTML puro e sem esperar uma segunda requisição.
function cssEmLinha() {
  return {
    name: 'css-em-linha',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html) return;
      for (const [nome, arquivo] of Object.entries(bundle)) {
        if (!nome.endsWith('.css')) continue;
        const tag = new RegExp(`<link rel="stylesheet"[^>]*href="/${nome.replace(/[.]/g, '\\.')}"[^>]*>`);
        if (!tag.test(html.source)) continue;
        html.source = html.source.replace(tag, () => `<style>${arquivo.source}</style>`);
        delete bundle[nome];
      }
    },
  };
}

export default defineConfig({
  plugins: [brand(), apiLocal(), cssEmLinha()],
  // O pacote da cena (three.js) passa de 500 kB, mas só carrega depois da página
  // utilizável e só no desktop (DESIGN.md, Cena 3D).
  build: { chunkSizeWarningLimit: 600 },
});

# Ravena Solar · landing page

Página de venda de energia solar residencial da Ravena Solar (Sorocaba e região). Uma ação só: **pedir simulação**.

> Cliente fictício, criado para a prática P1 da 202. Todos os números da página vêm do brief do cliente.

- [`SPEC.md`](SPEC.md): o que entra na página, o que ficou de fora e por quê.
- [`DESIGN.md`](DESIGN.md): como a página é feita e como se parece.
- [`CLAUDE.md`](CLAUDE.md): as instruções que o agente lê ao abrir o projeto.
- [`verificacao/`](verificacao/): a evidência de que o resultado foi conferido.

## Rodar

```
npm install
npm run dev        # http://localhost:5173 (inclui a rota /api/simulacao)
npm run build      # gera dist/
npm test           # testes + checagem de que todo número da página está no brief (rode depois do build)
npm run stills     # renderiza as imagens estáticas a partir da cena 3D (usa o Chrome/Edge instalado)
npm run capturas   # capturas de verificação a partir do build
```

## Como é feita

- Vite, JavaScript puro e CSS. Sem framework.
- **As cores da marca são lidas da logo** (`src/assets/logo.svg`) pelo plugin `brand` do `vite.config.js`, sem nenhum hex da marca digitado.
- A cena do topo é three.js modelado em código: uma maquete de telhado de barro com painéis. Ela carrega depois que a página já está utilizável, só no desktop, e reage ao simulador. No celular e com movimento reduzido entra uma imagem renderizada da mesma cena. Nenhuma imagem da página é foto, nem imagem gerada por IA.
- O formulário funciona com ou sem JavaScript.

## Destino dos pedidos (pendente com o cliente)

O cliente ainda não informou para onde vão os pedidos de simulação. Hoje a função `api/simulacao.js` valida o pedido e **o registra no log da Vercel** (destino de demonstração). Para ligar ao destino real, troque o corpo de `enviarPedido()` nesse arquivo pelo envio ao e-mail ou CRM da Ravena.

A página não usa o número de WhatsApp do site antigo, que é um número de exemplo. É a Ravena que chama a pessoa no WhatsApp que ela informou.

## Deploy

Importe o repositório na Vercel. Ela detecta o Vite (build `npm run build`, saída `dist/`) e publica `api/simulacao.js` como função, sem configuração.

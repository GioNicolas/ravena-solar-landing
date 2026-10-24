# CLAUDE.md

Landing page da Ravena Solar (P1 da 202). Uma página, uma ação: **pedir simulação**.

Leia antes de mudar qualquer coisa:
- [`SPEC.md`](SPEC.md): o que entra, o que fica de fora e por quê. Manda em tudo.
- [`DESIGN.md`](DESIGN.md): como a página é feita e como se parece.
- Brief do cliente: `C:\Users\Nicolas\Documents\trilha-202\praticas\p1\brief.md`.

## Regras que não se negociam

- **Todo número da página vem do brief.** Não arredonde para cima, não derive prazo, não invente estatística. `npm test` roda `scripts/checar-numeros.mjs`, que falha se aparecer número fora da lista. Se um número novo for legítimo, ele precisa estar no brief e entra na lista com a linha do brief ao lado.
- **Nenhuma imagem como prova inventada.** Nada de foto (de banco, de IA ou realista) apresentada como obra, cliente ou equipe da Ravena. Os visuais são a cena 3D em código e as imagens renderizadas dela.
- **Cores da marca saem do `src/assets/logo.svg`**, pelo plugin `brand` do `vite.config.js`. Nunca digite o hex da marca em CSS ou JS.
- **Texto:** pt-BR, direto, com número. Proibido "energia do futuro", "sustentabilidade" como slogan, "revolução solar", "grátis", "conta zerada", "economia de 95%". A visita é "sem custo e sem compromisso".
- **Uma ação só.** Todo botão leva ao pedido de simulação. Não adicione link para Instagram, telefone, WhatsApp da empresa ou site antigo.
- **O número de WhatsApp do site antigo é falso**, assim como o CNPJ. Não use nenhum dos dois.
- **Movimento:** cada animação dispara uma vez quando a sua seção aparece e trabalha para um bloco; nada prende a rolagem ou atrasa a chegada ao formulário. Respeite `prefers-reduced-motion` (tudo no estado final). O 3D nunca é requisito: a página funciona inteira sem ele.
- **A casa 3D não muda de tamanho nem de número de painéis com a conta digitada**: isso sugeriria um dimensionamento que só a visita faz.

## Estrutura

- `index.html`: a página. O CSS entra por `<link>` e, no build, vai para dentro do HTML (plugin `css-em-linha`).
- `src/main.js`: liga o simulador, o formulário, o mapa, as animações de entrada e a carga tardia do 3D.
- `src/simulador.js`: a lógica pura do simulador, testada.
- `src/odometro.js`: os números que rolam dígito por dígito.
- `src/formulario.js` e `src/validacao.js`: máscaras, validação (a mesma do servidor) e envio.
- `src/cena/`: as cenas three.js.
  - `base.js`: peças e palco compartilhados;
  - `casa.js`: a casa do topo;
  - `explodida.js`: o telhado do bloco 4;
  - `rotulos.json`: gerado por `npm run stills`.

  Tudo carrega por `import()` dinâmico, só no desktop. Fora dele entram as imagens em `public/`, renderizadas das mesmas cenas: se mudar uma cena, rode `npm run stills`.
- `src/styles/main.css`: o CSS.
- `api/simulacao.js`: a função da Vercel que recebe o pedido. O destino real fica em `enviarPedido()`.
- `scripts/`: verificação de números e render das imagens estáticas.
- `verificacao/`: a evidência de verificação, que vai para o repositório.

## Comandos

```
npm run dev       # servidor local
npm test          # testes do simulador + checagem de números (precisa do build)
npm run build     # gera dist/
npm run stills    # renderiza poster, close e imagem OG a partir da cena (Edge headless)
npm run verificar-envio  # prova o envio com rede ruim num navegador (precisa do build)
```

## Antes de dizer que terminou

Rode `npm run build && npm test`, abra a página no celular (390px) e no desktop (1440px) e confira o simulador abaixo e acima de R$ 450 e o envio do formulário. Atualize `verificacao/` se algo visível mudou.

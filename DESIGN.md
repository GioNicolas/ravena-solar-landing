# Design — Landing page Ravena Solar

O *o quê* e o *porquê* estão na [`SPEC.md`](SPEC.md). Este arquivo diz *como* a página é feita e como ela se parece. Se os dois discordarem, a spec vence.

## Direção

**Dia, papel quente e azul-marinho.** Uma página clara, precisa e confiável, mais próxima de um relatório técnico bem diagramado do que de um anúncio. O âmbar aparece como luz do sol: no botão, no número que importa e na cena 3D. O resto fica em silêncio.

Três palavras que guiam cada escolha: **técnico, honesto, quente.**

## Cores

As cores da marca **não são digitadas no código**. O build lê `src/assets/logo.svg` e gera as variáveis a partir dele (`vite.config.js`, plugin `brand`). Se a logo mudar, a página muda junto.

| Token | Origem | Uso |
|---|---|---|
| `--navy` | telhado e "RAVENA" da logo | texto principal, títulos, faixas escuras |
| `--sun` | sol da logo | botão principal, destaques, luz da cena |
| `--ember` | "SOLAR" da logo | só em elemento grande ou gráfico (contraste ~3:1 no papel, insuficiente para texto pequeno) |

Neutros derivados, não da marca: papel `#FBF7F0`, papel 2 `#F3ECE0`, texto secundário (marinho a 72%), linhas (marinho a 12%).

**Contraste.** O botão principal é âmbar com texto marinho (~6:1). Texto corrido é marinho no papel (~11:1). Todo texto passa no AA.

O verde-água do site antigo (`#1d8f7e`) não está na logo e não entra.

## Tipografia

- **Geist** (variável, servida pela própria página, sem Google Fonts em tempo de execução) para tudo.
- Títulos: peso 600, entreletra −0,03em, `clamp(2.4rem, 4.2vw + 1rem, 4.6rem)` no topo.
- Números sempre com `font-variant-numeric: tabular-nums`. Números são o argumento desta marca, então aparecem grandes.
- Formato brasileiro: `R$ 14 mil`, `4,8`, `75%`, separador de milhar com ponto.

## Layout

- Largura máxima de 1200px; respiro lateral de 20px no celular e 32px no desktop.
- Seções com espaço vertical de `clamp(72px, 10vw, 140px)`.
- Feita para o celular primeiro. No celular, uma barra fixa com "Pedir simulação" aparece depois que o simulador sai da tela e some quando o formulário entra.
- Cabeçalho mínimo: logo e um único botão. Sem menu, porque a página tem uma ação só.

## Blocos (na ordem da spec)

1. **Topo.** À esquerda, o título, a linha de apoio e o cartão do simulador. À direita, a cena 3D. No celular, o simulador vem antes e, no lugar da cena, entra uma imagem estática dela.
2. **Caso real.** Uma "conta de luz" desenhada em HTML/CSS: antes, R$ 780; média de 12 meses, R$ 118, −85%. A legenda traz Sorocaba · 6,4 kWp · ligado em março de 2025. É uma conta genérica, sem logo nem layout da CPFL.
3. **A gente não some.** Grade de números grandes: 6 anos, 412 sistemas, 11 pessoas com carteira assinada, 4,8 no Google (137 avaliações). Embaixo, assistência autorizada e acompanhamento no primeiro ano.
4. **Telhado.** Close renderizado da cena 3D (painel sobre telha de barro) e o texto da garantia de 5 anos com infiltração. Nenhum detalhe técnico de fixação que o brief não afirme.
5. **Quanto custa.** Barra da faixa de R$ 14 mil a R$ 19 mil. Linha do tempo em SVG de 0 a 25+ anos, com o retorno em 3–4 anos destacado. Caixa da Lei 14.300.
6. **Do pedido à energia ligada.** Quatro passos em linha (empilhados no celular) e uma barra de 45–60 dias com a homologação na CPFL marcada como a parte que não depende da Ravena.
7. **Dúvidas.** Três `<details>`, abertos por teclado, sem JavaScript.
8. **Pedido.** O formulário, na faixa marinho, o único bloco escuro da página: é o destino.

Rodapé: logo, "Integradora de energia solar residencial · Sorocaba (SP)", cidades atendidas, distribuidora CPFL. Sem CNPJ, sem telefone e sem endereço, porque o cliente não informou esses dados.

## Simulador

Lógica em `src/simulador.js`, pura e testada.

- Entrada: conta média mensal em reais, com teclado numérico no celular (`inputmode="numeric"`) e máscara `R$`.
- **Abaixo de R$ 450:** "Com conta abaixo de R$ 450 o sistema não se paga em prazo razoável. A gente mesmo desaconselha." Não mostra o botão de pedido.
- **R$ 450 ou mais:** conta depois = conta × 10% a 25%; economia = conta × 75% a 90%, ao mês e ao ano. Valores arredondados para R$ 10.
- O texto fixo abaixo do resultado diz que é uma estimativa com a faixa média dos clientes, que a conta não zera (taxa mínima e custo do fio) e que o número exato sai da simulação.
- Não calcula potência, painéis, preço nem parcela (ver spec).
- O botão "Pedir minha simulação" rola até o formulário com a conta já preenchida e põe o foco no nome.
- O resultado é anunciado por `aria-live="polite"`.

## Formulário

- Campos: nome; WhatsApp com DDD (máscara `(15) 99999-9999`, 10 ou 11 dígitos); cidade (Sorocaba, Votorantim, Itu, Salto ou "Outra cidade da região"); conta média; foto ou PDF da conta, opcional, até 4 MB.
- Conta abaixo de R$ 450: aviso no campo, sem bloquear o envio.
- Campo invisível contra robôs (*honeypot*).
- Envio `multipart/form-data` para `/api/simulacao`. Sem JavaScript, o formulário funciona do mesmo jeito: a função responde com redirecionamento e a página mostra a confirmação.
- **Sucesso:** "Pedido recebido, {nome}. A Ravena responde no seu WhatsApp no mesmo dia útil." **Erro:** mensagem clara e os dados preservados.

## Função `/api/simulacao`

`api/simulacao.js` é uma função da Vercel (Node, assinatura Web `POST(request)`).

- Valida tudo de novo no servidor.
- **Destino de demonstração:** registra o pedido no log da Vercel. Do anexo, só nome, tipo e tamanho.
- O destino real (e-mail ou CRM do cliente) entra em um único ponto, `enviarPedido()`, sinalizado no README.

## Cena 3D

`src/cena/` usa three.js e é carregada por `import()` dinâmico, só depois que a página está utilizável.

- **Modelada em código:** um trecho de telhado com telhas de barro (instanciadas) e uma fileira de painéis (células azul-escuras com moldura de alumínio, material físico com verniz). Luz de fim de tarde com sombra suave, ambiente de estúdio, tom ACES. As cores vêm do mesmo plugin `brand`.
- **Câmera 3/4 fixa,** com deriva lenta de ±2° e leve paralaxe com o mouse no desktop. Sem controles de órbita.
- **Reage ao simulador:**
  - neutro antes de digitar;
  - com R$ 450 ou mais, o sol esquenta e um brilho atravessa os painéis;
  - abaixo de R$ 450, a luz esfria e perde força.
  - A transição leva cerca de 800 ms.
- **Carregamento:**
  - a imagem estática (`poster`) da cena aparece primeiro, sempre, e o canvas entra por cima com um fade;
  - WebGL só no desktop, com WebGL2, sem `saveData` e sem `prefers-reduced-motion`; nos outros casos fica só a imagem estática;
  - a cena para de renderizar fora da tela e com a aba oculta;
  - limite de 2 para a densidade de pixels.
- **Imagens estáticas** (`poster` do topo, close do telhado, imagem de compartilhamento): renderizadas da própria cena por `scripts/render-stills.mjs` com o Edge headless. Não é foto e não é imagem de IA.
- Nenhuma legenda sugere que a cena é uma obra real.

## Movimento

- Entrada das seções: opacidade e deslocamento de 12px, 500ms, `cubic-bezier(.22,1,.36,1)`, uma vez só.
- O resultado do simulador conta até o valor em 300ms.
- **Proibido:** prender a rolagem, cena guiada pelo scroll, paralaxe em texto, carrossel, animação em loop que puxe o olho para longe do simulador.
- Com `prefers-reduced-motion: reduce`, nada se move. A página fica completa do mesmo jeito.

## Desempenho e acessibilidade

- **Metas de Lighthouse (celular):**
  - Desempenho ≥ 95; Acessibilidade, Boas práticas e SEO = 100;
  - LCP < 2 s;
  - o 3D não conta no caminho crítico.
- HTML semântico, rótulo em todo campo, foco visível, alvos de toque de pelo menos 44px, `lang="pt-BR"`.
- Metadados: título, descrição, Open Graph com a imagem renderizada da cena, favicon do sol da logo.

## Verificação (vai para `verificacao/`)

- `npm test`:
  - testa a lógica do simulador, incluindo os limites (449, 450, valores altos);
  - `scripts/checar-numeros.mjs` extrai todos os números do HTML gerado e falha se algum não estiver na lista tirada do brief.
- Capturas no desktop (1440px) e no celular (390px): topo, simulador abaixo e acima de R$ 450, formulário enviado.
- Relatório do Lighthouse para celular.
- `verificacao/README.md` com o que foi checado, como, e o resultado.

# Design — Landing page Ravena Solar

O *o quê* e o *porquê* estão na [`SPEC.md`](SPEC.md). Este arquivo diz *como* a página é feita e como ela se parece. Se os dois discordarem, a spec vence.

## Direção

**Dia, papel quente e azul-marinho.** Uma página clara, precisa e confiável, mais próxima de um relatório técnico bem diagramado do que de um anúncio. O âmbar aparece como luz do sol: no botão, no número que importa, na energia que corre na casa 3D. O resto fica em silêncio.

Três palavras guiam cada escolha: **técnico, honesto, quente.**

Para o ritmo, o fundo alterna entre papel, papel 2 e marinho. As duas faixas marinho são "A gente não some" e o pedido: a prova mais importante e o destino.

## Cores

As cores da marca **não são digitadas no código**. O build lê `src/assets/logo.svg` e gera as variáveis a partir dele (`vite.config.js`, plugin `brand`): o CSS recebe `--navy`, `--sun` e `--ember`, e o 3D recebe as mesmas cores por `virtual:brand`. Se a logo mudar, a página e as cenas mudam junto.

| Token | Origem | Uso |
|---|---|---|
| `--navy` | telhado e "RAVENA" da logo | texto, títulos, faixas escuras, janelas e porta da casa 3D |
| `--sun` | sol da logo | botão principal, destaques, sol do céu, maçaneta, anel do −85% |
| `--ember` | "SOLAR" da logo | energia correndo na casa, risco do R$ 780, avisos. Só em elemento grande ou gráfico (~3:1 no papel) |

Neutros derivados, não da marca: papel `#FBF7F0`, papel 2 `#F3ECE0`, papel 3 `#EBE2D3`, texto secundário (marinho a 74%), linhas (marinho a 13%). O verde-água do site antigo não está na logo e não entra.

**Contraste.** O botão é âmbar com texto marinho (~6:1). Texto corrido é marinho no papel (~11:1). Lighthouse de acessibilidade: 100.

## Tipografia

- **Geist** variável, servida pela própria página, com uma fonte reserva com as métricas ajustadas, para o texto não refluir quando a Geist chega.
- Títulos com peso 620 e entreletra −0,035em. Números sempre com `tabular-nums`, porque são o argumento desta marca e aparecem grandes.
- Formato brasileiro: `R$ 14 mil`, `4,8`, `75%`, milhar com ponto.

## Layout

- Largura máxima de 1200px; respiro lateral de 20px no celular e 32px no desktop. Feita para o celular primeiro.
- Cabeçalho: logo, menu de seções e um único botão de largura fixa. O menu (Por que a Ravena · Quanto custa · Como funciona · Dúvidas) só leva a partes da própria página, então não cria uma segunda ação; a seção que cruza o meio da tela fica marcada. Aparece só a partir de 960px; no celular, o botão fixo já cobre a navegação que importa. No celular, um botão fixo de "Pedir simulação" aparece quando o simulador sai da tela e some quando o formulário entra.
- No build, o CSS vai dentro do HTML (plugin `css-em-linha`): a primeira pintura já sai estilizada.

## Blocos (na ordem da spec)

1. **Topo.**
   - À esquerda: título, apoio e o simulador.
   - À direita: a casa 3D, com céu em CSS (sol e nuvens) atrás. As colunas se alinham pelo topo, para a cena não pular quando o resultado do simulador aparece.
   - No resultado:
     - duas barras ("Hoje" e "Com energia solar"), a segunda partindo cheia e encolhendo até a faixa;
     - valores em odômetro;
     - economia por ano;
     - o botão de pedido.
2. **A gente não some** (faixa marinho). Quatro números grandes (6 · 412 · 11 · 4,8★) que rolam até o valor ao aparecer, e três garantias de serviço.
3. **Caso real.** Duas contas desenhadas em HTML/CSS. Ao aparecer:
   - a segunda conta entra e rola de R$ 780 até R$ 118;
   - um risco laranja atravessa o R$ 780;
   - um anel enche até −85%.

   A conta é genérica, sem logo nem layout da CPFL.
4. **Telhado, vista explodida.** Cena 3D de um trecho de telhado com três camadas:
   - telhas de barro sobre ripas e caibros;
   - trilhos com ganchos;
   - painéis.

   - Na primeira vez que a figura aparece, as camadas se separam sozinhas e ficam abertas.
   - Depois disso, passar o mouse separa e tirar o mouse monta. No toque, cada toque alterna; no teclado, Enter ou espaço alternam.
   - Uma dica no canto ("Passe o mouse" ou "Toque", conforme o aparelho) some depois da primeira interação.
   - Os rótulos ("Painel solar", "Estrutura de fixação", "Seu telhado de barro") acompanham as peças e só aparecem com as camadas separadas. Leva o selo "Ilustração".
5. **Quanto custa.**
   - Três cartões.
   - **Régua de anos**: 25 blocos, um por ano. Os três primeiros e meio, em marinho, são o tempo de o sistema se pagar; o resto, em âmbar cada vez mais forte, é a vida do sistema. Os blocos sobem em sequência ao aparecer, e a legenda tem duas linhas.
   - **Lei 14.300**: faixa marinho com a pergunta à esquerda (selo "Lei 14.300" e título grande) e, à direita, a resposta curta em âmbar ("Vale. Mas o cálculo mudou.") seguida da explicação.
6. **Do pedido à energia ligada.**
   - Um caminho vertical com seis marcos: simulação, visita, proposta e assinatura, homologação na CPFL (marco menor, cartão listrado: espera que não depende da Ravena), instalação e sistema ligado (45–60 dias depois da assinatura).
   - O trilho se preenche conforme a página rola, com um ponto de luz na ponta. Cada marco acende quando o trilho passa por ele.
   - O cálculo só **lê** a posição da rolagem: a página nunca é presa nem rolada pelo script.
   - No desktop, os cartões alternam dos dois lados e se encaixam em zigue-zague; no celular, o trilho fica à esquerda.
7. **Dúvidas.** Três `<details>` que entram em sequência ao aparecer. Com JavaScript, abrir e fechar animam a altura da resposta (420 ms para abrir, 320 ms para fechar) e o ícone gira já no clique; sem JavaScript ou com movimento reduzido, o `<details>` abre do jeito nativo.
8. **Pedido** (faixa marinho).
   - À esquerda: texto e mapa da região em SVG. No desktop, o mapa (até 300px, com a legenda ao lado) desce até a base do formulário, para as duas colunas terminarem juntas.
   - À direita: o formulário.
   - O mapa usa a posição real das cidades, convertida de latitude e longitude em km, com Sorocaba no centro:
     - Votorantim a 5 km;
     - Itu a 31 km;
     - Salto a 37 km;
     - o raio de 80 km.
   - Ao aparecer, o raio se desenha, as ligações saem da sede e as cidades surgem.
   - A cidade escolhida no formulário acende no mapa. "Outra cidade da região" destaca o raio e mostra o aviso de alcance.

Rodapé: logo, "Integradora de energia solar residencial · Sorocaba (SP)", cidades atendidas, distribuidora CPFL. Sem CNPJ, sem telefone e sem endereço, porque o cliente não informou.

## Simulador

Lógica em `src/simulador.js`, pura e testada.

- Entrada: conta média em reais inteiros. O ponto é separador de milhar e os centavos são ignorados ("780,00" vale R$ 780).
- **Abaixo de R$ 450:** aviso franco, sem botão de pedido. A casa fica nublada.
- **R$ 450 ou mais:**
  - conta depois = conta × 10% a 25%;
  - economia = conta × 75% a 90% × 12;
  - tudo arredondado para R$ 10.
- Não calcula potência, painéis, preço nem parcela (ver spec).
- O resultado é anunciado por `aria-live`; uma frase completa só para leitor de tela acompanha as barras.

## Odômetro

`src/odometro.js`. Cada dígito é uma fita de 0 a 9 que desliza, com os dígitos da direita girando um pouco mais devagar. O texto final fica no `aria-label`. No HTML estático já está o valor final, que serve sem JavaScript, para buscadores e para a checagem de números. Com movimento reduzido, o valor troca direto.

## Cenas 3D

three.js, modelado em código e carregado por `import()` dinâmico só depois que a página está utilizável:

- `src/cena/base.js`:
  - peças compartilhadas: telhas instanciadas, painéis com células desenhadas em canvas, trilhos e ganchos, materiais;
  - o palco: renderizador, ambiente, sombra e um laço que pausa fora da tela e com a aba oculta;
  - um aleatório com semente fixa, para a cena ao vivo e as imagens saírem iguais.
- `src/cena/casa.js`: a casa em maquete.
  - Base arredondada, gramado, caminho e árvores.
  - Telhado de duas águas de barro com 10 painéis.
  - Janelas e porta no marinho da logo.
  - Inversor com luz de status, padrão de entrada com medidor, poste e fio.
  - Estados:

    | Estado | Sol | O que acontece |
    |---|---|---|
    | vazio | manhã | sistema parado |
    | compensa | sobe e esquenta | um brilho atravessa os painéis; partículas laranja correm do telhado ao inversor, ao medidor e ao poste; luz do inversor e visor do medidor acendem |
    | não compensa | luz fria e fraca | nada corre |

  - A casa **não muda de tamanho nem de número de painéis** com a conta (spec).
- `src/cena/explodida.js`: a vista explodida, com a câmera de frente para o beiral para as camadas se lerem empilhadas.

**Onde roda:**
- WebGL só no desktop (≥ 960px), com WebGL2, sem `saveData` e sem movimento reduzido.
- Nos outros casos entram **imagens renderizadas das mesmas cenas**, que trocam de estado do mesmo jeito:
  - a casa tem uma imagem por estado, com crossfade;
  - o telhado tem montado e separado, com os rótulos posicionados por `src/cena/rotulos.json`.
- As imagens e o JSON saem de `npm run stills` (Edge headless). Não são foto nem imagem de IA.

## Movimento

- **Princípio:** cada animação dispara uma vez, quando a sua seção aparece, e serve para o número ou a ideia daquele bloco ser lido. A exceção é o caminho das etapas, que acompanha a rolagem nos dois sentidos, mas sem nunca controlá-la.
- **Cenas 3D:**
  - o vidro dos painéis fica 8 mm acima da moldura, com *polygon offset*, para não haver *z-fighting* (o vidro piscava de longe);
  - na casa, o reflexo do ambiente é contido, para não virar faixas brancas;
  - as bordas do canvas e das imagens são esfumadas por máscara, para a maquete não terminar numa linha reta.
- **Detalhes:**
  - entrada das seções: 18px e opacidade, 700ms, `cubic-bezier(.22,1,.36,1)`, com leve escalonamento entre irmãos;
  - botões: puxam levemente o cursor (só mouse) e um reflexo os atravessa no hover.
- **Proibido:**
  - prender a rolagem;
  - cena guiada pelo scroll;
  - paralaxe em texto;
  - carrossel;
  - animação em loop que puxe o olho para longe do simulador.

  O pulso da sede no mapa roda 3 vezes e para.
- Com `prefers-reduced-motion: reduce`, nada se move e tudo aparece no estado final (números, anel, linhas, mapa).

## Formulário e função

- Campos, máscaras, honeypot e envio sem JavaScript: como na spec, em `src/formulario.js` e `src/validacao.js` (a mesma validação roda no servidor).
- `api/simulacao.js`: função da Vercel. O destino é de demonstração (log da Vercel), trocado em um único ponto, `enviarPedido()`.

## Desempenho e acessibilidade

- **Metas do Lighthouse (celular):**
  - Desempenho ≥ 95; Acessibilidade, Boas práticas e SEO = 100;
  - LCP < 2 s;
  - CLS < 0,05.
- O 3D nunca está no caminho crítico.
- HTML semântico, rótulo em todo campo, foco visível, alvos de toque de pelo menos 44px, `lang="pt-BR"`.

## Verificação

Ver [`verificacao/README.md`](verificacao/README.md):
- `npm test`;
- capturas em duas larguras com todos os estados;
- Lighthouse.

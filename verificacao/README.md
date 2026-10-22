# Verificação

O que foi conferido antes da entrega, como e com que resultado. Tudo aqui é reproduzível com os comandos indicados. Este relatório é da **revisão 3** da página (ver `SPEC.md`, Revisões).

## 1. Testes automáticos: `npm run build && npm test`

**19 testes passam e nenhum falha.**

- **Simulador** (`tests/simulador.test.js`):
  - o corte é R$ 450 (449 não compensa, 450 compensa);
  - a estimativa usa só a faixa de 75% a 90% do brief;
  - a conta nunca é estimada em zero;
  - o caso real do brief (R$ 780 → R$ 118) cai dentro da faixa calculada;
  - "780,00" é lido como R$ 780, e não R$ 78.000. Esse bug foi encontrado pelo próprio teste e corrigido.
- **Pedido** (`tests/pedido.test.js`):
  - os quatro campos do brief são obrigatórios e o anexo não;
  - só as cidades atendidas são aceitas;
  - conta abaixo de R$ 450 avisa, mas não bloqueia o pedido;
  - limites do anexo;
  - a função `/api/simulacao` aceita o pedido válido, recusa o inválido com os erros, redireciona quando não há JavaScript e descarta robôs pelo campo invisível.
- **Números** (`scripts/checar-numeros.mjs`):
  - extrai todos os números do texto da página gerada e falha se algum não estiver na lista tirada do brief;
  - cada número da lista traz a linha do brief de onde veio;
  - resultado: **25 números no texto, todos do brief.**

## 2. Comportamento na tela: `npm run capturas`

Página gerada (`dist/`) aberta no Edge em duas larguras: **desktop de 1440px** e **celular de 390px**, com toque e densidade 2x. Arquivos em [`capturas/`](capturas/).

| O que foi feito | O que se esperava | Resultado |
|---|---|---|
| Abrir a página | Simulador na primeira tela; casa 3D no desktop, imagem dela no celular | ok (`*-1-topo.png`); 3D entrou no desktop, imagem no celular |
| Digitar R$ 300 | Aviso franco, sem botão de pedido; nuvens chegam e a luz cai | ok (`*-2-simulador-300.png`, `desktop-2b-topo-300.png`) |
| Digitar R$ 780 | Barra "Hoje" R$ 780 e "Com energia solar" R$ 80 a R$ 200 encolhendo; economia de R$ 7.020 a R$ 8.420 por ano; o sol sobe e a energia corre na casa | ok (`*-3-simulador-780.png`, `desktop-3b-topo-780.png`) |
| Rolar a página inteira | Cada bloco no estado final das animações: números, contas com anel de −85%, régua de anos, mapa | ok (`*-4-pagina-inteira.png`) |
| Mouse sobre o telhado (desktop) ou dois toques (celular) | Telhado separado em três camadas, rótulos sem se sobrepor | ok (`*-4b-telhado-separado.png`) |
| Tirar o mouse do telhado (desktop) | Camadas montam de novo | ok (`desktop-4c-telhado-montado.png`) |
| Rolar até o meio do caminho das etapas | Trilho preenchido até a linha de leitura; etapas acima dela acesas, abaixo apagadas; página rola livre | ok (`*-4d-etapas-rolando.png`) |
| Clicar em "Pedir minha simulação" | Rola até o formulário com a conta preenchida | ok: conta levada = 780 nas duas larguras |
| Enviar vazio | Erro em cada campo obrigatório, campo em vermelho | ok (`*-5-pedido-erros.png`) |
| Escolher "Outra cidade da região" | Aviso de alcance de 80 km e raio do mapa destacado | ok (`*-5b-pedido-outra-cidade.png`) |
| Escolher Itu | Itu acende no mapa | ok (`*-5c-mapa-itu.png`) |
| Preencher e enviar | Pedido chega à função; formulário dá lugar à confirmação com o nome | ok (`*-6-pedido-enviado.png`); o log da função registrou o pedido |
| Medir a borda direita de cada elemento | Nada passa da largura da tela | 0px de estouro nas duas larguras |
| Console do navegador | Nenhum erro | nenhum erro nas duas larguras |

**Bugs achados pela verificação e corrigidos antes da entrega:**
- **Revisão 1:**
  - o campo do simulador empurrava o topo para fora da tela no celular;
  - o formulário continuava visível acima da confirmação;
  - "780,00" virava R$ 78.000.
- **Revisão 2:**
  - a cena 3D pulava quando o resultado do simulador aparecia (colunas centralizadas na vertical; agora alinhadas pelo topo);
  - a página piscava o HTML puro antes do CSS (agora o CSS vai dentro do HTML);
  - os rótulos da vista explodida se sobrepunham e passavam da borda no celular;
  - o odômetro ficava fora da linha de base do texto;
  - as mensagens de erro do formulário continuavam na tela depois que a pessoa corrigia o campo.
- **Revisão 3:**
  - o vidro dos painéis piscava de longe (*z-fighting* com a moldura, 0,5 mm de distância);
  - a maquete da casa encostava nas bordas do canvas e formava uma caixa com bordas retas.

## 3. Lighthouse, celular: [`lighthouse/celular.report.html`](lighthouse/celular.report.html)

| Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|
| **100** | **100** | **100** | **100** |

- LCP 1,4 s; FCP 1,2 s; Speed Index 1,5 s; bloqueio total 40 ms; CLS 0,002.
- A textura de papel foi medida antes de ficar: com ela, Speed Index de 1,4 s; sem ela, 1,3 s.
- Uma primeira execução, com o servidor ainda frio, deu Speed Index de 3,7 s. Duas execuções seguidas com e sem textura deram 1,3–1,4 s, e o relatório guardado é de uma execução nova.

## 4. Conferência manual contra a spec

- [x] Uma ação só: todo botão leva ao pedido de simulação.
- [x] Nenhuma imagem apresentada como obra, cliente ou equipe da Ravena. A vista explodida tem o selo "Ilustração"; a casa é maquete.
- [x] A casa 3D não muda de tamanho nem de número de painéis com a conta.
- [x] O mapa mostra só as quatro cidades do brief e o raio, com posições reais.
- [x] O número de WhatsApp e o CNPJ do site antigo (de exemplo) não aparecem.
- [x] Sem "grátis", "conta zerada" como promessa, "energia do futuro" ou "revolução solar".
- [x] Cores da marca lidas do `logo.svg`, no CSS e no 3D.
- [x] Nada prende a rolagem. Com `prefers-reduced-motion`, sem animação e sem 3D, tudo no estado final.
- [x] O formulário funciona sem JavaScript (coberto por teste).

## O que não foi verificado

- Envio real para a Ravena: o destino é de demonstração, porque o cliente não informou o dele (ver README).
- Safari/iOS: não havia aparelho disponível. A verificação foi feita no motor Chromium (Edge).

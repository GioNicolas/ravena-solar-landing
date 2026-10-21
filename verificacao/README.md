# Verificação

O que foi conferido antes da entrega, como e com que resultado. Tudo aqui é reproduzível com os comandos indicados.

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
  - limites do anexo (tamanho e tipo);
  - a função `/api/simulacao` aceita o pedido válido, recusa o inválido com os erros, redireciona quando não há JavaScript e descarta robôs pelo campo invisível.
- **Números** (`scripts/checar-numeros.mjs`):
  - extrai todos os números do texto da página gerada e falha se algum não estiver na lista tirada do brief;
  - cada número da lista traz a linha do brief de onde veio;
  - resultado: **40 números no texto, todos do brief.**

## 2. Comportamento na tela: `npm run capturas`

Página gerada (`dist/`) aberta no Edge em duas larguras: **desktop de 1440px** e **celular de 390px**, com toque e densidade 2x. Arquivos em [`capturas/`](capturas/).

| O que foi feito | O que se esperava | Resultado |
|---|---|---|
| Abrir a página | Simulador visível na primeira tela | ok nas duas larguras (`*-1-topo.png`) |
| Digitar R$ 300 | Aviso franco de que não compensa, sem botão de pedido; a cena 3D esfria | ok (`*-2-simulador-300.png`, `desktop-2b-topo-300.png`) |
| Digitar R$ 780 | Conta entre R$ 80 e R$ 200; economia de R$ 7.020 a R$ 8.420 por ano; botão de pedido; a cena esquenta | ok (`*-3-simulador-780.png`, `desktop-3b-topo-780.png`) |
| Clicar em "Pedir minha simulação" | Rola até o formulário com a conta já preenchida | ok: conta levada = 780 nas duas larguras |
| Enviar o formulário vazio | Erro em cada campo obrigatório, campo em vermelho, foco no primeiro | ok (`*-5-pedido-erros.png`) |
| Preencher e enviar | Pedido chega à função; formulário dá lugar à confirmação com o nome | ok (`*-6-pedido-enviado.png`); o log da função registrou o pedido |
| Página inteira | Todos os blocos da spec, na ordem | ok (`*-4-pagina-inteira.png`) |
| Medir largura de cada elemento | Nada passa da largura da tela | 0px de estouro nas duas larguras |
| Console do navegador | Nenhum erro | nenhum erro nas duas larguras |
| Cena 3D | Entra no desktop; no celular, só a imagem estática | desktop: entrou; celular: imagem estática |

**Dois bugs foram achados pelas capturas e corrigidos antes da entrega:**
- no celular, o campo do simulador empurrava o topo para fora da tela;
- depois do envio, o formulário continuava visível acima da confirmação.

## 3. Lighthouse, celular: [`lighthouse/celular.report.html`](lighthouse/celular.report.html)

| Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|
| **100** | **100** | **100** | **100** |

- LCP 1,4 s; FCP 1,1 s; bloqueio total 0 ms; CLS 0,002.
- O CLS caiu de 0,07 para 0,002 depois de duas mudanças: o botão do cabeçalho ganhou largura fixa, e a fonte reserva passou a ter as métricas da Geist.

## 4. Conferência manual contra a spec

- [x] Uma ação só: todo botão leva ao pedido de simulação. Sem Instagram, telefone ou site antigo.
- [x] Nenhuma imagem apresentada como obra, cliente ou equipe da Ravena. O close do telhado tem o selo "Ilustração".
- [x] O número de WhatsApp e o CNPJ do site antigo (de exemplo) não aparecem.
- [x] Sem "grátis", "conta zerada", "energia do futuro" ou "revolução solar". A visita é "sem custo e sem compromisso".
- [x] Cores da marca lidas do `logo.svg` (`<style id="brand">` no HTML gerado).
- [x] Nada prende a rolagem. Com `prefers-reduced-motion`, a página fica sem animação e sem 3D.
- [x] O formulário funciona sem JavaScript (envio normal e redirecionamento da função; coberto por teste).

## O que não foi verificado

- Envio real para a Ravena: o destino é de demonstração, porque o cliente não informou o dele (ver README).
- Safari/iOS: não havia aparelho disponível. A verificação foi feita no motor Chromium (Edge).

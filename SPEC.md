# Spec — Landing page Ravena Solar (P1)

## O problema

A Ravena Solar é uma integradora de energia solar residencial de Sorocaba: 6 anos, 11 pessoas, 412 sistemas instalados, equipe própria de carteira assinada. O site atual é institucional ("quem somos", "missão", formulário no rodapé) e quase não traz cliente: chegam ~12 pedidos de simulação por mês, quase todos por indicação e Instagram, e boa parte de gente com conta baixa demais para comprar.

**Quem compra:** dono da própria casa, 35–60 anos, com família, que não pretende se mudar e paga **mais de R$ 450 de luz por mês**. Pede três orçamentos e leva de 2 a 8 semanas para decidir. O medo número um é a empresa sumir; o segundo é estragar o telhado.

## A ação

**Pedir uma simulação.** É a única ação da página. Todo botão leva a ela; não há segundo objetivo (nada de Instagram, "fale conosco" ou link para o site antigo).

Campos: nome, WhatsApp, cidade e valor médio da conta. Foto ou PDF da conta é opcional e nunca bloqueia o envio.

A página tem dois trabalhos ao mesmo tempo: **trazer mais pedidos** (meta do cliente: de 12 para 25 por mês) e **trazer menos pedidos de quem não pode comprar** (conta abaixo de R$ 450). Uma página que só aumenta o volume falha pela metade.

## A promessa

A conta de luz cai de 75% a 90% — não zera — com uma empresa da região que instala com equipe própria e continua por perto depois de ligado.

## O que entra, em ordem, e por quê

1. **Topo com simulador.** Título com a promessa em número, a região atendida e o corte "para contas acima de R$ 450". Logo abaixo, um campo: *quanto você paga de luz por mês?* A pessoa digita e vê na hora a faixa de economia mensal e anual. Dali ela segue para o pedido com a conta já preenchida.
   - *Por quê:* coloca a ação na primeira tela e dá algo em troca antes de pedir dados. O mesmo elemento converte e filtra: abaixo de R$ 450 a página diz com franqueza que o sistema não se paga e que a própria Ravena desaconselha, em vez de empurrar o formulário.
   - *Limite do cálculo:* usa só o que o brief afirma — redução de 75% a 90% sobre a conta informada. Não estima potência, número de painéis nem preço por pessoa, porque o brief não dá base para isso; quem dimensiona é a visita técnica. O resultado é apresentado como faixa e como estimativa, nunca como promessa.

2. **Um caso real com números conferidos.** Casa em Sorocaba, conta de R$ 780, sistema de 6,4 kWp instalado em março de 2025, conta média dos últimos 12 meses em R$ 118.
   - *Por quê:* é a prova mais forte do brief, porque é verificável e local. Mostra também que a conta não zera, o que reforça a credibilidade em vez de enfraquecê-la.

3. **"A gente não some."** 6 anos de empresa, 11 pessoas, 412 sistemas residenciais, equipe própria com carteira assinada (sem terceirizar instalação), assistência técnica autorizada da marca de inversor, acompanhamento da produção no primeiro ano, nota 4,8 no Google com 137 avaliações.
   - *Por quê:* responde ao medo número um, num setor em que pelo menos três empresas da região fecharam deixando obra pela metade. Fica no começo da página, não escondido numa lista de perguntas.

4. **O telhado.** A garantia de 5 anos da instalação cobre qualquer infiltração causada pela obra, inclusive em telha de barro. A visita técnica mede o telhado antes de qualquer proposta.
   - *Por quê:* é o medo número dois, e ele tem uma resposta concreta.

5. **Quanto custa e quando se paga.** Investimento entre R$ 14 mil e R$ 19 mil para o tamanho típico de casa; financiamento com entrada zero possível, com parcela que na maioria dos casos fica próxima do que a pessoa já paga de luz; retorno em 3 a 4 anos; sistema dura mais de 25. A Lei 14.300 é explicada neste mesmo bloco, sem rodeio: existe uma cobrança sobre a energia injetada, que sobe ano a ano; continua valendo a pena, mas o cálculo mudou — por isso a simulação é feita com a conta da pessoa, não com uma média.
   - *Por quê:* quem pede três orçamentos vai comparar preço. Dar a faixa filtra quem não pode e poupa o vendedor. "Taxaram o sol" é a terceira objeção e é sobre dinheiro, então mora aqui.

6. **Do pedido à energia ligada, em 4 passos.** Resposta por WhatsApp no mesmo dia útil, visita técnica sem custo e sem compromisso, proposta com três tamanhos de sistema e instalação em dois dias. Prazo total de 45 a 60 dias da assinatura até o sistema ligado, com a observação honesta de que a homologação na CPFL é a parte que não depende da Ravena.
   - *Por quê:* tira o medo do passo seguinte. Pedir simulação não compromete nada.

7. **Três dúvidas curtas.** E se eu mudar de casa? (o sistema valoriza o imóvel e pode ser transferido.) E à noite e em dia nublado? (produz menos e não produz; o crédito acumulado no mês compensa.) Preciso de bateria? (não, para casa ligada na rede.)
   - *Por quê:* são as objeções que sobram depois dos blocos acima, e cada uma se responde em uma frase.

8. **O pedido de simulação**, no fim da página e também alcançado pelo simulador do topo. Depois do envio, a pessoa sabe exatamente o que acontece: resposta por WhatsApp no mesmo dia útil.
   - *Como o pedido chega:* o formulário envia os dados para a Ravena, e é a Ravena que chama a pessoa no WhatsApp *dela*, como o brief descreve. A página não depende do número da empresa, que o cliente não informou. O número do site antigo, (15) 99000-0000, é visivelmente de exemplo, como o CNPJ 00.000.000/0001-00, então não aparece nem é usado em lugar nenhum. O destino do envio fica em um único ponto do código; até o cliente informar o dele, aponta para um destino de demonstração, sinalizado no README.

No celular, o botão de pedir simulação fica sempre acessível na tela.

## O que fica de fora, e por quê

- **"Quem somos", "nossa missão", história da empresa.** Foi isso que fez o site antigo não trazer cliente. O que importa da história (6 anos, 11 pessoas, equipe própria) entra como prova no bloco 3, não como texto institucional.
- **Explicação de como a energia solar funciona** (sol, painel, inversor, rede, crédito). Quem pede três orçamentos já está decidido a comprar energia solar; a dúvida dele é *de quem* comprar. A única parte que toca um medo (noite e dia nublado) vira uma pergunta curta no bloco 7.
- **Ticket médio de R$ 16.300.** É métrica interna. A faixa de R$ 14 mil a R$ 19 mil já dá a referência de que o comprador precisa.
- **Garantias de painel (25 anos) e de inversor (10 anos) com destaque.** São garantias de fabricante, que qualquer concorrente também oferece. Aparecem em uma linha; o destaque vai para a garantia de 5 anos da *instalação*, que é da Ravena e responde ao medo do telhado.
- **Detalhes de potência (5 a 8 kWp, 12 a 20 painéis).** São número técnico que o comprador não usa para decidir pedir simulação. A potência aparece só dentro do caso real, onde dá credibilidade.
- **Etapas internas detalhadas** (projeto, homologação, vistoria, ligação). Viram o prazo total de 45 a 60 dias e a observação sobre a CPFL. Listar cada etapa é processo da empresa, não decisão do comprador.
- **Indústria, comércio acima de 75 kWp e manutenção de sistema de outra empresa.** Não são o público desta página. Apresentá-los só aumenta pedidos que a Ravena não atende.
- **Segunda ação** (Instagram, telefone, "conheça nossa história"). Toda saída é um pedido de simulação a menos.
- **Depoimentos em vídeo e fotos de obra.** O brief diz que existem (3 vídeos e 40 fotos), mas nenhum arquivo veio no material. Não entra imagem — de banco, gerada por IA ou realista de qualquer origem — apresentada como obra, cliente ou equipe da Ravena. Para um comprador cujo medo número um é ser enganado, numa região com Procon ativo, prova inventada destrói exatamente a confiança que a página precisa construir. Quando o cliente mandar o material, as fotos reforçam os blocos 3 e 4 e os vídeos o bloco 2.

## Imagens e movimento

A página é rica visualmente sem fingir prova: cena 3D de um telhado com painéis no topo, a conta de luz do caso real como peça gráfica, closes renderizados de detalhes (como a fixação na telha). Tudo é claramente ilustração, nunca "obra nossa em Votorantim".

Regra para qualquer visual ou animação: **precisa trabalhar para um bloco, ou não entra.**

- A cena do topo reage ao simulador (é a resposta visual ao valor digitado), não é enfeite.
- Nenhuma animação prende a rolagem ou faz a pessoa esperar para chegar ao pedido. A página rola como uma página normal.
- O simulador funciona e aparece antes da cena 3D carregar; sem 3D (celular fraco, conexão lenta), a página continua completa.
- Quem pede menos movimento no sistema operacional recebe a página sem animação.

## Regras de texto

- Direto e com número. Nada de "energia do futuro", "sustentabilidade" como slogan ou "revolução solar".
- Nunca "economia de 95%", nunca "conta zerada", nunca "grátis". A visita é "sem custo e sem compromisso".
- Nenhum prazo ou número que não esteja no brief. A região tem um Procon ativo e o setor tem fama ruim, então a página deve ser a mais honesta da concorrência.
- Cores da marca tiradas do arquivo da logo, nunca digitadas de memória.

## Pendências

- Fotos e vídeos de obra: a pedir ao cliente (não vieram no material).
- Destino real dos pedidos (e-mail ou sistema da Ravena): a pedir ao cliente. Até lá, destino de demonstração (bloco 8).

## Como saber se deu certo

- Pela meta do cliente: 25 pedidos de simulação por mês e menos pedidos de contas abaixo de R$ 450.
- Na entrega: em até 5 segundos, quem chega entende o que a Ravena faz, para quem é e o que fazer; o pedido funciona no celular; nenhum número da página está fora do brief.

# Modelagem de Dados — Ravena Solar

Descrição do domínio em português antes do código:

1. Um cliente (lead) tem:
   - `id`: identificador único;
   - `nome`: nome completo;
   - `whatsapp`: número com DDD;
   - `cidade`: cidade do imóvel (Sorocaba, Votorantim, Itu, Salto);
   - `criado_em`: data e hora do cadastro.

2. Um pedido de simulação tem:
   - `id`: identificador único do pedido;
   - `cliente_id`: aponta para o cliente que fez o pedido (chave estrangeira);
   - `conta_media`: valor médio mensal da conta de luz em reais;
   - `tipo_imovel`: residencial (casa), comercial, etc.;
   - `status`: estado do atendimento (novo, em contato, qualificado, descartado);
   - `criado_em`: data e hora em que a simulação foi solicitada.

3. Relação:
   - Um cliente pode ter vários pedidos de simulação ao longo do tempo (1 para N), mas cada pedido de simulação pertence a exatamente um cliente.

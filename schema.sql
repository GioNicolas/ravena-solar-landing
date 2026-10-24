-- Ravena Solar: schema para Postgres / Supabase.
-- Origem: MODELAGEM.md (clientes 1:N pedidos_simulacao).
-- Rodar no SQL Editor do Supabase ou com: psql "$DATABASE_URL" -f schema.sql

begin;

create table clientes (
  id         bigint generated always as identity primary key,
  nome       text not null check (length(btrim(nome)) > 0),
  -- só dígitos, com DDD (ex.: 15999990001); a máscara fica na interface
  whatsapp   text not null check (whatsapp ~ '^[0-9]{10,11}$'),
  cidade     text not null check (length(btrim(cidade)) > 0),
  criado_em  timestamptz not null default now(),
  -- o mesmo número não vira dois clientes: um novo pedido do mesmo lead
  -- entra como novo pedido, não como novo cliente
  constraint clientes_whatsapp_unico unique (whatsapp)
);

create table pedidos_simulacao (
  id           bigint generated always as identity primary key,
  cliente_id   bigint not null
               references clientes (id) on delete cascade,
  conta_media  numeric(10, 2) not null check (conta_media > 0),
  tipo_imovel  text not null default 'residencial'
               check (tipo_imovel in ('residencial', 'comercial', 'outro')),
  status       text not null default 'novo'
               check (status in ('novo', 'em contato', 'qualificado', 'descartado')),
  criado_em    timestamptz not null default now()
);

-- Postgres não cria índice para chave estrangeira sozinho; sem este,
-- o JOIN por cliente e o ON DELETE CASCADE varrem a tabela inteira.
create index pedidos_simulacao_cliente_id_idx on pedidos_simulacao (cliente_id);
-- fila de atendimento: "quais pedidos estão novos?"
create index pedidos_simulacao_status_idx on pedidos_simulacao (status);
-- ordenação do mais recente para o mais antigo
create index pedidos_simulacao_criado_em_idx on pedidos_simulacao (criado_em desc);

commit;

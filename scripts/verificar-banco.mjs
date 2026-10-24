// Verifica o modelo de MODELAGEM.md num SQLite em memória (node:sqlite, sem dependência).
// O DDL abaixo é o equivalente em SQLite do schema.sql (Postgres): mesmas tabelas,
// colunas, chaves, ON DELETE CASCADE e índices. Não executa o schema.sql em si.
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE clientes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL CHECK (length(trim(nome)) > 0),
    whatsapp  TEXT NOT NULL UNIQUE,
    cidade    TEXT NOT NULL CHECK (length(trim(cidade)) > 0),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE pedidos_simulacao (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
    conta_media NUMERIC NOT NULL CHECK (conta_media > 0),
    tipo_imovel TEXT NOT NULL DEFAULT 'residencial'
                CHECK (tipo_imovel IN ('residencial', 'comercial', 'outro')),
    status      TEXT NOT NULL DEFAULT 'novo'
                CHECK (status IN ('novo', 'em contato', 'qualificado', 'descartado')),
    criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX pedidos_simulacao_cliente_id_idx ON pedidos_simulacao (cliente_id);
  CREATE INDEX pedidos_simulacao_status_idx ON pedidos_simulacao (status);
  CREATE INDEX pedidos_simulacao_criado_em_idx ON pedidos_simulacao (criado_em DESC);
`);

// Dados fictícios: nomes e números de exemplo, não são pessoas nem contatos reais.
const leads = [
  { nome: 'Marina Exemplo', whatsapp: '15999990001', cidade: 'Sorocaba',
    pedidos: [{ conta: 320, tipo: 'residencial', status: 'novo' }] },
  { nome: 'Carlos Exemplo', whatsapp: '15999990002', cidade: 'Votorantim',
    pedidos: [
      { conta: 580, tipo: 'residencial', status: 'descartado' },
      { conta: 1200, tipo: 'comercial', status: 'em contato' },
    ] },
  { nome: 'Paula Exemplo', whatsapp: '11999990003', cidade: 'Itu',
    pedidos: [{ conta: 760, tipo: 'residencial', status: 'qualificado' }] },
];

const novoCliente = db.prepare('INSERT INTO clientes (nome, whatsapp, cidade) VALUES (?, ?, ?)');
const novoPedido = db.prepare(
  'INSERT INTO pedidos_simulacao (cliente_id, conta_media, tipo_imovel, status) VALUES (?, ?, ?, ?)',
);
for (const l of leads) {
  const { lastInsertRowid: id } = novoCliente.run(l.nome, l.whatsapp, l.cidade);
  for (const p of l.pedidos) novoPedido.run(id, p.conta, p.tipo, p.status);
}

const consulta = `
  SELECT c.id, c.nome, c.cidade,
         COUNT(p.id) AS pedidos,
         COALESCE(SUM(p.conta_media), 0) AS soma_contas
    FROM clientes c
    LEFT JOIN pedidos_simulacao p ON p.cliente_id = c.id
   GROUP BY c.id
   ORDER BY c.id`;

const imprimir = (titulo, linhas) => {
  console.log(`\n${titulo}`);
  console.table(linhas.map((r) => ({ ...r, soma_contas: `R$ ${Number(r.soma_contas).toFixed(2)}` })));
};

const resultado = db.prepare(consulta).all();
imprimir('Clientes e a soma dos pedidos (JOIN + GROUP BY):', resultado);

assert.equal(resultado.length, 3);
assert.deepEqual(resultado.map((r) => r.pedidos), [1, 2, 1]);
assert.deepEqual(resultado.map((r) => Number(r.soma_contas)), [320, 1780, 760]);
console.log('OK  3 clientes, 4 pedidos; o cliente com 2 pedidos soma R$ 1780.00');

// A chave estrangeira recusa pedido sem cliente.
assert.throws(() => novoPedido.run(999, 100, 'residencial', 'novo'), /FOREIGN KEY/);
console.log('OK  pedido de cliente inexistente é recusado (FOREIGN KEY)');

// ON DELETE CASCADE: apagar o cliente apaga os pedidos dele.
const carlos = db.prepare("SELECT id FROM clientes WHERE nome = 'Carlos Exemplo'").get().id;
db.prepare('DELETE FROM clientes WHERE id = ?').run(carlos);
const restantes = db.prepare('SELECT COUNT(*) AS n FROM pedidos_simulacao').get().n;
assert.equal(restantes, 2);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM pedidos_simulacao WHERE cliente_id = ?').get(carlos).n, 0);
console.log('OK  apagar o cliente com 2 pedidos apagou os 2 pedidos (CASCADE); sobraram 2');

imprimir('Depois de apagar Carlos Exemplo:', db.prepare(consulta).all());
console.log('\nTudo verificado.');

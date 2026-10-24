// Falha se o texto da página (dist/index.html) tiver algum número que não venha do brief.
// Regra do CLAUDE.md: nenhum número inventado. Para liberar um número novo,
// ele precisa estar no brief; adicione aqui com a linha do brief ao lado.
import { readFileSync, existsSync } from 'node:fs';

const PERMITIDOS = new Map([
  ['75', 'linha 21: a conta cai entre 75% e 90%'],
  ['90', 'linha 21'],
  ['85', 'derivado da linha 50: (780 - 118) / 780 = 84,9%, arredondado'],
  ['412', 'linhas 15 e 46: sistemas instalados'],
  ['6', 'linha 13: seis anos'],
  ['11', 'linha 13: onze pessoas'],
  ['4,8', 'linha 47: nota no Google. ATENÇÃO: o card de clima também usa 4,8 kWh/m²/dia (média de Sorocaba), dado pedido pelo cliente da aula 2.2 e que NÃO está no brief; o checador não distingue os dois'],
  ['137', 'linha 47: avaliações'],
  ['780', 'linha 50: conta antes'],
  ['118', 'linha 50: conta média depois'],
  ['6,4', 'linha 50: potência do caso'],
  ['2025', 'linha 50: instalado em março de 2025'],
  ['12', 'linha 50: últimos doze meses'],
  ['450', 'linha 33: conta mínima'],
  ['14', 'linha 19: investimento a partir de R$ 14 mil'],
  ['19', 'linha 19: até R$ 19 mil'],
  ['3', 'linha 21: retorno de três a quatro anos'],
  ['4', 'linha 21'],
  ['25', 'linhas 21 e 25: dura mais de 25 anos; garantia de 25 anos do painel'],
  ['5', 'linha 25: 5 anos de garantia da instalação'],
  ['10', 'linha 25: 10 anos do inversor'],
  ['45', 'linha 23: 45 a 60 dias'],
  ['60', 'linha 23'],
  ['80', 'linha 13: raio de 80 km'],
  ['14.300', 'linha 39: Lei 14.300'],
  ['1', 'numeração dos passos'],
  ['2', 'numeração dos passos'],
]);

const arquivo = new URL('../dist/index.html', import.meta.url);
if (!existsSync(arquivo)) {
  console.error('checar-numeros: rode "npm run build" antes.');
  process.exit(1);
}

const texto = readFileSync(arquivo, 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<head[\s\S]*?<\/head>/g, ' ')
  .replace(/<svg[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>[\s\S]*?<\/svg>/g, ' $1 ') // do SVG, só o texto
  .replace(/aria-label="([^"]*)"/g, ' $1 ') // rótulo acessível também é texto
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ');

// Números "inteiros" do texto: 14.300, 4,8, 6,4, 2025... Centavos ",00" das contas são ignorados.
const achados = [...texto.replace(/,00\b/g, '').matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0]);
const intrusos = [...new Set(achados)].filter((n) => !PERMITIDOS.has(n));

if (intrusos.length) {
  console.error(`checar-numeros: número fora do brief na página: ${intrusos.join(', ')}`);
  process.exit(1);
}
console.log(`checar-numeros: ok (${achados.length} números no texto, todos do brief).`);

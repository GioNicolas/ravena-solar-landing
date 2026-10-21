// Estimativa do topo. Usa só o que o brief afirma: a conta cai de 75% a 90%
// na média dos clientes, e abaixo de R$ 450 a própria Ravena desaconselha.
// Não estima potência, painéis, preço nem parcela (SPEC.md, bloco 1).

export const CONTA_MINIMA = 450;
export const REDUCAO_MIN = 0.75;
export const REDUCAO_MAX = 0.9;

const arredonda10 = (v) => Math.round(v / 10) * 10;

// Reais inteiros: o ponto é separador de milhar e o que vem depois da vírgula
// (centavos) é ignorado, para "780,00" não virar R$ 78.000.
export function lerValor(texto) {
  const digitos = String(texto ?? '').split(',')[0].replace(/\D/g, '').slice(0, 6);
  return digitos ? Number(digitos) : null;
}

export function simular(conta) {
  if (conta == null || !Number.isFinite(conta) || conta <= 0) return { estado: 'vazio' };
  if (conta < CONTA_MINIMA) return { estado: 'nao-compensa', conta };

  return {
    estado: 'compensa',
    conta,
    contaDepois: {
      min: arredonda10(conta * (1 - REDUCAO_MAX)),
      max: arredonda10(conta * (1 - REDUCAO_MIN)),
    },
    economiaAno: {
      min: arredonda10(conta * REDUCAO_MIN * 12),
      max: arredonda10(conta * REDUCAO_MAX * 12),
    },
  };
}

const brl = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
export const reais = (v) => `R$ ${brl.format(v)}`;

// Clima de Sorocaba para o card do topo. Função da Vercel (Node, assinatura Web).
// A Open-Meteo é só um enfeite da página: se ela falhar, a resposta continua 200
// com um fallback seguro e o card mostra a média da região.

// CLIMA_URL existe para a verificação apontar a rota para uma URL que falha.
const URL_PADRAO = 'https://api.open-meteo.com/v1/forecast?latitude=-23.50&longitude=-47.45&current=temperature_2m,is_day,direct_normal_irradiance&timezone=America/Sao_Paulo';
const urlOpenMeteo = () => process.env.CLIMA_URL ?? URL_PADRAO;

const FALLBACK = { ok: false, fallback: true, mediaDiaria: '4,8 kWh/m²' };

const cabecalhos = (cache) => ({ 'Cache-Control': cache });

export async function GET() {
  try {
    const r = await fetch(urlOpenMeteo(), { signal: AbortSignal.timeout(3000) });
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`); // inclui o 429
    const { current } = await r.json();
    const { is_day, temperature_2m, direct_normal_irradiance } = current ?? {};
    if (is_day !== 0 && is_day !== 1) throw new Error('resposta sem is_day');
    return Response.json(
      {
        ok: true,
        fallback: false,
        isDay: is_day === 1,
        temperatura: temperature_2m ?? null,
        irradiacao: direct_normal_irradiance ?? null,
      },
      { headers: cabecalhos('public, s-maxage=300, stale-while-revalidate=600') },
    );
  } catch (erro) {
    console.warn('[clima] usando fallback:', erro?.name ?? '', erro?.message ?? '');
    return Response.json(FALLBACK, { headers: cabecalhos('public, s-maxage=60') });
  }
}

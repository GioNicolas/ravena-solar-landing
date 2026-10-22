// Número que rola dígito por dígito, como um odômetro. O texto final fica no
// aria-label; os rolos são só visuais. Com movimento reduzido, troca direto.
const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const forma = (texto) => texto.replace(/\d/g, '0');

function montar(el, texto) {
  el.textContent = '';
  el.classList.add('odo--pronto');
  for (const ch of texto) {
    if (/\d/.test(ch)) {
      const col = document.createElement('span');
      col.className = 'odo__col';
      const fita = document.createElement('span');
      fita.className = 'odo__fita';
      for (let d = 0; d <= 9; d++) fita.append(Object.assign(document.createElement('span'), { textContent: d }));
      col.append(fita);
      el.append(col);
    } else {
      el.append(Object.assign(document.createElement('span'), { className: 'odo__sinal', textContent: ch }));
    }
  }
  el.dataset.forma = forma(texto);
}

function posicionar(el, texto, { atraso = 0, duracao = 900 } = {}) {
  const fitas = el.querySelectorAll('.odo__fita');
  const digitos = [...texto].filter((c) => /\d/.test(c));
  fitas.forEach((fita, i) => {
    fita.style.transitionDuration = `${duracao ? duracao + (fitas.length - i) * 90 : 0}ms`;
    fita.style.transitionDelay = `${duracao ? atraso : 0}ms`;
    fita.style.transform = `translateY(${-Number(digitos[i]) * 10}%)`;
  });
}

// Mostra `texto` no elemento. Se a forma mudar (ex.: 999 → 1.000), remonta os
// rolos em zero e gira até o valor.
export function rolar(el, texto, opcoes = {}) {
  el.setAttribute('aria-label', texto);
  if (reduz()) {
    el.textContent = texto;
    delete el.dataset.forma;
    return;
  }
  if (el.dataset.forma !== forma(texto)) {
    montar(el, texto);
    posicionar(el, forma(texto), { duracao: 0 });
    void el.offsetWidth;
  }
  posicionar(el, texto, opcoes);
}

// Odômetros fixos da página: rolam de `data-odo-de` (ou zero) até `data-odo`
// quando entram na tela, uma vez.
export function odometrosAoAparecer(raiz = document) {
  if (reduz()) return;
  const obs = new IntersectionObserver((itens) => {
    for (const i of itens) {
      if (!i.isIntersecting) continue;
      obs.unobserve(i.target);
      const el = i.target;
      const final = el.dataset.odo;
      const de = (el.dataset.odoDe ?? '0').padStart(final.replace(/\D/g, '').length, '0');
      // Mesmo formato do valor final (ex.: "4,8" começa em "0,0").
      let k = 0;
      const inicio = [...final].map((c) => (/\d/.test(c) ? de[k++] : c)).join('');
      rolar(el, inicio, { duracao: 0 });
      requestAnimationFrame(() => requestAnimationFrame(() =>
        rolar(el, final, { duracao: Number(el.dataset.odoDuracao ?? 1400), atraso: Number(el.dataset.odoAtraso ?? 120) })));
    }
  }, { threshold: 0.6 });
  document.querySelectorAll('.odo[data-odo]').forEach((el) => raiz.contains(el) && obs.observe(el));
}

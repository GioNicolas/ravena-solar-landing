// Vista explodida do bloco 4: telhado de barro, estrutura de fixação e painel,
// afastados em camadas e montados de novo. Só nomeia partes genéricas; nenhuma
// técnica de fixação que o brief não afirme (SPEC.md, bloco 4).
import {
  THREE, PITCH, aleatorio, materiais, montarTelhas, montarPaineis,
  criarPalco, luzDoSol, texturaSombra,
} from './base.js';

export const TIRO = { pos: [2.8, 3.3, 6.9], alvo: [0, 0.4, 0], fov: 30 };
const AFASTA = { estrutura: 0.6, paineis: 1.3 };

export async function criarExplodida(container, { still = false, fundo = null, reflexo = 0.6 } = {}) {
  const palco = criarPalco(container, { still, fundo, camera: TIRO });
  const { cena, camera, alvo, ponteiro } = palco;
  const rnd = aleatorio(23);
  const mat = materiais(rnd, { reflexo });
  const { sol } = luzDoSol(cena, [3, 9, 8], 5);
  sol.intensity = 3.6;

  const pivo = new THREE.Group();
  pivo.rotation.y = -0.18;
  const telhado = new THREE.Group();
  telhado.rotation.x = PITCH;

  const telhas = montarTelhas({ largura: 3.4, comprimento: 3.0, mat, rnd, ripas: true });
  const zMeio = telhas.comprimento / 2;
  telhas.grupo.position.z = -zMeio;
  const madeira = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.9 });
  for (const x of [-1.2, 0, 1.2]) {
    const caibro = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, telhas.comprimento + 0.1), madeira);
    caibro.position.set(x, -0.2, 0);
    caibro.castShadow = caibro.receiveShadow = true;
    telhado.add(caibro);
  }

  const sistema = montarPaineis({ cols: 2, lins: 1, W: 1.0, H: 1.6, mat });
  telhado.add(telhas.grupo, sistema.estrutura, sistema.paineis);
  pivo.add(telhado);
  cena.add(pivo);

  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }),
  );
  sombra.position.y = -1.0;
  cena.add(sombra);

  // Pontos de ancoragem dos rótulos, no espaço do telhado.
  // Escalonados na tela: painel no alto, trilho da frente no meio, telhas embaixo.
  const ancoras = {
    telhado: new THREE.Vector3(-0.35, 0.08, 1.4),
    estrutura: new THREE.Vector3(sistema.larg / 2 + 0.12, 0.155, 0.45),
    painel: new THREE.Vector3(sistema.larg / 2 - 0.08, 0.24, -sistema.comp / 2 + 0.12),
  };

  let e = 0; // 0 montado, 1 separado
  let alvoE = 0;

  function aplicar() {
    const suave = e * e * (3 - 2 * e);
    sistema.estrutura.position.y = AFASTA.estrutura * suave;
    sistema.paineis.position.y = AFASTA.paineis * Math.min(1, suave * 1.08);
  }

  function rotulos() {
    telhado.updateMatrixWorld(true);
    const ponto = (v, camada) => {
      const p = v.clone();
      p.y += camada;
      return palco.projetar(telhado.localToWorld(p));
    };
    return {
      telhado: ponto(ancoras.telhado, 0),
      estrutura: ponto(ancoras.estrutura, sistema.estrutura.position.y),
      painel: ponto(ancoras.painel, sistema.paineis.position.y),
      separacao: e,
    };
  }

  const ouvintes = [];
  aplicar();
  palco.iniciar((dt, s) => {
    const antes = e;
    e += Math.sign(alvoE - e) * Math.min(Math.abs(alvoE - e), dt / 1.1);
    aplicar();
    pivo.rotation.y = -0.18 + Math.sin(s * 0.2) * 0.03 + ponteiro.ax * 0.1;
    camera.position.set(TIRO.pos[0], TIRO.pos[1] - ponteiro.ay * 0.5, TIRO.pos[2]);
    camera.lookAt(alvo);
    if (antes !== e || ouvintes.length) {
      const r = rotulos();
      ouvintes.forEach((f) => f(r));
    }
  });

  return {
    renderer: palco.renderer,
    rotulos,
    aoMover: (f) => ouvintes.push(f),
    separar: () => (alvoE = 1),
    montar: () => (alvoE = 0),
    definir(valor) {
      e = alvoE = valor;
      aplicar();
      if (still) palco.renderizar();
    },
    renderizar: palco.renderizar,
  };
}

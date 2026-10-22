// Casa do topo: maquete de uma casa com telhado de barro e painéis, que responde
// ao simulador por definirEstado():
//   vazio        manhã: luz neutra, sistema parado
//   compensa     o sol sobe, um brilho atravessa os painéis e a energia corre
//                do telhado ao inversor, ao medidor e à rede
//   nao-compensa luz fria e fraca, nada corre
// A casa não muda de tamanho nem de número de painéis com a conta (SPEC.md).
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  THREE, brand, PITCH, TERRACOTA, aleatorio, materiais, montarTelhas, montarPaineis,
  criarPalco, luzDoSol, texturaPonto, texturaSombra,
} from './base.js';

const ESTADOS = {
  vazio: { sol: 2.9, cor: 0.3, amb: 0.5, frio: 0, fluxo: 0, altura: 0.55 },
  compensa: { sol: 3.9, cor: 0.8, amb: 0.6, frio: 0, fluxo: 1, altura: 1 },
  'nao-compensa': { sol: 1.0, cor: 0, amb: 0.34, frio: 1, fluxo: 0, altura: 0.2 },
};

export const TIROS = {
  hero: { pos: [18.4, 14.2, 24.2], alvo: [0.9, 1.1, 0.2], fov: 25 },
  og: { pos: [17.5, 11.8, 21.5], alvo: [0.5, 1.2, 0.2], fov: 24 },
};

const W = 7.6; // largura da casa (x)
const D = 5.6; // profundidade (z)
const H = 2.8; // pé-direito
const BEIRAL = 0.45;
const ZC = -0.4; // centro da casa em z
const RUN = D / 2 + BEIRAL;
const SUBIDA = RUN * Math.tan(PITCH);
const AGUA = RUN / Math.cos(PITCH); // comprimento da água do telhado

function caixa(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function janela(largura, altura, mats) {
  const g = new THREE.Group();
  g.add(caixa(largura, altura, 0.1, mats.navy, 0, 0, 0.02));
  g.add(caixa(largura - 0.16, altura - 0.16, 0.04, mats.janela, 0, 0, 0.06));
  g.add(caixa(0.05, altura - 0.16, 0.03, mats.navy, 0, 0, 0.09));
  g.add(caixa(largura - 0.16, 0.05, 0.03, mats.navy, 0, 0.05, 0.09));
  g.add(caixa(largura + 0.16, 0.06, 0.2, mats.claro, 0, -altura / 2 - 0.03, 0.08));
  return g;
}

function arvore(mats, rnd, escala = 1) {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.1, 8), mats.tronco);
  tronco.position.y = 0.55;
  tronco.castShadow = true;
  g.add(tronco);
  for (let i = 0; i < 4; i++) {
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + rnd() * 0.25, 1), mats.folha);
    copa.position.set((rnd() - 0.5) * 0.6, 1.35 + i * 0.28 + rnd() * 0.15, (rnd() - 0.5) * 0.6);
    copa.castShadow = true;
    g.add(copa);
  }
  g.scale.setScalar(escala);
  return g;
}

function montarCasa(rnd) {
  const mat = materiais(rnd, { reflexo: 0.8 });
  const mats = {
    ...mat,
    parede: new THREE.MeshStandardMaterial({ color: '#f3eee5', roughness: 0.92 }),
    rodape: new THREE.MeshStandardMaterial({ color: '#d8cdbb', roughness: 0.95 }),
    claro: new THREE.MeshStandardMaterial({ color: '#faf6ef', roughness: 0.8 }),
    navy: new THREE.MeshStandardMaterial({ color: brand.navy, roughness: 0.55 }),
    janela: new THREE.MeshPhysicalMaterial({ color: '#1d2b36', roughness: 0.06, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.3 }),
    base: new THREE.MeshStandardMaterial({ color: '#e7ddcc', roughness: 0.95 }),
    grama: new THREE.MeshStandardMaterial({ color: '#b3bd97', roughness: 1 }),
    pedra: new THREE.MeshStandardMaterial({ color: '#efe7d9', roughness: 0.9 }),
    tronco: new THREE.MeshStandardMaterial({ color: '#7a5a40', roughness: 1 }),
    folha: new THREE.MeshStandardMaterial({ color: '#8e9e76', roughness: 0.95, flatShading: true }),
    cinza: new THREE.MeshStandardMaterial({ color: '#c9ccd0', roughness: 0.6, metalness: 0.2 }),
    poste: new THREE.MeshStandardMaterial({ color: '#b9b3a8', roughness: 0.9 }),
    fio: new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.6 }),
  };
  const casa = new THREE.Group();

  // Base da maquete, gramado e caminho.
  const base = new THREE.Mesh(new RoundedBoxGeometry(14, 0.5, 11.5, 4, 0.22), mats.base);
  base.position.y = -0.25;
  base.receiveShadow = true;
  const grama = new THREE.Mesh(new RoundedBoxGeometry(13.3, 0.08, 10.8, 3, 0.04), mats.grama);
  grama.position.y = 0.01;
  grama.receiveShadow = true;
  casa.add(base, grama);
  for (let i = 0; i < 4; i++) casa.add(caixa(0.9, 0.06, 0.5, mats.pedra, 0.15, 0.06, D / 2 + ZC + 0.6 + i * 0.75));

  // Corpo da casa.
  casa.add(caixa(W, H, D, mats.parede, 0, H / 2, ZC));
  casa.add(caixa(W + 0.06, 0.3, D + 0.06, mats.rodape, 0, 0.15, ZC));

  // Oitões.
  const tri = new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, SUBIDA)]);
  for (const lado of [-1, 1]) {
    const oitao = new THREE.Mesh(new THREE.ShapeGeometry(tri), mats.parede);
    oitao.material = mats.parede.clone();
    oitao.material.side = THREE.DoubleSide;
    oitao.rotation.y = Math.PI / 2;
    oitao.position.set((lado * W) / 2, H, ZC);
    oitao.castShadow = oitao.receiveShadow = true;
    casa.add(oitao);
  }

  // Telhado: duas águas de barro, cumeeira e testeiras.
  const largTelhado = W + 0.7;
  const frente = new THREE.Group();
  frente.position.set(0, H + SUBIDA, ZC);
  frente.rotation.x = PITCH;
  const fundo = new THREE.Group();
  fundo.position.copy(frente.position);
  fundo.rotation.set(PITCH, Math.PI, 0, 'YXZ');
  frente.add(montarTelhas({ largura: largTelhado, comprimento: AGUA + 0.05, mat, rnd }).grupo);
  fundo.add(montarTelhas({ largura: largTelhado, comprimento: AGUA + 0.05, mat, rnd }).grupo);
  casa.add(frente, fundo);

  const barroCumeeira = mat.barro.clone();
  barroCumeeira.color = new THREE.Color(TERRACOTA).multiplyScalar(0.92);
  const cumeeira = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, largTelhado + 0.05, 20, 1, true, 0, Math.PI), barroCumeeira);
  cumeeira.rotation.z = Math.PI / 2;
  cumeeira.position.set(0, H + SUBIDA + 0.08, ZC);
  cumeeira.castShadow = true;
  casa.add(cumeeira);
  for (const s of [-1, 1]) casa.add(caixa(largTelhado, 0.22, 0.05, mats.claro, 0, H - 0.04, ZC + s * (RUN + 0.02)));

  // Painéis na água da frente.
  const sistema = montarPaineis({ cols: 5, lins: 2, W: 1.0, H: 1.55, mat });
  const centroPaineis = new THREE.Vector3(0.25, 0, AGUA / 2 + 0.05);
  sistema.paineis.position.copy(centroPaineis);
  sistema.estrutura.position.copy(centroPaineis);
  frente.add(sistema.paineis, sistema.estrutura);

  // Fachada: janelas, porta com maçaneta no âmbar da logo.
  const faceFrente = ZC + D / 2;
  for (const x of [-2.35, 2.3]) {
    const j = janela(1.5, 1.2, mats);
    j.position.set(x, 1.6, faceFrente);
    casa.add(j);
  }
  casa.add(caixa(1.12, 2.18, 0.08, mats.claro, 0.15, 1.09, faceFrente + 0.01));
  casa.add(caixa(0.96, 2.06, 0.1, mats.navy, 0.15, 1.03, faceFrente + 0.03));
  const macaneta = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), new THREE.MeshStandardMaterial({ color: brand.sun, metalness: 0.6, roughness: 0.3 }));
  macaneta.position.set(0.5, 1.05, faceFrente + 0.1);
  casa.add(macaneta);
  for (const x of [-2.35, 2.3]) {
    const arbusto = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mats.folha);
    arbusto.position.set(x, 0.32, faceFrente + 0.5);
    arbusto.scale.set(1.5, 0.75, 0.8);
    arbusto.castShadow = true;
    casa.add(arbusto);
  }

  // Lateral direita: janela, inversor com luz de status e eletroduto.
  const lado = W / 2;
  const jl = janela(1.3, 1.1, mats);
  jl.rotation.y = Math.PI / 2;
  jl.position.set(lado, 1.6, ZC - 1.1);
  casa.add(jl);
  const zInv = ZC + 1.5;
  casa.add(caixa(0.16, 0.6, 0.46, mats.cinza, lado + 0.08, 1.5, zInv));
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), new THREE.MeshStandardMaterial({ color: '#2e3a33', emissive: '#3ddc84', emissiveIntensity: 0 }));
  led.position.set(lado + 0.17, 1.66, zInv + 0.12);
  casa.add(led);
  const eletroduto = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, H - 1.8, 8), mats.cinza);
  eletroduto.position.set(lado + 0.05, 1.8 + (H - 1.8) / 2, zInv);
  casa.add(eletroduto);

  // Padrão de entrada com medidor, poste da rede e o fio entre eles.
  const xPadrao = 5.1;
  const zPadrao = 3.6;
  casa.add(caixa(0.16, 3.2, 0.16, mats.poste, xPadrao, 1.6, zPadrao));
  casa.add(caixa(0.44, 0.56, 0.22, mats.claro, xPadrao, 1.5, zPadrao + 0.19));
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.12), new THREE.MeshStandardMaterial({ color: '#1d2b36', emissive: brand.sun, emissiveIntensity: 0 }));
  visor.position.set(xPadrao, 1.6, zPadrao + 0.305);
  casa.add(visor);
  const xPoste = 6.1;
  const zPoste = -1.6;
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 10), mats.poste);
  poste.position.set(xPoste, 3, zPoste);
  poste.castShadow = true;
  casa.add(poste, caixa(0.08, 0.08, 1.3, mats.poste, xPoste, 5.75, zPoste));
  const fio = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(xPoste, 5.75, zPoste + 0.5),
    new THREE.Vector3((xPoste + xPadrao) / 2, 3.6, (zPoste + zPadrao) / 2),
    new THREE.Vector3(xPadrao, 3.15, zPadrao),
  );
  casa.add(new THREE.Mesh(new THREE.TubeGeometry(fio, 40, 0.015, 6), mats.fio));

  // Árvores.
  const a1 = arvore(mats, rnd, 1.25);
  a1.position.set(-5.4, 0, -3.4);
  const a2 = arvore(mats, rnd, 0.95);
  a2.position.set(-5.6, 0, 3.0);
  const a3 = arvore(mats, rnd, 1.1);
  a3.position.set(2.2, 0, -4.6);
  casa.add(a1, a2, a3);

  // Caminho da energia: painéis → beiral → inversor → medidor → poste.
  casa.updateMatrixWorld(true);
  const local = (grupo, x, y, z) => grupo.localToWorld(new THREE.Vector3(x, y, z));
  const caminho = new THREE.CatmullRomCurve3([
    local(frente, centroPaineis.x, 0.3, centroPaineis.z),
    local(frente, centroPaineis.x + 1.6, 0.3, centroPaineis.z + 0.6),
    local(frente, lado - 0.2, 0.25, AGUA - 0.15),
    new THREE.Vector3(lado + 0.12, H - 0.15, zInv),
    new THREE.Vector3(lado + 0.2, 1.5, zInv),
    new THREE.Vector3(lado + 0.5, 0.4, zInv + 0.8),
    new THREE.Vector3(xPadrao - 0.1, 0.5, zPadrao + 0.1),
    new THREE.Vector3(xPadrao, 1.5, zPadrao + 0.35),
    new THREE.Vector3(xPadrao, 3.1, zPadrao),
    fio.getPoint(0.5),
    new THREE.Vector3(xPoste, 5.75, zPoste + 0.5),
  ], false, 'centripetal');

  // Sombra de contato sob a maquete.
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 18).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }),
  );
  sombra.position.y = -0.52;
  casa.add(sombra);

  return { casa, sistema, caminho, led, visor, medidor: new THREE.Vector3(xPadrao, 1.9, zPadrao + 0.3) };
}

function montarParticulas(caminho, n = 42) {
  const pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // Laranja da logo em mistura normal: no fundo claro, brilho aditivo some no branco.
  const mat = new THREE.PointsMaterial({
    map: texturaPonto(), color: new THREE.Color(brand.ember), size: 0.62, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false,
  });
  const pontos = new THREE.Points(geo, mat);
  pontos.frustumCulled = false;
  const fase = Array.from({ length: n }, (_, i) => i / n);
  const p = new THREE.Vector3();
  function mover(t) {
    for (let i = 0; i < n; i++) {
      caminho.getPointAt((fase[i] + t) % 1, p);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    }
    geo.attributes.position.needsUpdate = true;
  }
  mover(0);
  return { pontos, mover };
}

export async function criarCasa(container, { tiro = 'hero', still = false, fundo = null } = {}) {
  const t = TIROS[tiro];
  const palco = criarPalco(container, { still, fundo, camera: t });
  const { cena, camera, alvo, ponteiro } = palco;
  const rnd = aleatorio(11);

  const { sol, ceu } = luzDoSol(cena, [9, 12, 10], 11);
  const pivo = new THREE.Group();
  const { casa, sistema, caminho, led, visor, medidor } = montarCasa(rnd);
  const energia = montarParticulas(caminho);
  casa.add(energia.pontos);
  pivo.add(casa);
  cena.add(pivo);

  const corSol = new THREE.Color(brand.sun);
  const branco = new THREE.Color('#fff6ea');
  const frio = new THREE.Color('#cfdcf0');
  const atual = { ...ESTADOS.vazio };
  let destino = ESTADOS.vazio;
  let varredura = -1;
  let tempoFluxo = 0;

  function aplicar() {
    sol.intensity = atual.sol;
    sol.color.copy(branco).lerp(corSol, atual.cor * 0.5).lerp(frio, atual.frio * 0.6);
    sol.position.set(9 - (1 - atual.altura) * 4, 5 + atual.altura * 9, 10);
    cena.environmentIntensity = atual.amb;
    ceu.intensity = 0.2 + atual.amb * 0.35;
    energia.pontos.material.opacity = atual.fluxo * 0.95;
    led.material.emissiveIntensity = atual.fluxo * 2.2;
    visor.material.emissiveIntensity = atual.fluxo * 0.9;
  }

  function animarVarredura(dt) {
    if (varredura < 0) return;
    varredura += dt / 1.4;
    const p = Math.min(1, varredura);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    sistema.brilho.position.x = -sistema.larg + 2 * sistema.larg * e;
    sistema.brilho.material.opacity = Math.sin(p * Math.PI) * 0.34;
    if (p >= 1) varredura = -1;
  }

  aplicar();
  palco.iniciar((dt, s) => {
    const k = 1 - Math.exp(-dt * 3);
    for (const chave of Object.keys(atual)) atual[chave] += (destino[chave] - atual[chave]) * k;
    aplicar();
    animarVarredura(dt);
    tempoFluxo += dt * (0.05 + atual.fluxo * 0.07);
    if (atual.fluxo > 0.01) energia.mover(tempoFluxo);
    pivo.rotation.y = Math.sin(s * 0.18) * 0.035 + ponteiro.ax * 0.12;
    camera.position.set(t.pos[0], t.pos[1] - ponteiro.ay * 0.8, t.pos[2]);
    camera.lookAt(alvo);
  });

  return {
    renderer: palco.renderer,
    medidor: () => palco.projetar(casa.localToWorld(medidor.clone())),
    definirEstado(estado, imediato = false) {
      destino = ESTADOS[estado] ?? ESTADOS.vazio;
      if (imediato) Object.assign(atual, destino);
      if (estado === 'compensa' && !imediato) varredura = 0;
      if (still) {
        aplicar();
        energia.mover(0.37);
        palco.renderizar();
      }
    },
    renderizar: palco.renderizar,
  };
}

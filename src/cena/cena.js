// Cena do topo: maquete em corte de um trecho de telhado de barro com painéis.
// É ilustração, não obra real (SPEC.md). Reage ao simulador por definirEstado():
//   vazio        luz neutra de fim de tarde
//   compensa     o sol esquenta e um brilho atravessa os painéis, uma vez
//   nao-compensa a luz esfria e perde força
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import brand from 'virtual:brand';

const PITCH = 0.36; // ~21° de caimento
const TERRACOTA = '#9c5238';
const LARG = 7.2; // largura do trecho (x)
const PROF = 5.0; // comprimento na direção do caimento (z)

const ESTADOS = {
  vazio: { sol: 3.4, cor: 0.35, amb: 0.5, frio: 0 },
  compensa: { sol: 4.3, cor: 0.8, amb: 0.58, frio: 0 },
  'nao-compensa': { sol: 1.3, cor: 0.0, amb: 0.34, frio: 1 },
};

const TIROS = {
  hero: { pos: [-7.6, 7.6, 11.2], alvo: [0.15, -0.5, 0.25], fov: 30, giro: -0.42 },
  close: { pos: [3.7, 1.5, 3.3], alvo: [2.0, -0.05, 0.7], fov: 34, giro: -0.42, reflexo: 0.55 },
  og: { pos: [-9.2, 6.8, 11.4], alvo: [-0.3, -0.7, 0.2], fov: 28, giro: -0.5 },
};

function texturaCelulas(navy) {
  const c = document.createElement('canvas');
  const COLS = 6;
  const LINS = 10;
  const cel = 84;
  const gap = 4;
  c.width = COLS * cel + gap * (COLS + 1);
  c.height = LINS * cel + gap * (LINS + 1);
  const g = c.getContext('2d');
  g.fillStyle = '#1b2633'; // backsheet escuro (painel "full black")
  g.fillRect(0, 0, c.width, c.height);
  const base = new THREE.Color(navy).multiplyScalar(0.36);
  for (let y = 0; y < LINS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = gap + x * (cel + gap);
      const py = gap + y * (cel + gap);
      const v = 0.94 + Math.random() * 0.1;
      g.fillStyle = `#${base.clone().multiplyScalar(v).getHexString()}`;
      g.fillRect(px, py, cel, cel);
      g.fillStyle = 'rgba(190,200,212,0.28)'; // busbars
      for (let b = 1; b <= 4; b++) g.fillRect(px + (b * cel) / 5 - 0.5, py, 1, cel);
      g.fillStyle = 'rgba(190,200,212,0.06)'; // dedos finos
      for (let f = 4; f < cel; f += 4) g.fillRect(px, py + f, cel, 0.6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaGrao() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 214 + Math.random() * 41;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texturaBrilho() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 4;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function montarTelhado() {
  const telhado = new THREE.Group();

  // Medidas do telhado a partir das telhas, para a estrutura não sobrar nas bordas.
  const PASSO_X = 0.19;
  const PASSO_Z = 0.36;
  const COLS = Math.floor(LARG / PASSO_X);
  const LINS = Math.floor(PROF / PASSO_Z);
  const xIni = -LARG / 2;
  const xFim = xIni + COLS * PASSO_X;
  const largura = xFim - xIni;
  const xMeio = (xIni + xFim) / 2;
  const zIni = -PROF / 2;
  const zFim = zIni + (LINS - 1) * PASSO_Z + 0.26 + 0.23;

  // Estrutura: caibros (ao longo do caimento) e ripas (ao longo da largura).
  const madeira = new THREE.MeshStandardMaterial({ color: '#9a6a44', roughness: 0.85 });
  const madeiraEscura = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.9 });
  for (let x = xIni + 0.3; x <= xFim - 0.2; x += 0.9) {
    const caibro = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, zFim - zIni + 0.1), madeiraEscura);
    caibro.position.set(x, -0.2, (zIni + zFim) / 2);
    caibro.castShadow = caibro.receiveShadow = true;
    telhado.add(caibro);
  }
  for (let r = 0; r < LINS; r++) {
    const ripa = new THREE.Mesh(new THREE.BoxGeometry(largura - 0.04, 0.035, 0.05), madeira);
    ripa.position.set(xMeio, -0.1, zIni + r * PASSO_Z + 0.1);
    ripa.castShadow = ripa.receiveShadow = true;
    telhado.add(ripa);
  }

  // Telhas de barro: canal (aberta para cima) e capa (aberta para baixo), alternadas.
  const geoTelha = new THREE.CylinderGeometry(0.105, 0.12, 0.46, 14, 1, true, 0, Math.PI);
  geoTelha.rotateX(Math.PI / 2);
  const barro = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrao(), roughness: 0.88, side: THREE.DoubleSide });
  const canais = new THREE.InstancedMesh(geoTelha, barro, COLS * LINS);
  const capas = new THREE.InstancedMesh(geoTelha, barro, COLS * LINS);
  canais.castShadow = canais.receiveShadow = capas.castShadow = capas.receiveShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const cor = new THREE.Color();
  const terracota = new THREE.Color(TERRACOTA);
  let ic = 0;
  let ik = 0;
  for (let r = 0; r < LINS; r++) {
    for (let k = 0; k < COLS; k++) {
      const x = -LARG / 2 + PASSO_X / 2 + k * PASSO_X;
      const z = -PROF / 2 + r * PASSO_Z + 0.26;
      const capa = k % 2 === 1;
      e.set(-0.07 + (Math.random() - 0.5) * 0.02, 0, capa ? Math.PI / 2 : -Math.PI / 2);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, capa ? 0.035 : -0.01, z), q, new THREE.Vector3(1, 1, 1));
      cor.copy(terracota).offsetHSL((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
      if (capa) {
        capas.setMatrixAt(ik, m);
        capas.setColorAt(ik++, cor);
      } else {
        canais.setMatrixAt(ic, m);
        canais.setColorAt(ic++, cor.multiplyScalar(0.86));
      }
    }
  }
  canais.count = ic;
  capas.count = ik;
  telhado.add(canais, capas);

  // Cumeeira no topo.
  const barroCumeeira = barro.clone();
  barroCumeeira.color = new THREE.Color(TERRACOTA).multiplyScalar(0.92);
  const cumeeira = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, largura, 20, 1, true, 0, Math.PI), barroCumeeira);
  cumeeira.rotation.set(0, 0, Math.PI / 2);
  cumeeira.position.set(xMeio, 0.06, zIni + 0.02);
  cumeeira.castShadow = true;
  telhado.add(cumeeira);
  // Testeira na borda de baixo, para o corte da maquete ficar limpo.
  const testeira = new THREE.Mesh(new THREE.BoxGeometry(largura, 0.2, 0.04), madeira);
  testeira.position.set(xMeio, -0.2, zFim + 0.07);
  testeira.castShadow = testeira.receiveShadow = true;
  telhado.add(testeira);
  return telhado;
}

// reflexo < 1 em tiros próximos, onde o brilho do sol no vidro vira mancha.
function montarPaineis(navy, reflexo = 1) {
  const grupo = new THREE.Group();
  const aluminio = new THREE.MeshStandardMaterial({ color: '#c8cdd2', metalness: 1, roughness: 0.32 });
  const vidro = new THREE.MeshPhysicalMaterial({
    map: texturaCelulas(navy),
    roughness: 0.24,
    metalness: 0.0,
    clearcoat: reflexo,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.6 * reflexo,
    ior: 1.5,
    specularIntensity: reflexo * reflexo,
  });
  vidro.map.anisotropy = 8;

  const W = 1.08;
  const H = 1.76;
  const GAP = 0.03;
  const COLS = 4;
  const LINS = 2;
  const ALT = 0.2; // altura sobre as telhas, nos trilhos
  const x0 = -((COLS * W + (COLS - 1) * GAP) / 2) + W / 2 + 0.25;
  const z0 = -((LINS * H + (LINS - 1) * GAP) / 2) + H / 2 + 0.05;

  const geoMoldura = new THREE.BoxGeometry(W, 0.04, H);
  const geoVidro = new THREE.PlaneGeometry(W - 0.05, H - 0.05);
  geoVidro.rotateX(-Math.PI / 2);
  for (let r = 0; r < LINS; r++) {
    for (let k = 0; k < COLS; k++) {
      const x = x0 + k * (W + GAP);
      const z = z0 + r * (H + GAP);
      const moldura = new THREE.Mesh(geoMoldura, aluminio);
      moldura.position.set(x, ALT, z);
      moldura.castShadow = moldura.receiveShadow = true;
      const placa = new THREE.Mesh(geoVidro, vidro);
      placa.position.set(x, ALT + 0.0205, z);
      placa.receiveShadow = true;
      grupo.add(moldura, placa);
    }
  }

  // Trilhos e ganchos.
  const largura = COLS * W + (COLS - 1) * GAP + 0.2;
  for (let r = 0; r < LINS; r++) {
    for (const dz of [-H * 0.28, H * 0.28]) {
      const trilho = new THREE.Mesh(new THREE.BoxGeometry(largura, 0.05, 0.045), aluminio);
      trilho.position.set(x0 - W / 2 + largura / 2 - 0.1, ALT - 0.045, z0 + r * (H + GAP) + dz);
      trilho.castShadow = true;
      grupo.add(trilho);
      for (let k = 0; k <= COLS; k++) {
        const gancho = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.035), aluminio);
        gancho.position.set(x0 - W / 2 + k * (W + GAP) - GAP / 2, ALT - 0.1, trilho.position.z);
        grupo.add(gancho);
      }
    }
  }

  // Brilho que atravessa os painéis quando a conta compensa.
  const brilho = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, LINS * H + 0.4).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: texturaBrilho(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  brilho.position.set(-6, ALT + 0.03, z0 + (H + GAP) / 2);
  grupo.add(brilho);

  return { grupo, brilho, xIni: x0 - W - 1, xFim: x0 + COLS * (W + GAP) + 0.6 };
}

export async function criarCena(container, { tiro = 'hero', still = false, fundo = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !fundo, preserveDrawingBuffer: still, powerPreference: 'high-performance' });
  renderer.setPixelRatio(still ? 1 : Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  if (fundo) cena.background = new THREE.Color(fundo);
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const t = TIROS[tiro];
  const camera = new THREE.PerspectiveCamera(t.fov, 1, 0.1, 100);
  const alvo = new THREE.Vector3(...t.alvo);

  // Luz do sol: âmbar da logo misturado com branco; o estado decide quanto.
  const corSol = new THREE.Color(brand.sun);
  const branco = new THREE.Color('#fff6ea');
  const frio = new THREE.Color('#cfdcf0');
  const sol = new THREE.DirectionalLight(branco, 3);
  sol.position.set(...(t.sol ?? [-7, 6.5, 5]));
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -6;
  sol.shadow.camera.right = 6;
  sol.shadow.camera.top = 6;
  sol.shadow.camera.bottom = -6;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  sol.shadow.radius = 3;
  cena.add(sol);
  const ceu = new THREE.HemisphereLight('#fff3e2', '#6b5444', 0.4);
  cena.add(ceu);

  const pivo = new THREE.Group();
  pivo.rotation.y = t.giro;
  const inclinado = new THREE.Group();
  inclinado.rotation.x = PITCH;
  const paineis = montarPaineis(brand.navy, t.reflexo);
  inclinado.add(montarTelhado(), paineis.grupo);
  pivo.add(inclinado);
  cena.add(pivo);

  const chao = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16 }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -1.75;
  chao.receiveShadow = true;
  cena.add(chao);

  // Estado animado: valores atuais perseguem o alvo.
  const atual = { ...ESTADOS.vazio };
  let destino = ESTADOS.vazio;
  let varredura = -1;
  const ponteiro = { x: 0, y: 0, ax: 0, ay: 0 };

  function aplicar() {
    sol.intensity = atual.sol;
    sol.color.copy(branco).lerp(corSol, atual.cor * 0.55).lerp(frio, atual.frio * 0.6);
    cena.environmentIntensity = atual.amb;
    ceu.intensity = 0.2 + atual.amb * 0.35;
  }

  function dimensionar() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  let ultimo = performance.now();
  let rodando = false;
  let visivel = true;

  function quadro(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const k = 1 - Math.exp(-dt * 4.5);
    for (const chave of Object.keys(atual)) atual[chave] += (destino[chave] - atual[chave]) * k;
    aplicar();

    if (varredura >= 0) {
      varredura += dt / 1.5;
      const p = Math.min(1, varredura);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      paineis.brilho.position.x = paineis.xIni + (paineis.xFim - paineis.xIni) * e;
      paineis.brilho.material.opacity = Math.sin(p * Math.PI) * 0.32;
      if (p >= 1) varredura = -1;
    }

    // Deriva lenta e leve paralaxe com o mouse.
    ponteiro.ax += (ponteiro.x - ponteiro.ax) * k * 0.5;
    ponteiro.ay += (ponteiro.y - ponteiro.ay) * k * 0.5;
    const s = agora / 1000;
    pivo.rotation.y = t.giro + Math.sin(s * 0.16) * 0.03 + ponteiro.ax * 0.05;
    camera.position.set(t.pos[0], t.pos[1] - ponteiro.ay * 0.35, t.pos[2]);
    camera.lookAt(alvo);

    renderer.render(cena, camera);
    if (rodando) requestAnimationFrame(quadro);
  }

  function ligar() {
    const deve = visivel && !document.hidden;
    if (deve && !rodando) {
      rodando = true;
      ultimo = performance.now();
      requestAnimationFrame(quadro);
    } else if (!deve) rodando = false;
  }

  dimensionar();
  camera.position.set(...t.pos);
  camera.lookAt(alvo);
  aplicar();

  if (still) {
    renderer.render(cena, camera);
  } else {
    new ResizeObserver(dimensionar).observe(container);
    new IntersectionObserver(([i]) => {
      visivel = i.isIntersecting;
      ligar();
    }).observe(container);
    document.addEventListener('visibilitychange', ligar);
    addEventListener('pointermove', (ev) => {
      ponteiro.x = ev.clientX / innerWidth - 0.5;
      ponteiro.y = ev.clientY / innerHeight - 0.5;
    }, { passive: true });
    ligar();
  }

  return {
    renderer,
    definirEstado(estado, imediato = false) {
      destino = ESTADOS[estado] ?? ESTADOS.vazio;
      if (imediato) Object.assign(atual, destino);
      if (estado === 'compensa') varredura = 0;
      if (still) {
        aplicar();
        renderer.render(cena, camera);
      }
    },
    renderizar: () => renderer.render(cena, camera),
  };
}

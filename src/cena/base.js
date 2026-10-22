// Peças e palco compartilhados pelas cenas 3D (casa do topo e vista explodida).
// Tudo é ilustração modelada em código, não obra real (SPEC.md).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import brand from 'virtual:brand';

export { THREE, brand };

export const PITCH = 0.38; // ~22° de caimento
export const TERRACOTA = '#9c5238';

// Aleatório com semente: a cena ao vivo e as imagens renderizadas saem iguais.
export function aleatorio(semente = 7) {
  let s = semente;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function textura(c, { repetir = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function texturaCelulas(rnd) {
  const COLS = 6;
  const LINS = 10;
  const cel = 84;
  const gap = 4;
  const [c, g] = canvas(COLS * cel + gap * (COLS + 1), LINS * cel + gap * (LINS + 1));
  g.fillStyle = '#1b2633'; // backsheet escuro (painel "full black")
  g.fillRect(0, 0, c.width, c.height);
  const base = new THREE.Color(brand.navy).multiplyScalar(0.36);
  for (let y = 0; y < LINS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = gap + x * (cel + gap);
      const py = gap + y * (cel + gap);
      g.fillStyle = `#${base.clone().multiplyScalar(0.94 + rnd() * 0.1).getHexString()}`;
      g.fillRect(px, py, cel, cel);
      g.fillStyle = 'rgba(190,200,212,0.28)'; // busbars
      for (let b = 1; b <= 4; b++) g.fillRect(px + (b * cel) / 5 - 0.5, py, 1, cel);
      g.fillStyle = 'rgba(190,200,212,0.06)';
      for (let f = 4; f < cel; f += 4) g.fillRect(px, py + f, cel, 0.6);
    }
  }
  return textura(c);
}

export function texturaGrao(rnd, claro = 214) {
  const [c, g] = canvas(128, 128);
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = claro + rnd() * (255 - claro);
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return textura(c, { repetir: true });
}

export function texturaBrilho() {
  const [c, g] = canvas(256, 4);
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 4);
  return textura(c);
}

export function texturaPonto() {
  const [c, g] = canvas(64, 64);
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return textura(c);
}

export function texturaSombra() {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, 'rgba(40,30,20,0.32)');
  grad.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return textura(c);
}

export function materiais(rnd, { reflexo = 1 } = {}) {
  return {
    barro: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrao(rnd), roughness: 0.88, side: THREE.DoubleSide }),
    madeira: new THREE.MeshStandardMaterial({ color: '#9a6a44', roughness: 0.85 }),
    aluminio: new THREE.MeshStandardMaterial({ color: '#c8cdd2', metalness: 1, roughness: 0.32 }),
    // reflexo < 1 em tiros próximos, onde o brilho do sol no vidro vira mancha.
    vidro: new THREE.MeshPhysicalMaterial({
      map: texturaCelulas(rnd),
      roughness: 0.24,
      clearcoat: reflexo,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.6 * reflexo,
      ior: 1.5,
      specularIntensity: reflexo * reflexo,
    }),
  };
}

// Telhas de barro num plano inclinado. Coordenadas locais: x na largura,
// z descendo o caimento (de 0 até comprimento), y saindo do telhado.
export function montarTelhas({ largura, comprimento, mat, rnd, ripas = false }) {
  const grupo = new THREE.Group();
  const PASSO_X = 0.19;
  const PASSO_Z = 0.36;
  const COLS = Math.floor(largura / PASSO_X);
  const LINS = Math.floor((comprimento - 0.1) / PASSO_Z);
  const x0 = -(COLS * PASSO_X) / 2 + PASSO_X / 2;

  const geo = new THREE.CylinderGeometry(0.105, 0.12, 0.46, 14, 1, true, 0, Math.PI);
  geo.rotateX(Math.PI / 2);
  const canais = new THREE.InstancedMesh(geo, mat.barro, COLS * LINS);
  const capas = new THREE.InstancedMesh(geo, mat.barro, COLS * LINS);
  canais.castShadow = canais.receiveShadow = capas.castShadow = capas.receiveShadow = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const um = new THREE.Vector3(1, 1, 1);
  const cor = new THREE.Color();
  const terracota = new THREE.Color(TERRACOTA);
  let ic = 0;
  let ik = 0;
  for (let r = 0; r < LINS; r++) {
    for (let k = 0; k < COLS; k++) {
      const capa = k % 2 === 1;
      e.set(-0.07 + (rnd() - 0.5) * 0.02, 0, capa ? Math.PI / 2 : -Math.PI / 2);
      q.setFromEuler(e);
      p.set(x0 + k * PASSO_X, capa ? 0.035 : -0.01, r * PASSO_Z + 0.25);
      m.compose(p, q, um);
      cor.copy(terracota).offsetHSL((rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.08);
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
  grupo.add(canais, capas);

  const larguraReal = COLS * PASSO_X;
  if (ripas) {
    for (let r = 0; r < LINS; r++) {
      const ripa = new THREE.Mesh(new THREE.BoxGeometry(larguraReal - 0.04, 0.035, 0.05), mat.madeira);
      ripa.position.set(0, -0.1, r * PASSO_Z + 0.08);
      ripa.castShadow = ripa.receiveShadow = true;
      grupo.add(ripa);
    }
  } else {
    // Forro escuro sob as telhas, para não se ver através das frestas.
    const forro = new THREE.Mesh(
      new THREE.BoxGeometry(larguraReal, 0.06, LINS * PASSO_Z + 0.1),
      new THREE.MeshStandardMaterial({ color: '#4a2a1c', roughness: 1 }),
    );
    forro.position.set(0, -0.12, (LINS * PASSO_Z) / 2 + 0.05);
    forro.receiveShadow = true;
    grupo.add(forro);
  }
  return { grupo, largura: larguraReal, comprimento: LINS * PASSO_Z + 0.48 };
}

// Painéis com trilhos e ganchos. Centrados em x e z. Devolve painéis e estrutura
// separados para a vista explodida poder afastar uma camada da outra.
export function montarPaineis({ cols, lins, W = 1.08, H = 1.76, gap = 0.03, alt = 0.2, mat }) {
  const paineis = new THREE.Group();
  const estrutura = new THREE.Group();
  const larg = cols * W + (cols - 1) * gap;
  const comp = lins * H + (lins - 1) * gap;
  const x0 = -larg / 2 + W / 2;
  const z0 = -comp / 2 + H / 2;

  const geoMoldura = new THREE.BoxGeometry(W, 0.04, H);
  const geoVidro = new THREE.PlaneGeometry(W - 0.05, H - 0.05).rotateX(-Math.PI / 2);
  const placas = [];
  for (let r = 0; r < lins; r++) {
    for (let k = 0; k < cols; k++) {
      const moldura = new THREE.Mesh(geoMoldura, mat.aluminio);
      moldura.position.set(x0 + k * (W + gap), alt, z0 + r * (H + gap));
      moldura.castShadow = moldura.receiveShadow = true;
      const placa = new THREE.Mesh(geoVidro, mat.vidro);
      placa.position.set(moldura.position.x, alt + 0.0205, moldura.position.z);
      placa.receiveShadow = true;
      paineis.add(moldura, placa);
      placas.push(placa);
    }
  }

  for (let r = 0; r < lins; r++) {
    for (const dz of [-H * 0.28, H * 0.28]) {
      const z = z0 + r * (H + gap) + dz;
      const trilho = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.2, 0.05, 0.045), mat.aluminio);
      trilho.position.set(0, alt - 0.045, z);
      trilho.castShadow = true;
      estrutura.add(trilho);
      for (let k = 0; k <= cols; k++) {
        const gancho = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), mat.aluminio);
        gancho.position.set(-larg / 2 + k * (W + gap) - gap / 2, alt - 0.12, z);
        gancho.castShadow = true;
        estrutura.add(gancho);
      }
    }
  }

  const brilho = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, comp + 0.3).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: texturaBrilho(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  brilho.position.set(-larg, alt + 0.03, 0);
  paineis.add(brilho);

  return { paineis, estrutura, placas, brilho, larg, comp };
}

// Renderizador, ambiente e laço de quadros com pausa fora da tela.
export function criarPalco(container, { still = false, fundo = null, camera: cam }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !fundo, preserveDrawingBuffer: still, powerPreference: 'high-performance' });
  renderer.setPixelRatio(still ? 1 : Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  if (fundo) cena.background = new THREE.Color(fundo);
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(cam.fov, 1, 0.1, 200);
  const alvo = new THREE.Vector3(...cam.alvo);
  camera.position.set(...cam.pos);
  camera.lookAt(alvo);

  function dimensionar() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  dimensionar();

  const ponteiro = { x: 0, y: 0, ax: 0, ay: 0 };
  let quadro = null;
  let rodando = false;
  let visivel = true;
  let ultimo = 0;

  function passo(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const k = 1 - Math.exp(-dt * 2.2);
    ponteiro.ax += (ponteiro.x - ponteiro.ax) * k;
    ponteiro.ay += (ponteiro.y - ponteiro.ay) * k;
    quadro?.(dt, agora / 1000);
    renderer.render(cena, camera);
    if (rodando) requestAnimationFrame(passo);
  }

  function ligar() {
    const deve = visivel && !document.hidden;
    if (deve && !rodando) {
      rodando = true;
      ultimo = performance.now();
      requestAnimationFrame(passo);
    } else if (!deve) rodando = false;
  }

  return {
    renderer,
    cena,
    camera,
    alvo,
    ponteiro,
    renderizar: () => renderer.render(cena, camera),
    iniciar(fn) {
      quadro = fn;
      if (still) return;
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
    },
    // Posição na tela (0..1) de um ponto do mundo, para rótulos em HTML.
    projetar(v) {
      const p = v.clone().project(camera);
      return { x: (p.x + 1) / 2, y: (1 - p.y) / 2, atras: p.z > 1 };
    },
  };
}

export function luzDoSol(cena, posicao, alcance = 9) {
  const sol = new THREE.DirectionalLight('#fff6ea', 3);
  sol.position.set(...posicao);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -alcance, right: alcance, top: alcance, bottom: -alcance, far: 60 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  cena.add(sol);
  const ceu = new THREE.HemisphereLight('#fff3e2', '#6b5444', 0.4);
  cena.add(ceu);
  return { sol, ceu };
}

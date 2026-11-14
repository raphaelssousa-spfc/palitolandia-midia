import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world ----------
// Laboratório de radar (1945): piso de ladrilho, paredes, janela com antena girando, bancada com magnetron,
// quadro-negro, prateleiras, comidas, forno gigante (surge no fim) e pipocas que estouram.
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const rt = P.rng(44);
M.tile = texM(P.tiles(41), 6, 5); M.labWall = texM(P.plaster(8, 150), 1, 1); M.labWall2 = texM(P.plaster(18, 170), 1, 1);
M.wain = toon({ color: '#3f6a72' }); M.brass = toon({ color: '#d9a845' }); M.copper = toon({ color: '#c6703d' });
M.steel = toon({ color: '#9aa7b1' }); M.steel.side = THREE.DoubleSide; M.cabinet = toon({ color: '#4e6a7a' }); M.crate = toon({ color: '#9a6e3e' });
M.tube = new THREE.MeshBasicMaterial({ color: '#8ff0ff', fog: true });
M.screen = new THREE.MeshBasicMaterial({ color: '#7dff9c', fog: true });
M.ovenWin = new THREE.MeshBasicMaterial({ color: '#ffb35a', fog: true });
M.oven = toon({ color: '#f4f8fa' }); M.ovenDoor = toon({ color: '#c3ccd2' }); M.knob = toon({ color: '#2b2b33' });
M.kernel = toon({ color: '#f0c23a' }); M.popped = toon({ color: '#fff6e2' });
M.bread = toon({ color: '#d9a45a' }); M.lettuce = toon({ color: '#6fbf4a' }); M.tomato = toon({ color: '#d9442c' });
M.egg = toon({ color: '#f6ecd6' }); M.apple = toon({ color: '#c8322b' });
M.jar1 = toon({ color: '#d96a4a' }); M.jar2 = toon({ color: '#5aa6c8' }); M.jar3 = toon({ color: '#e0c25a' }); M.jar4 = toon({ color: '#7bbf6a' });
const groundMat = M.grass.clone(); groundMat.map = M.grass.map.clone(); groundMat.map.repeat.set(240, 240); groundMat.map.needsUpdate = true;
const ground = add(new THREE.PlaneGeometry(2400, 2400), groundMat, 0, -0.02, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
// piso
const floor = add(new THREE.PlaneGeometry(11.4, 11.4), M.tile, 0, 0.004, 2.3, world, { cast: false }); floor.rotation.x = -Math.PI / 2;
// paredes: fundo com janela, laterais
const WZ = -3.5, WH = 4.4;
add(tbox(7.8, WH, 0.2, 2), M.labWall, -1.8, WH / 2, WZ, world);          // x -5.7..2.1
add(tbox(1.6, WH, 0.2, 2), M.labWall, 4.9, WH / 2, WZ, world);           // x 4.1..5.7
add(tbox(2.0, 1.6, 0.2, 2), M.labWall, 3.1, 0.8, WZ, world);             // sob a janela
add(tbox(2.0, 1.2, 0.2, 2), M.labWall, 3.1, 3.8, WZ, world);             // sobre a janela
add(tbox(11.4, 1.0, 0.06, 2), M.wain, 0, 0.5, WZ + 0.12, world);         // rodapé alto
for (const sx of [-1, 1]) add(tbox(0.2, WH, 11.4, 2), M.labWall2, sx * 5.7, WH / 2, 2.2, world);
// moldura da janela
for (const s of [-1, 1]) add(tbox(0.12, 1.7, 0.26, 1), M.beam, 3.1 + s * 1.05, 2.4, WZ + 0.02, world);
add(tbox(2.3, 0.12, 0.26, 1), M.beam, 3.1, 3.25, WZ + 0.02, world); add(tbox(2.3, 0.12, 0.3, 1), M.beam, 3.1, 1.55, WZ + 0.05, world);
add(tbox(0.08, 1.7, 0.2, 1), M.beam, 3.1, 2.4, WZ + 0.02, world);
// antena de radar lá fora (gira)
const mast = add(new THREE.CylinderGeometry(0.12, 0.16, 3.6, 8), M.iron, 3.2, 1.8, -9, world);
const dish = new THREE.Group(); dish.position.set(3.2, 3.6, -9); world.add(dish);
{ const cap = add(new THREE.SphereGeometry(1.25, 24, 10, 0, Math.PI * 2, 0, 0.85), M.steel, 0, 0, 0, dish); cap.rotation.x = -Math.PI / 2; cap.scale.set(1, 1.15, 0.8);
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), M.iron, 0, 0, 0.5, dish).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.1, 8, 6), M.red, 0, 0, 1.0, dish); }
// bancada
const bench = new THREE.Group(); bench.position.set(0, 0, -1.7); world.add(bench);
add(tbox(3.4, 0.1, 1.1, 1), M.plank, 0, 0.85, 0, bench);
for (const [x, z] of [[-1.6, -0.5], [1.6, -0.5], [-1.6, 0.5], [1.6, 0.5]]) add(tbox(0.12, 0.84, 0.12, 1), M.beam, x, 0.42, z, bench);
add(tbox(3.2, 0.06, 0.9, 1), M.plank, 0, 0.3, 0, bench);
// magnetron (peça de radar)
const mag = new THREE.Group(); mag.position.set(0, 0.9, -1.7); world.add(mag);
add(tbox(0.8, 0.14, 0.55, 1), M.steel, 0, 0.07, 0, mag);
add(new THREE.CylinderGeometry(0.22, 0.22, 0.46, 18), M.brass, 0, 0.37, 0, mag);
for (const y of [0.2, 0.31, 0.42, 0.53]) add(new THREE.TorusGeometry(0.27, 0.035, 8, 22), M.copper, 0, y, 0, mag).rotation.x = Math.PI / 2;
const magTip = add(new THREE.SphereGeometry(0.14, 14, 10), M.tube, 0, 0.67, 0, mag, { cast: false });
for (const s of [-1, 1]) { const mg = add(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12), M.iron, s * 0.36, 0.38, 0, mag); mg.rotation.z = Math.PI / 2; }
const cable = add(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), M.iron, -1.3, 0.12, 0.1, bench); cable.rotation.z = Math.PI / 2; cable.position.y = 0.95;
// armário de controle + mostradores
add(tbox(1.0, 1.5, 0.7, 1), M.cabinet, -2.4, 0.75, -2.7, world);
for (const [x, y] of [[-2.7, 1.05], [-2.4, 1.05], [-2.1, 1.05]]) add(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 14), M.knob, x, y, -2.33, world).rotation.x = Math.PI / 2;
add(box(0.6, 0.3, 0.04), M.screen, -2.4, 1.3, -2.34, world, { cast: false });
// osciloscópio
add(tbox(0.5, 0.4, 0.4, 1), M.cabinet, -1.25, 1.1, -1.85, world);
add(box(0.32, 0.24, 0.03), M.screen, -1.25, 1.12, -1.64, world, { cast: false });
// quadro-negro + placa
{ const bt = P.tex(P.chalkboard(61)); bt.wrapS = bt.wrapT = THREE.ClampToEdgeWrapping;
  add(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshToonMaterial({ gradientMap: grad, map: bt }), -2.9, 2.3, WZ + 0.12, world, { cast: false });
  const st = P.tex(P.labSign('LABORATÓRIO')); st.wrapS = st.wrapT = THREE.ClampToEdgeWrapping;
  add(new THREE.PlaneGeometry(3.6, 0.84), new THREE.MeshToonMaterial({ gradientMap: grad, map: st }), 0.3, 3.55, WZ + 0.12, world, { cast: false }); }
// prateleiras com potes na parede esquerda
for (const y of [1.2, 1.9, 2.6]) { add(tbox(0.36, 0.06, 2.6, 1), M.plank, -5.45, y, -1.9, world);
  for (let i = 0; i < 5; i++) { const jm = [M.jar1, M.jar2, M.jar3, M.jar4][(i + Math.round(y * 3)) % 4]; add(new THREE.CylinderGeometry(0.11, 0.11, 0.26 + (i % 2) * 0.06, 10), jm, -5.45, y + 0.17, -2.95 + i * 0.5, world); } }
// caixotes
add(tbox(0.7, 0.6, 0.7, 1), M.crate, -4.3, 0.3, -2.9, world); add(tbox(0.6, 0.5, 0.6, 1), M.crate, -4.4, 0.85, -2.85, world); add(tbox(0.7, 0.6, 0.7, 1), M.crate, -3.5, 0.3, -2.95, world);

// comidas na bancada (aparecem com "as ondas esquentavam qualquer comida")
const foods = [];
{ const mk = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.by = y; world.add(g); g.visible = false; foods.push(g); return g; };
  const sw = mk(1.15, 0.9, -1.5);
  add(tbox(0.34, 0.06, 0.24, 1), M.bread, 0, 0.03, 0, sw); add(tbox(0.36, 0.02, 0.26, 1), M.lettuce, 0, 0.07, 0, sw);
  add(tbox(0.3, 0.025, 0.2, 1), M.tomato, 0, 0.095, 0, sw); add(tbox(0.34, 0.07, 0.24, 1), M.bread, 0, 0.145, 0, sw);
  const eg = mk(1.5, 0.9, -1.6); add(new THREE.SphereGeometry(1, 14, 10), M.egg, 0, 0.1, 0, eg).scale.set(0.075, 0.1, 0.075);
  const ap = mk(1.8, 0.9, -1.5); add(new THREE.SphereGeometry(1, 14, 10), M.apple, 0, 0.085, 0, ap).scale.set(0.085, 0.08, 0.085);
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 5), M.trunk, 0, 0.17, 0, ap); }
// forno gigante (surge no final)
const oven = new THREE.Group(); oven.position.set(-3.1, 0, -2.3); world.add(oven); oven.visible = false;
add(tbox(1.0, 1.75, 0.8, 1), M.oven, 0, 0.875, 0, oven);
add(tbox(0.66, 0.96, 0.06, 1), M.ovenDoor, 0, 1.0, 0.43, oven);
add(box(0.44, 0.56, 0.03), M.ovenWin, 0, 1.08, 0.47, oven, { cast: false });
add(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), M.iron, 0.38, 1.0, 0.5, oven);
for (const x of [-0.24, 0, 0.24]) add(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), M.knob, x, 1.55, 0.42, oven).rotation.x = Math.PI / 2;
for (const s of [-1, 1]) add(tbox(0.1, 0.1, 0.1, 1), M.iron, s * 0.4, 0.05, 0.3, oven);

// pipocas: grãos viram pipoca em momentos e arcos fixos (função pura do quadro)
const KN = 36, kern = [], rk = P.rng(55);
for (let i = 0; i < KN; i++) {
  const pf = 678 + Math.floor(rk() * 68), vy0 = 2.0 + rk() * 1.6, vx = (rk() - 0.5) * 1.6, vz = (rk() - 0.3) * 1.6;
  const bx = 0.6 + (i % 6) * 0.08, bz = -2.05 + Math.floor(i / 6) * 0.06, ap = 636 + i * 0.9;
  const g = new THREE.Group(); world.add(g); g.visible = false;
  const seed = add(new THREE.SphereGeometry(1, 8, 6), M.kernel, 0, 0, 0, g); seed.scale.set(0.022, 0.03, 0.022);
  const pop = new THREE.Group(); g.add(pop);
  for (const [dx, dy, dz, r_] of [[0, 0, 0, 0.034], [0.03, 0.01, 0.005, 0.026], [-0.024, 0.012, -0.01, 0.028], [0.005, 0.03, 0.01, 0.022]]) add(new THREE.SphereGeometry(r_, 8, 6), M.popped, dx, dy, dz, pop);
  kern.push({ g, seed, pop, pf, vy0, vx, vz, bx, bz, ap, by: 0.915, spin: (rk() - 0.5) * 14 });
}
// anéis de onda saindo do magnetron (sem tinta)
const rings = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 72), new THREE.MeshBasicMaterial({ color: '#9fe8ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  m.position.set(0, 1.57, -1.7); m.userData.ndSkip = true; m.visible = false; m.renderOrder = 3; scene.add(m); rings.push(m);
}
// rolling hills + mountains (far)
for (let i = 0; i < 16; i++) { const a = rt() * Math.PI * 2, d = 160 + rt() * 160; const h = add(new THREE.SphereGeometry(40 + rt() * 40, 20, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -12, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.5 + rt() * 0.3; }
for (let i = 0; i < 14; i++) { const a = rt() * Math.PI * 2, d = 520 + rt() * 200, hh = 120 + rt() * 120, r_ = 110 + rt() * 70; const g = new THREE.Group(); g.position.set(Math.cos(a) * d, -5, Math.sin(a) * d); world.add(g); add(new THREE.ConeGeometry(r_, hh, 7), M.mount, 0, hh / 2, 0, g, { cast: false }); add(new THREE.ConeGeometry(r_ * 0.3, hh * 0.3, 7), M.snow, 0, hh * 0.86, 0, g, { cast: false }); }

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const backE = (t) => { t = clamp01(t) - 1; return t * t * (2.7 * t + 1.7) + 1; };
const tubeA = new THREE.Color('#5fd7ee'), tubeB = new THREE.Color('#e4ffff');
function worldState(W, f) {
  oven.visible = W.oven > 0.001; oven.scale.setScalar(Math.max(W.oven, 0.001));
  dish.rotation.y = W.dish;
  M.tube.color.copy(tubeA).lerp(tubeB, W.pulse);
  magTip.scale.setScalar(1 + 0.12 * W.pulse + (W.hot ? 0.12 : 0));
  rings.forEach((r, i) => {
    if (W.waves < 0) { r.visible = false; return; }
    const ph = (W.waves * 0.9 + i / 4) % 1; r.visible = true;
    r.scale.setScalar(0.25 + ph * 6.5); r.material.opacity = 0.85 * (1 - ph) * clamp01(W.waves * 8);
  });
  foods.forEach((g, k) => {
    const s = clamp01(W.food * 3 - k); g.visible = s > 0.001; g.scale.setScalar(Math.max(backE(s), 0.001));
    const wob = W.waves >= 0 && s >= 1;
    g.rotation.z = wob ? 0.12 * Math.sin(f * 0.9 + k * 2) : 0; g.position.y = g.userData.by + (wob ? 0.012 * Math.abs(Math.sin(f * 0.7 + k)) : 0);
  });
  for (const k of kern) {
    const appear = f - k.ap; k.g.visible = appear >= 0;
    if (appear < 0) continue;
    const popped = f >= k.pf;
    k.seed.visible = !popped; k.pop.visible = popped;
    if (!popped) { k.g.position.set(k.bx, k.by + 0.4 * Math.max(0, 1 - appear / 6) ** 2, k.bz); k.g.rotation.set(0, 0, 0); k.g.scale.setScalar(1); continue; }
    const dt = (f - k.pf) / 30, y0 = k.by + 0.02, sc = 0.45 + 0.55 * backE(dt * 6);
    const benchTop = 0.95, floorY = 0.04;
    const tBench = (k.vy0 + Math.sqrt(k.vy0 * k.vy0 + 19.6 * (y0 - benchTop))) / 9.8;
    const bxEnd = k.bx + k.vx * tBench, bzEnd = k.bz + k.vz * tBench;
    const onBench = Math.abs(bxEnd) < 1.65 && bzEnd > -2.2 && bzEnd < -1.2;
    const support = onBench ? benchTop : floorY;
    const tL = (k.vy0 + Math.sqrt(k.vy0 * k.vy0 + 19.6 * (y0 - support))) / 9.8, tc = Math.min(dt, tL);
    k.g.position.set(k.bx + k.vx * tc, y0 + k.vy0 * tc - 4.9 * tc * tc, k.bz + k.vz * tc);
    k.g.rotation.set(k.spin * tc * 0.4, k.spin * tc * 0.3, k.spin * tc * 0.2);
    k.g.scale.setScalar(sc);
  }
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;

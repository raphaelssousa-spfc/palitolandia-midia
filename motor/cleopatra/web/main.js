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
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 }, stars: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize, stars; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      float hs = fract(sin(dot(floor(normalize(vP)*420.), vec3(12.9898,78.233,37.719)))*43758.5453); c += stars*step(0.9968, hs)*vec3(1.);
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
// Egito antigo (deserto, pirâmides, palmeiras), quadro da linha do tempo, set lunar (x=600) e portal do museu.
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const rt = P.rng(44);
M.sand = texM(P.sand(71), 240, 240); M.pyr = texM(P.sandstone(72), 8, 10);
M.dune1 = toon({ color: '#ecca84' }); M.dune2 = toon({ color: '#dcb669' });
M.palmTrunk = toon({ color: '#8a5a34' }); M.palmLeaf = toon({ color: '#3f8f3c' }); M.palmLeaf2 = toon({ color: '#5aa848' });
M.moon = new THREE.MeshBasicMaterial({ map: P.tex(P.moonTex(73)), fog: false });
M.earth = new THREE.MeshBasicMaterial({ map: P.tex(P.earthTex(76)), fog: false });
M.lunar = texM(P.moonDust(74), 120, 120); M.rock = toon({ color: '#7d828c' });
M.foil = toon({ color: '#d9a845' }); M.steel = toon({ color: '#9aa7b1' }); M.legs = toon({ color: '#b9bec6' }); M.flame = new THREE.MeshBasicMaterial({ color: '#ffb347', fog: true });
M.flagM = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.flag()), side: THREE.DoubleSide });
M.board = toon({ map: P.tex(P.timeline()) }); M.postG = toon({ color: '#d9a845' }); M.rope = toon({ color: '#b8282b' });
M.sign = toon({ map: P.tex(P.plaque('MUSEU')) });
const groundMat = M.sand;
const ground = add(new THREE.PlaneGeometry(2400, 2400), groundMat, 0, -0.02, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;

// pirâmides
const pyr = (r, h, x, z) => { const m = add(new THREE.ConeGeometry(r, h, 4, 1), M.pyr, x, h / 2, z, world); m.rotation.y = Math.PI / 4; return m; };
pyr(17, 15, 4, -26); pyr(14, 12, -24, -52); pyr(9, 8, 28, -62);
// dunas
for (const [x, z, r, sy, k] of [[-20, -22, 7, 0.3, 0], [22, -20, 8, 0.28, 1], [-26, -8, 6, 0.3, 1], [26, -6, 6.5, 0.26, 0], [-34, -40, 12, 0.3, 1], [40, -40, 13, 0.3, 0], [0, -90, 30, 0.22, 1], [-70, -70, 30, 0.2, 0], [80, -80, 34, 0.2, 1]]) {
  const d = add(new THREE.SphereGeometry(r, 20, 10), k ? M.dune1 : M.dune2, x, -r * 0.12, z, world, { cast: false }); d.scale.y = sy * 1.3;
}
// palmeiras
const palm = (x, z, h = 4, lean = 0.1) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  const tr = add(new THREE.CylinderGeometry(0.15, 0.24, h, 8), M.palmTrunk, 0, h / 2, 0, g); tr.rotation.z = lean;
  const top = new THREE.Group(); top.position.set(-Math.sin(lean) * h / 2 * 1.02, h, 0); g.add(top);
  for (let i = 0; i < 7; i++) { const lf = new THREE.Group(); lf.rotation.y = i * Math.PI * 2 / 7; top.add(lf);
    const b = add(box(1.9, 0.05, 0.5), i % 2 ? M.palmLeaf : M.palmLeaf2, 0.95, -0.1, 0, lf); b.rotation.z = -0.35; }
  add(new THREE.SphereGeometry(0.2, 8, 6), M.palmTrunk, 0, -0.1, 0, top);
};
palm(-4.2, -7, 4.2, 0.1); palm(2.8, -8.5, 3.6, -0.12); palm(-3.4, -16, 4.6, 0.08); palm(3.6, -15, 4.0, -0.1); palm(5, 0, 3.4, -0.08);

// Lua no céu e a Terra (set lunar)
const moonSky = add(new THREE.SphereGeometry(8, 32, 16), M.moon, -14, 22, -80, world, { cast: false });
// quadro da linha do tempo
const BZ = -3, BY0 = 0.35, BW = 1.9, BH = 3.6, PX = 0.002;
const boardG = new THREE.Group(); world.add(boardG);
add(new THREE.PlaneGeometry(BW, BH), M.board, 0, BY0 + BH / 2, BZ, boardG);
for (const sx of [-1, 1]) add(tbox(0.12, 4.3, 0.12, 1), M.beam, sx * 1.03, 2.15, BZ - 0.06, boardG);
add(tbox(2.3, 0.14, 0.14, 1), M.beam, 0, 4.25, BZ - 0.06, boardG);
const mkBr = (w, h, lines, col, flip, fs, cxp, cyp) => {
  const tx = P.tex(P.bracket(w, h, lines, col, flip, fs)); tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * PX, h * PX), new THREE.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, fog: false }));
  m.position.set((cxp - 475) * PX, BY0 + BH - cyp * PX, BZ + 0.03); m.userData.nd = cardNd(tx); m.castShadow = false; m.visible = false; boardG.add(m); return m;
};
const brL = mkBr(320, 770, ['quase', '2.500', 'anos'], '#b3261e', false, 66, 770, 693);
const brR = mkBr(320, 614, ['quase', '2.000', 'anos'], '#0f7a6a', false, 66, 770, 1343);
const brE = mkBr(320, 921, ['Egito', 'antigo', '3.000', 'anos'], '#8a5a00', true, 60, 180, 615);

// set lunar em x = 600
const MX = 600;
const lunarGround = add(new THREE.PlaneGeometry(1000, 1000), M.lunar, MX, 0.03, 0, world, { cast: false }); lunarGround.rotation.x = -Math.PI / 2;
for (let i = 0; i < 16; i++) { const a = rt() * Math.PI * 2, d = 4 + rt() * 22, s = 0.25 + rt() * 0.9; const rk = add(new THREE.DodecahedronGeometry(s, 0), M.rock, MX + Math.cos(a) * d, s * 0.35, -3 - Math.abs(Math.sin(a)) * d, world); rk.scale.y = 0.6; rk.rotation.set(rt() * 3, rt() * 3, 0); }
const lander = new THREE.Group(); lander.position.set(MX + 0.2, 7, -3.2); world.add(lander);
{ add(new THREE.CylinderGeometry(0.85, 0.95, 0.75, 8), M.foil, 0, 1.25, 0, lander);
  add(new THREE.CylinderGeometry(0.55, 0.8, 0.35, 8), M.steel, 0, 1.8, 0, lander);
  add(box(0.5, 0.26, 0.1), M.window, 0, 1.8, 0.62, lander);
  const eng = add(new THREE.ConeGeometry(0.28, 0.4, 10), M.iron, 0, 0.7, 0, lander); eng.rotation.x = Math.PI;
  for (let k = 0; k < 4; k++) { const lg = new THREE.Group(); lg.rotation.y = k * Math.PI / 2 + Math.PI / 4; lander.add(lg);
    const st = add(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 5), M.legs, 1.12, 0.62, 0, lg); st.rotation.z = 0.5;
    add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), M.legs, 1.5, 0.03, 0, lg); } }
const flame = add(new THREE.ConeGeometry(0.3, 1.1, 10), M.flame, 0, 0.2, 0, lander, { cast: false }); flame.rotation.x = Math.PI; flame.visible = false;
const flagG = new THREE.Group(); flagG.position.set(MX - 1.0, 0, -2.6); world.add(flagG);
add(new THREE.CylinderGeometry(0.025, 0.025, 2.1, 6), M.legs, 0, 1.05, 0, flagG); add(new THREE.PlaneGeometry(0.9, 0.6), M.flagM, 0.46, 1.72, 0, flagG); flagG.visible = false;
const earth = add(new THREE.SphereGeometry(26, 32, 16), M.earth, MX + 60, 95, -330, world, { cast: false });

// portal do museu (cordas + placa que cai)
const MZ = -1.6; const museumG = new THREE.Group(); world.add(museumG);
for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 8), M.postG, sx * 0.98, 1.4, MZ, museumG); add(new THREE.SphereGeometry(0.13, 10, 8), M.postG, sx * 0.98, 2.85, MZ, museumG); }
add(box(1.9, 0.05, 0.05), M.rope, 0, 0.85, MZ, museumG); add(box(1.9, 0.05, 0.05), M.rope, 0, 0.55, MZ, museumG);
const signG = new THREE.Group(); signG.position.set(0, 6.5, MZ + 0.02); museumG.add(signG); signG.visible = false;
add(new THREE.PlaneGeometry(1.8, 0.42), M.sign, 0, 0, 0, signG);

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
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0; skyU.stars.value = L.stars || 0;
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
  const pop = (m, t) => { m.visible = t > 0.001; m.scale.setScalar(Math.max(backE(t), 0.001)); };
  pop(brL, W.brL); pop(brR, W.brR); pop(brE, W.brE);
  lander.position.y = W.landY;
  flame.visible = W.flame > 0; flame.scale.set(1, W.flame * (0.8 + 0.4 * Math.abs(Math.sin(f * 1.9))), 1);
  flagG.visible = W.flag > 0.001; flagG.scale.set(1, Math.max(backE(W.flag), 0.001), 1);
  signG.visible = W.signY < 6; signG.position.y = W.signY;
  boardG.visible = W.board; museumG.visible = W.museum;
  for (const c of clouds) c.visible = W.clouds;
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

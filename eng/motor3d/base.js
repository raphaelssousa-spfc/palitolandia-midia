import * as THREE from './lib/three.module.js';
try {
const W = 1080, H = 1920, FPS = 30;
const TM = await (await fetch('timing.json')).json();
const MOUTH = await (await fetch('mouth.json')).json();
const mouthAt = g => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, g))] ?? 0;
const S = i => TM.phrases[i].s, E = i => TM.phrases[i].e, END = TM.duration;
// ---------- util ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
const eo = u => 1 - Math.pow(1 - cl(u), 3);
const ei = u => Math.pow(cl(u), 3);
const back = u => { u = cl(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const r = (t, a, b) => cl((t - a) / (b - a));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lv = (a, b, u) => a.clone().lerp(b, u);
const noise = (t, s = 1) => Math.sin(t * 1.7 * s + 1.3) * 0.5 + Math.sin(t * 2.9 * s + 0.4) * 0.3 + Math.sin(t * 5.3 * s) * 0.2;
// ---------- renderer ----------
const canvas = document.getElementById('c');
const R = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const SKY = new THREE.Color('#cfe3ef');
scene.background = SKY; scene.fog = new THREE.Fog('#d9e6ea', 22, 60);
const cam = new THREE.PerspectiveCamera(40, W / H, 0.2, 200);
const hemi = new THREE.HemisphereLight('#eaf4ff', '#8a5a3a', 1.25); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3df', 2.4); sun.position.set(6, 12, 8); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 40;
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; scene.add(sun); scene.add(sun.target);
const fill = new THREE.PointLight('#ffd9a8', 0, 6, 1.6); scene.add(fill); // luz no fundo do poço (vista em corte)
// ---------- texturas pintadas ----------
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function speckle(g, w, h, base, cols, n, rmin, rmax) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { g.fillStyle = cols[(rnd() * cols.length) | 0]; g.globalAlpha = 0.35 + rnd() * 0.5; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, rmin + rnd() * (rmax - rmin), rmin + rnd() * (rmax - rmin), rnd() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
const dirtTex = canvasTex(512, 512, (g, w, h) => speckle(g, w, h, '#a8693f', ['#94592f', '#b97b4c', '#86512c', '#c58d5c', '#7a4a29'], 2600, 1.5, 6));
const strataTex = canvasTex(512, 1024, (g, w, h) => {
  const bands = [[0, 0.05, '#6b4128'], [0.05, 0.3, '#9c5a34'], [0.3, 0.55, '#b0683a'], [0.55, 0.78, '#a06a45'], [0.78, 1, '#8a6250']];
  for (const [a, b, c] of bands) { g.fillStyle = c; g.fillRect(0, a * h, w, (b - a) * h + 1); }
  for (let i = 0; i < 5000; i++) { g.fillStyle = ['#00000022', '#ffffff18', '#3a1f1022'][(rnd() * 3) | 0]; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 2.5, 0, 0, 7); g.fill(); }
  g.strokeStyle = '#00000030'; g.lineWidth = 3; for (const [a] of bands.slice(1)) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, a * h + Math.sin(x * 0.05) * 6); g.stroke(); }
});
strataTex.repeat.set(1 / 4, 1 / 9); strataTex.offset.set(0, 1);
const ringTex = canvasTex(256, 256, (g, w, h) => {
  speckle(g, w, h, '#a9a49b', ['#9a958c', '#b8b3aa', '#8f8a82'], 900, 1, 3.5);
  g.fillStyle = '#6f6a63'; g.fillRect(0, 0, w, 7); g.fillStyle = '#ffffff22'; g.fillRect(0, 7, w, 4);
  for (let i = 0; i < 18; i++) { g.fillStyle = '#5e7a4a33'; g.beginPath(); g.ellipse(rnd() * w, h * (0.6 + rnd() * 0.4), 6 + rnd() * 14, 3 + rnd() * 6, 0, 0, 7); g.fill(); }
}, 5, 12);
const curbTex = canvasTex(256, 128, (g, w, h) => speckle(g, w, h, '#c4bfb5', ['#b3aea4', '#d3cec4', '#a8a398'], 500, 1, 3), 6, 1);
const tapeTex = canvasTex(256, 32, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e02020'; for (let x = -32; x < w + 32; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 0); g.lineTo(x + 64, h); g.lineTo(x + 32, h); g.fill(); } }, 6, 1);
const postTex = canvasTex(32, 128, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff' : '#e02020'; g.fillRect(0, i * h / 8, w, h / 8); } });
const hazeTex = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const stripeTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h); });
// ---------- materiais ----------
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o });
const mats = {
  dirt: M('#ffffff', { map: dirtTex, side: THREE.DoubleSide }), strata: M('#ffffff', { map: strataTex, side: THREE.DoubleSide }),
  ring: M('#ffffff', { map: ringTex, side: THREE.DoubleSide }), curb: M('#ffffff', { map: curbTex, side: THREE.DoubleSide }),
  wallcut: M('#8e8a84'), mud: M('#4c3a2c', { roughness: 0.4 }), water: M('#3b4a45', { roughness: 0.15, metalness: 0.1 }),
  yellow: M('#f2c21b'), black: M('#1d1d1f'), steel: M('#9aa3ab', { metalness: 0.5, roughness: 0.45 }), alu: M('#c8ced3', { metalness: 0.4, roughness: 0.4 }),
  pipe: M('#e07b2a'), hose: M('#2d5f8a'), white: M('#f4f4f2'), red: M('#d62a2a'), wood: M('#b07a45'),
  roof: M('#c0563a'), wallH: M('#efe6d8'), wallH2: M('#e3d7c4'), door: M('#6c4a33'), win: M('#4d5c66'),
  leaf: M('#4f8a3a'), leaf2: M('#3f7a30'), trunk: M('#6e4a2f'), grass: M('#86a957'),
  tape: M('#ffffff', { map: tapeTex, side: THREE.DoubleSide }), post: M('#ffffff', { map: postTex }),
  haze: new THREE.MeshBasicMaterial({ color: '#a9c27a', map: hazeTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }),
};
function mesh(geo, mat, parent, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; if (parent) parent.add(m); return m;
}
// ---------- personagens ----------
function person(o) {
  const shirt = M(o.shirt), pants = M(o.pants || '#2c3e5c'), skin = M(o.skin || '#c98d62'), helm = M(o.helmet || '#f5f5f2', { roughness: 0.4 }), refl = M('#e9eef0', { roughness: 0.3, emissive: '#555', emissiveIntensity: 0.2 });
  const g = new THREE.Group(); scene.add(g);
  const hips = new THREE.Group(); hips.position.y = 0.95; g.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  const body = mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 16), shirt, torso, 0, 0.36, 0); body.scale.set(1, 1, 0.78);
  const st = mesh(new THREE.CylinderGeometry(0.226, 0.226, 0.06, 24, 1, true), refl, torso, 0, 0.28, 0); st.scale.set(1, 1, 0.78);
  mesh(new THREE.TorusGeometry(0.1, 0.04, 8, 18).rotateX(Math.PI / 2), shirt, torso, 0, 0.72, 0);
  const head = new THREE.Group(); head.position.y = 0.78; torso.add(head);
  mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), skin, head, 0, 0.02, 0);
  const hd = mesh(new THREE.SphereGeometry(0.17, 22, 16), skin, head, 0, 0.2, 0); hd.scale.set(0.95, 1.08, 0.95);
  mesh(new THREE.SphereGeometry(0.035, 10, 8), M(o.nose || '#b8774d'), head, 0, 0.18, 0.165);
  const eyes = []; for (const sx of [-0.06, 0.06]) { const e = mesh(new THREE.SphereGeometry(0.027, 10, 8), M('#151515', { roughness: 0.2 }), head, sx, 0.24, 0.148, false); eyes.push(e); }
  if (o.beard) { const b = mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), M('#3b2a20'), head, 0, 0.2, 0.02); b.scale.set(1.0, 1.1, 1.05); }
  const hl = mesh(new THREE.SphereGeometry(0.195, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), helm, head, 0, 0.27, 0); hl.scale.set(1, 0.92, 1.05);
  mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.022, 24), helm, head, 0, 0.27, 0.02).scale.set(1, 1, 1.08);
  mesh(new THREE.BoxGeometry(0.04, 0.05, 0.36), helm, head, 0, 0.45, 0);
  const limb = (x, y, len, rad, mat, end, endMat) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = mesh(new THREE.CapsuleGeometry(rad, len, 4, 10), mat, p, 0, -len / 2 - rad * 0.4, 0); if (end) end(p, endMat, len); return p; };
  const hand = (p, m, len) => mesh(new THREE.SphereGeometry(0.065, 10, 8), m, p, 0, -len - 0.1, 0);
  const boot = (p, m, len) => mesh(new THREE.BoxGeometry(0.16, 0.1, 0.26), m, p, 0, -len - 0.13, 0.04);
  const armL = limb(0.29, 0.6, 0.46, 0.07, shirt, hand, skin), armR = limb(-0.29, 0.6, 0.46, 0.07, shirt, hand, skin); torso.add(armL, armR);
  for (const a of [armL, armR]) { const s = mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.05, 12, 1, true), refl, a, 0, -0.32, 0); }
  const legL = limb(0.11, 0, 0.66, 0.085, pants, boot, M('#222')), legR = limb(-0.11, 0, 0.66, 0.085, pants, boot, M('#222')); hips.add(legL, legR);
  const P = { g, hips, torso, head, armL, armR, legL, legR, eyes, prop: null, handR: armR.children[1] };
  return P;
}
function pose(P, o = {}) {
  const d = (k, v) => (o[k] !== undefined ? o[k] : v);
  P.hips.position.y = d('hipY', 0.95);
  P.torso.rotation.set(d('lean', 0), 0, d('side', 0));
  const h = d('head', [0, 0, 0]); P.head.rotation.set(h[0], h[1], h[2]);
  const aL = d('armL', [0, 0.12]), aR = d('armR', [0, -0.12]);
  P.armL.rotation.set(aL[0], 0, aL[1]); P.armR.rotation.set(aR[0], 0, aR[1]);
  P.legL.rotation.set(d('legL', 0), 0, d('legLz', 0)); P.legR.rotation.set(d('legR', 0), 0, d('legRz', 0));
  const ey = d('eyes', 1); P.eyes.forEach(e => e.scale.set(1, ey, 1));
}
function idle(P, t, s = 0) { P.torso.rotation.x += Math.sin(t * 1.6 + s) * 0.015; P.head.rotation.y += Math.sin(t * 0.9 + s * 2) * 0.06; }
// ---------- câmera ----------
function camKeys(keys, t) { // [t, pos, tgt, fov]
  if (t <= keys[0][0]) return keys[0]; if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t >= a[0] && t <= b[0]) { const u = sm((t - a[0]) / (b[0] - a[0])); return [t, lv(a[1], b[1], u), lv(a[2], b[2], u), lerp(a[3], b[3], u)]; } }
}
// ---------- HTML ----------
const ov = document.getElementById('ov'), fxd = document.getElementById('fx');
const scr = v => { const p = v.clone().project(cam); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, z: p.z }; };
const pop = (t, t0, d = 0.35) => back(r(t, t0, t0 + d));
function pill(t, t0, txt, pos, cls = '', anchor = null, t1 = 1e9) {
  if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0) * (1 - r(t, t1, t1 + 0.25));
  let line = '';
  if (anchor) { const a = scr(anchor); const u = eo(r(t, t0, t0 + 0.3)); line = `<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}"><line x1="${pos.x}" y1="${pos.y}" x2="${lerp(pos.x, a.x, u)}" y2="${lerp(pos.y, a.y, u)}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${k}"/><circle cx="${a.x}" cy="${a.y}" r="${9 * u}" fill="#fff" opacity="${k}"/></svg>`; }
  return line + `<div class="pill ${cls}" style="left:${pos.x}px;top:${pos.y}px;transform:translate(-50%,-50%) scale(${k})">${txt}</div>`;
}
function big(t, t0, txt, y, color = '#fff', size = 104, t1 = 1e9) {
  if (t < t0 || t > t1 + 0.2) return ''; const k = back(r(t, t0, t0 + 0.3)), o = 1 - r(t, t1, t1 + 0.2);
  return `<div class="big" style="top:${y}px;color:${color};font-size:${size}px;transform:scale(${0.6 + 0.4 * k});opacity:${cl(k) * o}">${txt}</div>`;
}
const CHK = (on, red) => `<span style="display:inline-flex;width:46px;height:46px;border-radius:50%;align-items:center;justify-content:center;margin-right:18px;flex:none;
  background:${on ? (red ? '#e03131' : '#22b35e') : '#3a404c'};transform:scale(${on ? 1 : 0.85})">${on ? (red ? '<svg width="24" height="24"><path d="M5 5L19 19M19 5L5 19" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>' : '<svg width="26" height="26"><path d="M4 14L10 20L22 6" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>') : ''}</span>`;
function checklist(t, t0, title, items, x, y, w, color = '#22b35e', red = false, t1 = 1e9) {
  if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0, 0.4) * (1 - r(t, t1, t1 + 0.25));
  let h = `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;padding:26px 34px 22px;transform-origin:50% 0;transform:scale(${k});opacity:${cl(k)}">
  <div style="font-weight:800;font-size:34px;color:${color};text-align:center;letter-spacing:1px;margin-bottom:14px">${title}</div>`;
  for (const [txt, ts] of items) { const vis = r(t, ts - 0.15, ts + 0.1); const on = t >= ts;
    h += `<div style="display:flex;align-items:center;font-weight:700;font-size:36px;margin:12px 0;opacity:${0.35 + 0.65 * (t >= ts - 0.4 ? 1 : 0)}">${CHK(on, red)}<span>${txt}</span></div>`; }
  return h + '</div>';
}
function o2card(t, t0, val, marks, t1 = 1e9, y = 120) {
  if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0, 0.4) * (1 - r(t, t1, t1 + 0.25));
  const col = val >= 19.5 ? '#22c065' : val >= 12 ? '#f08c1a' : '#e53030'; const pct = cl(val / 21);
  let mk = ''; for (const [v, lab, ts, c] of marks) if (t >= ts) { const x = v / 21 * 100; const a = back(r(t, ts, ts + 0.3));
    mk += `<div style="position:absolute;left:${x}%;top:-12px;height:76px;border-left:5px dashed ${c};transform:scaleY(${a})"></div><div style="position:absolute;left:${x}%;top:72px;transform:translateX(-50%) scale(${a});font-weight:800;font-size:28px;color:${c};white-space:nowrap">${lab}</div>`; }
  const blink = val < 10 ? (Math.floor(t * 4) % 2 ? 1 : 0.55) : 1;
  return `<div class="card" style="left:110px;top:${y}px;width:860px;padding:22px 36px 64px;transform-origin:50% 0;transform:scale(${k})">
   <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:800;font-size:34px;letter-spacing:1px">OXIGÊNIO NO AR</span><span style="font-weight:900;font-size:64px;color:${col};opacity:${blink}">${val.toFixed(val % 1 ? 1 : 0).replace('.', ',')}%</span></div>
   <div style="position:relative;height:52px;margin-top:10px;background:#2c313b;border-radius:14px"><div style="position:absolute;left:0;top:0;bottom:0;width:${pct * 100}%;background:${col};border-radius:14px"></div>${mk}</div></div>`;
}
function dim(t, t0, a, b, txt, side = 1) { // cota vertical
  if (t < t0) return ''; const u = eo(r(t, t0, t0 + 0.5)); const A = scr(a), B0 = scr(b); const B = { x: lerp(A.x, B0.x, u), y: lerp(A.y, B0.y, u) };
  return `<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}"><g stroke="#ffb020" stroke-width="6" stroke-linecap="round"><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/><line x1="${A.x - 22}" y1="${A.y}" x2="${A.x + 22}" y2="${A.y}"/><line x1="${B.x - 22}" y1="${B.y}" x2="${B.x + 22}" y2="${B.y}"/></g></svg>
  <div class="pill" style="left:${(A.x + B.x) / 2 + side * 6}px;top:${(A.y + B.y) / 2}px;border-color:#ffb020;font-size:48px;transform:translate(-50%,-50%) scale(${back(r(t, t0 + 0.2, t0 + 0.5))})">${txt}</div>`;
}
// legenda palavra a palavra
const chunks = [];
{ let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  let lastP = -1;
  for (const w of TM.words) { if (w.p !== lastP) { flush(); lastP = w.p; } cur.push(w); if (/[,.:!?]$/.test(w.w) || cur.length >= 5) flush(); }
  flush();
  // juntar pedaços de 1 palavra ao anterior da mesma frase
  for (let i = chunks.length - 1; i > 0; i--) if (chunks[i].length === 1 && chunks[i - 1][0].p === chunks[i][0].p && chunks[i - 1].length < 5) { chunks[i - 1].push(...chunks[i]); chunks.splice(i, 1); }
}
function caption(t) {
  let c = null; for (let i = 0; i < chunks.length; i++) { const s = chunks[i][0].s - 0.06; const e = i + 1 < chunks.length ? chunks[i + 1][0].s - 0.06 : END; if (t >= s && t < e) { c = chunks[i]; break; } }
  if (!c) return ''; if (t > c[c.length - 1].e + 0.45 && !(chunks.indexOf(c) === chunks.length - 1)) return '';
  let h = ''; let act = -1; c.forEach((w, i) => { if (t >= w.s - 0.04) act = i; });
  c.forEach((w, i) => { h += (i ? ' ' : '') + (i === act ? `<b>${w.w}</b>` : w.w); });
  return `<div class="cap">${h}</div>`;
}
function xmark(t, t0, p, t1 = 1e9) { if (t < t0 || t > t1 + 0.2) return ''; const a = scr(p), k = back(r(t, t0, t0 + 0.3)) * (1 - r(t, t1, t1 + 0.2));
  return `<div style="position:absolute;left:${a.x}px;top:${a.y}px;width:96px;height:96px;margin:-48px;border-radius:50%;background:#e03131;border:5px solid #fff;transform:scale(${k});display:flex;align-items:center;justify-content:center"><svg width="46" height="46"><path d="M8 8L38 38M38 8L8 38" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg></div>`; }
// ---------- tela final (mesmo modelo do vídeo de pavimentação) ----------
function springSim(fr, damping, stiffness, mass = 1) { if (fr <= 0) return 0; let x = 0, v = 0; const dt = 1 / 30 / 8; for (let i = 0; i < fr * 8; i++) { const a = (-stiffness * (x - 1) - damping * v) / mass; v += a * dt; x += v * dt; } return x; }
const LASTP = TM.phrases.length - 1; // última frase = "Segue ... Até o próximo!"
const WSEG = TM.words.find(w => w.p === LASTP && w.w.toLowerCase() === 'segue') || TM.words.find(w => w.p === LASTP), WATE = TM.words.find(w => w.p === LASTP && w.w === 'Até') || TM.words.filter(w => w.p === LASTP).slice(-3)[0];
const F_SEG = Math.round(WSEG.s * FPS), F_ATE = Math.round(WATE.s * FPS), F_TOT = TM.frames;
window.F_END = F_SEG - 4;
const cone = x => `<svg style="position:absolute;left:${x - 55}px;top:880px" width="110" height="150" viewBox="0 0 110 150"><path d="M42 10 L68 10 L96 128 L14 128 Z" fill="#FF6B1A"/><path d="M34 44 L76 44 L82 68 L28 68 Z" fill="#fff"/><path d="M24 86 L86 86 L91 106 L19 106 Z" fill="#fff"/><rect x="2" y="126" width="106" height="14" rx="4" fill="#E2551A"/></svg>`;
function telaFinal(f) {
  const st0 = F_SEG - 4; if (f < st0) return '';
  const end = springSim(f - st0, 2 * Math.sqrt(170) * 1.0 * 1.6, 170);   // entrada suave, sem pulo
  const followed = f >= F_SEG + 16; const pp = followed ? 0.94 + 0.06 * springSim(f - F_SEG - 16, 9, 170, 0.8) : 1;
  const fade = cl((f - (F_TOT - 18)) / 18);
  const svg = window.AV.svg(mouthAt(f), window.AV.blinkAt(f));
  let h = `<div style="position:absolute;inset:0;opacity:${cl(end)};background:#25282D">
   <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.05) 2px,transparent 2.5px);background-size:46px 46px"></div>
   <div style="position:absolute;left:58px;top:0;bottom:0;width:22px;background:repeating-linear-gradient(#FFC20E 0 100px,transparent 100px 170px)"></div>
   ${cone(150)}${cone(930)}
   <div style="position:absolute;top:360px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:22px;transform:translateY(${(1 - end) * 60}px)">
    <div style="width:300px;height:300px;box-sizing:border-box;border-radius:150px;overflow:hidden;background:#30343A;border:10px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${svg}</div>
    <div style="font-family:InterD;font-weight:900;font-size:62px;color:#fff">@eng.raphaelserra</div>
    <div style="font-family:InterD;font-weight:800;font-size:36px;color:#9AA0A8;letter-spacing:3px">ENGENHARIA CIVIL</div>
    <div style="margin-top:20px;background:${followed ? '#30343A' : '#FFC20E'};color:${followed ? '#FFC20E' : '#111'};border:5px solid #FFC20E;font-family:InterD;font-weight:900;font-size:52px;padding:16px 80px;border-radius:999px;transform:scale(${pp})">${followed ? 'Seguindo ✓' : 'Seguir'}</div>
   </div>`;
  if (f >= F_ATE - 2) h += `<div style="position:absolute;top:960px;left:0;right:0;text-align:center;font-family:InterD;font-weight:900;font-size:96px;color:#FFC20E;letter-spacing:-3px;transform:scale(${springSim(f - F_ATE + 2, 9, 170, 0.8)})">Até o próximo!</div>`;
  return h + `</div>`;
}

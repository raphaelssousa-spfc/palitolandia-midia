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
// ================= KIT DE PEÇAS 3D (série DO ZERO) =================
// Peças low-poly prontas e PARAMÉTRICAS (tamanho, cor, quantidade). O episódio só MONTA (como Lego) e anima.
// Tudo fica dentro de KIT.* para não colidir com nomes do episódio. Toda peça tem origem na BASE (y = 0 no pé),
// assim KIT.grow(peça, u) "sobe" a peça do chão. Ver KIT.md para a lista completa e exemplos.
const KIT = (() => {
  // ---------- texturas de material (cada uma 1x; repetição por tamanho via UV) ----------
  const T = {};
  const tex = (k, w, h, draw) => (T[k] ||= canvasTex(w, h, draw));
  const stones = (g, w, h, base, cols, n, rmin, rmax) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const x = rnd() * w, y = rnd() * h, rr = rmin + rnd() * (rmax - rmin); g.fillStyle = cols[(rnd() * cols.length) | 0];
      g.beginPath(); for (let a = 0; a < 6; a++) { const an = a / 6 * 7 + rnd() * 0.5, q = rr * (0.7 + rnd() * 0.5); g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q * 0.8); } g.fill();
      g.strokeStyle = '#00000033'; g.lineWidth = 1.5; g.stroke(); } };
  const SOIL = {
    terra:    ['#a8693f', g => speckle(g, 512, 512, '#a8693f', ['#94592f', '#b97b4c', '#86512c', '#c58d5c'], 2400, 1.5, 6)],
    argila:   ['#b5653a', g => speckle(g, 512, 512, '#b5653a', ['#a3552e', '#c27448', '#9a4f2a'], 1800, 2, 7)],
    areia:    ['#d9b97c', g => speckle(g, 512, 512, '#d9b97c', ['#cdac6c', '#e6c98e', '#c49f62', '#f0d9a6'], 5200, 0.8, 2.2)],
    brita:    ['#8f8b85', g => stones(g, 512, 512, '#6f6b66', ['#9a958e', '#a9a49c', '#85817b', '#b6b1a8'], 900, 7, 16)],
    base:     ['#9d968a', g => stones(g, 512, 512, '#8a8378', ['#a49d91', '#b3ac9f', '#7e776d'], 1600, 3, 8)],
    subbase:  ['#b49a73', g => stones(g, 512, 512, '#a98d66', ['#c2a77f', '#9c8160', '#b89d75'], 1300, 2, 6)],
    asfalto:  ['#2c2c30', g => speckle(g, 512, 512, '#2c2c30', ['#3d3d42', '#47474d', '#232326', '#55555b'], 4200, 0.8, 2.6)],
    asfaltoQ: ['#3b2f2a', g => speckle(g, 512, 512, '#33292a', ['#4a3a33', '#2a2222', '#5a463c'], 4200, 0.8, 2.6)], // quente/fresco
    concreto: ['#bdb9b1', g => speckle(g, 512, 512, '#bdb9b1', ['#aeaaa2', '#cbc7bf', '#a29e96'], 1500, 1, 3.5)],
    concretoF:['#8f8c86', g => speckle(g, 512, 512, '#8f8c86', ['#84817b', '#9c9993', '#787570'], 1500, 1, 3.5)], // fresco/molhado
    rocha:    ['#6f6a66', g => stones(g, 512, 512, '#5f5a56', ['#77726d', '#6a6560', '#837e78', '#55504c'], 220, 18, 44)],
    grama:    ['#7fae4f', g => speckle(g, 512, 512, '#7fae4f', ['#6f9e42', '#8fbe5c', '#5f8e36'], 3000, 1, 3)],
    lama:     ['#5a4232', g => speckle(g, 512, 512, '#5a4232', ['#4c3729', '#6a4f3c'], 1600, 2, 6)],
    tijolo:   ['#b8603e', g => { g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) {
                 g.fillStyle = ['#b8603e', '#a9553a', '#c26a45', '#b05a3b'][(x * 7 + y * 3 + 16) % 4]; g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26); } }],
    madeira:  ['#b07a45', g => { g.fillStyle = '#b07a45'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) { g.fillStyle = '#00000030'; g.fillRect(0, y, 512, 4);
                 for (let i = 0; i < 40; i++) { g.strokeStyle = '#8a5a30' + '55'; g.beginPath(); const yy = y + 6 + rnd() * 54; g.moveTo(0, yy); g.bezierCurveTo(170, yy + 6, 340, yy - 6, 512, yy); g.stroke(); } } }],
  };
  const soilMat = {};
  const matOf = (type, o = {}) => { const k = type + JSON.stringify(o); if (soilMat[k]) return soilMat[k]; const d = SOIL[type] || SOIL.terra;
    const t = tex(type, 512, 512, d[1]); return (soilMat[k] = M('#ffffff', { map: t, roughness: type.startsWith('asfalto') ? 0.7 : 0.9, ...o })); };
  // UV proporcional ao tamanho (1 textura = 1,5 m) para a mesma "escala de grão" em qualquer peça
  function uvScale(geo, sx, sy, sz, tile = 1.5) { const uv = geo.attributes.uv, n = geo.attributes.normal;
    for (let i = 0; i < uv.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
      uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile); } return geo; }
  const box = (w, h, d, mat, parent, x = 0, y = 0, z = 0, cast = true) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); uvScale(g, w, h, d); return mesh(g, mat, parent, x, y, z, cast); };
  const cyl = (rt, rb, h, seg, mat, parent, x = 0, y = 0, z = 0) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, h / 2, 0); return mesh(g, mat, parent, x, y, z); };
  const grp = (parent = scene, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const C = (c, o) => M(c, o);
  const ROT = (o, x = 0, y = 0, z = 0) => { o.rotation.set(x, y, z); return o; };

  // chão (grama/terra) com BURACOS retangulares onde entram os blocos em corte — evita chão sobreposto (= piscada)
  // buracos = [[x, z, w, d], ...] (centro e tamanho). Ex.: KIT.chao({ buracos: [[0, -2.5, 9, 5]] }). Blocos de KIT.corte devem ter a face da frente em z = frente.
  function chao({ tipo = 'grama', w = 400, d = 120, x = 0, frente = 0, buracos = [], parent = scene } = {}) {
    const z = frente - d / 2; // o chão acaba na linha do CORTE (z = frente): na frente dele a câmera vê as camadas por baixo
    const s = new THREE.Shape(); s.moveTo(x - w / 2, -(z - d / 2)); s.lineTo(x + w / 2, -(z - d / 2)); s.lineTo(x + w / 2, -(z + d / 2)); s.lineTo(x - w / 2, -(z + d / 2));
    for (const [bx, bz, bw, bd] of buracos) { const h = new THREE.Path(); h.moveTo(bx - bw / 2, -(bz - bd / 2)); h.lineTo(bx - bw / 2, -(bz + bd / 2)); h.lineTo(bx + bw / 2, -(bz + bd / 2)); h.lineTo(bx + bw / 2, -(bz - bd / 2)); s.holes.push(h); }
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.5, uv.getY(i) / 1.5);
    return mesh(g, matOf(tipo, { side: THREE.DoubleSide }), parent, 0, 0, 0, false);
  }
  // ---------- 1) SOLO EM CORTE ----------
  // camadas = [[tipo, espessura], ...] de CIMA para BAIXO. Topo em y. Retorna {g, layers[], tops[], bottom}
  function corte({ w = 12, d = 6, camadas = [['grama', 0.12], ['terra', 1.2], ['argila', 1.5], ['rocha', 1.5]], x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, 0, z); let top = y; const layers = [], tops = [];
    for (const [type, h] of camadas) { const m = box(w, h, d, matOf(type), g, 0, top - h, 0, false); m.receiveShadow = true; layers.push(m); tops.push(top); top -= h; }
    return { g, layers, tops, bottom: top };
  }
  // pavimento: mesmas camadas, nomes de estrada (de cima p/ baixo). Retorna também cada camada para animar (grow)
  function pavimento({ w = 8, d = 5, x = 0, y = 0, z = 0, parent = scene, camadas = [['asfalto', 0.12], ['base', 0.2], ['subbase', 0.25], ['terra', 1.4]] } = {}) {
    return corte({ w, d, x, y, z, parent, camadas });
  }
  // vala / buraco retangular aberto num bloco de solo (parede de corte na frente). Retorna {g, fill} — fill = terra que sai (KIT.grow para cavar)
  function vala({ w = 2, d = 2, prof = 1.5, larg = 10, comp = 6, tipo = 'terra', x = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, 0, z), mat = matOf(tipo);
    const side = (larg - w) / 2;
    box(side, prof, comp, mat, g, -(w / 2 + side / 2), -prof, 0, false); box(side, prof, comp, mat, g, w / 2 + side / 2, -prof, 0, false);
    box(w, prof, (comp - d) / 2, mat, g, 0, -prof, -(d / 2 + (comp - d) / 4), false);
    box(larg, 1.2, comp, matOf('argila'), g, 0, -prof - 1.2, 0, false);
    const fill = box(w - 0.01, prof, d - 0.01, mat, g, 0, -prof, (comp - d) / 4 * 0 + 0, false);
    return { g, fill };
  }
  // ---------- 2) ESTRUTURA ----------
  function ferragem({ w = 3, d = 3, esp = 0.2, r = 0.018, cor = '#a35a32', camadas = 1, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), mat = C(cor, { roughness: 0.5, metalness: 0.3 });
    for (let k = 0; k < camadas; k++) { const yy = k * 0.12;
      for (let i = -w / 2; i <= w / 2 + 1e-6; i += esp) mesh(new THREE.CylinderGeometry(r, r, d, 6).rotateX(Math.PI / 2), mat, g, i, yy, 0);
      for (let j = -d / 2; j <= d / 2 + 1e-6; j += esp) mesh(new THREE.CylinderGeometry(r, r, w, 6).rotateZ(Math.PI / 2), mat, g, 0, yy + r * 2, j); }
    return g;
  }
  // pilar/coluna de ferragem vertical (4 barras + estribos)
  function armadura({ a = 0.25, h = 3, r = 0.018, esp = 0.2, cor = '#a35a32', x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), mat = C(cor, { roughness: 0.5, metalness: 0.3 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cyl(r, r, h, 6, mat, g, sx * a / 2, 0, sz * a / 2);
    for (let yy = 0.1; yy < h; yy += esp) mesh(new THREE.TorusGeometry(a * 0.72, r * 0.6, 4, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4), mat, g, 0, yy, 0);
    return g;
  }
  function forma({ w = 2, h = 0.5, d = 2, t = 0.04, x = 0, y = 0, z = 0, parent = scene, aberta = 'cima' } = {}) {
    const g = grp(parent, x, y, z), mat = matOf('madeira');
    box(w + 2 * t, h, t, mat, g, 0, 0, d / 2 + t / 2); box(w + 2 * t, h, t, mat, g, 0, 0, -d / 2 - t / 2);
    box(t, h, d, mat, g, w / 2 + t / 2, 0, 0); box(t, h, d, mat, g, -w / 2 - t / 2, 0, 0);
    if (aberta !== 'cima') box(w, t, d, mat, g, 0, -t, 0);
    for (let i = -w / 2; i <= w / 2; i += 0.6) for (const sz of [1, -1]) box(0.06, h + 0.05, 0.06, C('#8a5a30'), g, i, 0, sz * (d / 2 + t + 0.03)); // gravatas
    return g;
  }
  // bloco de concreto (sapata, viga, laje, pilar). fresco=true deixa cinza escuro (molhado)
  const concreto = ({ w = 1, h = 1, d = 1, fresco = false, x = 0, y = 0, z = 0, parent = scene } = {}) => box(w, h, d, matOf(fresco ? 'concretoF' : 'concreto'), parent, x, y, z);
  const parede = ({ w = 3, h = 2.6, d = 0.15, tipo = 'tijolo', x = 0, y = 0, z = 0, parent = scene } = {}) => box(w, h, d, matOf(tipo), parent, x, y, z);
  function tubo({ comp = 4, r = 0.2, cor = '#e07b2a', eixo = 'x', aberto = true, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), mat = C(cor, { roughness: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.CylinderGeometry(r, r, comp, 20, 1, aberto); const m = mesh(geo, mat, g);
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(r * 1.02, r * 0.12, 6, 20).rotateX(Math.PI / 2), mat, g, 0, s * comp / 2 * 0.98, 0);
    if (aberto) mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, comp * 0.99, 20, 1, true), C('#1d1d1f', { side: THREE.BackSide }), g);
    if (eixo === 'x') g.rotation.z = Math.PI / 2; else if (eixo === 'z') g.rotation.x = Math.PI / 2;
    return g;
  }
  // ---------- 3) MÁQUINAS (amarelo de obra; cor muda por parâmetro) ----------
  const glass = () => C('#9fc6d8', { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.65 });
  function rodas(parent, xs, zs, r, w, mat, y = r) { const out = []; for (const x of xs) for (const z of zs) {
    const wh = grp(parent, x, y, z); mesh(new THREE.CylinderGeometry(r, r, w, 16).rotateX(Math.PI / 2), mat, wh); mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 10).rotateX(Math.PI / 2), C('#c9c9c9', { metalness: 0.4 }), wh); out.push(wh); } return out; }
  function escavadeira({ cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = C('#26262a'), S = C('#7d8288', { metalness: 0.4 });
    for (const s of [-1, 1]) { const tr = box(2.6, 0.55, 0.55, K, g, 0, 0, s * 0.75); mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.56, 12).rotateX(Math.PI / 2), K, g, 1.3, 0.27, s * 0.75); mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.56, 12).rotateX(Math.PI / 2), K, g, -1.3, 0.27, s * 0.75); }
    const turret = grp(g, 0, 0.55, 0); box(2.2, 0.7, 1.7, Y, turret, -0.2, 0, 0); box(0.9, 0.5, 1.6, K, turret, -1.25, 0.1, 0);
    const cab = box(0.9, 0.95, 0.85, Y, turret, 0.45, 0.7, 0.4); box(0.82, 0.7, 0.87, glass(), turret, 0.47, 0.82, 0.4);
    const boom = grp(turret, 0.6, 0.6, -0.35); const b1 = box(0.3, 2.4, 0.3, Y, boom, 0, 0, 0); boom.rotation.z = -0.9;
    const stick = grp(boom, 0, 2.35, 0); box(0.24, 1.8, 0.24, Y, stick, 0, 0, 0); stick.rotation.z = 2.0;
    const bucket = grp(stick, 0, 1.8, 0); const bk = box(0.7, 0.55, 0.7, S, bucket, 0.15, -0.1, 0); for (let i = -0.25; i <= 0.26; i += 0.17) mesh(new THREE.ConeGeometry(0.05, 0.16, 4).rotateZ(Math.PI), S, bucket, 0.45, -0.18, i);
    bucket.rotation.z = 0.6;
    const set = ({ giro = 0, lanca = -0.9, braco = 2.0, cacamba = 0.6 } = {}) => { turret.rotation.y = giro; boom.rotation.z = lanca; stick.rotation.z = braco; bucket.rotation.z = cacamba; };
    return { g, turret, boom, stick, bucket, set };
  }
  function caminhao({ cor = '#e8532b', cacamba = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Cc = C(cor), Cb = C(cacamba), K = C('#26262a');
    box(4.2, 0.25, 1.3, K, g, 0, 0.45, 0); const cab = box(1.2, 1.3, 1.7, Cc, g, 1.55, 0.6, 0); box(0.05, 0.6, 1.5, glass(), g, 2.16, 1.15, 0); box(0.9, 0.5, 1.72, glass(), g, 1.5, 1.2, 0);
    const bed = grp(g, -1.9, 0.75, 0); box(2.9, 0.95, 1.9, Cb, bed, 1.45, 0, 0); box(2.7, 0.05, 1.7, C('#3c3c40'), bed, 1.45, 0.9, 0); // pivô atrás
    const load = box(2.7, 0.5, 1.7, matOf('terra'), bed, 1.45, 0.5, 0); load.visible = false;
    const wheels = rodas(g, [1.5, -0.9, -1.6], [-0.75, 0.75], 0.42, 0.32, K);
    const set = ({ basculha = 0, roda = 0, carga = false, tipoCarga = 'terra' } = {}) => { bed.rotation.z = basculha * 0.85; wheels.forEach(w => w.rotation.z = -roda); load.visible = carga; if (carga) load.material = matOf(tipoCarga); };
    return { g, bed, wheels, load, set };
  }
  function rolo({ cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = C('#26262a'), S = C('#8f959b', { metalness: 0.5, roughness: 0.4 });
    const drum = grp(g, 1.1, 0.6, 0); mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.7, 22).rotateX(Math.PI / 2), S, drum); box(0.3, 0.9, 1.9, Y, g, 1.1, 0.75, 0);
    box(1.9, 0.9, 1.5, Y, g, -0.5, 0.35, 0); const cab = grp(g, -0.6, 1.25, 0); for (const [a, b] of [[-0.45, -0.6], [0.45, -0.6], [-0.45, 0.6], [0.45, 0.6]]) box(0.06, 1.0, 0.06, K, cab, a, 0, b); box(1.1, 0.08, 1.4, Y, cab, 0, 1.0, 0);
    const wheels = rodas(g, [-0.9], [-0.7, 0.7], 0.45, 0.35, K);
    const set = ({ roda = 0 } = {}) => { drum.rotation.z = -roda; wheels.forEach(w => w.rotation.z = -roda * 1.3); };
    return { g, drum, set };
  }
  function betoneira({ cor = '#f4f4f2', tambor = '#e8532b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const K = C('#26262a');
    box(4.4, 0.25, 1.3, K, g, 0, 0.45, 0); box(1.2, 1.3, 1.7, C(cor), g, 1.65, 0.6, 0); box(0.9, 0.5, 1.72, glass(), g, 1.6, 1.2, 0);
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(0.15 + Math.sin(u * Math.PI) * 0.75 + (1 - u) * 0.1, u * 2.8 - 1.4)); }
    const drum = grp(g, -0.6, 1.55, 0); drum.rotation.z = Math.PI / 2 - 0.25; const dm = mesh(new THREE.LatheGeometry(pts, 18), C(tambor), drum);
    for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(0.62, 0.05, 4, 18, Math.PI), C('#f4f4f2'), drum, 0, -0.8 + i * 0.5, 0).rotation.y = i;
    const chute = grp(g, -2.1, 1.1, 0); box(0.9, 0.06, 0.35, C('#8f959b', { metalness: 0.4 }), chute, 0.45, 0, 0); chute.rotation.z = -0.5;
    const wheels = rodas(g, [1.6, -0.9, -1.6], [-0.75, 0.75], 0.42, 0.32, K);
    const set = ({ giro = 0, roda = 0, bica = -0.5 } = {}) => { drum.rotation.y = giro; wheels.forEach(w => w.rotation.z = -roda); chute.rotation.z = bica; };
    return { g, drum, chute, set };
  }
  // vibroacabadora (espalha o asfalto)
  function acabadora({ cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = C('#26262a');
    for (const s of [-1, 1]) box(2.4, 0.5, 0.45, K, g, 0, 0, s * 0.9);
    box(2.2, 0.9, 1.9, Y, g, 0, 0.5, 0); const hop = grp(g, 1.3, 0.6, 0); box(0.9, 0.7, 2.4, Y, hop, 0, 0, 0); const mix = box(0.85, 0.3, 2.3, matOf('asfaltoQ'), hop, 0, 0.42, 0);
    const screed = box(0.6, 0.35, 3.0, Y, g, -1.5, 0.05, 0); box(0.3, 0.9, 0.3, K, g, -0.6, 1.4, 0.5); box(0.7, 0.08, 0.9, Y, g, -0.6, 2.3, 0.3);
    return { g, hop, mix, screed };
  }
  // ---------- 4) RUA, CIDADE E OBRA ----------
  function cone({ x = 0, y = 0, z = 0, parent = scene, s = 1 } = {}) { const g = grp(parent, x, y, z); g.scale.setScalar(s);
    box(0.4, 0.04, 0.4, C('#26262a'), g); const c = cyl(0.03, 0.17, 0.62, 14, C('#ff6b1a'), g, 0, 0.04, 0); cyl(0.115, 0.135, 0.12, 14, C('#ffffff'), g, 0, 0.3, 0); return g; }
  function barreira({ comp = 2, x = 0, y = 0, z = 0, ry = 0, parent = scene, cor = '#e8e8e4' } = {}) { const g = grp(parent, x, y, z); g.rotation.y = ry;
    const s = new THREE.Shape([V2s(-0.3, 0), V2s(0.3, 0), V2s(0.12, 0.3), V2s(0.08, 0.8), V2s(-0.08, 0.8), V2s(-0.12, 0.3)]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: comp, bevelEnabled: false }); geo.translate(0, 0, -comp / 2); mesh(geo, C(cor), g).rotation.y = Math.PI / 2; return g; }
  function V2s(x, y) { return new THREE.Vector2(x, y); }
  function placa({ texto = 'OBRA', cor = '#ff9a1f', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); g.rotation.y = ry;
    cyl(0.03, 0.03, 1.4, 8, C('#9aa3ab', { metalness: 0.5 }), g); const t = canvasTex(256, 256, (c, w, h) => { c.fillStyle = cor; c.beginPath(); c.moveTo(w / 2, 6); c.lineTo(w - 6, h / 2); c.lineTo(w / 2, h - 6); c.lineTo(6, h / 2); c.fill();
      c.lineWidth = 10; c.strokeStyle = '#111'; c.stroke(); c.fillStyle = '#111'; c.font = '900 52px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(texto, w / 2, h / 2); });
    mesh(new THREE.PlaneGeometry(0.7, 0.7), M('#fff', { map: t, side: THREE.DoubleSide }), g, 0, 1.6, 0.04); return g; }
  function poste({ h = 4, x = 0, y = 0, z = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); cyl(0.05, 0.08, h, 8, C('#4a5058'), g); box(0.9, 0.06, 0.08, C('#4a5058'), g, 0.4, h - 0.05, 0);
    box(0.4, 0.1, 0.22, C('#fff3c0', { emissive: '#ffe08a', emissiveIntensity: 0.3 }), g, 0.8, h - 0.15, 0); return g; }
  function arvore({ h = 2.2, r = 1, x = 0, y = 0, z = 0, parent = scene, cor = '#4f8a3a' } = {}) { const g = grp(parent, x, y, z); cyl(0.09, 0.14, h, 7, C('#6e4a2f'), g);
    mesh(new THREE.IcosahedronGeometry(r, 0), C(cor, { flatShading: true }), g, 0, h + r * 0.5, 0); mesh(new THREE.IcosahedronGeometry(r * 0.7, 0), C('#3f7a30', { flatShading: true }), g, r * 0.5, h + r * 0.1, 0.2); return g; }
  function casa({ w = 3, h = 2.4, d = 3, parede = '#efe6d8', telhado = '#c0563a', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; box(w, h, d, C(parede), g);
    const roof = new THREE.CylinderGeometry(0.01, w * 0.8, h * 0.55, 4, 1); roof.rotateY(Math.PI / 4); roof.scale(1, 1, d / w); mesh(roof, C(telhado, { flatShading: true }), g, 0, h + h * 0.27, 0);
    box(0.7, 1.3, 0.05, C('#6c4a33'), g, 0, 0, d / 2 + 0.01); for (const s of [-1, 1]) box(0.6, 0.6, 0.05, C('#4d5c66'), g, s * w * 0.3, h * 0.5, d / 2 + 0.01); return g; }
  function carro({ cor = '#3a7bd5', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); g.rotation.y = ry; const K = C('#222');
    box(3.6, 0.55, 1.6, C(cor), g, 0, 0.3, 0); box(1.9, 0.55, 1.45, C(cor), g, -0.2, 0.85, 0); box(1.95, 0.4, 1.47, glass(), g, -0.2, 0.9, 0);
    const wheels = rodas(g, [1.15, -1.15], [-0.78, 0.78], 0.34, 0.25, K); return { g, wheels, set: ({ roda = 0 } = {}) => wheels.forEach(w => w.rotation.z = -roda) }; }
  // ---------- 5) GENTE ----------
  const CAMISAS = ['#ff7a1a', '#2f7fd6', '#2aa35a', '#d63b3b', '#f2c21b', '#7a4fd6'];
  function operario(i = 0, o = {}) { return person({ shirt: CAMISAS[i % CAMISAS.length], helmet: ['#f5f5f2', '#f2c21b', '#ff7a1a'][i % 3], ...o }); }
  // ---------- 6) EFEITOS ----------
  const puffTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  // poeira/fumaça/vapor: n sprites que sobem e somem. update(u) com u 0..1 (use r(t,t0,t1))
  function nuvem({ n = 14, cor = '#c9b49a', x = 0, y = 0, z = 0, raio = 1, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const sp = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: cor, transparent: true, depthWrite: false, opacity: 0 }));
      s.userData = { a: rnd() * 7, d: 0.3 + rnd() * 0.7, h: 0.5 + rnd() * 1.2 }; g.add(s); sp.push(s); }
    const update = u => { g.visible = u > 0 && u < 1; sp.forEach(s => { const d = s.userData; const k = cl(u * 1.2 - d.d * 0.2);
      s.position.set(Math.cos(d.a) * raio * d.d * (0.3 + k), d.h * k, Math.sin(d.a) * raio * d.d * (0.3 + k)); s.scale.setScalar(0.4 + k * 1.4 * raio); s.material.opacity = 0.75 * Math.sin(Math.PI * cl(k)); }); };
    update(0); return { g, update };
  }
  // seta 3D (fluxo de água, carga, empuxo). comprimento L ao longo de +x; gire com ry/rz
  function seta({ L = 1.2, cor = '#2f8cff', x = 0, y = 0, z = 0, ry = 0, rz = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); g.rotation.set(0, ry, rz); const m = C(cor, { emissive: cor, emissiveIntensity: 0.35 });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, L * 0.7, 10).rotateZ(-Math.PI / 2), m, g, L * 0.35, 0, 0); mesh(new THREE.ConeGeometry(0.16, L * 0.3, 14).rotateZ(-Math.PI / 2), m, g, L * 0.85, 0, 0); return g; }
  // ---------- 8) PEÇAS EXTRAS (estrada, ponte, água/esgoto, casa) ----------
  const Ycor = '#f2b51b', KK = () => C('#26262a');
  function motoniveladora({ cor = Ycor, x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), S = C('#8f959b', { metalness: 0.5, roughness: 0.4 });
    box(1.6, 0.9, 1.5, Y, g, -1.4, 0.45, 0); box(0.9, 1.0, 1.1, Y, g, -1.0, 1.35, 0); box(0.85, 0.75, 1.12, glass(), g, -1.0, 1.5, 0);
    box(3.2, 0.25, 0.35, Y, g, 0.9, 0.95, 0); const blade = grp(g, 0.4, 0.25, 0); box(0.12, 0.45, 2.4, S, blade, 0, 0, 0); blade.rotation.y = 0.5;
    const wheels = rodas(g, [2.3, -1.0, -1.9], [-0.8, 0.8], 0.45, 0.35, KK());
    return { g, blade, wheels, set: ({ roda = 0, lamina = 0.5 } = {}) => { wheels.forEach(w => w.rotation.z = -roda); blade.rotation.y = lamina; } };
  }
  function fresadora({ cor = '#e8e8e4', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Wt = C(cor), K = KK();
    for (const s of [-1, 1]) for (const xx of [-1.2, 1.2]) box(0.8, 0.5, 0.45, K, g, xx, 0, s * 0.85);
    box(3.6, 0.9, 1.9, Wt, g, 0, 0.5, 0); const drum = grp(g, 0, 0.35, 0); mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16).rotateX(Math.PI / 2), C('#555'), drum);
    const belt = grp(g, 1.8, 1.0, 0); box(3.4, 0.12, 0.5, K, belt, 1.7, 0, 0); belt.rotation.z = 0.35;
    box(0.9, 0.9, 0.9, Wt, g, -0.8, 1.4, 0.3); box(0.06, 0.8, 0.06, K, g, -1.2, 1.4, 0.7);
    return { g, drum, belt, set: ({ giro = 0 } = {}) => { drum.rotation.z = -giro; } };
  }
  function caminhaoPipa({ cor = '#2f7fd6', tanque = '#e8e8e4', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const K = KK();
    box(4.2, 0.25, 1.3, K, g, 0, 0.45, 0); box(1.2, 1.3, 1.7, C(cor), g, 1.55, 0.6, 0); box(0.9, 0.5, 1.72, glass(), g, 1.5, 1.2, 0);
    mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.9, 20).rotateZ(Math.PI / 2), C(tanque, { metalness: 0.3, roughness: 0.4 }), g, -0.55, 1.45, 0);
    box(0.12, 0.08, 1.6, C('#7d8288'), g, -2.1, 0.55, 0); const jato = nuvem({ n: 12, cor: '#9fd0ff', x: -2.2, y: 0.4, z: 0, raio: 0.7, parent: g });
    const wheels = rodas(g, [1.5, -0.9, -1.6], [-0.75, 0.75], 0.42, 0.32, K);
    return { g, jato, wheels, set: ({ roda = 0, agua = 0 } = {}) => { wheels.forEach(w => w.rotation.z = -roda); jato.update(agua); } };
  }
  // meio-fio + sarjeta ao longo de x (comprimento comp); topo da rua em y
  function meioFio({ comp = 10, x = 0, y = 0, z = 0, lado = 1, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const c = matOf('concreto');
    box(comp, 0.04, 0.4, c, g, 0, -0.02, 0); box(comp, 0.17, 0.15, c, g, 0, 0, lado * 0.27); box(comp, 0.15, 1.6, matOf('concreto', { color: '#d9d4ca' }), g, 0, 0.02, lado * (0.27 + 0.88));
    for (let i = -comp / 2; i < comp / 2; i += 1) box(0.01, 0.18, 0.16, C('#8e8a84'), g, i, 0, lado * 0.27);
    return g;
  }
  // faixa pintada (contínua ou tracejada) + tachões, ao longo de x
  function faixa({ comp = 10, cor = '#ffffff', tracejada = true, tachao = true, x = 0, y = 0.006, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const m = C(cor, { roughness: 0.6 }), L = tracejada ? 1.0 : comp;
    for (let i = -comp / 2; i < comp / 2 - 1e-6; i += tracejada ? 2 : comp) mesh(new THREE.PlaneGeometry(Math.min(L, comp / 2 - i), 0.12).rotateX(-Math.PI / 2), m, g, i + Math.min(L, comp / 2 - i) / 2, 0, 0, false);
    if (tachao) for (let i = -comp / 2 + 1.5; i < comp / 2; i += 2) box(0.12, 0.03, 0.1, C('#f2c21b', { emissive: '#f2c21b', emissiveIntensity: 0.4 }), g, i, 0, 0.12);
    return g;
  }
  const viga = ({ comp = 6, h = 0.6, b = 0.3, eixo = 'x', x = 0, y = 0, z = 0, parent = scene } = {}) => { const m = eixo === 'x' ? box(comp, h, b, matOf('concreto'), parent, x, y, z) : box(b, h, comp, matOf('concreto'), parent, x, y, z); return m; };
  const pilar = ({ h = 6, a = 0.6, redondo = false, x = 0, y = 0, z = 0, parent = scene } = {}) => redondo ? cyl(a / 2, a / 2, h, 18, matOf('concreto'), parent, x, y, z) : box(a, h, a, matOf('concreto'), parent, x, y, z);
  function guardaCorpo({ comp = 6, h = 0.9, eixo = 'x', cor = '#9aa3ab', x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); if (eixo === 'z') g.rotation.y = Math.PI / 2; const m = C(cor, { metalness: 0.5, roughness: 0.4 });
    for (let i = -comp / 2; i <= comp / 2 + 1e-6; i += 1.5) box(0.08, h, 0.08, m, g, i, 0, 0);
    for (const yy of [h * 0.5, h - 0.04]) box(comp, 0.06, 0.06, m, g, 0, yy, 0); return g;
  }
  function guindaste({ alt = 7, lanca = 6, cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = KK();
    box(3, 0.5, 2, K, g, 0, 0, 0); box(2.2, 0.8, 1.6, Y, g, 0, 0.5, 0);
    const torre = grp(g, 0, 1.3, 0); for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [0.2, 0.2], [-0.2, 0.2]]) box(0.06, alt, 0.06, Y, torre, a, 0, b);
    for (let yy = 0.4; yy < alt; yy += 0.6) { box(0.46, 0.04, 0.04, Y, torre, 0, yy, 0.2); box(0.46, 0.04, 0.04, Y, torre, 0, yy, -0.2); }
    const jib = grp(torre, 0, alt, 0); box(lanca, 0.3, 0.3, Y, jib, lanca / 2 - 0.5, 0, 0); box(1.4, 0.5, 0.5, C('#555'), jib, -1.0, -0.1, 0);
    const cabo = grp(jib, lanca - 1, 0, 0); const fio = box(0.02, 1, 0.02, K, cabo, 0, -1, 0); const gancho = box(0.25, 0.25, 0.25, C('#d62a2a'), cabo, 0, -1.2, 0);
    const set = ({ giro = 0, desce = 2 } = {}) => { jib.rotation.y = giro; fio.scale.y = desce; fio.position.y = -desce; gancho.position.y = -desce - 0.25; };
    set(); return { g, jib, cabo, gancho, set };
  }
  // galeria (aduela) de concreto: caixa oca ao longo de x
  function galeria({ comp = 4, w = 1.6, h = 1.4, t = 0.15, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), c = matOf('concreto');
    box(comp, t, w, c, g, 0, 0, 0); box(comp, t, w, c, g, 0, h - t, 0); box(comp, h, t, c, g, 0, 0, w / 2 - t / 2); box(comp, h, t, c, g, 0, 0, -w / 2 + t / 2);
    for (let i = -comp / 2 + 1; i < comp / 2; i += 1) box(0.02, h + 0.01, w + 0.01, C('#9e9a92'), g, i, 0, 0);
    return g;
  }
  function bocaDeLobo({ x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const c = matOf('concreto');
    box(1.2, 0.9, 0.9, c, g, 0, -0.9, 0); box(1.0, 0.75, 0.7, C('#2a2a2a'), g, 0, -0.8, 0);
    const gr = grp(g, 0, 0.001, 0); for (let i = -0.45; i <= 0.46; i += 0.15) box(0.05, 0.03, 0.75, C('#3a3f45', { metalness: 0.5 }), gr, i, 0, 0);
    box(1.2, 0.18, 0.12, c, g, 0, 0, 0.5); return g;
  }
  function pocoDeVisita({ prof = 2.5, r = 0.6, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); mesh(new THREE.CylinderGeometry(r, r, prof, 20, 1, true), matOf('concreto', { side: THREE.DoubleSide }), g, 0, -prof / 2, 0);
    const tampa = cyl(r * 0.75, r * 0.75, 0.05, 20, C('#3a3f45', { metalness: 0.6, roughness: 0.4 }), g, 0, 0, 0);
    for (let yy = -0.4; yy > -prof + 0.2; yy -= 0.35) box(0.4, 0.04, 0.04, C('#9aa3ab', { metalness: 0.5 }), g, 0, yy, -r + 0.05);
    return { g, tampa };
  }
  // sonda de perfuração (poço artesiano): torre + haste que desce
  function sonda({ alt = 5, cor = '#d63b3b', x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), Rr = C(cor), S = C('#8f959b', { metalness: 0.5 });
    box(3.2, 0.5, 1.8, KK(), g, -0.4, 0, 0); box(1.4, 1.0, 1.6, Rr, g, -1.2, 0.5, 0);
    const mast = grp(g, 0.6, 0.5, 0); for (const s of [-0.25, 0.25]) box(0.08, alt, 0.08, Rr, mast, 0, 0, s); for (let yy = 0.5; yy < alt; yy += 0.7) box(0.06, 0.06, 0.5, Rr, mast, 0, yy, 0);
    const cab = box(0.4, 0.4, 0.4, C('#555'), mast, 0, alt - 1, 0); const haste = grp(g, 0.6, 0, 0); const h = cyl(0.06, 0.06, 1, 10, S, haste, 0, 0, 0);
    const set = ({ desce = 0, giro = 0 } = {}) => { h.scale.y = Math.max(0.01, alt - 1 + desce); h.position.y = -desce; haste.rotation.y = giro; cab.position.y = Math.max(0.6, alt - 1 - desce * 0.3); };
    set(); return { g, mast, haste, set };
  }
  // escoramento de laje: pontaletes metálicos sob uma área w x d na altura h
  function escoramento({ w = 3, d = 3, h = 2.6, esp = 0.8, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), m = C('#e07b2a', { metalness: 0.3, roughness: 0.5 });
    for (let i = -w / 2 + 0.2; i <= w / 2 - 0.2 + 1e-6; i += esp) for (let j = -d / 2 + 0.2; j <= d / 2 - 0.2 + 1e-6; j += esp) { cyl(0.03, 0.03, h - 0.1, 8, m, g, i, 0, j); box(0.25, 0.05, 0.25, m, g, i, h - 0.1, j); }
    for (let j = -d / 2 + 0.2; j <= d / 2 - 0.2 + 1e-6; j += esp) box(w, 0.1, 0.08, matOf('madeira'), g, 0, h - 0.05, j);
    return g;
  }
  // parede de blocos cerâmicos furados (vista de frente com furos)
  function blocos({ w = 3, h = 2.4, d = 0.14, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const t = tex('blocoCer', 512, 512, g => { g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, 512, 512); for (let yy = 0; yy < 8; yy++) for (let xx = -1; xx < 4; xx++) {
      const x0 = xx * 128 + (yy % 2) * 64 + 4, y0 = yy * 64 + 4; g.fillStyle = '#c8673f'; g.fillRect(x0, y0, 120, 56); g.fillStyle = '#9a4a2c'; for (let k = 0; k < 3; k++) g.fillRect(x0 + 12 + k * 36, y0 + 16, 24, 24); } });
    return box(w, h, d, M('#ffffff', { map: t }), parent, x, y, z);
  }
  function telhado({ w = 4, d = 4, alt = 1.2, cor = '#c0563a', x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const t = tex('telha', 256, 256, c => { c.fillStyle = cor; c.fillRect(0, 0, 256, 256); for (let yy = 0; yy < 256; yy += 32) { c.fillStyle = '#00000033'; c.fillRect(0, yy + 26, 256, 6);
      for (let xx = 0; xx < 256; xx += 32) { c.fillStyle = '#ffffff22'; c.fillRect(xx + 4, yy, 10, 26); } } });
    const ang = Math.atan2(alt, d / 2), L = Math.hypot(alt, d / 2);
    for (const s of [-1, 1]) { const p = mesh(new THREE.PlaneGeometry(w + 0.3, L + 0.2), M('#ffffff', { map: t, side: THREE.DoubleSide }), g, 0, alt / 2, s * d / 4); p.rotation.x = -Math.PI / 2 + s * ang; }
    const tri = new THREE.Shape([V2s(-d / 2, 0), V2s(d / 2, 0), V2s(0, alt)]); for (const s of [-1, 1]) { const m2 = mesh(new THREE.ShapeGeometry(tri), C('#efe6d8', { side: THREE.DoubleSide }), g, s * w / 2, 0, 0); m2.rotation.y = Math.PI / 2; }
    return g;
  }
  function caixaDagua({ litros = 1000, cor = '#2f6fb2', x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const k = Math.cbrt(litros / 1000);
    cyl(0.6 * k, 0.5 * k, 0.75 * k, 22, C(cor, { roughness: 0.5 }), g); cyl(0.66 * k, 0.66 * k, 0.1 * k, 22, C(cor, { roughness: 0.5 }), g, 0, 0.75 * k, 0);
    return g;
  }
  // ---------- 7) ANIMAÇÃO ----------
  const grow = (o, u, eixo = 'y') => { u = cl(u); o.visible = u > 0.001; o.scale[eixo] = Math.max(0.001, u); return o; };  // peça nasce do chão (origem na base)
  const drop = (o, u, h = 4, y0 = 0) => { o.visible = u > 0; o.position.y = y0 + h * (1 - eo(u)); return o; };          // cai do céu e assenta
  const slide = (o, u, from, to) => { o.position.copy(lv(from, to, sm(u))); return o; };
  const popIn = (o, u) => { const k = back(u); o.visible = u > 0; o.scale.setScalar(Math.max(0.001, k)); return o; };
  return { matOf, SOIL, uvScale, box, cyl, grp, chao, corte, pavimento, vala, ferragem, armadura, forma, concreto, parede, tubo,
    escavadeira, caminhao, rolo, betoneira, acabadora, cone, barreira, placa, poste, arvore, casa, carro, operario, CAMISAS, nuvem, seta, grow, drop, slide, popIn,
    motoniveladora, fresadora, caminhaoPipa, meioFio, faixa, viga, pilar, guardaCorpo, guindaste, galeria, bocaDeLobo, pocoDeVisita, sonda, escoramento, blocos, telhado, caixaDagua };
})();
// ================= PONTE ESTAIADA: cenário (montado com o KIT) =================
// Ponte ao longo de x. Corte na frente (z = FZ). Rio de x = RX0 a RX1. Mastro na margem esquerda (x = 0). 1 unidade ≈ 10 m.
const FZ = 4, RX0 = 1.5, RX1 = 11.5, WL = -0.5, BED = -2.5;   // corte, margens do rio, nível da água, fundo do rio
const DY = 2.5, DT = 0.3, DZ = 1.5, DW = 1.6;                   // pista: topo, espessura, centro em z, largura
const SEG = 1.5, NSEG = 8, MH = 14;                             // aduela, nº de aduelas por lado, altura do mastro
scene.fog = new THREE.Fog('#d9e6ea', 60, 160);
sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26; sun.shadow.camera.far = 80; sun.shadow.camera.updateProjectionMatrix();
// chão (duas margens) + solo em corte + leito do rio
KIT.chao({ x: -99.25, w: 201.5, frente: FZ }); KIT.chao({ x: 111.5, w: 200, frente: FZ });
KIT.corte({ w: 41.5, d: 64, x: -19.25, y: -0.04, z: FZ - 32, camadas: [['terra', 2.5], ['argila', 2], ['rocha', 14]] });
KIT.corte({ w: 38.5, d: 64, x: 30.75, y: -0.04, z: FZ - 32, camadas: [['terra', 2.5], ['argila', 2], ['rocha', 14]] });
KIT.corte({ w: RX1 - RX0, d: 64, x: (RX0 + RX1) / 2, y: BED, z: FZ - 32, camadas: [['areia', 1], ['argila', 1.5], ['rocha', 14]] });
mats.river = M('#3d8fc4', { transparent: true, opacity: 0.6, depthWrite: false, roughness: 0.15, metalness: 0.1 }); // sempre transparent
const water = mesh(new THREE.BoxGeometry(RX1 - RX0 - 0.06, WL - BED - 0.03, 63.9), mats.river, scene, (RX0 + RX1) / 2, (WL + BED) / 2 + 0.015, FZ - 0.02 - 31.95, false);
water.renderOrder = 2;
// entorno (cidade ao fundo)
[[-8, -14, '#d9e6ef'], [-14, -18, '#efe6d8'], [17, -15, '#e3d7c4'], [22, -20, '#d9e6ef'], [-20, -10, '#e3d7c4']].forEach(([x, z, c], i) => KIT.casa({ x, z, w: 3, h: 2.4 + (i % 2), d: 3, parede: c }));
[[-5, -8], [-17, -6], [15, -8], [19, -5], [-10, -22], [25, -12]].forEach(([x, z]) => KIT.arvore({ x, z, r: 1.1 }));
// ---------- fase 0/1: a tábua ----------
const plank = KIT.grp(); const PL0 = 0.3, PL1 = 12.7, PLM = 6.5;
const plankL = KIT.grp(plank, PL0, 0, DZ), plankR = KIT.grp(plank, PL1, 0, DZ);
KIT.box(PLM - PL0, 0.14, 0.7, KIT.matOf('madeira'), plankL, (PLM - PL0) / 2, 0.02, 0);
KIT.box(PL1 - PLM, 0.14, 0.7, KIT.matOf('madeira'), plankR, -(PL1 - PLM) / 2, 0.02, 0);
const splash = KIT.nuvem({ n: 16, cor: '#d8efff', x: PLM, y: WL, z: DZ, raio: 1.2 });
// ---------- fase 2/3: pilares no rio (ponte de viga) ----------
const beamBr = KIT.grp(); const PX = [4.5, 8.5];
const piles = KIT.grp(); const pillars = KIT.grp(beamBr);
for (const x of PX) { KIT.box(1.6, 0.4, 3.7, KIT.matOf('concreto'), piles, x, BED, FZ + 0.06 - 1.85);           // bloco sobre as estacas
  for (const dx of [-0.5, 0.5]) { const p = KIT.cyl(0.22, 0.22, 3.5, 12, KIT.matOf('concreto'), piles, x + dx, BED - 3.5, FZ - 0.12); p.castShadow = false; } // estacas cortadas na frente
  KIT.pilar({ h: DY - DT - BED, a: 0.8, redondo: true, x, y: BED + 0.4, z: DZ, parent: pillars }); }
const beamDeck = KIT.box(PL1 - PL0, DT, DW, KIT.matOf('concreto'), beamBr, (PL0 + PL1) / 2, DY - DT, DZ);
// barco
const boat = KIT.grp();
{ KIT.box(3.6, 1.0, 6.0, KIT.matOf('concreto', { color: '#c94a3a' }), boat, 0, -0.6, 0); KIT.box(3.6, 0.15, 6.0, M('#2a2f36'), boat, 0, 0.4, 0);
  KIT.box(2.4, 1.4, 1.4, M('#f4f4f2'), boat, 0, 0.55, 2.0); KIT.box(2.42, 0.4, 1.42, M('#4d5c66'), boat, 0, 1.3, 2.0);
  ['#2f7fd6', '#f2b51b', '#2aa35a', '#e8532b'].forEach((c, i) => KIT.box(1.5, 0.9, 1.6, M(c), boat, i % 2 ? 0.8 : -0.8, 0.55, -1.8 + (i > 1 ? 1.7 : 0))); }
// ---------- a ponte estaiada (grupo que gira na piada: pivô na base do mastro) ----------
const bridge = KIT.grp();
const tower = KIT.grp(bridge);
{ const c = KIT.matOf('concreto');
  KIT.box(0.9, MH, 0.9, c, tower, 0, 0, DZ);                               // mastro único (a pista passa por ele)
  KIT.box(0.9, 0.3, 0.9, M('#9aa3ab'), tower, 0, MH, DZ);                    // topo
  KIT.box(2.2, 0.6, 4.4, c, tower, 0, -0.62, DZ);                            // bloco de fundação
  for (const dx of [-0.6, 0.6]) KIT.cyl(0.22, 0.22, 4, 12, c, tower, dx, -4.6, FZ - 0.12).castShadow = false; }
// pista: aduelas (0 = dentro do mastro; ±k = k-ésima de cada lado)
mats.deckTop = M('#3a3a3e', { roughness: 0.7 });
const segs = {};
for (let k = -NSEG; k <= NSEG; k++) { const g = KIT.grp(bridge, k * SEG, DY - DT, DZ); KIT.box(SEG - 0.03, DT, DW, KIT.matOf('concreto'), g, 0, 0, 0); KIT.box(SEG - 0.03, 0.03, DW - 0.3, mats.deckTop, g, 0, DT, 0, false);
  KIT.guardaCorpo({ comp: SEG - 0.05, h: 0.35, x: 0, y: DT, z: DW / 2 - 0.08, parent: g }); KIT.guardaCorpo({ comp: SEG - 0.05, h: 0.35, x: 0, y: DT, z: -DW / 2 + 0.08, parent: g }); segs[k] = g; }
const abut = [-1, 1].map(s => KIT.pilar({ h: DY - DT, a: 0.7, x: s * 12.3, z: DZ, parent: bridge }));
// estais (um por aduela, do mastro até a ponta da aduela)
mats.stay = M('#ffd23a', { roughness: 0.4, metalness: 0.2, emissive: '#7a5a00', emissiveIntensity: 0.25 });
const stays = {};
const anchorT = k => V(0, 6.6 + Math.abs(k) * 0.88, DZ), anchorD = k => V(k * SEG + Math.sign(k) * 0.4, DY + 0.02, DZ);
for (let k = -NSEG; k <= NSEG; k++) if (k) { const m = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), mats.stay, bridge, 0, 0, 0, false); stays[k] = m; }
function setStay(k, u) { const m = stays[k]; u = cl(u); m.visible = u > 0.01; if (!m.visible) return; const a = anchorT(k), b = lv(anchorT(k), anchorD(k), u);
  m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, a.distanceTo(b), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); }
// treliça de avanço (carrinho amarelo na ponta da pista)
function traveler() { const g = KIT.grp(bridge); const Y = M('#f2b51b'), K = M('#26262a');
  for (const z of [-0.6, 0.6]) { KIT.box(1.9, 0.12, 0.12, Y, g, 0.3, 1.2, z); for (const x of [-0.5, 1.1]) KIT.box(0.1, 1.2, 0.1, Y, g, x, 0, z); }
  KIT.box(0.12, 0.12, 1.3, Y, g, 1.2, 1.2, 0); KIT.box(0.12, 0.12, 1.3, Y, g, -0.55, 1.2, 0); KIT.box(1.0, 0.06, DW + 0.2, K, g, 0.9, -0.36, 0); return g; }
const travR = traveler(), travL = traveler(); travL.rotation.y = Math.PI;
// operário na ponta (susto da piada)
const worker = KIT.operario(0); bridge.add(worker.g);
const worker2 = KIT.operario(3);
// fôrma "pista inteira no ar" (fantasma vermelho)
mats.ghost = M('#ff5a4a', { transparent: true, opacity: 0, depthWrite: false });
const ghost = mesh(new THREE.BoxGeometry(2 * NSEG * SEG + 0.5, DT, DW), mats.ghost, bridge, 0, DY - DT / 2, DZ, false);
// guindaste ajudando no mastro
const crane = KIT.guindaste({ alt: 9, lanca: 6, x: -4.5, z: -4.5 });
// prédio de 40 andares para comparar (aparece no número)
const tall = KIT.grp(); { const b = KIT.box(3, 12, 3, M('#aebfcf'), tall, 0, 0, 0); for (let y = 0.3; y < 12; y += 0.3 * 2) KIT.box(3.04, 0.08, 3.04, M('#6f8293'), tall, 0, y, 0, false); }
tall.position.set(-6.5, 0, -6);
// carros para a ponte pronta
const cars = ['#d63b3b', '#2f6fb3', '#f2c21b', '#f4f4f2'].map(c => { const o = KIT.carro({ cor: c }); o.g.scale.setScalar(0.32); bridge.add(o.g); return o; });
// setas
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.18, 0.36, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.18 / len; }
const upArrows = []; for (let i = 0; i < 8; i++) upArrows.push(arrow('#ff9a1f'));
const dnArrows = []; for (let i = 0; i < 4; i++) dnArrows.push(arrow('#ff3a2a'));
const dust = KIT.nuvem({ n: 14, cor: '#d9cbb5', x: 0, y: BED, z: DZ, raio: 1.0 });
// ================= PONTE ESTAIADA: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const NP = TM.phrases.length;
const shotOf = t => { if (t < S(0) - 0.1) return -1; let k = 0; for (let i = 1; i < NP; i++) if (t >= S(i) - 0.1) k = i; return k; };
const TS = i => S(i) - 0.1;
function V2(x, y) { return { x, y }; }
const xB = (t, a, b) => back(r(t, a, a + b));
// pista: R aduelas à direita e L à esquerda (fracionário = aduela nascendo)
function setDeck(R, L, withStays = true) {
  segs[0].visible = R > 0 || L > 0;
  for (let k = 1; k <= NSEG; k++) for (const s of [1, -1]) { const n = s > 0 ? R : L; const u = cl(n - (k - 1)); const g = segs[s * k];
    g.visible = u > 0.01; g.scale.set(Math.max(0.01, u), 1, 1); g.position.set(s * (k * SEG - (1 - u) * SEG / 2), DY - DT, DZ); g.rotation.set(0, 0, 0);
    setStay(s * k, withStays ? r(u, 0.45, 1) : 0); }
  const tipR = R > 0 ? Math.min(R, NSEG) * SEG + SEG / 2 : 0, tipL = L > 0 ? Math.min(L, NSEG) * SEG + SEG / 2 : 0;
  return { tipR, tipL };
}
function base() {
  plank.visible = false; splash.update(0); piles.visible = false; beamBr.visible = false; boat.visible = false;
  bridge.rotation.set(0, 0, 0); tower.visible = true; tower.scale.set(1, 1, 1); abut.forEach(a => { a.visible = true; a.scale.set(1, 1, 1); });
  travR.visible = travL.visible = false; worker.g.visible = false; worker2.g.visible = false; mats.ghost.opacity = 0; ghost.visible = false;
  tall.visible = false; tall.scale.set(1, 1, 1); cars.forEach(c => c.g.visible = false); [...upArrows, ...dnArrows].forEach(a => a.visible = false); dust.update(0);
  crane.g.visible = true; crane.set({ giro: 0.3, desce: 3 });
  setDeck(NSEG, NSEG);
}
function driveCars(t) { cars.forEach((c, i) => { const dir = i % 2 ? -1 : 1; const x = dir * (((t * 3.2 + i * 6.5) % 26) - 13); c.g.visible = true; c.g.position.set(x, DY + 0.03, DZ + (dir > 0 ? 0.35 : -0.35)); c.g.rotation.set(0, dir > 0 ? 0 : Math.PI, 0); c.set({ roda: t * 6 }); }); }
function world(t) {
  const sh = shotOf(t); const st = { cam: null, blur: 0, red: 0, dark: 0, flash: 0, vig: 0.3, shake: 0, html: '' };
  base(); let K;
  const early = sh >= 0 && sh <= 3;           // antes do mastro
  if (early) { tower.visible = false; setDeck(0, 0); abut.forEach(a => a.visible = false); crane.g.visible = false; }
  if (sh === -1) { // ABERTURA: ponte pronta, giro rápido + selo
    driveCars(t + 3); const u = r(t, 0, S(0) - 0.1); const a = lerp(-0.75, 0.15, eo(u));
    K = [0, V(3 + Math.sin(a) * 30, 9 - u * 2, 1.5 + Math.cos(a) * 30), V(3, 5.2, 0), 42];
    st.html += selo(t);
  } else if (sh === 0) { // tábua
    plank.visible = true; KIT.drop(plank, r(t, TS(0) + 0.1, wt(0, 'tábua') + 0.3), 3);
    worker2.g.visible = true; worker2.g.position.set(-0.6, 0, DZ + 1.2); worker2.g.rotation.set(0, 0.6, 0); pose(worker2, { armL: [-0.4, 0.3], armR: [-0.4, -0.3] }); idle(worker2, t);
    K = camKeys([[TS(0), V(6.5, 4.0, 31), V(6.5, -0.8, 0), 42], [S(1) - 0.2, V(6.0, 3.0, 27), V(6.5, -0.8, 0), 42]], t);
    st.html += pill(t, wt(0, 'ponte') - 0.1, 'PONTE?', V2(540, 420), '', V(6.5, 0.2, DZ));
  } else if (sh === 1) { // quebra no meio
    plank.visible = true; splash.g.position.set(PLM, WL, DZ); const tq = wt(1, 'quebra') - 0.1; const a = 0.32 * ei(r(t, tq, tq + 0.35));
    plankL.rotation.z = -a; plankR.rotation.z = a;
    splash.update(r(t, tq + 0.3, tq + 1.4)); if (t > tq) st.shake = 0.5 * (1 - r(t, tq + 0.3, tq + 0.8));
    worker2.g.visible = true; worker2.g.position.set(-0.6, 0, DZ + 1.2); worker2.g.rotation.set(0, 0.6, 0); pose(worker2, t > tq ? { armL: [-2.6, 0.5], armR: [-2.6, -0.5], eyes: 1.6 } : {});
    for (let i = 0; i < 3; i++) placeArrow(dnArrows[i], V(5.6 + i * 0.9, 3.0, DZ), V(0, -1, 0), 1.1 * eo(r(t, S(1) + 0.3 + i * 0.08, S(1) + 0.8)) + 0.01, t < tq + 0.2);
    K = camKeys([[TS(1), V(6.0, 3.0, 27), V(6.5, -0.8, 0), 42], [S(2) - 0.2, V(6.8, 1.8, 23), V(6.5, -1.0, 0), 42]], t);
    st.html += pill(t, wt(1, 'largo') - 0.05, 'RIO LARGO', V2(300, 420), '', V(3, WL, DZ), tq - 0.1);
    st.html += pill(t, tq + 0.1, 'QUEBROU!', V2(760, 400), 'red', V(PLM, -0.2, DZ));
  } else if (sh === 2) { // estacas + pilares
    const te = wt(2, 'estacas') - 0.3, tp = wt(2, 'pilares') - 0.3;
    piles.visible = true; KIT.drop(piles, r(t, te, te + 0.5), 5); dust.g.position.set(6.5, BED, DZ); dust.update(r(t, te + 0.4, te + 1.6));
    if (t > te + 0.4) st.shake = 0.4 * (1 - r(t, te + 0.45, te + 0.9));
    beamBr.visible = t > tp; pillars.children.forEach(p => KIT.grow(p, r(t, tp, tp + 0.7))); beamDeck.visible = t > tp + 0.6; KIT.drop(beamDeck, r(t, tp + 0.6, tp + 1.0), 2, DY - DT);
    crane.set({ giro: lerp(0.3, -0.05, sm(r(t, TS(2), te))), desce: lerp(2, 6, r(t, TS(2), te + 0.5)) });
    K = camKeys([[TS(2), V(6.5, 0.0, 27), V(6.5, -2.8, 0), 42], [S(3) - 0.2, V(5.5, 1.0, 26), V(6.5, -1.8, 0), 42]], t);
    st.html += pill(t, te + 0.25, 'ESTACAS', V2(300, 1060), 'orange', V(4.0, BED - 1.8, FZ + 0.1));
    st.html += pill(t, tp + 0.25, 'PILARES', V2(800, 430), 'orange', V(8.5, 0.6, DZ));
  } else if (sh === 3) { // barco não passa
    piles.visible = true; beamBr.visible = true; boat.visible = true;
    const tb = wt(3, 'passa') - 0.15; const zb = t < tb ? lerp(-26, -1.9, eo(r(t, TS(3) - 0.6, tb))) : -1.9 - 0.35 * Math.sin(Math.PI * r(t, tb, tb + 0.4));
    boat.position.set(6.5, WL, zb); boat.rotation.set(t > tb ? -0.05 * (1 - r(t, tb, tb + 0.6)) : 0, 0, 0);
    if (t > tb) st.shake = 0.6 * (1 - r(t, tb + 0.1, tb + 0.6));
    K = camKeys([[TS(3), V(-4, 6, 20), V(6.5, 0.3, -4), 42], [S(4) - 0.2, V(-3, 4.5, 17), V(6.5, 0.6, -2), 42]], t);
    st.html += xmark(t, tb, V(8.5, 1.0, DZ));
    st.html += pill(t, tb + 0.05, 'NÃO PASSA!', V2(540, 400), 'red');
  } else if (sh === 4) { // tira o pilar, ergue a torre
    const tt = wt(4, 'ergue') - 0.2;
    boat.visible = t < TS(4) + 1.2; boat.position.set(6.5, WL, lerp(-1.9, 12, r(t, TS(4) + 0.2, TS(4) + 1.4)));
    beamBr.visible = t < TS(4) + 0.35; piles.visible = false;
    tower.visible = true; KIT.grow(tower, sm(r(t, tt, E(4) + 0.1)));
    crane.set({ giro: 0.9 + Math.sin(t * 1.2) * 0.2, desce: 2 }); dust.g.position.set(0, 0, DZ + 1.5); dust.update(r(t, tt, tt + 1.5));
    setDeck(0, 0); abut.forEach(a => a.visible = false);
    const h = 14 * sm(r(t, tt, E(4) + 0.1));
    K = camKeys([[TS(4), V(6, 4, 22), V(1, 1.5, 0), 42], [tt + 0.2, V(5, 4, 24), V(0.5, 2.5, 0), 42], [S(5) - 0.2, V(4, 6, 29), V(0, 6.5, 0), 42]], t);
    st.html += pill(t, wt(4, 'torre') - 0.05, 'TORRE GIGANTE', V2(760, 380), 'orange', V(0, Math.max(1, h - 1), DZ));
  } else if (sh === 5) { // isso é o mastro
    setDeck(0, 0); abut.forEach(a => a.visible = false);
    K = camKeys([[TS(5), V(7, 1.5, 21), V(0, 6.8, 0), 46], [S(6) - 0.2, V(5.5, 1.3, 19), V(0, 7.0, 0), 46]], t);
    st.html += pill(t, S(5) + 0.15, 'MASTRO', V2(760, 420), 'green', V(0.3, 11, DZ));
  } else if (sh === 6) { // pista sem apoio: aduela cai
    abut.forEach(a => a.visible = false); setDeck(1, 0, false);
    const tf = wt(6, 'apoio') - 0.1; const g = segs[1]; const a = 0.9 * ei(r(t, tf, tf + 0.4)); const dy = 3.2 * ei(r(t, tf + 0.15, tf + 0.6));
    g.position.y = DY - DT - dy; g.rotation.z = -a; g.visible = dy < 3.1;
    splash.g.position.set(1.8, WL, DZ); splash.update(r(t, tf + 0.55, tf + 1.5));
    for (let i = 0; i < 3; i++) placeArrow(dnArrows[i], V(1.2 + i * 0.6, 4.6, DZ), V(0, -1, 0), 1.2 * eo(r(t, S(6) + i * 0.06, S(6) + 0.5)) + 0.01);
    K = camKeys([[TS(6), V(7, 4.0, 15), V(2.2, 1.8, 0), 42], [S(7) - 0.2, V(6.5, 3.5, 14), V(2.2, 1.6, 0), 42]], t);
    st.html += pill(t, wt(6, 'apoio') - 0.05, 'SEM APOIO!', V2(760, 420), 'red', V(1.5, DY - 0.5, DZ));
  } else if (sh === 7) { // pendura com cabos: estai
    abut.forEach(a => a.visible = false); const tc = wt(7, 'cabos') - 0.3;
    const R = 3 * eo(r(t, TS(7), tc)); setDeck(R, 0, false); for (let k = 1; k <= 3; k++) setStay(k, r(t, tc + (k - 1) * 0.15, tc + 0.5 + (k - 1) * 0.15));
    K = camKeys([[TS(7), V(8, 5.5, 18), V(2.6, 5.2, 0), 42], [S(8) - 0.2, V(7, 5.0, 16.5), V(2.6, 5.4, 0), 42]], t);
    st.html += pill(t, tc + 0.15, 'CABOS DE AÇO', V2(780, 330), 'orange', anchorT(2).lerp(anchorD(2), 0.5), wt(7, 'estai') - 0.25);
    st.html += pill(t, wt(7, 'estai') - 0.05, 'ESTAI', V2(780, 340), 'green', anchorT(3).lerp(anchorD(3), 0.55));
  } else if (sh === 8) { // não dá pra concretar tudo no ar
    abut.forEach(a => a.visible = false); setDeck(3, 0);
    ghost.visible = true; mats.ghost.opacity = 0.55 * eo(r(t, S(8) + 0.1, S(8) + 0.5));
    K = camKeys([[TS(8), V(19, 8, 27), V(0, 4.0, 0), 42], [S(9) - 0.2, V(18, 7.5, 25), V(0.5, 4.0, 0), 42]], t);
    st.html += pill(t, S(8) + 0.3, 'TUDO DE UMA VEZ?', V2(540, 360), 'red', V(-6, DY, DZ));
    st.html += xmark(t, wt(8, 'ar') - 0.1, V(6, DY, DZ));
  } else if (sh === 9) { // pedaço por pedaço: aduela
    abut.forEach(a => a.visible = false);
    const R = 3 + 3 * r(t, S(9) + 0.2, wt(9, 'isso') - 0.1); const { tipR } = setDeck(R, 0);
    travR.visible = true; travR.position.set(Math.max(1.4, tipR - 0.6), DY, DZ);
    worker.g.visible = true; worker.g.position.set(tipR - 1.6, DY, DZ + 0.3); worker.g.rotation.set(0, 1.2, 0); pose(worker, { armR: [-0.8, -0.2] }); idle(worker, t);
    const kNew = Math.ceil(R - 0.001);
    K = [0, V(tipR + 1.5, 4.6, 14), V(tipR - 2.2, 3.8, 0), 42];
    st.html += pill(t, wt(9, 'pedaço') - 0.05, 'PEDAÇO POR PEDAÇO', V2(540, 360), 'orange', null, wt(9, 'isso') - 0.2);
    st.html += pill(t, wt(9, 'aduela') - 0.05, 'ADUELA', V2(700, 420), 'green', V(kNew * SEG - 0.3, DY - 0.15, DZ));
  } else if (sh === 10) { // PIADA: só de um lado -> torre tomba
    abut.forEach(a => a.visible = false); const { tipR } = setDeck(6, 0);
    travR.visible = true; travR.position.set(tipR - 0.6, DY, DZ);
    const tt = wt(10, 'tomba') - 0.35; const a = 0.16 * eo(r(t, tt, tt + 0.5)) + 0.01 * Math.sin(t * 9) * r(t, tt + 0.4, tt + 0.6);
    bridge.rotation.z = -a;
    worker.g.visible = true; worker.g.position.set(tipR - 1.8, DY + 0.5 * Math.sin(Math.PI * r(t, tt + 0.1, tt + 0.6)), DZ + 0.3); worker.g.rotation.set(0, 0.6, 0);
    pose(worker, t > tt ? { armL: [-2.8, 0.6], armR: [-2.8, -0.6], eyes: 1.7, legL: 0.5, legR: -0.4 } : {});
    for (let i = 0; i < 2; i++) placeArrow(dnArrows[i], V(5 + i * 2.5, 6.2, DZ), V(0, -1, 0), 1.2 * eo(r(t, wt(10, 'lado') - 0.2, wt(10, 'lado') + 0.3)) + 0.01, t < tt);
    if (t > tt) st.shake = 0.4 * (1 - r(t, tt + 0.3, tt + 0.9));
    K = camKeys([[TS(10), V(5, 7, 30), V(3.5, 5.5, 0), 42], [S(11) - 0.2, V(5.5, 7, 29), V(3.5, 5.5, 0), 42]], t);
    st.html += pill(t, wt(10, 'lado') - 0.05, 'SÓ DE UM LADO', V2(760, 400), 'orange', V(6, DY, DZ), tt);
    if (t > tt + 0.2) st.html += `<div style="position:absolute;left:340px;top:330px;width:400px;text-align:center;font-weight:900;font-size:150px;color:#fff;background:#d32424;border:10px solid #fff;border-radius:30px;transform:rotate(-8deg) scale(${back(r(t, tt + 0.2, tt + 0.5))});box-shadow:0 10px 30px rgba(0,0,0,.4)">NÃO!</div>`;
  } else if (sh === 11) { // balanço sucessivo
    const tb = wt(11, 'isso') - 0.1;
    bridge.rotation.z = -0.16 * (1 - eo(r(t, TS(11), TS(11) + 0.5)));
    const L = 6 * sm(r(t, TS(11) + 0.2, tb)), R = 6 + 1 * sm(r(t, tb, E(11)));
    const { tipR, tipL } = setDeck(R, L + r(t, tb, E(11)));
    abut.forEach(a => a.visible = false);
    travR.visible = travL.visible = true; travR.position.set(tipR - 0.6, DY, DZ); travL.position.set(-tipL + 0.6, DY, DZ);
    K = camKeys([[TS(11), V(17, 8, 28), V(0, 5.2, 0), 42], [S(12) - 0.2, V(15, 8, 29), V(0, 5.4, 0), 42]], t);
    st.html += pill(t, wt(11, 'dois') - 0.05, 'OS DOIS LADOS', V2(540, 360), 'orange', null, tb - 0.15);
    st.html += pill(t, wt(11, 'balanço') - 0.05, 'BALANÇO SUCESSIVO', V2(540, 360), 'green', V(-4, DY + 0.2, DZ));
    st.html += balanca(t, S(11) + 0.4, tb - 0.15);
  } else if (sh === 12) { // 138 m, prédio de 40 andares
    const u = sm(r(t, TS(12), TS(12) + 0.6)); setDeck(7 + u, 7 + u); abut.forEach(a => KIT.grow(a, u));
    tall.visible = true; KIT.grow(tall, sm(r(t, wt(12, 'prédio') - 0.3, wt(12, 'prédio') + 0.4)));
    K = camKeys([[TS(12), V(-10, 6, 32), V(-1.5, 6.5, 0), 42], [S(13) - 0.2, V(-13, 6.5, 33), V(-2.5, 6.6, 0), 42]], t);
    st.html += dim(t, wt(12, '138') - 0.25, V(1.2, 0, FZ - 0.5), V(1.2, MH, FZ - 0.5), '138 m', 1);
    st.html += pill(t, wt(12, 'prédio') + 0.1, '40 ANDARES', V2(330, 380), 'orange', V(-6.5, 10, -4.5));
  } else if (sh === 13) { // pendurada
    const tp = wt(13, 'pendurada') - 0.15;
    K = camKeys([[TS(13), V(10, 4.5, 17), V(5.5, 4.0, 0), 42], [S(14) - 0.2, V(9, 4.0, 15.5), V(5.5, 4.2, 0), 42]], t);
    for (let i = 0; i < 5; i++) { const k = 2 + i; const a = anchorD(k), b = anchorT(k); placeArrow(upArrows[i], a.clone().add(V(0, 0.4, 0.3)), b.clone().sub(a), 1.3 * eo(r(t, tp - 0.3 + i * 0.07, tp + 0.2 + i * 0.07)) + 0.01); }
    st.html += xmark(t, wt(13, 'apoiada') - 0.1, V(6.5, WL + 0.6, DZ), tp - 0.1);
    st.html += pill(t, wt(13, 'apoiada') - 0.05, 'NÃO FICA APOIADA', V2(540, 1060), 'red', null, tp - 0.15);
    st.html += pill(t, tp + 0.05, 'PENDURADA!', V2(540, 360), 'green', anchorT(5).lerp(anchorD(5), 0.6));
  } else { // parabéns + CTA (+ tela final por cima)
    driveCars(t); const u = r(t, TS(14), END);
    K = [0, V(3 + Math.sin(-0.4 + u * 0.8) * 30, 8, 1.5 + Math.cos(-0.4 + u * 0.8) * 30), V(2, 5.0, 0), 42];
    crane.g.visible = false;
    if (sh === 14) { st.html += big(t, wt(14, 'parab') - 0.05, 'PARABÉNS!', 300, '#FFD21F', 120); st.html += big(t, wt(14, 'constr') - 0.05, 'VOCÊ CONSTRUIU UMA<br>PONTE ESTAIADA', 450, '#fff', 74); st.html += confetti(t, wt(14, 'parab')); }
    if (sh >= 15) st.html += ctaCard(t);
  }
  if (!(sh === 4 || sh === 5)) crane.g.visible = false;
  st.cam = K; return st;
}
function selo(t) { const k = back(r(t, 0.05, 0.4)), o = 1 - r(t, S(0) - 0.3, S(0) - 0.05);
  return `<div style="position:absolute;left:0;right:0;top:330px;text-align:center;opacity:${o};transform:scale(${0.5 + 0.5 * k})">
   <div style="display:inline-block;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:92px;letter-spacing:6px;padding:14px 50px;border-radius:70px;box-shadow:0 12px 40px rgba(0,0,0,.45)">DO ZERO</div>
   <div style="font-family:InterD;font-weight:900;font-size:170px;color:#fff;line-height:1.1;text-shadow:0 8px 30px rgba(0,0,0,.6)">#03</div></div>`; }
function balanca(t, t0, t1) { if (t < t0 || t > t1 + 0.2) return ''; const k = pop(t, t0) * (1 - r(t, t1, t1 + 0.2)); const a = 8 * Math.sin(t * 2.2) * (1 - r(t, t0, t1));
  return `<svg style="position:absolute;left:390px;top:450px;transform:scale(${k})" width="300" height="220" viewBox="0 0 300 220"><g transform="rotate(${a} 150 60)"><rect x="20" y="54" width="260" height="12" rx="6" fill="#FFD21F"/>
   <path d="M30 66 L10 130 H70 Z M270 66 L250 130 H310 Z" fill="none" stroke="#FFD21F" stroke-width="6"/><rect x="0" y="128" width="80" height="12" rx="6" fill="#FFD21F"/><rect x="230" y="128" width="80" height="12" rx="6" fill="#FFD21F"/></g>
   <rect x="142" y="60" width="16" height="140" fill="#fff"/><rect x="100" y="196" width="100" height="16" rx="8" fill="#fff"/></svg>`; }
function ctaCard(t) { const t0 = TS(15); if (t < t0 || t > window.F_END / FPS + 0.2) return '';
  const items = [['curte', '#ff4d6d', '<path d="M50 84 L18 52 Q6 38 16 24 Q28 10 44 22 L50 28 L56 22 Q72 10 84 24 Q94 38 82 52 Z" fill="#ff4d6d"/>', 'CURTE'],
    ['salva', '#FFD21F', '<path d="M26 12 H74 V88 L50 70 L26 88 Z" fill="#FFD21F"/>', 'SALVA'],
    ['manda', '#4aa3ff', '<path d="M10 46 L90 12 L62 88 L48 56 Z" fill="#4aa3ff"/>', 'MANDA'],
    ['comenta', '#3dd17a', '<path d="M14 18 H86 V66 H46 L24 86 V66 H14 Z" fill="#3dd17a"/>', 'COMENTA']];
  let h = '<div style="position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;gap:26px">';
  for (const [w, c, svg, lab] of items) { const k = back(r(t, wt(15, w) - 0.15, wt(15, w) + 0.15));
    h += `<div style="width:220px;text-align:center;transform:scale(${k});opacity:${cl(k)}"><div style="width:190px;height:190px;margin:0 auto;border-radius:40px;background:rgba(20,23,29,.92);border:5px solid ${c};display:flex;align-items:center;justify-content:center"><svg width="120" height="120" viewBox="0 0 100 100">${svg}</svg></div><div style="font-weight:900;font-size:40px;color:#fff;margin-top:10px;text-shadow:0 3px 0 #000">${lab}</div></div>`; }
  return h + '</div>'; }
function confetti(t, t0) { if (t < t0) return ''; let h = ''; const cols = ['#FFD21F', '#ff5a5a', '#3dd17a', '#4aa3ff', '#ff9a1f', '#fff'];
  for (let i = 0; i < 70; i++) { const u = t - t0; const x = (i * 157) % 1080 + Math.sin(u * 2 + i) * 30; const y = -40 + u * (260 + (i * 37) % 200) - 60 * ((i * 13) % 5); if (y < -40 || y > 1950) continue;
    h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${12 + i % 3 * 4}px;height:${22 - i % 3 * 4}px;background:${cols[i % 6]};transform:rotate(${u * 300 + i * 40}deg)"></div>`; }
  return h; }
function avatarCorner(f) {
  const out = cl(1 - (f - window.F_END) / 8); if (out <= 0) return ''; const inS = springSim(f - 4, 12, 140); const m = mouthAt(f);
  return `<div style="position:absolute;left:50px;top:1515px;width:270px;height:270px;opacity:${out};transform:translateY(${-m * 5}px) rotate(${Math.sin(f / 23) * 2 + m * 1.5}deg) scale(${inS * (0.9 + 0.1 * out)})">
   <div style="width:270px;height:270px;box-sizing:border-box;border-radius:135px;overflow:hidden;background:#30343A;border:9px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${window.AV.svg(m, window.AV.blinkAt(f), Math.sin(f / 70) * 0.6)}</div></div>`;
}
window.renderFrame = f => {
  const t = f / FPS; const st = world(t); const K = st.cam;
  let p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.12; p.add(V(noise(t * 2.5) * a, noise(t * 2.8, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.05, Math.sin(t * 0.9) * 0.04, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.setViewOffset(W, H, 0, 260, W, H);
  cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(2, 0, 0); sun.position.set(10, 22, 14);   // luz FIXA
  R.render(scene, cam);
  canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`;
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 4.5, dist = 30) => {
  const t = 5; world(-1); base(); setDeck(6, 6); travR.visible = travL.visible = true; travR.position.set(6 * SEG + SEG / 2 - 0.6, DY, DZ); travL.position.set(-(6 * SEG + SEG / 2) + 0.6, DY, DZ);
  abut.forEach(a => a.visible = false); crane.g.visible = true; crane.set({ giro: 0.9, desce: 3 });
  worker.g.visible = true; worker.g.position.set(8, DY, DZ + 0.3); worker.g.rotation.set(0, 0.8, 0); pose(worker, { armR: [-0.8, -0.2] });
  cam.clearViewOffset(); cam.position.set(6, 3.5, dist); cam.fov = 42; cam.up.set(0, 1, 0); cam.lookAt(V(1.5, cy, 0)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(2, 0, 0); sun.position.set(10, 22, 14); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 30%,rgba(14,22,34,0) 46%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:270px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:64px;letter-spacing:6px;padding:14px 40px;border-radius:50px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:250px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:120px;line-height:1">#03</div>
   <div style="position:absolute;left:110px;right:80px;top:420px;font-family:InterD;font-weight:900;font-size:104px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Como se constrói uma <span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">ponte estaiada</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

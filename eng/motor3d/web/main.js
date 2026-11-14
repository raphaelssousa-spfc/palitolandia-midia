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
const WSEG = TM.words.find(w => w.p === LASTP && w.w.toLowerCase() === 'segue'), WATE = TM.words.find(w => w.p === LASTP && w.w === 'Até');
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
// ================= RODOVIA DE CONCRETO: cenário =================
// Estrada corre no eixo x. Corte na frente (z = 0). Faixa A: z de 0 a -3 · faixa B: z de -3 a -6.
const PL = 4, LW = 3, ST = 0.45, NPL = 12, X0 = -24;      // placa: comprimento, largura da faixa, espessura
const SBT = -0.48, SBB = -0.88;                          // sub-base: topo e fundo (3 cm abaixo da placa)
const JX = []; for (let i = 0; i <= NPL; i++) JX.push(X0 + i * PL);  // juntas transversais
mats.slab = M('#d3cec4', { transparent: true, opacity: 1 }); // NUNCA alternar .transparent (pisca)
mats.slabB = M('#d3cec4', { transparent: true, opacity: 1 });
mats.subbase = M('#ffffff', { map: canvasTex(256, 128, (g, w, h) => speckle(g, w, h, '#8f8c88', ['#7d7a76', '#a29f9a', '#6e6b67', '#b5b2ad'], 900, 1.5, 4.5), 8, 1) });
mats.loose = M('#ffffff', { map: canvasTex(256, 128, (g, w, h) => speckle(g, w, h, '#b07a4c', ['#9c6a40', '#c08a5c', '#8a5a34'], 700, 2, 6), 8, 1) });
mats.groove = M('#4a4743'); mats.seal = M('#121214', { roughness: 0.35 }); mats.dowel = M('#d0612c', { roughness: 0.5, metalness: 0.2, emissive: '#5a2008', emissiveIntensity: 0.4 });
mats.tie = M('#2f8fd8', { roughness: 0.5, metalness: 0.2, emissive: '#0a2a48', emissiveIntensity: 0.4 });
mats.paintW = M('#f7f7f2', { roughness: 0.6 }); mats.paintY = M('#f2c21b', { roughness: 0.6 });
// terreno (bloco com face em corte)
strataTex.repeat.set(1 / 4, 1 / 4);
const terrain = mesh(new THREE.BoxGeometry(80, 16, 40), [mats.strata, mats.strata, mats.dirt, mats.dirt, mats.strata, mats.strata], scene, 0, SBB - 8, -20, false);
// acostamento/grama atrás da pista
const shoulder = new THREE.Group(); scene.add(shoulder);
mesh(new THREE.BoxGeometry(80, -SBB - 0.05, 33.6), [mats.strata, mats.strata, M('#86a957'), mats.dirt, mats.strata, mats.strata], shoulder, 0, (SBB - 0.05) / 2, -6.4 - 16.8, false);
mesh(new THREE.BoxGeometry(80, 0.08, 0.4), M('#9a948a'), shoulder, 0, -0.04 - 0.02, -6.2, false);
// camada de terra solta (vira sub-base) — as duas nunca se sobrepõem
// frente recuada 5 cm: a placa que afunda não fica coplanar com a sub-base (z-fighting)
const loose = mesh(new THREE.BoxGeometry(1, SBT - SBB, 6.15), mats.loose, scene, 0, (SBT + SBB) / 2, -3.125, false);
const subbase = mesh(new THREE.BoxGeometry(1, SBT - SBB, 6.15), mats.subbase, scene, 0, (SBT + SBB) / 2, -3.125, false);
const RX0 = -26, RX1 = 26;
function setSub(xs) { // de RX0 até xs = sub-base; de xs até RX1 = terra solta
  xs = cl(xs, RX0, RX1); subbase.visible = xs > RX0 + 0.01; loose.visible = xs < RX1 - 0.01;
  subbase.scale.x = Math.max(0.01, xs - RX0); subbase.position.x = (RX0 + xs) / 2; loose.scale.x = Math.max(0.01, RX1 - xs); loose.position.x = (xs + RX1) / 2; }
// placas
const laneA = new THREE.Group(), laneB = new THREE.Group(); scene.add(laneA, laneB);
const platesA = [], platesB = [];
for (let i = 0; i < NPL; i++) {
  const cx = X0 + i * PL + PL / 2;
  const a = mesh(new THREE.BoxGeometry(PL, ST, LW), mats.slab, laneA, cx, -ST / 2, -LW / 2); a.userData = { cx, i }; platesA.push(a);
  const b = mesh(new THREE.BoxGeometry(PL, ST, LW), mats.slabB, laneB, cx, -ST / 2, -LW * 1.5); b.userData = { cx, i }; platesB.push(b); }
// juntas serradas (linhas escuras em cima) — transversais e a longitudinal
const grooves = new THREE.Group(); scene.add(grooves);
for (const x of JX) { const g = mesh(new THREE.BoxGeometry(0.07, 0.02, 2 * LW), mats.groove, grooves, x, 0.01, -LW, false); g.userData = { x }; }
const grooveL = mesh(new THREE.BoxGeometry(NPL * PL, 0.02, 0.07), mats.groove, grooves, 0, 0.01, -LW, false); grooveL.userData = { x: 999 };
// selante (preto, por cima da junta)
const seals = new THREE.Group(); scene.add(seals);
for (const x of JX) { const g = mesh(new THREE.BoxGeometry(0.12, 0.035, 2 * LW), mats.seal, seals, x, 0.026, -LW, false); g.userData = { x }; }
mesh(new THREE.BoxGeometry(NPL * PL, 0.034, 0.12), mats.seal, seals, 0, 0.025, -LW, false).userData = { x: 999 };
// rachaduras aleatórias (retração)
const cracks = new THREE.Group(); scene.add(cracks);
{ const starts = [[-9.3, -0.4, 1], [-6.1, -1.0, 1], [-2.6, -0.2, 1], [1.4, -0.5, 1], [5.2, -0.3, 1], [8.7, -0.9, 1], [-7.5, -3.4, 1], [-0.9, -3.2, 1], [3.3, -3.6, 1], [7.1, -3.3, 1]];
  starts.forEach(([x, z], k) => { let px = x, pz = z; for (let i = 0; i < 7; i++) { const nx = px + Math.sin(k * 3.1 + i * 2.3) * 0.28, nz = pz - 0.38;
      const len = Math.hypot(nx - px, nz - pz); const m = mesh(new THREE.BoxGeometry(0.05, 0.02, len), mats.black, cracks, (px + nx) / 2, 0.012, (pz + nz) / 2, false); m.rotation.y = Math.atan2(nx - px, nz - pz); m.userData = { i, k }; px = nx; pz = nz; } }); }
// barras de transferência (lisas, ao longo de x, cruzando cada junta transversal)
const dowels = new THREE.Group(); scene.add(dowels);
for (const x of JX) for (let z = -0.35; z > -2 * LW; z -= 0.6) { const d = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8).rotateZ(Math.PI / 2), mats.dowel, dowels, x, -ST / 2, z, false); d.userData = { x }; }
// barras de ligação (ao longo de z, cruzando a junta longitudinal)
const ties = new THREE.Group(); scene.add(ties);
for (let x = X0 + 0.5; x < X0 + NPL * PL; x += 1.0) { const d = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8).rotateX(Math.PI / 2), mats.tie, ties, x, -ST / 2 + 0.04, -LW, false); d.userData = { x }; }
// ranhuras (texturização) — linhas finas ao longo de z
const NGR = 180; const grv = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 2 * LW - 0.3), M('#c2bcb2'), NGR); scene.add(grv); grv.frustumCulled = false; // contraste baixo: linhas finas + câmera andando = efeito estroboscópico
const grvX = [...Array(NGR)].map((_, i) => -13.5 + i * 0.15);
function setGrooves(xMax) { let n = 0; grvX.forEach(x => { if (x < xMax && JX.every(j => Math.abs(x - j) > 0.12)) { dm.makeTranslation(x, 0.006, -LW); grv.setMatrixAt(n++, dm); } }); grv.count = n; grv.instanceMatrix.needsUpdate = true; grv.visible = n > 0; }
// pintura (faixas)
const paint = new THREE.Group(); scene.add(paint);
for (const z of [-0.3, -2 * LW + 0.3]) mesh(new THREE.BoxGeometry(NPL * PL, 0.02, 0.14), mats.paintW, paint, 0, 0.045, z, false).userData = { kind: 'edge' };
for (let x = X0 + 1; x < X0 + NPL * PL; x += 3) mesh(new THREE.BoxGeometry(1.6, 0.02, 0.14), mats.paintY, paint, x + 0.8, 0.045, -LW - 0.18, false).userData = { kind: 'dash', x };
// ---------- veículos e máquinas ----------
function car(color) { const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.BoxGeometry(2.6, 0.45, 1.35), M(color, { roughness: 0.35 }), g, 0, 0.42, 0); mesh(new THREE.BoxGeometry(1.3, 0.38, 1.15), M(color, { roughness: 0.35 }), g, -0.15, 0.82, 0);
  mesh(new THREE.BoxGeometry(1.1, 0.28, 1.17), M('#2c3a46', { roughness: 0.1 }), g, -0.15, 0.84, 0);
  for (const [x, z] of [[0.8, -0.66], [0.8, 0.66], [-0.85, -0.66], [-0.85, 0.66]]) mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14).rotateX(Math.PI / 2), mats.black, g, x, 0.24, z);
  return g; }
function truck(color, drum = false) { const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.BoxGeometry(1.4, 1.4, 1.7), M(color, { roughness: 0.4 }), g, 1.9, 0.95, 0); mesh(new THREE.BoxGeometry(0.1, 0.55, 1.4), M('#2c3a46', { roughness: 0.1 }), g, 2.62, 1.25, 0);
  mesh(new THREE.BoxGeometry(4.0, 0.25, 1.6), mats.black, g, -0.2, 0.42, 0);
  if (drum) { const d = new THREE.Group(); d.position.set(-0.4, 1.35, 0); g.add(d); const c = mesh(new THREE.CylinderGeometry(0.85, 0.6, 2.6, 16, 1).rotateZ(Math.PI / 2 + 0.18), M('#e8e6e0'), d, 0, 0, 0);
    for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(0.78 - k * 0.08, 0.05, 6, 20).rotateY(Math.PI / 2), M('#d63b3b'), d, -0.7 + k * 0.7, 0.12 - k * 0.12, 0); g.userData.drum = d;
    const chute = mesh(new THREE.BoxGeometry(1.2, 0.08, 0.35), M('#9aa3ab'), g, -2.6, 0.75, 0); chute.rotation.z = 0.5; }
  else mesh(new THREE.BoxGeometry(3.2, 1.2, 1.7), M('#c8ced3'), g, -0.5, 1.15, 0);
  for (const x of [1.9, -0.6, -1.6]) for (const z of [-0.8, 0.8]) mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14).rotateX(Math.PI / 2), mats.black, g, x, 0.36, z);
  return g; }
const mixer = truck('#f07c1e', true), lorry = truck('#2f6fb3');
const roller = new THREE.Group(); scene.add(roller);
{ mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.2, 22).rotateX(Math.PI / 2), M('#5d6268', { metalness: 0.3, roughness: 0.5 }), roller, 1.2, 0.7, 0);
  mesh(new THREE.BoxGeometry(2.0, 0.9, 1.8), mats.yellow, roller, -0.4, 1.0, 0); mesh(new THREE.BoxGeometry(1.0, 0.9, 1.2), M('#2c3a46', { roughness: 0.1 }), roller, -0.6, 1.9, 0);
  mesh(new THREE.BoxGeometry(1.2, 0.08, 1.4), mats.yellow, roller, -0.6, 2.38, 0);
  for (const z of [-0.85, 0.85]) mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16).rotateX(Math.PI / 2), mats.black, roller, -1.0, 0.5, z); }
const saw = new THREE.Group(); scene.add(saw);
{ mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), M('#e0a21a'), saw, 0, 0.55, 0.3); mesh(new THREE.BoxGeometry(0.16, 0.16, 1.1), mats.black, saw, 0, 0.35, 0.9);
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 26).rotateX(Math.PI / 2).rotateY(Math.PI / 2), M('#c8ced3', { metalness: 0.6, roughness: 0.3 }), saw, 0, 0.3, -0.25);
  for (const z of [0.0, 0.6]) for (const x of [-0.35, 0.35]) mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10).rotateZ(Math.PI / 2), mats.black, saw, x, 0.12, z);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), mats.black, saw, 0, 0.95, 1.3).rotation.x = -0.6; }
const comb = new THREE.Group(); scene.add(comb); // ponte com pente de aço
{ mesh(new THREE.BoxGeometry(0.25, 0.25, 7.2), mats.yellow, comb, 0, 1.6, -LW); for (const z of [0.5, -6.5]) mesh(new THREE.BoxGeometry(0.25, 1.6, 0.25), mats.yellow, comb, 0, 0.8, z);
  mesh(new THREE.BoxGeometry(0.12, 0.12, 6.0), mats.steel, comb, -0.1, 0.12, -LW); for (let z = -0.1; z > -5.95; z -= 0.12) mesh(new THREE.BoxGeometry(0.02, 0.14, 0.03), mats.steel, comb, -0.1, 0.03, z - LW + 3); }
const hook = new THREE.Group(); scene.add(hook); // cabos do guindaste
{ for (const [x, z] of [[-1.6, -0.3], [1.6, -0.3], [-1.6, -2.7], [1.6, -2.7]]) { const c = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), mats.black, hook, 0, 0, 0, false); c.userData = { x, z }; }
  mesh(new THREE.SphereGeometry(0.16, 12, 10), mats.yellow, hook, 0, 0, 0).userData = { hk: 1 }; }
const carA = car('#d63b3b'), carB = car('#2f6fb3'), carC = car('#f2c21b');
// entorno
function tree2(x, z, s) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8), mats.trunk, g, 0, 0.8, 0); mesh(new THREE.IcosahedronGeometry(1.1, 1), mats.leaf, g, 0, 2.2, 0); mesh(new THREE.IcosahedronGeometry(0.8, 1), mats.leaf2, g, 0.6, 1.9, 0.3); return g; }
[[-9, -10, 1.4], [-3, -14, 1.6], [6, -12, 1.5], [12, -9, 1.3], [-14, -12, 1.5], [17, -14, 1.6]].forEach(a => tree2(...a));
const radarTree = tree2(4.2, -8.0, 1.5);
const radar = new THREE.Group(); scene.add(radar); radar.position.set(6.6, 0, -9.2);
{ mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), M('#8a9097'), radar, 0, 1.3, 0); mesh(new THREE.BoxGeometry(0.7, 0.5, 0.55), M('#3a3f46'), radar, 0, 2.6, 0.15);
  mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 14).rotateX(Math.PI / 2), M('#111', { roughness: 0.1 }), radar, 0, 2.6, 0.45); }
const sign = new THREE.Group(); scene.add(sign); sign.position.set(1.2, 0, -7.0);
{ mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), M('#8a9097'), sign, 0, 1.2, 0);
  const st = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.fillStyle = '#d62a2a'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 92, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = '900 110px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('80', 128, 136); }); st.center.set(0.5, 0.5); st.rotation = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 28).rotateX(Math.PI / 2), [M('#ccc'), M('#ffffff', { map: st }), M('#ccc')], sign, 0, 2.4, 0.04); }
// chuva
const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.35, 0.012), new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.55 }), 500); scene.add(rain); rain.frustumCulled = false;
const rainSeeds = [...Array(500)].map((_, i) => [((i * 97) % 1000) / 1000 * 14 - 7, ((i * 61) % 1000) / 1000, ((i * 31) % 1000) / 1000 * 8 - 7]);
const dm = new THREE.Matrix4();
function setRain(t, on, cx = 0) { rain.visible = on; if (!on) return; rainSeeds.forEach(([x, ph, z], i) => { const y = 7 - ((t * 9 + ph * 9) % 9); dm.makeTranslation(x + cx, y, z + 1.0); rain.setMatrixAt(i, dm); }); rain.instanceMatrix.needsUpdate = true; }
// respingos de lama saindo da junta (bombeamento)
const spray = new THREE.Group(); scene.add(spray); for (let i = 0; i < 16; i++) mesh(new THREE.SphereGeometry(0.07, 8, 6), M('#7a4a29'), spray, 0, 0, 0, false);
function setSpray(t, on, x) { spray.visible = on; if (!on) return; spray.children.forEach((m, i) => { const u = ((t * 1.4 + i / 16) % 1); const z = -0.4 - (i % 8) * 0.65; m.position.set(x + (i % 2 ? 1 : -1) * u * 0.35, u * 0.9 - u * u * 0.9, z); }); }
// poeira da serra
const dust = new THREE.Group(); scene.add(dust); for (let i = 0; i < 12; i++) mesh(new THREE.SphereGeometry(0.08, 8, 6), M('#e6e2da', { transparent: true, opacity: 0.8 }), dust, 0, 0, 0, false);
function setDust(t, on, p) { dust.visible = on; if (!on) return; dust.children.forEach((m, i) => { const u = ((t * 1.2 + i / 12) % 1); m.position.set(p.x + (i % 3 - 1) * 0.25 * u, p.y + u * 0.8, p.z + 0.2 + u * 0.3); m.scale.setScalar(0.6 + u); }); }
// setas
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.13, 0.28, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
const redArrows = []; for (let i = 0; i < 8; i++) redArrows.push(arrow('#ff5a1a'));
const blueArrows = []; for (let i = 0; i < 8; i++) blueArrows.push(arrow('#3d9bff'));
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.14 / len; }
// ================= RODOVIA DE CONCRETO: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const NP = TM.phrases.length;
const shotOf = t => { let k = 0; for (let i = 1; i < NP; i++) if (t >= S(i) - 0.1) k = i; return k; };
const TS = i => S(i) - 0.1;                 // início da tomada i
const SKYC = new THREE.Color('#cfe3ef'), STORM = new THREE.Color('#5a6670');
const SLABC = new THREE.Color('#d3cec4'), WETC = new THREE.Color('#8f979c');
function V2(x, y) { return { x, y }; }
const xB = (t, a, b) => back(r(t, a, a + b));
function rotAbout(m, px, py, ang, cx, cy) { const dx = cx - px, dy = cy - py; m.position.x = px + dx * Math.cos(ang) - dy * Math.sin(ang); m.position.y = py + dx * Math.sin(ang) + dy * Math.cos(ang); m.rotation.set(0, 0, ang); }
function placeCar(c, x, z, ry = 0, y = 0) { c.visible = true; c.position.set(x, y, z); c.rotation.set(0, ry, 0); }
function world(t) {
  const sh = shotOf(t); const st = { cam: null, blur: 0, red: 0, dark: 0, flash: 0, vig: 0.3, shake: 0, html: '' };
  const after = k => t >= TS(k);
  // ---- estado base ----
  [mixer, lorry, roller, saw, comb, hook, carA, carB, carC, sign, radar].forEach(o => o.visible = false);
  setRain(t, false); setSpray(t, false, 0); setDust(t, false, V(0, 0, 0)); [...redArrows, ...blueArrows].forEach(a => a.visible = false);
  scene.background = SKYC; hemi.intensity = 1.25; sun.intensity = 2.4;
  mats.slab.opacity = 1; mats.slabB.opacity = 1; mats.slab.depthWrite = true; mats.slabB.depthWrite = true;
  mats.slab.color.copy(SLABC); mats.slabB.color.copy(SLABC); mats.slab.roughness = 0.82; mats.slabB.roughness = 0.82;
  laneA.visible = laneB.visible = !(sh === 2 || sh === 3);
  laneB.position.set(0, 0, 0);
  for (const p of [...platesA, ...platesB]) { p.position.set(p.userData.cx, -ST / 2, p.parent === laneA ? -LW / 2 : -LW * 1.5); p.rotation.set(0, 0, 0); p.scale.set(1, 1, 1); p.visible = true; }
  setSub(after(2) ? (sh === 2 ? -99 : RX1) : RX0);
  grooves.visible = after(5); grooves.children.forEach(g => { g.scale.set(1, 1, 1); g.position.z = g.userData.x === 999 ? -LW : -LW; });
  cracks.visible = sh === 4; seals.visible = after(14); seals.children.forEach(g => g.scale.set(1, 1, 1));
  dowels.visible = sh === 8 || sh === 9; dowels.children.forEach(d => d.scale.set(1, 1, 1));
  ties.visible = sh === 11 || sh === 12; ties.children.forEach(d => d.scale.set(1, 1, 1));
  setGrooves(after(16) ? (sh === 16 ? -99 : 99) : -99); grv.material.color.set(sh === 16 ? '#8f897f' : '#c2bcb2'); // escuras só na tomada do pente (câmera lenta)
  paint.visible = after(20); paint.children.forEach(m => { m.scale.set(1, 1, 1); });
  sign.visible = after(20) && t > wt(20, 'placas') - 0.15; radar.visible = after(20) && t > wt(20, 'radar') - 0.15;
  let K;
  if (sh === 0) { // concreto direto na terra
    setSub(RX0);
    const xm = lerp(-11, 9, sm(r(t, 0.1, wt(0, 'tem') + 0.4)));
    placeCar(mixer, xm, -LW, 0); mixer.userData.drum.rotation.x = t * 1.2;
    for (const p of [...platesA, ...platesB]) { const x0 = p.userData.cx - PL / 2; const L = cl(xm - 2.6 - x0, 0, PL); p.visible = L > 0.02; p.scale.x = Math.max(0.005, L / PL); p.position.x = x0 + L / 2; } // concreto avança junto com a bica
    // o caminhão anda em cima do que já foi concretado? não: anda no acostamento de trás
    mixer.position.z = -7.6; mixer.position.y = -0.05;
    K = [0, V(xm - 1.5, 5.0, 11.5), V(xm - 1.8, -0.6, -4.2), 42];
    st.html += pill(t, wt(0, 'estrada') - 0.1, 'ESTRADA DE CONCRETO?', V2(540, 380), '', V(0, 0, -1.5));
  } else if (sh === 1) { // caminhão passa, afunda, quebra
    const tb = wt(1, 'afunda') - 0.1, tq = wt(1, 'quebra') - 0.1;
    const xl = lerp(-12, -0.2, eo(r(t, TS(1), tb + 0.2))); placeCar(lorry, xl, -LW / 2, 0);
    const a = 0.07 * eo(r(t, tb, tb + 0.5)) + 0.06 * eo(r(t, tq, tq + 0.3)); const drop = 0.12 * eo(r(t, tb, tb + 0.6));
    for (const P of [platesA, platesB]) { const L = P[5], Rr = P[6];
      rotAbout(L, -4, -drop * 0.3, -a, -2, -ST / 2 - drop * 0.3); rotAbout(Rr, 4, -drop * 0.3, a, 2, -ST / 2 - drop * 0.3); }
    lorry.position.y = -Math.sin(a) * 1.8 - drop * 0.3; lorry.rotation.z = a * 0.4;
    st.shake = 0.7 * r(t, tq, tq + 0.1) * (1 - r(t, tq + 0.4, tq + 0.9));
    if (t > tb) for (let i = 0; i < 4; i++) placeArrow(redArrows[i], V(-1.2 + i * 0.8, 3.6, -1.5), V(0, -1, 0), 0.9 * eo(r(t, tb + i * 0.06, tb + 0.4 + i * 0.06)) + 0.01);
    K = camKeys([[TS(1), V(3.5, 5.8, 13.5), V(0, 0.2, -2), 42], [S(2) - 0.2, V(2.0, 5.0, 12.0), V(0, 0.0, -1.5), 42]], t);
    st.html += pill(t, tq + 0.05, 'QUEBROU!', V2(760, 400), 'red', V(0, -0.1, 0));
  } else if (sh === 2) { // rolo compacta e a sub-base aparece
    const xr = lerp(-9, 9, sm(r(t, TS(2) + 0.2, E(2) + 0.1))); placeCar(roller, xr, -1.6, 0, SBT + 0.02);
    setSub(lerp(-26, 26, 0) * 0 + xr - 1.4); // atrás do rolo = sub-base
    st.shake = 0.12;
    K = camKeys([[TS(2), V(-2.5, 1.6, 8.5), V(-1, -0.6, -1.5), 42], [S(3) - 0.2, V(2.5, 1.2, 8.0), V(1.2, -0.7, -1.5), 42]], t);
    st.html += pill(t, wt(2, 'compacta') - 0.05, 'COMPACTA', V2(300, 420), 'orange', V(xr + 1.2, SBT + 0.4, -0.4));
    st.html += pill(t, wt(2, 'camada') - 0.05, 'CAMADA FIRME', V2(760, 1080), '', V(Math.min(xr - 2.5, 1), (SBT + SBB) / 2, 0));
  } else if (sh === 3) { // isso é a sub-base
    setSub(RX1);
    K = camKeys([[TS(3), V(1.0, 0.5, 6.5), V(0, -0.8, -1), 40], [S(4) - 0.2, V(0.4, 0.6, 6.0), V(0, -0.75, -1), 40]], t);
    st.html += pill(t, S(3) + 0.25, 'SUB-BASE', V2(540, 1060), 'green', V(0, -0.68, 0));
  } else if (sh === 4) { // retração: racha onde quiser
    const tp = TS(4); for (const p of [...platesA, ...platesB]) { const k = xB(t, tp, 0.35); p.scale.y = Math.max(0.01, k); p.position.y = -ST + ST * k / 2; }
    const te = wt(4, 'encolhe') - 0.1;
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1 : -1; const z = i < 2 ? -1.5 : -4.5; placeArrow(redArrows[i], V(sx * 4.2, 0.35, z), V(-sx, 0, 0), 1.4 * eo(r(t, te + i * 0.05, te + 0.5 + i * 0.05)) + 0.01); }
    const tr = wt(4, 'racha') - 0.15; cracks.children.forEach(m => { m.visible = t > tr + m.userData.k * 0.06 + m.userData.i * 0.03; });
    if (t > tr) st.shake = 0.35 * (1 - r(t, tr + 0.1, tr + 0.5));
    K = camKeys([[TS(4), V(0, 12.5, 6.0), V(0, -0.2, -3.6), 44], [S(5) - 0.2, V(0.5, 13.0, 5.6), V(0, -0.2, -3.6), 44]], t);
    st.html += pill(t, wt(4, 'racha') + 0.05, 'RACHOU!', V2(540, 360), 'red');
  } else if (sh === 5) { // serra em placas
    const ts0 = wt(5, 'serra') - 0.5; const u = sm(r(t, ts0, E(5) - 0.1)); const zs = lerp(0.8, -6.6, u);
    saw.visible = true; saw.position.set(0, 0.0, zs); saw.rotation.set(0, 0, 0); setDust(t, t > ts0 && u < 1, V(0, 0.1, zs - 0.3));
    grooves.children.forEach(g => { const x = g.userData.x; if (x === 0) { const L = cl((0.0 - zs) / (2 * LW)); g.visible = L > 0.01; g.scale.z = Math.max(0.01, L); g.position.z = -L * LW; }
      else if (x === 999) { g.visible = t > E(5) - 0.4; }
      else { const k = xB(t, ts0 + 0.5 + Math.abs(x) * 0.06, 0.3); g.visible = k > 0.02; g.scale.set(1, 1, Math.max(0.01, k)); } });
    K = camKeys([[TS(5), V(3.6, 3.6, 6.4), V(0, -0.1, -2.6), 42], [S(6) - 0.2, V(4.2, 4.6, 7.4), V(0, -0.1, -2.8), 42]], t);
    st.html += pill(t, wt(5, 'serra') + 0.05, 'SERRA', V2(800, 420), 'orange', V(0.3, 0.6, zs + 0.3));
  } else if (sh === 6) { // isso é uma junta serrada
    K = camKeys([[TS(6), V(4.2, 4.6, 7.4), V(0, -0.1, -2.8), 42], [S(7) - 0.2, V(2.6, 3.2, 6.0), V(0, -0.1, -2.2), 42]], t);
    st.html += pill(t, S(6) + 0.25, 'JUNTA SERRADA', V2(540, 380), 'green', V(0, 0.02, -1.2));
  } else if (sh === 7) { // degrau
    const td = wt(7, 'afunda') - 0.2; const d = 0.16 * eo(r(t, td, td + 0.6));
    for (const P of [platesA, platesB]) { P[6].position.y = -ST / 2 - d; P[5].position.y = -ST / 2 - d * 0.15; }
    for (let i = 0; i < 2; i++) placeArrow(redArrows[i], V(i ? 1.6 : -1.6, 1.4, -0.6), V(0, -1, 0), (i ? 0.8 : 0.35) * eo(r(t, td, td + 0.4)) + 0.01);
    K = camKeys([[TS(7), V(1.1, 0.9, 4.6), V(0, -0.25, -1), 40], [S(8) - 0.2, V(0.6, 0.6, 3.8), V(0, -0.25, -1), 40]], t);
    st.html += pill(t, wt(7, 'degrau') + 0.05, 'DEGRAU!', V2(780, 460), 'red', V(0.02, -0.1, 0));
  } else if (sh === 8 || sh === 9) { // barras de transferência
    const op = sh === 8 ? lerp(1, 0.3, r(t, S(8) + 0.1, S(8) + 0.6)) : 0.3; mats.slab.opacity = op; mats.slabB.opacity = op; mats.slab.depthWrite = op > 0.95; mats.slabB.depthWrite = op > 0.95;
    const tb = wt(8, 'barras') - 0.25; dowels.children.forEach((d, i) => { const k = sh === 8 ? eo(r(t, tb + (i % 10) * 0.03, tb + 0.5 + (i % 10) * 0.03)) : 1; d.scale.x = Math.max(0.01, k); });
    K = sh === 8 ? camKeys([[TS(8), V(0.6, 0.6, 3.8), V(0, -0.25, -1), 40], [S(9) - 0.2, V(1.6, 1.3, 4.0), V(0, -0.3, -1.3), 40]], t)
                 : camKeys([[TS(9), V(1.6, 1.3, 4.0), V(0, -0.3, -1.3), 40], [S(10) - 0.2, V(2.0, 1.5, 4.6), V(0, -0.3, -1.5), 40]], t);
    st.html += pill(t, wt(8, 'lisas') - 0.05, 'AÇO LISO', V2(300, 420), 'orange', V(0.3, -0.22, -0.35), S(9) - 0.1);
    st.html += pill(t, S(9) + 0.2, 'BARRA DE TRANSFERÊNCIA', V2(540, 400), 'green', V(0.3, -0.22, -0.35));
  } else if (sh === 10) { // faixas se afastam
    const ta = S(10) + 0.3; const g = 0.55 * eo(r(t, ta, ta + 0.8)); laneB.position.z = -g;
    placeArrow(redArrows[0], V(0, 0.3, -2.5), V(0, 0, 1), 1.0 * eo(r(t, ta, ta + 0.5)) + 0.01); placeArrow(redArrows[1], V(0, 0.3, -3.5 - g), V(0, 0, -1), 1.0 * eo(r(t, ta, ta + 0.5)) + 0.01);
    K = camKeys([[TS(10), V(0, 6.0, 3.2), V(0, -0.2, -3.0), 42], [S(11) - 0.2, V(0.3, 6.4, 3.0), V(0, -0.2, -3.1), 42]], t);
    st.html += pill(t, wt(10, 'afast') + 0.05, 'SEPAROU!', V2(780, 420), 'red', V(1.2, 0.05, -3.2 - g / 2));
  } else if (sh === 11 || sh === 12) { // barras de ligação
    const tb = TS(11) + 0.1; laneB.position.z = sh === 11 ? -0.55 * (1 - eo(r(t, tb, tb + 0.6))) : 0;
    const op = sh === 11 ? lerp(1, 0.3, r(t, tb + 0.4, tb + 0.9)) : 0.3; mats.slab.opacity = op; mats.slabB.opacity = op; mats.slab.depthWrite = op > 0.95; mats.slabB.depthWrite = op > 0.95;
    const tc = wt(11, 'costura') - 0.1; ties.children.forEach((d, i) => { const k = sh === 11 ? eo(r(t, tc + (i % 12) * 0.05, tc + 0.5 + (i % 12) * 0.05)) : 1; d.scale.z = Math.max(0.01, k); });
    K = camKeys([[TS(11), V(-1.8, 3.6, 2.6), V(0.3, -0.25, -3.0), 42], [S(13) - 0.2, V(-1.0, 3.0, 2.2), V(0.4, -0.25, -3.0), 42]], t);
    st.html += pill(t, S(12) + 0.2, 'BARRA DE LIGAÇÃO', V2(540, 380), 'green', V(0.5, -0.18, -3.0));
  } else if (sh === 13) { // chuva lava a terra
    scene.background = STORM; hemi.intensity = 0.8; sun.intensity = 1.1; setRain(t, true, 0);
    const tl = wt(13, 'lava') - 0.2;
    for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); placeArrow(blueArrows[i], V(0, 1.4 - k * 0.9, -0.5 - i * 1.4), V(0, -1, 0), 0.55); }
    setSpray(t, t > tl, 0);
    for (const P of [platesA, platesB]) P[6].position.y = -ST / 2 - 0.08 * eo(r(t, tl + 0.3, E(13)));
    K = camKeys([[TS(13), V(1.6, 1.8, 5.6), V(0, -0.2, -2.0), 42], [S(14) - 0.2, V(1.2, 1.5, 5.0), V(0, -0.25, -1.8), 42]], t);
    st.html += pill(t, wt(13, 'lava') + 0.05, 'LAVA A TERRA', V2(760, 420), 'red', V(0.2, 0.3, -1.5));
  } else if (sh === 14) { // selante
    scene.background = STORM; hemi.intensity = 0.8; sun.intensity = 1.1; setRain(t, true, 0);
    const tf = wt(14, 'fecha') - 0.1; seals.children.forEach(g => { const x = g.userData.x; const k = x === 999 ? eo(r(t, tf + 0.3, tf + 0.9)) : xB(t, tf + Math.abs(x) * 0.05, 0.3); g.visible = k > 0.02; if (x === 999) g.scale.x = Math.max(0.01, k); else g.scale.z = Math.max(0.01, k); });
    setSpray(t, t < tf + 0.1, 0);
    for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); placeArrow(blueArrows[i], V(0, 1.4 - k * 0.9, -0.5 - i * 1.4), V(0, -1, 0), 0.55, t < tf + 0.4); }
    K = camKeys([[TS(14), V(1.0, 2.4, 4.2), V(0, -0.1, -1.8), 42], [S(15) - 0.2, V(2.0, 3.0, 5.2), V(0, -0.1, -2.2), 42]], t);
    st.html += pill(t, wt(14, 'borracha') + 0.05, 'BORRACHA', V2(300, 430), 'orange', V(0, 0.05, -1.0), wt(14, 'selante') - 0.1);
    st.html += pill(t, wt(14, 'selante') - 0.05, 'SELANTE', V2(540, 400), 'green', V(0, 0.05, -1.0));
  } else if (sh === 15) { // liso e molhado = sabão
    const w = r(t, TS(15), TS(15) + 0.4); mats.slab.color.copy(SLABC).lerp(WETC, w); mats.slabB.color.copy(SLABC).lerp(WETC, w); mats.slab.roughness = mats.slabB.roughness = 0.2;
    scene.background = STORM; hemi.intensity = 0.9; sun.intensity = 1.3; setRain(t, true, 0);
    const ts = S(15) + 0.3; const u = r(t, ts, E(15) + 0.1); placeCar(carA, lerp(-6, 1.5, eo(u)), -1.5 + Math.sin(u * 3) * 0.25, 2.6 * sm(r(t, ts + 0.4, E(15))));
    K = camKeys([[TS(15), V(-1.0, 5.0, 10.5), V(-0.5, -0.1, -2.6), 42], [S(16) - 0.2, V(0.5, 5.2, 10.5), V(0.8, -0.1, -2.6), 42]], t);
    st.html += pill(t, wt(15, 'sabão') - 0.05, 'VIRA SABÃO!', V2(540, 400), 'red', V(carA.position.x, 0.9, carA.position.z));
  } else if (sh === 16) { // pente de aço: texturização
    const xc = lerp(-3.0, 3.5, r(t, TS(16), E(16) + 0.1)); comb.visible = true; comb.position.set(xc, 0, 0); setGrooves(xc - 0.1);
    K = [0, V(xc - 1.6, 3.4, 5.4), V(xc - 0.4, -0.1, -2.4), 42]; // segue o pente: ranhuras aparecem atrás dele
    st.html += pill(t, wt(16, 'pente') + 0.05, 'PENTE DE AÇO', V2(780, 380), 'orange', V(xc - 0.1, 0.1, -0.6), wt(16, 'texturiz') - 0.1);
    st.html += pill(t, wt(16, 'texturiz') - 0.05, 'TEXTURIZAÇÃO', V2(540, 400), 'green', V(xc - 1.2, 0.02, -1.0));
  } else if (sh === 17) { // 10 toneladas, 20 anos
    const tl = S(17) + 0.1; const h = 1.7 * sm(r(t, tl, tl + 1.3)); const P = platesA[6]; P.position.y = -ST / 2 + h;
    hook.visible = true; const hy = h + 2.4; hook.children.forEach(c => { if (c.userData.hk) c.position.set(2, hy, -1.5); else { const a = V(2 + c.userData.x * 0.6, h, -1.5 + (c.userData.z + 1.5) * 0.6 - 0), b = V(2, hy, -1.5); c.position.copy(a.clone().add(b).multiplyScalar(0.5)); c.scale.y = a.distanceTo(b); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); } });
    K = camKeys([[TS(17), V(4.0, 1.6, 8.5), V(2, 0.1, -1.5), 42], [S(18) - 0.2, V(3.0, 2.0, 7.5), V(2, 0.4, -1.5), 42]], t);
    st.html += tonCard(t, wt(17, 'pesa') - 0.3, E(17));
    st.html += big(t, wt(17, 'durar') - 0.1, 'DURA <span style="color:#FFD21F">20+ ANOS</span>', 1000, '#fff', 92);
  } else if (sh === 18 || sh === 19) { // tum tum tum
    const t0 = TS(18), t1 = E(19); const xc = lerp(-12, 12, (t - t0) / (t1 - t0)); placeCar(carA, xc, -1.5, 0);
    for (const x of JX) { const tt = t0 + (x - 0.8 + 12) / 24 * (t1 - t0); if (t > tt && t < tt + 0.45 && Math.abs(x) < 12) { const a = scr(V(x, 0.2, -0.3)); const k = back(r(t, tt, tt + 0.2)) * (1 - r(t, tt + 0.3, tt + 0.45)); st.html += `<div style="position:absolute;left:${a.x - 120}px;top:${a.y - 230}px;width:240px;text-align:center;font-weight:900;font-size:76px;color:#FFD21F;transform:scale(${k});text-shadow:0 0 3px #000,0 5px 0 #000">TUM</div>`; } }
    const bump = JX.some(x => { const d = xc + 0.8 - x; return d > 0 && d < 0.15; }) || JX.some(x => { const d = xc - 0.85 - x; return d > 0 && d < 0.15; }); carA.position.y = bump ? 0.03 : 0;
    K = sh === 18 ? [0, V(xc + 2.0, 2.6, 7.2), V(xc + 0.6, 0.0, -1.8), 42] : [0, V(6.0 + (t - S(19)) * 0.15, 3.6, 11.0), V(6.0, 0.1, -2.2), 42]; // frase 19: câmera parada mostrando 2 juntas
    st.html += pill(t, wt(18, 'defeito') - 0.05, 'NÃO É DEFEITO', V2(540, 360), 'green', null, E(18) + 0.1);
    if (sh === 19) { const jn = 8; st.html += pill(t, S(19) + 0.2, 'JUNTA', V2(800, 420), '', V(jn, 0.03, -0.3));
      st.html += dimH(t, wt(19, 'cada') - 0.1, V(jn - PL, 0.05, 0.2), V(jn, 0.05, 0.2), '≈ 5 m'); }
  } else if (sh === 20) { // faixas, placas, radar
    const tp = wt(20, 'pinta') - 0.15; paint.children.forEach(m => { if (m.userData.kind === 'edge') { m.scale.x = Math.max(0.01, eo(r(t, tp, tp + 1.0))); } else { const k = xB(t, tp + 0.2 + (m.userData.x + 24) * 0.02, 0.25); m.visible = k > 0.02; m.scale.set(Math.max(0.01, k), 1, 1); } });
    sign.scale.setScalar(Math.max(0.01, xB(t, wt(20, 'placas') - 0.15, 0.35))); radar.scale.setScalar(Math.max(0.01, xB(t, wt(20, 'radar') - 0.15, 0.35)));
    placeCar(carB, lerp(9, -7, r(t, TS(20), E(20) + 0.2)), -4.5, Math.PI);
    K = camKeys([[TS(20), V(-2.0, 3.6, 8.5), V(-0.5, 0.3, -3.5), 44], [wt(20, 'radar') - 0.4, V(1.8, 2.8, 6.0), V(3.6, 1.5, -7.5), 44], [S(21) - 0.2, V(2.2, 2.8, 5.6), V(4.0, 1.6, -7.8), 44]], t);
    st.html += pill(t, wt(20, 'faixas') + 0.05, 'FAIXAS', V2(300, 900), '', V(-1.5, 0.05, -LW - 0.2), wt(20, 'radar') - 0.5);
    st.html += pill(t, wt(20, 'placas') + 0.05, 'PLACA', V2(250, 420), '', V(1.2, 2.4, -7.0), wt(20, 'radar') - 0.5);
    st.html += pill(t, wt(20, 'radar') + 0.1, 'O RADAR ESCONDIDO', V2(540, 360), 'red', V(6.6, 2.6, -8.8));
  } else { // parabéns + CTA (+ tela final por cima)
    const u = r(t, TS(21), END);
    placeCar(carA, -14 + ((t - TS(21)) * 5.5) % 30, -1.5, 0); placeCar(carB, 14 - ((t - TS(21)) * 5.0) % 30, -4.5, Math.PI); placeCar(carC, -24 + ((t - TS(21)) * 5.5) % 30, -1.5, 0);
    K = [0, V(-3 + u * 6, 4.6 - u * 0.6, 12.5 - u * 1.5), V(0, 0.2, -3.5), 42];
    if (sh === 21) { st.html += big(t, wt(21, 'parab') - 0.05, 'PARABÉNS!', 300, '#FFD21F', 120); st.html += big(t, wt(21, 'constr') - 0.05, 'VOCÊ CONSTRUIU UMA<br>RODOVIA DE CONCRETO', 450, '#fff', 74); st.html += confetti(t, wt(21, 'parab')); }
    if (sh >= 22) st.html += ctaCard(t);
  }
  st.cam = K; return st;
}
function dimH(t, t0, a, b, txt) { if (t < t0) return ''; const u = eo(r(t, t0, t0 + 0.5)); const A = scr(a), B0 = scr(b); const B = { x: lerp(A.x, B0.x, u), y: lerp(A.y, B0.y, u) };
  return `<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}"><g stroke="#ffb020" stroke-width="7" stroke-linecap="round"><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/><line x1="${A.x}" y1="${A.y - 24}" x2="${A.x}" y2="${A.y + 24}"/><line x1="${B.x}" y1="${B.y - 24}" x2="${B.x}" y2="${B.y + 24}"/></g></svg>
  <div class="pill" style="left:${(A.x + B.x) / 2}px;top:${(A.y + B.y) / 2 - 70}px;border-color:#ffb020;font-size:52px;transform:translate(-50%,-50%) scale(${back(r(t, t0 + 0.2, t0 + 0.5))})">${txt}</div>`; }
function tonCard(t, t0, t1) { if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0, 0.4) * (1 - r(t, t1, t1 + 0.25));
  return `<div class="card" style="left:110px;top:200px;width:860px;padding:26px 30px 24px;text-align:center;transform-origin:50% 0;transform:scale(${k})">
   <div style="font-weight:800;font-size:40px">1 PLACA DE CONCRETO</div><div style="font-weight:900;font-size:96px;color:#FFD21F;line-height:1.1">≈ 10 TONELADAS</div></div>`; }
function ctaCard(t) { const t0 = TS(22); if (t < t0 || t > window.F_END / FPS + 0.2) return '';
  const items = [['curte', '#ff4d6d', '<path d="M50 84 L18 52 Q6 38 16 24 Q28 10 44 22 L50 28 L56 22 Q72 10 84 24 Q94 38 82 52 Z" fill="#ff4d6d"/>', 'CURTE'],
    ['salva', '#FFD21F', '<path d="M26 12 H74 V88 L50 70 L26 88 Z" fill="#FFD21F"/>', 'SALVA'],
    ['manda', '#4aa3ff', '<path d="M10 46 L90 12 L62 88 L48 56 Z" fill="#4aa3ff"/>', 'MANDA'],
    ['comenta', '#3dd17a', '<path d="M14 18 H86 V66 H46 L24 86 V66 H14 Z" fill="#3dd17a"/>', 'COMENTA']];
  let h = '<div style="position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;gap:26px">';
  for (const [w, c, svg, lab] of items) { const k = back(r(t, wt(22, w) - 0.15, wt(22, w) + 0.15));
    h += `<div style="width:220px;text-align:center;transform:scale(${k});opacity:${cl(k)}"><div style="width:190px;height:190px;margin:0 auto;border-radius:40px;background:rgba(20,23,29,.92);border:5px solid ${c};display:flex;align-items:center;justify-content:center"><svg width="120" height="120" viewBox="0 0 100 100">${svg}</svg></div><div style="font-weight:900;font-size:40px;color:#fff;margin-top:10px;text-shadow:0 3px 0 #000">${lab}</div></div>`; }
  return h + '</div>'; }
function confetti(t, t0) { if (t < t0) return ''; let h = ''; const cols = ['#FFD21F', '#ff5a5a', '#3dd17a', '#4aa3ff', '#ff9a1f', '#fff'];
  for (let i = 0; i < 70; i++) { const u = t - t0; const x = (i * 157) % 1080 + Math.sin(u * 2 + i) * 30; const y = -40 + u * (260 + (i * 37) % 200) - 60 * ((i * 13) % 5); if (y < -40 || y > 1950) continue;
    h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${12 + i % 3 * 4}px;height:${22 - i % 3 * 4}px;background:${cols[i % 6]};transform:rotate(${u * 300 + i * 40}deg)"></div>`; }
  return h; }
// ---------- avatar no canto ----------
function avatarCorner(f) {
  const out = cl(1 - (f - window.F_END) / 8); if (out <= 0) return ''; const inS = springSim(f - 4, 12, 140); const m = mouthAt(f);
  return `<div style="position:absolute;left:50px;top:1515px;width:270px;height:270px;opacity:${out};transform:translateY(${-m * 5}px) rotate(${Math.sin(f / 23) * 2 + m * 1.5}deg) scale(${inS * (0.9 + 0.1 * out)})">
   <div style="width:270px;height:270px;box-sizing:border-box;border-radius:135px;overflow:hidden;background:#30343A;border:9px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${window.AV.svg(m, window.AV.blinkAt(f), Math.sin(f / 70) * 0.6)}</div></div>`;
}
// ---------- quadro ----------
window.renderFrame = f => {
  const t = f / FPS; const st = world(t); const K = st.cam;
  let p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.06; p.add(V(noise(t * 2.5) * a, noise(t * 2.8, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.04, Math.sin(t * 0.9) * 0.03, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.setViewOffset(W, H, 0, 260, W, H); // centro do quadro sobe 260 px (fica acima da legenda)
  cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -3); sun.position.set(5, 11, 7.5);
  R.render(scene, cam);
  canvas.style.filter = st.blur ? `blur(${st.blur}px)` : 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`
    + (st.red ? `<div style="position:absolute;inset:0;background:#c41010;opacity:${st.red};mix-blend-mode:multiply"></div>` : '')
    + (st.dark ? `<div style="position:absolute;inset:0;background:#000;opacity:${st.dark}"></div>` : '');
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 0.4, dist = 12) => {
  const t = S(21) + 0.3; world(t);
  placeCar(carA, 0.6, -1.5, 0); placeCar(carB, -4.5, -4.5, Math.PI); carC.visible = false;
  cam.clearViewOffset(); cam.position.set(-3.0, 4.2, dist); cam.fov = 42; cam.up.set(0, 1, 0); cam.lookAt(V(0.3, cy, -3.5)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -3); sun.position.set(5, 11, 9); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 34%,rgba(14,22,34,0) 52%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:290px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:36px;letter-spacing:5px;padding:12px 30px;border-radius:40px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:300px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:44px">#02</div>
   <div style="position:absolute;left:110px;right:80px;top:390px;font-family:InterD;font-weight:900;font-size:108px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Por que a<br>estrada de<br><span style="color:#8fd0ff">concreto</span> faz<br><span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">tum-tum</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

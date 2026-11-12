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
const WSEG = TM.words.find(w => w.p === 21 && w.w.toLowerCase() === 'segue'), WATE = TM.words.find(w => w.p === 21 && w.w === 'Até');
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
// ================= SUBSOLO: cenário =================
const PW = 2.0, PB = -2.9, PZ = -3.5;              // meia largura do buraco, fundo, fundo em z
const WX = 1.75, WT = 0.2, WTOP = 0.1, SLAB = -2.5;  // paredes
const full = new THREE.Group(); scene.add(full);
mats.grass2 = M('#7fae4f'); mats.conc = M('#b9b5ad'); mats.concNew = M('#cfcac0'); mats.gravel = M('#8d8a86');
mats.waterIn = new THREE.MeshStandardMaterial({ color: '#3d86c6', roughness: 0.15, transparent: true, opacity: 0.75, depthWrite: false });
mats.waterSoil = new THREE.MeshBasicMaterial({ color: '#1f7bff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
mats.manta = M('#1c1c1e', { roughness: 0.5 }); mats.wallT = M('#bdb8ae', { transparent: true, opacity: 1 }); // NUNCA alternar .transparent entre quadros (pisca) mats.steel2 = M('#d0612c', { roughness: 0.5, metalness: 0.2, emissive: '#5a2008', emissiveIntensity: 0.4 });
// chão de cima (metade de trás, com o buraco)
{ const s = new THREE.Shape(); s.moveTo(-40, 0); s.lineTo(-PW, 0); s.lineTo(-PW, -PZ); s.lineTo(PW, -PZ); s.lineTo(PW, 0); s.lineTo(40, 0); s.lineTo(40, 40); s.lineTo(-40, 40);
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
  mesh(g, M('#ffffff', { map: dirtTex, side: THREE.DoubleSide, color: '#b9d68a' }), full, 0, 0, 0, false); }
// grama em faixa por cima (verde) — fica no chão
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(80, 40).rotateX(-Math.PI / 2), mats.grass2); lawn.position.set(0, -0.04, -24); lawn.receiveShadow = true; scene.add(lawn);
// face do corte com o buraco e o poço de drenagem
{ const s = new THREE.Shape(); s.moveTo(-40, -12); s.lineTo(40, -12); s.lineTo(40, 0); s.lineTo(PW, 0); s.lineTo(PW, PB); s.lineTo(1.5, PB); s.lineTo(1.5, -3.5); s.lineTo(0.8, -3.5); s.lineTo(0.8, PB); s.lineTo(-PW, PB); s.lineTo(-PW, 0); s.lineTo(-40, 0);
  const g = new THREE.ShapeGeometry(s); strataTex.repeat.set(1 / 4, 1 / 12); mesh(g, mats.strata, full, 0, 0, 0, false); }
// paredes de terra do buraco (fundo, laterais, piso)
const pitBack = mesh(new THREE.PlaneGeometry(2 * PW, -PB), M('#ffffff', { map: strataTex, side: THREE.DoubleSide }), full, 0, PB / 2, PZ, false);
for (const sx of [-1, 1]) { const p = mesh(new THREE.PlaneGeometry(-PZ, -PB), M('#9c5a34', { side: THREE.DoubleSide }), full, sx * PW, PB / 2, PZ / 2, false); p.rotation.y = Math.PI / 2; }
mesh(new THREE.PlaneGeometry(2 * PW, -PZ).rotateX(-Math.PI / 2), M('#7a4a2c'), full, 0, PB, PZ / 2, false);
// terra que vai saindo (buraco sendo cavado)
const fillBox = mesh(new THREE.BoxGeometry(2 * PW - 0.02, 1, -PZ - 0.02), M('#ffffff', { map: dirtTex }), full, 0, 0, PZ / 2, false);
const notchFill = mesh(new THREE.PlaneGeometry(0.72, 0.62), M('#ffffff', { map: strataTex, side: THREE.DoubleSide }), full, 1.15, -3.2, 0.0, false);
// água no solo (lençol), duas faixas na face do corte
const wsL = mesh(new THREE.PlaneGeometry(1, 1), mats.waterSoil, full, 0, 0, 0.02, false), wsR = mesh(new THREE.PlaneGeometry(1, 1), mats.waterSoil, full, 0, 0, 0.02, false);
const wsB = mesh(new THREE.PlaneGeometry(1, 1), mats.waterSoil, full, 0, 0, PZ - 0.01, false);
function waterTable(y, op) { mats.waterSoil.opacity = op; const h = y + 12; for (const [m, x0, x1] of [[wsL, -40, -PW], [wsR, PW, 40]]) { m.scale.set(x1 - x0, h, 1); m.position.set((x0 + x1) / 2, -12 + h / 2, 0.02); m.visible = op > 0; } wsB.visible = false; }
// ---- estrutura do subsolo ----
const struct = new THREE.Group(); full.add(struct);
const footings = new THREE.Group(); struct.add(footings);
for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.62, 0.3, -PZ - 0.25), mats.concNew, footings, sx * WX, -2.75, (PZ + 0.25) / 2 - 0.0);
mesh(new THREE.BoxGeometry(2 * WX + 0.62, 0.3, 0.62), mats.concNew, footings, 0, -2.75, PZ + 0.31);
footings.children.forEach(m => { m.userData.base = m.position.clone(); });
const walls = new THREE.Group(); struct.add(walls);
const WH = WTOP - (-2.6);
for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(WT, WH, -PZ - 0.3), mats.wallT, walls, sx * WX, -2.6 + WH / 2, (PZ + 0.3) / 2);
const backWall = mesh(new THREE.BoxGeometry(2 * WX + WT, WH, WT), mats.wallT, walls, 0, -2.6 + WH / 2, PZ + 0.4);
const slab = mesh(new THREE.BoxGeometry(2 * WX - WT, 0.12, -PZ - 0.5), mats.conc, struct, 0, SLAB - 0.04, (PZ + 0.5) / 2);
// armadura
const rebar = new THREE.Group(); struct.add(rebar);
for (const sx of [-1, 1]) {
  for (let z = -0.15; z > PZ + 0.4; z -= 0.35) mesh(new THREE.CylinderGeometry(0.035, 0.035, WH - 0.1, 6), mats.steel2, rebar, sx * WX, -2.6 + WH / 2, z, false);
  for (let y = -2.45; y < 0; y += 0.3) mesh(new THREE.CylinderGeometry(0.03, 0.03, -PZ - 0.45, 6).rotateX(Math.PI / 2), mats.steel2, rebar, sx * WX, y, (PZ + 0.3) / 2, false); }
for (let x = -WX + 0.2; x < WX; x += 0.35) mesh(new THREE.CylinderGeometry(0.035, 0.035, WH - 0.1, 6), mats.steel2, rebar, x, -2.6 + WH / 2, PZ + 0.4, false);
for (let y = -2.45; y < 0; y += 0.3) mesh(new THREE.CylinderGeometry(0.03, 0.03, 2 * WX, 6).rotateZ(Math.PI / 2), mats.steel2, rebar, 0, y, PZ + 0.4, false);
// rachadura na parede do fundo
const crack = new THREE.Group(); struct.add(crack);
{ let x = -0.6, y = -0.3; const pts = [[-0.6, -0.3]]; for (let i = 0; i < 9; i++) { x += 0.12 + Math.sin(i * 2.3) * 0.08; y -= 0.22 + Math.cos(i * 1.7) * 0.06; pts.push([x, y]); }
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const len = Math.hypot(x1 - x0, y1 - y0); const m = mesh(new THREE.BoxGeometry(len, 0.035, 0.02), mats.black, crack, (x0 + x1) / 2, (y0 + y1) / 2, PZ + 0.4 + WT / 2 + 0.012, false); m.rotation.z = Math.atan2(y1 - y0, x1 - x0); m.userData.i = i; } }
// dreno: brita + cano furado
const drain = new THREE.Group(); struct.add(drain);
for (const sx of [-1, 1]) {
  mesh(new THREE.CylinderGeometry(0.07, 0.07, -PZ - 0.2, 12).rotateX(Math.PI / 2), M('#e8e6e0'), drain, sx * 1.93, -2.72, PZ / 2, false);
  for (let i = 0; i < 40; i++) { const z = -0.1 + (PZ + 0.2) * ((i * 37) % 40) / 40; mesh(new THREE.IcosahedronGeometry(0.035 + ((i * 13) % 5) * 0.006, 0), mats.gravel, drain, sx * (1.87 + ((i * 7) % 5) * 0.025), -2.84 + ((i * 11) % 7) * 0.035, z, false); }
  for (let k = 0; k < 6; k++) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), mats.black, drain, sx * 1.93, -2.66, -0.25 - k * 0.5, false); }
// manta asfáltica (cresce de baixo pra cima)
const manta = new THREE.Group(); struct.add(manta);
for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.035, 1, -PZ - 0.3), mats.manta, manta, sx * (WX + WT / 2 + 0.02), 0, (PZ + 0.3) / 2, false);
mesh(new THREE.BoxGeometry(2 * WX + WT + 0.08, 1, 0.035), mats.manta, manta, 0, 0, PZ + 0.4 - WT / 2 - 0.02, false);
function setManta(u) { manta.visible = u > 0; const h = Math.max(0.001, u * WH); manta.children.forEach(m => { m.scale.y = h; m.position.y = -2.6 + h / 2; }); }
// água dentro do subsolo
const waterIn = mesh(new THREE.BoxGeometry(2 * WX - WT - 0.02, 1, -PZ - 0.52), mats.waterIn, struct, 0, 0, (PZ + 0.5) / 2, false); waterIn.castShadow = false;
function setWaterIn(h) { waterIn.visible = h > 0.005; waterIn.scale.y = Math.max(0.001, h); waterIn.position.y = SLAB + 0.02 + h / 2; }
// poço de drenagem com bomba e boia
const sump = new THREE.Group(); struct.add(sump);
{ mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.95, 20, 1, true), M('#8f8a82', { side: THREE.DoubleSide }), sump, 1.15, -3.0, -0.35, false);
  mesh(new THREE.CircleGeometry(0.3, 20).rotateX(-Math.PI / 2), M('#4c3a2c'), sump, 1.15, -3.46, -0.35, false); }
const pump = new THREE.Group(); pump.position.set(1.15, -3.3, -0.4); sump.add(pump);
{ mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.26, 14), M('#2f6fb3'), pump, 0, 0, 0); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), M('#2a5e99'), pump, 0, 0.25, 0); }
const floatBall = mesh(new THREE.SphereGeometry(0.07, 12, 10), M('#f2c21b'), sump, 1.28, -3.15, -0.3);
const outPipe = new THREE.Group(); struct.add(outPipe);
{ const c = new THREE.CatmullRomCurve3([V(1.15, -3.05, -0.4), V(1.45, -2.4, -0.4), V(1.5, -0.4, -0.4), V(1.5, 0.35, -0.4), V(2.2, 0.55, -0.4), V(2.7, 0.3, -0.4)]); mesh(new THREE.TubeGeometry(c, 40, 0.035, 8), M('#e8e6e0'), outPipe, 0, 0, 0, false); }
const sumpWater = mesh(new THREE.CylinderGeometry(0.28, 0.28, 1, 20), mats.waterIn, sump, 1.15, -3.2, -0.35, false);
// escada e lâmpadas (final)
const stairs = new THREE.Group(); struct.add(stairs);
for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.3, 0.27 * (i + 1), 0.8), mats.conc, stairs, -1.45 + i * 0.3, SLAB + 0.135 * (i + 1), PZ + 0.9, false);
const lamps = new THREE.Group(); struct.add(lamps);
for (const x of [-0.8, 0.8]) { mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshStandardMaterial({ color: '#fff6d0', emissive: '#ffe9a0', emissiveIntensity: 2 }), lamps, x, -0.1, -1.6, false); }
const lampLight = new THREE.PointLight('#ffe6b0', 0, 6, 1.5); lampLight.position.set(0, -0.4, -1.2); scene.add(lampLight);
// carros
function car(color) { const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.BoxGeometry(1.35, 0.45, 2.6), M(color, { roughness: 0.35 }), g, 0, 0.42, 0); mesh(new THREE.BoxGeometry(1.15, 0.38, 1.3), M(color, { roughness: 0.35 }), g, 0, 0.82, -0.15);
  mesh(new THREE.BoxGeometry(1.17, 0.28, 1.1), M('#2c3a46', { roughness: 0.1 }), g, 0, 0.84, -0.15);
  for (const [x, z] of [[-0.66, 0.8], [0.66, 0.8], [-0.66, -0.85], [0.66, -0.85]]) mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14).rotateZ(Math.PI / 2), mats.black, g, x, 0.24, z);
  return g; }
const carN = car('#d63b3b');
// casa (casa de bonecas: aberta na frente)
const house = new THREE.Group(); scene.add(house);
{ const wm = M('#efe6d8'), rf = M('#c0563a'); const hw = 2.3, hd = 3.6, hh = 2.5;
  mesh(new THREE.BoxGeometry(2 * hw, 0.15, hd), M('#cdbfa9'), house, 0, 0.075, -hd / 2);
  mesh(new THREE.BoxGeometry(2 * hw, hh, 0.15), wm, house, 0, hh / 2, -hd + 0.075);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.15, hh, hd), wm, house, sx * (hw - 0.075), hh / 2, -hd / 2);
  mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), M('#8fc3e6', { roughness: 0.1 }), house, 0.8, 1.4, -hd + 0.16);
  mesh(new THREE.BoxGeometry(0.8, 1.6, 0.05), mats.door, house, -0.9, 0.8, -hd + 0.16);
  const roof = new THREE.Shape(); roof.moveTo(-hw - 0.3, 0); roof.lineTo(hw + 0.3, 0); roof.lineTo(0, 1.5); roof.lineTo(-hw - 0.3, 0);
  const rg = new THREE.ExtrudeGeometry(roof, { depth: hd + 0.3, bevelEnabled: false }); const rm = mesh(rg, rf, house, 0, hh, -hd - 0.15); }
const building = new THREE.Group(); scene.add(building);
{ const bm = M('#d9d4cc'), gl = M('#7fa9c9', { roughness: 0.1 });
  mesh(new THREE.BoxGeometry(4.6, 9, 3.6), bm, building, 0, 4.5, -1.8);
  for (let y = 1; y < 9; y += 1.2) for (const x of [-1.4, 0, 1.4]) mesh(new THREE.BoxGeometry(0.8, 0.7, 0.05), gl, building, x, y, 0.03); }
// entorno
function tree2(x, z, s) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8), mats.trunk, g, 0, 0.8, 0); mesh(new THREE.IcosahedronGeometry(1.1, 1), mats.leaf, g, 0, 2.2, 0); mesh(new THREE.IcosahedronGeometry(0.8, 1), mats.leaf2, g, 0.6, 1.9, 0.3); }
[[-6, -9, 1.3], [6.5, -10, 1.5], [-9, -16, 1.4], [9, -17, 1.3], [0, -20, 1.6]].forEach(a => tree2(...a));
function bgHouse(x, z, w, c) { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); mesh(new THREE.BoxGeometry(w, 2.4, 4), M(c), g, 0, 1.2, 0); const r = new THREE.ConeGeometry(w * 0.78, 1.3, 4); r.rotateY(Math.PI / 4); mesh(r, mats.roof, g, 0, 3.05, 0).scale.set(1, 1, 4 / w); }
bgHouse(-7.5, -14, 5, '#e3d7c4'); bgHouse(8, -14, 5, '#efe6d8'); bgHouse(0, -26, 6, '#e3d7c4');
// gerador
const gen = new THREE.Group(); scene.add(gen); gen.position.set(-3.0, 0, -1.5);
{ mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), M('#e0a21a'), gen, 0, 0.35, 0); mesh(new THREE.BoxGeometry(0.95, 0.08, 0.65), mats.black, gen, 0, 0.04, 0); mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), mats.black, gen, 0.3, 0.75, 0); }
// pá do trabalhador
const shovel = new THREE.Group(); { mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), mats.wood, shovel, 0, 0, 0); mesh(new THREE.BoxGeometry(0.22, 0.28, 0.03), mats.steel, shovel, 0, -0.62, 0.02); }
// pedaços de terra caindo
const chunksG = new THREE.Group(); scene.add(chunksG);
for (let i = 0; i < 26; i++) { const m = mesh(new THREE.IcosahedronGeometry(0.12 + (i % 4) * 0.05, 0), M('#9c5a34'), chunksG, 0, 0, 0); m.userData = { sx: i % 2 ? 1 : -1, z: -0.3 - (i * 0.37) % 3, d: (i * 0.13) % 0.9, y0: -0.1 - (i * 0.29) % 1.6, sp: 0.5 + (i % 5) * 0.12 }; }
// chuva
const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.35, 0.012), new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.55 }), 500); scene.add(rain); rain.frustumCulled = false;
const rainSeeds = [...Array(500)].map((_, i) => [((i * 97) % 1000) / 1000 * 14 - 7, ((i * 61) % 1000) / 1000, ((i * 31) % 1000) / 1000 * 8 - 6]);
const dm = new THREE.Matrix4();
function setRain(t, on) { rain.visible = on; if (!on) return; rainSeeds.forEach(([x, ph, z], i) => { const y = 8 - ((t * 9 + ph * 9) % 9); dm.makeTranslation(x, y, z + 1.5); rain.setMatrixAt(i, dm); }); rain.instanceMatrix.needsUpdate = true; }
// setas (empuxo / peso)
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.13, 0.28, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
const pushArrows = []; for (let i = 0; i < 8; i++) pushArrows.push(arrow('#ff7a1a'));
const loadArrows = []; for (let i = 0; i < 6; i++) loadArrows.push(arrow('#ffd21f'));
const flowArrows = []; for (let i = 0; i < 8; i++) flowArrows.push(arrow('#3d9bff'));
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.14 / len; }
// personagens
const you = person({ shirt: '#f07c1e' });
// ---- jato de água na saída ----
const jet = new THREE.Group(); scene.add(jet); for (let i = 0; i < 14; i++) mesh(new THREE.SphereGeometry(0.05, 8, 6), mats.waterIn, jet, 0, 0, 0, false);
function setJet(t, on) { jet.visible = on; if (!on) return; jet.children.forEach((m, i) => { const u = ((t * 1.6 + i / 14) % 1); m.position.set(2.7 + u * 0.9, 0.3 + u * 0.35 - u * u * 0.9, -0.4); }); }
// ================= SUBSOLO: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const T = { A: 0, B: S(1) - 0.1, C: S(2) - 0.1, D: S(4) - 0.1, E: S(5) - 0.1, F: S(7) - 0.1, G: S(9) - 0.1, H: S(10) - 0.1, I: S(12) - 0.1, J: S(13) - 0.1, K: S(14) - 0.1, L: S(15) - 0.1, M: S(17) - 0.1, N: S(19) - 0.1, O: S(20) - 0.1 };
const shotOf = t => { let k = 'A'; for (const [n, v] of Object.entries(T)) if (t >= v) k = n; return k; };
const CAM_B = [V(0.4, -1.5, 14.5), V(0, -2.2, 0), 40], CAM_H = [V(0.6, 0.4, 19.5), V(0, -0.8, 0), 40];
const SKYC = new THREE.Color('#cfe3ef'), STORM = new THREE.Color('#4a5560');
function placeP(P, x, y, z, ry = 0) { P.g.position.set(x, y, z); P.g.rotation.set(0, ry, 0); P.g.visible = true; }
const xB = (t, a, b) => back(r(t, a, a + b));
function world(t) {
  const sh = shotOf(t); const st = { cam: null, roll: 0, blur: 0, red: 0, dark: 0, flash: 0, vig: 0.3, shake: 0, html: '' };
  const after = k => t >= T[k];
  // ---- estado base ----
  you.g.visible = false; shovel.visible = false; house.visible = false; building.visible = false; carN.visible = false; gen.visible = false;
  chunksG.visible = false; fillBox.visible = false; setRain(t, false); setJet(t, false); lamps.visible = false; lampLight.intensity = 0;
  [...pushArrows, ...loadArrows, ...flowArrows].forEach(a => a.visible = false);
  scene.background = SKYC; hemi.intensity = 1.25; sun.intensity = 2.4;
  struct.visible = after('C'); footings.visible = after('C'); walls.visible = after('D'); slab.visible = after('D');
  rebar.visible = sh === 'F'; crack.visible = sh === 'E' && t > S(6); drain.visible = after('H'); sump.visible = after('J'); outPipe.visible = after('J');
  stairs.visible = after('N'); notchFill.visible = !after('J') || (sh === 'J' && t < wt(13, 'poço') - 0.2); setManta(after('L') ? (sh === 'L' ? sm(r(t, wt(15, 'cobre'), wt(15, 'cobre') + 1.6)) : 1) : 0);
  mats.wallT.opacity = 1; mats.wallT.transparent = true; mats.wallT.color.set('#bdb8ae'); mats.wallT.depthWrite = true;
  waterTable(-12, 0); setWaterIn(0); sumpWater.visible = false; floatBall.position.y = -3.15; pump.position.x = 1.15;
  footings.children.forEach(m => { m.scale.y = 1; m.position.y = -2.75; });
  walls.children.forEach(m => { m.scale.y = 1; m.position.y = -2.6 + WH / 2; });
  const wtab = after('G') ? (sh === 'G' ? lerp(-12, -1.4, sm(r(t, S(9) + 0.3, S(9) + 2.2))) : -1.4) : -12;
  if (after('G')) waterTable(wtab, 0.5);
  let K;
  if (sh === 'A') { // cava o buraco, casa em cima
    const tc = wt(0, 'constr'); const dig = sm(r(t, 0.2, tc - 0.2)); const top = lerp(-0.02, PB, dig);
    fillBox.visible = top > PB + 0.02; fillBox.scale.y = Math.max(0.01, top - PB); fillBox.position.y = PB + (top - PB) / 2;
    if (t < tc + 0.1) { placeP(you, 0.6, top, -1.6, -0.5); const s = Math.sin(t * 7); pose(you, { lean: 0.45 + s * 0.2, armL: [-1.2 + s * 0.5, 0.2], armR: [-1.0 + s * 0.5, -0.2], head: [0.3, 0, 0], legL: -0.2 }); if (shovel.parent !== you.armR) you.armR.add(shovel); shovel.position.set(0, -0.6, 0.15); shovel.rotation.set(1.2, 0, 0); shovel.visible = true; }
    house.visible = t > tc - 0.05; const hu = r(t, tc - 0.05, tc + 0.45); house.position.set(0, lerp(7, 0, ei(hu)), 0); house.rotation.set(0, 0, 0);
    if (t > tc + 0.4) st.shake = 1 - r(t, tc + 0.42, tc + 0.8);
    K = camKeys([[0, V(2.4, 1.6, 6.2), V(0.3, -0.4, -1.6), 42], [tc - 0.4, V(1.2, 0.4, 13), V(0, -1.2, -1), 40], [T.B, ...CAM_H]], t);
    st.html += pill(t, wt(0, 'subsolo'), 'SUBSOLO?', V2(800, 760), '', V(0.6, -1.4, -1.5));
  } else if (sh === 'B') { // afunda e desmorona
    house.visible = true; const u = sm(r(t, S(1) + 0.4, S(1) + 2.0)); house.position.set(0, -1.25 * u, 0); house.rotation.set(0.04 * u, 0, 0.1 * u);
    chunksG.visible = true; chunksG.children.forEach(m => { const d = m.userData; const k = r(t, wt(1, 'desmor') - 0.3 + d.d, wt(1, 'desmor') + 0.4 + d.d); const y = lerp(d.y0, PB + 0.12, ei(k) * d.sp > 1 ? 1 : ei(k)); m.position.set(d.sx * lerp(PW + 0.05, PW - 0.4 - d.d * 0.6, k), y, d.z); m.visible = k > 0; m.rotation.set(t * 3 + d.d * 9, t * 2, 0); });
    st.shake = 0.6 * r(t, S(1) + 0.4, S(1) + 0.7) * (1 - r(t, S(1) + 1.8, S(1) + 2.3)) + 0.8 * r(t, wt(1, 'desmor'), wt(1, 'desmor') + 0.2) * (1 - r(t, wt(1, 'desmor') + 0.6, wt(1, 'desmor') + 1.1));
    K = camKeys([[T.B, ...CAM_H], [T.C, V(0.9, -0.2, 17.5), V(0, -1.1, 0), 40]], t);
    st.html += pill(t, S(1) + 0.8, 'AFUNDOU!', V2(780, 420), 'red', V(1.5, 0.8, -1.5));
    st.red = 0.18 * r(t, S(1) + 0.6, S(1) + 1.2);
  } else if (sh === 'C') { // sapata corrida
    const tf = wt(2, 'faixa') - 0.1; footings.children.forEach((m, i) => { const k = back(r(t, tf + i * 0.15, tf + 0.5 + i * 0.15)); m.scale.y = Math.max(0.01, k); m.position.y = -2.9 + 0.15 * k; });
    const te = wt(2, 'espalh') - 0.2;
    for (const [j, sx] of [[0, -1], [1, 1]]) { placeArrow(loadArrows[j * 3], V(sx * WX, 0.9, -0.2), V(0, -1, 0), 2.4 * eo(r(t, tf + 0.6, tf + 1.2)) + 0.01);
      placeArrow(loadArrows[j * 3 + 1], V(sx * WX, -3.0, -0.2), V(-0.7, -1, 0), 1.1 * eo(r(t, te, te + 0.5)) + 0.01); placeArrow(loadArrows[j * 3 + 2], V(sx * WX, -3.0, -0.2), V(0.7, -1, 0), 1.1 * eo(r(t, te, te + 0.5)) + 0.01); }
    K = camKeys([[T.C, ...CAM_B], [T.D, V(0.2, -1.8, 13.5), V(0, -2.3, 0), 40]], t);
    st.flash = 0;
    st.html += pill(t, S(3) + 0.05, 'SAPATA CORRIDA', V2(540, 1120), 'green', V(-WX, -2.75, -0.1));
  } else if (sh === 'D') { // paredes sobem
    walls.children.forEach((m, i) => { const k = eo(r(t, S(4) + 0.4 + i * 0.12, S(4) + 1.5 + i * 0.12)); m.scale.y = Math.max(0.01, k); m.position.y = -2.6 + WH * k / 2; });
    slab.visible = t > S(4) + 1.2;
    K = camKeys([[T.D, V(0.2, -1.8, 13.5), V(0, -2.3, 0), 40], [T.E, V(-1.2, -1.4, 13.6), V(0, -2.0, 0), 40]], t);
    placeP(you, -0.6, SLAB, -1.8, 0.4); pose(you, { armL: [-2.6, 0.3], armR: [-0.3, -0.1] }); idle(you, t);
  } else if (sh === 'E') { // empuxo + racha
    const ys = [-0.5, -1.2, -1.9, -2.4];
    ys.forEach((y, i) => { for (const [j, sx] of [[0, -1], [1, 1]]) { const len = (0.7 + i * 0.32) * eo(r(t, S(5) + 0.6 + i * 0.12, S(5) + 1.1 + i * 0.12)); placeArrow(pushArrows[i * 2 + j], V(sx * (WX + 0.25 + len + 0.3), y, 0.1), V(-sx, 0, 0), len + 0.01); } });
    const cr = r(t, S(6) + 0.55, S(6) + 1.0); crack.children.forEach(m => m.visible = m.userData.i / 9 < cr);
    if (t > S(6) + 0.5) { st.red = 0.2 * r(t, S(6) + 0.5, S(6) + 0.8); st.shake = 0.7 * (1 - r(t, S(6) + 0.6, S(6) + 1.0)) * (t > S(6) + 0.55 ? 1 : 0); }
    K = camKeys([[T.E, V(-1.2, -1.4, 13.6), V(0, -2.0, 0), 40], [S(6) + 0.3, V(0.3, -1.5, 12.5), V(0, -1.6, -1), 40], [T.F, V(0.2, -1.5, 11.5), V(0, -1.4, -1.5), 40]], t);
    st.html += carsCard(t, wt(5, '15') - 0.3, S(6) + 0.3);
    st.html += pill(t, S(6) + 0.75, 'RACHOU!', V2(300, 520), 'red', V(-0.2, -1.0, PZ + 0.5));
  } else if (sh === 'F') { // concreto armado
    mats.wallT.opacity = lerp(1, 0.28, r(t, S(7) + 0.3, S(7) + 0.8)); mats.wallT.depthWrite = false;
    const g = eo(r(t, wt(7, 'barras'), wt(7, 'barras') + 1.0)); rebar.children.forEach((m, i) => { m.scale.y = Math.max(0.01, g); });
    K = camKeys([[T.F, V(0.2, -1.5, 11.5), V(0, -1.4, -1.5), 40], [T.G, V(2.2, -1.2, 10.5), V(0.4, -1.6, -1.3), 40]], t);
    st.html += pill(t, S(8) + 0.05, 'CONCRETO ARMADO', V2(540, 380), 'green', V(-WX, -0.6, -0.6));
  } else if (sh === 'G') { // a água
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const y = -1.8 - (i >> 1) * 0.35; const len = 0.9 * eo(r(t, wt(9, 'água') - 0.3 + i * 0.06, wt(9, 'água') + 0.2 + i * 0.06)); placeArrow(flowArrows[i], V(sx * 3.6, y, 0.12), V(-sx, 0.15, 0), len + 0.01); }
    K = camKeys([[T.G, ...CAM_B], [T.H, V(0.5, -2.2, 14.8), V(0, -2.6, 0), 40]], t);
    st.html += big(t, wt(9, 'água') - 0.1, 'O INIMIGO<br>É A ÁGUA', 360, '#7cc4ff', 110);
  } else if (sh === 'H') { // dreno
    const td = wt(10, 'cano') - 0.15; drain.scale.setScalar(1); drain.children.forEach((m, i) => { m.visible = t > td + (i % 40) * 0.012; });
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const k = ((t * 0.8 + i * 0.17) % 1); placeArrow(flowArrows[i], V(sx * (2.9 - k * 0.6), -1.4 - k * 1.0, 0.12), V(-sx * 0.55, -1, 0), 0.55); }
    K = camKeys([[T.H, V(0.5, -2.2, 14.8), V(0, -2.6, 0), 40], [S(11) - 0.4, V(3.0, -2.2, 6.6), V(1.8, -2.7, -0.4), 40], [T.I, V(3.0, -2.3, 6.2), V(1.8, -2.7, -0.4), 40]], t);
    st.html += pill(t, S(11) + 0.05, 'DRENO', V2(330, 600), 'green', V(1.93, -2.72, -0.05));
  } else if (sh === 'I') { // água sem saída
    setWaterIn(0.42 * sm(r(t, S(12) + 0.4, E(12))));
    for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); placeArrow(flowArrows[i], V((i % 2 ? 1 : -1) * 1.9, -2.7, -0.5 - i * 0.6), V(i % 2 ? -1 : 1, 0.6, 0), 0.4 + k * 0.2); }
    K = camKeys([[T.I, V(0.3, -1.7, 11.5), V(0, -2.4, -1), 40], [T.J, V(0.6, -1.9, 10.5), V(0.3, -2.5, -1), 40]], t);
    st.html += pill(t, wt(12, 'água') + 0.2, 'PRA ONDE VAI?', V2(540, 420), 'orange');
  } else if (sh === 'J') { // poço + bomba com boia
    const ts = wt(13, 'poço') - 0.2; sump.visible = t > ts; sump.scale.setScalar(Math.max(0.01, xB(t, ts, 0.35))); sump.position.set(1.15 * (1 - sump.scale.x), -3.0 * (1 - sump.scale.y), -0.35 * (1 - sump.scale.z));
    const on = t > wt(13, 'bomba'); const lvl = on ? 0.42 * (1 - sm(r(t, wt(13, 'joga'), E(13)))) : 0.42; setWaterIn(lvl);
    sumpWater.visible = t > ts + 0.3; sumpWater.scale.y = 0.45; sumpWater.position.y = -3.45 + 0.225;
    floatBall.position.y = lerp(-3.25, -3.0, on ? 1 : r(t, ts + 0.3, ts + 0.8)); pump.position.x = on ? 1.15 + Math.sin(t * 60) * 0.006 : 1.15;
    setJet(t, on && t > wt(13, 'joga'));
    K = camKeys([[T.J, V(2.6, -2.2, 6.5), V(1.1, -2.9, -0.4), 40], [wt(13, 'joga') - 0.2, V(2.6, -2.0, 6.8), V(1.2, -2.8, -0.4), 40], [T.K, V(2.4, -0.6, 9.5), V(1.0, -1.2, -0.4), 40]], t);
    st.html += pill(t, wt(13, 'bomba') + 0.05, 'BOMBA', V2(300, 1060), '', V(1.15, -3.3, -0.2));
    st.html += pill(t, wt(13, 'boia') + 0.05, 'BOIA', V2(820, 1080), 'orange', V(1.28, -3.0, -0.25));
  } else if (sh === 'K') { // tempestade, gerador
    house.visible = true; house.position.set(0, 0, 0); house.rotation.set(0, 0, 0);
    scene.background = STORM; hemi.intensity = 0.6; sun.intensity = 0.7; setRain(t, true);
    const tl = wt(14, 'tempest'), tg = wt(14, 'gerador'); const lightning = t > tl && t < tl + 0.12 || t > tl + 0.25 && t < tl + 0.32;
    st.flash = (t > tl && t < tl + 0.2) ? 0.22 * (1 - r(t, tl, tl + 0.2)) : 0; const off = t > wt(14, 'acaba') && t < tg + 0.1; st.dark = off ? 0.35 : 0.1;
    gen.visible = t > tg - 0.15; gen.scale.setScalar(Math.max(0.01, xB(t, tg - 0.15, 0.35)));
    sumpWater.visible = true; sumpWater.scale.y = 0.45; sumpWater.position.y = -3.45 + 0.225;
    setWaterIn(off ? 0.3 * r(t, wt(14, 'acaba'), tg) : (t > tg ? 0.3 * (1 - r(t, tg + 0.3, E(14))) : 0)); pump.position.x = !off && t > tg ? 1.15 + Math.sin(t * 60) * 0.006 : 1.15; setJet(t, t > tg + 0.3);
    K = camKeys([[T.K, ...CAM_H], [T.L, V(-0.6, 0.2, 18.5), V(-0.4, -0.9, 0), 40]], t);
    st.html += pill(t, tg + 0.05, 'GERADOR', V2(250, 640), 'green', V(-3.0, 0.7, -1.5));
    if (off) st.html += pill(t, wt(14, 'acaba') + 0.1, 'SEM LUZ', V2(760, 560), 'red', null, tg);
  } else if (sh === 'L') { // esponja + manta
    const te = wt(15, 'esponja'); const wet = r(t, te - 0.2, te + 0.4) * (1 - r(t, wt(15, 'cobre'), wt(15, 'cobre') + 1.2));
    mats.wallT.color.set('#bdb8ae').lerp(new THREE.Color('#5d7f9e'), wet * 0.7);
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const k = ((t * 0.9 + i * 0.2) % 1); placeArrow(flowArrows[i], V(sx * (3.3 - k * 0.9), -0.8 - (i >> 1) * 0.6, 0.12), V(-sx, 0, 0), 0.45, wet > 0.05); }
    K = camKeys([[T.L, V(0.3, -1.5, 12.5), V(0, -1.6, -1), 40], [wt(15, 'cobre'), V(-2.2, -1.3, 10.5), V(-0.6, -1.5, -1.2), 40], [T.M, V(-2.6, -1.2, 10.0), V(-0.8, -1.5, -1.2), 40]], t);
    st.html += pill(t, wt(15, 'manta') + 0.05, 'MANTA ASFÁLTICA', V2(330, 520), '', V(-WX - 0.13, -1.2, -0.05), S(16) - 0.1);
    st.html += big(t, S(16) + 0.05, 'IMPERMEABILIZAÇÃO', 330, '#7dffa8', 84);
  } else if (sh === 'M') { // bomba que liga sozinha no prédio
    building.visible = true; carN.visible = true; carN.position.set(0.25, SLAB + 0.02, -1.75); carN.rotation.set(0, 0, 0); carN.scale.setScalar(0.92);
    lamps.visible = true; lampLight.intensity = 1.2; sumpWater.visible = true; sumpWater.scale.y = 0.45; sumpWater.position.y = -3.45 + 0.225;
    const run = Math.floor(t * 2) % 3 !== 2 || t > S(18); pump.position.x = 1.15 + Math.sin(t * 60) * 0.006; setJet(t, true);
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const k = ((t * 0.8 + i * 0.17) % 1); placeArrow(flowArrows[i], V(sx * (2.9 - k * 0.6), -1.6 - k * 0.9, 0.12), V(-sx * 0.55, -1, 0), 0.5, t > S(18) - 0.1); }
    K = camKeys([[T.M, V(0.4, 1.5, 24), V(0, 0.6, 0), 40], [S(17) + 1.8, V(0.5, -0.6, 15.5), V(0.2, -1.6, 0), 40], [T.N, V(1.6, -1.6, 9.5), V(0.8, -2.4, -0.5), 40]], t);
    st.html += pill(t, S(17) + 0.5, 'GARAGEM DO PRÉDIO', V2(540, 300), '');
    st.html += vrrr(t, wt(17, 'liga'), V(1.15, -3.0, -0.3));
    st.html += pill(t, wt(17, 'defeito') - 0.05, 'NÃO É DEFEITO', V2(760, 560), 'green');
    st.html += pill(t, S(18) + 0.4, 'ÁGUA DO CHÃO', V2(300, 820), '', V(-2.6, -2.0, 0.1));
  } else if (sh === 'N') { // escada, lâmpadas, vizinho
    house.visible = true; house.position.set(0, 0, 0); house.rotation.set(0, 0, 0);
    stairs.children.forEach((m, i) => { const k = xB(t, wt(19, 'escada') - 0.1 + i * 0.05, 0.3); m.visible = k > 0.02; m.scale.set(1, Math.max(0.01, k), 1); });
    const tl = wt(19, 'lâmp'); lamps.visible = t > tl; lampLight.intensity = t > tl ? 1.4 : 0;
    const tv = wt(19, 'vaga') - 0.1; carN.visible = t > tv; const cu = eo(r(t, tv, tv + 0.9)); carN.position.set(0.55, SLAB + 0.02, lerp(4.5, -1.75, cu)); carN.rotation.set(0, 0, 0); carN.scale.setScalar(0.85);
    K = camKeys([[T.N, V(0.5, -1.4, 12.5), V(0, -1.8, -1), 40], [T.O, V(0.9, -1.1, 13.2), V(0, -1.6, -1), 40]], t);
    st.html += pill(t, wt(19, 'escada') + 0.1, 'ESCADA', V2(260, 470), '', V(-0.5, -1.4, PZ + 0.9));
    st.html += pill(t, wt(19, 'vizinho') - 0.05, 'O CARRO DO VIZINHO', V2(720, 420), 'red', V(0.55, -1.6, -1.0));
  } else if (sh === 'O') { // parabéns
    house.visible = true; house.position.set(0, 0, 0); house.rotation.set(0, 0, 0); carN.visible = true; carN.position.set(0.55, SLAB + 0.02, -1.75); carN.scale.setScalar(0.85);
    lamps.visible = true; lampLight.intensity = 1.4; stairs.visible = true;
    const u = r(t, T.O, END); K = [0, V(Math.sin(u * 1.2) * 3, 0.6, 19.5 - u * 2), V(0, -0.8, -1), 40];
    st.html += big(t, wt(20, 'parab') - 0.05, 'PARABÉNS!', 230, '#FFD21F', 120);
    st.html += big(t, wt(20, 'constr') - 0.05, 'VOCÊ CONSTRUIU<br>UM SUBSOLO', 380, '#fff', 84);
    st.html += confetti(t, wt(20, 'parab'));
  }
  st.cam = K; return st;
}
function V2(x, y) { return { x, y }; }
function carsCard(t, t0, t1) { if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0, 0.4) * (1 - r(t, t1, t1 + 0.25));
  let ic = ''; for (let i = 0; i < 15; i++) { const s = back(r(t, t0 + 0.2 + i * 0.05, t0 + 0.45 + i * 0.05)); ic += `<svg width="96" height="56" viewBox="0 0 96 56" style="transform:scale(${s})"><path d="M10 34 L18 18 Q22 12 30 12 L62 12 Q70 12 76 18 L86 30 Q92 32 92 38 L92 44 L4 44 L4 38 Q4 34 10 34Z" fill="#ff7a1a"/><circle cx="24" cy="44" r="8" fill="#222"/><circle cx="72" cy="44" r="8" fill="#222"/><rect x="26" y="17" width="16" height="12" rx="2" fill="#bfe0ff"/><rect x="47" y="17" width="16" height="12" rx="2" fill="#bfe0ff"/></svg>`; }
  return `<div class="card" style="left:110px;top:150px;width:860px;padding:26px 30px 24px;text-align:center;transform-origin:50% 0;transform:scale(${k})">
   <div style="font-weight:800;font-size:38px;margin-bottom:12px">EMPURRÃO DA TERRA MOLHADA <span style="color:#ff7a1a">≈ 15 CARROS</span></div>
   <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px 10px">${ic}</div></div>`; }
function vrrr(t, t0, p) { if (t < t0) return ''; const a = scr(p); const k = back(r(t, t0, t0 + 0.3)); const w = Math.sin(t * 30) * 4;
  return `<div style="position:absolute;left:${a.x + 60}px;top:${a.y - 150}px;font-weight:900;font-size:58px;color:#FFD21F;transform:scale(${k}) rotate(${-8 + w * 0.4}deg);text-shadow:0 0 3px #000,0 4px 0 #000">VRRRR</div>`; }
function confetti(t, t0) { if (t < t0) return ''; let h = ''; const cols = ['#FFD21F', '#ff5a5a', '#3dd17a', '#4aa3ff', '#ff9a1f', '#fff'];
  for (let i = 0; i < 70; i++) { const u = t - t0; const x = (i * 157) % 1080 + Math.sin(u * 2 + i) * 30; const y = -40 + u * (260 + (i * 37) % 200) - 60 * ((i * 13) % 5); if (y < -40 || y > 1950) continue;
    h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${12 + i % 3 * 4}px;height:${22 - i % 3 * 4}px;background:${cols[i % 6]};transform:rotate(${u * 300 + i * 40}deg)"></div>`; }
  return h; }
// ---------- avatar no canto (igual ao vídeo de pavimentação) ----------
function avatarCorner(f) {
  const out = cl(1 - (f - window.F_END) / 8); if (out <= 0) return ''; const inS = springSim(f - 4, 12, 140); const m = mouthAt(f);
  return `<div style="position:absolute;left:50px;top:1515px;width:270px;height:270px;opacity:${out};transform:translateY(${-m * 5}px) rotate(${Math.sin(f / 23) * 2 + m * 1.5}deg) scale(${inS * (0.9 + 0.1 * out)})">
   <div style="width:270px;height:270px;box-sizing:border-box;border-radius:135px;overflow:hidden;background:#30343A;border:9px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${window.AV.svg(m, window.AV.blinkAt(f), Math.sin(f / 70) * 0.6)}</div></div>`;
}
// ---------- quadro ----------
window.renderFrame = f => {
  const t = f / FPS; const st = world(t); const K = st.cam;
  let p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.08; p.add(V(noise(t * 30) * a, noise(t * 37, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.04, Math.sin(t * 0.9) * 0.03, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -1.5); sun.position.set(5, 11, 7.5);
  R.render(scene, cam);
  canvas.style.filter = st.blur ? `blur(${st.blur}px)` : 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`
    + (st.red ? `<div style="position:absolute;inset:0;background:#c41010;opacity:${st.red};mix-blend-mode:multiply"></div>` : '')
    + (st.dark ? `<div style="position:absolute;inset:0;background:#000;opacity:${st.dark}"></div>` : '')
    + (st.flash ? `<div style="position:absolute;inset:0;background:#fff;opacity:${st.flash}"></div>` : '');
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 3.2, dist = 21) => {
  const t = S(20) + 0.3; world(t);
  cam.position.set(1.2, cy - 0.6, dist); cam.fov = 40; cam.up.set(0, 1, 0); cam.lookAt(V(0, cy, -1)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, 0); sun.position.set(5, 11, 9); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 34%,rgba(14,22,34,0) 52%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:290px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:36px;letter-spacing:5px;padding:12px 30px;border-radius:40px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:300px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:44px">#01</div>
   <div style="position:absolute;left:110px;right:80px;top:390px;font-family:InterD;font-weight:900;font-size:112px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Como um<br><span style="color:#8fd0ff">buraco</span> vira<br>um <span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">subsolo</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

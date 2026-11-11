// "A Torre Eiffel cresce no verão" — voice.wav 27,2 s + final (outro) até 29,5 s. 30 fps, 885 quadros.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 885, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 68, light: 'diaW' },
  { id: 'calor', a: 69, b: 140, light: 'dia' },
  { id: 'cresce', a: 141, b: 220, light: 'diaW' },
  { id: 'inverno', a: 221, b: 312, light: 'invW' },
  { id: 'tilt', a: 313, b: 474, light: 'diaW' },
  { id: 'folga', a: 475, b: 590, light: 'dia' },
  { id: 'respira', a: 591, b: 720, light: 'diaW' },
  { id: 'cta', a: 721, b: 815, light: 'dia' },
  { id: 'fim', a: 816, b: 884, light: 'fim' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;
const BASE = { fogNear: 120, fogFar: 1200, shadowExt: 9 };
const DIA = { ...BASE, az: 50, el: 55, sky: '#fff6e0', ground: '#7fbf5a', hemi: 1.2, sun: '#fff1d0', sunI: 2.2, fog: '#dff0ff', skyTop: '#4aa3f0', skyHor: '#cfe9ff', sat: 1.12, vig: 0.2 };
export const LIGHTS = {
  dia: DIA, diaW: { ...DIA, shadowExt: 48 },
  invW: { ...DIA, shadowExt: 48, az: 30, el: 28, sky: '#dfe9ff', ground: '#cfdcf0', hemi: 1.25, sun: '#e8f0ff', sunI: 1.5, fog: '#e6eefb', skyTop: '#9fb8dc', skyHor: '#eaf0fb', sat: 0.95 },
  fim: { ...DIA, shadowExt: 48, az: 20, el: 14, sky: '#ffd9b0', ground: '#a8b860', hemi: 1.0, sun: '#ffb070', sunI: 2.0, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffc99a', sat: 1.18, vig: 0.28 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

const PA = [-0.3, 0, 0.1], PB = [0.4, 0, -0.2];
const WIDE = (y0 = 13) => ({ pos: [0, y0, 34], look: [0, 16, -34], fov: 38 });
const CAMS = {
  hook: [{ f: 0, pos: [0, 8, 44], look: [0, 15, -34], fov: 40 }, { f: 68, pos: [0, 12, 34], look: [0, 16, -34], fov: 38 }],
  calor: [{ f: 69, pos: [0.05, 1.3, 4.0], look: [0.05, 2.0, 0], fov: 40 }, { f: 140, pos: [0.05, 1.35, 3.5], look: [0.05, 2.1, 0], fov: 40 }],
  cresce: [{ f: 141, ...WIDE(11) }, { f: 220, pos: [0, 14, 31], look: [0, 17, -34], fov: 37 }],
  inverno: [{ f: 221, ...WIDE(11) }, { f: 312, pos: [0, 13, 33], look: [0, 16, -34], fov: 38 }],
  tilt: [{ f: 313, pos: [0, 12, 36], look: [0, 16, -34], fov: 38 }, { f: 474, pos: [0, 14, 31], look: [0, 17, -34], fov: 37 }],
  folga: [{ f: 475, pos: [0.05, 1.3, 4.0], look: [0.05, 1.7, 0], fov: 38 }, { f: 590, pos: [0.05, 1.35, 3.5], look: [0.05, 1.7, 0], fov: 36 }],
  respira: [{ f: 591, ...WIDE(12) }, { f: 720, pos: [0, 14, 30], look: [0, 17, -34], fov: 36 }],
  cta: [{ f: 721, pos: [0.05, 1.3, 4.0], look: [0.05, 2.2, 0], fov: 40 }, { f: 815, pos: [0.05, 1.35, 3.5], look: [0.05, 2.2, 0], fov: 40 }],
  fim: [{ f: 816, pos: [0, 13, 36], look: [0, 15.5, -34], fov: 40 }, { f: 884, pos: [0, 13, 34.5], look: [0, 15.5, -34], fov: 39 }],
};
const KICKS = [{ f: 40, a: 0.03 }, { f: 188, a: 0.04 }, { f: 335, a: 0.03 }, { f: 826, a: 0.05 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = fl(69, 4, 0.35) + fl(141, 4, 0.35) + fl(221, 5, 0.5) + fl(313, 4, 0.35) + fl(475, 4, 0.35) + fl(591, 4, 0.35) + fl(721, 4, 0.35) + fl(816, 6, 0.6);
  const wide = ['hook', 'cresce', 'inverno', 'tilt', 'respira', 'fim'].includes(S.id);
  c.shadowAt = wide ? [0, 0, -12] : [0, 0, -0.3];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const isWide = (id) => ['hook', 'cresce', 'inverno', 'tilt', 'respira', 'fim'].includes(id);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (isWide(S.id)) return { focus: dist(C.pos, [0, 15, -34]), cinf: 0 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 7 };
};

export const worldAt = (f) => {
  const id = shotAt(f).id;
  let grow = 0, hat = 1, hatUp = 0, hatTip = 0, tilt = 0, vref = false, breath = 0, snow = false;
  if (id === 'hook') { grow = smooth(ramp(f, 26, 60)); hat = f >= 30 ? 1 : 0; hatUp = 7 * (1 - E.back(ramp(f, 30, 44))); }
  if (id === 'calor') grow = 1;
  if (id === 'cresce') grow = smooth(ramp(f, 148, 190));
  if (id === 'inverno') { grow = 1 - smooth(ramp(f, 238, 285)); hat = 2; snow = true; }
  if (id === 'tilt') { tilt = 0.05 * smooth(ramp(f, 335, 380)) * (1 - smooth(ramp(f, 452, 472))); vref = f >= 345 && f < 470; }
  if (id === 'respira') breath = 0.5 - 0.5 * Math.cos(2 * Math.PI * (f - 600) / 64) * (f > 600 ? 1 : 0);
  if (id === 'fim') { const t = ramp(f, 824, 836), u = ramp(f, 836, 848); hatTip = 0.55 * Math.sin(Math.PI * t) * (1 - u); hatUp = 1.6 * Math.sin(Math.PI * t) * (1 - u); grow = 0; }
  return { snow, grow, hat, hatUp, hatTip, tilt, vref, breath, clouds: id !== 'inverno' ? true : true };
};

const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (isWide(S.id)) return out;
  const a = (o) => out.push(R(T, 'civA', { seed: 61, ...life(f, 61), facing: 0, ...o }, PA));
  const b = (o) => out.push(R(T, 'civB', { seed: 62, ...life(f, 62), facing: 0, ...o }, PB));
  const wv = q(f * 0.3 % 6.283, 1);
  switch (S.id) {
    case 'calor': a({ expr: 'nervous', look: 0.3, L: 'hang', R: 'wave', wv }); b({ expr: 'shock', look: -0.2, L: 'hip', R: 'hip' }); break;
    case 'folga': a({ expr: 'smile', look: 0.2, L: 'hang', R: 'point' }); b({ expr: f > 540 ? 'laugh' : 'grin', look: -0.2, L: 'hip', R: 'hip' }); break;
    case 'cta': a({ expr: 'laugh', look: 0, L: 'up', R: 'wave', wv }); b({ expr: 'grin', look: 0, L: 'hip', R: 'wave', wv: q((f * 0.3 + 1) % 6.283, 1) }); break;
  }
  return out;
};

const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const sunCard = (p, mood) => {
  const cx = 300, cy = 500, Rr = 190;
  for (let i = 0; i < 14; i++) { const an = i * Math.PI * 2 / 14; p.stroke([[cx + Math.cos(an) * Rr * 1.12, cy + Math.sin(an) * Rr * 1.12], [cx + Math.cos(an) * Rr * 1.5, cy + Math.sin(an) * Rr * 1.5]], 28, '#ffae00'); }
  p.ell(cx, cy, Rr, Rr, '#ffd23f', 12);
  p.ell(cx - 110, cy + 50, 34, 22, '#ff9a7a', 0); p.ell(cx + 110, cy + 50, 34, 22, '#ff9a7a', 0);
  p.poly([[cx - 130, cy - 55], [cx - 20, cy - 55], [cx - 32, cy + 20], [cx - 118, cy + 20]], '#1b1b24', 9);
  p.poly([[cx + 20, cy - 55], [cx + 130, cy - 55], [cx + 118, cy + 20], [cx + 32, cy + 20]], '#1b1b24', 9);
  p.stroke([[cx - 20, cy - 42], [cx + 20, cy - 42]], 10);
  const sm = []; for (let k = 0; k <= 16; k++) { const an = 0.15 * Math.PI + k * 0.7 * Math.PI / 16; sm.push([cx + Math.cos(an) * 85, cy + 40 + Math.sin(an) * 62]); }
  p.stroke(sm, 12);
};
const thermo = (p, lv) => {
  const cx = 300; p.ell(cx, 780, 80, 80, '#e23b3b', 11);
  p.poly([[cx - 40, 250], [cx + 40, 250], [cx + 40, 760], [cx - 40, 760]], '#fff6f6', 11);
  p.ell(cx, 250, 40, 30, '#fff6f6', 11);
  const top = 760 - lv * 480; p.poly([[cx - 22, top], [cx + 22, top], [cx + 22, 790], [cx - 22, 790]], '#e23b3b', 0);
  for (let i = 0; i < 6; i++) p.stroke([[cx + 40, 300 + i * 80], [cx + 78, 300 + i * 80]], 8);
};
const plate = (p, lines, bg, fg, sizes) => {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(-0.06);
  const lh = sizes.map((z) => z * 1.3), h = lh.reduce((x, y) => x + y, 0) + 60;
  g.fillStyle = bg; g.strokeStyle = '#1a1030'; g.lineWidth = 12;
  g.beginPath(); g.roundRect(-280, -h / 2, 560, h, 40); g.fill(); g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = -h / 2 + 30; lines.forEach((t, i) => { g.font = `bold ${sizes[i]}px DejaVu Sans, sans-serif`; g.fillText(t, 0, y + lh[i] / 2); y += lh[i]; }); g.restore();
};
const gapCard = (p, ph) => {
  p.poly([[40, 470], [250, 470], [250, 560], [40, 560]], '#5b8fd9', 11); p.poly([[350 + ph, 470], [560, 470], [560, 560], [350 + ph, 560]], '#5b8fd9', 11);
  p.stroke([[262, 640], [338 + ph, 640]], 12); p.stroke([[262, 640], [290, 618]], 12); p.stroke([[262, 640], [290, 662]], 12); p.stroke([[338 + ph, 640], [310 + ph, 618]], 12); p.stroke([[338 + ph, 640], [310 + ph, 662]], 12);
  const g = p.g; g.save(); g.fillStyle = '#ffd23f'; g.strokeStyle = '#1a1030'; g.lineWidth = 10; g.beginPath(); g.roundRect(120, 330, 360, 110, 30); g.fill(); g.stroke();
  g.fillStyle = '#1a1030'; g.font = 'bold 84px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLGA', 300, 388); g.restore();
};
const snowCard = (p, f) => {
  const n = 70; for (let i = 0; i < n; i++) { const sx = (i * 97.3) % 600, sy = ((i * 61.7) + f * (4 + (i % 4))) % 1000, r = 3 + (i % 3) * 2; p.ell(sx + 20 * Math.sin(f * 0.05 + i), sy, r, r, '#ffffff', 0); }
};
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const wide = isWide(S.id);
  // Sol (fica no céu em todas as cenas de verão)
  if (S.id !== 'inverno' && S.id !== 'fim') {
    if (wide) out.push(FX('sunW', (p) => sunCard(p), [15, 38, -80], 9, { order: 1 }));
    else out.push(FX('sunC', (p) => sunCard(p), [3.2, 8.5, -16], 3.4, { order: 1 }));
  }
  if (S.id === 'fim') out.push(FX('sunF', (p) => sunCard(p), [-14, 12, -90], 12, { order: 1, alpha: 0.95 }));
  if (S.id === 'calor') { const lv = smooth(ramp(f, 72, 138)), k = Math.round(lv * 30); out.push(FX('th' + k, (p) => thermo(p, k / 30), [-0.55, 1.85, -0.8], 0.7, { order: 6 })); }
  if (S.id === 'cresce' && f >= 185) { const s = 4.4 * Math.max(E.back(ramp(f, 185, 198)), 0.001); out.push(FX('p15', (p) => plate(p, ['+15 cm'], '#ff2d2d', '#ffffff', [150]), [7.2, 15.5, -26], s, { order: 6 })); }
  if (S.id === 'inverno') { const k = f; out.push(FX('snow' + k, (p) => snowCard(p, k), [0, 16, -18], 16, { order: 6, alpha: 0.9 })); if (f >= 262) { const s = 4.2 * Math.max(E.back(ramp(f, 262, 275)), 0.001); out.push(FX('pv', (p) => plate(p, ['VOLTA AO', 'NORMAL'], '#5fb3ff', '#ffffff', [100, 100]), [7.2, 15.5, -26], s, { order: 6 })); } }
  if (S.id === 'tilt' && f >= 350 && f < 470) { const s = 4.0 * Math.max(E.back(ramp(f, 350, 362)), 0.001); out.push(FX('inc', (p) => plate(p, ['SE INCLINA', 'PRO LADO', 'DA SOMBRA'], '#ffd23f', '#1a1030', [84, 84, 84]), [-6.4, 13, -26], s, { order: 6 })); }
  if (S.id === 'folga') { const ph = q(26 * Math.sin(Math.min(1, ramp(f, 500, 540)) * Math.PI / 2), 0); const s = Math.max(E.back(ramp(f, 490, 505)), 0.001); out.push(FX('gap' + ph, (p) => gapCard(p, ph), [0, 1.35, -0.8], 0.9 * s, { order: 6 })); }
  if (S.id === 'respira' && f >= 606) { const ins = Math.floor((f - 606) / 32) % 2 === 0; out.push(FX(ins ? 'ins' : 'exp', (p) => plate(p, [ins ? 'INSPIRA' : 'EXPIRA'], ins ? '#5fd7a0' : '#ff9a5f', '#1a1030', [96]), [7.2, 15.5, -26], 4.2, { order: 6 })); }
  if (S.id === 'cta' && f >= 728) { const s = Math.max(E.back(ramp(f, 728, 742)), 0.001); out.push(FX('cta', (p) => plate(p, ['SEGUE A', 'PALITOLÂNDIA.IA'], '#ffd23f', '#1a1030', [96, 54]), [0, 1.8, -0.9], 0.85 * s, { order: 6 })); }
  if (S.id === 'fim' && f >= 826) {
    const s = Math.max(E.back(ramp(f, 826, 840)), 0.001); out.push(FX('logo', (p) => plate(p, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', '#1a1030', [60, 38]), [0, 4.6, 10], 4.0 * s, { order: 6 }));
    const t = q((f - 826) / 40, 2); out.push(FX('stars' + t, (p) => T.fxStars(p, t), [0, 16, -20], 12, { order: 6 }));
  }
  return out;
};

// "O Sol sumiu... e ninguém percebeu" — sincronizado com voice.wav (26,45 s, 30 fps, 795 quadros).
// Frases (quadros): "Se o Sol sumisse agora..." 3-103 | "É o tempo que a luz..." 109-217 | "Nesse intervalo, o céu... clara." 230-330 |
// "A própria gravidade viaja nessa velocidade" 342-421 | "então a Terra continuaria girando em volta do nada" 431-522 |
// "Acontece que, passados os oito minutos," 535-606 | "tudo escurece de uma vez" 610-653 | "E tem mais:" 665-690 | "o Sol que você vê agora já é o de oito minutos atrás" 693-783.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 795, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 108, light: 'dia' },
  { id: 'luz', a: 109, b: 229, light: 'espaco' },
  { id: 'parque2', a: 230, b: 341, light: 'dia' },
  { id: 'grav', a: 342, b: 534, light: 'espaco' },
  { id: 'parque3', a: 535, b: 609, light: 'dia' },
  { id: 'escuro', a: 610, b: 664, light: 'escuro' },
  { id: 'final', a: 665, b: 794, light: 'dia' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

const BASE = { fogNear: 90, fogFar: 900, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 50, el: 55, sky: '#fff6e0', ground: '#7fbf5a', hemi: 1.2, sun: '#fff1d0', sunI: 2.2, fog: '#dff0ff', skyTop: '#4aa3f0', skyHor: '#cfe9ff', sat: 1.12, vig: 0.2 },
  espaco: { ...BASE, fogNear: 300, fogFar: 1200, az: 70, el: 20, sky: '#9fb0e0', ground: '#222a50', hemi: 1.0, sun: '#ffffff', sunI: 1.6, fog: '#02030a', skyTop: '#01020a', skyHor: '#060a22', stars: 1, sat: 1.1, vig: 0.25 },
  escuro: { ...BASE, az: 60, el: 30, sky: '#7f95d6', ground: '#2a3a6a', hemi: 0.8, sun: '#a8c0ff', sunI: 1.0, fog: '#0a1238', skyTop: '#01020a', skyHor: '#0a1238', stars: 1, sat: 1.15, vig: 0.35 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- posições ----------
const SPX = 300, OCY = 3.6;
const PA = [-0.3, 0, 0.1], PB = [0.4, 0, -0.2];
const SUNP = [0.8, 6.2, -18];

const CAMS = {
  hook: [
    { f: 0, pos: [0.05, 1.4, 4.2], look: [0.5, 3.0, -8], fov: 40 },
    { f: 44, pos: [0.05, 1.4, 4.1], look: [0.6, 3.2, -8], fov: 39 },
    { f: 72, pos: [0.05, 1.3, 4.0], look: [0.05, 1.5, 0], fov: 36 },
    { f: 108, pos: [0.05, 1.32, 3.8], look: [0.05, 1.5, 0], fov: 35 },
  ],
  luz: [
    { f: 109, pos: [SPX, 5.0, 16], look: [SPX, 5.0, -6], fov: 40 },
    { f: 229, pos: [SPX, 5.0, 15], look: [SPX, 5.0, -6], fov: 38 },
  ],
  parque2: [
    { f: 230, pos: [0.05, 1.3, 4.0], look: [0.05, 1.5, 0], fov: 36 },
    { f: 341, pos: [0.05, 1.35, 3.6], look: [0.05, 1.55, 0], fov: 34 },
  ],
  grav: [
    { f: 342, pos: [SPX, 5.0, 16], look: [SPX, 5.0, -6], fov: 40 },
    { f: 424, pos: [SPX, 5.0, 16], look: [SPX, 5.0, -6], fov: 40 },
    { f: 436, pos: [SPX, OCY, 18], look: [SPX, OCY, -6], fov: 38 },
    { f: 534, pos: [SPX, OCY, 17], look: [SPX, OCY, -6], fov: 36 },
  ],
  parque3: [
    { f: 535, pos: [0.05, 1.35, 3.8], look: [0.05, 1.55, 0], fov: 34 },
    { f: 609, pos: [0.05, 1.4, 3.4], look: [0.05, 1.6, 0], fov: 32 },
  ],
  escuro: [
    { f: 610, pos: [0.1, 1.3, 3.7], look: [0.1, 2.4, -2], fov: 38 },
    { f: 664, pos: [0.1, 1.3, 3.4], look: [0.1, 2.8, -3], fov: 36 },
  ],
  final: [
    { f: 665, pos: [0.1, 1.4, 4.2], look: [0.6, 3.0, -8], fov: 40 },
    { f: 740, pos: [0.1, 1.5, 4.0], look: [0.7, 3.8, -10], fov: 38 },
    { f: 794, pos: [0.1, 1.5, 3.9], look: [0.7, 4.0, -10], fov: 36, roll: 2 },
  ],
};
const KICKS = [{ f: 48, a: 0.03 }, { f: 345, a: 0.03 }, { f: 610, a: 0.08 }, { f: 668, a: 0.03 }, { f: 700, a: 0.04 }];
export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = fl(109, 4, 0.4) + fl(230, 4, 0.4) + fl(342, 5, 0.6) + fl(535, 4, 0.4) + fl(610, 7, 0.9) + fl(665, 5, 0.7);
  c.shadowAt = S.id === 'luz' || S.id === 'grav' ? [SPX, 2, -6] : [0, 0, -0.3];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'luz' || S.id === 'grav') return { focus: dist(C.pos, C.look), cinf: 0 };
  if (S.id === 'hook' && f < 60) return { focus: dist(C.pos, SUNP), cinf: 0 };
  if (S.id === 'escuro' || S.id === 'final') return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 7 };
};

// ---------- estado do mundo ----------
export const worldAt = (f) => {
  const id = shotAt(f).id, space = id === 'luz' || id === 'grav';
  const sunS = id === 'luz' ? 1 : id === 'grav' ? 1 - smooth(ramp(f, 345, 352)) : 0;
  const ph = id === 'luz' && f >= 132 && f < 207 ? ramp(f, 132, 205) : -1;
  const lbl = id === 'luz' && f >= 208 ? ramp(f, 208, 220) : 0;
  const wave = id === 'grav' && f >= 352 && f < 424 ? 2 + 6.4 * ramp(f, 352, 420) : 0;
  const orb = id === 'grav' && f >= 431 ? ramp(f, 431, 441) : 0;
  const oa = id === 'grav' && f >= 431 ? -Math.PI / 2 + (f - 431) * 0.045 : null;
  return { ground: !space, sunS, photon: ph, lbl, wave, orbit: orb, orbitA: oa, clouds: !space && id !== 'escuro' };
};

// ---------- atores ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'luz' || S.id === 'grav') return out;
  const a = (o) => out.push(R(T, 'civA', { seed: 61, ...life(f, 61), facing: 0, ...o }, PA));
  const b = (o) => out.push(R(T, 'civB', { seed: 62, ...life(f, 62), facing: 0, ...o }, PB));
  switch (S.id) {
    case 'hook': a({ expr: 'smile', look: f < 48 ? 0.6 : 0.2, L: 'hang', R: 'hang' }); b({ expr: 'grin', look: f < 48 ? -0.4 : -0.1, L: 'hip', R: 'hang' }); break;
    case 'parque2': a({ expr: 'laugh', look: 0.2, L: 'hang', R: 'wave', wv: q(f * 0.25 % 6.283, 1) }); b({ expr: 'grin', look: -0.1, L: 'hip', R: 'hip' }); break;
    case 'parque3': a({ expr: f < 600 ? 'smile' : 'nervous', look: 0.2, L: 'hang', R: 'hang' }); b({ expr: f < 600 ? 'grin' : 'nervous', look: -0.1, L: 'hip', R: 'hip' }); break;
    case 'escuro': a({ expr: 'shock', look: 0.6, L: 'up', R: 'up' }); b({ expr: 'shock', look: -0.4, L: 'up', R: 'up' }); break;
    case 'final': a({ expr: f < 700 ? 'shock' : 'grin', look: 0.6, L: 'hang', R: 'point' }); b({ expr: f < 700 ? 'shock' : 'laugh', look: -0.4, L: 'hip', R: 'hip', tilt: f > 780 ? q(3 * Math.sin(f * 0.5), 1) : 0 }); break;
  }
  return out;
};

// ---------- efeitos 2D ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const sunCard = (p, mood, note) => {
  const cx = 300, cy = 500, Rr = 190;
  for (let i = 0; i < 14; i++) { const an = i * Math.PI * 2 / 14; p.stroke([[cx + Math.cos(an) * Rr * 1.12, cy + Math.sin(an) * Rr * 1.12], [cx + Math.cos(an) * Rr * 1.5, cy + Math.sin(an) * Rr * 1.5]], 28, '#ffae00'); }
  p.ell(cx, cy, Rr, Rr, '#ffd23f', 12);
  p.ell(cx - 110, cy + 50, 34, 22, '#ff9a7a', 0); p.ell(cx + 110, cy + 50, 34, 22, '#ff9a7a', 0);
  if (mood === 'cool') {
    p.poly([[cx - 130, cy - 55], [cx - 20, cy - 55], [cx - 32, cy + 20], [cx - 118, cy + 20]], '#1b1b24', 9);
    p.poly([[cx + 20, cy - 55], [cx + 130, cy - 55], [cx + 118, cy + 20], [cx + 32, cy + 20]], '#1b1b24', 9);
    p.stroke([[cx - 20, cy - 42], [cx + 20, cy - 42]], 10);
  } else {
    const arc = (x) => { const pts = []; for (let k = 0; k <= 12; k++) { const an = Math.PI + k * Math.PI / 12; pts.push([x + Math.cos(an) * 34, cy - 20 + Math.sin(an) * 30]); } return pts; };
    p.stroke(arc(cx - 70), 12); p.dot(cx + 70, cy - 22, 15);
  }
  const sm = []; for (let k = 0; k <= 16; k++) { const an = 0.15 * Math.PI + k * 0.7 * Math.PI / 16; sm.push([cx + Math.cos(an) * 85, cy + 40 + Math.sin(an) * 62]); }
  p.stroke(sm, 12);
  if (note) { const g = p.g; g.save(); g.translate(cx + 20, cy + 235); g.rotate(-0.12); g.fillStyle = '#fff6a0'; g.strokeStyle = '#241726'; g.lineWidth = 9;
    g.fillRect(-170, -95, 340, 190); g.strokeRect(-170, -95, 340, 190); g.fillStyle = '#241726'; g.font = 'bold 84px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('8 MIN', 0, -34); g.fillText('ATRÁS', 0, 46); g.restore(); }
};
const watchCard = (p, deg) => {
  const cx = 300, cy = 500;
  p.stroke([[cx, cy - 150], [cx, cy - 205]], 24, '#3a3a46'); p.ell(cx, cy, 160, 160, '#f6f2e6', 11);
  if (deg > 2) { const pts = [[cx, cy]]; for (let k = 0; k <= Math.max(2, Math.round(deg / 6)); k++) { const an = -Math.PI / 2 + Math.min(deg, 360) * (k / Math.max(2, Math.round(deg / 6))) * Math.PI / 180; pts.push([cx + Math.cos(an) * 138, cy + Math.sin(an) * 138]); } p.poly(pts, '#ff6a5a', 0); }
  for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; p.stroke([[cx + Math.cos(an) * 142, cy + Math.sin(an) * 142], [cx + Math.cos(an) * 122, cy + Math.sin(an) * 122]], 7); }
  const ha = -Math.PI / 2 + Math.min(deg, 360) * Math.PI / 180; p.stroke([[cx, cy], [cx + Math.cos(ha) * 118, cy + Math.sin(ha) * 118]], 12); p.dot(cx, cy, 14);
};
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  // Sol de óculos: some com "puff" no gancho; volta no final com recado
  if (S.id === 'hook' && f < 54) { const s = 4 * (1 - E.smooth(ramp(f, 46, 53))); if (s > 0.02) out.push(FX('sunCool', (p) => sunCard(p, 'cool', false), SUNP, s, { order: 3 })); }
  if (S.id === 'hook' && f >= 48 && f < 66) { const t = q((f - 48) / 18, 2); out.push(FX('puff' + t, (p) => T.fxPuff(p, t), [SUNP[0], SUNP[1] - 2.2, SUNP[2] + 1], 4, { order: 6 })); }
  if (S.id === 'final' && f >= 668) {
    const s = 4 * Math.max(E.back(ramp(f, 668, 682)), 0.001), mood = f >= 765 ? 'wink' : 'cool', note = f >= 700;
    out.push(FX('sun' + mood + note, (p) => sunCard(p, mood, note), SUNP, s, { order: 3 }));
  }
  // cronômetro de 8 minutos (começa no sumiço do Sol, completa no escuro)
  if (['hook', 'parque2', 'parque3'].includes(S.id) && f >= 56) {
    const deg = q(360 * ramp(f, 56, 609), 0), s = 0.8 * Math.max(E.back(ramp(f, 56, 70)), 0.001);
    out.push(FX('watch' + Math.round(deg / 3), (p) => watchCard(p, deg), [0.05, 1.35, -0.8], s, { order: 6 }));
  }
  // puff no espaço quando o Sol some de novo
  if (S.id === 'grav' && f >= 345 && f < 363) { const t = q((f - 345) / 18, 2); out.push(FX('spuff' + t, (p) => T.fxPuff(p, t), [SPX, 6.9, -4.5], 3.2, { order: 6 })); }
  return out;
};

// Parece Mentira #11 — tiranossauro x estegossauro. Voz 29,0 s + final até 32,0 s (960 quadros).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 960, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 145, light: 'dia' },
  { id: 'stego', a: 146, b: 244, light: 'dia' },
  { id: 'trex', a: 245, b: 320, light: 'dia' },
  { id: 'conta', a: 321, b: 420, light: 'dia' },
  { id: 'museu', a: 421, b: 526, light: 'dia' },
  { id: 'virada', a: 527, b: 650, light: 'dia' },
  { id: 'cta', a: 651, b: 874, light: 'dia' },
  { id: 'fim', a: 875, b: 959, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 45, el: 50, sky: '#fff6e8', ground: '#c9b890', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a89870', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const L1 = [-0.48, 0, 0.1], R1 = [0.52, 0, -0.1];
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CW_ = { pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 40 }, CW2 = { pos: [0.05, 1.5, 3.05], look: [0.05, 1.5, 0], fov: 40 };
const CAMS = {
  hook: [{ f: 0, pos: [0.1, 1.6, 6.2], look: [0.6, 2.6, -8], fov: 44 }, { f: 145, pos: [0.05, 1.5, 5.0], look: [0.4, 2.3, -6], fov: 42 }],
  stego: [{ f: 146, ...CW_ }, { f: 244, ...CW2 }],
  trex: [{ f: 245, ...CW_ }, { f: 320, ...CW2 }],
  conta: [{ f: 321, ...CL }, { f: 420, ...CL2 }],
  museu: [{ f: 421, pos: [0.05, 1.5, 3.6], look: [0.05, 1.5, 0], fov: 42 }, { f: 526, pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 42 }],
  virada: [{ f: 527, ...CW_ }, { f: 650, ...CW2 }],
  cta: [{ f: 651, ...CL }, { f: 874, ...CL2 }],
  fim: [{ f: 875, pos: [0.05, 1.6, 6.5], look: [0.4, 3.0, -14], fov: 44 }, { f: 959, pos: [0.05, 1.6, 6.0], look: [0.4, 2.9, -14], fov: 43 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: [] });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, 0.3), 0);
  c.shadowAt = [0, 0, -0.5];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'stego' || S.id === 'trex' || S.id === 'virada' || S.id === 'museu') return { focus: dist(C.pos, [0.05, 1.5, 0.6]), cinf: 8 };
  if (S.id === 'hook' || S.id === 'fim') return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
};
export const worldAt = (f) => ({ brL: 0, brR: 0, brE: 0, landY: 7, flame: 0, flag: 0, signY: 10, clouds: true, board: false, museum: false, pyr: false });

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'hook': P('inventor', 91, { expr: 'grin', look: 0.3, L: 'hip', R: 'point' }, L1); P('amigo', 92, { expr: f > 40 ? 'shock' : 'smile', look: -0.3, L: 'hang', R: 'hip' }, R1); break;
    case 'conta': P('inventor', 91, { expr: f > 380 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 380 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'cta': { const point = f >= 745 && f < 805;
      P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('amigo', 92, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]); P('amigo', 92, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
  }
  return out;
};

const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
import * as PL from './placas.js';
const plate = PL.plate, K = '#1a1030';
const pop = (f, a, d = 12) => Math.max(E.back(ramp(f, a, a + d)), 0.001);
// linha do tempo: estegossauro 150, tiranossauro 66, hoje 0 (milhões de anos atrás), em escala
const tline = (p, t) => { const g = p.g; g.save(); g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 200, 572, 600, 40); g.fill(); g.stroke();
  const X = (m) => 95 + 410 * (150 - m) / 150, Y = 600;
  g.lineWidth = 14; g.beginPath(); g.moveTo(X(150), Y); g.lineTo(X(150) + (X(0) - X(150)) * t, Y); g.stroke();
  g.textAlign = 'center'; g.fillStyle = K; g.font = 'bold 34px DejaVu Sans, sans-serif'; g.fillText('MILHÕES DE ANOS ATRÁS', 300, 260);
  const mk = (m, col, txt) => { const x = X(m); g.fillStyle = col; g.beginPath(); g.arc(x, Y, 26, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = K; g.font = 'bold 48px DejaVu Sans, sans-serif'; g.fillText(m ? String(m) : 'HOJE', x, Y + 100); g.font = 'bold 28px DejaVu Sans, sans-serif'; g.fillText(txt, x, Y + 145); };
  const br = (a, b, txt, col) => { const x0 = X(a) + 10, x1 = X(b) - 10; g.strokeStyle = col; g.lineWidth = 10; g.beginPath(); g.moveTo(x0, Y - 40); g.lineTo(x0, Y - 60); g.lineTo(x1, Y - 60); g.lineTo(x1, Y - 40); g.stroke(); g.fillStyle = col; g.font = 'bold 46px DejaVu Sans, sans-serif'; g.fillText(txt, (x0 + x1) / 2, Y - 80); g.strokeStyle = K; };
  mk(150, '#7fb0d8', 'ESTEGO'); if (t > 0.5) mk(66, '#5aa848', 'T. REX'); if (t > 0.95) mk(0, '#ffd23f', 'VOCÊ');
  if (t > 0.5) br(150, 66, '84', '#e0453a'); if (t > 0.95) br(66, 0, '66', '#2f9a58');
  g.save(); g.translate(X(150), 470); g.scale(0.22, 0.22); g.translate(-300, -600); PL.stego(p, 0); g.restore();
  if (t > 0.5) { g.save(); g.translate(X(66), 455); g.scale(0.2, 0.2); g.translate(-300, -560); PL.trex(p, 0); g.restore(); }
  g.restore(); };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  const tt = q(f * 0.12 % 6.283, 1);
  switch (S.id) {
    case 'hook': if (f < 80) { st('h1', 8, [-0.2, 1.75, -0.8], 1.35, ['TIRANOSSAURO'], '#5aa848', '#fff', [54], -0.06); st('h2', 40, [0.3, 1.2, -0.9], 1.35, ['ESTEGOSSAURO'], '#7fb0d8', K, [54], 0.06); }
      else st('esc', 80, [0.03, 1.62, -0.6], 0.95, [['CONHECEU', '#fff'], ['OU NÃO?', '#ffd23f'], ['COMENTA!', '#fff']], '#2f6fb2', '#fff', [80, 96, 66]); break;
    case 'stego': out.push(FX('stg' + tt, (p) => PL.stego(p, tt), [0.0, 0.3, 0.0], 0.8 * pop(f, 147, 10)));
      st('150', 152, [0.05, 1.6, 0.4], 0.5, ['ESTEGOSSAURO', '150 MILHÕES', 'DE ANOS'], '#7fb0d8', K, [54, 64, 50], -0.04); break;
    case 'trex': out.push(FX('trx' + tt, (p) => PL.trex(p, tt), [0.0, 0.28, 0.0], 0.82 * pop(f, 246, 10)));
      st('66', 250, [0.05, 1.62, 0.4], 0.5, ['TIRANOSSAURO', '66 MILHÕES', 'DE ANOS'], '#5aa848', '#fff', [54, 64, 50], 0.04); break;
    case 'conta': { const stage = f < 326 ? 0 : f < 338 ? 1 : f < 350 ? 2 : 3; if (stage) {
      const lines = [['150', '#5b8fbf'], ['− 66', '#3f8f3c'], ['= 84 MILHÕES', '#e0453a']].slice(0, stage), sizes = [120, 120, 66].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 326, 10))); }
      if (f >= 385) st('dif', 385, [0.03, 0.55, 0.6], 0.55, ['DE DIFERENÇA!'], '#ffd23f', K, [64], -0.08); break; }
    case 'museu': out.push(FX('fos', (p) => PL.stego(p, 0, true), [0.3, 0.15, -0.6], 0.62 * pop(f, 422, 10)));
      st('mus', 428, [0.3, 1.85, -0.5], 0.4, ['MUSEU'], '#ffd23f', K, [110], 0.03);
      if (f >= 462) out.push(FX('tro' + tt, (p) => PL.trex(p, tt, true), [-0.3, 0.3, 0.6], 0.48 * pop(f, 462, 10)));
      st('fos2', 488, [-0.2, 1.38, 0.8], 0.3, ['JÁ ERA', 'FÓSSIL!'], '#e0453a', '#fff', [70, 90], -0.06); break;
    case 'virada': { const t = q(ramp(f, 536, 600), 2);
      out.push(FX('tl' + t, (p) => tline(p, t), [0.05, 0.55, 0.6], 0.58 * pop(f, 530, 10)));
      if (f >= 606) st('perto', 606, [0.05, 1.4, 0.75], 0.38, ['MAIS PERTO', 'DE VOCÊ!'], '#2f9a58', '#fff', [70, 76], -0.05); break; }
    case 'cta':
      if (f < 744) st('c0', 654, [0.03, 1.62, -0.6], 0.95, [['NO PRÓXIMO:', '#fff'], ['NINTENDO', '#ffd23f'], ['OU AVIÃO:', '#fff'], ['QUEM VEIO', '#ffd23f'], ['PRIMEIRO?', '#ffd23f']], '#2f9a58', '#fff', [52, 64, 54, 50, 54]);
      else if (f < 805) st('c2', 747, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [50, 66]);
      else st('c3', 807, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 879, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 883) { const t = q(((f - 883) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

// "O isqueiro é mais velho que o fósforo" — voz 28,3 s + final até 30,8 s (30 fps, 925 quadros).
// Frases: gancho 3-73 | 1823 86-170 | 1826 183-264 | 3 anos 278-316 | garrafa 329-408 | ácido 414-444 | bolso 458-494 |
// sem querer 507-555 | farmacêutico/palito/fogo 565-668 (raspou ~590, palito ~606, fogo ~645) | comenta 680-723 | manda 729-773 | segue 787-839 | final 850-924.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 925, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 80, light: 'dia' },
  { id: 'isq', a: 81, b: 176, light: 'dia' },
  { id: 'fos', a: 177, b: 272, light: 'dia' },
  { id: 'conta', a: 273, b: 323, light: 'dia' },
  { id: 'garrafa', a: 324, b: 452, light: 'dia' },
  { id: 'bolso', a: 453, b: 502, light: 'dia' },
  { id: 'virada', a: 503, b: 676, light: 'dourada' },
  { id: 'cta', a: 677, b: 849, light: 'dia' },
  { id: 'fim', a: 850, b: 924, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 45, el: 50, sky: '#fff6e8', ground: '#a9a090', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a89870', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const L1 = [-0.5, 0, 0.1], R1 = [0.55, 0, -0.1], BACK = [0.05, 0, -1.3];
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CAMS = {
  hook: [{ f: 0, pos: [0.1, 1.6, 5.4], look: [0.05, 1.7, -3], fov: 42 }, { f: 80, pos: [0.05, 1.5, 4.6], look: [0.05, 1.6, -3], fov: 41 }],
  isq: [{ f: 81, pos: [0.3, 1.45, 1.9], look: [0.07, 1.12, -0.75], fov: 38 }, { f: 176, pos: [0.12, 1.4, 1.55], look: [0.07, 1.14, -0.75], fov: 36 }],
  fos: [{ f: 177, pos: [0.3, 1.5, 3.4], look: [0.4, 1.7, 0], fov: 38 }, { f: 272, pos: [0.3, 1.5, 3.0], look: [0.4, 1.7, 0], fov: 37 }],
  conta: [{ f: 273, ...CL }, { f: 323, ...CL2 }],
  garrafa: [{ f: 324, pos: [0.05, 1.55, 2.9], look: [0.05, 1.45, -1], fov: 40 }, { f: 452, pos: [0.05, 1.5, 2.4], look: [0.05, 1.4, -1], fov: 40 }],
  bolso: [{ f: 453, ...CL }, { f: 502, pos: [0.05, 1.5, 4.0], look: [0.05, 1.95, 0], fov: 40 }],
  virada: [{ f: 503, pos: [-0.3, 1.55, 2.9], look: [0.05, 1.45, -1], fov: 40 }, { f: 676, pos: [0.05, 1.5, 2.3], look: [0.05, 1.45, -1], fov: 39 }],
  cta: [{ f: 677, ...CL }, { f: 849, ...CL2 }],
  fim: [{ f: 850, pos: [0.05, 1.6, 6.5], look: [0.05, 3.2, -14], fov: 44 }, { f: 924, pos: [0.05, 1.6, 6.0], look: [0.05, 3.0, -14], fov: 43 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: [] });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, 0.3), 0) + fl(645, 6, 0.45);
  if (S.id === 'virada') c.roll = 3 * E.easeOut(ramp(f, 503, 524));
  c.shadowAt = [0, 0, -0.6];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'isq') return { focus: dist(C.pos, [0.07, 1.1, -0.73]), cinf: 6 };
  if (S.id === 'garrafa' || S.id === 'virada') return { focus: dist(C.pos, [0.05, 1.3, -0.9]), cinf: 5 };
  if (S.id === 'hook' || S.id === 'fim') return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
};
export const FIRE = 645, SCRAPE = 588;
export const worldAt = (f) => { const S = shotAt(f); return { fax: true, lamp: S.id !== 'virada' && S.id !== 'bolso', pharm: S.id === 'virada' }; };

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1), ft = q(f * 0.5 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'hook': P('inventor', 91, { expr: f > 30 ? 'grin' : 'smile', look: 0.3, L: 'hip', R: 'point' }, [-0.62, 0, -0.2]); P('amigo', 92, { expr: f > 52 ? 'shock' : 'smile', look: -0.3, L: 'hang', R: 'up', holdR: 'match', holdRot: 0.15 }, [0.7, 0, -0.3]); break;
    case 'isq': break;
    case 'fos': { const lit = f >= 236; P('amigo', 92, { expr: lit ? 'shock' : 'grin', look: -0.4, L: 'point', R: 'hip' }, [0.62, 0, -0.1]); break; }
    case 'conta': P('inventor', 91, { expr: f > 300 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 300 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'garrafa': P('inventor', 91, { expr: f > 414 ? 'nervous' : 'grin', look: 0.1, L: 'hip', R: f > 414 ? 'up' : 'point' }, BACK); break;
    case 'bolso': { const jig = q(Math.sin(f * 0.9) * 6, 0);
      P('inventor', 91, { expr: 'nervous', look: 0.3, L: 'belly', R: 'lift', holdR: 'lamp', holdRot: 0.05 * Math.sign(jig), holdDy: jig }, [-0.4, 0, 0.1]);
      P('amigo', 92, { expr: f > 466 ? 'laugh' : 'grin', look: -0.4, L: 'hip', R: 'point' }, R1); break; }
    case 'virada': { const scr = f >= SCRAPE && f < SCRAPE + 14, lit = f >= FIRE;
      const rot = lit ? -0.2 : scr ? q(-0.4 + 1.6 * ramp(f, SCRAPE, SCRAPE + 14), 2) : q(0.25 * Math.sin(f * 0.25), 2);
      P('farmaceutico', 94, { expr: lit ? 'shock' : f > 530 ? 'grin' : 'smile', look: 0.2, L: 'hip', R: lit ? 'up' : 'point', holdR: 'stick', holdRot: rot, flame: lit ? 1 : 0, ft }, [-0.25, 0, -1.3]); break; }
    case 'cta': { const point = f >= 729 && f < 785;
      P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('amigo', 92, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]); P('amigo', 92, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
  }
  return out;
};

const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
const plate = (p, lines, bg, fg, sizes, rot = -0.05) => {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(rot);
  const lh = sizes.map((z) => z * 1.25), h = lh.reduce((x, y) => x + y, 0) + 60;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(-272, -h / 2 + 14, 560, h, 40); g.fill();
  g.fillStyle = bg; g.strokeStyle = '#1a1030'; g.lineWidth = 12; g.beginPath(); g.roundRect(-284, -h / 2, 560, h, 40); g.fill(); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = -h / 2 + 30; lines.forEach((t, i) => { const [txt, col] = Array.isArray(t) ? t : [t, fg]; g.fillStyle = col; g.font = `bold ${sizes[i]}px DejaVu Sans, sans-serif`; g.fillText(txt, -4, y + lh[i] / 2); y += lh[i]; }); g.restore();
};
const pop = (f, a, d = 12) => Math.max(E.back(ramp(f, a, a + d)), 0.001);
const K = '#1a1030';
// fósforo gigante (palito + cabeça vermelha) com chama
const fireAt = (p, x, y, s, t) => p.g && (() => { const g = p.g; g.save(); g.translate(x, y); g.scale(s * (1 + 0.07 * Math.sin(t * 7)), s * (1 + 0.1 * Math.cos(t * 9)));
  const tear = (w, h, col, lw) => { g.beginPath(); g.moveTo(0, -h); g.bezierCurveTo(w * 0.5, -h * 0.4, w, 0, w * 0.7, h * 0.32); g.quadraticCurveTo(0, h * 0.62, -w * 0.7, h * 0.32); g.bezierCurveTo(-w, 0, -w * 0.5, -h * 0.4, 0, -h); g.closePath(); g.fillStyle = col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = K; g.stroke(); } };
  tear(70, 160, '#ff8a1f', 10); tear(40, 95, '#ffd23f', 0); tear(18, 45, '#fff6d0', 0); g.restore(); })();
const matchBig = (p, lit, t) => { const g = p.g; g.save(); g.translate(300, 600); g.rotate(-0.35); g.lineWidth = 12; g.strokeStyle = K;
  g.fillStyle = '#e9cf9a'; g.beginPath(); g.roundRect(-26, -200, 52, 420, 10); g.fill(); g.stroke();
  g.fillStyle = '#c8282b'; g.beginPath(); g.ellipse(0, -230, 46, 62, 0, 0, 7); g.fill(); g.stroke();
  if (lit) fireAt(p, 0, -330, 0.9, t); g.restore(); };
// placa de aviso de ácido
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], ft = q(f * 0.5 % 6.283, 1);
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  const fire = (key, pos, s) => out.push(FX(key + ft, (p) => fireAt(p, 300, 900, 1, ft), pos, s));
  switch (S.id) {
    case 'hook': if (f < 26) st('h0', -12, [0.05, 1.45, -0.9], 1.3, ['O QUE VEIO', 'PRIMEIRO?'], '#fff', K, [78, 78], -0.03);
      else { st('h1', 30, [-0.35, 2.25, -0.9], 0.95, ['FÓSFORO'], '#e0453a', '#fff', [92], -0.06); st('h2', 52, [0.45, 1.75, -1.0], 0.95, ['ISQUEIRO'], '#2f6fb2', '#fff', [86], 0.06); } break;
    case 'isq': fire('lf', [0.22, 1.25, -0.73], 0.17); st('1823', 140, [0.0, 1.02, -0.45], 0.36, ['ISQUEIRO', '1823'], '#2f6fb2', '#fff', [64, 150]); break;
    case 'fos': out.push(FX('mb' + (f >= 236 ? ft : ''), (p) => matchBig(p, f >= 236, ft), [0.02, 0.72, -0.6], 0.62 * pop(f, 182)));
      st('1826', 240, [0.25, 1.75, -0.6], 0.7, ['FÓSFORO', '1826'], '#e0453a', '#fff', [70, 150], 0.05); break;
    case 'conta': { const stage = f < 278 ? 0 : f < 290 ? 1 : f < 302 ? 2 : 3; if (stage) {
      const lines = [['1826', '#e0453a'], ['− 1823', '#2f6fb2'], ['= 3 ANOS', '#2f9a58']].slice(0, stage), sizes = [110, 110, 90].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 278, 10))); } break; }
    case 'garrafa': fire('gf', [0.22, 1.25, -0.73], 0.17);
      if (f < 414) st('g1', 380, [-0.3, 1.55, -0.6], 0.45, ['DO TAMANHO DE', 'UMA GARRAFA'], '#fff', K, [52, 60], -0.04);
      else st('g2', 416, [-0.3, 1.55, -0.6], 0.45, ['ÁCIDO', 'DENTRO!'], '#ffd23f', K, [84, 84], -0.05); break;
    case 'bolso': st('b1', 458, [0.03, 2.3, -0.6], 0.8, ['NO BOLSO?!'], '#e0453a', '#fff', [74], 0.04); break;
    case 'virada': if (f < 560) st('v1', 512, [0.18, 1.6, -0.8], 0.55, ['SEM', 'QUERER!'], '#ffd23f', K, [90, 90], 0.05);
      else if (f < FIRE) st('v2', 604, [0.18, 1.6, -0.8], 0.55, ['UM PALITO!'], '#fff', K, [70], 0.05);
      else { st('v3', FIRE + 2, [0.18, 1.6, -0.8], 0.55, ['FOGO!'], '#e0453a', '#fff', [130], -0.06); }
      if (f >= SCRAPE && f < SCRAPE + 16) { const t = q((f - SCRAPE) / 16, 2); out.push(FX('dz' + t, (p) => T.fxDust(p, t, '#f4e2b0'), [-0.45, 0.85, -1.0], 0.3)); } break;
    case 'cta':
      if (f < 727) st('c1', 682, [0.03, 1.62, -0.6], 0.95, ['COMENTA AÍ', 'SE VOCÊ SABIA!'], '#ffd23f', K, [80, 60]);
      else if (f < 785) st('c2', 731, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [56, 72]);
      else st('c3', 789, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 855, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 859) { const t = q(((f - 859) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

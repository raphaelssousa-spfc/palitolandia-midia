// Parece Mentira #12 — Nintendo x avião. Voz 29,2 s + final até 32,0 s (960 quadros).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 960, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 158, light: 'dia' },
  { id: 'cartas', a: 159, b: 302, light: 'dia' },
  { id: 'aviao', a: 303, b: 466, light: 'dia' },
  { id: 'conta', a: 467, b: 517, light: 'dia' },
  { id: 'baralho', a: 518, b: 602, light: 'dia' },
  { id: 'virada', a: 603, b: 667, light: 'dia' },
  { id: 'cta', a: 668, b: 874, light: 'dia' },
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
  hook: [{ f: 0, pos: [0.1, 1.6, 6.2], look: [0.6, 2.6, -8], fov: 44 }, { f: 158, pos: [0.05, 1.5, 5.0], look: [0.4, 2.3, -6], fov: 42 }],
  cartas: [{ f: 159, ...CW_ }, { f: 302, ...CW2 }],
  aviao: [{ f: 303, ...CW_ }, { f: 466, ...CW2 }],
  conta: [{ f: 467, ...CL }, { f: 517, ...CL2 }],
  baralho: [{ f: 518, ...CL }, { f: 602, ...CL2 }],
  virada: [{ f: 603, ...CW_ }, { f: 667, ...CW2 }],
  cta: [{ f: 668, ...CL }, { f: 874, ...CL2 }],
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
  if (S.id === 'cartas' || S.id === 'aviao' || S.id === 'virada') return { focus: dist(C.pos, [0.05, 1.5, 0.6]), cinf: 8 };
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
    case 'conta': P('inventor', 91, { expr: f > 488 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 488 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'baralho': P('inventor', 91, { expr: f > 560 ? 'laugh' : 'grin', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: 'snore', blink: 1, look: -0.2, L: 'hang', R: 'hang' }, R1); break;
    case 'cta': { const point = f >= 755 && f < 814;
      P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('amigo', 92, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]); P('amigo', 92, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
  }
  return out;
};

const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
import * as PL from './placas.js';
const plate = PL.plate, K = '#1a1030';
const pop = (f, a, d = 12) => Math.max(E.back(ramp(f, a, a + d)), 0.001);
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  const tt = q(f * 0.12 % 6.283, 1), tp = q(f * 0.9 % 6.283, 1);
  switch (S.id) {
    case 'hook': if (f < 84) { st('h1', 8, [-0.2, 1.75, -0.8], 1.35, ['NINTENDO'], '#e0453a', '#fff', [70], -0.06); st('h2', 40, [0.3, 1.2, -0.9], 1.35, ['AVIÃO'], '#7fb0d8', K, [70], 0.06); }
      else st('esc', 84, [0.03, 1.62, -0.6], 0.95, [['QUAL VEIO', '#fff'], ['PRIMEIRO?', '#ffd23f'], ['COMENTA!', '#fff']], '#2f6fb2', '#fff', [70, 84, 66]); break;
    case 'cartas': out.push(FX('han' + tt, (p) => PL.hanafuda(p, tt), [0.0, 0.25, 0.0], 0.85 * pop(f, 160, 10)));
      st('1889', 166, [0.05, 1.62, 0.4], 0.5, ['NINTENDO', '1889', 'CARTAS DE BARALHO'], '#e0453a', '#fff', [56, 100, 38], -0.04); break;
    case 'aviao': { const dx = q(-0.12 + 0.24 * ramp(f, 303, 466), 2);
      out.push(FX('avi' + tp + dx, (p) => PL.biplane(p, tp), [dx, 0.75, 0.0], 1.05 * pop(f, 304, 10)));
      st('1903', 310, [-0.18, 1.62, 0.4], 0.42, ['AVIÃO', '1903'], '#7fb0d8', K, [60, 100], -0.05);
      st('1906', 381, [0.15, 0.62, 0.6], 0.36, ['14-BIS', '1906'], '#2f9a58', '#fff', [60, 100], 0.05); break; }
    case 'conta': { const stage = f < 470 ? 0 : f < 478 ? 1 : f < 488 ? 2 : 3; if (stage) {
      const lines = [['1903', '#5b8fbf'], ['− 1889', '#e0453a'], ['= 14 ANOS', '#2f9a58']].slice(0, stage), sizes = [110, 110, 80].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 470, 10))); } break; }
    case 'baralho': out.push(FX('hb' + tt, (p) => PL.hanafuda(p, tt), [0.03, 1.05, 0.5], 0.5 * pop(f, 519, 10)));
      out.push(FX('zz' + q((f % 45) / 45, 2), (p) => PL.zzz(p, q((f % 45) / 45, 2)), [0.66, 2.05, 0.2], 0.4));
      st('esp', 526, [0.03, 2.5, -0.6], 0.8, ['ESPERANDO', 'O AVIÃO...'], '#ffd23f', K, [64, 64], -0.04); break;
    case 'virada': out.push(FX('vh', (p) => PL.hanafuda(p, 0), [-0.28, 0.3, 0.2], 0.4 * pop(f, 604, 10)));
      out.push(FX('vb' + tp, (p) => PL.biplane(p, tp), [0.28, 0.5, 0.1], 0.55 * pop(f, 612, 10)));
      st('vir', 606, [0.05, 1.5, 0.6], 0.48, ['A NINTENDO É', ['MAIS VELHA', '#ffd23f'], 'QUE O AVIÃO!'], '#e0453a', '#fff', [56, 76, 62], -0.04); break;
    case 'cta':
      if (f < 755) st('c0', 671, [0.03, 1.62, -0.6], 0.95, [['NO PRÓXIMO:', '#fff'], ['HARVARD', '#ffd23f'], ['OU A GRAVIDADE', '#fff'], ['DE NEWTON?', '#ffd23f']], '#2f9a58', '#fff', [52, 70, 50, 60]);
      else if (f < 814) st('c2', 757, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [50, 66]);
      else st('c3', 816, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 879, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 883) { const t = q(((f - 883) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

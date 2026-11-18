// Verdade ou Mito #1 — túnel até o Banco Central (Fortaleza, 2005). Voz 28,5 s + logo até 30,8 s (925 quadros); fim = mesma cena do quadro 1 (loop).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 925, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 132, light: 'dia' },
  { id: 'filme', a: 133, b: 187, light: 'dia' },
  { id: 'loja', a: 188, b: 274, light: 'dia' },
  { id: 'susp', a: 275, b: 325, light: 'dia' },
  { id: 'virada', a: 326, b: 358, light: 'dia' },
  { id: 'tunel', a: 359, b: 495, light: 'dia' },
  { id: 'grana', a: 496, b: 575, light: 'dia' },
  { id: 'juiz', a: 576, b: 640, light: 'dia' },
  { id: 'cta', a: 641, b: 707, light: 'dia' },
  { id: 'praia', a: 708, b: 795, light: 'dia' },
  { id: 'segue', a: 796, b: 858, light: 'dia' },
  { id: 'fim', a: 859, b: 924, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 50, el: 50, sky: '#fff6e8', ground: '#7fb85a', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  quente: { ...BASE, az: 60, el: 52, sky: '#fff0d0', ground: '#d9b077', hemi: 1.2, sun: '#fff0cc', sunI: 2.3, fog: '#f3e2bf', skyTop: '#3f9be8', skyHor: '#f6e4c0', sat: 1.15, vig: 0.2 },
  poente: { ...BASE, az: 75, el: 16, sky: '#ffcf9e', ground: '#8a5a48', hemi: 1.0, sun: '#ff9a5a', sunI: 2.2, fog: '#e88a6a', skyTop: '#5a3f8a', skyHor: '#ff9a6a', sat: 1.2, vig: 0.32 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a8b860', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light], shadowExt: 9 });
const L1 = [-0.48, 0, 0.1], R1 = [0.52, 0, -0.1], C1 = [0.02, 0, -0.6];
const FLY = { pos: [0.05, 1.8, 5.6], look: [0.05, 2.6, -6], fov: 46 }, FLY2 = { pos: [0.05, 1.8, 5.0], look: [0.05, 2.5, -6], fov: 44 };
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CA = { pos: [0.03, 2.0, 5.0], look: [0.03, 2.0, -0.4], fov: 41 }, CB = { pos: [0.03, 2.0, 5.0], look: [0.03, 2.0, -0.4], fov: 39 };
const CAMS = {
  hook: [{ f: 0, ...CA }, { f: 132, ...CB }],
  filme: [{ f: 133, ...CL }, { f: 187, ...CL2 }],
  loja: [{ f: 188, ...CA }, { f: 274, ...CB }],
  susp: [{ f: 275, ...CL2 }, { f: 325, pos: [0.05, 1.55, 3.2], look: [0.05, 2.0, 0], fov: 40 }],
  virada: [{ f: 326, ...CL }, { f: 358, ...CL2 }],
  tunel: [{ f: 359, ...CA }, { f: 495, ...CB }],
  grana: [{ f: 496, ...CA }, { f: 575, ...CB }],
  juiz: [{ f: 576, ...CL }, { f: 640, ...CL2 }],
  cta: [{ f: 641, ...CL2 }, { f: 707, ...CL }],
  praia: [{ f: 708, ...CA }, { f: 795, ...CB }],
  segue: [{ f: 796, ...CL }, { f: 858, ...CL2 }],
  fim: [{ f: 859, ...CB }, { f: 924, ...CA }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: [] });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, 0.3), 0);
  c.shadowAt = [0, 0, -0.3];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f);
  if (['hook','loja','tunel','grana','praia','fim'].includes(S.id)) return { focus: dist(C.pos, [0, 2, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 }; };
export const worldAt = (f) => ({ pyrS: 1, scaf: false });

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'filme': P('amigo', 71, { expr: 'laugh', look: 0.3, L: 'hip', R: 'point' }, L1); P('civB', 72, { expr: 'grin', look: -0.3, L: 'hang', R: 'hip' }, R1); break;
    case 'susp': P('amigo', 71, { expr: 'nervous', look: 0.5, L: 'hang', R: 'hip' }, L1); P('civB', 72, { expr: 'nervous', look: -0.5, L: 'hip', R: 'hang' }, R1); break;
    case 'virada': P('amigo', 71, { expr: 'shock', look: 0.3, L: 'up', R: 'up' }, L1); P('civB', 72, { expr: 'laugh', look: -0.3, L: 'wave', R: 'up', wv }, R1); break;
    case 'juiz': P('juiz', 81, { expr: 'grin', look: 0, L: 'hip', R: 'point' }, [0.02, 0, 0]); break;
    case 'cta': P('amigo', 71, { expr: 'laugh', look: 0, L: 'hang', R: 'point' }, L1); P('civB', 72, { expr: 'shock', look: 0, L: 'up', R: 'up' }, R1); break;
    case 'segue': P('amigo', 71, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, L1); P('civB', 72, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, R1); break;
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
  const dig = q((f * 0.35) % 6.283, 1);
  const tun = (t, a = -99) => out.push(FX('tun' + t + dig, (p) => PL.tunnel(p, t, dig), [0.03, 0.05, -0.4], 1.5 * pop(f, a)));
  const sign = () => 0, _sign = () => out.push(FX('sign', (p) => plate(p, ['BANCO CENTRAL'], '#2f6fb2', '#fff', [64], 0), [0, 5.2, -11.6], 3.2, { order: 1 }));
  switch (S.id) {
    case 'hook': sign(); tun(0.72);
      if (f < 90) st('q', -12, [0.03, 2.1, -0.6], 1.1, ['LADRÕES CAVARAM', ['UM TÚNEL ATÉ', '#ffd23f'], ['UM BANCO?', '#ffd23f']], '#a8323a', '#fff', [48, 56, 66]);
      else st('vm', 90, [0.03, 2.1, -0.6], 1.1, [['VERDADE', '#1f9d55'], 'OU', ['MITO?', '#d8322f']], '#fff', K, [80, 50, 90]); break;
    case 'filme': st('hw', 136, [0.03, 2.35, -0.6], 0.85, ['FILME DE', ['HOLLYWOOD?', '#ffd23f']], '#7b3fe4', '#fff', [62, 70], 0.04); break;
    case 'loja': sign(); out.push(FX('shop' + dig, (p) => PL.shop(p, dig), [0.03, 0.05, -0.4], 1.5 * pop(f, 190)));
      st('lj', 196, [0.03, 2.1, -0.6], 1.1, ['E DO LADO', ['DO BANCO...', '#ffd23f']], '#2f9a58', '#fff', [60, 64], -0.04); break;
    case 'susp': { const n = Math.floor((f - 275) / 8) % 3; out.push(FX('qm' + n, (p) => PL.qm(p, n), [0.03, 1.75, 0.3], 0.5));
      st('resp', 277, [0.03, 2.4, -0.6], 0.85, ['E A RESPOSTA', 'É...'], K, '#ffd23f', [58, 62]); break; }
    case 'virada': out.push(FX('stamp', (p) => PL.stamp(p, true), [0.03, 1.55, 0.2], 1.0 * pop(f, 327, 8))); break;
    case 'tunel': { sign(); const u = q(0.1 + 0.9 * ramp(f, 415, 480), 2); tun(u);
      st('dt', 361, [0.03, 2.1, -0.6], 1.1, [['FORTALEZA, 2005', '#a8323a'], ['QUASE 80 METROS', '#2f6fb2'], ['ATÉ O COFRE!', '#1f9d55']], '#fff', K, [50, 48, 56]); break; }
    case 'grana': { const u = q(ramp(f, 496, 560), 2); out.push(FX('mn' + u + (f % 60), (p) => PL.money(p, u + (f % 60) / 600), [0.03, 0.05, -0.4], 1.5));
      st('rs', 500, [0.03, 2.1, -0.6], 1.1, ['MAIS DE', ['R$ 160 MILHÕES', '#ffd23f']], '#1f9d55', '#fff', [56, 54]); break; }
    case 'juiz': st('cd', 580, [0.03, 2.3, -0.6], 0.85, ['MAIS DE 100', ['CONDENADOS', '#ffd23f']], K, '#fff', [62, 60], 0.04); break;
    case 'cta': st('cm', 644, [0.03, 2.25, -0.6], 0.9, ['COMENTA SE', ['ACHOU QUE ERA', '#ffd23f'], ['MENTIRA!', '#ffd23f']], '#e0453a', '#fff', [58, 54, 70]); break;
    case 'praia': out.push(FX('bc' + dig, (p) => PL.beach(p, dig), [0.03, 0.05, -0.4], 1.5 * pop(f, 708)));
      st('mp', 712, [0.03, 2.1, -0.6], 1.1, ['MANDA PRA QUEM', ['CAVA ATÉ', '#ffd23f'], ['O JAPÃO!', '#ffd23f']], '#2f6fb2', '#fff', [50, 64, 70]); break;
    case 'segue': st('c3', 798, [0.03, 2.25, -0.6], 0.9, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': sign(); tun(0.72); st('logo', 862, [0.03, 2.1, -0.6], 1.1, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 866) { const t = q(((f - 866) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 3.1, -0.4], 1.8)); } break;
  }
  return out;
};

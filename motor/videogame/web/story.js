// Parece Mentira #14 — videogame x homem na Lua. FORMATO NOVO: voz 26,8 s + final até 29 s (870 quadros); fim = mesma cena do quadro 1 (loop).
// Mundo = cenário lunar do projeto cleopatra (x = 600).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 870, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 96, light: 'lua' },
  { id: 'lua', a: 97, b: 237, light: 'lua' },
  { id: 'moderno', a: 238, b: 374, light: 'lua' },
  { id: 'susp', a: 375, b: 414, light: 'lua' },
  { id: 'virada', a: 415, b: 535, light: 'lua' },
  { id: 'piada', a: 536, b: 624, light: 'lua' },
  { id: 'cta', a: 625, b: 795, light: 'lua' },
  { id: 'fim', a: 796, b: 869, light: 'lua' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 90, fogFar: 1400, shadowExt: 9 };
export const LIGHTS = {
  lua: { ...BASE, az: 110, el: 28, sky: '#aab4d4', ground: '#4a4e58', hemi: 0.75, sun: '#ffffff', sunI: 2.5, fog: '#04060e', skyTop: '#010208', skyHor: '#0a1030', stars: 1, sat: 1.08, vig: 0.28 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const MX = 600;
const A1 = [MX + 0.5, 0, -0.5], A2 = [MX - 0.45, 0, -0.5];
const WIDE = { pos: [MX + 0.05, 1.6, 4.7], look: [MX + 0.05, 1.9, -4], fov: 46 }, WIDE2 = { pos: [MX + 0.05, 1.55, 4.2], look: [MX + 0.05, 2.0, -4], fov: 44 };
const CL = { pos: [MX + 0.05, 1.45, 4.4], look: [MX + 0.05, 1.9, -1], fov: 40 }, CL2 = { pos: [MX + 0.05, 1.5, 3.8], look: [MX + 0.05, 1.95, -1], fov: 40 };
const CAMS = {
  hook: [{ f: 0, ...WIDE }, { f: 96, ...WIDE2 }],
  lua: [{ f: 97, pos: [MX - 0.3, 1.3, 6.5], look: [MX + 0.1, 3.0, -4], fov: 46 }, { f: 237, pos: [MX - 0.1, 1.4, 5.2], look: [MX + 0.1, 2.4, -4], fov: 44 }],
  moderno: [{ f: 238, ...CL }, { f: 374, ...CL2 }],
  susp: [{ f: 375, ...CL2 }, { f: 414, pos: [MX + 0.05, 1.55, 3.2], look: [MX + 0.05, 1.95, -1], fov: 40 }],
  virada: [{ f: 415, ...CL }, { f: 535, ...CL2 }],
  piada: [{ f: 536, ...WIDE }, { f: 624, ...WIDE2 }],
  cta: [{ f: 625, ...CL }, { f: 795, ...CL2 }],
  fim: [{ f: 796, ...WIDE2 }, { f: 869, ...WIDE }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: [] });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, 0.3), 0);
  c.shadowAt = [MX, 0, -1];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f);
  if (S.id === 'lua' || S.id === 'hook' || S.id === 'piada' || S.id === 'fim') return { focus: dist(C.pos, [MX, 2, -1]), cinf: 2 };
  return { focus: dist(C.pos, [MX, 1.5, -0.5]), cinf: 6 }; };
export const worldAt = (f) => {
  const landing = f >= 97 && f <= 237;
  return {
    brL: 0, brR: 0, brE: 0, board: false, museum: false, clouds: false, signY: 7,
    landY: landing ? 7 * (1 - E.easeOut(ramp(f, 100, 140))) : 0,
    flame: landing && f < 140 ? 1 : 0,
    flag: landing ? (f < 150 ? 0 : ramp(f, 150, 160)) : 1,
  };
};

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], tint: '#dfe4f2' });
const hop = (f, k = 0) => q(0.35 * Math.abs(Math.sin(f * 0.16 + k)), 2);
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1), jx = q(Math.sin(f * 0.35), 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  const gamer = (laugh, y = 0) => P('astro', 51, { expr: laugh ? 'laugh' : 'grin', look: -0.4, L: 'hang', R: 'lift', holdR: 'joy', joyX: jx, holdRot: 0 }, [A1[0], y, A1[2]]);
  switch (S.id) {
    case 'hook': gamer(false, hop(f)); break;
    case 'lua': if (f >= 162) P('astro', 51, { expr: f < 190 ? 'smile' : 'laugh', look: 0.2, L: f < 190 ? 'hang' : 'up', R: 'up', step: 0 }, [MX + 0.9, f >= 190 ? hop(f) * 1.6 : 0, -1.6]); break;
    case 'moderno': P('astro', 51, { expr: 'smile', look: -0.3, L: 'hang', R: 'point' }, A1); break;
    case 'susp': P('astro', 51, { expr: 'nervous', look: -0.3, L: 'hang', R: 'hip' }, A1); break;
    case 'virada': P('astro', 51, { expr: 'shock', look: -0.4, L: 'up', R: 'up' }, A1); break;
    case 'piada': gamer(true, hop(f) * 1.5); break;
    case 'cta': { const point = f < 712; P('astro', 51, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, A1); break; }
    case 'fim': gamer(true, hop(f)); break;
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
  const scope = (pos, s, a = -99) => { const t = q(f / 24, 2); if (f >= a) out.push(FX('sc' + t, (p) => PL.scope(p, t), pos, s * pop(f, a))); };
  switch (S.id) {
    case 'hook': scope([A2[0], 0.55, A2[2]], 0.75); st('q', -12, [MX + 0.03, 2.3, -0.9], 1.0, [['VIDEOGAME', '#ffd23f'], ['OU O HOMEM', '#fff'], ['NA LUA?', '#ffd23f']], '#2f6fb2', '#fff', [76, 60, 70]); break;
    case 'lua': { const t = q(f / 30, 2); if (f >= 172) out.push(FX('tv' + t, (p) => PL.tvBW(p, t), [MX - 0.6, 1.0, -0.6], 1.0 * pop(f, 172)));
      st('pb', 180, [MX - 0.45, 2.25, -0.4], 0.7, ['PRETO', ['E BRANCO', '#ffd23f']], '#555a6e', '#fff', [64, 60], 0.04); break; }
    case 'moderno': out.push(FX('pad', (p) => PL.pad(p), [A2[0], 1.0, A2[2]], 0.7 * pop(f, 242)));
      st('mod', 250, [MX + 0.03, 2.55, -0.9], 0.75, ['COISA', ['MODERNA?', '#ffd23f']], '#7b3fe4', '#fff', [64, 72], 0.04); break;
    case 'susp': { const n = Math.floor((f - 375) / 8) % 3; out.push(FX('qm' + n, (p) => PL.qm(p, n), [A2[0], 1.0, A2[2]], 0.5));
      st('resp', 377, [MX + 0.03, 2.4, -0.9], 0.85, ['A RESPOSTA', 'É...'], K, '#ffd23f', [62, 62]); break; }
    case 'virada': if (f < 452) { st('vg', 417, [MX + 0.03, 2.35, -0.9], 0.95, [['VIDEOGAME!', '#ffd23f']], '#e0453a', '#fff', [78]); scope([A2[0], 0.55, A2[2]], 0.7, 419); }
      else st('datas', 452, [MX + 0.03, 2.2, -0.9], 0.9, [['VIDEOGAME 1958', '#2f9a58'], ['LUA 1969', '#2f6fb2'], ['11 ANOS ANTES!', '#e0453a']], '#fff', K, [50, 58, 52]); break;
    case 'piada': scope([A2[0], 0.55, A2[2]], 0.75); st('treino', 540, [MX + 0.03, 2.4, -0.9], 1.0, [['11 ANOS', '#ffd23f'], 'DE TREINO', 'NO TÊNIS!'], '#e0453a', '#fff', [80, 60, 60]); break;
    case 'cta':
      if (f < 712) st('c2', 628, [MX + 0.03, 2.25, -0.9], 0.9, ['MANDA PRO AMIGO', ['GAMER DAS', '#ffd23f'], ['ANTIGAS!', '#ffd23f']], '#e0453a', '#fff', [46, 62, 62]);
      else st('c3', 714, [MX + 0.03, 2.25, -0.9], 0.9, ['SEGUE', '@PALITOLANDIA.IA', ['PRA VER O PRÓXIMO', '#ffd23f']], '#2f6fb2', '#fff', [84, 50, 38]); break;
    case 'fim': scope([A2[0], 0.55, A2[2]], 0.75); st('logo', 800, [MX + 0.03, 2.35, -0.9], 1.1, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 804) { const t = q(((f - 804) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [MX, 3.2, -0.6], 1.8)); } break;
  }
  return out;
};

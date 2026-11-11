// Plano de planos de "Cleópatra e a Lua" (original) — sincronizado com voice.wav (27,49 s, 30 fps, 825 quadros).
// Frases (quadros): "Cleópatra viveu... pirâmide" 4-150 | "Faça a conta" 164-195 | "Quando ela nasceu, a pirâmide já tinha" 208-267 |
// "quase dois mil e quinhentos anos" 271-324 | "Gregos e romanos... turistas" 337-448 | "O pouso na Lua veio" 461-496 | "quase dois mil anos depois dela" 500-554 |
// "Acontece que o Egito antigo" 567-600 | "durou cerca de três mil anos" 601-670 | "e ela foi a última rainha" 674-721 | "Para ela, a pirâmide já era" 734-783 | "coisa de museu" 788-814.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 825, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 162, light: 'dia' },
  { id: 'conta', a: 163, b: 335, light: 'dia' },
  { id: 'turistas', a: 336, b: 459, light: 'dourada' },
  { id: 'lua', a: 460, b: 510, light: 'lua' },
  { id: 'conta2', a: 511, b: 566, light: 'dia' },
  { id: 'egito', a: 567, b: 673, light: 'noite' },
  { id: 'rainha', a: 674, b: 733, light: 'dourada' },
  { id: 'museu', a: 734, b: 824, light: 'dia' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- luzes ----------
const BASE = { fogNear: 90, fogFar: 900, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 50, el: 55, sky: '#fff2d6', ground: '#d9b077', hemi: 1.2, sun: '#fff1d0', sunI: 2.2, fog: '#f3e2bf', skyTop: '#5fa8e8', skyHor: '#f6e7c4', sat: 1.1, vig: 0.2 },
  dourada: { ...BASE, az: 70, el: 24, sky: '#ffe4c0', ground: '#a07a52', hemi: 1.1, sun: '#ffb870', sunI: 2.5, fog: '#f6d7aa', skyTop: '#e89a5a', skyHor: '#ffd9a0', sat: 1.16, vig: 0.28 },
  noite: { ...BASE, az: 60, el: 38, sky: '#8aa4e8', ground: '#4a5080', hemi: 1.0, sun: '#a8c0ff', sunI: 1.2, fog: '#2c3f86', skyTop: '#0f1a48', skyHor: '#2c3f86', sat: 1.2, vig: 0.34 },
  lua: { ...BASE, fogFar: 1400, az: 110, el: 20, sky: '#9aa6c8', ground: '#4a4e58', hemi: 0.6, sun: '#ffffff', sunI: 2.6, fog: '#04060e', skyTop: '#010208', skyHor: '#0a1030', stars: 1, sat: 1.05, vig: 0.3 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- posições ----------
const MX = 600;
const CL = [0, 0, 0];                 // Cleópatra (gancho, rainha)
const CP = [-0.72, 0, -2.4];          // Cleópatra ao lado do quadro
const CM = [0, 0, 0.4];            // Cleópatra no museu
const TA = [-0.35, 0, -8.0], TB = [0.4, 0, -9.3], TC = [-0.1, 0, -10.7];   // turistas
const MOON = [-14, 22, -80], PYR = [4, 6, -26];
const AST0 = [MX + 1.3, 0, -3.6], AST1 = [MX - 0.15, 0, -1.4];

// ---------- câmeras ----------
const CAMS = {
  hook: [
    { f: 0, pos: [0.5, 1.25, 3.5], look: [0, 1.35, 0], fov: 36 },
    { f: 30, pos: [0.5, 1.3, 3.3], look: [-0.1, 1.5, 0], fov: 34 },
    { f: 62, pos: [0.2, 1.4, 3.0], look: MOON, fov: 36 },
    { f: 74, pos: [0.2, 1.4, 3.0], look: [-14, 21.5, -80], fov: 36 },
    { f: 112, pos: [1.0, 1.8, 3.6], look: PYR, fov: 40 },
    { f: 162, pos: [1.8, 2.3, 6.5], look: [3, 5.5, -26], fov: 46 },
  ],
  conta: [
    { f: 163, pos: [0.7, 2.1, 6.2], look: [0, 2.2, -3], fov: 40 },
    { f: 205, pos: [0.5, 2.0, 5.0], look: [0, 1.9, -3], fov: 38 },
    { f: 240, pos: [0.3, 1.9, 2.0], look: [0.0, 1.84, -3], fov: 30 },
    { f: 268, pos: [0.3, 2.8, 2.2], look: [0.3, 2.6, -3], fov: 34 },
    { f: 300, pos: [0.4, 2.7, 2.4], look: [0.35, 2.6, -3], fov: 34 },
    { f: 335, pos: [0.6, 2.5, 3.5], look: [0.2, 2.3, -3], fov: 38 },
  ],
  turistas: [
    { f: 336, pos: [-0.2, 1.3, -3.4], look: [0, 1.5, -9], fov: 38 },
    { f: 400, pos: [0.6, 1.4, -4.0], look: [0.3, 2.2, -9], fov: 38 },
    { f: 440, pos: [0.2, 1.2, -5.5], look: [3, 6, -24], fov: 44 },
    { f: 459, pos: [0.4, 1.2, -5.9], look: [3.5, 6.5, -24], fov: 46 },
  ],
  lua: [
    { f: 460, pos: [MX - 0.5, 1.4, 4.0], look: [MX + 0.1, 2.5, -3], fov: 40 },
    { f: 488, pos: [MX - 0.1, 1.3, 3.0], look: [MX + 0.1, 1.0, -2.0], fov: 36 },
    { f: 510, pos: [MX - 0.4, 1.4, 2.4], look: [MX - 0.4, 1.2, -1.4], fov: 34 },
  ],
  conta2: [
    { f: 511, pos: [0.3, 2.0, 2.4], look: [0.3, 1.7, -3], fov: 36 },
    { f: 545, pos: [0.5, 1.3, 2.6], look: [0.4, 1.2, -3], fov: 36 },
    { f: 566, pos: [0.6, 1.7, 4.0], look: [0.2, 1.7, -3], fov: 40 },
  ],
  egito: [
    { f: 567, pos: [1.2, 2.4, 7.5], look: [-0.1, 2.1, -3], fov: 44, ease: 'easeOut', roll: 3 },
    { f: 600, pos: [-0.1, 3.0, 5.5], look: [-0.5, 3.0, -3], fov: 40 },
    { f: 650, pos: [-0.7, 2.6, 3.2], look: [-0.6, 2.6, -3], fov: 36 },
    { f: 673, pos: [-0.5, 2.5, 4.5], look: [-0.2, 2.4, -3], fov: 40 },
  ],
  rainha: [
    { f: 674, pos: [0.6, 1.25, 3.2], look: [0, 1.55, 0], fov: 32 },
    { f: 733, pos: [0.3, 1.45, 2.3], look: [0, 1.65, 0], fov: 28 },
  ],
  museu: [
    { f: 734, pos: [0.3, 1.4, 4.6], look: [0, 1.8, -1.5], fov: 38 },
    { f: 790, pos: [0.2, 1.45, 4.9], look: [0, 1.85, -1.6], fov: 38 },
    { f: 824, pos: [0.2, 1.4, 4.7], look: [0, 1.8, -1.6], fov: 36, roll: 3 },
  ],
};
const KICKS = [{ f: 274, a: 0.02 }, { f: 487, a: 0.04 }, { f: 518, a: 0.02 }, { f: 567, a: 0.05 }, { f: 604, a: 0.02 }, { f: 812, a: 0.05 }];
export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = fl(163, 6, 0.85) + fl(336, 4, 0.4) + fl(460, 6, 0.85) + fl(511, 4, 0.4) + fl(567, 4, 0.3) + fl(734, 4, 0.4);
  if (S.id === 'turistas') c.shadowAt = [0, 0, -9];
  if (S.id === 'lua') c.shadowAt = [MX, 0, -2];
  if (S.id === 'conta' || S.id === 'conta2' || S.id === 'egito') c.shadowAt = [0, 1, -2.5];
  if (S.id === 'museu') c.shadowAt = [0, 0, -0.5];
  if (S.id === 'hook' || S.id === 'rainha') c.shadowAt = [0, 0, 0];
  return c;
};

// ---------- lente ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), fo = dist(C.pos, C.look);
  switch (S.id) {
    case 'hook': return { focus: fo, cinf: f < 34 ? 8 : f < 78 ? 0 : 2 };
    case 'conta': return { focus: fo, cinf: f < 205 ? 0 : 5 };
    case 'turistas': return { focus: dist(C.pos, f < 410 ? TA : [0, 1.5, -12]), cinf: f < 410 ? 6 : 2 };
    case 'lua': return { focus: dist(C.pos, [MX, 1.2, -2.5]), cinf: 3 };
    case 'conta2': return { focus: fo, cinf: 4 };
    case 'egito': return { focus: fo, cinf: f < 600 ? 0 : 3 };
    case 'rainha': return { focus: dist(C.pos, [0, 1.5, 0]), cinf: lerp(8, 12, smooth(ramp(f, 674, 733))) };
    case 'museu': return { focus: dist(C.pos, [CM[0], 1.5, CM[2]]), cinf: 6 };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- estado do mundo ----------
const signY = (f) => {
  if (f < 800) return 7;
  if (f < 811) { const t = (f - 800) / 11; return 6.5 - 4.05 * t * t; }
  return 2.45 + 0.2 * Math.exp(-(f - 811) / 2.2) * Math.abs(Math.sin((f - 811) * 0.9));
};
export const worldAt = (f) => ({
  brL: f < 274 ? 0 : ramp(f, 274, 286),
  brR: f < 518 ? 0 : ramp(f, 518, 530),
  brE: f < 604 ? 0 : ramp(f, 604, 616),
  landY: f < 460 ? 7 : 7 * (1 - E.easeOut(ramp(f, 460, 487))),
  flame: f >= 460 && f < 487 ? 1 : 0,
  flag: f < 497 ? 0 : ramp(f, 497, 507),
  signY: signY(f),
  clouds: shotAt(f).id !== 'lua',
  board: ['conta', 'conta2', 'egito'].includes(shotAt(f).id),
  museum: shotAt(f).id === 'museu',
});

// ---------- atores (cartões 2D) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const cleo = (o, pos = CL) => out.push(R(T, 'cleo', { seed: 41, ...life(f, 41), ...o }, pos));
  switch (S.id) {
    case 'hook': cleo({ expr: f < 30 ? 'smile' : 'grin', facing: 0, look: 0.2, L: 'hip', R: f < 76 ? 'hip' : 'wave', wv: q(f * 0.25 % 6.283, 1) }); break;
    case 'conta': case 'conta2': case 'egito':
      cleo({ expr: f < 205 ? 'grin' : 'smile', facing: 0, look: 0.3, L: 'up', R: 'hip' }, CP); break;
    case 'turistas': {
      out.push(R(T, 'toga', { seed: 31, ...life(f, 31), expr: f < 400 ? 'grin' : 'shock', facing: 0, look: 0.2, L: 'point', R: 'hip' }, TA));
      out.push(R(T, 'civB', { seed: 32, ...life(f, 32), expr: 'smile', facing: 0, look: -0.2, L: 'hip', R: 'wave', wv: q(f * 0.3 % 6.283, 1) }, TB));
      out.push(R(T, 'civA', { seed: 33, ...life(f, 33), expr: 'grin', facing: 0, look: 0.2, L: 'hang', R: 'lift', holdR: 'scroll', holdRot: q(0.2 * Math.sin(f * 0.2), 2) }, TC));
      break;
    }
    case 'lua': {
      if (f >= 492) {
        const w = ramp(f, 492, 502), pos = lerp3(AST0, AST1, E.smooth(w));
        const hop = f >= 504 ? 0.75 * Math.abs(Math.sin((f - 504) * 0.3)) : 0;
        out.push(R(T, 'astro', { seed: 51, ...life(f, 51), expr: f < 504 ? 'smile' : 'laugh', facing: 0, look: 0.2, L: f < 504 ? 'hang' : 'up', R: f < 504 ? 'hang' : 'up', step: f < 502 ? q((f * 0.045) % 1, 2) : 0 }, [pos[0], hop, pos[2]], { tint: '#dfe4f2' }));
      }
      break;
    }
    case 'rainha': cleo({ expr: 'grin', facing: 0, look: 0.2, L: 'hip', R: 'hip', headTilt: q(-3 * Math.sin(f * 0.05), 1) }); break;
    case 'museu': {
      const hit = f >= 812;
      cleo({ expr: hit ? 'laugh' : f < 788 ? 'stubborn' : 'smile', facing: 0, look: 0.2, L: 'cross', R: 'cross', tilt: hit ? q(4 * Math.sin(f * 0.5), 1) : 0 }, CM); break;
    }
  }
  return out;
};

// ---------- efeitos 2D ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const sparks = (p, t, col = '#ffd84a') => {
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r0 = 60 + 110 * t, r1 = r0 + 50 * (1 - t) + 10;
    p.stroke([[300 + Math.cos(a) * r0, 400 + Math.sin(a) * r0], [300 + Math.cos(a) * r1, 400 + Math.sin(a) * r1]], 14 * (1 - t) + 4, col); }
};
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  // brilhos na Lua do céu ("pouso na Lua")
  if (f >= 40 && f < 76) { const st = q(((f - 40) / 18) % 1, 2); out.push(FX('mstars' + st, (p) => T.fxStars(p, st), [MOON[0], MOON[1] - 5, MOON[2] + 6], 6, { order: 6 })); }
  // espanto do turista da frente ao ver a pirâmide
  if (S.id === 'turistas' && f >= 404 && f < 424) { const t = q((f - 404) / 20, 2); out.push(FX('awe' + t, (p) => sparks(p, t, '#ffffff'), [TA[0], 0.55, TA[2] + 0.1], 1, { order: 6 })); }
  // poeira da alunissagem
  if (f >= 487 && f < 503) { const k = q((f - 487) / 16, 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#c9ccd6'), [MX + 0.2, 0.1, -2.7], 1.2, { order: 6, alpha: 0.7 })); }
  // coroa brilha na "última rainha"
  if (S.id === 'rainha' && f >= 700 && f < 722) { const t = q((f - 700) / 22, 2); out.push(FX('crown' + t, (p) => sparks(p, t), [CL[0], 0.55, CL[2]], 1, { order: 6 })); }
  // impacto da placa do museu
  if (f >= 812 && f < 830) { const k = q((f - 812) / 14, 2); out.push(FX('mdust' + k, (p) => T.fxDust(p, k, '#e8dcc4'), [0, 1.5, MZ_FX], 0.75, { order: 6, alpha: 0.7 })); }
  if (f >= 812 && f < 826) { const st = q(((f - 812) / 14) % 1, 2); out.push(FX('mstar' + st, (p) => T.fxStars(p, st), [0.1, 1.9, MZ_FX + 0.1], 0.7, { order: 6 })); }
  return out;
};
const MZ_FX = -1.5;

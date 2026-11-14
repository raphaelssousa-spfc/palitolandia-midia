// Plano de planos de "O chocolate que derreteu" (anedota de Percy Spencer, versão original) — sincronizado com voice.wav (33,14 s, 30 fps, 994 quadros).
// Frases (quadros): 1 gancho 3-116 | 2 "Em 1945" 130-186 | 3 "engenheiro... peça de radar" 195-290 | 4 "bolso ficou melado" 303-368 |
// 5 "chocolate virou pasta" 381-431 | 6 "lavanderia" 445-505 | 7 "ficou curioso" 519-558 | 8 "pipoca... máquina" 571-664 |
// 9 "estouraram na hora" 677-719 | 10 "Acontece que as ondas..." 733-831 | 11 "nasceu o micro-ondas" 844-911 | 12 "bolso sujo" 924-984.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 994, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 129, light: 'lab' },
  { id: 'lab', a: 130, b: 302, light: 'lab' },
  { id: 'bolso', a: 303, b: 444, light: 'lab' },
  { id: 'curioso', a: 445, b: 570, light: 'dourada' },
  { id: 'pipoca', a: 571, b: 732, light: 'lab' },
  { id: 'ondas', a: 733, b: 843, light: 'noite' },
  { id: 'nasce', a: 844, b: 911, light: 'dourada' },
  { id: 'sujo', a: 912, b: 993, light: 'lab' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- luzes ----------
const BASE = { fogNear: 90, fogFar: 900, shadowExt: 9 };
export const LIGHTS = {
  lab: { ...BASE, az: 50, el: 58, sky: '#e6eef0', ground: '#9a9080', hemi: 1.25, sun: '#fff0d8', sunI: 2.0, fog: '#cfe3f3', skyTop: '#5a9ae0', skyHor: '#cfe3f3', sat: 1.1, vig: 0.2 },
  dourada: { ...BASE, az: 70, el: 24, sky: '#ffe4c0', ground: '#a07a52', hemi: 1.1, sun: '#ffb870', sunI: 2.5, fog: '#f6d7aa', skyTop: '#e89a5a', skyHor: '#ffd9a0', sat: 1.16, vig: 0.28 },
  noite: { ...BASE, az: 60, el: 38, sky: '#8aa4e8', ground: '#4a5080', hemi: 1.0, sun: '#a8c0ff', sunI: 1.2, fog: '#2c3f86', skyTop: '#0f1a48', skyHor: '#2c3f86', sat: 1.2, vig: 0.34 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- posições ----------
const EY = 1.47;
const PC = [0.6, 0, -0.55];            // Percy (gancho, lab, bolso, curioso, sujo)
const PC2 = [-0.45, 0, -0.6];          // Percy na pipoca/ondas
const PN = [-2.5, 0, -1.2];           // Percy ao lado do forno
const AS = [0.75, 0, -2.6];            // assistente atrás da bancada
const POCKET = [0.66, 0.95, -0.55];
const MAGC = [0, 1.55, -1.7];
const KERN = [0.8, 1.0, -2.0], FOOD = [1.2, 1.05, -1.55], OVEN = [-3.1, 1.1, -2.1];
const eye = (p, dy = 0) => [p[0], EY + dy, p[2]];

// ---------- câmeras ----------
const CAMS = {
  hook: [
    { f: 0, pos: [0.68, 1.1, 1.5], look: [0.64, 1.12, -0.55], fov: 36 },
    { f: 56, pos: [0.65, 1.35, 1.5], look: [0.62, 1.35, -0.55], fov: 34 },
    { f: 100, pos: [1.3, 1.9, 4.4], look: [0.2, 1.3, -1.5], fov: 44, path: [[0.95, 1.55, 2.6]] },
    { f: 129, pos: [1.7, 2.0, 5.5], look: [0.2, 1.3, -1.6], fov: 46 },
  ],
  lab: [
    { f: 130, pos: [3.9, 1.9, 3.4], look: [0.2, 1.3, -1.4], fov: 46 },
    { f: 200, pos: [1.0, 1.6, 2.0], look: [0.45, 1.15, -0.9], fov: 40, path: [[2.5, 1.7, 2.9]] },
    { f: 255, pos: [1.0, 2.2, 2.4], look: [2.4, 2.5, -3.0], fov: 42 },
    { f: 302, pos: [1.3, 1.5, 1.5], look: [0.6, 1.0, -0.55], fov: 36 },
  ],
  bolso: [
    { f: 303, pos: [1.3, 1.5, 1.5], look: [0.6, 1.0, -0.55], fov: 36 },
    { f: 336, pos: [1.0, 1.3, 1.4], look: [0.64, 1.05, -0.55], fov: 32 },
    { f: 381, pos: [0.8, 1.05, 0.9], look: [0.66, 0.9, -0.55], fov: 28 },
    { f: 444, pos: [0.78, 1.0, 0.8], look: [0.66, 0.75, -0.55], fov: 28 },
  ],
  curioso: [
    { f: 445, pos: [1.1, 1.9, 3.2], look: [0.6, 1.75, -0.55], fov: 44 },
    { f: 505, pos: [0.9, 2.0, 3.0], look: [0.6, 1.95, -0.55], fov: 44 },
    { f: 519, pos: [0.85, 1.5, 1.4], look: [0.62, 1.45, -0.55], fov: 28, ease: 'easeOut' },
    { f: 570, pos: [0.8, 1.5, 1.25], look: [0.55, 1.47, -0.55], fov: 26 },
  ],
  pipoca: [
    { f: 571, pos: [0.2, 1.6, 2.6], look: [0.1, 1.3, -1.2], fov: 44 },
    { f: 628, pos: [0.7, 1.55, 1.6], look: [0.75, 1.3, -2.0], fov: 36 },
    { f: 640, pos: [0.72, 1.5, -0.1], look: [0.78, 1.2, -2.0], fov: 30 },
    { f: 677, pos: [0.8, 1.55, 0.0], look: [0.8, 1.3, -2.0], fov: 34 },
    { f: 732, pos: [0.9, 1.9, 1.0], look: [0.7, 1.4, -2.0], fov: 40 },
  ],
  ondas: [
    { f: 733, pos: [0.7, 1.6, 2.6], look: [0.3, 1.4, -1.7], fov: 40, ease: 'easeOut' },
    { f: 790, pos: [1.2, 1.45, 0.5], look: [1.2, 1.1, -1.6], fov: 32 },
    { f: 843, pos: [0.3, 1.7, 1.9], look: [0.1, 1.5, -1.7], fov: 30 },
  ],
  nasce: [
    { f: 844, pos: [-2.0, 1.8, 3.2], look: [-2.9, 1.2, -2.0], fov: 46, ease: 'easeOut' },
    { f: 880, pos: [-3.1, 1.5, 2.4], look: [-3.0, 1.1, -2.0], fov: 44 },
    { f: 911, pos: [-3.15, 1.4, 1.6], look: [-3.0, 1.1, -2.0], fov: 40, roll: 3 },
  ],
  sujo: [
    { f: 912, pos: [0.9, 1.15, 2.0], look: [0.66, 0.98, -0.55], fov: 34 },
    { f: 950, pos: [0.8, 1.0, 2.6], look: [0.66, 0.85, -0.55], fov: 36 },
    { f: 978, pos: [0.8, 0.95, 3.1], look: [0.66, 0.8, -0.55], fov: 37 },
    { f: 993, pos: [0.8, 0.95, 3.0], look: [0.66, 0.8, -0.55], fov: 36, roll: 3 },
  ],
};
const KICKS = [{ f: 340, a: 0.04 }, { f: 700, a: 0.03 }, { f: 733, a: 0.05 }, { f: 978, a: 0.05 }];
export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.flash = f >= 130 && f < 136 ? (1 - (f - 130) / 6) * 0.85 : f >= 733 && f < 737 ? 0.3 * (1 - (f - 733) / 4) : f >= 844 && f < 848 ? 0.3 * (1 - (f - 844) / 4) : f >= 912 && f < 916 ? 0.4 * (1 - (f - 912) / 4) : 0;
  if (S.id === 'lab') c.shadowAt = [0.5, 0, -1.0];
  if (S.id === 'pipoca' || S.id === 'ondas') c.shadowAt = [0.7, 0, -1.5];
  if (S.id === 'nasce') c.shadowAt = [-3, 0, -1.5];
  return c;
};

// ---------- lente ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, POCKET), cinf: lerp(10, 0, smooth(ramp(f, 60, 108))) };
    case 'lab': return { focus: dist(C.pos, [0.4, 1.2, -1.2]), cinf: f < 200 ? 0 : f < 290 ? 3 : 7 };
    case 'bolso': return { focus: dist(C.pos, POCKET), cinf: lerp(7, 12, smooth(ramp(f, 336, 385))) };
    case 'curioso': return { focus: dist(C.pos, eye(PC)), cinf: f < 505 ? 6 : lerp(6, 13, smooth(ramp(f, 519, 545))) };
    case 'pipoca': return f < 628 ? { focus: dist(C.pos, [0.7, 1.2, -2.0]), cinf: 3 } : { focus: dist(C.pos, KERN), cinf: 9 };
    case 'ondas': return { focus: dist(C.pos, f < 770 ? MAGC : f < 830 ? FOOD : MAGC), cinf: f < 770 ? 5 : 9 };
    case 'nasce': return { focus: dist(C.pos, OVEN), cinf: lerp(4, 8, smooth(ramp(f, 850, 890))) };
    case 'sujo': return { focus: dist(C.pos, f < 965 ? POCKET : [0.66, 0.3, -0.5]), cinf: 8 };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- estado do mundo ----------
export const worldAt = (f) => ({
  oven: f < 836 ? 0 : E.back(ramp(f, 836, 850)),
  dish: f * 0.02,
  pulse: 0.5 + 0.5 * Math.sin(f * (f >= 640 ? 0.7 : 0.35)),
  hot: f >= 650 && f < 850,
  waves: f >= 733 && f < 844 ? (f - 733) / 30 : -1,
  food: ramp(f, 765, 790),
});
const meltAt = (f) => (f < 303 ? 0.12 + 0.38 * f / 303 : 0.5 + 0.5 * ramp(f, 303, 431));

// ---------- atores (cartões 2D) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const melt = q(meltAt(f), 2);
  const percy = (o, pos = PC) => out.push(R(T, 'engenheiro', { seed: 11, ...life(f, 11), melt, ...o }, pos));
  const tec = (o, pos = AS) => out.push(R(T, 'tecnico', { seed: 21, ...life(f, 21), ...o }, pos));
  const wr = q(0.3 * Math.sin(f * 0.35), 2);
  switch (S.id) {
    case 'hook': percy({ expr: 'smile', facing: -1, look: -0.5, L: 'reach', lift: 0.25, holdL: 'wrench', holdRot: wr, R: 'hip' }); break;
    case 'lab': percy({ expr: f < 195 ? 'smile' : 'squint', facing: -1, look: -0.5, L: 'reach', lift: q(0.25 + 0.1 * Math.sin(f * 0.2), 2), holdL: 'wrench', holdRot: wr, R: 'hip', headTilt: q(-3 * Math.sin(f * 0.05), 1) }); break;
    case 'bolso': {
      if (f < 312) percy({ expr: 'squint', facing: -1, look: -0.5, L: 'reach', lift: 0.25, holdL: 'wrench', holdRot: wr, R: 'hip' });
      else if (f < 340) percy({ expr: 'nervous', facing: 0, look: 0.3, L: 'reach', lift: 0.2, holdL: 'wrench', holdRot: 0, R: 'hip', headTilt: q(4 * Math.sin(f * 0.8), 1) });
      else if (f < 392) percy({ expr: 'shock', facing: 0, look: 0.2, L: 'hang', R: 'belly', bob: f < 344 ? -0.02 : 0 });
      else percy({ expr: 'pained', facing: 0, look: 0.2, L: 'hang', R: 'lift', headTilt: q(3 * Math.sin(f * 0.5), 1) });
      break;
    }
    case 'curioso': {
      if (f < 508) percy({ expr: 'stubborn', facing: 0, look: 0.3, L: 'hang', R: 'belly' });
      else if (f < 519) percy({ expr: 'neutral', facing: 0, look: 0, L: 'hang', R: 'belly' });
      else if (f < 546) percy({ expr: 'squint', facing: -1, look: -0.5, L: 'cheek', R: 'belly', headTilt: -4 });
      else percy({ expr: 'grin', facing: -1, look: -0.4, L: 'hang', R: 'up', bob: f < 550 ? -0.015 : 0 });
      break;
    }
    case 'pipoca': {
      const pf = f < 629 ? { expr: 'grin', facing: 1, look: 0.6, L: 'hip', R: 'point' }
        : f < 677 ? { expr: 'squint', facing: 1, look: 0.5, L: 'cross', R: 'cross' }
        : f < 706 ? { expr: 'shock', facing: 1, look: 0.4, L: 'up', R: 'up', bob: f < 681 ? -0.02 : 0 }
        : { expr: 'laugh', facing: 1, look: 0.3, L: 'belly', R: 'belly', tilt: q(4 * Math.sin(f * 0.5), 1) };
      percy(pf, PC2);
      if (f >= 580) {
        const wk = ramp(f, 580, 616), pos = lerp3([2.4, 0, -2.6], AS, E.smooth(wk)), walking = f < 616;
        const pour = f >= 634 && f < 666, rot = q(lerp(0, 1.15, E.smooth(ramp(f, 634, 646))) * (f < 660 ? 1 : 1 - ramp(f, 660, 666)), 2);
        const o = f < 677 ? { expr: 'smile', facing: walking ? -1 : 1, look: -0.4, L: 'hang', R: f >= 628 && f < 668 ? 'lift' : 'hang', holdR: 'bag', holdRot: pour ? rot : 0, step: walking ? q((f * 0.045) % 1, 2) : 0 }
          : { expr: f < 700 ? 'shock' : 'laugh', facing: 1, look: 0.4, L: f < 700 ? 'up' : 'belly', R: f < 700 ? 'up' : 'belly', tilt: f >= 700 ? q(4 * Math.sin(f * 0.5 + 1), 1) : 0 };
        tec(o, pos);
      }
      break;
    }
    case 'ondas': {
      percy({ expr: 'grin', facing: 1, look: 0.6, L: 'hip', R: 'point' }, PC2);
      tec({ expr: f < 790 ? 'laugh' : 'smile', facing: 1, look: 0.4, L: 'belly', R: 'wave', wv: q(f * 0.3 % 6.283, 1) }, AS);
      break;
    }
    case 'nasce': percy({ expr: 'grin', facing: -1, look: -0.5, L: 'thumb', R: 'hip', melt: 1 }, PN); break;
    case 'sujo': {
      const drop = f >= 978;
      percy({ expr: drop ? 'shock' : f < 960 ? 'smile' : 'pained', facing: 0, look: 0.2, L: 'hang', R: 'belly', melt: 1, bob: f >= 978 && f < 982 ? -0.02 : 0 });
      break;
    }
  }
  return out;
};

// ---------- efeitos 2D ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const BROWN = '#5a2f14';
const bubble = (p) => {
  const C = [[300, 400, 150, 120], [190, 430, 80, 70], [410, 430, 80, 70], [220, 330, 80, 62], [380, 330, 80, 62]];
  C.forEach(([x, y, rx, ry]) => p.ell(x, y, rx, ry, '#ffffff', 9));
  C.forEach(([x, y, rx, ry]) => p.ell(x, y, rx - 8, ry - 8, '#ffffff', 0));
  p.poly([[230, 330], [270, 315], [300, 335], [330, 315], [370, 330], [400, 380], [360, 395], [350, 365], [350, 470], [250, 470], [250, 365], [240, 395], [200, 380]], '#6fb0e6', 7);
  for (const [x, y, r] of [[400, 340, 22], [430, 400, 15], [190, 360, 18], [210, 450, 12]]) p.ell(x, y, r, r, '#e8f7ff', 5);
  p.ell(300, 560, 32, 28, '#ffffff', 7); p.ell(288, 620, 20, 18, '#ffffff', 6); p.ell(280, 670, 11, 10, '#ffffff', 5);
};
const sparks = (p, t, col = '#ffd84a') => {
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r0 = 60 + 110 * t, r1 = r0 + 50 * (1 - t) + 10;
    p.stroke([[300 + Math.cos(a) * r0, 400 + Math.sin(a) * r0], [300 + Math.cos(a) * r1, 400 + Math.sin(a) * r1]], 14 * (1 - t) + 4, col); }
};
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  // pingos de chocolate caindo do bolso
  if (['hook', 'lab', 'bolso', 'curioso'].includes(S.id) && meltAt(f) > 0.15 && !(f >= 336 && f < 352)) {
    const n = Math.floor((f + 10) / 46), ph = (f + 10) % 46, dx = 0.62 + 0.035 * (n % 3);
    if (ph < 16) { const y = 0.76 - 0.72 * (ph / 16) ** 2; out.push(FX('drop', (p) => p.ell(300, 500, 9, 14, BROWN, 3), [dx, y - 1.069, -0.5], 1, { order: 6 })); }
    else if (ph < 30) { const k = q((ph - 16) / 14, 1); out.push(FX('splat' + k, (p) => p.ell(300, 500, 16 + 28 * k, 5 + 6 * k, BROWN, 3), [dx, 0.03 - 1.069, -0.45], 1, { alpha: 1 - k * 0.6, order: 6 })); }
  }
  // balão de pensamento com camisa e bolhas ("lavanderia")
  if (f >= 449 && f < 509) {
    const s = f < 462 ? 0.15 + 0.85 * E.back((f - 449) / 13) : 1;
    out.push(FX('bubble', bubble, [PC[0] + 0.05, 2.39 - 1.29 * s, PC[2]], s, { roll: q(0.04 * Math.sin(f * 0.15), 3), order: 6 }));
  }
  if (f >= 509 && f < 518) { const t = q((f - 509) / 9, 2); out.push(FX('popb' + t, (p) => sparks(p, t, '#ffffff'), [PC[0] + 0.05, 2.39 - 1.29, PC[2]], 1, { order: 6 })); }
  // ideia!
  if (f >= 548 && f < 566) { const t = q((f - 548) / 18, 2); out.push(FX('idea' + t, (p) => sparks(p, t), [PC[0] - 0.1, 0.55, PC[2]], 1, { order: 6 })); }
  // vapor nas comidas
  if (S.id === 'ondas' && f >= 800) {
    [[1.15, 1.02], [1.5, 1.04], [1.8, 1.0]].forEach(([x, y0], k) => {
      const t = q(((f - 800) * 0.025 + k / 3) % 1, 2);
      out.push(FX('steam' + k + t, (p) => { p.g.translate(150, 700); T.fxPuff(p, t); }, [x, y0 + 0.25 * t - 0.21 * 0.5, -1.45], 0.5, { alpha: q(Math.min(1, (1 - t) * 3), 2), order: 6 }));
    });
  }
  // brilhos no forno
  if (S.id === 'nasce' && f >= 848 && f < 900) { const st = q(((f - 848) / 20) % 1, 2); out.push(FX('stars' + st, (p) => T.fxStars(p, st), [-3.0, 0.5, -1.8], 0.5, { order: 6 })); }
  // última gota (quadros 966-978) e a mancha no chão
  if (S.id === 'sujo') {
    if (f >= 966 && f < 978) { const y = 0.7 - 0.66 * ((f - 966) / 12) ** 2; out.push(FX('drop', (p) => p.ell(300, 500, 9, 14, BROWN, 3), [0.66, y - 1.069, -0.5], 1, { order: 6 })); }
    if (f >= 978) { const k = q(Math.min(1, (f - 978) / 8), 2); out.push(FX('bigsplat' + k, (p) => { p.ell(300, 500, 20 + 50 * k, 6 + 9 * k, BROWN, 3); p.ell(300 + 60 * k, 505, 6 + 6 * k, 3 + 3 * k, BROWN, 2); }, [0.66, 0.03 - 1.069, -0.45], 1, { order: 6 })); }
  }
  return out;
};

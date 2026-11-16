// Parece Mentira #13 — Harvard x gravidade de Newton. FORMATO NOVO: voz 22,2 s + final até 25 s (750 quadros); fim = mesma cena do quadro 1 (loop).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 750, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 100, light: 'dia' },
  { id: 'harvard', a: 101, b: 188, light: 'dia' },
  { id: 'newton', a: 189, b: 318, light: 'dia' },
  { id: 'conta', a: 319, b: 380, light: 'dia' },
  { id: 'piada', a: 381, b: 465, light: 'dia' },
  { id: 'virada', a: 466, b: 556, light: 'dia' },
  { id: 'cta', a: 557, b: 657, light: 'dia' },
  { id: 'fim', a: 658, b: 749, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 50, el: 50, sky: '#fff6e8', ground: '#7fb85a', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  quente: { ...BASE, az: 60, el: 52, sky: '#fff0d0', ground: '#d9b077', hemi: 1.2, sun: '#fff0cc', sunI: 2.3, fog: '#f3e2bf', skyTop: '#3f9be8', skyHor: '#f6e4c0', sat: 1.15, vig: 0.2 },
  poente: { ...BASE, az: 75, el: 16, sky: '#ffcf9e', ground: '#8a5a48', hemi: 1.0, sun: '#ff9a5a', sunI: 2.2, fog: '#e88a6a', skyTop: '#5a3f8a', skyHor: '#ff9a6a', sat: 1.2, vig: 0.32 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a8b860', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light], shadowExt: S.id === 'harvard' ? 26 : 9 });
const L1 = [-0.48, 0, 0.1], R1 = [0.52, 0, -0.1], C1 = [0.02, 0, -0.6];
const FLY = { pos: [0.05, 1.8, 5.6], look: [0.05, 2.6, -6], fov: 46 }, FLY2 = { pos: [0.05, 1.8, 5.0], look: [0.05, 2.5, -6], fov: 44 };
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CAMS = {
  hook: [{ f: 0, ...FLY }, { f: 100, ...FLY2 }],
  harvard: [{ f: 101, pos: [0.2, 1.4, 6.5], look: [0, 4.0, -14], fov: 46 }, { f: 188, pos: [0.1, 1.4, 5.4], look: [0, 3.6, -14], fov: 44 }],
  newton: [{ f: 189, ...CL }, { f: 318, ...CL2 }],
  conta: [{ f: 319, ...CL }, { f: 380, ...CL2 }],
  piada: [{ f: 381, ...FLY }, { f: 465, ...FLY2 }],
  virada: [{ f: 466, ...CL }, { f: 556, ...CL2 }],
  cta: [{ f: 557, ...CL }, { f: 657, ...CL2 }],
  fim: [{ f: 658, ...FLY2 }, { f: 749, ...FLY }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: [] });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, 0.3), 0);
  c.shadowAt = S.id === 'harvard' ? [0, 0, -5] : [0, 0, -0.3];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f);
  if (S.id === 'harvard' || S.id === 'hook' || S.id === 'piada' || S.id === 'fim') return { focus: dist(C.pos, [0, 2, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 }; };
export const worldAt = (f) => ({ pyrS: 1, scaf: false });

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
const fly = (f, k) => q(0.95 + 0.12 * Math.sin(f * 0.09 + k * 2.1), 2);
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  const floaters = (laugh) => { P('aluno', 71, { expr: laugh ? 'laugh' : 'shock', look: 0.2, L: 'up', R: 'up' }, [-0.55, fly(f, 0), 0.1]);
    P('aluno2', 72, { expr: 'shock', look: -0.2, L: 'up', R: 'wave', wv }, [0.55, fly(f, 1), -0.1]); P('aluno3', 73, { expr: laugh ? 'grin' : 'shock', look: 0, L: 'wave', R: 'up', wv }, [0.02, fly(f, 2) + 0.35, -0.8]); };
  switch (S.id) {
    case 'hook': floaters(false); break;
    case 'harvard': P('aluno', 71, { expr: 'grin', look: 0.1, L: 'hang', R: 'wave', wv }, [-0.5, 0, 0]); P('aluno2', 72, { expr: 'smile', look: -0.1, L: 'hip', R: 'hip' }, [0.5, 0, -0.2]); break;
    case 'newton': { const hit = f >= 252; P('newton', 81, { expr: hit ? 'shock' : 'smile', look: hit ? 0 : 0.3, L: 'hang', R: hit ? 'up' : 'hip' }, [0.25, 0, 0.1]); break; }
    case 'conta': P('aluno', 71, { expr: f > 344 ? 'shock' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('newton', 81, { expr: f > 344 ? 'laugh' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'piada': floaters(true); break;
    case 'virada': P('aluno', 71, { expr: 'laugh', look: 0.3, L: 'up', R: 'up' }, L1); P('newton', 81, { expr: 'shock', look: -0.3, L: 'hang', R: 'hang' }, R1); break;
    case 'cta': { const point = f >= 557 && f < 608;
      P('aluno', 71, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('newton', 81, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': floaters(true); break;
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
  const books = () => { for (let k = 0; k < 3; k++) { const y = q(1.95 + 0.15 * Math.sin(f * 0.07 + k * 2), 2), r = q(0.3 * Math.sin(f * 0.05 + k), 1);
      out.push(FX('bk' + k + y + r, (p) => { p.g.save(); p.g.translate(300, 500); p.g.rotate(r); p.g.translate(-300, -500); PL.book(p); p.g.restore(); }, [-0.9 + k * 0.9, y + (k === 1 ? 0.25 : 0), -0.4], 0.4)); } };
  switch (S.id) {
    case 'hook': books(); st('q', -12, [0.03, 2.75, -0.6], 0.9, [['HARVARD', '#ffd23f'], ['OU A GRAVIDADE', '#fff'], ['DE NEWTON?', '#ffd23f']], '#2f6fb2', '#fff', [76, 52, 64]); break;
    case 'harvard': st('1636', 106, [0.03, 2.9, 0.4], 0.62, ['HARVARD', '1636'], '#a8323a', '#fff', [64, 110], -0.04); break;
    case 'newton': { out.push(FX('tree', (p) => PL.treeC(p), [-0.55, 0.0, -0.6], 1.3, { order: 2 }));
      const ay = f < 228 ? 2.75 : f < 252 ? q(2.75 - 0.95 * ((f - 228) / 24) ** 2, 2) : q(2.0 - 0.6 * ramp(f, 252, 270), 2), ax = f < 252 ? 0.25 : q(0.25 + 0.5 * ramp(f, 252, 270), 2);
      out.push(FX('apl' + ay + ax, (p) => PL.apple(p), [ax, ay, 0.3], 0.26));
      st('1687', 262, [-0.2, 2.35, 0.5], 0.5, ['NEWTON', '1687', 'LEI DA GRAVIDADE'], '#2f9a58', '#fff', [56, 100, 40], 0.04); break; }
    case 'conta': { const stage = f < 322 ? 0 : f < 332 ? 1 : f < 344 ? 2 : 3; if (stage) {
      const lines = [['1687', '#2f9a58'], ['− 1636', '#a8323a'], ['= 51 ANOS', '#2f6fb2']].slice(0, stage), sizes = [110, 110, 80].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 322, 10))); } break; }
    case 'piada': books(); st('sem', 386, [0.03, 2.75, -0.6], 0.9, ['MEIO SÉCULO', ['SEM LEI DA', '#ffd23f'], ['GRAVIDADE!', '#ffd23f']], '#e0453a', '#fff', [56, 70, 76]); break;
    case 'virada': st('vir', 470, [0.03, 2.25, -0.6], 0.9, ['HARVARD É', ['MAIS VELHA', '#ffd23f'], 'QUE A GRAVIDADE', 'DE NEWTON!'], '#a8323a', '#fff', [60, 76, 50, 60], -0.03);
      out.push(FX('ap2', (p) => PL.apple(p), [0.62, 1.95, 0.3], 0.14)); break;
    case 'cta':
      if (f < 608) st('c2', 560, [0.03, 2.25, -0.6], 0.9, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [50, 66]);
      else st('c3', 610, [0.03, 2.25, -0.6], 0.9, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': books(); st('logo', 662, [0.03, 2.6, -0.6], 1.1, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 666) { const t = q(((f - 666) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 3.1, -0.4], 1.8)); } break;
  }
  return out;
};

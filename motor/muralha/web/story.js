// Verdade ou Mito #2 — Muralha da China vista do espaço (MITO). Voz 27,9 s + logo até 30,4 s (912 quadros); fim = mesma cena do quadro 1 (loop).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 912, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 129, light: 'dia' },
  { id: 'km', a: 130, b: 222, light: 'dia' },
  { id: 'unica', a: 223, b: 293, light: 'dia' },
  { id: 'rua', a: 294, b: 350, light: 'dia' },
  { id: 'susp', a: 351, b: 396, light: 'dia' },
  { id: 'virada', a: 397, b: 458, light: 'dia' },
  { id: 'astro', a: 459, b: 543, light: 'dia' },
  { id: 'cor', a: 544, b: 600, light: 'dia' },
  { id: 'cta', a: 601, b: 661, light: 'dia' },
  { id: 'oculos', a: 662, b: 754, light: 'dia' },
  { id: 'segue', a: 755, b: 842, light: 'dia' },
  { id: 'fim', a: 843, b: 911, light: 'dourada' },
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
  hook: [{ f: 0, ...CA }, { f: 129, ...CB }],
  km: [{ f: 130, ...CB }, { f: 222, ...CA }],
  unica: [{ f: 223, ...CA }, { f: 293, ...CB }],
  rua: [{ f: 294, ...CB }, { f: 350, ...CA }],
  susp: [{ f: 351, ...CL2 }, { f: 396, pos: [0.05, 1.55, 3.2], look: [0.05, 2.0, 0], fov: 40 }],
  virada: [{ f: 397, ...CL }, { f: 458, ...CL2 }],
  astro: [{ f: 459, ...CL }, { f: 543, ...CL2 }],
  cor: [{ f: 544, ...CA }, { f: 600, ...CB }],
  cta: [{ f: 601, ...CL2 }, { f: 661, ...CL }],
  oculos: [{ f: 662, ...CA }, { f: 754, ...CB }],
  segue: [{ f: 755, ...CL }, { f: 842, ...CL2 }],
  fim: [{ f: 843, ...CB }, { f: 911, ...CA }],
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
  if (['hook','km','unica','rua','cor','oculos','fim'].includes(S.id)) return { focus: dist(C.pos, [0, 2, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 }; };
export const worldAt = (f) => ({ pyrS: 1, scaf: false });

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'susp': P('amigo', 71, { expr: 'nervous', look: 0.5, L: 'hang', R: 'hip' }, L1); P('civB', 72, { expr: 'nervous', look: -0.5, L: 'hip', R: 'hang' }, R1); break;
    case 'virada': P('amigo', 71, { expr: 'shock', look: 0.3, L: 'up', R: 'up' }, L1); P('civB', 72, { expr: 'laugh', look: -0.3, L: 'wave', R: 'up', wv }, R1); break;
    case 'astro': P('astro', 81, { expr: 'nervous', look: 0.4, L: 'hip', R: 'up' }, [0.02, 0, 0]); break;
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
  const bob = q((f * 0.12) % 6.283, 1), CP = [0.03, 0.05, -0.4];
  const orb = (line, a = -99) => out.push(FX('orb' + bob + line, (p) => PL.orbit(p, bob, line), CP, 1.5 * pop(f, a)));
  switch (S.id) {
    case 'hook': orb(false);
      if (f < 84) st('q', -12, [0.03, 2.1, -0.6], 1.1, ['DÁ PRA VER', ['A MURALHA', '#ffd23f'], ['DO ESPAÇO?', '#ffd23f']], '#a8323a', '#fff', [56, 66, 66]);
      else st('vm', 84, [0.03, 2.1, -0.6], 1.1, [['VERDADE', '#7b3fe4'], 'OU', ['MITO?', '#7b3fe4']], '#fff', K, [80, 50, 90]); break;
    case 'km': { const u = q(0.08 + 0.92 * ramp(f, 134, 205), 2); out.push(FX('wl' + u, (p) => PL.wall(p, u), CP, 1.5 * pop(f, 131)));
      st('km', 138, [0.03, 2.1, -0.6], 1.1, ['MAIS DE', ['20 MIL KM?', '#ffd23f']], '#2f6fb2', '#fff', [56, 76]); break; }
    case 'unica': orb(true, 224);
      st('un', 228, [0.03, 2.1, -0.6], 1.1, ['A ÚNICA OBRA', ['VISTA DE CIMA?', '#ffd23f']], '#1f9d55', '#fff', [56, 52], 0.03); break;
    case 'rua': { const c = q(ramp(f, 300, 350), 2); out.push(FX('wc' + c, (p) => PL.wall(p, 1, c), CP, 1.5));
      st('rua', 298, [0.03, 2.1, -0.6], 1.1, ['FININHA', ['COMO UMA RUA?', '#a8323a']], '#fff', K, [70, 52]); break; }
    case 'susp': { const n = Math.floor((f - 351) / 8) % 3; out.push(FX('qm' + n, (p) => PL.qm(p, n), [0.03, 1.75, 0.3], 0.5));
      st('resp', 353, [0.03, 2.4, -0.6], 0.85, ['E A RESPOSTA', 'É...'], K, '#ffd23f', [58, 62]); break; }
    case 'virada': out.push(FX('stamp', (p) => PL.stamp(p, false), [0.03, 1.55, 0.2], 1.0 * pop(f, 398, 8)));
      st('ano', 424, [0.03, 2.45, -0.6], 0.8, [['2003', '#ffd23f']], K, '#fff', [90], 0.04); break;
    case 'astro': { const n = Math.floor((f - 459) / 10) % 3; if (f > 470) out.push(FX('qa' + n, (p) => PL.qm(p, n), [0.45, 2.0, 0.3], 0.45));
      st('ac', 462, [0.03, 2.35, -0.6], 0.85, ['1º ASTRONAUTA', 'CHINÊS:', ['NÃO ACHOU!', '#ffd23f']], '#a8323a', '#fff', [52, 52, 62], 0.03); break; }
    case 'cor': { const t = q(ramp(f, 546, 600), 2); out.push(FX('ln' + t, (p) => PL.lens(p, t), CP, 1.5 * pop(f, 545)));
      st('cor', 549, [0.03, 2.1, -0.6], 1.1, ['FINA E DA', ['COR DO CHÃO', '#c9a874']], K, '#fff', [56, 62], -0.03); break; }
    case 'cta': st('cm', 604, [0.03, 2.25, -0.6], 0.9, ['QUEM CAIU', ['NESSA,', '#ffd23f'], ['COMENTA!', '#ffd23f']], '#e0453a', '#fff', [62, 62, 70]); break;
    case 'oculos': { const t = q((f - 662) * 0.1 % 6.283, 1); out.push(FX('sp' + t, (p) => PL.specs(p, t), CP, 1.5 * pop(f, 662)));
      st('mg', 666, [0.03, 2.1, -0.6], 1.1, ['MARCA O AMIGO', ['DOS ÓCULOS!', '#ffd23f']], '#2f6fb2', '#fff', [52, 66]); break; }
    case 'segue': st('c3', 757, [0.03, 2.25, -0.6], 0.9, ['SEGUE', '@PALITOLANDIA.IA', ['PRA VER O PRÓXIMO', '#ffd23f']], '#2f6fb2', '#fff', [90, 50, 38]); break;
    case 'fim': orb(false); st('logo', 846, [0.03, 2.1, -0.6], 1.1, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 850) { const t = q(((f - 850) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 3.1, -0.4], 1.8)); } break;
  }
  return out;
};

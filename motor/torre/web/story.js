// v2: gancho novo "Todo verão, a Torre Eiffel fica mais alta... e ninguém mexe nela." (+74 quadros).
// Quadros >= 143 reutilizam a v1 deslocada (f - 74). Gancho 0-85 = v1 0-68 esticado; 86-142 = cena nova "ninguem".
import * as O from './story_old.js';
import { M as E, camFromKeys, idle, blinkAt, q, ramp } from './motion.js';
export const FPS = 30, TOTAL = 959, DECK = 0, LIGHTS = O.LIGHTS;
const SHIFT = 74;
export const SHOTS = [{ ...O.SHOTS[0], a: 0, b: 85 }, { id: 'ninguem', a: 86, b: 142, light: 'dia' },
  ...O.SHOTS.slice(1).map((s) => ({ ...s, a: s.a + SHIFT, b: s.b + SHIFT }))];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const old = (f) => (f <= 85 ? (f * 68) / 85 : f - SHIFT);
const isN = (f) => f >= 86 && f <= 142;
export const lightFor = (S, f) => O.lightFor(S.id === 'ninguem' ? { light: 'dia' } : S, f);
const NK = [{ f: 86, pos: [0.05, 1.3, 4.0], look: [0.05, 2.0, 0], fov: 40 }, { f: 142, pos: [0.05, 1.35, 3.5], look: [0.05, 2.0, 0], fov: 40 }];
export const camAt = (f) => {
  if (!isN(f)) return O.camAt(old(f));
  const c = camFromKeys(NK, f, { kicks: [{ f: 96, a: 0.03 }] });
  c.flash = f >= 86 && f < 90 ? 0.35 * (1 - (f - 86) / 4) : 0; c.shadowAt = [0, 0, -0.3]; return c;
};
export const dofAt = (f) => {
  if (!isN(f)) return O.dofAt(old(f));
  const C = camAt(f); return { focus: Math.hypot(C.pos[0], C.pos[1] - 1.5, C.pos[2]), cinf: 7 };
};
export const worldAt = (f) => (isN(f) ? O.worldAt(68) : O.worldAt(old(f)));
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  if (!isN(f)) return O.actorsAt(Math.round(old(f)), T);
  const look = q(Math.sin((f - 86) * 0.12) * 0.6, 1);
  return [R(T, 'civA', { seed: 61, ...life(f, 61), facing: 0, expr: 'nervous', look, L: 'hip', R: 'hip' }, [-0.3, 0, 0.1]),
    R(T, 'civB', { seed: 62, ...life(f, 62), facing: 0, expr: f > 112 ? 'shock' : 'nervous', look: -look, L: 'up', R: 'up' }, [0.4, 0, -0.2])];
};
const qm = (p, n) => { const g = p.g; g.save(); g.font = 'bold 300px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 22; g.strokeStyle = '#1a1030'; g.fillStyle = '#ffd23f'; g.translate(300, 520); g.rotate(n % 2 ? 0.15 : -0.15); g.strokeText('?', 0, 0); g.fillText('?', 0, 0); g.restore(); };
export const fxAt = (f, T) => {
  if (!isN(f)) return O.fxAt(Math.round(old(f)), T);
  const out = [];
  const sun = O.fxAt(100, T).find((x) => x.key === 'sunC'); if (sun) out.push(sun);
  for (const [k, a, x] of [[0, 92, -0.3], [1, 104, 0.4]]) if (f >= a) {
    const s = 0.45 * Math.max(E.back(ramp(f, a, a + 10)), 0.001), bob = q(Math.sin((f - a) * 0.2) * 0.04, 2);
    out.push({ key: 'qm' + k, draw: (p) => qm(p, k), x, y: 1.75 + bob, z: 0.3 - k * 0.3, s, blob: false, shadow: false, order: 6 });
  }
  return out;
};

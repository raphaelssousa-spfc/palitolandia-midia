// Parece Mentira #10 — mamutes x pirâmides. Voz 29,0 s + final até 32,0 s (960 quadros).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 960, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 145, light: 'dia' },
  { id: 'piramide', a: 146, b: 250, light: 'dia' },
  { id: 'mamute', a: 251, b: 333, light: 'dia' },
  { id: 'conta', a: 334, b: 400, light: 'dia' },
  { id: 'farao', a: 401, b: 497, light: 'dia' },
  { id: 'casaco', a: 498, b: 576, light: 'dia' },
  { id: 'virada', a: 577, b: 660, light: 'dia' },
  { id: 'cta', a: 661, b: 874, light: 'dia' },
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
  piramide: [{ f: 146, pos: [0.5, 1.6, 4.0], look: [3.0, 5.5, -26], fov: 44 }, { f: 250, pos: [0.6, 1.6, 2.8], look: [3.2, 6.0, -26], fov: 42 }],
  mamute: [{ f: 251, ...CW_ }, { f: 333, ...CW2 }],
  conta: [{ f: 334, ...CL }, { f: 400, ...CL2 }],
  farao: [{ f: 401, pos: [0.05, 1.5, 3.6], look: [0.05, 1.5, 0], fov: 42 }, { f: 497, pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 42 }],
  casaco: [{ f: 498, pos: [0.05, 1.5, 3.6], look: [0.05, 1.5, 0], fov: 42 }, { f: 576, pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 42 }],
  virada: [{ f: 577, ...CW_ }, { f: 660, ...CW2 }],
  cta: [{ f: 661, ...CL }, { f: 874, ...CL2 }],
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
  if (S.id === 'piramide') return { focus: dist(C.pos, [3, 5, -26]), cinf: 1 };
  if (S.id === 'mamute' || S.id === 'virada') return { focus: dist(C.pos, [0.05, 1.5, 0.6]), cinf: 8 };
  if (S.id === 'hook' || S.id === 'fim') return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
};
export const worldAt = (f) => ({ brL: 0, brR: 0, brE: 0, landY: 7, flame: 0, flag: 0, signY: 10, clouds: true, board: false, museum: false });

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'hook': P('cleo', 91, { expr: 'grin', look: 0.3, L: 'hip', R: 'point' }, L1); P('amigo', 92, { expr: f > 40 ? 'shock' : 'smile', look: -0.3, L: 'hang', R: 'hip' }, R1); break;
    case 'piramide': P('cleo', 91, { expr: 'laugh', look: 0.4, L: 'hip', R: 'point' }, [-0.2, 0, 0.0]); break;
    case 'conta': P('cleo', 91, { expr: f > 365 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 365 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'farao': case 'casaco': P('cleo', 91, { expr: 'nervous', look: 0.3, L: 'up', R: 'hang' }, [-0.38, 0, 0.2]); break;
    case 'cta': { const point = f >= 755 && f < 815;
      P('cleo', 91, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('amigo', 92, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': P('cleo', 91, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]); P('amigo', 92, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
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
import * as PL from './placas.js';
const T_sun = (p) => PL.sunCard(p, 'cool');
const PLzzz = (p, t) => PL.zzz(p, t);
// mamute de desenho (de lado, virado para a direita); scarf = cachecol; ice = bloco de gelo embaixo
const mammoth = (p, t = 0, scarf = false, ice = true) => { const g = p.g; g.save(); g.translate(300, 560); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K; g.lineWidth = 12;
  if (ice) { g.fillStyle = '#e8f6ff'; g.beginPath(); g.ellipse(0, 250, 290, 60, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#bfe3f7'; g.beginPath(); g.ellipse(-60, 245, 120, 18, 0, 0, 7); g.fill(); }
  const B = '#8a5a3a', B2 = '#6e4528';
  // pernas
  g.fillStyle = B2; for (const x of [-150, -70, 60, 130]) { g.beginPath(); g.roundRect(x - 34, 60, 68, 170, 22); g.fill(); g.stroke(); }
  // corpo
  g.fillStyle = B; g.beginPath(); g.ellipse(-30, 20, 210, 150, 0, 0, 7); g.fill(); g.stroke();
  // pelos
  g.lineWidth = 7; for (let k = 0; k < 9; k++) { const x = -200 + k * 42; g.beginPath(); g.moveTo(x, 120 + (k % 2) * 10); g.lineTo(x + 8, 160); g.stroke(); }
  g.lineWidth = 12;
  // cabeça
  g.fillStyle = B; g.beginPath(); g.ellipse(160, -40, 100, 110, 0, 0, 7); g.fill(); g.stroke();
  // tromba (balança)
  const sw = 18 * Math.sin(t); g.lineWidth = 46; g.strokeStyle = K; g.beginPath(); g.moveTo(230, 0); g.quadraticCurveTo(280 + sw, 120, 240 + sw, 200); g.quadraticCurveTo(225 + sw, 225, 200 + sw, 205); g.stroke();
  g.lineWidth = 26; g.strokeStyle = B; g.stroke(); g.strokeStyle = K; g.lineWidth = 12;
  // presas
  g.strokeStyle = K; g.lineWidth = 26; g.beginPath(); g.moveTo(210, 40); g.quadraticCurveTo(250, 150, 330, 110); g.stroke(); g.strokeStyle = '#fff8e8'; g.lineWidth = 14; g.stroke(); g.strokeStyle = K; g.lineWidth = 12;
  // orelha
  g.fillStyle = B2; g.beginPath(); g.ellipse(100, -30, 40, 55, 0.2, 0, 7); g.fill(); g.stroke();
  // olho + sorriso
  g.fillStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(195, -70, 22, 0, 7); g.fill(); g.stroke(); g.fillStyle = K; g.beginPath(); g.arc(200, -68, 10, 0, 7); g.fill();
  g.beginPath(); g.moveTo(170, 20); g.quadraticCurveTo(190, 38, 212, 22); g.stroke();
  // topete
  g.lineWidth = 9; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(130 + k * 20, -145); g.quadraticCurveTo(135 + k * 22, -185, 150 + k * 20, -190); g.stroke(); }
  if (scarf) { g.lineWidth = 10; g.fillStyle = '#e0453a'; g.beginPath(); g.roundRect(60, -20, 70, 150, 24); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(90, 110); g.lineTo(60 + 6 * Math.sin(t * 2), 230); g.lineTo(110 + 6 * Math.sin(t * 2), 230); g.lineTo(120, 110); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff'; for (const y of [10, 60]) g.fillRect(64, y, 62, 14); }
  g.restore(); };
const pyrIcon = (p) => { const g = p.g; g.save(); g.lineWidth = 12; g.strokeStyle = K; g.fillStyle = '#d9b77a'; g.beginPath(); g.moveTo(300, 330); g.lineTo(520, 720); g.lineTo(80, 720); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 6; for (const y of [460, 590]) { const w = (y - 330) / 390 * 220; g.beginPath(); g.moveTo(300 - w, y); g.lineTo(300 + w, y); g.stroke(); } g.restore(); };
// linha do tempo: pirâmide 4.500 anos atrás, último mamute 4.000, hoje
const tline = (p, t) => { const g = p.g; g.save(); g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 220, 572, 560, 40); g.fill(); g.stroke();
  g.lineWidth = 14; g.beginPath(); g.moveTo(60, 600); g.lineTo(60 + 480 * t, 600); g.stroke();
  g.textAlign = 'center'; g.fillStyle = K; g.font = 'bold 40px DejaVu Sans, sans-serif'; g.fillText('ANOS ATRÁS', 300, 290);
  const mk = (x, lab, col, txt) => { g.fillStyle = col; g.beginPath(); g.arc(x, 600, 26, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = K; g.font = 'bold 48px DejaVu Sans, sans-serif'; g.fillText(lab, x, 700); g.font = 'bold 32px DejaVu Sans, sans-serif'; g.fillText(txt, x, 750); };
  mk(110, '4.500', '#d9b77a', 'PIRÂMIDE'); if (t > 0.4) mk(320, '4.000', '#8a5a3a', 'MAMUTE'); if (t > 0.9) mk(505, 'HOJE', '#ffd23f', 'VOCÊ');
  g.save(); g.translate(110, 480); g.scale(0.3, 0.3); g.translate(-300, -520); pyrIcon(p); g.restore();
  if (t > 0.4) { g.save(); g.translate(320, 470); g.scale(0.28, 0.28); g.translate(-300, -560); mammoth(p, 0, false, false); g.restore(); }
  g.restore(); };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  const tt = q(f * 0.12 % 6.283, 1);
  switch (S.id) {
    case 'hook': if (f < 82) { st('h1', 8, [-0.3, 1.7, -0.8], 1.0, ['MAMUTES'], '#8a5a3a', '#fff', [96], -0.06); st('h2', 40, [0.5, 1.22, -0.9], 0.95, ['PIRÂMIDES'], '#d9a441', K, [90], 0.06); }
      else st('esc', 82, [0.03, 1.62, -0.6], 0.95, [['VIRAM', '#fff'], ['OU NÃO?', '#ffd23f'], ['COMENTA!', '#fff']], '#2f6fb2', '#fff', [80, 96, 66]); break;
    case 'piramide': st('2560', 172, [0.55, 1.15, 0.6], 0.5, ['PIRÂMIDE', '2560 a.C.'], '#d9a441', K, [66, 96], 0.05); break;
    case 'mamute': out.push(FX('mam' + tt, (p) => mammoth(p, tt), [0.05, 0.05, 0.0], 0.95 * pop(f, 252, 10)));
      st('2000', 262, [0.05, 1.55, 0.4], 0.5, ['ÚLTIMO MAMUTE', '2000 a.C.'], '#8a5a3a', '#fff', [56, 96], -0.04); break;
    case 'conta': { const stage = f < 338 ? 0 : f < 350 ? 1 : f < 362 ? 2 : 3; if (stage) {
      const lines = [['2560', '#d9a441'], ['− 2000', '#8a5a3a'], ['= 560 ANOS', '#e0453a']].slice(0, stage), sizes = [120, 120, 80].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 338, 10))); }
      if (f >= 368) st('dep', 368, [0.03, 0.55, 0.6], 0.55, ['DEPOIS!'], '#ffd23f', K, [110], -0.08); break; }
    case 'farao': out.push(FX('sun', (p) => PL.sunCard(p, 'cool'), [-0.75, 2.05, -1.2], 0.45 * pop(f, 403)));
      if (f >= 455) { out.push(FX('mamF' + tt, (p) => mammoth(p, tt), [0.3, 0.1, -0.3], 0.62 * pop(f, 455, 10)));
        const sf = q(f, 0); out.push(FX('snow' + sf, (p) => PL.snowCard(p, f), [0.3, 0.3, -0.25], 0.62)); }
      st('calor', 412, [-0.22, 1.5, 0.9], 0.38, ['40 °C'], '#e0453a', '#fff', [110], -0.06); break;
    case 'casaco': out.push(FX('mamS' + tt, (p) => mammoth(p, tt, true), [0.3, 0.1, -0.3], 0.62));
      st('sand', 501, [-0.28, 0.3, 0.75], 0.36, ['SANDÁLIA'], '#d9a441', K, [84], -0.05);
      st('cas', 534, [0.3, 1.5, 0.0], 0.36, ['CASACO!'], '#e0453a', '#fff', [96], 0.05); break;
    case 'virada': { const t = q(ramp(f, 586, 650), 2);
      out.push(FX('tl' + t, (p) => tline(p, t), [0.05, 0.62, 0.6], 0.62 * pop(f, 580, 10)));
      st('ilha', 584, [0.05, 1.42, 0.75], 0.4, ['ILHA NO ÁRTICO'], '#2f6fb2', '#fff', [56], -0.05); break; }
    case 'cta':
      if (f < 754) st('c0', 664, [0.03, 1.62, -0.6], 0.95, [['NO PRÓXIMO:', '#fff'], ['O TIRANOSSAURO', '#ffd23f'], ['CONHECEU O', '#fff'], ['ESTEGOSSAURO?', '#ffd23f']], '#2f9a58', '#fff', [52, 54, 50, 54]);
      else if (f < 815) st('c2', 757, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [50, 66]);
      else st('c3', 817, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 879, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 883) { const t = q(((f - 883) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

// Parece Mentira #9 — tubarão x árvores. Voz 29,2 s + final até 32,0 s (960 quadros).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 960, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 136, light: 'dia' },
  { id: 'tubarao', a: 137, b: 228, light: 'dia' },
  { id: 'arvore', a: 229, b: 300, light: 'dia' },
  { id: 'conta', a: 301, b: 378, light: 'dia' },
  { id: 'musgo', a: 379, b: 490, light: 'dia' },
  { id: 'cochilo', a: 491, b: 556, light: 'dia' },
  { id: 'virada', a: 557, b: 662, light: 'dia' },
  { id: 'cta', a: 663, b: 874, light: 'dia' },
  { id: 'fim', a: 875, b: 959, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 60, fogFar: 500, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 45, el: 50, sky: '#fff6e8', ground: '#c9b890', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#d4ecfa', skyTop: '#3f95e6', skyHor: '#cfe9fb', sat: 1.12, vig: 0.2 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a89870', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const L1 = [-0.48, 0, 0.1], R1 = [0.52, 0, -0.1];
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CW_ = { pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 40 }, CW2 = { pos: [0.05, 1.5, 3.05], look: [0.05, 1.5, 0], fov: 40 };
const CAMS = {
  hook: [{ f: 0, pos: [0.1, 1.6, 6.2], look: [0.05, 2.0, -6], fov: 44 }, { f: 136, pos: [0.05, 1.5, 5.0], look: [0.05, 1.9, -3], fov: 42 }],
  tubarao: [{ f: 137, pos: [0.0, 1.3, 2.6], look: [0.0, 1.0, -3], fov: 40 }, { f: 228, pos: [0.0, 1.3, 2.2], look: [0.0, 1.0, -3], fov: 38 }],
  arvore: [{ f: 229, pos: [1.4, 1.6, 2.8], look: [1.8, 2.0, -2.6], fov: 44 }, { f: 300, pos: [1.45, 1.6, 2.4], look: [1.8, 2.05, -2.6], fov: 42 }],
  conta: [{ f: 301, ...CL }, { f: 378, ...CL2 }],
  musgo: [{ f: 379, pos: [0.05, 1.7, 4.6], look: [0.05, 0.9, -2], fov: 42 }, { f: 490, pos: [0.05, 1.6, 4.0], look: [0.05, 0.9, -2], fov: 40 }],
  cochilo: [{ f: 491, pos: [0.05, 1.4, 3.6], look: [0.05, 1.5, 0], fov: 40 }, { f: 556, pos: [0.05, 1.4, 3.2], look: [0.05, 1.5, 0], fov: 40 }],
  virada: [{ f: 557, ...CW_ }, { f: 662, ...CW2 }],
  cta: [{ f: 663, ...CL }, { f: 874, ...CL2 }],
  fim: [{ f: 875, pos: [0.05, 1.6, 6.5], look: [0.05, 2.6, -14], fov: 44 }, { f: 959, pos: [0.05, 1.6, 6.0], look: [0.05, 2.5, -14], fov: 43 }],
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
  if (S.id === 'tubarao') return { focus: dist(C.pos, [0, 1.0, -2.6]), cinf: 5 };
  if (S.id === 'virada') return { focus: dist(C.pos, [0.05, 1.5, 0.6]), cinf: 8 };
  if (S.id === 'hook' || S.id === 'fim' || S.id === 'musgo') return { focus: dist(C.pos, [0, 1.2, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
};
export const worldAt = (f) => { const id = shotAt(f).id, bare = id === 'musgo' || id === 'cochilo'; return { trees: !bare, moss: bare }; };

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'hook': P('civD', 91, { expr: 'grin', look: 0.3, L: 'hip', R: 'point' }, L1); P('amigo', 92, { expr: f > 34 ? 'shock' : 'smile', look: -0.3, L: 'hang', R: 'hip' }, R1); break;
    case 'arvore': P('amigo', 92, { expr: 'smile', look: 0.4, L: 'hip', R: 'point' }, [1.0, 0, -1.2]); break;
    case 'conta': P('civD', 91, { expr: f > 340 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 340 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'musgo': P('civD', 91, { expr: 'shock', look: 0, L: 'up', R: 'up' }, [-0.45, 0, 0.6]); break;
    case 'cochilo': { const woke = f >= 522;
      P('amigo', 92, { expr: woke ? 'nervous' : 'smile', look: 0, L: woke ? 'up' : 'hang', R: woke ? 'up' : 'hang', blink: woke ? 0 : 1 }, [0.35, 0, 0.1]); break; }
    case 'cta': { const point = f >= 753 && f < 812;
      P('civD', 91, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('amigo', 92, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': P('civD', 91, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]); P('amigo', 92, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
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
// tubarão de desenho (de lado, sorrindo); t = balanço do rabo
const shark = (p, t = 0) => { const g = p.g; g.save(); g.translate(300, 520); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = K;
  // rabo
  g.save(); g.translate(-230, 0); g.rotate(0.25 * Math.sin(t)); g.fillStyle = '#6f8fa8'; g.beginPath(); g.moveTo(10, 0); g.lineTo(-90, -110); g.lineTo(-60, 0); g.lineTo(-90, 100); g.closePath(); g.fill(); g.stroke(); g.restore();
  // barbatana de cima
  g.fillStyle = '#6f8fa8'; g.beginPath(); g.moveTo(-60, -80); g.quadraticCurveTo(-10, -220, 40, -230); g.quadraticCurveTo(20, -150, 50, -85); g.closePath(); g.fill(); g.stroke();
  // corpo
  g.fillStyle = '#7f9fb8'; g.beginPath(); g.moveTo(-240, 0); g.bezierCurveTo(-150, -110, 120, -120, 230, -20); g.quadraticCurveTo(260, 10, 230, 40); g.bezierCurveTo(120, 110, -150, 90, -240, 0); g.closePath(); g.fill(); g.stroke();
  // barriga
  g.fillStyle = '#f2f4f6'; g.lineWidth = 0; g.beginPath(); g.moveTo(-180, 35); g.bezierCurveTo(-60, 85, 120, 85, 215, 38); g.bezierCurveTo(120, 60, -60, 55, -180, 35); g.fill();
  g.lineWidth = 12; g.beginPath(); g.moveTo(-240, 0); g.bezierCurveTo(-150, 90, 120, 110, 230, 40); g.stroke();
  // nadadeira
  g.fillStyle = '#6f8fa8'; g.beginPath(); g.moveTo(10, 50); g.lineTo(-40, 150); g.lineTo(70, 70); g.closePath(); g.fill(); g.stroke();
  // guelras
  g.lineWidth = 7; for (const x of [95, 115, 135]) { g.beginPath(); g.moveTo(x, -25); g.quadraticCurveTo(x - 10, 5, x, 30); g.stroke(); }
  // olho
  g.fillStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(170, -30, 26, 0, 7); g.fill(); g.stroke(); g.fillStyle = K; g.beginPath(); g.arc(176, -28, 12, 0, 7); g.fill();
  // sorriso com dentes
  g.fillStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.moveTo(140, 22); g.quadraticCurveTo(190, 55, 236, 22); g.closePath(); g.fill(); g.stroke();
  for (let k = 0; k < 4; k++) { const x = 150 + k * 22; g.beginPath(); g.moveTo(x, 25); g.lineTo(x + 8, 38); g.lineTo(x + 16, 26); g.stroke(); }
  g.restore(); };
// árvore de desenho
const treeC = (p) => { const g = p.g; g.save(); g.lineWidth = 12; g.strokeStyle = K; g.fillStyle = '#8a5a34'; g.beginPath(); g.roundRect(255, 520, 90, 330, 20); g.fill(); g.stroke();
  g.fillStyle = '#4f9a3c'; for (const [x, y, r] of [[300, 400, 170], [190, 470, 110], [410, 470, 110]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); } g.restore(); };
// linha do tempo: tubarão lá atrás, árvores bem depois
const tline = (p, t) => { const g = p.g; g.save(); g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 220, 572, 560, 40); g.fill(); g.stroke();
  g.lineWidth = 14; g.beginPath(); g.moveTo(60, 600); g.lineTo(60 + 480 * t, 600); g.stroke();
  g.textAlign = 'center'; g.fillStyle = K; g.font = 'bold 40px DejaVu Sans, sans-serif'; g.fillText('MILHÕES DE ANOS', 300, 290);
  const mk = (x, lab, col, txt) => { g.fillStyle = col; g.beginPath(); g.arc(x, 600, 26, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = K; g.font = 'bold 50px DejaVu Sans, sans-serif'; g.fillText(lab, x, 700); g.font = 'bold 34px DejaVu Sans, sans-serif'; g.fillText(txt, x, 750); };
  mk(110, '450', '#2f6fb2', 'TUBARÃO'); if (t > 0.45) mk(330, '385', '#2f9a58', 'ÁRVORE'); if (t > 0.9) mk(500, 'HOJE', '#ffd23f', 'VOCÊ');
  g.save(); g.translate(110, 470); g.scale(0.32, 0.32); g.translate(-300, -520); shark(p, 0); g.restore();
  if (t > 0.45) { g.save(); g.translate(330, 470); g.scale(0.3, 0.3); g.translate(-300, -560); treeC(p); g.restore(); }
  g.restore(); };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  switch (S.id) {
    case 'hook': if (f < 88) { st('h1', 8, [-0.3, 1.7, -0.8], 1.0, ['TUBARÃO'], '#2f6fb2', '#fff', [96], -0.06); st('h2', 40, [0.5, 1.22, -0.9], 0.95, ['ÁRVORES'], '#2f9a58', '#fff', [96], 0.06); }
      else st('esc', 88, [0.03, 1.62, -0.6], 0.95, [['QUAL É MAIS', '#fff'], ['VELHO?', '#ffd23f'], ['COMENTA!', '#fff']], '#2f6fb2', '#fff', [66, 96, 66]); break;
    case 'tubarao': { const t = q(f * 0.25 % 6.283, 1), jump = Math.sin(clamp((f - 140) / 50, 0, 1) * Math.PI);
      out.push(FX('shark' + t, (p) => shark(p, t), [0.0, -1.4 + 1.3 * E.back(clamp((f - 137) / 20, 0, 1)) + 0.05 * Math.sin(f * 0.12), -2.6], 1.0, { shadow: false }));
      st('450', 168, [0.0, 0.05, -0.6], 0.5, ['TUBARÃO', '450', 'MILHÕES DE ANOS'], '#2f6fb2', '#fff', [64, 140, 44]); break; }
    case 'arvore': st('385', 240, [1.75, 0.5, -1.0], 0.45, ['ÁRVORE', '385', 'MILHÕES DE ANOS'], '#2f9a58', '#fff', [64, 140, 44], 0.05); break;
    case 'conta': { const stage = f < 306 ? 0 : f < 318 ? 1 : f < 330 ? 2 : 3; if (stage) {
      const lines = [['450', '#2f6fb2'], ['− 385', '#2f9a58'], ['= 65 MILHÕES', '#e0453a']].slice(0, stage), sizes = [120, 120, 66].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 306, 10))); }
      if (f >= 340) st('antes', 340, [0.03, 0.62, -0.3], 0.55, ['ANTES!'], '#ffd23f', K, [110], -0.08); break; }
    case 'musgo': { const t = q(f * 0.25 % 6.283, 1);
      out.push(FX('sharkB' + t, (p) => shark(p, t), [1.6, -0.55, -4.5], 1.0, { shadow: false }));
      st('mus', 420, [0.3, 0.9, 0.9], 0.45, ['SÓ MUSGO!'], '#2f9a58', '#fff', [96], 0.06); break; }
    case 'cochilo': { out.push(FX('sun', (p) => T_sun(p), [-0.45, 1.85, -1.2], 0.5 * pop(f, 494)));
      if (f < 522) { const t = q(((f - 491) / 30) % 1, 2); out.push(FX('zz' + t, (p) => PLzzz(p, t), [0.5, 1.25, 0.5], 0.45)); }
      else st('sombra', 524, [0.05, 1.7, -0.2], 0.55, ['CADÊ A', 'SOMBRA?!'], '#ffd23f', K, [80, 90], -0.06); break; }
    case 'virada': { const t = q(ramp(f, 566, 640), 2);
      out.push(FX('tl' + t, (p) => tline(p, t), [0.05, 0.62, 0.6], 0.62 * pop(f, 560, 10)));
      st('flor', 600, [0.05, 1.42, 0.75], 0.4, ['MAIS VELHO QUE', 'QUALQUER FLORESTA!'], '#ffd23f', K, [48, 40], -0.05); break; }
    case 'cta':
      if (f < 752) st('c0', 666, [0.03, 1.62, -0.6], 0.95, [['NO PRÓXIMO:', '#fff'], ['OS MAMUTES', '#ffd23f'], ['VIRAM AS', '#fff'], ['PIRÂMIDES?', '#ffd23f']], '#2f9a58', '#fff', [54, 72, 54, 72]);
      else if (f < 812) st('c2', 754, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [50, 66]);
      else st('c3', 814, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 879, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 883) { const t = q(((f - 883) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

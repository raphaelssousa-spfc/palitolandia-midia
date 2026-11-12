// "A lata é mais velha que o abridor" — voz 28,3 s + final até 30,8 s (30 fps, 925 quadros).
// Frases: gancho 3-89 | 1810 101-165 | 1858 178-262 | 48 anos 275-333 | escrito 345-380 | martelo 385-428 | baioneta 441-501 |
// ferro grosso 514-569 | fininha 583-623 | fez sentido 627-667 | comenta 680-723 | manda 729-773 | segue 787-839 | final 850-924.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 925, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 96, light: 'dia' },
  { id: 'lata', a: 97, b: 170, light: 'dia' },
  { id: 'abridor', a: 171, b: 270, light: 'dia' },
  { id: 'conta', a: 271, b: 339, light: 'dia' },
  { id: 'martelo', a: 340, b: 434, light: 'dia' },
  { id: 'soldado', a: 435, b: 508, light: 'dia' },
  { id: 'virada', a: 509, b: 624, light: 'dourada' },
  { id: 'sentido', a: 625, b: 676, light: 'dia' },
  { id: 'cta', a: 677, b: 849, light: 'dia' },
  { id: 'fim', a: 850, b: 924, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 45, el: 50, sky: '#fff6e8', ground: '#a9a090', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a89870', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const L1 = [-0.5, 0, 0.1], R1 = [0.55, 0, -0.1], BACK = [0.05, 0, -1.3];
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CAMS = {
  hook: [{ f: 0, pos: [0.1, 1.6, 5.4], look: [0.05, 1.7, -3], fov: 42 }, { f: 96, pos: [0.05, 1.5, 4.6], look: [0.05, 1.6, -3], fov: 41 }],
  lata: [{ f: 97, pos: [0.25, 1.4, 1.9], look: [0.05, 1.1, -0.75], fov: 38 }, { f: 170, pos: [0.1, 1.35, 1.6], look: [0.05, 1.15, -0.75], fov: 36 }],
  abridor: [{ f: 171, pos: [0.3, 1.5, 3.4], look: [0.4, 1.7, 0], fov: 38 }, { f: 270, pos: [0.3, 1.5, 3.0], look: [0.4, 1.7, 0], fov: 37 }],
  conta: [{ f: 271, ...CL }, { f: 339, ...CL2 }],
  martelo: [{ f: 340, pos: [0.05, 1.55, 2.9], look: [0.05, 1.45, -1], fov: 40 }, { f: 434, pos: [0.05, 1.5, 2.5], look: [0.05, 1.4, -1], fov: 40 }],
  soldado: [{ f: 435, pos: [-0.6, 1.5, 2.7], look: [-0.1, 1.35, -1], fov: 40 }, { f: 508, pos: [-0.3, 1.5, 2.4], look: [-0.1, 1.3, -1], fov: 39 }],
  virada: [{ f: 509, pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 40 }, { f: 624, pos: [0.05, 1.5, 3.05], look: [0.05, 1.5, 0], fov: 40 }],
  sentido: [{ f: 625, pos: [0.4, 1.55, 2.2], look: [0.05, 1.25, -0.9], fov: 38 }, { f: 676, pos: [0.25, 1.5, 1.9], look: [0.05, 1.25, -0.9], fov: 37 }],
  cta: [{ f: 677, ...CL }, { f: 849, ...CL2 }],
  fim: [{ f: 850, pos: [0.05, 1.6, 6.5], look: [0.05, 3.2, -14], fov: 44 }, { f: 924, pos: [0.05, 1.6, 6.0], look: [0.05, 3.0, -14], fov: 43 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: [] });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, 0.3), 0);
  if (S.id === 'virada') c.roll = 3 * E.easeOut(ramp(f, 509, 530));
  c.shadowAt = [0, 0, -0.6];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'lata' || S.id === 'sentido') return { focus: dist(C.pos, [0.05, 1.1, -0.75]), cinf: 6 };
  if (S.id === 'martelo' || S.id === 'soldado') return { focus: dist(C.pos, [0.05, 1.3, -0.9]), cinf: 5 };
  if (S.id === 'virada') return { focus: dist(C.pos, [0.05, 1.5, 0.6]), cinf: 8 };
  if (S.id === 'hook' || S.id === 'fim') return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
};
// batidas do martelo (quadros de impacto) e estocadas da baioneta
export const HITS = [392, 402, 412, 422];
export const STABS = [462, 478, 494];
const hitAmt = (f, list, n = 5) => list.reduce((a, h) => a + (f >= h && f < h + n ? 1 - (f - h) / n : 0), 0);
export const worldAt = (f) => {
  const sh = hitAmt(f, HITS) + hitAmt(f, STABS);
  return { fax: true, lid: q(E.back(ramp(f, 646, 660)), 3), shake: q(0.012 * sh * (f % 2 ? -1 : 1), 4) };
};

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'hook': P('inventor', 91, { expr: f > 40 ? 'grin' : 'smile', look: 0.3, L: 'hip', R: 'point' }, [-0.62, 0, -0.2]); P('amigo', 92, { expr: f > 58 ? 'shock' : 'smile', look: -0.3, L: 'hang', R: 'hip' }, [0.7, 0, -0.3]); break;
    case 'lata': break;
    case 'abridor': P('amigo', 92, { expr: f > 225 ? 'shock' : 'smile', look: -0.2, L: 'hang', R: 'up', holdR: 'opener', holdRot: 0.2 }, R1); break;
    case 'conta': P('inventor', 91, { expr: f > 305 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 305 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'martelo': { const h = HITS.find((x) => f >= x - 5 && f < x + 5); const down = h !== undefined && f >= h; const go = f >= 386;
      P('inventor', 91, { expr: go ? (down ? 'squint' : 'angry') : 'nervous', look: 0.1, L: go ? 'cross' : 'hang', R: go ? (down ? 'point' : 'up') : 'hang', holdR: go ? 'hammer' : undefined, holdRot: down ? 2.3 : 0.3 }, BACK); break; }
    case 'soldado': { const s = STABS.find((x) => f >= x - 4 && f < x + 6); const lunge = s !== undefined && f >= s ? 1 - (f - s) / 6 : 0;
      P('soldado', 93, { expr: f > 455 ? 'angry' : 'stubborn', look: 0.5, L: 'hip', R: 'point', holdR: 'rifle', holdRot: 0.55 }, [-0.62 + 0.12 * lunge, 0, -1.25]);
      break; }
    case 'sentido': P('inventor', 91, { expr: f > 650 ? 'laugh' : 'grin', look: 0.2, L: 'hip', R: f > 650 ? 'up' : 'point', holdR: 'opener', holdRot: 0.4 }, [-0.55, 0, -1.2]); break;
    case 'cta': { const point = f >= 729 && f < 785;
      P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1); P('amigo', 92, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim': P('inventor', 91, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]); P('amigo', 92, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
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
// abridor de 1858 (alavanca com lâmina curva e ponta)
const openerBig = (p) => { const g = p.g; g.save(); g.translate(300, 520); g.rotate(-0.5); g.lineWidth = 12; g.strokeStyle = K;
  g.fillStyle = '#8a5a34'; g.beginPath(); g.roundRect(-40, 60, 80, 230, 24); g.fill(); g.stroke();
  g.fillStyle = '#b9c2cc'; g.beginPath(); g.moveTo(-22, 70); g.lineTo(-22, -150); g.quadraticCurveTo(-20, -250, 70, -270); g.lineTo(60, -230); g.quadraticCurveTo(20, -210, 22, -150); g.lineTo(22, 70); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-22, -60); g.lineTo(-110, -40); g.lineTo(-22, -20); g.closePath(); g.fill(); g.stroke(); g.restore(); };
// rótulo com instruções
const label = (p) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(-0.04);
  g.fillStyle = '#f3e3b0'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(-270, -190, 540, 380, 30); g.fill(); g.stroke();
  g.strokeStyle = '#c8402f'; g.lineWidth = 6; g.strokeRect(-240, -160, 480, 320);
  g.fillStyle = '#c8402f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 52px DejaVu Sans, sans-serif'; g.fillText('COMO ABRIR:', 0, -100);
  g.fillStyle = K; g.font = 'bold 62px DejaVu Sans, sans-serif'; g.fillText('MARTELO', 0, -10); g.font = 'bold 40px DejaVu Sans, sans-serif'; g.fillText('E', 0, 45); g.font = 'bold 62px DejaVu Sans, sans-serif'; g.fillText('TALHADEIRA', 0, 100);
  g.restore(); };
// corte das latas: parede grossa x fininha
const cut = (p, t1, t2) => { const g = p.g; g.save();
  g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 160, 572, 680, 40); g.fill(); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const can = (cx, w, col) => { g.fillStyle = '#e9d9b8'; g.fillRect(cx - 100, 330, 200, 300); g.fillStyle = col; g.strokeStyle = K; g.lineWidth = 6;
    for (const r of [[cx - 100 - w, 310, w, 340], [cx + 100, 310, w, 340], [cx - 100 - w, 310, 200 + 2 * w, w], [cx - 100 - w, 650 - w, 200 + 2 * w, w]]) { g.fillRect(...r); g.strokeRect(...r); } };
  if (t1 > 0) { g.globalAlpha = t1; can(170, 38, '#5c5a57'); g.fillStyle = K; g.font = 'bold 56px DejaVu Sans, sans-serif'; g.fillText('1810', 170, 240); g.font = 'bold 34px DejaVu Sans, sans-serif'; g.fillText('FERRO', 170, 720); g.fillText('GROSSO', 170, 765); }
  if (t2 > 0) { g.globalAlpha = t2; can(440, 8, '#9aa3ad'); g.fillStyle = K; g.font = 'bold 56px DejaVu Sans, sans-serif'; g.fillText('1858', 440, 240); g.font = 'bold 34px DejaVu Sans, sans-serif'; g.fillText('FININHA', 440, 742); }
  g.globalAlpha = 1; g.restore(); };
const toc = (p, k) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(k % 2 ? 0.12 : -0.12); g.fillStyle = '#ffd23f'; g.strokeStyle = K; g.lineWidth = 10;
  g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 90 : 170, a = i * Math.PI / 8; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r * 1.3, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
  g.fillStyle = K; g.font = 'bold 84px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k === 9 ? 'TÓIN!' : 'TOC!', 0, 4); g.restore(); };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  switch (S.id) {
    case 'hook': if (f < 36) st('h0', -12, [0.05, 1.45, -0.9], 1.3, ['O QUE VEIO', 'PRIMEIRO?'], '#fff', K, [78, 78], -0.03);
      else { st('h1', 40, [-0.35, 2.25, -0.9], 0.95, ['LATA'], '#2f6fb2', '#fff', [120], -0.06); st('h2', 58, [0.45, 1.75, -1.0], 0.95, ['ABRIDOR'], '#e0453a', '#fff', [86], 0.06); } break;
    case 'lata': st('1810', 140, [0.05, 1.04, -0.45], 0.45, ['LATA', '1810'], '#2f6fb2', '#fff', [70, 150]); break;
    case 'abridor': out.push(FX('opb', openerBig, [0.0, 1.0, -0.6], 0.7 * pop(f, 176))); st('1858', 235, [0.15, 1.75, -0.6], 0.7, ['ABRIDOR', '1858'], '#e0453a', '#fff', [70, 150], 0.05); break;
    case 'conta': { const stage = f < 275 ? 0 : f < 290 ? 1 : f < 305 ? 2 : 3; if (stage) {
      const lines = [['1858', '#e0453a'], ['− 1810', '#2f6fb2'], ['= 48 ANOS', '#2f9a58']].slice(0, stage), sizes = [110, 110, 80].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 275, 10))); } break; }
    case 'martelo': out.push(FX('label', label, [-0.38, 1.5, -0.7], 0.42 * pop(f, 345)));
      HITS.forEach((h, k) => { if (f >= h && f < h + 8) out.push(FX('toc' + k, (p) => toc(p, k), [0.3 + (k % 2 ? -0.4 : 0), 0.95, -0.4], 0.35 * pop(f, h, 4))); }); break;
    case 'soldado': st('bay', 450, [-0.15, 1.55, -0.8], 0.72, ['NA BAIONETA!'], '#ffd23f', K, [68], -0.05);
      STABS.forEach((h, k) => { if (f >= h && f < h + 8) out.push(FX('stb' + k, (p) => toc(p, 9), [0.12, 0.85, -0.45], 0.33 * pop(f, h, 4))); }); break;
    case 'virada': { const t1 = q(ramp(f, 514, 526), 2), t2 = q(ramp(f, 585, 597), 2);
      out.push(FX('cut' + t1 + '_' + t2, (p) => cut(p, t1, t2), [0.05, 0.62, 0.6], 0.8 * pop(f, 511, 10))); break; }
    case 'sentido': if (f >= 650) { const t = q(((f - 650) / 26) % 1, 2); out.push(FX('sst' + t, (p) => T.fxStars(p, t), [0.05, 1.3, -0.6], 0.8)); }
      st('sim', 652, [0.1, 1.35, -0.6], 0.42, ['AGORA SIM!'], '#2f9a58', '#fff', [76], -0.05); break;
    case 'cta':
      if (f < 727) st('c1', 682, [0.03, 1.62, -0.6], 0.95, ['COMENTA AÍ', 'SE VOCÊ SABIA!'], '#ffd23f', K, [80, 60]);
      else if (f < 785) st('c2', 731, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [56, 72]);
      else st('c3', 789, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 855, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 859) { const t = q(((f - 859) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

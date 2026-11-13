// Parece Mentira #8 (refeito) — voz 29,7 s + final até 32,0 s (960 quadros).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 960, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 133, light: 'dia' },
  { id: 'fax', a: 134, b: 208, light: 'dia' },
  { id: 'fone', a: 209, b: 291, light: 'dia' },
  { id: 'conta', a: 292, b: 350, light: 'dia' },
  { id: 'truque', a: 351, b: 452, light: 'dia' },
  { id: 'desenho', a: 453, b: 560, light: 'dia' },
  { id: 'virada', a: 561, b: 690, light: 'dia' },
  { id: 'cta', a: 691, b: 890, light: 'dia' },
  { id: 'fim', a: 891, b: 959, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 45, el: 50, sky: '#fff6e8', ground: '#a9a090', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a89870', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const L1 = [-0.48, 0, 0.1], R1 = [0.52, 0, -0.1];
const CL = { pos: [0.05, 1.45, 4.4], look: [0.05, 1.95, 0], fov: 40 }, CL2 = { pos: [0.05, 1.5, 3.8], look: [0.05, 2.0, 0], fov: 40 };
const CAMS = {
  hook: [{ f: 0, pos: [0.1, 1.6, 6.2], look: [0.05, 2.4, -6], fov: 44 }, { f: 133, pos: [0.05, 1.5, 5.0], look: [0.05, 2.1, -3], fov: 42 }],
  fax: [{ f: 134, pos: [-0.1, 1.35, 2.6], look: [-0.05, 1.2, -0.75], fov: 38 }, { f: 208, pos: [-0.05, 1.35, 2.2], look: [-0.05, 1.25, -0.75], fov: 36 }],
  fone: [{ f: 209, pos: [0.3, 1.5, 3.4], look: [0.4, 1.8, 0], fov: 38 }, { f: 291, pos: [0.3, 1.5, 3.0], look: [0.4, 1.8, 0], fov: 37 }],
  conta: [{ f: 292, ...CL }, { f: 350, ...CL2 }],
  truque: [{ f: 351, pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 40 }, { f: 452, pos: [0.05, 1.5, 3.05], look: [0.05, 1.5, 0], fov: 40 }],
  desenho: [{ f: 453, ...CL }, { f: 560, ...CL2 }],
  virada: [{ f: 561, pos: [0.05, 1.5, 3.3], look: [0.05, 1.5, 0], fov: 40 }, { f: 690, pos: [0.05, 1.5, 3.05], look: [0.05, 1.5, 0], fov: 40 }],
  cta: [{ f: 691, ...CL }, { f: 890, ...CL2 }],
  fim: [{ f: 891, pos: [0.05, 1.6, 6.5], look: [0.05, 3.2, -14], fov: 44 }, { f: 959, pos: [0.05, 1.6, 6.0], look: [0.05, 3.0, -14], fov: 43 }],
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
  if (S.id === 'fax') return { focus: dist(C.pos, [-0.05, 1.2, -0.75]), cinf: 6 };
  if (S.id === 'truque' || S.id === 'virada') return { focus: dist(C.pos, [0.05, 1.5, 0.6]), cinf: 8 };
  if (S.id === 'hook' || S.id === 'fim') return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 2 };
  return { focus: dist(C.pos, [0, 1.5, 0]), cinf: 6 };
};
export const worldAt = (f) => ({ fax: true, swing: 0.45 * Math.sin(f * 0.16) });

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'hook': P('inventor', 91, { expr: 'grin', look: 0.3, L: 'hip', R: 'point' }, L1); P('amigo', 92, { expr: f > 34 ? 'shock' : 'smile', look: -0.3, L: 'hang', R: 'hip' }, R1); break;
    case 'fax': P('inventor', 91, { expr: 'laugh', look: 0.4, L: 'hip', R: 'point' }, [-0.5, 0, -0.35]); break;
    case 'fone': P('amigo', 92, { expr: f > 255 ? 'shock' : 'smile', look: -0.2, L: 'hang', R: 'up' }, R1); break;
    case 'conta': P('inventor', 91, { expr: f > 323 ? 'laugh' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1); P('amigo', 92, { expr: f > 323 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'desenho': {
      const ask = f >= 488;
      P('inventor', 91, { expr: ask ? 'nervous' : 'grin', look: 0.4, L: ask ? 'up' : 'hang', R: ask ? 'up' : 'point' }, L1);
      P('amigo', 92, { expr: ask ? 'shock' : 'laugh', look: -0.4, L: ask ? 'up' : 'hip', R: ask ? 'up' : 'hip' }, R1); break; }
    case 'cta': { const point = f >= 778 && f < 835;
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
// telefone de 1876 (caixa de madeira com bocal)
const phone = (p) => { const g = p.g; g.save(); g.lineWidth = 12; g.strokeStyle = K;
  g.fillStyle = '#8a5a34'; g.beginPath(); g.roundRect(170, 330, 260, 380, 24); g.fill(); g.stroke();
  g.fillStyle = '#d1a63c'; for (const x of [235, 365]) { g.beginPath(); g.arc(x, 395, 46, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#2a1d16'; g.beginPath(); g.moveTo(255, 520); g.lineTo(345, 520); g.lineTo(380, 600); g.lineTo(220, 600); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#5a371f'; g.beginPath(); g.roundRect(440, 450, 40, 150, 14); g.fill(); g.stroke(); g.restore(); };
// diagrama do truque: duas máquinas, pêndulos sincronizados, fio com pulsos, imagem copiada linha por linha
const IMG = (x, y) => { const dx = x - 0.5, dy = y - 0.5; const face = dx * dx + dy * dy < 0.16; const eye = ((x - 0.36) ** 2 + (y - 0.38) ** 2 < 0.004) || ((x - 0.64) ** 2 + (y - 0.38) ** 2 < 0.004);
  const smile = Math.abs(Math.hypot(dx, dy - 0.02) - 0.22) < 0.035 && y > 0.55; return face && !eye && !smile; };
const diagram = (p, t, sw) => { const g = p.g; g.save();
  g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 120, 572, 760, 40); g.fill(); g.stroke();
  g.fillStyle = K; g.font = 'bold 46px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText('PARIS', 160, 190); g.fillText('LYON', 440, 190);
  const N = 14, rows = Math.floor(t * N);
  for (const [cx, src] of [[160, true], [440, false]]) {
    // pêndulo
    const ang = sw, px = cx, py = 240; g.lineWidth = 8; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(ang) * 120, py + Math.cos(ang) * 120); g.stroke();
    g.fillStyle = '#d1a63c'; g.beginPath(); g.arc(px + Math.sin(ang) * 120, py + Math.cos(ang) * 120, 20, 0, 7); g.fill(); g.lineWidth = 6; g.stroke();
    // folha
    const fx = cx - 100, fy = 420, sz = 200; g.fillStyle = '#ffffff'; g.lineWidth = 8; g.fillRect(fx, fy, sz, sz); g.strokeRect(fx, fy, sz, sz);
    const cs = sz / N; g.fillStyle = '#2a2a36';
    for (let r = 0; r < N; r++) { if (!src && r >= rows) break; for (let c = 0; c < N; c++) if (IMG((c + 0.5) / N, (r + 0.5) / N)) g.fillRect(fx + c * cs, fy + r * cs, cs + 0.5, cs + 0.5); }
    if (rows < N) { g.strokeStyle = '#e0453a'; g.lineWidth = 6; const ly = fy + (rows + 0.5) * cs; g.beginPath(); g.moveTo(fx - 10, ly); g.lineTo(fx + sz + 10, ly); g.stroke(); g.strokeStyle = K; }
  }
  // fio + pulsos
  g.lineWidth = 8; g.strokeStyle = K; g.beginPath(); g.moveTo(260, 520); g.lineTo(340, 520); g.stroke();
  g.beginPath(); g.moveTo(160, 660); g.bezierCurveTo(160, 760, 440, 760, 440, 660); g.stroke();
  g.fillStyle = '#ffd23f'; for (let k = 0; k < 4; k++) { const u = (t * 9 + k / 4) % 1; const x = 160 + 280 * u, y = 660 + 75 * Math.sin(Math.PI * u); g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); }
  g.fillStyle = K; g.font = 'bold 40px DejaVu Sans, sans-serif'; g.fillText('LINHA POR LINHA', 300, 840); g.restore(); };
// desenho enviado (gato de bigode)
const doodle = (p) => { const g = p.g; g.save(); g.translate(300, 520); g.rotate(0.08);
  g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.fillRect(-200, -230, 400, 460); g.strokeRect(-200, -230, 400, 460);
  g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(-90, -60); g.lineTo(-70, -160); g.lineTo(-20, -105); g.moveTo(90, -60); g.lineTo(70, -160); g.lineTo(20, -105); g.stroke();
  g.fillStyle = K; g.beginPath(); g.arc(-40, -20, 12, 0, 7); g.arc(40, -20, 12, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-80, 40); g.quadraticCurveTo(0, 0, 80, 40); g.stroke(); g.restore(); };
// mapa da França com Paris → Lyon
const FR = [[300, 150], [380, 190], [470, 230], [500, 300], [470, 380], [500, 460], [470, 560], [400, 640], [330, 660], [260, 630], [170, 650], [120, 580], [140, 480], [100, 400], [80, 320], [150, 280], [210, 230], [250, 170]];
const map = (p, t) => { const g = p.g; g.save();
  g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 120, 572, 640, 40); g.fill(); g.stroke();
  g.fillStyle = '#9fd17a'; g.lineWidth = 9; g.beginPath(); FR.forEach(([x, y], i) => (i ? g.lineTo(x, y + 20) : g.moveTo(x, y + 20))); g.closePath(); g.fill(); g.stroke();
  const P0 = [290, 300], P1 = [400, 500];
  g.setLineDash([22, 16]); g.strokeStyle = '#e0453a'; g.lineWidth = 10; g.beginPath(); g.moveTo(...P0); g.lineTo(P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#2f6fb2'; g.strokeStyle = K; g.lineWidth = 6; for (const [x, y] of [P0, P1]) { g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = K; g.font = 'bold 44px DejaVu Sans, sans-serif'; g.textAlign = 'left'; g.fillText('PARIS', 320, 290); g.fillText('LYON', 300, 560); g.restore(); };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  switch (S.id) {
    case 'hook': if (f < 84) { st('h1', 8, [-0.3, 1.7, -0.8], 1.0, ['FAX'], '#2f6fb2', '#fff', [120], -0.06); st('h2', 34, [0.5, 1.22, -0.9], 0.95, ['TELEFONE'], '#e0453a', '#fff', [78], 0.06); }
      else st('esc', 84, [0.03, 1.62, -0.6], 0.95, [['QUAL VEIO', '#fff'], ['PRIMEIRO?', '#ffd23f'], ['COMENTA!', '#fff']], '#2f6fb2', '#fff', [70, 80, 70]); break;
    case 'fax': st('1843', 170, [-0.05, 1.15, -0.6], 0.6, ['FAX', '1843'], '#2f6fb2', '#fff', [70, 150]); break;
    case 'fone': out.push(FX('phone', phone, [0.0, 1.0, -0.4], 0.75 * pop(f, 212))); st('1876', 255, [0.15, 1.95, -0.6], 0.7, ['TELEFONE', '1876'], '#e0453a', '#fff', [70, 150], 0.05); break;
    case 'conta': { const stage = f < 297 ? 0 : f < 310 ? 1 : f < 323 ? 2 : 3; if (stage) {
      const lines = [['1876', '#e0453a'], ['− 1843', '#2f6fb2'], ['= 33 ANOS', '#2f9a58']].slice(0, stage), sizes = [110, 110, 80].slice(0, stage);
      out.push(FX('conta' + stage, (p) => plate(p, lines, '#fff', K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 297, 10))); } break; }
    case 'truque': { const t = ramp(f, 360, 445), k = q(t, 2), sw = q(0.5 * Math.sin(f * 0.18), 2);
      out.push(FX('dg' + k + '_' + sw, (p) => diagram(p, k, sw), [0.05, 0.63, 0.6], 0.8 * pop(f, 354, 10))); break; }
    case 'desenho': {
      out.push(FX('doodle', doodle, [0.05, 1.25, -0.5], 0.55 * pop(f, 456)));
      if (f >= 540) st('chegou', 540, [0.05, 2.3, -0.3], 0.55, ['CHEGOU???'], '#ffd23f', K, [96], -0.08);
      break; }
    case 'virada': { const t = q(ramp(f, 600, 650), 2);
      out.push(FX('map' + t, (p) => map(p, t), [0.05, 0.75, 0.6], 0.8 * pop(f, 564, 10)));
      st('1865', 575, [0.25, 0.75, 0.65], 0.45, ['1865'], '#e0453a', '#fff', [140], 0.08);
      st('alo', 655, [0.05, 1.42, 0.75], 0.44, ['ANTES DO', 'PRIMEIRO ALÔ!'], '#ffd23f', K, [64, 58], -0.05); break; }
    case 'cta':
      if (f < 776) st('c0', 694, [0.03, 1.62, -0.6], 0.95, [['NO PRÓXIMO:', '#fff'], ['TUBARÃO', '#ffd23f'], ['OU ÁRVORE?', '#ffd23f']], '#2f9a58', '#fff', [58, 84, 70]);
      else if (f < 835) st('c2', 778, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], '#e0453a', '#fff', [50, 66]);
      else st('c3', 837, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], '#2f6fb2', '#fff', [90, 50]); break;
    case 'fim': st('logo', 895, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], '#ffd23f', K, [54, 36]);
      if (f >= 899) { const t = q(((f - 899) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break;
  }
  return out;
};

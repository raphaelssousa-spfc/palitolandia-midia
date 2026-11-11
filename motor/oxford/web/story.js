// "Oxford é mais velha que o Império Asteca" — voice.wav 32,4 s + final até 34,7 s (30 fps, 1041 quadros).
// Frases: gancho 4-92 | "Faz a conta... 1096" 110-216 | "Asteca... 1428" 228-324 | "300 anos" 338-421 | "primeiro imperador" 433-506 |
// "três séculos de aluno dormindo" 515-605 | "E a virada: caiu em 1521" 619-~718 | "e Oxford continua até hoje" ~722-790 | "Comenta" 802-845 | "manda" 851-895 | "Segue" 909-961.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1041, DECK = 0;
export const SHOTS = [
  { id: 'oxf', a: 0, b: 46, light: 'dia' },
  { id: 'breve', a: 47, b: 108, light: 'quente' },
  { id: 'oxf2', a: 109, b: 226, light: 'dia' },
  { id: 'azt', a: 227, b: 337, light: 'quente' },
  { id: 'conta', a: 338, b: 432, light: 'dia' },
  { id: 'coroa', a: 433, b: 514, light: 'quente' },
  { id: 'dorme', a: 515, b: 618, light: 'dia' },
  { id: 'virada', a: 619, b: 721, light: 'poente' },
  { id: 'hoje', a: 722, b: 800, light: 'dia' },
  { id: 'cta', a: 801, b: 960, light: 'dia' },
  { id: 'fim', a: 961, b: 1040, light: 'dourada' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;
const BASE = { fogNear: 120, fogFar: 1000, shadowExt: 9 };
export const LIGHTS = {
  dia: { ...BASE, az: 50, el: 50, sky: '#fff6e8', ground: '#7fb85a', hemi: 1.2, sun: '#fff3dc', sunI: 2.1, fog: '#dcecfa', skyTop: '#4f9fe6', skyHor: '#d4e9fb', sat: 1.1, vig: 0.2 },
  quente: { ...BASE, az: 60, el: 52, sky: '#fff0d0', ground: '#d9b077', hemi: 1.2, sun: '#fff0cc', sunI: 2.3, fog: '#f3e2bf', skyTop: '#3f9be8', skyHor: '#f6e4c0', sat: 1.15, vig: 0.2 },
  poente: { ...BASE, az: 75, el: 16, sky: '#ffcf9e', ground: '#8a5a48', hemi: 1.0, sun: '#ff9a5a', sunI: 2.2, fog: '#e88a6a', skyTop: '#5a3f8a', skyHor: '#ff9a6a', sat: 1.2, vig: 0.32 },
  dourada: { ...BASE, az: 30, el: 18, sky: '#ffe0b8', ground: '#a8b860', hemi: 1.05, sun: '#ffb874', sunI: 2.3, fog: '#ffe0c0', skyTop: '#6e8fe0', skyHor: '#ffcf9e', sat: 1.16, vig: 0.26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light], shadowExt: S.id === 'oxf' || S.id === 'breve' || S.id === 'fim' ? 26 : 9 });

const AX = 300;
const L1 = [-0.45, 0, 0.1], R1 = [0.5, 0, -0.15], C1 = [0.02, 0, -0.9];
const CAMS = {
  oxf: [{ f: 0, pos: [0.2, 1.4, 6.5], look: [0, 4.0, -14], fov: 46 }, { f: 46, pos: [0.1, 1.4, 5.4], look: [0, 3.6, -14], fov: 44 }],
  breve: [{ f: 47, pos: [AX + 0.4, 2.0, 9], look: [AX, 2.6, -20], fov: 42 }, { f: 108, pos: [AX + 0.2, 1.8, 7.5], look: [AX, 2.4, -20], fov: 40 }],
  oxf2: [{ f: 109, pos: [0.05, 1.5, 5.0], look: [0.05, 2.4, -6], fov: 42 }, { f: 226, pos: [0.05, 1.45, 4.3], look: [0.05, 2.2, -6], fov: 40 }],
  azt: [{ f: 227, pos: [AX, 1.6, 5.6], look: [AX, 3.6, -20], fov: 44 }, { f: 337, pos: [AX, 1.5, 4.6], look: [AX, 3.0, -20], fov: 42 }],
  conta: [{ f: 338, pos: [0.05, 1.45, 4.4], look: [0.05, 2.0, 0], fov: 40 }, { f: 432, pos: [0.05, 1.5, 3.8], look: [0.05, 2.05, 0], fov: 40 }],
  coroa: [{ f: 433, pos: [AX, 1.3, 3.6], look: [AX, 1.6, 0], fov: 36 }, { f: 514, pos: [AX, 1.4, 2.8], look: [AX, 1.75, 0], fov: 34 }],
  dorme: [{ f: 515, pos: [0.05, 1.45, 4.8], look: [0.05, 1.7, -0.5], fov: 40 }, { f: 618, pos: [0.05, 1.4, 4.0], look: [0.05, 1.7, -0.5], fov: 38 }],
  virada: [{ f: 619, pos: [AX, 1.5, 4.4], look: [AX, 2.4, -6], fov: 42 }, { f: 721, pos: [AX, 1.4, 3.6], look: [AX, 2.0, -6], fov: 40, roll: -2 }],
  hoje: [{ f: 722, pos: [0.05, 1.5, 5.0], look: [0.05, 2.4, -6], fov: 42 }, { f: 800, pos: [0.05, 1.45, 4.4], look: [0.05, 2.2, -6], fov: 40 }],
  cta: [{ f: 801, pos: [0.05, 1.45, 4.4], look: [0.05, 2.0, 0], fov: 40 }, { f: 960, pos: [0.05, 1.5, 3.8], look: [0.05, 2.05, 0], fov: 40 }],
  fim: [{ f: 961, pos: [0.05, 1.6, 6.5], look: [0.05, 3.2, -14], fov: 44 }, { f: 1040, pos: [0.05, 1.6, 6.0], look: [0.05, 3.0, -14], fov: 43 }],
};
const KICKS = [];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  const fl = (a, n, k) => (f >= a && f < a + n ? k * (1 - (f - a) / n) : 0);
  c.flash = SHOTS.slice(1).reduce((acc, s) => acc + fl(s.a, 4, s.id === 'virada' ? 0.6 : 0.35), 0);
  const ax = S.light === 'quente' || S.light === 'poente' ? AX : 0;
  c.shadowAt = S.id === 'oxf' || S.id === 'fim' ? [0, 0, -5] : S.id === 'breve' ? [AX, 0, -10] : [ax, 0, -0.3];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), ax = C.pos[0] > 100 ? AX : 0;
  if (S.id === 'oxf' || S.id === 'breve' || S.id === 'fim') return { focus: dist(C.pos, [ax, 1.5, 0]), cinf: 2 };
  return { focus: dist(C.pos, [ax, 1.5, 0]), cinf: 6 };
};
export const worldAt = (f) => {
  const id = shotAt(f).id;
  return { pyrS: id === 'breve' ? 0.22 : 1, scaf: id === 'breve' };
};

const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2] });
const at = (p, dx = 0) => [p[0] + dx, p[1], p[2]];
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], wv = q(f * 0.3 % 6.283, 1);
  const P = (who, seed, o, pos) => out.push(R(T, who, { seed, ...life(f, seed), facing: 0, ...o }, pos));
  switch (S.id) {
    case 'oxf': P('aluno', 71, { expr: 'grin', look: 0.1, L: 'hang', R: 'wave', wv }, [0, 0, 0]); break;
    case 'breve': break;
    case 'oxf2':
      P('aluno', 71, { expr: f > 190 ? 'laugh' : 'smile', look: 0.2, L: 'hang', R: f > 190 ? 'up' : 'hip' }, L1);
      P('aluno2', 72, { expr: 'grin', look: -0.2, L: 'hip', R: 'hip' }, R1);
      P('aluno3', 73, { expr: 'smile', look: 0, L: 'hang', R: 'hang' }, C1); break;
    case 'azt': P('asteca', 81, { expr: f > 290 ? 'laugh' : 'grin', look: 0.1, L: 'hip', R: f > 290 ? 'up' : 'hip' }, [AX, 0, 0]); break;
    case 'conta':
      P('aluno', 71, { expr: f > 398 ? 'shock' : 'smile', look: 0.4, L: 'hang', R: 'point' }, L1);
      P('asteca', 81, { expr: f > 398 ? 'shock' : 'grin', look: -0.4, L: 'hip', R: 'hip' }, R1); break;
    case 'coroa': {
      const crowned = f >= 472;
      out.push(R(T, crowned ? 'asteca' : 'asteca0', { seed: 81, ...life(f, 81), facing: 0, expr: crowned ? 'grin' : 'smile', look: 0, L: crowned ? 'up' : 'hip', R: crowned ? 'up' : 'hip' }, [AX, 0, 0])); break; }
    case 'dorme': {
      const nod = (s) => q(10 + 4 * Math.sin(f * 0.08 + s), 1);
      P('aluno', 71, { expr: 'snore', look: 0, L: 'hang', R: 'hang', headTilt: nod(0) }, L1);
      P('aluno2', 72, { expr: 'snore', look: 0, L: 'cross', R: 'cross', headTilt: -nod(1) }, R1);
      P('aluno3', 73, { expr: 'snore', look: 0, L: 'hang', R: 'hang', headTilt: nod(2) }, C1); break; }
    case 'virada': P('asteca', 81, { expr: f > 690 ? 'shock' : 'nervous', look: 0, L: 'hang', R: 'hang', headTilt: q(f > 690 ? -6 : 0, 1) }, [AX, 0, 0]); break;
    case 'hoje':
      P('aluno', 71, { expr: 'laugh', look: 0.2, L: 'up', R: 'up', bob: q(0.04 * Math.abs(Math.sin(f * 0.3)), 3) }, L1);
      P('aluno2', 72, { expr: 'laugh', look: -0.2, L: 'up', R: 'up' }, R1);
      P('aluno3', 73, { expr: 'grin', look: 0, L: 'wave', R: 'wave', wv }, C1); break;
    case 'cta': {
      const point = f >= 851 && f < 905;
      P('aluno', 71, { expr: 'laugh', look: 0, L: 'hang', R: point ? 'point' : 'wave', wv }, L1);
      P('asteca', 81, { expr: 'grin', look: 0, L: point ? 'point' : 'wave', R: 'hip', wv }, R1); break; }
    case 'fim':
      P('aluno', 71, { expr: 'laugh', look: 0, L: 'hang', R: 'wave', wv }, [-0.6, 0, 0.6]);
      P('asteca', 81, { expr: 'grin', look: 0, L: 'wave', R: 'hip', wv }, [0.65, 0, 0.5]); break;
  }
  return out;
};

const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
const plate = (p, lines, bg, fg, sizes, rot = -0.05) => {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(rot);
  const lh = sizes.map((z) => z * 1.25), h = lh.reduce((x, y) => x + y, 0) + 60;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(-272, -h / 2 + 14, 560, h, 40); g.fill();
  g.fillStyle = bg; g.strokeStyle = '#1a1030'; g.lineWidth = 12; g.beginPath(); g.roundRect(-284, -h / 2, 560, h, 40); g.fill(); g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = -h / 2 + 30; lines.forEach((t, i) => { const [txt, col] = Array.isArray(t) ? t : [t, fg]; g.fillStyle = col; g.font = `bold ${sizes[i]}px DejaVu Sans, sans-serif`; g.fillText(txt, -4, y + lh[i] / 2); y += lh[i]; }); g.restore();
};
const pop = (f, a, d = 12) => Math.max(E.back(ramp(f, a, a + d)), 0.001);
const zzz = (p, t) => { const g = p.g; g.save(); g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#1a1030'; g.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1, x = 300 + 60 * Math.sin(k * 6 + i) + i * 30, y = 820 - k * 620, sz = 70 + k * 90; g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.font = `bold ${sz}px DejaVu Sans, sans-serif`; g.strokeText('Z', x, y); g.fillText('Z', x, y); } g.restore(); };
const BL = '#2f6fb2', GR = '#2f9a58', RD = '#e0453a', YL = '#ffd23f', WH = '#ffffff', K = '#1a1030';
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const st = (key, a, pos, s, lines, bg, fg, sizes, rot) => { if (f >= a) out.push(FX(key, (p) => plate(p, lines, bg, fg, sizes, rot), pos, s * pop(f, a))); };
  switch (S.id) {
    case 'oxf': st('ox', 8, [0, 3.2, -2], 1.3, ['OXFORD'], BL, WH, [110]); break;
    case 'breve': st('breve', 56, [AX, 0.8, -6], 2.6, ['IMPÉRIO ASTECA:', 'EM BREVE...'], YL, K, [52, 84], 0.06); break;
    case 'oxf2': st('1096', 190, [0.05, 1.55, -1.5], 0.95, ['JÁ TINHA AULA', '1096'], BL, WH, [56, 150]); break;
    case 'azt': st('1428', 292, [AX, 2.6, -3], 1.4, ['SÓ NASCEU EM', '1428'], GR, WH, [56, 150]); break;
    case 'conta': {
      const stage = f < 350 ? 0 : f < 368 ? 1 : f < 398 ? 2 : 3; if (stage) {
        const lines = [['1428', GR], ['− 1096', BL], ['= 332 ANOS', RD]].slice(0, stage), sizes = [110, 110, 80].slice(0, stage);
        out.push(FX('conta' + stage, (p) => plate(p, lines, WH, K, sizes, 0), [0.03, 2.25 - 0.15 * stage, -0.6], 0.8 * pop(f, 350, 10)));
      } break; }
    case 'coroa': {
      st('trono', 476, [AX, 1.95, -0.6], 0.6, ['1º IMPERADOR'], GR, WH, [72], 0.05);
      if (f >= 472 && f < 500) { const t = q((f - 472) / 28, 2); out.push(FX('cst' + t, (p) => T.fxStars(p, t), [AX, 1.05, 0.05], 0.8)); } break; }
    case 'dorme': {
      for (const [i, pos] of [[0, L1], [1, R1], [2, C1]]) { const t = q(((f - 515) / 50 + i * 0.37) % 1, 2); out.push(FX('z' + i + t, (p) => zzz(p, t), [pos[0] + 0.15, 1.25, pos[2] + 0.05], 0.55)); }
      st('sec', 560, [0.05, 1.95, -1.6], 0.75, ['3 SÉCULOS', 'DE AULA'], BL, WH, [78, 78], 0.04); break; }
    case 'virada': st('1521', 690, [AX, 1.7, -3], 1.3, ['FIM DO IMPÉRIO', '1521'], RD, WH, [54, 150], 0.08); break;
    case 'hoje': {
      st('hoje', 736, [0.05, 1.9, -1.5], 0.9, ['E OXFORD?', 'ATÉ HOJE!'], YL, K, [70, 100]);
      if (f >= 736) { const t = q(((f - 736) / 26) % 1, 2); out.push(FX('hst' + t, (p) => T.fxStars(p, t), [0.05, 1.0, -0.4], 1.6)); } break; }
    case 'cta': {
      if (f < 851) st('c1', 806, [0.03, 1.62, -0.6], 0.95, ['COMENTA', 'SE VOCÊ SABIA!'], YL, K, [86, 60]);
      else if (f < 906) st('c2', 853, [0.03, 1.62, -0.6], 0.95, ['MANDA PRA QUEM', 'VAI DUVIDAR!'], RD, WH, [56, 72]);
      else st('c3', 908, [0.03, 1.62, -0.6], 0.95, ['SEGUE', '@PALITOLANDIA.IA'], BL, WH, [90, 50]); break; }
    case 'fim': {
      st('logo', 966, [0.02, 2.0, 0.2], 1.5, ['PALITOLÂNDIA.IA', 'curiosidades animadas'], YL, K, [54, 36]);
      if (f >= 970) { const t = q(((f - 970) / 40) % 1, 2); out.push(FX('fst' + t, (p) => T.fxStars(p, t), [0, 2.4, 0.1], 1.8)); } break; }
  }
  return out;
};

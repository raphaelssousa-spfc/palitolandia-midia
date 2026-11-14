// PLACAS E EFEITOS 2D da Palitolândia (cartões FX desenhados no canvas do card 600x1000; centro do card = (300,500)).
// Uso no story.js:  import * as PL from './placas.js';  ...  FX('key', p => PL.plate(p, ['1843'], '#2f6fb2', '#fff', [120]), pos, s)
// pop(f, a) = escala de entrada com "pulo" (use como multiplicador do s).
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (f, a, b) => cl((f - a) / (b - a));
const backE = (u) => { u = cl(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
export const pop = (f, a, d = 12) => Math.max(backE(ramp(f, a, a + d)), 0.001);
export const K = '#1a1030';

export const plate = (p, lines, bg, fg, sizes, rot = -0.05) => {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(rot);
  const lh = sizes.map((z) => z * 1.25), h = lh.reduce((x, y) => x + y, 0) + 60;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(-272, -h / 2 + 14, 560, h, 40); g.fill();
  g.fillStyle = bg; g.strokeStyle = '#1a1030'; g.lineWidth = 12; g.beginPath(); g.roundRect(-284, -h / 2, 560, h, 40); g.fill(); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = -h / 2 + 30; lines.forEach((t, i) => { const [txt, col] = Array.isArray(t) ? t : [t, fg]; g.fillStyle = col; g.font = `bold ${sizes[i]}px DejaVu Sans, sans-serif`; g.fillText(txt, -4, y + lh[i] / 2); y += lh[i]; }); g.restore();
};
export const phone = (p) => { const g = p.g; g.save(); g.lineWidth = 12; g.strokeStyle = K;
  g.fillStyle = '#8a5a34'; g.beginPath(); g.roundRect(170, 330, 260, 380, 24); g.fill(); g.stroke();
  g.fillStyle = '#d1a63c'; for (const x of [235, 365]) { g.beginPath(); g.arc(x, 395, 46, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#2a1d16'; g.beginPath(); g.moveTo(255, 520); g.lineTo(345, 520); g.lineTo(380, 600); g.lineTo(220, 600); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#5a371f'; g.beginPath(); g.roundRect(440, 450, 40, 150, 14); g.fill(); g.stroke(); g.restore(); };
export const IMG = (x, y) => { const dx = x - 0.5, dy = y - 0.5; const face = dx * dx + dy * dy < 0.16; const eye = ((x - 0.36) ** 2 + (y - 0.38) ** 2 < 0.004) || ((x - 0.64) ** 2 + (y - 0.38) ** 2 < 0.004);
  const smile = Math.abs(Math.hypot(dx, dy - 0.02) - 0.22) < 0.035 && y > 0.55; return face && !eye && !smile; };
export const diagram = (p, t, sw) => { const g = p.g; g.save();
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
export const doodle = (p) => { const g = p.g; g.save(); g.translate(300, 520); g.rotate(0.08);
  g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.fillRect(-200, -230, 400, 460); g.strokeRect(-200, -230, 400, 460);
  g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(-90, -60); g.lineTo(-70, -160); g.lineTo(-20, -105); g.moveTo(90, -60); g.lineTo(70, -160); g.lineTo(20, -105); g.stroke();
  g.fillStyle = K; g.beginPath(); g.arc(-40, -20, 12, 0, 7); g.arc(40, -20, 12, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-80, 40); g.quadraticCurveTo(0, 0, 80, 40); g.stroke(); g.restore(); };
export const FR = [[300, 150], [380, 190], [470, 230], [500, 300], [470, 380], [500, 460], [470, 560], [400, 640], [330, 660], [260, 630], [170, 650], [120, 580], [140, 480], [100, 400], [80, 320], [150, 280], [210, 230], [250, 170]];
export const map = (p, t) => { const g = p.g; g.save();
  g.fillStyle = '#fbf5e6'; g.strokeStyle = K; g.lineWidth = 12; g.beginPath(); g.roundRect(14, 120, 572, 640, 40); g.fill(); g.stroke();
  g.fillStyle = '#9fd17a'; g.lineWidth = 9; g.beginPath(); FR.forEach(([x, y], i) => (i ? g.lineTo(x, y + 20) : g.moveTo(x, y + 20))); g.closePath(); g.fill(); g.stroke();
  const P0 = [290, 300], P1 = [400, 500];
  g.setLineDash([22, 16]); g.strokeStyle = '#e0453a'; g.lineWidth = 10; g.beginPath(); g.moveTo(...P0); g.lineTo(P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#2f6fb2'; g.strokeStyle = K; g.lineWidth = 6; for (const [x, y] of [P0, P1]) { g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = K; g.font = 'bold 44px DejaVu Sans, sans-serif'; g.textAlign = 'left'; g.fillText('PARIS', 320, 290); g.fillText('LYON', 300, 560); g.restore(); };
export const zzz = (p, t) => { const g = p.g; g.save(); g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#1a1030'; g.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1, x = 300 + 60 * Math.sin(k * 6 + i) + i * 30, y = 820 - k * 620, sz = 70 + k * 90; g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.font = `bold ${sz}px DejaVu Sans, sans-serif`; g.strokeText('Z', x, y); g.fillText('Z', x, y); } g.restore(); };
export const sunCard = (p, mood, note) => {
  const cx = 300, cy = 500, Rr = 190;
  for (let i = 0; i < 14; i++) { const an = i * Math.PI * 2 / 14; p.stroke([[cx + Math.cos(an) * Rr * 1.12, cy + Math.sin(an) * Rr * 1.12], [cx + Math.cos(an) * Rr * 1.5, cy + Math.sin(an) * Rr * 1.5]], 28, '#ffae00'); }
  p.ell(cx, cy, Rr, Rr, '#ffd23f', 12);
  p.ell(cx - 110, cy + 50, 34, 22, '#ff9a7a', 0); p.ell(cx + 110, cy + 50, 34, 22, '#ff9a7a', 0);
  if (mood === 'cool') {
    p.poly([[cx - 130, cy - 55], [cx - 20, cy - 55], [cx - 32, cy + 20], [cx - 118, cy + 20]], '#1b1b24', 9);
    p.poly([[cx + 20, cy - 55], [cx + 130, cy - 55], [cx + 118, cy + 20], [cx + 32, cy + 20]], '#1b1b24', 9);
    p.stroke([[cx - 20, cy - 42], [cx + 20, cy - 42]], 10);
  } else {
    const arc = (x) => { const pts = []; for (let k = 0; k <= 12; k++) { const an = Math.PI + k * Math.PI / 12; pts.push([x + Math.cos(an) * 34, cy - 20 + Math.sin(an) * 30]); } return pts; };
    p.stroke(arc(cx - 70), 12); p.dot(cx + 70, cy - 22, 15);
  }
  const sm = []; for (let k = 0; k <= 16; k++) { const an = 0.15 * Math.PI + k * 0.7 * Math.PI / 16; sm.push([cx + Math.cos(an) * 85, cy + 40 + Math.sin(an) * 62]); }
  p.stroke(sm, 12);
  if (note) { const g = p.g; g.save(); g.translate(cx + 20, cy + 235); g.rotate(-0.12); g.fillStyle = '#fff6a0'; g.strokeStyle = '#241726'; g.lineWidth = 9;
    g.fillRect(-170, -95, 340, 190); g.strokeRect(-170, -95, 340, 190); g.fillStyle = '#241726'; g.font = 'bold 84px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('8 MIN', 0, -34); g.fillText('ATRÁS', 0, 46); g.restore(); }
};
export const watchCard = (p, deg) => {
  const cx = 300, cy = 500;
  p.stroke([[cx, cy - 150], [cx, cy - 205]], 24, '#3a3a46'); p.ell(cx, cy, 160, 160, '#f6f2e6', 11);
  if (deg > 2) { const pts = [[cx, cy]]; for (let k = 0; k <= Math.max(2, Math.round(deg / 6)); k++) { const an = -Math.PI / 2 + Math.min(deg, 360) * (k / Math.max(2, Math.round(deg / 6))) * Math.PI / 180; pts.push([cx + Math.cos(an) * 138, cy + Math.sin(an) * 138]); } p.poly(pts, '#ff6a5a', 0); }
  for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; p.stroke([[cx + Math.cos(an) * 142, cy + Math.sin(an) * 142], [cx + Math.cos(an) * 122, cy + Math.sin(an) * 122]], 7); }
  const ha = -Math.PI / 2 + Math.min(deg, 360) * Math.PI / 180; p.stroke([[cx, cy], [cx + Math.cos(ha) * 118, cy + Math.sin(ha) * 118]], 12); p.dot(cx, cy, 14);
};
export const qm = (p, n) => { const g = p.g; g.save(); g.font = 'bold 300px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 22; g.strokeStyle = '#1a1030'; g.fillStyle = '#ffd23f'; g.translate(300, 520); g.rotate(n % 2 ? 0.15 : -0.15); g.strokeText('?', 0, 0); g.fillText('?', 0, 0); g.restore(); };
export const thermo = (p, lv) => {
  const cx = 300; p.ell(cx, 780, 80, 80, '#e23b3b', 11);
  p.poly([[cx - 40, 250], [cx + 40, 250], [cx + 40, 760], [cx - 40, 760]], '#fff6f6', 11);
  p.ell(cx, 250, 40, 30, '#fff6f6', 11);
  const top = 760 - lv * 480; p.poly([[cx - 22, top], [cx + 22, top], [cx + 22, 790], [cx - 22, 790]], '#e23b3b', 0);
  for (let i = 0; i < 6; i++) p.stroke([[cx + 40, 300 + i * 80], [cx + 78, 300 + i * 80]], 8);
};
export const gapCard = (p, ph) => {
  p.poly([[40, 470], [250, 470], [250, 560], [40, 560]], '#5b8fd9', 11); p.poly([[350 + ph, 470], [560, 470], [560, 560], [350 + ph, 560]], '#5b8fd9', 11);
  p.stroke([[262, 640], [338 + ph, 640]], 12); p.stroke([[262, 640], [290, 618]], 12); p.stroke([[262, 640], [290, 662]], 12); p.stroke([[338 + ph, 640], [310 + ph, 618]], 12); p.stroke([[338 + ph, 640], [310 + ph, 662]], 12);
  const g = p.g; g.save(); g.fillStyle = '#ffd23f'; g.strokeStyle = '#1a1030'; g.lineWidth = 10; g.beginPath(); g.roundRect(120, 330, 360, 110, 30); g.fill(); g.stroke();
  g.fillStyle = '#1a1030'; g.font = 'bold 84px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLGA', 300, 388); g.restore();
};
export const snowCard = (p, f) => {
  const n = 70; for (let i = 0; i < n; i++) { const sx = (i * 97.3) % 600, sy = ((i * 61.7) + f * (4 + (i % 4))) % 1000, r = 3 + (i % 3) * 2; p.ell(sx + 20 * Math.sin(f * 0.05 + i), sy, r, r, '#ffffff', 0); }
};

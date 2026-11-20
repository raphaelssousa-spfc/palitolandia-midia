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

// tubarão de desenho (de lado, sorrindo); t = balanço do rabo
export const shark = (p, t = 0) => { const g = p.g; g.save(); g.translate(300, 520); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = K;
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
export const treeC = (p) => { const g = p.g; g.save(); g.lineWidth = 12; g.strokeStyle = K; g.fillStyle = '#8a5a34'; g.beginPath(); g.roundRect(255, 520, 90, 330, 20); g.fill(); g.stroke();
  g.fillStyle = '#4f9a3c'; for (const [x, y, r] of [[300, 400, 170], [190, 470, 110], [410, 470, 110]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); } g.restore(); };

// mamute de desenho (de lado, virado para a direita); scarf = cachecol; ice = bloco de gelo embaixo
export const mammoth = (p, t = 0, scarf = false, ice = true) => { const g = p.g; g.save(); g.translate(300, 560); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K; g.lineWidth = 12;
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

export const pyrIcon = (p) => { const g = p.g; g.save(); g.lineWidth = 12; g.strokeStyle = K; g.fillStyle = '#d9b77a'; g.beginPath(); g.moveTo(300, 330); g.lineTo(520, 720); g.lineTo(80, 720); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 6; for (const y of [460, 590]) { const w = (y - 330) / 390 * 220; g.beginPath(); g.moveTo(300 - w, y); g.lineTo(300 + w, y); g.stroke(); } g.restore(); };
// tiranossauro de desenho (de lado, virado para a direita); t = balanço (bracinhos/boca); glasses = óculos de leitura
export const trex = (p, t = 0, glasses = false) => { const g = p.g; g.save(); g.translate(285, 580); g.scale(0.88, 0.88); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K; g.lineWidth = 12;
  const B = '#5aa848', B2 = '#3f8f3c', bob = 6 * Math.sin(t);
  // cauda
  g.fillStyle = B; g.beginPath(); g.moveTo(-60, -60); g.quadraticCurveTo(-200, -40, -285, 40 + bob); g.quadraticCurveTo(-190, 40, -60, 70); g.closePath(); g.fill(); g.stroke();
  // perna de trás (escura)
  g.fillStyle = B2; g.beginPath(); g.roundRect(-70, 40, 64, 190, 26); g.fill(); g.stroke(); g.beginPath(); g.ellipse(-20, 232, 56, 20, 0, 0, 7); g.fill(); g.stroke();
  // corpo
  g.fillStyle = B; g.beginPath(); g.ellipse(-10, 0, 150, 115, -0.35, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#c7e89a'; g.beginPath(); g.ellipse(40, 30, 70, 70, -0.35, 0, 7); g.fill();
  // perna da frente
  g.fillStyle = B; g.beginPath(); g.roundRect(0, 50, 70, 180, 26); g.fill(); g.stroke(); g.beginPath(); g.ellipse(55, 232, 60, 20, 0, 0, 7); g.fill(); g.stroke();
  // pescoço + cabeça
  g.fillStyle = B; g.beginPath(); g.moveTo(60, -90); g.lineTo(150, -190); g.lineTo(170, -80); g.lineTo(100, -10); g.closePath(); g.fill();
  g.save(); g.translate(170, -200 + bob * 0.5);
  g.beginPath(); g.roundRect(-70, -70, 210, 110, 44); g.fill(); g.stroke();
  // mandíbula
  g.beginPath(); g.roundRect(-40, 30, 160, 46, 20); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.lineWidth = 5; for (let k = 0; k < 5; k++) { const x = -20 + k * 30; g.beginPath(); g.moveTo(x, 36); g.lineTo(x + 10, 54); g.lineTo(x + 20, 36); g.closePath(); g.fill(); g.stroke(); }
  g.lineWidth = 8; g.fillStyle = '#fff'; g.beginPath(); g.arc(30, -20, 22, 0, 7); g.fill(); g.stroke(); g.fillStyle = K; g.beginPath(); g.arc(36, -18, 10, 0, 7); g.fill();
  g.beginPath(); g.moveTo(5, -52); g.lineTo(55, -46); g.stroke(); // sobrancelha
  g.fillStyle = K; g.beginPath(); g.arc(120, -40, 6, 0, 7); g.fill(); // narina
  if (glasses) { g.lineWidth = 7; g.fillStyle = 'rgba(200,230,255,0.5)'; g.beginPath(); g.arc(30, -20, 32, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-2, -24); g.lineTo(-40, -36); g.stroke(); }
  g.restore();
  // bracinhos (balançam)
  g.strokeStyle = K; g.lineWidth = 26; const a = 0.4 * Math.sin(t * 2);
  for (const dx of [0, 24]) { g.beginPath(); g.moveTo(95 + dx, -20); g.lineTo(140 + dx + 20 * Math.cos(a), 10 + 20 * Math.sin(a)); g.stroke(); }
  g.strokeStyle = B; g.lineWidth = 12; for (const dx of [0, 24]) { g.beginPath(); g.moveTo(95 + dx, -20); g.lineTo(140 + dx + 20 * Math.cos(a), 10 + 20 * Math.sin(a)); g.stroke(); }
  g.restore(); };
// estegossauro de desenho (de lado, virado para a direita); fossil = esqueleto cor de osso em pedestal de museu
export const stego = (p, t = 0, fossil = false) => { const g = p.g; g.save(); g.translate(300, 600); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K; g.lineWidth = 12;
  const B = fossil ? '#efe6cf' : '#7fb0d8', B2 = fossil ? '#d8cba8' : '#5b8fbf', PLc = fossil ? '#e2d6b6' : '#f08a3c';
  if (fossil) { g.fillStyle = '#b89a72'; g.beginPath(); g.roundRect(-280, 200, 560, 70, 16); g.fill(); g.stroke(); }
  const bob = 4 * Math.sin(t);
  // placas nas costas
  g.fillStyle = PLc; const pts = [[-170, -40], [-110, -95], [-40, -120], [30, -115], [95, -85]];
  for (const [x, y] of pts) { g.beginPath(); g.moveTo(x - 34, y + 40); g.lineTo(x, y - 60); g.lineTo(x + 34, y + 40); g.closePath(); g.fill(); g.stroke(); }
  // cauda com espinhos
  g.fillStyle = B; g.beginPath(); g.moveTo(-150, -20); g.quadraticCurveTo(-240, -10, -290, -60 + bob); g.quadraticCurveTo(-230, 40, -150, 60); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#fff8e8'; for (const [x, y, r] of [[-270, -60, -0.9], [-250, -50, -0.4]]) { g.save(); g.translate(x, y + bob); g.rotate(r); g.beginPath(); g.moveTo(-10, 0); g.lineTo(0, -60); g.lineTo(10, 0); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  // pernas
  g.fillStyle = B2; for (const x of [-130, 70]) { g.beginPath(); g.roundRect(x - 30, 40, 60, 160, 22); g.fill(); g.stroke(); }
  // corpo
  g.fillStyle = B; g.beginPath(); g.ellipse(-30, 10, 175, 105, 0, 0, 7); g.fill(); g.stroke();
  if (fossil) { g.lineWidth = 7; for (let k = 0; k < 6; k++) { const x = -150 + k * 50; g.beginPath(); g.moveTo(x, -50); g.quadraticCurveTo(x + 18, 20, x, 80); g.stroke(); } g.lineWidth = 12; }
  g.fillStyle = B2; for (const x of [-90, 120]) { g.beginPath(); g.roundRect(x - 30, 50, 60, 150, 22); g.fill(); g.stroke(); }
  // cabeça pequena, baixa
  g.fillStyle = B; g.beginPath(); g.moveTo(120, -10); g.quadraticCurveTo(190, 0, 210, 50); g.lineTo(150, 60); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(225, 55 + bob, 62, 40, 0.15, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 8;
  if (fossil) { g.fillStyle = K; g.beginPath(); g.arc(230, 42 + bob, 14, 0, 7); g.fill(); }
  else { g.fillStyle = '#fff'; g.beginPath(); g.arc(232, 40 + bob, 15, 0, 7); g.fill(); g.stroke(); g.fillStyle = K; g.beginPath(); g.arc(236, 41 + bob, 7, 0, 7); g.fill();
    g.beginPath(); g.moveTo(240, 70 + bob); g.quadraticCurveTo(260, 80, 278, 66 + bob); g.stroke(); }
  g.restore(); };

// cartas de baralho japonês (hanafuda) em leque — t = balanço; projeto motor/nintendo
export const hanafuda = (p, t = 0) => { const g = p.g; g.save(); g.translate(300, 640); g.lineJoin = 'round'; g.strokeStyle = K; g.lineWidth = 10;
  const card = (rot, kind) => { g.save(); g.rotate(rot + 0.03 * Math.sin(t + rot * 3)); g.translate(0, -230);
    g.fillStyle = '#fbf5e6'; g.beginPath(); g.roundRect(-85, -130, 170, 260, 18); g.fill(); g.stroke();
    if (kind === 0) { // lua cheia sobre morro
      g.fillStyle = '#e0453a'; g.beginPath(); g.roundRect(-70, -115, 140, 120, 8); g.fill();
      g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(0, -55, 40, 0, 7); g.fill(); g.lineWidth = 6; g.stroke();
      g.fillStyle = '#1a1030'; g.beginPath(); g.moveTo(-70, 115); g.quadraticCurveTo(0, -10, 70, 115); g.closePath(); g.fill(); }
    else if (kind === 1) { // flor de cerejeira
      g.fillStyle = '#e0453a'; for (let k = 0; k < 5; k++) { const a = k * 1.2566; g.beginPath(); g.arc(30 * Math.cos(a), -20 + 30 * Math.sin(a), 24, 0, 7); g.fill(); }
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(0, -20, 14, 0, 7); g.fill();
      g.strokeStyle = '#1a1030'; g.lineWidth = 9; g.beginPath(); g.moveTo(-60, 110); g.quadraticCurveTo(-20, 40, 0, 10); g.stroke(); }
    else { // grou vermelho/sol
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(25, -60, 42, 0, 7); g.fill();
      g.fillStyle = '#e0453a'; g.beginPath(); g.ellipse(-10, 30, 50, 26, -0.4, 0, 7); g.fill();
      g.fillStyle = '#1a1030'; g.beginPath(); g.moveTo(10, 15); g.lineTo(50, -25); g.lineTo(58, -18); g.lineTo(22, 22); g.closePath(); g.fill(); g.fillRect(-30, 50, 8, 60); g.fillRect(-12, 50, 8, 60); }
    g.restore(); };
  card(-0.42, 0); card(0, 1); card(0.42, 2);
  g.restore(); };

// avião antigo de 1903 (biplano de madeira e pano, de lado) — t = giro da hélice
export const biplane = (p, t = 0) => { const g = p.g; g.save(); g.translate(300, 500); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K; g.lineWidth = 10;
  const W = '#f3e6c4', Wd = '#d9c48f';
  // asas (de lado: duas tábuas compridas)
  g.fillStyle = Wd; g.beginPath(); g.roundRect(-250, 40, 500, 44, 16); g.fill(); g.stroke();
  g.fillStyle = W; g.beginPath(); g.roundRect(-250, -120, 500, 44, 16); g.fill(); g.stroke();
  // montantes
  g.lineWidth = 8; for (const x of [-220, -120, -20, 80, 180]) { g.beginPath(); g.moveTo(x, -76); g.lineTo(x, 40); g.stroke(); }
  g.lineWidth = 3; for (const x of [-220, -120, -20, 80]) { g.beginPath(); g.moveTo(x, -76); g.lineTo(x + 100, 40); g.stroke(); }
  // leme da frente e cauda
  g.lineWidth = 8; g.beginPath(); g.moveTo(-250, -20); g.lineTo(-330, -20); g.stroke(); g.beginPath(); g.moveTo(250, -20); g.lineTo(330, -20); g.stroke();
  g.fillStyle = W; g.lineWidth = 8; g.beginPath(); g.roundRect(-380, -36, 60, 30, 8); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(320, -90, 26, 120, 8); g.fill(); g.stroke();
  // piloto deitado na asa de baixo (palitinho)
  g.fillStyle = '#1a1030'; g.beginPath(); g.arc(-40, 22, 16, 0, 7); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(-25, 30); g.lineTo(60, 32); g.stroke();
  g.fillStyle = '#6b4a2b'; g.beginPath(); g.ellipse(-44, 12, 18, 9, 0, 0, 7); g.fill();
  // trilho de lançamento + rodinhas
  g.fillStyle = '#8a5a34'; g.lineWidth = 8; for (const x of [-120, 120]) { g.beginPath(); g.moveTo(x, 84); g.lineTo(x, 120); g.stroke(); g.beginPath(); g.arc(x, 130, 16, 0, 7); g.fill(); g.stroke(); }
  // hélice girando (atrás das asas)
  const s = Math.cos(t * 3); g.fillStyle = '#8a5a34'; g.lineWidth = 6; g.beginPath(); g.ellipse(270, -20, 14, 70 * Math.abs(s) + 6, 0, 0, 7); g.fill(); g.stroke();
  g.restore(); };

// maçã vermelha de desenho (com folhinha) — projeto motor/harvard
export const apple = (p) => { const g = p.g; g.save(); g.translate(300, 520); g.lineWidth = 14; g.strokeStyle = K;
  g.fillStyle = '#e0453a'; g.beginPath(); g.moveTo(0, -120); g.bezierCurveTo(120, -200, 230, -60, 140, 110); g.bezierCurveTo(90, 200, 20, 170, 0, 150); g.bezierCurveTo(-20, 170, -90, 200, -140, 110); g.bezierCurveTo(-230, -60, -120, -200, 0, -120); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-70, -50, 22, 45, 0.4, 0, 7); g.fill();
  g.lineWidth = 12; g.beginPath(); g.moveTo(0, -120); g.lineTo(10, -190); g.stroke();
  g.fillStyle = '#5aa848'; g.lineWidth = 10; g.beginPath(); g.ellipse(55, -175, 50, 22, -0.4, 0, 7); g.fill(); g.stroke(); g.restore(); };
// livro aberto de desenho (para flutuar) — projeto motor/harvard
export const book = (p) => { const g = p.g; g.save(); g.translate(300, 500); g.lineWidth = 12; g.strokeStyle = K; g.lineJoin = 'round';
  g.fillStyle = '#2f6fb2'; g.beginPath(); g.moveTo(-200, -90); g.lineTo(0, -60); g.lineTo(200, -90); g.lineTo(200, 110); g.lineTo(0, 140); g.lineTo(-200, 110); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#fbf5e6'; g.beginPath(); g.moveTo(-180, -100); g.lineTo(0, -72); g.lineTo(180, -100); g.lineTo(180, 90); g.lineTo(0, 120); g.lineTo(-180, 90); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(0, -72); g.lineTo(0, 120); g.stroke();
  g.lineWidth = 6; for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(sd * 30, -30 + k * 35); g.lineTo(sd * 150, -45 + k * 35); g.stroke(); }
  g.restore(); };
// ---- Série B "Verdade ou mito?" (18/11) — projeto motor/tunel ----
const txt = (g, s, x, y, sz, col = K, al = 'center') => { g.fillStyle = col; g.font = `bold ${sz}px DejaVu Sans, sans-serif`; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(s, x, y); };
// corte do chão: loja (esq.) — túnel tracejado — banco com cofre (dir.). t = 0..1 avanço do túnel; dig = balanço da pá.
export const tunnel = (p, t = 1, dig = 0, cash = true) => { const g = p.g; g.save(); g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = K;
  g.fillStyle = '#bfe6ff'; g.beginPath(); g.roundRect(10, 150, 580, 300, [40, 40, 0, 0]); g.fill();
  g.fillStyle = '#9a6a3c'; g.beginPath(); g.roundRect(10, 440, 580, 380, [0, 0, 40, 40]); g.fill();
  g.fillStyle = '#7d532c'; for (let i = 0; i < 26; i++) { const x = 30 + (i * 97) % 540, y = 480 + (i * 53) % 320; g.beginPath(); g.ellipse(x, y, 10, 6, 0, 0, 7); g.fill(); }
  g.fillStyle = '#5fae46'; g.fillRect(10, 432, 580, 18);
  g.beginPath(); g.roundRect(10, 150, 580, 670, 40); g.stroke();
  // loja de grama
  g.fillStyle = '#7fc35a'; g.fillRect(50, 330, 150, 105); g.strokeRect(50, 330, 150, 105); g.fillStyle = '#e0453a'; g.fillRect(40, 300, 170, 36); g.strokeRect(40, 300, 170, 36);
  txt(g, 'GRAMA', 125, 318, 26, '#fff'); g.fillStyle = '#5a3a24'; g.fillRect(105, 375, 40, 60); g.strokeRect(105, 375, 40, 60);
  // banco
  g.fillStyle = '#d9dde4'; g.fillRect(370, 250, 200, 185); g.strokeRect(370, 250, 200, 185); g.fillStyle = '#9aa3b0'; g.beginPath(); g.moveTo(360, 252); g.lineTo(470, 195); g.lineTo(580, 252); g.closePath(); g.fill(); g.stroke();
  for (const x of [395, 435, 505, 545]) { g.fillStyle = '#fff'; g.fillRect(x - 9, 300, 18, 120); g.strokeRect(x - 9, 300, 18, 120); }
  txt(g, 'BANCO', 470, 233, 28);
  // cofre
  g.fillStyle = '#6f7884'; g.fillRect(390, 600, 170, 150); g.strokeRect(390, 600, 170, 150); g.fillStyle = '#c9ced6'; g.beginPath(); g.arc(475, 675, 48, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 7; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + dig * 0.3; g.beginPath(); g.moveTo(475, 675); g.lineTo(475 + Math.cos(a) * 40, 675 + Math.sin(a) * 40); g.stroke(); } g.lineWidth = 10;
  if (cash) { g.fillStyle = '#5fbf5a'; for (let k = 0; k < 3; k++) { g.fillRect(404 + k * 50, 760 - 10, 40, 22); g.strokeRect(404 + k * 50, 760 - 10, 40, 22); } }
  // poço + túnel
  g.fillStyle = '#3a2614'; g.fillRect(110, 440, 40, 230); const x1 = 150 + (390 - 150) * t;
  g.beginPath(); g.moveTo(110, 640); g.lineTo(x1, 640); g.lineTo(x1, 700); g.lineTo(110, 700); g.closePath(); g.fill();
  g.setLineDash([18, 12]); g.strokeStyle = '#ffd23f'; g.lineWidth = 7; g.beginPath(); g.moveTo(130, 670); g.lineTo(x1 - 4, 670); g.stroke(); g.setLineDash([]); g.strokeStyle = K; g.lineWidth = 10;
  // escavador (boneco de palito com capacete e pá)
  const hx = Math.min(x1 - 30, 360), hy = 668; g.lineWidth = 8;
  g.beginPath(); g.arc(hx, hy - 20, 13, 0, 7); g.fillStyle = '#f5c9a0'; g.fill(); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(hx, hy - 24, 14, Math.PI, 0); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(hx, hy - 7); g.lineTo(hx - 6, hy + 18); g.moveTo(hx - 3, hy + 2); g.lineTo(hx + 18 + 6 * Math.sin(dig), hy - 4); g.stroke();
  g.strokeStyle = '#8a5a34'; g.beginPath(); g.moveTo(hx + 6, hy + 4); g.lineTo(hx + 30 + 8 * Math.sin(dig), hy - 10); g.stroke(); g.fillStyle = '#9aa3b0'; g.strokeStyle = K; g.lineWidth = 5;
  g.beginPath(); g.ellipse(hx + 34 + 8 * Math.sin(dig), hy - 12, 9, 6, -0.5, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#c4935a'; for (let k = 0; k < 4; k++) { const u = ((dig * 0.4 + k * 0.25) % 1); g.beginPath(); g.arc(hx + 20 - u * 40, hy - 30 - 30 * Math.sin(u * Math.PI), 6, 0, 7); g.fill(); }
  g.restore(); };
// fachada de loja "GRAMA SINTÉTICA" com rolo de grama; t = balanço da placa
export const shop = (p, t = 0) => { const g = p.g; g.save(); g.lineJoin = 'round'; g.lineWidth = 11; g.strokeStyle = K;
  g.fillStyle = '#f3e3c2'; g.fillRect(60, 300, 480, 470); g.strokeRect(60, 300, 480, 470);
  g.save(); g.translate(300, 250); g.rotate(0.05 * Math.sin(t)); g.fillStyle = '#2f9a58'; g.beginPath(); g.roundRect(-250, -70, 500, 140, 24); g.fill(); g.stroke();
  txt(g, 'GRAMA', 0, -26, 56, '#fff'); txt(g, 'SINTÉTICA', 0, 34, 50, '#ffd23f'); g.restore();
  for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#e0453a' : '#fff'; g.beginPath(); g.moveTo(60 + k * 80, 330); g.lineTo(140 + k * 80, 330); g.lineTo(140 + k * 80, 380); g.quadraticCurveTo(100 + k * 80, 410, 60 + k * 80, 380); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = '#bfe6ff'; g.fillRect(100, 430, 200, 190); g.strokeRect(100, 430, 200, 190); g.fillStyle = '#5a3a24'; g.fillRect(370, 450, 120, 320); g.strokeRect(370, 450, 120, 320);
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(470, 610, 10, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#5fae46'; g.beginPath(); g.ellipse(200, 600, 80, 34, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#4c9a38'; g.beginPath(); g.ellipse(270, 600, 26, 34, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.save(); g.translate(200, 520); g.rotate(-0.1); g.fillRect(-80, -30, 160, 54); g.strokeRect(-80, -30, 160, 54); txt(g, 'FECHADO', 0, -2, 30, '#e0453a'); g.restore();
  g.restore(); };
// carimbo final: ok = true → VERDADE (verde, ✓) / false → MITO (vermelho, ✗)
export const stamp = (p, ok = true) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(-0.08); const col = ok ? '#1f9d55' : '#d8322f';
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(-242, -122, 500, 260, 36); g.fill();
  g.fillStyle = '#fff'; g.strokeStyle = col; g.lineWidth = 22; g.beginPath(); g.roundRect(-250, -136, 500, 260, 36); g.fill(); g.stroke();
  txt(g, ok ? 'VERDADE' : 'MITO', 62, -6, ok ? 64 : 100, col);
  g.lineCap = 'round'; g.lineWidth = 26; g.strokeStyle = col; g.beginPath();
  if (ok) { g.moveTo(-220, 0); g.lineTo(-194, 36); g.lineTo(-150, -36); } else { g.moveTo(-216, -36); g.lineTo(-150, 34); g.moveTo(-150, -36); g.lineTo(-216, 34); }
  g.stroke(); g.restore(); };
// pilha de dinheiro (notas verdes) caindo; t = 0..1
export const money = (p, t = 1) => { const g = p.g; g.save(); g.lineWidth = 8; g.strokeStyle = K; g.lineJoin = 'round';
  const n = Math.round(14 * t); for (let k = 0; k < n; k++) { const x = 140 + (k % 4) * 95 + (k % 2) * 20, y = 780 - Math.floor(k / 4) * 60;
    g.fillStyle = '#6cc25a'; g.fillRect(x - 60, y - 22, 120, 44); g.strokeRect(x - 60, y - 22, 120, 44); g.fillStyle = '#4a9a3c'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.stroke(); }
  for (let k = 0; k < 4; k++) { const u = (t * 3 + k * 0.27) % 1, x = 150 + k * 100 + 30 * Math.sin(u * 9 + k), y = 160 + u * 420;
    g.save(); g.translate(x, y); g.rotate(Math.sin(u * 10 + k) * 0.6); g.fillStyle = '#7fd06a'; g.fillRect(-50, -18, 100, 36); g.strokeRect(-50, -18, 100, 36); g.restore(); }
  g.restore(); };
// praia: buraco na areia com bandeira do Japão no fundo; t = balanço
export const beach = (p, t = 0) => { const g = p.g; g.save(); g.lineWidth = 10; g.strokeStyle = K; g.lineJoin = 'round';
  g.fillStyle = '#e9cf8f'; g.beginPath(); g.roundRect(20, 360, 560, 440, 40); g.fill(); g.stroke(); g.fillStyle = '#4fa6c8'; g.beginPath(); g.roundRect(20, 300, 560, 90, [40, 40, 0, 0]); g.fill(); g.stroke();
  g.fillStyle = '#5a3a1c'; g.beginPath(); g.ellipse(300, 560, 150, 60, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.fillRect(250, 520, 100, 64); g.strokeRect(250, 520, 100, 64); g.fillStyle = '#d8322f'; g.beginPath(); g.arc(300, 552, 20, 0, 7); g.fill();
  g.strokeStyle = '#8a5a34'; g.lineWidth = 12; g.beginPath(); g.moveTo(470, 640 + 10 * Math.sin(t)); g.lineTo(400, 470); g.stroke(); g.fillStyle = '#e0453a'; g.strokeStyle = K; g.lineWidth = 8;
  g.beginPath(); g.ellipse(478, 662 + 10 * Math.sin(t), 26, 36, -0.4, 0, 7); g.fill(); g.stroke();
  txt(g, 'JAPÃO →', 300, 470, 40, K);
  g.restore(); };
// amigo sumido espiando de um buraco no chão; t = 0..6.28 (sobe/desce)
export const peek = (p, t = 0) => { const g = p.g; g.save(); g.lineWidth = 10; g.strokeStyle = K; g.lineJoin = 'round';
  g.fillStyle = '#bfe6ff'; g.beginPath(); g.roundRect(20, 200, 560, 380, [40, 40, 0, 0]); g.fill();
  g.fillStyle = '#9a6a3c'; g.beginPath(); g.roundRect(20, 570, 560, 230, [0, 0, 40, 40]); g.fill(); g.fillStyle = '#5fae46'; g.fillRect(20, 560, 560, 22);
  g.beginPath(); g.roundRect(20, 200, 560, 600, 40); g.stroke();
  const hy = 520 - Math.max(0, Math.sin(t)) * 70;
  g.save(); g.beginPath(); g.rect(0, 0, 600, 580); g.clip();
  g.fillStyle = '#f5c9a0'; g.beginPath(); g.arc(300, hy, 62, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#3b2a20'; g.beginPath(); g.arc(300, hy - 20, 64, Math.PI * 1.05, Math.PI * 1.95); g.fill();
  g.fillStyle = K; g.beginPath(); g.arc(278, hy, 8, 0, 7); g.arc(322, hy, 8, 0, 7); g.fill();
  g.lineWidth = 7; g.beginPath(); g.arc(300, hy + 22, 16, 0.2, Math.PI - 0.2); g.stroke(); g.restore();
  g.lineWidth = 10; g.fillStyle = '#3a2614'; g.beginPath(); g.ellipse(300, 586, 120, 30, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(330, 250, 220, 100, 30); g.fill(); g.stroke(); g.beginPath(); g.moveTo(370, 345); g.lineTo(350, 395); g.lineTo(410, 348); g.fill();
  txt(g, 'OI, SUMI!', 440, 300, 38, K);
  g.restore(); };
// ---- Parece Mentira #14 (videogame x Lua) — projeto motor/videogame ----
// osciloscópio de 1958 com o "Tennis for Two": tela verde redonda, chão + rede, bolinha quicando (t = 0..1 trajeto), botões
export const scope = (p, t = 0) => { const g = p.g; g.save(); g.translate(300, 500); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = K;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(-232, -172, 476, 372, 30); g.fill();
  g.fillStyle = '#8a8f96'; g.beginPath(); g.roundRect(-240, -186, 476, 372, 30); g.fill(); g.stroke();
  g.fillStyle = '#0d2a14'; g.beginPath(); g.arc(-50, 0, 140, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = '#6dff8a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-160, 60); g.lineTo(60, 60); g.moveTo(-50, 60); g.lineTo(-50, 22); g.stroke();
  const u = t % 1, side = Math.floor(t) % 2 ? -1 : 1, x = -50 + side * (-90 + 180 * u), y = 50 - 120 * 4 * u * (1 - u);
  g.fillStyle = 'rgba(109,255,138,0.35)'; for (let k = 1; k < 4; k++) { const v = Math.max(0, u - k * 0.06), xx = -50 + side * (-90 + 180 * v), yy = 50 - 480 * v * (1 - v); g.beginPath(); g.arc(xx, yy, 10 - k * 2, 0, 7); g.fill(); }
  g.fillStyle = '#c8ffd2'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill();
  g.strokeStyle = K; g.lineWidth = 8; for (const [bx, by, c] of [[160, -90, '#e0453a'], [160, 0, '#ffd23f'], [160, 90, '#2f6fb2']]) { g.fillStyle = c; g.beginPath(); g.arc(bx, by, 26, 0, 7); g.fill(); g.stroke(); }
  g.restore(); };
// TV antiga em preto e branco mostrando astronauta e bandeira
export const tvBW = (p, t = 0) => { const g = p.g; g.save(); g.translate(300, 520); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = K;
  g.beginPath(); g.moveTo(-60, -200); g.lineTo(-120, -290); g.moveTo(60, -200); g.lineTo(120, -290); g.stroke();
  g.fillStyle = '#7a5434'; g.beginPath(); g.roundRect(-250, -200, 500, 380, 34); g.fill(); g.stroke();
  g.fillStyle = '#9a9a9a'; g.beginPath(); g.roundRect(-215, -165, 330, 300, 40); g.fill(); g.stroke();
  g.fillStyle = '#5a5a5a'; g.beginPath(); g.ellipse(-50, 135, 200, 60, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#eee'; g.beginPath(); g.arc(-60, -20, 34, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = '#ddd'; g.beginPath(); g.roundRect(-92, 10, 64, 80, 16); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(40, 90); g.lineTo(40, -60); g.stroke(); g.fillStyle = '#ccc'; g.fillRect(40, -60, 60, 38); g.strokeRect(40, -60, 60, 38);
  g.globalAlpha = 0.25; g.fillStyle = '#fff'; for (let k = 0; k < 6; k++) g.fillRect(-215, -165 + ((k * 53 + t * 300) % 300), 330, 5); g.globalAlpha = 1;
  g.lineWidth = 8; for (const by of [-90, 10]) { g.fillStyle = '#d9a845'; g.beginPath(); g.arc(180, by, 26, 0, 7); g.fill(); g.stroke(); }
  g.restore(); };
// controle moderno (gamepad) de desenho
export const pad = (p) => { const g = p.g; g.save(); g.translate(300, 520); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = K;
  g.fillStyle = '#2b2d3a'; g.beginPath(); g.moveTo(-200, -90); g.bezierCurveTo(-80, -120, 80, -120, 200, -90); g.bezierCurveTo(270, -60, 290, 150, 220, 160); g.bezierCurveTo(160, 170, 120, 70, 60, 60);
  g.lineTo(-60, 60); g.bezierCurveTo(-120, 70, -160, 170, -220, 160); g.bezierCurveTo(-290, 150, -270, -60, -200, -90); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#d9dbe3'; g.fillRect(-170, -25, 90, 26); g.fillRect(-138, -57, 26, 90);
  g.lineWidth = 6; for (const [bx, by, c] of [[140, -45, '#ffd23f'], [180, -5, '#e0453a'], [100, -5, '#2f6fb2'], [140, 35, '#2f9a58']]) { g.fillStyle = c; g.beginPath(); g.arc(bx, by, 20, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#555a6e'; for (const sx of [-55, 55]) { g.beginPath(); g.arc(sx, 30, 30, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#7b3fe4'; g.beginPath(); g.roundRect(-30, -70, 60, 26, 10); g.fill(); g.restore(); };

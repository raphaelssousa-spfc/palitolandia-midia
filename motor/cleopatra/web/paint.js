// Canvas2D painted textures (our own). All deterministic.
import * as THREE from './lib/three.module.js';

export const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const tex = (c, rx = 1, ry = 1) => {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const speckle = (g, w, h, r, n, cols, rad = [1, 3]) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); g.ellipse(r() * w, r() * h, rad[0] + r() * rad[1], rad[0] + r() * rad[1] * 0.7, r() * 3, 0, 7); g.fill(); } };

export function planks(seed = 1, rot = 0) {
  const [c, g] = cv(512, 512), r = rng(seed), n = 8, w = 512 / n;
  for (let i = 0; i < n; i++) {
    const L = 52 + r() * 10, H = 30 + r() * 6;
    g.fillStyle = hsl(H, 42, L); g.fillRect(i * w, 0, w, 512);
    for (let k = 0; k < 14; k++) { g.strokeStyle = hsl(H - 4, 40, L - 10 - r() * 8, 0.5); g.lineWidth = 1 + r() * 2; g.beginPath(); const x = i * w + 4 + r() * (w - 8); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 6 - 3, 170, x + r() * 6 - 3, 340, x + r() * 4 - 2, 512); g.stroke(); }
    const cut = r() * 512; g.fillStyle = 'rgba(40,24,14,.9)'; g.fillRect(i * w, cut, w, 4);
    for (const y of [cut - 18, cut + 18]) { g.fillStyle = '#2b2620'; g.beginPath(); g.arc(i * w + w * 0.3, y, 2.6, 0, 7); g.arc(i * w + w * 0.7, y, 2.6, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(30,18,10,.95)'; g.fillRect(i * w, 0, 3, 512);
    if (r() < 0.5) { g.fillStyle = hsl(H, 40, L - 16, .8); g.beginPath(); g.ellipse(i * w + w / 2, r() * 512, 5, 9, 0, 0, 7); g.fill(); }
  }
  return c;
}
export function beam(seed = 2, base = [30, 40, 40]) {
  const [c, g] = cv(256, 512), r = rng(seed);
  g.fillStyle = hsl(base[0], base[1], base[2]); g.fillRect(0, 0, 256, 512);
  for (let k = 0; k < 40; k++) { g.strokeStyle = hsl(base[0] - 3, base[1], base[2] - 8 - r() * 10, .45); g.lineWidth = 1 + r() * 3; g.beginPath(); const x = r() * 256; g.moveTo(x, 0); g.bezierCurveTo(x + 8, 170, x - 8, 340, x + r() * 10 - 5, 512); g.stroke(); }
  return c;
}
/** rotting pile: wet dark lower part, moss, rot holes, pale fungus streaks */
export function rotten(seed = 3) {
  const [c, g] = cv(256, 1024), r = rng(seed);
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#6b4a2e'); gr.addColorStop(0.45, '#4f3722'); gr.addColorStop(0.8, '#33281c'); gr.addColorStop(1, '#22231a');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 1024);
  for (let k = 0; k < 50; k++) { g.strokeStyle = `rgba(20,12,6,${.3 + r() * .4})`; g.lineWidth = 1 + r() * 3; g.beginPath(); const x = r() * 256; g.moveTo(x, 0); g.bezierCurveTo(x + 10, 300, x - 10, 700, x + r() * 10 - 5, 1024); g.stroke(); }
  // moss bands near the water line and patches
  for (let i = 0; i < 260; i++) { const y = 650 + Math.pow(r(), 0.6) * 374; g.fillStyle = hsl(85 + r() * 25, 45, 26 + r() * 14, .85); g.beginPath(); g.ellipse(r() * 256, y, 4 + r() * 12, 3 + r() * 6, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 70; i++) { g.fillStyle = hsl(95, 40, 30 + r() * 10, .8); g.beginPath(); g.ellipse(r() * 256, r() * 650, 3 + r() * 8, 2 + r() * 5, 0, 0, 7); g.fill(); }
  // rot holes with cracks
  for (let i = 0; i < 9; i++) {
    const x = r() * 256, y = 200 + r() * 760, w = 10 + r() * 26, h = 18 + r() * 50;
    g.fillStyle = '#120c08'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.fill();
    g.strokeStyle = '#8a6a48'; g.lineWidth = 3; g.beginPath(); g.ellipse(x - 2, y - 2, w, h, 0, 3.6, 5.6); g.stroke();
    g.strokeStyle = '#120c08'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + 6, y - h - 40 - r() * 60); g.moveTo(x, y + h); g.lineTo(x - 5, y + h + 30 + r() * 50); g.stroke();
  }
  // pale fungus spots
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(226,214,180,${.5 + r() * .4})`; g.beginPath(); g.ellipse(r() * 256, 150 + r() * 700, 2 + r() * 4, 2 + r() * 3, 0, 0, 7); g.fill(); }
  return c;
}
export function stone(seed = 4, hue = 36, sat = 14, lig = 66, bw = 128, bh = 64) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#4a4238'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 512 / bh; row++) for (let col = -1; col < 512 / bw + 1; col++) {
    const x = col * bw + (row % 2) * bw / 2, y = row * bh, L = lig - 6 + r() * 12;
    g.fillStyle = hsl(hue + r() * 8 - 4, sat, L); g.beginPath(); g.roundRect(x + 3, y + 3, bw - 6, bh - 6, 6); g.fill();
    g.fillStyle = hsl(hue, sat, L + 7, .6); g.fillRect(x + 6, y + 5, bw - 14, 5);
    g.fillStyle = hsl(hue, sat, L - 12, .5); g.fillRect(x + 6, y + bh - 10, bw - 12, 5);
    speckle(g, 0, 0, r, 0, ['#000']);
    for (let k = 0; k < 6; k++) { g.fillStyle = hsl(hue, sat, L - 8 - r() * 8, .6); g.beginPath(); g.ellipse(x + r() * bw, y + r() * bh, 2 + r() * 5, 1 + r() * 3, 0, 0, 7); g.fill(); }
  }
  return c;
}
export function mossy(c0, seed = 5, amt = 1) {
  const [c, g] = cv(c0.width, c0.height), r = rng(seed); g.drawImage(c0, 0, 0);
  for (let i = 0; i < 500 * amt; i++) { const y = c.height * (0.4 + 0.6 * Math.pow(r(), 0.5)); g.fillStyle = hsl(90 + r() * 30, 40, 28 + r() * 16, .85); g.beginPath(); g.ellipse(r() * c.width, y, 4 + r() * 10, 3 + r() * 6, 0, 0, 7); g.fill(); }
  // ivy strands with leaves
  for (let s = 0; s < 8 * amt; s++) {
    let x = r() * c.width, y = c.height;
    for (let k = 0; k < 40; k++) { x += (r() - 0.5) * 18; y -= 8 + r() * 6; g.fillStyle = hsl(100 + r() * 20, 45, 30 + r() * 15); g.beginPath(); g.ellipse(x, y, 7, 5, r() * 3, 0, 7); g.fill(); g.strokeStyle = '#1d2b14'; g.lineWidth = 1.5; g.stroke(); }
  }
  return c;
}
export function grass(seed = 6) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#6fa04a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = hsl(85 + r() * 20, 42, 38 + r() * 14, .5); g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 1400; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = hsl(80 + r() * 30, 45, 30 + r() * 25, .9); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 4 - 2, y - 5 - r() * 7); g.stroke(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = ['#f3e27a', '#ffffff', '#e8a0c0'][i % 3]; g.beginPath(); g.arc(r() * 512, r() * 512, 2.5, 0, 7); g.fill(); }
  return c;
}
export function dirt(seed = 7) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#a88a62'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) { g.fillStyle = hsl(30 + r() * 10, 25, 40 + r() * 25, .6); g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 14, 2 + r() * 8, r() * 3, 0, 7); g.fill(); }
  return c;
}
export function plaster(seed = 8, hue = 40) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = hsl(hue, 40, 86); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = hsl(hue, 30, 76 + r() * 8, .5); g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 30, 6 + r() * 16, 0, 0, 7); g.fill(); }
  g.fillStyle = hsl(hue, 20, 60, .5); g.fillRect(0, 236, 256, 20);
  return c;
}
export function roof(seed = 9) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#7b2e1c'; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const x = col * 32 + (row % 2) * 16, y = row * 32; g.fillStyle = hsl(12 + r() * 8, 58, 42 + r() * 10);
    g.beginPath(); g.ellipse(x + 16, y + 16, 14, 17, 0, 0, Math.PI); g.lineTo(x + 2, y); g.fill();
    g.fillStyle = 'rgba(255,220,180,.25)'; g.fillRect(x + 6, y + 2, 5, 22);
  }
  return c;
}
export function marble(seed = 10) {
  const [c, g] = cv(256, 512), r = rng(seed);
  g.fillStyle = '#efe7d6'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(160,140,110,.25)'; g.fillRect(i * 32 + 2, 0, 6, 512); }
  for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(150,140,130,.35)'; g.lineWidth = 1.5; g.beginPath(); let x = r() * 256, y = 0; g.moveTo(x, y); while (y < 512) { x += r() * 30 - 15; y += 20 + r() * 30; g.lineTo(x, y); } g.stroke(); }
  return c;
}
export function banner() {
  const [c, g] = cv(256, 512);
  g.fillStyle = '#b8282b'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#8a1c22'; for (let i = 0; i < 5; i++) g.fillRect(20 + i * 50, 0, 12, 512);
  g.strokeStyle = '#e6b84a'; g.lineWidth = 12; g.strokeRect(14, 14, 228, 484);
  g.fillStyle = '#e6b84a'; g.font = 'bold 66px DejaVu Serif, serif'; g.textAlign = 'center'; g.fillText('SPQR', 128, 300);
  g.lineWidth = 9; g.beginPath(); g.arc(128, 180, 60, 0.4, Math.PI - 0.4, true); g.stroke();
  for (let i = 0; i < 9; i++) { const a = Math.PI + 0.35 + i * 0.3; g.beginPath(); g.ellipse(128 + Math.cos(a) * 60, 180 - Math.sin(a) * 60 * -1, 10, 5, a, 0, 7); g.fill(); }
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * 32, 512); g.lineTo(i * 32 + 16, 470); g.lineTo(i * 32 + 32, 512); g.fillStyle = '#000'; g.globalCompositeOperation = 'destination-out'; g.fill(); g.globalCompositeOperation = 'source-over'; }
  return c;
}
/** interior of the helmet, planar-mapped: rusty iron + the carved message */
export function helmetInside(reveal = 1) {
  const [c, g] = cv(1024, 1024), r = rng(77);
  const gr = g.createRadialGradient(512, 512, 40, 512, 512, 520); gr.addColorStop(0, '#6d675e'); gr.addColorStop(0.7, '#575148'); gr.addColorStop(1, '#3a352f');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 220; i++) { g.fillStyle = hsl(22 + r() * 12, 55, 28 + r() * 16, .35 + r() * .4); g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 4 + r() * 26, 3 + r() * 14, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(30,26,22,${.2 + r() * .3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * 1024, y = r() * 1024; g.moveTo(x, y); g.lineTo(x + r() * 60 - 30, y + r() * 60 - 30); g.stroke(); }
  const lines = ['THE BRIDGE', 'IS NOT', 'SAFE'], ys = [400, 530, 670], sz = [104, 112, 150];
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((t, li) => {
    g.font = `bold ${sz[li]}px DejaVu Serif, serif`;
    const w = g.measureText(t).width; let x = 512 - w / 2;
    for (const ch of t) {
      const cw = g.measureText(ch).width, a = (r() - 0.5) * 0.12, dy = (r() - 0.5) * 10;
      g.save(); g.translate(x + cw / 2, ys[li] + dy); g.rotate(a);
      g.fillStyle = '#d6cdbd'; g.fillText(ch, 3, 4);       // lit lower lip of the groove
      g.fillStyle = '#16120f'; g.fillText(ch, 0, 0);       // groove
      g.fillStyle = 'rgba(70,60,50,.9)'; g.fillText(ch, -2, -3);
      g.restore(); x += cw;
    }
  });
  // scratch-out flourish under the words
  g.strokeStyle = '#16120f'; g.lineWidth = 7; g.beginPath(); g.moveTo(330, 765); g.lineTo(700, 760); g.stroke();
  g.strokeStyle = '#cbbfa9'; g.lineWidth = 3; g.beginPath(); g.moveTo(332, 772); g.lineTo(702, 767); g.stroke();
  return c;
}
export function radial(col = '0,0,0', a = 0.55) {
  const [c, g] = cv(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.55, `rgba(${col},${a * 0.6})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
}

/** cobbled plaza: rounded stones with dark seams (flat style) */
export function cobbles(seed = 31) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#5d5248'; g.fillRect(0, 0, 512, 512);
  const n = 11, s = 512 / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = i * s + (j % 2) * s / 2 + (r() - 0.5) * 6, y = j * s + (r() - 0.5) * 6, L = 52 + r() * 14, H = 28 + r() * 14;
    for (const dx of [0, -512, 512]) {
      g.fillStyle = hsl(H, 14 + r() * 8, L); g.beginPath(); g.ellipse(x + dx + s / 2, y + s / 2, s * 0.44, s * 0.4, r() * 0.6, 0, 7); g.fill();
      g.fillStyle = hsl(H, 12, L + 9, 0.6); g.beginPath(); g.ellipse(x + dx + s * 0.42, y + s * 0.38, s * 0.2, s * 0.12, -0.4, 0, 7); g.fill();
    }
  }
  return c;
}
/** shop sign: painted wooden board with lettering + a loaf icon. Reads left-to-right on a +z facing plane. */
export function shopSign(text = 'PADARIA') {
  const [c, g] = cv(1024, 240), r = rng(5);
  g.fillStyle = '#7a4e2c'; g.fillRect(0, 0, 1024, 240);
  for (let k = 0; k < 30; k++) { g.strokeStyle = hsl(26, 40, 22 + r() * 10, .5); g.lineWidth = 2 + r() * 3; g.beginPath(); const y = r() * 240; g.moveTo(0, y); g.bezierCurveTo(340, y + 6, 680, y - 6, 1024, y + r() * 6); g.stroke(); }
  g.strokeStyle = '#3a2414'; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 224);
  g.strokeStyle = '#e6b45a'; g.lineWidth = 5; g.strokeRect(24, 24, 976, 192);
  // loaf icon
  const loaf = (x, y) => { g.fillStyle = '#d99a48'; g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.beginPath(); g.ellipse(x, y, 62, 34, 0, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = '#8a5222'; g.lineWidth = 5; for (const d of [-26, 0, 26]) { g.beginPath(); g.moveTo(x + d - 10, y - 16); g.lineTo(x + d + 10, y + 12); g.stroke(); } };
  loaf(120, 120); loaf(904, 120);
  g.font = 'bold 128px DejaVu Serif, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.strokeStyle = '#2a1a10'; g.lineWidth = 14; g.strokeText(text, 512, 128);
  g.fillStyle = '#ffe2a0'; g.fillText(text, 512, 128);
  return c;
}

/** ladrilho de laboratório: xadrez cinza-claro com juntas escuras */
export function tiles(seed = 41) {
  const [c, g] = cv(512, 512), r = rng(seed), n = 8, s = 512 / n;
  g.fillStyle = '#5f676c'; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const L = ((i + j) % 2 ? 80 : 68) + r() * 4;
    g.fillStyle = hsl(190, 9, L); g.beginPath(); g.roundRect(i * s + 3, j * s + 3, s - 6, s - 6, 5); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(i * s + 8, j * s + 7, s - 20, 4);
  }
  return c;
}
/** placa do laboratório (lê certo em plano virado para +z) */
export function labSign(text = 'LABORATÓRIO') {
  const [c, g] = cv(1024, 240);
  g.fillStyle = '#27466b'; g.fillRect(0, 0, 1024, 240);
  g.strokeStyle = '#0f1f33'; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 224);
  g.strokeStyle = '#f2f2f2'; g.lineWidth = 5; g.strokeRect(24, 24, 976, 192);
  for (const [x, y] of [[44, 44], [980, 44], [44, 196], [980, 196]]) { g.fillStyle = '#cfd6dc'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }
  g.font = 'bold 118px DejaVu Serif, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.strokeStyle = '#0f1f33'; g.lineWidth = 14; g.strokeText(text, 512, 128);
  g.fillStyle = '#ffffff'; g.fillText(text, 512, 128);
  return c;
}
/** quadro-negro com rabiscos de giz (ondas, círculos, setas; sem letras) */
export function chalkboard(seed = 61) {
  const [c, g] = cv(1024, 512), r = rng(seed);
  g.fillStyle = '#2f4a3c'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; g.beginPath(); g.ellipse(r() * 1024, r() * 512, 40 + r() * 120, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = '#8b6a43'; g.lineWidth = 22; g.strokeRect(11, 11, 1002, 490);
  g.strokeStyle = 'rgba(245,245,235,.92)'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); for (let x = 60; x <= 520; x += 6) { const y = 150 + Math.sin(x * 0.07) * 55; x === 60 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.beginPath(); g.arc(760, 160, 62, 0, 7); g.stroke(); g.beginPath(); g.arc(760, 160, 24, 0, 7); g.stroke();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(760 + Math.cos(a) * 74, 160 + Math.sin(a) * 74); g.lineTo(760 + Math.cos(a) * 112, 160 + Math.sin(a) * 112); g.stroke(); }
  g.beginPath(); g.moveTo(80, 330); g.lineTo(420, 330); g.lineTo(390, 305); g.moveTo(420, 330); g.lineTo(390, 355); g.stroke();
  g.beginPath(); g.rect(520, 290, 200, 110); g.stroke(); g.beginPath(); g.moveTo(560, 320); g.lineTo(680, 320); g.moveTo(560, 350); g.lineTo(650, 350); g.moveTo(560, 380); g.lineTo(670, 380); g.stroke();
  g.beginPath(); g.arc(850, 380, 40, 0, 7); g.moveTo(850, 380); g.lineTo(878, 360); g.stroke();
  return c;
}

/** areia do deserto (tile de 10 m) */
export function sand(seed = 71) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#e9c982'; g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, r, 900, ['#d9b46a', '#f3dc9e', '#cfa95e'], [1, 3]);
  g.strokeStyle = 'rgba(176,134,66,.35)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 22; i++) { const y = r() * 512, x = r() * 512, l = 60 + r() * 120; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 8, x + l, y + 2); g.stroke(); }
  return c;
}
/** pedra calcária da pirâmide: blocos em fileiras */
export function sandstone(seed = 72) {
  const [c, g] = cv(512, 512), r = rng(seed), rows = 8, rh = 512 / rows;
  g.fillStyle = '#8f7646'; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < rows; j++) {
    const bw = 128 - (j % 3) * 14, off = (j % 2) * bw / 2;
    for (let x = -bw; x < 512 + bw; x += bw) {
      g.fillStyle = hsl(40, 46, 62 + r() * 9); g.beginPath(); g.roundRect(x + off + 3, j * rh + 3, bw - 6, rh - 6, 6); g.fill();
      g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(x + off + 9, j * rh + 7, bw - 20, 4);
    }
  }
  speckle(g, 512, 512, r, 200, ['rgba(120,90,40,.25)'], [1, 3]);
  return c;
}
/** Lua no céu (esfera) */
export function moonTex(seed = 73) {
  const [c, g] = cv(512, 256), r = rng(seed);
  g.fillStyle = '#e3e5ea'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = 20 + r() * 216, rr = 8 + r() * 26;
    g.fillStyle = 'rgba(150,156,170,.55)'; g.beginPath(); g.ellipse(x, y, rr, rr * 0.9, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x - rr * 0.2, y - rr * 0.25, rr * 0.65, rr * 0.55, 0, 0, 7); g.fill(); }
  return c;
}
/** solo lunar (tile) */
export function moonDust(seed = 74) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#9a9ea8'; g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, r, 700, ['#858a95', '#adb1ba', '#7b808b'], [1, 3]);
  for (let i = 0; i < 6; i++) { const x = r() * 512, y = r() * 512, rr = 24 + r() * 40;
    g.fillStyle = 'rgba(100,105,118,.5)'; g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(210,214,224,.45)'; g.beginPath(); g.ellipse(x - rr * 0.15, y - rr * 0.18, rr * 0.8, rr * 0.5, 0, 0, 7); g.fill(); }
  return c;
}
/** bandeira genérica (azul com estrela) */
export function flag() {
  const [c, g] = cv(480, 320);
  g.fillStyle = '#2b4fa8'; g.fillRect(0, 0, 480, 320);
  g.strokeStyle = '#f2f2f2'; g.lineWidth = 18; g.strokeRect(9, 9, 462, 302);
  g.fillStyle = '#ffd84a'; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 40 : 100; g.lineTo(240 + Math.cos(a) * rr, 160 + Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.strokeStyle = '#1a2a5a'; g.lineWidth = 8; g.stroke();
  return c;
}
/** placa genérica de madeira escura com letras claras (lê certo em plano virado para +z) */
export function plaque(text = 'MUSEU', bg = '#5a2230', fg = '#ffe9a8') {
  const [c, g] = cv(1024, 240);
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 240);
  g.strokeStyle = '#2a0f16'; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 224);
  g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(24, 24, 976, 192);
  g.font = 'bold 140px DejaVu Serif, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.strokeStyle = '#2a0f16'; g.lineWidth = 14; g.strokeText(text, 512, 128);
  g.fillStyle = fg; g.fillText(text, 512, 128);
  return c;
}
/** quadro da linha do tempo (950x1800 px, 1 px = 2 mm): pirâmide → Cleópatra → Lua, tudo em escala de tempo */
export const TL = { w: 950, h: 1800, lineX: 480, yPyr: 330, yCleo: 1056, yMoon: 1630, yEgy: 175 };
export function timeline() {
  const [c, g] = cv(TL.w, TL.h), r = rng(75);
  g.fillStyle = '#f1e1b4'; g.fillRect(0, 0, TL.w, TL.h);
  speckle(g, TL.w, TL.h, r, 500, ['rgba(190,150,80,.18)', 'rgba(255,248,220,.3)'], [2, 6]);
  g.strokeStyle = '#6b4a2a'; g.lineWidth = 34; g.strokeRect(17, 17, TL.w - 34, TL.h - 34);
  g.font = 'bold 74px DejaVu Serif, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#3a2414'; g.fillText('LINHA DO TEMPO', TL.w / 2, 100);
  // eixo
  const X = TL.lineX; g.strokeStyle = '#3a2414'; g.lineWidth = 14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(X, TL.yPyr); g.lineTo(X, TL.yMoon); g.stroke();
  const label = (t, y) => { g.font = 'bold 52px DejaVu Serif, serif'; g.textAlign = 'center'; g.fillStyle = '#3a2414'; g.fillText(t, X, y); };
  // pirâmide
  g.fillStyle = '#e0a93f'; g.strokeStyle = '#3a2414'; g.lineWidth = 12; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(X - 120, TL.yPyr + 80); g.lineTo(X, TL.yPyr - 90); g.lineTo(X + 120, TL.yPyr + 80); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = '#a8742a'; g.lineWidth = 6; for (let i = 1; i < 4; i++) { const yy = TL.yPyr - 90 + i * 42, w = i * 30; g.beginPath(); g.moveTo(X - w, yy); g.lineTo(X + w, yy); g.stroke(); }
  label('≈ 2560 a.C.', TL.yPyr + 150);
  // Cleópatra
  g.fillStyle = '#15110f'; g.strokeStyle = '#3a2414'; g.lineWidth = 12;
  g.beginPath(); g.roundRect(X - 82, TL.yCleo - 92, 164, 200, 60); g.fill(); g.stroke();
  g.fillStyle = '#d9a273'; g.beginPath(); g.ellipse(X, TL.yCleo - 5, 62, 78, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#e8b64a'; g.beginPath(); g.roundRect(X - 70, TL.yCleo - 66, 140, 24, 8); g.fill(); g.stroke();
  g.fillStyle = '#3a2414'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(X + s * 24, TL.yCleo - 8, 7, 9, 0, 0, 7); g.fill(); }
  g.strokeStyle = '#3a2414'; g.lineWidth = 7; g.beginPath(); g.arc(X, TL.yCleo + 24, 20, 0.2, Math.PI - 0.2); g.stroke();
  label('≈ 30 a.C.', TL.yCleo + 150);
  // Lua + pezinho de foguete
  g.fillStyle = '#e3e5ea'; g.strokeStyle = '#3a2414'; g.lineWidth = 12; g.beginPath(); g.arc(X, TL.yMoon, 96, 0, 7); g.fill(); g.stroke();
  g.fillStyle = 'rgba(150,156,170,.7)'; for (const [dx, dy, rr] of [[-34, -30, 22], [36, 20, 26], [-20, 44, 14], [30, -52, 12]]) { g.beginPath(); g.arc(X + dx, TL.yMoon + dy, rr, 0, 7); g.fill(); }
  g.fillStyle = '#ffd84a'; g.strokeStyle = '#3a2414'; g.lineWidth = 6; g.beginPath(); g.moveTo(X + 6, TL.yMoon - 100); g.lineTo(X + 6, TL.yMoon - 160); g.stroke();
  g.fillStyle = '#c33a2f'; g.beginPath(); g.moveTo(X + 6, TL.yMoon - 160); g.lineTo(X + 54, TL.yMoon - 142); g.lineTo(X + 6, TL.yMoon - 124); g.closePath(); g.fill();
  label('1969', TL.yMoon + 150);
  return c;
}
/** chave "}" apontando para a direita (flip=true: "{" apontando para a esquerda) com legenda em linhas */
export function bracket(w, h, lines, col = '#c0392b', flip = false, fs = 78) {
  const [c, g] = cv(w, h), s = 46, ym = h / 2, y0 = 14, y1 = h - 14;
  g.save(); if (flip) { g.translate(w, 0); g.scale(-1, 1); }
  g.strokeStyle = '#2a1a10'; g.lineWidth = 26; g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(16, y0); g.bezierCurveTo(16 + s, y0, 16 + s, y0 + (ym - y0) * 0.5, 16 + s, ym - s * 0.6);
    g.quadraticCurveTo(16 + s, ym, 16 + 2 * s, ym); g.quadraticCurveTo(16 + s, ym, 16 + s, ym + s * 0.6);
    g.bezierCurveTo(16 + s, ym + (y1 - ym) * 0.5, 16 + s, y1, 16, y1); };
  path(); g.stroke(); g.strokeStyle = col; g.lineWidth = 14; path(); g.stroke(); g.restore();
  g.font = `bold ${fs}px DejaVu Serif, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const tx = flip ? (w - 2 * s - 30) / 2 + 10 : 2 * s + 30 + (w - 2 * s - 30) / 2;
  lines.forEach((t, i) => { const y = ym + (i - (lines.length - 1) / 2) * fs * 1.15;
    g.strokeStyle = '#fff8e0'; g.lineWidth = 18; g.strokeText(t, tx, y); g.fillStyle = col; g.fillText(t, tx, y); });
  return c;
}

/** Terra vista da Lua (esfera) */
export function earthTex(seed = 76) {
  const [c, g] = cv(512, 256), r = rng(seed);
  g.fillStyle = '#3f79d8'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 9; i++) { g.fillStyle = '#4fa857'; g.beginPath(); g.ellipse(r() * 512, 30 + r() * 196, 20 + r() * 50, 14 + r() * 30, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(r() * 512, r() * 256, 20 + r() * 40, 6 + r() * 10, r() * 3, 0, 7); g.fill(); }
  return c;
}

// ================= RODOVIA DE CONCRETO: cenário =================
// Estrada corre no eixo x. Corte na frente (z = 0). Faixa A: z de 0 a -3 · faixa B: z de -3 a -6.
const PL = 4, LW = 3, ST = 0.45, NPL = 12, X0 = -24;      // placa: comprimento, largura da faixa, espessura
const SBT = -0.48, SBB = -0.88;                          // sub-base: topo e fundo (3 cm abaixo da placa)
const JX = []; for (let i = 0; i <= NPL; i++) JX.push(X0 + i * PL);  // juntas transversais
mats.slab = M('#d3cec4', { transparent: true, opacity: 1 }); // NUNCA alternar .transparent (pisca)
mats.slabB = M('#d3cec4', { transparent: true, opacity: 1 });
mats.subbase = M('#ffffff', { map: canvasTex(256, 128, (g, w, h) => speckle(g, w, h, '#8f8c88', ['#7d7a76', '#a29f9a', '#6e6b67', '#b5b2ad'], 900, 1.5, 4.5), 8, 1) });
mats.loose = M('#ffffff', { map: canvasTex(256, 128, (g, w, h) => speckle(g, w, h, '#b07a4c', ['#9c6a40', '#c08a5c', '#8a5a34'], 700, 2, 6), 8, 1) });
mats.groove = M('#4a4743'); mats.seal = M('#121214', { roughness: 0.35 }); mats.dowel = M('#d0612c', { roughness: 0.5, metalness: 0.2, emissive: '#5a2008', emissiveIntensity: 0.4 });
mats.tie = M('#2f8fd8', { roughness: 0.5, metalness: 0.2, emissive: '#0a2a48', emissiveIntensity: 0.4 });
mats.paintW = M('#f7f7f2', { roughness: 0.6 }); mats.paintY = M('#f2c21b', { roughness: 0.6 });
// terreno (bloco com face em corte)
strataTex.repeat.set(1 / 4, 1 / 4);
const terrain = mesh(new THREE.BoxGeometry(80, 16, 40), [mats.strata, mats.strata, mats.dirt, mats.dirt, mats.strata, mats.strata], scene, 0, SBB - 8, -20, false);
// acostamento/grama atrás da pista
const shoulder = new THREE.Group(); scene.add(shoulder);
mesh(new THREE.BoxGeometry(80, -SBB - 0.05, 33.6), [mats.strata, mats.strata, M('#86a957'), mats.dirt, mats.strata, mats.strata], shoulder, 0, (SBB - 0.05) / 2, -6.4 - 16.8, false);
mesh(new THREE.BoxGeometry(80, 0.08, 0.4), M('#9a948a'), shoulder, 0, -0.04 - 0.02, -6.2, false);
// camada de terra solta (vira sub-base) — as duas nunca se sobrepõem
// frente recuada 5 cm: a placa que afunda não fica coplanar com a sub-base (z-fighting)
const loose = mesh(new THREE.BoxGeometry(1, SBT - SBB, 6.15), mats.loose, scene, 0, (SBT + SBB) / 2, -3.125, false);
const subbase = mesh(new THREE.BoxGeometry(1, SBT - SBB, 6.15), mats.subbase, scene, 0, (SBT + SBB) / 2, -3.125, false);
const RX0 = -26, RX1 = 26;
function setSub(xs) { // de RX0 até xs = sub-base; de xs até RX1 = terra solta
  xs = cl(xs, RX0, RX1); subbase.visible = xs > RX0 + 0.01; loose.visible = xs < RX1 - 0.01;
  subbase.scale.x = Math.max(0.01, xs - RX0); subbase.position.x = (RX0 + xs) / 2; loose.scale.x = Math.max(0.01, RX1 - xs); loose.position.x = (xs + RX1) / 2; }
// placas
const laneA = new THREE.Group(), laneB = new THREE.Group(); scene.add(laneA, laneB);
const platesA = [], platesB = [];
for (let i = 0; i < NPL; i++) {
  const cx = X0 + i * PL + PL / 2;
  const a = mesh(new THREE.BoxGeometry(PL, ST, LW), mats.slab, laneA, cx, -ST / 2, -LW / 2); a.userData = { cx, i }; platesA.push(a);
  const b = mesh(new THREE.BoxGeometry(PL, ST, LW), mats.slabB, laneB, cx, -ST / 2, -LW * 1.5); b.userData = { cx, i }; platesB.push(b); }
// juntas serradas (linhas escuras em cima) — transversais e a longitudinal
const grooves = new THREE.Group(); scene.add(grooves);
for (const x of JX) { const g = mesh(new THREE.BoxGeometry(0.07, 0.02, 2 * LW), mats.groove, grooves, x, 0.01, -LW, false); g.userData = { x }; }
const grooveL = mesh(new THREE.BoxGeometry(NPL * PL, 0.02, 0.07), mats.groove, grooves, 0, 0.01, -LW, false); grooveL.userData = { x: 999 };
// selante (preto, por cima da junta)
const seals = new THREE.Group(); scene.add(seals);
for (const x of JX) { const g = mesh(new THREE.BoxGeometry(0.12, 0.035, 2 * LW), mats.seal, seals, x, 0.026, -LW, false); g.userData = { x }; }
mesh(new THREE.BoxGeometry(NPL * PL, 0.034, 0.12), mats.seal, seals, 0, 0.025, -LW, false).userData = { x: 999 };
// rachaduras aleatórias (retração)
const cracks = new THREE.Group(); scene.add(cracks);
{ const starts = [[-9.3, -0.4, 1], [-6.1, -1.0, 1], [-2.6, -0.2, 1], [1.4, -0.5, 1], [5.2, -0.3, 1], [8.7, -0.9, 1], [-7.5, -3.4, 1], [-0.9, -3.2, 1], [3.3, -3.6, 1], [7.1, -3.3, 1]];
  starts.forEach(([x, z], k) => { let px = x, pz = z; for (let i = 0; i < 7; i++) { const nx = px + Math.sin(k * 3.1 + i * 2.3) * 0.28, nz = pz - 0.38;
      const len = Math.hypot(nx - px, nz - pz); const m = mesh(new THREE.BoxGeometry(0.05, 0.02, len), mats.black, cracks, (px + nx) / 2, 0.012, (pz + nz) / 2, false); m.rotation.y = Math.atan2(nx - px, nz - pz); m.userData = { i, k }; px = nx; pz = nz; } }); }
// barras de transferência (lisas, ao longo de x, cruzando cada junta transversal)
const dowels = new THREE.Group(); scene.add(dowels);
for (const x of JX) for (let z = -0.35; z > -2 * LW; z -= 0.6) { const d = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8).rotateZ(Math.PI / 2), mats.dowel, dowels, x, -ST / 2, z, false); d.userData = { x }; }
// barras de ligação (ao longo de z, cruzando a junta longitudinal)
const ties = new THREE.Group(); scene.add(ties);
for (let x = X0 + 0.5; x < X0 + NPL * PL; x += 1.0) { const d = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8).rotateX(Math.PI / 2), mats.tie, ties, x, -ST / 2 + 0.04, -LW, false); d.userData = { x }; }
// ranhuras (texturização) — linhas finas ao longo de z
const NGR = 180; const grv = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 2 * LW - 0.3), M('#c2bcb2'), NGR); scene.add(grv); grv.frustumCulled = false; // contraste baixo: linhas finas + câmera andando = efeito estroboscópico
const grvX = [...Array(NGR)].map((_, i) => -13.5 + i * 0.15);
function setGrooves(xMax) { let n = 0; grvX.forEach(x => { if (x < xMax && JX.every(j => Math.abs(x - j) > 0.12)) { dm.makeTranslation(x, 0.006, -LW); grv.setMatrixAt(n++, dm); } }); grv.count = n; grv.instanceMatrix.needsUpdate = true; grv.visible = n > 0; }
// pintura (faixas)
const paint = new THREE.Group(); scene.add(paint);
for (const z of [-0.3, -2 * LW + 0.3]) mesh(new THREE.BoxGeometry(NPL * PL, 0.02, 0.14), mats.paintW, paint, 0, 0.045, z, false).userData = { kind: 'edge' };
for (let x = X0 + 1; x < X0 + NPL * PL; x += 3) mesh(new THREE.BoxGeometry(1.6, 0.02, 0.14), mats.paintY, paint, x + 0.8, 0.045, -LW - 0.18, false).userData = { kind: 'dash', x };
// ---------- veículos e máquinas ----------
function car(color) { const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.BoxGeometry(2.6, 0.45, 1.35), M(color, { roughness: 0.35 }), g, 0, 0.42, 0); mesh(new THREE.BoxGeometry(1.3, 0.38, 1.15), M(color, { roughness: 0.35 }), g, -0.15, 0.82, 0);
  mesh(new THREE.BoxGeometry(1.1, 0.28, 1.17), M('#2c3a46', { roughness: 0.1 }), g, -0.15, 0.84, 0);
  for (const [x, z] of [[0.8, -0.66], [0.8, 0.66], [-0.85, -0.66], [-0.85, 0.66]]) mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14).rotateX(Math.PI / 2), mats.black, g, x, 0.24, z);
  return g; }
function truck(color, drum = false) { const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.BoxGeometry(1.4, 1.4, 1.7), M(color, { roughness: 0.4 }), g, 1.9, 0.95, 0); mesh(new THREE.BoxGeometry(0.1, 0.55, 1.4), M('#2c3a46', { roughness: 0.1 }), g, 2.62, 1.25, 0);
  mesh(new THREE.BoxGeometry(4.0, 0.25, 1.6), mats.black, g, -0.2, 0.42, 0);
  if (drum) { const d = new THREE.Group(); d.position.set(-0.4, 1.35, 0); g.add(d); const c = mesh(new THREE.CylinderGeometry(0.85, 0.6, 2.6, 16, 1).rotateZ(Math.PI / 2 + 0.18), M('#e8e6e0'), d, 0, 0, 0);
    for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(0.78 - k * 0.08, 0.05, 6, 20).rotateY(Math.PI / 2), M('#d63b3b'), d, -0.7 + k * 0.7, 0.12 - k * 0.12, 0); g.userData.drum = d;
    const chute = mesh(new THREE.BoxGeometry(1.2, 0.08, 0.35), M('#9aa3ab'), g, -2.6, 0.75, 0); chute.rotation.z = 0.5; }
  else mesh(new THREE.BoxGeometry(3.2, 1.2, 1.7), M('#c8ced3'), g, -0.5, 1.15, 0);
  for (const x of [1.9, -0.6, -1.6]) for (const z of [-0.8, 0.8]) mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14).rotateX(Math.PI / 2), mats.black, g, x, 0.36, z);
  return g; }
const mixer = truck('#f07c1e', true), lorry = truck('#2f6fb3');
const roller = new THREE.Group(); scene.add(roller);
{ mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.2, 22).rotateX(Math.PI / 2), M('#5d6268', { metalness: 0.3, roughness: 0.5 }), roller, 1.2, 0.7, 0);
  mesh(new THREE.BoxGeometry(2.0, 0.9, 1.8), mats.yellow, roller, -0.4, 1.0, 0); mesh(new THREE.BoxGeometry(1.0, 0.9, 1.2), M('#2c3a46', { roughness: 0.1 }), roller, -0.6, 1.9, 0);
  mesh(new THREE.BoxGeometry(1.2, 0.08, 1.4), mats.yellow, roller, -0.6, 2.38, 0);
  for (const z of [-0.85, 0.85]) mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16).rotateX(Math.PI / 2), mats.black, roller, -1.0, 0.5, z); }
const saw = new THREE.Group(); scene.add(saw);
{ mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), M('#e0a21a'), saw, 0, 0.55, 0.3); mesh(new THREE.BoxGeometry(0.16, 0.16, 1.1), mats.black, saw, 0, 0.35, 0.9);
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 26).rotateX(Math.PI / 2).rotateY(Math.PI / 2), M('#c8ced3', { metalness: 0.6, roughness: 0.3 }), saw, 0, 0.3, -0.25);
  for (const z of [0.0, 0.6]) for (const x of [-0.35, 0.35]) mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10).rotateZ(Math.PI / 2), mats.black, saw, x, 0.12, z);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), mats.black, saw, 0, 0.95, 1.3).rotation.x = -0.6; }
const comb = new THREE.Group(); scene.add(comb); // ponte com pente de aço
{ mesh(new THREE.BoxGeometry(0.25, 0.25, 7.2), mats.yellow, comb, 0, 1.6, -LW); for (const z of [0.5, -6.5]) mesh(new THREE.BoxGeometry(0.25, 1.6, 0.25), mats.yellow, comb, 0, 0.8, z);
  mesh(new THREE.BoxGeometry(0.12, 0.12, 6.0), mats.steel, comb, -0.1, 0.12, -LW); for (let z = -0.1; z > -5.95; z -= 0.12) mesh(new THREE.BoxGeometry(0.02, 0.14, 0.03), mats.steel, comb, -0.1, 0.03, z - LW + 3); }
const hook = new THREE.Group(); scene.add(hook); // cabos do guindaste
{ for (const [x, z] of [[-1.6, -0.3], [1.6, -0.3], [-1.6, -2.7], [1.6, -2.7]]) { const c = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), mats.black, hook, 0, 0, 0, false); c.userData = { x, z }; }
  mesh(new THREE.SphereGeometry(0.16, 12, 10), mats.yellow, hook, 0, 0, 0).userData = { hk: 1 }; }
const carA = car('#d63b3b'), carB = car('#2f6fb3'), carC = car('#f2c21b');
// entorno
function tree2(x, z, s) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8), mats.trunk, g, 0, 0.8, 0); mesh(new THREE.IcosahedronGeometry(1.1, 1), mats.leaf, g, 0, 2.2, 0); mesh(new THREE.IcosahedronGeometry(0.8, 1), mats.leaf2, g, 0.6, 1.9, 0.3); return g; }
[[-9, -10, 1.4], [-3, -14, 1.6], [6, -12, 1.5], [12, -9, 1.3], [-14, -12, 1.5], [17, -14, 1.6]].forEach(a => tree2(...a));
const radarTree = tree2(4.2, -8.0, 1.5);
const radar = new THREE.Group(); scene.add(radar); radar.position.set(6.6, 0, -9.2);
{ mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), M('#8a9097'), radar, 0, 1.3, 0); mesh(new THREE.BoxGeometry(0.7, 0.5, 0.55), M('#3a3f46'), radar, 0, 2.6, 0.15);
  mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 14).rotateX(Math.PI / 2), M('#111', { roughness: 0.1 }), radar, 0, 2.6, 0.45); }
const sign = new THREE.Group(); scene.add(sign); sign.position.set(1.2, 0, -7.0);
{ mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), M('#8a9097'), sign, 0, 1.2, 0);
  const st = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.fillStyle = '#d62a2a'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 92, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = '900 110px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('80', 128, 136); }); st.center.set(0.5, 0.5); st.rotation = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 28).rotateX(Math.PI / 2), [M('#ccc'), M('#ffffff', { map: st }), M('#ccc')], sign, 0, 2.4, 0.04); }
// chuva
const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.35, 0.012), new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.55 }), 500); scene.add(rain); rain.frustumCulled = false;
const rainSeeds = [...Array(500)].map((_, i) => [((i * 97) % 1000) / 1000 * 14 - 7, ((i * 61) % 1000) / 1000, ((i * 31) % 1000) / 1000 * 8 - 7]);
const dm = new THREE.Matrix4();
function setRain(t, on, cx = 0) { rain.visible = on; if (!on) return; rainSeeds.forEach(([x, ph, z], i) => { const y = 7 - ((t * 9 + ph * 9) % 9); dm.makeTranslation(x + cx, y, z + 1.0); rain.setMatrixAt(i, dm); }); rain.instanceMatrix.needsUpdate = true; }
// respingos de lama saindo da junta (bombeamento)
const spray = new THREE.Group(); scene.add(spray); for (let i = 0; i < 16; i++) mesh(new THREE.SphereGeometry(0.07, 8, 6), M('#7a4a29'), spray, 0, 0, 0, false);
function setSpray(t, on, x) { spray.visible = on; if (!on) return; spray.children.forEach((m, i) => { const u = ((t * 1.4 + i / 16) % 1); const z = -0.4 - (i % 8) * 0.65; m.position.set(x + (i % 2 ? 1 : -1) * u * 0.35, u * 0.9 - u * u * 0.9, z); }); }
// poeira da serra
const dust = new THREE.Group(); scene.add(dust); for (let i = 0; i < 12; i++) mesh(new THREE.SphereGeometry(0.08, 8, 6), M('#e6e2da', { transparent: true, opacity: 0.8 }), dust, 0, 0, 0, false);
function setDust(t, on, p) { dust.visible = on; if (!on) return; dust.children.forEach((m, i) => { const u = ((t * 1.2 + i / 12) % 1); m.position.set(p.x + (i % 3 - 1) * 0.25 * u, p.y + u * 0.8, p.z + 0.2 + u * 0.3); m.scale.setScalar(0.6 + u); }); }
// setas
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.13, 0.28, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
const redArrows = []; for (let i = 0; i < 8; i++) redArrows.push(arrow('#ff5a1a'));
const blueArrows = []; for (let i = 0; i < 8; i++) blueArrows.push(arrow('#3d9bff'));
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.14 / len; }

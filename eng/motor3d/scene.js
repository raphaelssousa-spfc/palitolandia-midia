// ================= SUBSOLO: cenário =================
const PW = 2.0, PB = -2.9, PZ = -3.5;              // meia largura do buraco, fundo, fundo em z
const WX = 1.75, WT = 0.2, WTOP = 0.1, SLAB = -2.5;  // paredes
const full = new THREE.Group(); scene.add(full);
mats.grass2 = M('#7fae4f'); mats.conc = M('#b9b5ad'); mats.concNew = M('#cfcac0'); mats.gravel = M('#8d8a86');
mats.waterIn = new THREE.MeshStandardMaterial({ color: '#3d86c6', roughness: 0.15, transparent: true, opacity: 0.75, depthWrite: false });
mats.waterSoil = new THREE.MeshBasicMaterial({ color: '#2f7fd0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
mats.manta = M('#1c1c1e', { roughness: 0.5 }); mats.wallT = M('#bdb8ae', { transparent: true, opacity: 1 }); mats.steel2 = M('#9a4a2a', { roughness: 0.6, metalness: 0.3 });
// chão de cima (metade de trás, com o buraco)
{ const s = new THREE.Shape(); s.moveTo(-40, 0); s.lineTo(-PW, 0); s.lineTo(-PW, -PZ); s.lineTo(PW, -PZ); s.lineTo(PW, 0); s.lineTo(40, 0); s.lineTo(40, 40); s.lineTo(-40, 40);
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
  mesh(g, M('#ffffff', { map: dirtTex, side: THREE.DoubleSide, color: '#b9d68a' }), full, 0, 0, 0, false); }
// grama em faixa por cima (verde) — fica no chão
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(80, 40).rotateX(-Math.PI / 2), mats.grass2); lawn.position.set(0, -0.005, -24); lawn.receiveShadow = true; scene.add(lawn);
// face do corte com o buraco e o poço de drenagem
{ const s = new THREE.Shape(); s.moveTo(-40, -12); s.lineTo(40, -12); s.lineTo(40, 0); s.lineTo(PW, 0); s.lineTo(PW, PB); s.lineTo(1.5, PB); s.lineTo(1.5, -3.5); s.lineTo(0.8, -3.5); s.lineTo(0.8, PB); s.lineTo(-PW, PB); s.lineTo(-PW, 0); s.lineTo(-40, 0);
  const g = new THREE.ShapeGeometry(s); strataTex.repeat.set(1 / 4, 1 / 12); mesh(g, mats.strata, full, 0, 0, 0, false); }
// paredes de terra do buraco (fundo, laterais, piso)
const pitBack = mesh(new THREE.PlaneGeometry(2 * PW, -PB), M('#ffffff', { map: strataTex, side: THREE.DoubleSide }), full, 0, PB / 2, PZ, false);
for (const sx of [-1, 1]) { const p = mesh(new THREE.PlaneGeometry(-PZ, -PB), M('#9c5a34', { side: THREE.DoubleSide }), full, sx * PW, PB / 2, PZ / 2, false); p.rotation.y = Math.PI / 2; }
mesh(new THREE.PlaneGeometry(2 * PW, -PZ).rotateX(-Math.PI / 2), M('#7a4a2c'), full, 0, PB, PZ / 2, false);
// terra que vai saindo (buraco sendo cavado)
const fillBox = mesh(new THREE.BoxGeometry(2 * PW - 0.02, 1, -PZ - 0.02), M('#ffffff', { map: dirtTex }), full, 0, 0, PZ / 2, false);
// água no solo (lençol), duas faixas na face do corte
const wsL = mesh(new THREE.PlaneGeometry(1, 1), mats.waterSoil, full, 0, 0, 0.02, false), wsR = mesh(new THREE.PlaneGeometry(1, 1), mats.waterSoil, full, 0, 0, 0.02, false);
const wsB = mesh(new THREE.PlaneGeometry(1, 1), mats.waterSoil, full, 0, 0, PZ - 0.01, false);
function waterTable(y, op) { mats.waterSoil.opacity = op; const h = y + 12; for (const [m, x0, x1] of [[wsL, -40, -PW], [wsR, PW, 40]]) { m.scale.set(x1 - x0, h, 1); m.position.set((x0 + x1) / 2, -12 + h / 2, 0.02); m.visible = op > 0; } wsB.visible = false; }
// ---- estrutura do subsolo ----
const struct = new THREE.Group(); full.add(struct);
const footings = new THREE.Group(); struct.add(footings);
for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.62, 0.3, -PZ - 0.25), mats.concNew, footings, sx * WX, -2.75, (PZ + 0.25) / 2 - 0.0);
mesh(new THREE.BoxGeometry(2 * WX + 0.62, 0.3, 0.62), mats.concNew, footings, 0, -2.75, PZ + 0.31);
footings.children.forEach(m => { m.userData.base = m.position.clone(); });
const walls = new THREE.Group(); struct.add(walls);
const WH = WTOP - (-2.6);
for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(WT, WH, -PZ - 0.3), mats.wallT, walls, sx * WX, -2.6 + WH / 2, (PZ + 0.3) / 2);
const backWall = mesh(new THREE.BoxGeometry(2 * WX + WT, WH, WT), mats.wallT, walls, 0, -2.6 + WH / 2, PZ + 0.4);
const slab = mesh(new THREE.BoxGeometry(2 * WX - WT, 0.12, -PZ - 0.5), mats.conc, struct, 0, SLAB - 0.04, (PZ + 0.5) / 2);
// armadura
const rebar = new THREE.Group(); struct.add(rebar);
for (const sx of [-1, 1]) {
  for (let z = -0.15; z > PZ + 0.4; z -= 0.35) mesh(new THREE.CylinderGeometry(0.018, 0.018, WH - 0.1, 6), mats.steel2, rebar, sx * WX, -2.6 + WH / 2, z, false);
  for (let y = -2.45; y < 0; y += 0.3) mesh(new THREE.CylinderGeometry(0.016, 0.016, -PZ - 0.45, 6).rotateX(Math.PI / 2), mats.steel2, rebar, sx * WX, y, (PZ + 0.3) / 2, false); }
for (let x = -WX + 0.2; x < WX; x += 0.35) mesh(new THREE.CylinderGeometry(0.018, 0.018, WH - 0.1, 6), mats.steel2, rebar, x, -2.6 + WH / 2, PZ + 0.4, false);
for (let y = -2.45; y < 0; y += 0.3) mesh(new THREE.CylinderGeometry(0.016, 0.016, 2 * WX, 6).rotateZ(Math.PI / 2), mats.steel2, rebar, 0, y, PZ + 0.4, false);
// rachadura na parede do fundo
const crack = new THREE.Group(); struct.add(crack);
{ let x = -0.6, y = -0.3; const pts = [[-0.6, -0.3]]; for (let i = 0; i < 9; i++) { x += 0.12 + Math.sin(i * 2.3) * 0.08; y -= 0.22 + Math.cos(i * 1.7) * 0.06; pts.push([x, y]); }
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const len = Math.hypot(x1 - x0, y1 - y0); const m = mesh(new THREE.BoxGeometry(len, 0.035, 0.02), mats.black, crack, (x0 + x1) / 2, (y0 + y1) / 2, PZ + 0.4 + WT / 2 + 0.012, false); m.rotation.z = Math.atan2(y1 - y0, x1 - x0); m.userData.i = i; } }
// dreno: brita + cano furado
const drain = new THREE.Group(); struct.add(drain);
for (const sx of [-1, 1]) {
  mesh(new THREE.CylinderGeometry(0.07, 0.07, -PZ - 0.2, 12).rotateX(Math.PI / 2), M('#e8e6e0'), drain, sx * 1.93, -2.72, PZ / 2, false);
  for (let i = 0; i < 40; i++) { const z = -0.1 + (PZ + 0.2) * ((i * 37) % 40) / 40; mesh(new THREE.IcosahedronGeometry(0.035 + ((i * 13) % 5) * 0.006, 0), mats.gravel, drain, sx * (1.87 + ((i * 7) % 5) * 0.025), -2.84 + ((i * 11) % 7) * 0.035, z, false); }
  for (let k = 0; k < 6; k++) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), mats.black, drain, sx * 1.93, -2.66, -0.25 - k * 0.5, false); }
// manta asfáltica (cresce de baixo pra cima)
const manta = new THREE.Group(); struct.add(manta);
for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.035, 1, -PZ - 0.3), mats.manta, manta, sx * (WX + WT / 2 + 0.02), 0, (PZ + 0.3) / 2, false);
mesh(new THREE.BoxGeometry(2 * WX + WT + 0.08, 1, 0.035), mats.manta, manta, 0, 0, PZ + 0.4 - WT / 2 - 0.02, false);
function setManta(u) { manta.visible = u > 0; const h = Math.max(0.001, u * WH); manta.children.forEach(m => { m.scale.y = h; m.position.y = -2.6 + h / 2; }); }
// água dentro do subsolo
const waterIn = mesh(new THREE.BoxGeometry(2 * WX - WT - 0.02, 1, -PZ - 0.52), mats.waterIn, struct, 0, 0, (PZ + 0.5) / 2, false); waterIn.castShadow = false;
function setWaterIn(h) { waterIn.visible = h > 0.005; waterIn.scale.y = Math.max(0.001, h); waterIn.position.y = SLAB + 0.02 + h / 2; }
// poço de drenagem com bomba e boia
const sump = new THREE.Group(); struct.add(sump);
{ mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.95, 20, 1, true), M('#8f8a82', { side: THREE.DoubleSide }), sump, 1.15, -3.0, -0.35, false);
  mesh(new THREE.CircleGeometry(0.3, 20).rotateX(-Math.PI / 2), M('#4c3a2c'), sump, 1.15, -3.46, -0.35, false); }
const pump = new THREE.Group(); pump.position.set(1.15, -3.3, -0.4); sump.add(pump);
{ mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.26, 14), M('#2f6fb3'), pump, 0, 0, 0); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), M('#2a5e99'), pump, 0, 0.25, 0); }
const floatBall = mesh(new THREE.SphereGeometry(0.07, 12, 10), M('#f2c21b'), sump, 1.28, -3.15, -0.3);
const outPipe = new THREE.Group(); struct.add(outPipe);
{ const c = new THREE.CatmullRomCurve3([V(1.15, -3.05, -0.4), V(1.45, -2.4, -0.4), V(1.5, -0.4, -0.4), V(1.5, 0.35, -0.4), V(2.2, 0.55, -0.4), V(2.7, 0.3, -0.4)]); mesh(new THREE.TubeGeometry(c, 40, 0.035, 8), M('#e8e6e0'), outPipe, 0, 0, 0, false); }
const sumpWater = mesh(new THREE.CylinderGeometry(0.28, 0.28, 1, 20), mats.waterIn, sump, 1.15, -3.2, -0.35, false);
// escada e lâmpadas (final)
const stairs = new THREE.Group(); struct.add(stairs);
for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.3, 0.27 * (i + 1), 0.8), mats.conc, stairs, -1.45 + i * 0.3, SLAB + 0.135 * (i + 1), PZ + 0.9, false);
const lamps = new THREE.Group(); struct.add(lamps);
for (const x of [-0.8, 0.8]) { mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshStandardMaterial({ color: '#fff6d0', emissive: '#ffe9a0', emissiveIntensity: 2 }), lamps, x, -0.1, -1.6, false); }
const lampLight = new THREE.PointLight('#ffe6b0', 0, 6, 1.5); lampLight.position.set(0, -0.4, -1.2); scene.add(lampLight);
// carros
function car(color) { const g = new THREE.Group(); scene.add(g);
  mesh(new THREE.BoxGeometry(1.35, 0.45, 2.6), M(color, { roughness: 0.35 }), g, 0, 0.42, 0); mesh(new THREE.BoxGeometry(1.15, 0.38, 1.3), M(color, { roughness: 0.35 }), g, 0, 0.82, -0.15);
  mesh(new THREE.BoxGeometry(1.17, 0.28, 1.1), M('#2c3a46', { roughness: 0.1 }), g, 0, 0.84, -0.15);
  for (const [x, z] of [[-0.66, 0.8], [0.66, 0.8], [-0.66, -0.85], [0.66, -0.85]]) mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14).rotateZ(Math.PI / 2), mats.black, g, x, 0.24, z);
  return g; }
const carN = car('#d63b3b');
// casa (casa de bonecas: aberta na frente)
const house = new THREE.Group(); scene.add(house);
{ const wm = M('#efe6d8'), rf = M('#c0563a'); const hw = 2.3, hd = 3.6, hh = 2.5;
  mesh(new THREE.BoxGeometry(2 * hw, 0.15, hd), M('#cdbfa9'), house, 0, 0.075, -hd / 2);
  mesh(new THREE.BoxGeometry(2 * hw, hh, 0.15), wm, house, 0, hh / 2, -hd + 0.075);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.15, hh, hd), wm, house, sx * (hw - 0.075), hh / 2, -hd / 2);
  mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), M('#8fc3e6', { roughness: 0.1 }), house, 0.8, 1.4, -hd + 0.16);
  mesh(new THREE.BoxGeometry(0.8, 1.6, 0.05), mats.door, house, -0.9, 0.8, -hd + 0.16);
  const roof = new THREE.Shape(); roof.moveTo(-hw - 0.3, 0); roof.lineTo(hw + 0.3, 0); roof.lineTo(0, 1.5); roof.lineTo(-hw - 0.3, 0);
  const rg = new THREE.ExtrudeGeometry(roof, { depth: hd + 0.3, bevelEnabled: false }); const rm = mesh(rg, rf, house, 0, hh, -hd - 0.15); }
const building = new THREE.Group(); scene.add(building);
{ const bm = M('#d9d4cc'), gl = M('#7fa9c9', { roughness: 0.1 });
  mesh(new THREE.BoxGeometry(4.6, 9, 3.6), bm, building, 0, 4.5, -1.8);
  for (let y = 1; y < 9; y += 1.2) for (const x of [-1.4, 0, 1.4]) mesh(new THREE.BoxGeometry(0.8, 0.7, 0.05), gl, building, x, y, 0.03); }
// entorno
function tree2(x, z, s) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8), mats.trunk, g, 0, 0.8, 0); mesh(new THREE.IcosahedronGeometry(1.1, 1), mats.leaf, g, 0, 2.2, 0); mesh(new THREE.IcosahedronGeometry(0.8, 1), mats.leaf2, g, 0.6, 1.9, 0.3); }
[[-6, -9, 1.3], [6.5, -10, 1.5], [-9, -16, 1.4], [9, -17, 1.3], [0, -20, 1.6]].forEach(a => tree2(...a));
function bgHouse(x, z, w, c) { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); mesh(new THREE.BoxGeometry(w, 2.4, 4), M(c), g, 0, 1.2, 0); const r = new THREE.ConeGeometry(w * 0.78, 1.3, 4); r.rotateY(Math.PI / 4); mesh(r, mats.roof, g, 0, 3.05, 0).scale.set(1, 1, 4 / w); }
bgHouse(-7.5, -14, 5, '#e3d7c4'); bgHouse(8, -14, 5, '#efe6d8'); bgHouse(0, -26, 6, '#e3d7c4');
// gerador
const gen = new THREE.Group(); scene.add(gen); gen.position.set(-3.0, 0, -1.5);
{ mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), M('#e0a21a'), gen, 0, 0.35, 0); mesh(new THREE.BoxGeometry(0.95, 0.08, 0.65), mats.black, gen, 0, 0.04, 0); mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), mats.black, gen, 0.3, 0.75, 0); }
// pá do trabalhador
const shovel = new THREE.Group(); { mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), mats.wood, shovel, 0, 0, 0); mesh(new THREE.BoxGeometry(0.22, 0.28, 0.03), mats.steel, shovel, 0, -0.62, 0.02); }
// pedaços de terra caindo
const chunksG = new THREE.Group(); scene.add(chunksG);
for (let i = 0; i < 26; i++) { const m = mesh(new THREE.IcosahedronGeometry(0.12 + (i % 4) * 0.05, 0), M('#9c5a34'), chunksG, 0, 0, 0); m.userData = { sx: i % 2 ? 1 : -1, z: -0.3 - (i * 0.37) % 3, d: (i * 0.13) % 0.9, y0: -0.1 - (i * 0.29) % 1.6, sp: 0.5 + (i % 5) * 0.12 }; }
// chuva
const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.35, 0.012), new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.55 }), 500); scene.add(rain); rain.frustumCulled = false;
const rainSeeds = [...Array(500)].map((_, i) => [((i * 97) % 1000) / 1000 * 14 - 7, ((i * 61) % 1000) / 1000, ((i * 31) % 1000) / 1000 * 8 - 6]);
const dm = new THREE.Matrix4();
function setRain(t, on) { rain.visible = on; if (!on) return; rainSeeds.forEach(([x, ph, z], i) => { const y = 8 - ((t * 9 + ph * 9) % 9); dm.makeTranslation(x, y, z + 1.5); rain.setMatrixAt(i, dm); }); rain.instanceMatrix.needsUpdate = true; }
// setas (empuxo / peso)
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.13, 0.28, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
const pushArrows = []; for (let i = 0; i < 8; i++) pushArrows.push(arrow('#ff7a1a'));
const loadArrows = []; for (let i = 0; i < 6; i++) loadArrows.push(arrow('#ffd21f'));
const flowArrows = []; for (let i = 0; i < 8; i++) flowArrows.push(arrow('#3d9bff'));
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.14 / len; }
// personagens
const you = person({ shirt: '#f07c1e' });
// ---- jato de água na saída ----
const jet = new THREE.Group(); scene.add(jet); for (let i = 0; i < 14; i++) mesh(new THREE.SphereGeometry(0.05, 8, 6), mats.waterIn, jet, 0, 0, 0, false);
function setJet(t, on) { jet.visible = on; if (!on) return; jet.children.forEach((m, i) => { const u = ((t * 1.6 + i / 14) % 1); m.position.set(2.7 + u * 0.9, 0.3 + u * 0.35 - u * u * 0.9, -0.4); }); }

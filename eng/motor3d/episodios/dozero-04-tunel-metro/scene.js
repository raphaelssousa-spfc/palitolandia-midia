// ================= TÚNEL DE METRÔ (tatuzão): cenário montado com o KIT =================
// Túnel ao longo de x, eixo em y = TY, corte no plano z = 0 (vemos a metade de trás). 1 unidade ≈ 3 m. Poço de partida em x = XS.
const RT = 1.8, TY = -7, XS = -14, SW = 1.7, XT0 = XS + SW, XE = 34, RW = 0.5, LS = 3.2;
const NR = Math.floor((XE - XT0) / RW);
scene.fog = new THREE.Fog('#d9e6ea', 45, 130);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30; sun.shadow.camera.far = 90; sun.shadow.camera.updateProjectionMatrix();
// chão com o buraco do poço
KIT.chao({ x: 0, w: 400, frente: 0, buracos: [[XS, -1.6, 3.4, 3.2]] });
// solo acima do túnel (dos dois lados do poço) e atrás do poço
const TOPC = [['terra', 1.6], ['argila', 3.56]];
KIT.corte({ w: 44.3, d: 40, x: -37.85, y: -0.04, z: -20, camadas: TOPC });
KIT.corte({ w: 72.3, d: 40, x: 23.85, y: -0.04, z: -20, camadas: TOPC });
KIT.corte({ w: 3.4, d: 36.8, x: XS, y: -0.04, z: -21.6, camadas: [['terra', 1.6], ['argila', 7.16]] });
// faixa do túnel: à esquerda do poço é maciço; à direita, bloco com furo semicircular + terra ainda não escavada
KIT.corte({ w: 44.3, d: 40, x: -37.85, y: TY + RT, z: -20, camadas: [['argila', 2 * RT]] });
KIT.soloTunel({ R: RT, comp: 72.3, prof: 40, x: XT0, y: TY });
const core = KIT.frenteTunel({ R: RT - 0.03, x: XT0, y: TY }); core.geometry.dispose(); core.geometry = KIT.extX((() => { const sh = new THREE.Shape(); sh.moveTo(0, -(RT - 0.03)); sh.absarc(0, 0, RT - 0.03, -Math.PI / 2, Math.PI / 2, false); sh.closePath(); return sh; })(), 75);
// solo abaixo
KIT.corte({ w: 120, d: 40, x: 0, y: TY - RT, z: -20, camadas: [['argila', 1.5], ['rocha', 9]] });
// poço (paredes de concreto)
{ const c = KIT.matOf('concreto');
  KIT.box(0.15, -(TY - RT), 3.2, c, scene, XS - SW + 0.075, TY - RT, -1.6, false);
  KIT.box(0.15, -(TY + RT), 3.2, c, scene, XS + SW - 0.075, TY + RT, -1.6, false);
  KIT.box(3.1, -(TY - RT), 0.15, c, scene, XS, TY - RT, -3.125, false);
  KIT.box(3.1, 0.14, 3.2, c, scene, XS, TY - RT, -1.6, false); }
// cidade: avenida em cima do túnel, prédios e árvores
const asf = KIT.matOf('asfalto');
KIT.box(68, 0.05, 3.0, asf, scene, 26, 0, -2.3, false);
const sink = KIT.box(3.0, 0.05, 3.0, asf, scene, -9.5, 0, -2.3, false);   // trecho que afunda
KIT.faixa({ comp: 68, x: 26, y: 0.056, z: -2.3, tachao: false });
[[-5, -7.5, 3, 4.5, '#d9e6ef'], [0, -8, 3.2, 7, '#efe6d8'], [5, -7, 2.6, 3, '#e3d7c4'], [10, -8.5, 3.4, 9, '#cfd8e3'], [16, -7.5, 3, 5, '#efe6d8'], [22, -8, 3.4, 8, '#d9e6ef'], [-9, -12, 3, 6, '#e3d7c4'], [8, -14, 4, 12, '#d6dde6'], [28, -12, 4, 10, '#efe6d8']]
  .forEach(([x, z, w, h, c]) => { const g = KIT.grp(scene, x, 0, z); KIT.box(w, h, w, M(c), g); for (let y = 0.6; y < h - 0.3; y += 0.9) KIT.box(w + 0.04, 0.32, w + 0.04, M('#5d6f80'), g, 0, y, 0, false); });
[[-7.5, -4.6], [-2.5, -4.6], [2.5, -4.6], [7.5, -4.6], [12.5, -4.6], [19, -4.6], [25, -4.6]].forEach(([x, z]) => KIT.arvore({ x, z, r: 0.8, h: 1.6 }));
// canteiro do poço: guindaste, caminhão, cones
const crane = KIT.guindaste({ alt: 8, lanca: 6, x: XS - 5, z: -1.6 });
const bucket = KIT.box(0.9, 0.6, 0.9, M('#3a3f46'), crane.cabo, 0, 0, 0);
const bucketDirt = KIT.box(0.8, 0.12, 0.8, KIT.matOf('terra'), bucket, 0, 0.6, 0, false);
const truck = KIT.caminhao({ x: XS - 8, z: -5.2, ry: 0.3 }); truck.set({ carga: true, tipoCarga: 'terra' });
[[XS - SW - 0.4, -0.4], [XS + SW + 0.4, -0.4], [XS - SW - 0.4, -3.6], [XS + SW + 0.4, -3.6], [XS, -3.7]].forEach(([x, z]) => KIT.cone({ x, z, s: 0.8 }));
// tatuzão + anéis
const tbm = KIT.tatuzao({ R: RT, comp: LS, backup: 6 });
const rings = []; for (let i = 0; i < NR; i++) rings.push(KIT.anelMeio({ R: RT, larg: RW, x: XT0 + i * RW, y: TY }));
// esteira (correia) e terra em cima dela
const belt = KIT.box(1, 0.06, 0.6, M('#26262a'), scene, 0, TY + 0.92, -0.6, false);
const blobs = []; for (let i = 0; i < 16; i++) blobs.push(KIT.box(0.32, 0.16, 0.36, KIT.matOf('terra'), scene, 0, TY + 0.98, -0.6, false));
// laje do piso + trilhos + trem (meia seção)
const floorS = KIT.grp(); KIT.box(XE - XT0, 0.45, 0.98, KIT.matOf('concreto'), floorS, (XE + XT0) / 2, TY - RT + 0.25, -0.51, false);
for (const z of [-0.35, -0.75]) KIT.box(XE - XT0, 0.06, 0.06, M('#9aa3ab', { metalness: 0.5 }), floorS, (XE + XT0) / 2, TY - RT + 0.7, z, false);
const train = KIT.grp();
for (let c = 0; c < 3; c++) { const g = KIT.grp(train, -c * 6.15, 0, 0);
  KIT.box(6, 1.6, 1.15, M('#f1f1ee'), g, -3, TY - 0.95, -0.63); KIT.box(6.02, 0.2, 0.02, M('#f07a1a'), g, -3, TY - 0.6, -0.02, false);
  for (let w = 0; w < 5; w++) KIT.box(0.75, 0.5, 0.02, M('#2b3742'), g, -0.8 - w * 1.1, TY + 0.0, -0.02, false); }
// carros na avenida
const cars = ['#d63b3b', '#2f6fb3', '#f2c21b', '#f4f4f2', '#2aa35a', '#7a4fd6'].map(c => { const o = KIT.carro({ cor: c }); o.g.scale.setScalar(0.42); return o; });
// operário (cava à mão / soterrado na piada)
const worker = KIT.operario(0); worker.g.scale.setScalar(0.6);
const shovel = KIT.grp(worker.handR); KIT.box(0.05, 0.9, 0.05, M('#8a5a30'), shovel, 0, -0.5, 0); KIT.box(0.25, 0.3, 0.04, M('#7d858c'), shovel, 0, -0.75, 0);
// pedaços de terra que caem, monte de terra, poeira
const pieces = []; for (let i = 0; i < 7; i++) pieces.push(KIT.box(0.35 + (i % 3) * 0.1, 0.25, 0.35, KIT.matOf('terra'), scene, 0, 0, 0, false));
const pile = mesh(new THREE.ConeGeometry(1.2, 1.6, 18).translate(0, 0.8, 0), KIT.matOf('terra'), scene, 0, TY - RT + 0.15, -1.0, false);
const dust = KIT.nuvem({ n: 14, cor: '#d9cbb5', raio: 0.9 });
// setas
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.18, 0.36, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.18 / len; }
const dnArrows = []; for (let i = 0; i < 4; i++) dnArrows.push(arrow('#ff3a2a'));
const fwArrows = []; for (let i = 0; i < 3; i++) fwArrows.push(arrow('#ff9a1f'));

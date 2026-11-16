// ================= PONTE ESTAIADA: cenário (montado com o KIT) =================
// Ponte ao longo de x. Corte na frente (z = FZ). Rio de x = RX0 a RX1. Mastro na margem esquerda (x = 0). 1 unidade ≈ 10 m.
const FZ = 4, RX0 = 1.5, RX1 = 11.5, WL = -0.5, BED = -2.5;   // corte, margens do rio, nível da água, fundo do rio
const DY = 2.5, DT = 0.3, DZ = 1.5, DW = 1.6;                   // pista: topo, espessura, centro em z, largura
const SEG = 1.5, NSEG = 8, MH = 14;                             // aduela, nº de aduelas por lado, altura do mastro
scene.fog = new THREE.Fog('#d9e6ea', 60, 160);
sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26; sun.shadow.camera.far = 80; sun.shadow.camera.updateProjectionMatrix();
// chão (duas margens) + solo em corte + leito do rio
KIT.chao({ x: -99.25, w: 201.5, frente: FZ }); KIT.chao({ x: 111.5, w: 200, frente: FZ });
KIT.corte({ w: 41.5, d: 64, x: -19.25, y: -0.04, z: FZ - 32, camadas: [['terra', 2.5], ['argila', 2], ['rocha', 14]] });
KIT.corte({ w: 38.5, d: 64, x: 30.75, y: -0.04, z: FZ - 32, camadas: [['terra', 2.5], ['argila', 2], ['rocha', 14]] });
KIT.corte({ w: RX1 - RX0, d: 64, x: (RX0 + RX1) / 2, y: BED, z: FZ - 32, camadas: [['areia', 1], ['argila', 1.5], ['rocha', 14]] });
mats.river = M('#3d8fc4', { transparent: true, opacity: 0.6, depthWrite: false, roughness: 0.15, metalness: 0.1 }); // sempre transparent
const water = mesh(new THREE.BoxGeometry(RX1 - RX0 - 0.06, WL - BED - 0.03, 63.9), mats.river, scene, (RX0 + RX1) / 2, (WL + BED) / 2 + 0.015, FZ - 0.02 - 31.95, false);
water.renderOrder = 2;
// entorno (cidade ao fundo)
[[-8, -14, '#d9e6ef'], [-14, -18, '#efe6d8'], [17, -15, '#e3d7c4'], [22, -20, '#d9e6ef'], [-20, -10, '#e3d7c4']].forEach(([x, z, c], i) => KIT.casa({ x, z, w: 3, h: 2.4 + (i % 2), d: 3, parede: c }));
[[-5, -8], [-17, -6], [15, -8], [19, -5], [-10, -22], [25, -12]].forEach(([x, z]) => KIT.arvore({ x, z, r: 1.1 }));
// ---------- fase 0/1: a tábua ----------
const plank = KIT.grp(); const PL0 = 0.3, PL1 = 12.7, PLM = 6.5;
const plankL = KIT.grp(plank, PL0, 0, DZ), plankR = KIT.grp(plank, PL1, 0, DZ);
KIT.box(PLM - PL0, 0.14, 0.7, KIT.matOf('madeira'), plankL, (PLM - PL0) / 2, 0.02, 0);
KIT.box(PL1 - PLM, 0.14, 0.7, KIT.matOf('madeira'), plankR, -(PL1 - PLM) / 2, 0.02, 0);
const splash = KIT.nuvem({ n: 16, cor: '#d8efff', x: PLM, y: WL, z: DZ, raio: 1.2 });
// ---------- fase 2/3: pilares no rio (ponte de viga) ----------
const beamBr = KIT.grp(); const PX = [4.5, 8.5];
const piles = KIT.grp(); const pillars = KIT.grp(beamBr);
for (const x of PX) { KIT.box(1.6, 0.4, 3.7, KIT.matOf('concreto'), piles, x, BED, FZ + 0.06 - 1.85);           // bloco sobre as estacas
  for (const dx of [-0.5, 0.5]) { const p = KIT.cyl(0.22, 0.22, 3.5, 12, KIT.matOf('concreto'), piles, x + dx, BED - 3.5, FZ - 0.12); p.castShadow = false; } // estacas cortadas na frente
  KIT.pilar({ h: DY - DT - BED, a: 0.8, redondo: true, x, y: BED + 0.4, z: DZ, parent: pillars }); }
const beamDeck = KIT.box(PL1 - PL0, DT, DW, KIT.matOf('concreto'), beamBr, (PL0 + PL1) / 2, DY - DT, DZ);
// barco
const boat = KIT.grp();
{ KIT.box(3.6, 1.0, 6.0, KIT.matOf('concreto', { color: '#c94a3a' }), boat, 0, -0.6, 0); KIT.box(3.6, 0.15, 6.0, M('#2a2f36'), boat, 0, 0.4, 0);
  KIT.box(2.4, 1.4, 1.4, M('#f4f4f2'), boat, 0, 0.55, 2.0); KIT.box(2.42, 0.4, 1.42, M('#4d5c66'), boat, 0, 1.3, 2.0);
  ['#2f7fd6', '#f2b51b', '#2aa35a', '#e8532b'].forEach((c, i) => KIT.box(1.5, 0.9, 1.6, M(c), boat, i % 2 ? 0.8 : -0.8, 0.55, -1.8 + (i > 1 ? 1.7 : 0))); }
// ---------- a ponte estaiada (grupo que gira na piada: pivô na base do mastro) ----------
const bridge = KIT.grp();
const tower = KIT.grp(bridge);
{ const c = KIT.matOf('concreto');
  KIT.box(0.9, MH, 0.9, c, tower, 0, 0, DZ);                               // mastro único (a pista passa por ele)
  KIT.box(0.9, 0.3, 0.9, M('#9aa3ab'), tower, 0, MH, DZ);                    // topo
  KIT.box(2.2, 0.6, 4.4, c, tower, 0, -0.62, DZ);                            // bloco de fundação
  for (const dx of [-0.6, 0.6]) KIT.cyl(0.22, 0.22, 4, 12, c, tower, dx, -4.6, FZ - 0.12).castShadow = false; }
// pista: aduelas (0 = dentro do mastro; ±k = k-ésima de cada lado)
mats.deckTop = M('#3a3a3e', { roughness: 0.7 });
const segs = {};
for (let k = -NSEG; k <= NSEG; k++) { const g = KIT.grp(bridge, k * SEG, DY - DT, DZ); KIT.box(SEG - 0.03, DT, DW, KIT.matOf('concreto'), g, 0, 0, 0); KIT.box(SEG - 0.03, 0.03, DW - 0.3, mats.deckTop, g, 0, DT, 0, false);
  KIT.guardaCorpo({ comp: SEG - 0.05, h: 0.35, x: 0, y: DT, z: DW / 2 - 0.08, parent: g }); KIT.guardaCorpo({ comp: SEG - 0.05, h: 0.35, x: 0, y: DT, z: -DW / 2 + 0.08, parent: g }); segs[k] = g; }
const abut = [-1, 1].map(s => KIT.pilar({ h: DY - DT, a: 0.7, x: s * 12.3, z: DZ, parent: bridge }));
// estais (um por aduela, do mastro até a ponta da aduela)
mats.stay = M('#ffd23a', { roughness: 0.4, metalness: 0.2, emissive: '#7a5a00', emissiveIntensity: 0.25 });
const stays = {};
const anchorT = k => V(0, 6.6 + Math.abs(k) * 0.88, DZ), anchorD = k => V(k * SEG + Math.sign(k) * 0.4, DY + 0.02, DZ);
for (let k = -NSEG; k <= NSEG; k++) if (k) { const m = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), mats.stay, bridge, 0, 0, 0, false); stays[k] = m; }
function setStay(k, u) { const m = stays[k]; u = cl(u); m.visible = u > 0.01; if (!m.visible) return; const a = anchorT(k), b = lv(anchorT(k), anchorD(k), u);
  m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, a.distanceTo(b), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); }
// treliça de avanço (carrinho amarelo na ponta da pista)
function traveler() { const g = KIT.grp(bridge); const Y = M('#f2b51b'), K = M('#26262a');
  for (const z of [-0.6, 0.6]) { KIT.box(1.9, 0.12, 0.12, Y, g, 0.3, 1.2, z); for (const x of [-0.5, 1.1]) KIT.box(0.1, 1.2, 0.1, Y, g, x, 0, z); }
  KIT.box(0.12, 0.12, 1.3, Y, g, 1.2, 1.2, 0); KIT.box(0.12, 0.12, 1.3, Y, g, -0.55, 1.2, 0); KIT.box(1.0, 0.06, DW + 0.2, K, g, 0.9, -0.36, 0); return g; }
const travR = traveler(), travL = traveler(); travL.rotation.y = Math.PI;
// operário na ponta (susto da piada)
const worker = KIT.operario(0); bridge.add(worker.g);
const worker2 = KIT.operario(3);
// fôrma "pista inteira no ar" (fantasma vermelho)
mats.ghost = M('#ff5a4a', { transparent: true, opacity: 0, depthWrite: false });
const ghost = mesh(new THREE.BoxGeometry(2 * NSEG * SEG + 0.5, DT, DW), mats.ghost, bridge, 0, DY - DT / 2, DZ, false);
// guindaste ajudando no mastro
const crane = KIT.guindaste({ alt: 9, lanca: 6, x: -4.5, z: -4.5 });
// prédio de 40 andares para comparar (aparece no número)
const tall = KIT.grp(); { const b = KIT.box(3, 12, 3, M('#aebfcf'), tall, 0, 0, 0); for (let y = 0.3; y < 12; y += 0.3 * 2) KIT.box(3.04, 0.08, 3.04, M('#6f8293'), tall, 0, y, 0, false); }
tall.position.set(-6.5, 0, -6);
// carros para a ponte pronta
const cars = ['#d63b3b', '#2f6fb3', '#f2c21b', '#f4f4f2'].map(c => { const o = KIT.carro({ cor: c }); o.g.scale.setScalar(0.32); bridge.add(o.g); return o; });
// setas
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.25 }); mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.18, 0.36, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.18 / len; }
const upArrows = []; for (let i = 0; i < 8; i++) upArrows.push(arrow('#ff9a1f'));
const dnArrows = []; for (let i = 0; i < 4; i++) dnArrows.push(arrow('#ff3a2a'));
const dust = KIT.nuvem({ n: 14, cor: '#d9cbb5', x: 0, y: BED, z: DZ, raio: 1.0 });

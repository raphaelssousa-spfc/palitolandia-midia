// ================= PISTA DE AEROPORTO: cenário montado com o KIT =================
// Pista ao longo de z (de z = 0, o corte, até z = -LP). Seção transversal vista de frente em z = 0. Superfície em y = 0. 1 unidade ≈ 4,5 m.
const RW = 5, CW = 0.9, LP = 120, ZC = -LP / 2;
const YA = -0.3, YB = -0.7, YSB = -1.2, YSL = -1.9;           // topo de cada camada abaixo da capa
scene.fog = new THREE.Fog('#d9e6ea', 50, 140);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25; sun.shadow.camera.far = 90; sun.shadow.camera.updateProjectionMatrix();
// chão com o buraco da pista + canais
KIT.chao({ x: 0, w: 400, frente: 0, buracos: [[0, ZC, 2 * (RW + CW), LP]] });
// acostamentos (debaixo da grama) e solo natural
for (const s of [-1, 1]) KIT.corte({ w: 40, d: LP, x: s * (RW + CW + 20), y: -0.04, z: ZC, camadas: [['terra', 1.86], ['argila', 4.6]] });
KIT.corte({ w: 2 * (RW + CW), d: LP, x: 0, y: YSL, z: ZC, camadas: [['argila', 4.6]] });
// camadas da pista (cada uma um bloco: cresce na sua vez)
const LAY = {};
[['subleito', 'lama', YSB, YSL], ['subbase', 'brita', YB, YSB], ['base', 'base', YA, YB], ['capa', 'asfalto', 0, YA]].forEach(([k, m, top, bot]) => {
  const g = KIT.grp(scene, 0, bot, -LP); KIT.box(2 * RW, top - bot, LP, KIT.matOf(m), g, 0, 0, LP / 2, false).receiveShadow = true; LAY[k] = g; });
// frente da camada em z = zf (a máquina vem do fundo até o corte)
function layerTo(k, zf) { const g = LAY[k]; const u = (zf + LP) / LP; g.visible = u > 0.002; g.scale.z = Math.max(0.002, Math.min(1, u)); }
// terra fofa (1º jeito) + asfalto fininho por cima, em trechos (o trecho do avião afunda)
const fofa = KIT.grp(scene, 0, YSL, ZC); KIT.box(2 * RW, -YSL, LP, KIT.matOf('terra'), fofa, 0, 0, 0, false);
const NSEG = 60, SL = 2; const thin = [];
for (let i = 0; i < NSEG; i++) { const g = KIT.grp(scene, 0, 0, -SL * (i + 0.5)); KIT.box(2 * RW - 0.02, 0.06, SL - 0.02, KIT.matOf('asfalto'), g, 0, 0, 0); thin.push(g); }
// canais de drenagem dos dois lados (concreto em U) + terra que sai ao cavar
const chan = [], chanFill = [], chanWater = [];
for (const s of [-1, 1]) { const xc = s * (RW + CW / 2); const g = KIT.grp(scene, xc, -0.75, ZC); const c = KIT.matOf('concreto');
  KIT.box(CW, 0.1, LP, c, g, 0, 0, 0, false); KIT.box(0.1, 0.75, LP, c, g, -CW / 2 + 0.05, 0, 0, false); KIT.box(0.1, 0.75, LP, c, g, CW / 2 - 0.05, 0, 0, false); chan.push(g);
  const w = KIT.box(CW - 0.24, 0.22, LP, M('#3d8fd6', { transparent: true, opacity: 0.75, roughness: 0.2 }), scene, xc, -0.64, ZC, false); chanWater.push(w);
  KIT.corte({ w: CW, d: LP, x: xc, y: -0.75, z: ZC, camadas: [['terra', -YSL - 0.75]] });
  const f = KIT.grp(scene, xc, -0.75, ZC); KIT.box(CW, 0.75, LP, KIT.matOf('terra'), f, 0, 0, 0, false); chanFill.push(f); }
// pista longa (para o plano aberto de 4 km): só a capa, além do bloco em corte
const far = KIT.grp(); KIT.box(2 * RW, 0.06, 900, KIT.matOf('asfalto'), far, 0, -0.03, -LP - 450, false);
// sinalização: faixa central tracejada, cabeceira (piano), número
const marks = KIT.grp();
for (let z = -4; z > -LP - 900; z -= 6) KIT.box(0.25, 0.04, 3, M('#f4f4f2', { roughness: 0.6 }), marks, 0, 0, z, false);
for (let i = 0; i < 8; i++) for (const s of [-1, 1]) KIT.box(0.42, 0.04, 4, M('#f4f4f2', { roughness: 0.6 }), marks, s * (0.9 + i * 0.5), 0, -LP + 6, false);
for (const s of [-1, 1]) KIT.box(0.15, 0.04, LP + 900, M('#f4f4f2', { roughness: 0.6 }), marks, s * (RW - 0.3), 0, -(LP + 900) / 2, false);
// marcas de borracha na zona de toque (sempre transparentes; muda só a opacidade)
const rubberMat = M('#0e0e10', { transparent: true, opacity: 0.7, roughness: 0.9, depthWrite: false });
const rubber = KIT.grp(); const rubberPieces = [];
for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1; const z = -14 - (i >> 1) * 1.3 - (i % 3) * 0.3;
  const m = mesh(new THREE.PlaneGeometry(0.28 + (i % 3) * 0.06, 2.2 + (i % 4) * 0.6).rotateX(-Math.PI / 2), rubberMat.clone(), rubber, s * (1.7 + (i % 3) * 0.12), 0.05, z, false); rubberPieces.push(m); }
// grooving: riscos transversais (aparecem atrás da máquina)
const grooves = []; for (let z = -0.25; z > -LP; z -= 0.3) grooves.push(KIT.box(2 * RW - 0.7, 0.03, 0.04, M('#1a1a1d'), scene, 0, 0, z, false));
// água: lâmina na pista (chuva) e "molhado" na face do corte
const sheet = KIT.box(2 * RW, 0.03, LP, M('#5aa7e8', { transparent: true, opacity: 0, roughness: 0.1, depthWrite: false }), scene, 0, 0.045, ZC, false);
const wet = mesh(new THREE.PlaneGeometry(2 * RW, -YSL + YA), M('#3a5f8a', { transparent: true, opacity: 0, depthWrite: false }), scene, 0, (YA + YSL) / 2, 0.04, false);
// chuva: riscos finos caindo (movimento lento e suave)
const rainMat = M('#cfe6ff', { transparent: true, opacity: 0, depthWrite: false, emissive: '#9fc7ff', emissiveIntensity: 0.3 });
const rain = []; for (let i = 0; i < 160; i++) { const m = KIT.box(0.025, 0.7, 0.025, rainMat, scene, 0, 0, 0, false); m.userData = { x: ((i * 37) % 160) / 160 * 24 - 12, z: -((i * 71) % 160) / 160 * 40 + 2, o: (i * 13 % 100) / 100 }; rain.push(m); }
// máquinas, avião, gente
const plane = KIT.aviao({ comp: 11, ry: -Math.PI / 2 });
const paver = KIT.acabadora({ ry: -Math.PI / 2 }); paver.g.scale.setScalar(1.2);
const roller = KIT.rolo({ ry: -Math.PI / 2 }); roller.g.scale.setScalar(1.2);
const exc = KIT.escavadeira({}); exc.g.scale.setScalar(1.1);
const truck = KIT.caminhao({ ry: -Math.PI / 2 }); truck.g.scale.setScalar(1.2);
const groover = KIT.fresadora({ cor: '#f2b51b', ry: -Math.PI / 2 });
const pipa = KIT.caminhaoPipa({ ry: Math.PI / 2 });
const worker = KIT.operario(0); const sign = KIT.placa({ texto: 'NÃO!', cor: '#e53030', parent: worker.handR }); sign.position.set(0, -1.7, 0.1); sign.scale.setScalar(1.3);
const worker2 = KIT.operario(1);
[[-9, -6], [-10, -18], [9.5, -9], [10.5, -24], [-11, -34], [12, -40]].forEach(([x, z]) => KIT.arvore({ x, z, r: 1.0, h: 2.0 }));
// torre de controle e terminal ao fundo
{ const g = KIT.grp(scene, 16, 0, -46); KIT.box(1.4, 9, 1.4, M('#e8e4dc'), g); mesh(new THREE.CylinderGeometry(1.6, 1.2, 1.4, 8), M('#5f7d92', { metalness: 0.3, roughness: 0.3 }), g, 0, 9.7, 0); KIT.box(3.4, 0.2, 3.4, M('#e8e4dc'), g, 0, 10.4, 0);
  const t = KIT.grp(scene, 22, 0, -24); KIT.box(8, 3, 26, M('#dfe5ea'), t); KIT.box(8.1, 1.6, 26.1, M('#6f8ea6', { metalness: 0.3, roughness: 0.3 }), t, 0, 1.0, 0, false); }
const smoke = KIT.nuvem({ n: 14, cor: '#e8e8e8', raio: 1.2 });
const dust = KIT.nuvem({ n: 14, cor: '#d9cbb5', raio: 1.4 });
const spray = KIT.nuvem({ n: 16, cor: '#bfe0ff', raio: 1.6 });
// setas
function arrow(color) { const g = new THREE.Group(); const m = M(color, { emissive: color, emissiveIntensity: 0.3 }); mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 10), m, g, 0, 0.5, 0, false); mesh(new THREE.ConeGeometry(0.2, 0.4, 14), m, g, 0, 1.12, 0, false); scene.add(g); return g; }
function placeArrow(a, from, dir, len, vis = true) { a.visible = vis && len > 0.02; if (!a.visible) return; a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.set(1, len, 1); a.children[1].scale.set(1, 1 / len, 1); a.children[1].position.y = 1 + 0.2 / len; }
const blueA = []; for (let i = 0; i < 8; i++) blueA.push(arrow('#2f8cff'));
const redA = []; for (let i = 0; i < 3; i++) redA.push(arrow('#ff3a2a'));

// ================= RODOVIA DE CONCRETO: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const NP = TM.phrases.length;
const shotOf = t => { let k = 0; for (let i = 1; i < NP; i++) if (t >= S(i) - 0.1) k = i; return k; };
const TS = i => S(i) - 0.1;                 // início da tomada i
const SKYC = new THREE.Color('#cfe3ef'), STORM = new THREE.Color('#5a6670');
const SLABC = new THREE.Color('#d3cec4'), WETC = new THREE.Color('#8f979c');
function V2(x, y) { return { x, y }; }
const xB = (t, a, b) => back(r(t, a, a + b));
function rotAbout(m, px, py, ang, cx, cy) { const dx = cx - px, dy = cy - py; m.position.x = px + dx * Math.cos(ang) - dy * Math.sin(ang); m.position.y = py + dx * Math.sin(ang) + dy * Math.cos(ang); m.rotation.set(0, 0, ang); }
function placeCar(c, x, z, ry = 0, y = 0) { c.visible = true; c.position.set(x, y, z); c.rotation.set(0, ry, 0); }
function world(t) {
  const sh = shotOf(t); const st = { cam: null, blur: 0, red: 0, dark: 0, flash: 0, vig: 0.3, shake: 0, html: '' };
  const after = k => t >= TS(k);
  // ---- estado base ----
  [mixer, lorry, roller, saw, comb, hook, carA, carB, carC, sign, radar].forEach(o => o.visible = false);
  setRain(t, false); setSpray(t, false, 0); setDust(t, false, V(0, 0, 0)); [...redArrows, ...blueArrows].forEach(a => a.visible = false);
  scene.background = SKYC; hemi.intensity = 1.25; sun.intensity = 2.4;
  mats.slab.opacity = 1; mats.slabB.opacity = 1; mats.slab.depthWrite = true; mats.slabB.depthWrite = true;
  mats.slab.color.copy(SLABC); mats.slabB.color.copy(SLABC); mats.slab.roughness = 0.82; mats.slabB.roughness = 0.82;
  laneA.visible = laneB.visible = !(sh === 2 || sh === 3);
  laneB.position.set(0, 0, 0);
  for (const p of [...platesA, ...platesB]) { p.position.set(p.userData.cx, -ST / 2, p.parent === laneA ? -LW / 2 : -LW * 1.5); p.rotation.set(0, 0, 0); p.scale.set(1, 1, 1); p.visible = true; }
  setSub(after(2) ? (sh === 2 ? -99 : RX1) : RX0);
  grooves.visible = after(5); grooves.children.forEach(g => { g.scale.set(1, 1, 1); g.position.z = g.userData.x === 999 ? -LW : -LW; });
  cracks.visible = sh === 4; seals.visible = after(14); seals.children.forEach(g => g.scale.set(1, 1, 1));
  dowels.visible = sh === 8 || sh === 9; dowels.children.forEach(d => d.scale.set(1, 1, 1));
  ties.visible = sh === 11 || sh === 12; ties.children.forEach(d => d.scale.set(1, 1, 1));
  setGrooves(after(16) ? (sh === 16 ? -99 : 99) : -99); grv.material.color.set(sh === 16 ? '#8f897f' : '#c2bcb2'); // escuras só na tomada do pente (câmera lenta)
  paint.visible = after(20); paint.children.forEach(m => { m.scale.set(1, 1, 1); });
  sign.visible = after(20) && t > wt(20, 'placas') - 0.15; radar.visible = after(20) && t > wt(20, 'radar') - 0.15;
  let K;
  if (sh === 0) { // concreto direto na terra
    setSub(RX0);
    const xm = lerp(-11, 9, sm(r(t, 0.1, wt(0, 'tem') + 0.4)));
    placeCar(mixer, xm, -LW, 0); mixer.userData.drum.rotation.x = t * 1.2;
    for (const p of [...platesA, ...platesB]) { const x0 = p.userData.cx - PL / 2; const L = cl(xm - 2.6 - x0, 0, PL); p.visible = L > 0.02; p.scale.x = Math.max(0.005, L / PL); p.position.x = x0 + L / 2; } // concreto avança junto com a bica
    // o caminhão anda em cima do que já foi concretado? não: anda no acostamento de trás
    mixer.position.z = -7.6; mixer.position.y = -0.05;
    K = [0, V(xm - 1.5, 5.0, 11.5), V(xm - 1.8, -0.6, -4.2), 42];
    st.html += pill(t, wt(0, 'estrada') - 0.1, 'ESTRADA DE CONCRETO?', V2(540, 380), '', V(0, 0, -1.5));
  } else if (sh === 1) { // caminhão passa, afunda, quebra
    const tb = wt(1, 'afunda') - 0.1, tq = wt(1, 'quebra') - 0.1;
    const xl = lerp(-12, -0.2, eo(r(t, TS(1), tb + 0.2))); placeCar(lorry, xl, -LW / 2, 0);
    const a = 0.07 * eo(r(t, tb, tb + 0.5)) + 0.06 * eo(r(t, tq, tq + 0.3)); const drop = 0.12 * eo(r(t, tb, tb + 0.6));
    for (const P of [platesA, platesB]) { const L = P[5], Rr = P[6];
      rotAbout(L, -4, -drop * 0.3, -a, -2, -ST / 2 - drop * 0.3); rotAbout(Rr, 4, -drop * 0.3, a, 2, -ST / 2 - drop * 0.3); }
    lorry.position.y = -Math.sin(a) * 1.8 - drop * 0.3; lorry.rotation.z = a * 0.4;
    st.shake = 0.7 * r(t, tq, tq + 0.1) * (1 - r(t, tq + 0.4, tq + 0.9));
    if (t > tb) for (let i = 0; i < 4; i++) placeArrow(redArrows[i], V(-1.2 + i * 0.8, 3.6, -1.5), V(0, -1, 0), 0.9 * eo(r(t, tb + i * 0.06, tb + 0.4 + i * 0.06)) + 0.01);
    K = camKeys([[TS(1), V(3.5, 5.8, 13.5), V(0, 0.2, -2), 42], [S(2) - 0.2, V(2.0, 5.0, 12.0), V(0, 0.0, -1.5), 42]], t);
    st.html += pill(t, tq + 0.05, 'QUEBROU!', V2(760, 400), 'red', V(0, -0.1, 0));
  } else if (sh === 2) { // rolo compacta e a sub-base aparece
    const xr = lerp(-9, 9, sm(r(t, TS(2) + 0.2, E(2) + 0.1))); placeCar(roller, xr, -1.6, 0, SBT + 0.02);
    setSub(lerp(-26, 26, 0) * 0 + xr - 1.4); // atrás do rolo = sub-base
    st.shake = 0.12;
    K = camKeys([[TS(2), V(-2.5, 1.6, 8.5), V(-1, -0.6, -1.5), 42], [S(3) - 0.2, V(2.5, 1.2, 8.0), V(1.2, -0.7, -1.5), 42]], t);
    st.html += pill(t, wt(2, 'compacta') - 0.05, 'COMPACTA', V2(300, 420), 'orange', V(xr + 1.2, SBT + 0.4, -0.4));
    st.html += pill(t, wt(2, 'camada') - 0.05, 'CAMADA FIRME', V2(760, 1080), '', V(Math.min(xr - 2.5, 1), (SBT + SBB) / 2, 0));
  } else if (sh === 3) { // isso é a sub-base
    setSub(RX1);
    K = camKeys([[TS(3), V(1.0, 0.5, 6.5), V(0, -0.8, -1), 40], [S(4) - 0.2, V(0.4, 0.6, 6.0), V(0, -0.75, -1), 40]], t);
    st.html += pill(t, S(3) + 0.25, 'SUB-BASE', V2(540, 1060), 'green', V(0, -0.68, 0));
  } else if (sh === 4) { // retração: racha onde quiser
    const tp = TS(4); for (const p of [...platesA, ...platesB]) { const k = xB(t, tp, 0.35); p.scale.y = Math.max(0.01, k); p.position.y = -ST + ST * k / 2; }
    const te = wt(4, 'encolhe') - 0.1;
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1 : -1; const z = i < 2 ? -1.5 : -4.5; placeArrow(redArrows[i], V(sx * 4.2, 0.35, z), V(-sx, 0, 0), 1.4 * eo(r(t, te + i * 0.05, te + 0.5 + i * 0.05)) + 0.01); }
    const tr = wt(4, 'racha') - 0.15; cracks.children.forEach(m => { m.visible = t > tr + m.userData.k * 0.06 + m.userData.i * 0.03; });
    if (t > tr) st.shake = 0.35 * (1 - r(t, tr + 0.1, tr + 0.5));
    K = camKeys([[TS(4), V(0, 12.5, 6.0), V(0, -0.2, -3.6), 44], [S(5) - 0.2, V(0.5, 13.0, 5.6), V(0, -0.2, -3.6), 44]], t);
    st.html += pill(t, wt(4, 'racha') + 0.05, 'RACHOU!', V2(540, 360), 'red');
  } else if (sh === 5) { // serra em placas
    const ts0 = wt(5, 'serra') - 0.5; const u = sm(r(t, ts0, E(5) - 0.1)); const zs = lerp(0.8, -6.6, u);
    saw.visible = true; saw.position.set(0, 0.0, zs); saw.rotation.set(0, 0, 0); setDust(t, t > ts0 && u < 1, V(0, 0.1, zs - 0.3));
    grooves.children.forEach(g => { const x = g.userData.x; if (x === 0) { const L = cl((0.0 - zs) / (2 * LW)); g.visible = L > 0.01; g.scale.z = Math.max(0.01, L); g.position.z = -L * LW; }
      else if (x === 999) { g.visible = t > E(5) - 0.4; }
      else { const k = xB(t, ts0 + 0.5 + Math.abs(x) * 0.06, 0.3); g.visible = k > 0.02; g.scale.set(1, 1, Math.max(0.01, k)); } });
    K = camKeys([[TS(5), V(3.6, 3.6, 6.4), V(0, -0.1, -2.6), 42], [S(6) - 0.2, V(4.2, 4.6, 7.4), V(0, -0.1, -2.8), 42]], t);
    st.html += pill(t, wt(5, 'serra') + 0.05, 'SERRA', V2(800, 420), 'orange', V(0.3, 0.6, zs + 0.3));
  } else if (sh === 6) { // isso é uma junta serrada
    K = camKeys([[TS(6), V(4.2, 4.6, 7.4), V(0, -0.1, -2.8), 42], [S(7) - 0.2, V(2.6, 3.2, 6.0), V(0, -0.1, -2.2), 42]], t);
    st.html += pill(t, S(6) + 0.25, 'JUNTA SERRADA', V2(540, 380), 'green', V(0, 0.02, -1.2));
  } else if (sh === 7) { // degrau
    const td = wt(7, 'afunda') - 0.2; const d = 0.16 * eo(r(t, td, td + 0.6));
    for (const P of [platesA, platesB]) { P[6].position.y = -ST / 2 - d; P[5].position.y = -ST / 2 - d * 0.15; }
    for (let i = 0; i < 2; i++) placeArrow(redArrows[i], V(i ? 1.6 : -1.6, 1.4, -0.6), V(0, -1, 0), (i ? 0.8 : 0.35) * eo(r(t, td, td + 0.4)) + 0.01);
    K = camKeys([[TS(7), V(1.1, 0.9, 4.6), V(0, -0.25, -1), 40], [S(8) - 0.2, V(0.6, 0.6, 3.8), V(0, -0.25, -1), 40]], t);
    st.html += pill(t, wt(7, 'degrau') + 0.05, 'DEGRAU!', V2(780, 460), 'red', V(0.02, -0.1, 0));
  } else if (sh === 8 || sh === 9) { // barras de transferência
    const op = sh === 8 ? lerp(1, 0.3, r(t, S(8) + 0.1, S(8) + 0.6)) : 0.3; mats.slab.opacity = op; mats.slabB.opacity = op; mats.slab.depthWrite = op > 0.95; mats.slabB.depthWrite = op > 0.95;
    const tb = wt(8, 'barras') - 0.25; dowels.children.forEach((d, i) => { const k = sh === 8 ? eo(r(t, tb + (i % 10) * 0.03, tb + 0.5 + (i % 10) * 0.03)) : 1; d.scale.x = Math.max(0.01, k); });
    K = sh === 8 ? camKeys([[TS(8), V(0.6, 0.6, 3.8), V(0, -0.25, -1), 40], [S(9) - 0.2, V(1.6, 1.3, 4.0), V(0, -0.3, -1.3), 40]], t)
                 : camKeys([[TS(9), V(1.6, 1.3, 4.0), V(0, -0.3, -1.3), 40], [S(10) - 0.2, V(2.0, 1.5, 4.6), V(0, -0.3, -1.5), 40]], t);
    st.html += pill(t, wt(8, 'lisas') - 0.05, 'AÇO LISO', V2(300, 420), 'orange', V(0.3, -0.22, -0.35), S(9) - 0.1);
    st.html += pill(t, S(9) + 0.2, 'BARRA DE TRANSFERÊNCIA', V2(540, 400), 'green', V(0.3, -0.22, -0.35));
  } else if (sh === 10) { // faixas se afastam
    const ta = S(10) + 0.3; const g = 0.55 * eo(r(t, ta, ta + 0.8)); laneB.position.z = -g;
    placeArrow(redArrows[0], V(0, 0.3, -2.5), V(0, 0, 1), 1.0 * eo(r(t, ta, ta + 0.5)) + 0.01); placeArrow(redArrows[1], V(0, 0.3, -3.5 - g), V(0, 0, -1), 1.0 * eo(r(t, ta, ta + 0.5)) + 0.01);
    K = camKeys([[TS(10), V(0, 6.0, 3.2), V(0, -0.2, -3.0), 42], [S(11) - 0.2, V(0.3, 6.4, 3.0), V(0, -0.2, -3.1), 42]], t);
    st.html += pill(t, wt(10, 'afast') + 0.05, 'SEPAROU!', V2(780, 420), 'red', V(1.2, 0.05, -3.2 - g / 2));
  } else if (sh === 11 || sh === 12) { // barras de ligação
    const tb = TS(11) + 0.1; laneB.position.z = sh === 11 ? -0.55 * (1 - eo(r(t, tb, tb + 0.6))) : 0;
    const op = sh === 11 ? lerp(1, 0.3, r(t, tb + 0.4, tb + 0.9)) : 0.3; mats.slab.opacity = op; mats.slabB.opacity = op; mats.slab.depthWrite = op > 0.95; mats.slabB.depthWrite = op > 0.95;
    const tc = wt(11, 'costura') - 0.1; ties.children.forEach((d, i) => { const k = sh === 11 ? eo(r(t, tc + (i % 12) * 0.05, tc + 0.5 + (i % 12) * 0.05)) : 1; d.scale.z = Math.max(0.01, k); });
    K = camKeys([[TS(11), V(-1.8, 3.6, 2.6), V(0.3, -0.25, -3.0), 42], [S(13) - 0.2, V(-1.0, 3.0, 2.2), V(0.4, -0.25, -3.0), 42]], t);
    st.html += pill(t, S(12) + 0.2, 'BARRA DE LIGAÇÃO', V2(540, 380), 'green', V(0.5, -0.18, -3.0));
  } else if (sh === 13) { // chuva lava a terra
    scene.background = STORM; hemi.intensity = 0.8; sun.intensity = 1.1; setRain(t, true, 0);
    const tl = wt(13, 'lava') - 0.2;
    for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); placeArrow(blueArrows[i], V(0, 1.4 - k * 0.9, -0.5 - i * 1.4), V(0, -1, 0), 0.55); }
    setSpray(t, t > tl, 0);
    for (const P of [platesA, platesB]) P[6].position.y = -ST / 2 - 0.08 * eo(r(t, tl + 0.3, E(13)));
    K = camKeys([[TS(13), V(1.6, 1.8, 5.6), V(0, -0.2, -2.0), 42], [S(14) - 0.2, V(1.2, 1.5, 5.0), V(0, -0.25, -1.8), 42]], t);
    st.html += pill(t, wt(13, 'lava') + 0.05, 'LAVA A TERRA', V2(760, 420), 'red', V(0.2, 0.3, -1.5));
  } else if (sh === 14) { // selante
    scene.background = STORM; hemi.intensity = 0.8; sun.intensity = 1.1; setRain(t, true, 0);
    const tf = wt(14, 'fecha') - 0.1; seals.children.forEach(g => { const x = g.userData.x; const k = x === 999 ? eo(r(t, tf + 0.3, tf + 0.9)) : xB(t, tf + Math.abs(x) * 0.05, 0.3); g.visible = k > 0.02; if (x === 999) g.scale.x = Math.max(0.01, k); else g.scale.z = Math.max(0.01, k); });
    setSpray(t, t < tf + 0.1, 0);
    for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); placeArrow(blueArrows[i], V(0, 1.4 - k * 0.9, -0.5 - i * 1.4), V(0, -1, 0), 0.55, t < tf + 0.4); }
    K = camKeys([[TS(14), V(1.0, 2.4, 4.2), V(0, -0.1, -1.8), 42], [S(15) - 0.2, V(2.0, 3.0, 5.2), V(0, -0.1, -2.2), 42]], t);
    st.html += pill(t, wt(14, 'borracha') + 0.05, 'BORRACHA', V2(300, 430), 'orange', V(0, 0.05, -1.0), wt(14, 'selante') - 0.1);
    st.html += pill(t, wt(14, 'selante') - 0.05, 'SELANTE', V2(540, 400), 'green', V(0, 0.05, -1.0));
  } else if (sh === 15) { // liso e molhado = sabão
    const w = r(t, TS(15), TS(15) + 0.4); mats.slab.color.copy(SLABC).lerp(WETC, w); mats.slabB.color.copy(SLABC).lerp(WETC, w); mats.slab.roughness = mats.slabB.roughness = 0.2;
    scene.background = STORM; hemi.intensity = 0.9; sun.intensity = 1.3; setRain(t, true, 0);
    const ts = S(15) + 0.3; const u = r(t, ts, E(15) + 0.1); placeCar(carA, lerp(-6, 1.5, eo(u)), -1.5 + Math.sin(u * 3) * 0.25, 2.6 * sm(r(t, ts + 0.4, E(15))));
    K = camKeys([[TS(15), V(-1.0, 5.0, 10.5), V(-0.5, -0.1, -2.6), 42], [S(16) - 0.2, V(0.5, 5.2, 10.5), V(0.8, -0.1, -2.6), 42]], t);
    st.html += pill(t, wt(15, 'sabão') - 0.05, 'VIRA SABÃO!', V2(540, 400), 'red', V(carA.position.x, 0.9, carA.position.z));
  } else if (sh === 16) { // pente de aço: texturização
    const xc = lerp(-3.0, 3.5, r(t, TS(16), E(16) + 0.1)); comb.visible = true; comb.position.set(xc, 0, 0); setGrooves(xc - 0.1);
    K = [0, V(xc - 1.6, 3.4, 5.4), V(xc - 0.4, -0.1, -2.4), 42]; // segue o pente: ranhuras aparecem atrás dele
    st.html += pill(t, wt(16, 'pente') + 0.05, 'PENTE DE AÇO', V2(780, 380), 'orange', V(xc - 0.1, 0.1, -0.6), wt(16, 'texturiz') - 0.1);
    st.html += pill(t, wt(16, 'texturiz') - 0.05, 'TEXTURIZAÇÃO', V2(540, 400), 'green', V(xc - 1.2, 0.02, -1.0));
  } else if (sh === 17) { // 10 toneladas, 20 anos
    const tl = S(17) + 0.1; const h = 1.7 * sm(r(t, tl, tl + 1.3)); const P = platesA[6]; P.position.y = -ST / 2 + h;
    hook.visible = true; const hy = h + 2.4; hook.children.forEach(c => { if (c.userData.hk) c.position.set(2, hy, -1.5); else { const a = V(2 + c.userData.x * 0.6, h, -1.5 + (c.userData.z + 1.5) * 0.6 - 0), b = V(2, hy, -1.5); c.position.copy(a.clone().add(b).multiplyScalar(0.5)); c.scale.y = a.distanceTo(b); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); } });
    K = camKeys([[TS(17), V(4.0, 1.6, 8.5), V(2, 0.1, -1.5), 42], [S(18) - 0.2, V(3.0, 2.0, 7.5), V(2, 0.4, -1.5), 42]], t);
    st.html += tonCard(t, wt(17, 'pesa') - 0.3, E(17));
    st.html += big(t, wt(17, 'durar') - 0.1, 'DURA <span style="color:#FFD21F">20+ ANOS</span>', 1000, '#fff', 92);
  } else if (sh === 18 || sh === 19) { // tum tum tum
    const t0 = TS(18), t1 = E(19); const xc = lerp(-12, 12, (t - t0) / (t1 - t0)); placeCar(carA, xc, -1.5, 0);
    for (const x of JX) { const tt = t0 + (x - 0.8 + 12) / 24 * (t1 - t0); if (t > tt && t < tt + 0.45 && Math.abs(x) < 12) { const a = scr(V(x, 0.2, -0.3)); const k = back(r(t, tt, tt + 0.2)) * (1 - r(t, tt + 0.3, tt + 0.45)); st.html += `<div style="position:absolute;left:${a.x - 120}px;top:${a.y - 230}px;width:240px;text-align:center;font-weight:900;font-size:76px;color:#FFD21F;transform:scale(${k});text-shadow:0 0 3px #000,0 5px 0 #000">TUM</div>`; } }
    const bump = JX.some(x => { const d = xc + 0.8 - x; return d > 0 && d < 0.15; }) || JX.some(x => { const d = xc - 0.85 - x; return d > 0 && d < 0.15; }); carA.position.y = bump ? 0.03 : 0;
    K = sh === 18 ? [0, V(xc + 2.0, 2.6, 7.2), V(xc + 0.6, 0.0, -1.8), 42] : [0, V(6.0 + (t - S(19)) * 0.15, 3.6, 11.0), V(6.0, 0.1, -2.2), 42]; // frase 19: câmera parada mostrando 2 juntas
    st.html += pill(t, wt(18, 'defeito') - 0.05, 'NÃO É DEFEITO', V2(540, 360), 'green', null, E(18) + 0.1);
    if (sh === 19) { const jn = 8; st.html += pill(t, S(19) + 0.2, 'JUNTA', V2(800, 420), '', V(jn, 0.03, -0.3));
      st.html += dimH(t, wt(19, 'cada') - 0.1, V(jn - PL, 0.05, 0.2), V(jn, 0.05, 0.2), '≈ 5 m'); }
  } else if (sh === 20) { // faixas, placas, radar
    const tp = wt(20, 'pinta') - 0.15; paint.children.forEach(m => { if (m.userData.kind === 'edge') { m.scale.x = Math.max(0.01, eo(r(t, tp, tp + 1.0))); } else { const k = xB(t, tp + 0.2 + (m.userData.x + 24) * 0.02, 0.25); m.visible = k > 0.02; m.scale.set(Math.max(0.01, k), 1, 1); } });
    sign.scale.setScalar(Math.max(0.01, xB(t, wt(20, 'placas') - 0.15, 0.35))); radar.scale.setScalar(Math.max(0.01, xB(t, wt(20, 'radar') - 0.15, 0.35)));
    placeCar(carB, lerp(9, -7, r(t, TS(20), E(20) + 0.2)), -4.5, Math.PI);
    K = camKeys([[TS(20), V(-2.0, 3.6, 8.5), V(-0.5, 0.3, -3.5), 44], [wt(20, 'radar') - 0.4, V(1.8, 2.8, 6.0), V(3.6, 1.5, -7.5), 44], [S(21) - 0.2, V(2.2, 2.8, 5.6), V(4.0, 1.6, -7.8), 44]], t);
    st.html += pill(t, wt(20, 'faixas') + 0.05, 'FAIXAS', V2(300, 900), '', V(-1.5, 0.05, -LW - 0.2), wt(20, 'radar') - 0.5);
    st.html += pill(t, wt(20, 'placas') + 0.05, 'PLACA', V2(250, 420), '', V(1.2, 2.4, -7.0), wt(20, 'radar') - 0.5);
    st.html += pill(t, wt(20, 'radar') + 0.1, 'O RADAR ESCONDIDO', V2(540, 360), 'red', V(6.6, 2.6, -8.8));
  } else { // parabéns + CTA (+ tela final por cima)
    const u = r(t, TS(21), END);
    placeCar(carA, -14 + ((t - TS(21)) * 5.5) % 30, -1.5, 0); placeCar(carB, 14 - ((t - TS(21)) * 5.0) % 30, -4.5, Math.PI); placeCar(carC, -24 + ((t - TS(21)) * 5.5) % 30, -1.5, 0);
    K = [0, V(-3 + u * 6, 4.6 - u * 0.6, 12.5 - u * 1.5), V(0, 0.2, -3.5), 42];
    if (sh === 21) { st.html += big(t, wt(21, 'parab') - 0.05, 'PARABÉNS!', 300, '#FFD21F', 120); st.html += big(t, wt(21, 'constr') - 0.05, 'VOCÊ CONSTRUIU UMA<br>RODOVIA DE CONCRETO', 450, '#fff', 74); st.html += confetti(t, wt(21, 'parab')); }
    if (sh >= 22) st.html += ctaCard(t);
  }
  st.cam = K; return st;
}
function dimH(t, t0, a, b, txt) { if (t < t0) return ''; const u = eo(r(t, t0, t0 + 0.5)); const A = scr(a), B0 = scr(b); const B = { x: lerp(A.x, B0.x, u), y: lerp(A.y, B0.y, u) };
  return `<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}"><g stroke="#ffb020" stroke-width="7" stroke-linecap="round"><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/><line x1="${A.x}" y1="${A.y - 24}" x2="${A.x}" y2="${A.y + 24}"/><line x1="${B.x}" y1="${B.y - 24}" x2="${B.x}" y2="${B.y + 24}"/></g></svg>
  <div class="pill" style="left:${(A.x + B.x) / 2}px;top:${(A.y + B.y) / 2 - 70}px;border-color:#ffb020;font-size:52px;transform:translate(-50%,-50%) scale(${back(r(t, t0 + 0.2, t0 + 0.5))})">${txt}</div>`; }
function tonCard(t, t0, t1) { if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0, 0.4) * (1 - r(t, t1, t1 + 0.25));
  return `<div class="card" style="left:110px;top:200px;width:860px;padding:26px 30px 24px;text-align:center;transform-origin:50% 0;transform:scale(${k})">
   <div style="font-weight:800;font-size:40px">1 PLACA DE CONCRETO</div><div style="font-weight:900;font-size:96px;color:#FFD21F;line-height:1.1">≈ 10 TONELADAS</div></div>`; }
function ctaCard(t) { const t0 = TS(22); if (t < t0 || t > window.F_END / FPS + 0.2) return '';
  const items = [['curte', '#ff4d6d', '<path d="M50 84 L18 52 Q6 38 16 24 Q28 10 44 22 L50 28 L56 22 Q72 10 84 24 Q94 38 82 52 Z" fill="#ff4d6d"/>', 'CURTE'],
    ['salva', '#FFD21F', '<path d="M26 12 H74 V88 L50 70 L26 88 Z" fill="#FFD21F"/>', 'SALVA'],
    ['manda', '#4aa3ff', '<path d="M10 46 L90 12 L62 88 L48 56 Z" fill="#4aa3ff"/>', 'MANDA'],
    ['comenta', '#3dd17a', '<path d="M14 18 H86 V66 H46 L24 86 V66 H14 Z" fill="#3dd17a"/>', 'COMENTA']];
  let h = '<div style="position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;gap:26px">';
  for (const [w, c, svg, lab] of items) { const k = back(r(t, wt(22, w) - 0.15, wt(22, w) + 0.15));
    h += `<div style="width:220px;text-align:center;transform:scale(${k});opacity:${cl(k)}"><div style="width:190px;height:190px;margin:0 auto;border-radius:40px;background:rgba(20,23,29,.92);border:5px solid ${c};display:flex;align-items:center;justify-content:center"><svg width="120" height="120" viewBox="0 0 100 100">${svg}</svg></div><div style="font-weight:900;font-size:40px;color:#fff;margin-top:10px;text-shadow:0 3px 0 #000">${lab}</div></div>`; }
  return h + '</div>'; }
function confetti(t, t0) { if (t < t0) return ''; let h = ''; const cols = ['#FFD21F', '#ff5a5a', '#3dd17a', '#4aa3ff', '#ff9a1f', '#fff'];
  for (let i = 0; i < 70; i++) { const u = t - t0; const x = (i * 157) % 1080 + Math.sin(u * 2 + i) * 30; const y = -40 + u * (260 + (i * 37) % 200) - 60 * ((i * 13) % 5); if (y < -40 || y > 1950) continue;
    h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${12 + i % 3 * 4}px;height:${22 - i % 3 * 4}px;background:${cols[i % 6]};transform:rotate(${u * 300 + i * 40}deg)"></div>`; }
  return h; }
// ---------- avatar no canto ----------
function avatarCorner(f) {
  const out = cl(1 - (f - window.F_END) / 8); if (out <= 0) return ''; const inS = springSim(f - 4, 12, 140); const m = mouthAt(f);
  return `<div style="position:absolute;left:50px;top:1515px;width:270px;height:270px;opacity:${out};transform:translateY(${-m * 5}px) rotate(${Math.sin(f / 23) * 2 + m * 1.5}deg) scale(${inS * (0.9 + 0.1 * out)})">
   <div style="width:270px;height:270px;box-sizing:border-box;border-radius:135px;overflow:hidden;background:#30343A;border:9px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${window.AV.svg(m, window.AV.blinkAt(f), Math.sin(f / 70) * 0.6)}</div></div>`;
}
// ---------- quadro ----------
window.renderFrame = f => {
  const t = f / FPS; const st = world(t); const K = st.cam;
  let p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.06; p.add(V(noise(t * 2.5) * a, noise(t * 2.8, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.04, Math.sin(t * 0.9) * 0.03, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.setViewOffset(W, H, 0, 260, W, H); // centro do quadro sobe 260 px (fica acima da legenda)
  cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -3); sun.position.set(5, 11, 7.5);
  R.render(scene, cam);
  canvas.style.filter = st.blur ? `blur(${st.blur}px)` : 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`
    + (st.red ? `<div style="position:absolute;inset:0;background:#c41010;opacity:${st.red};mix-blend-mode:multiply"></div>` : '')
    + (st.dark ? `<div style="position:absolute;inset:0;background:#000;opacity:${st.dark}"></div>` : '');
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 0.4, dist = 12) => {
  const t = S(21) + 0.3; world(t);
  placeCar(carA, 0.6, -1.5, 0); placeCar(carB, -4.5, -4.5, Math.PI); carC.visible = false;
  cam.clearViewOffset(); cam.position.set(-3.0, 4.2, dist); cam.fov = 42; cam.up.set(0, 1, 0); cam.lookAt(V(0.3, cy, -3.5)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -3); sun.position.set(5, 11, 9); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 34%,rgba(14,22,34,0) 52%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:290px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:36px;letter-spacing:5px;padding:12px 30px;border-radius:40px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:300px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:44px">#02</div>
   <div style="position:absolute;left:110px;right:80px;top:390px;font-family:InterD;font-weight:900;font-size:108px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Por que a<br>estrada de<br><span style="color:#8fd0ff">concreto</span> faz<br><span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">tum-tum</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

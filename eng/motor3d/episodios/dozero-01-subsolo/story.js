// ================= SUBSOLO: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const T = { A: 0, B: S(1) - 0.1, C: S(2) - 0.1, D: S(4) - 0.1, E: S(5) - 0.1, F: S(7) - 0.1, G: S(9) - 0.1, H: S(10) - 0.1, I: S(12) - 0.1, J: S(13) - 0.1, K: S(14) - 0.1, L: S(15) - 0.1, M: S(17) - 0.1, N: S(19) - 0.1, O: S(20) - 0.1 };
const shotOf = t => { let k = 'A'; for (const [n, v] of Object.entries(T)) if (t >= v) k = n; return k; };
const CAM_B = [V(0.4, -1.5, 14.5), V(0, -2.2, 0), 40], CAM_H = [V(0.6, 0.4, 19.5), V(0, -0.8, 0), 40];
const SKYC = new THREE.Color('#cfe3ef'), STORM = new THREE.Color('#4a5560');
function placeP(P, x, y, z, ry = 0) { P.g.position.set(x, y, z); P.g.rotation.set(0, ry, 0); P.g.visible = true; }
const xB = (t, a, b) => back(r(t, a, a + b));
function world(t) {
  const sh = shotOf(t); const st = { cam: null, roll: 0, blur: 0, red: 0, dark: 0, flash: 0, vig: 0.3, shake: 0, html: '' };
  const after = k => t >= T[k];
  // ---- estado base ----
  you.g.visible = false; shovel.visible = false; house.visible = false; building.visible = false; carN.visible = false; gen.visible = false;
  chunksG.visible = false; fillBox.visible = false; setRain(t, false); setJet(t, false); lamps.visible = false; lampLight.intensity = 0;
  [...pushArrows, ...loadArrows, ...flowArrows].forEach(a => a.visible = false);
  scene.background = SKYC; hemi.intensity = 1.25; sun.intensity = 2.4;
  struct.visible = after('C'); footings.visible = after('C'); walls.visible = after('D'); slab.visible = after('D');
  rebar.visible = sh === 'F'; crack.visible = sh === 'E' && t > S(6); drain.visible = after('H'); sump.visible = after('J'); outPipe.visible = after('J');
  stairs.visible = after('N'); notchFill.visible = !after('J') || (sh === 'J' && t < wt(13, 'poço') - 0.2); setManta(after('L') ? (sh === 'L' ? sm(r(t, wt(15, 'cobre'), wt(15, 'cobre') + 1.6)) : 1) : 0);
  mats.wallT.opacity = 1; mats.wallT.transparent = true; mats.wallT.color.set('#bdb8ae'); mats.wallT.depthWrite = true;
  waterTable(-12, 0); setWaterIn(0); sumpWater.visible = false; floatBall.position.y = -3.15; pump.position.x = 1.15;
  footings.children.forEach(m => { m.scale.y = 1; m.position.y = -2.75; });
  walls.children.forEach(m => { m.scale.y = 1; m.position.y = -2.6 + WH / 2; });
  const wtab = after('G') ? (sh === 'G' ? lerp(-12, -1.4, sm(r(t, S(9) + 0.3, S(9) + 2.2))) : -1.4) : -12;
  if (after('G')) waterTable(wtab, 0.5);
  let K;
  if (sh === 'A') { // cava o buraco, casa em cima
    const tc = wt(0, 'constr'); const dig = sm(r(t, 0.2, tc - 0.2)); const top = lerp(-0.02, PB, dig);
    fillBox.visible = top > PB + 0.02; fillBox.scale.y = Math.max(0.01, top - PB); fillBox.position.y = PB + (top - PB) / 2;
    if (t < tc + 0.1) { placeP(you, 0.6, top, -1.6, -0.5); const s = Math.sin(t * 7); pose(you, { lean: 0.45 + s * 0.2, armL: [-1.2 + s * 0.5, 0.2], armR: [-1.0 + s * 0.5, -0.2], head: [0.3, 0, 0], legL: -0.2 }); if (shovel.parent !== you.armR) you.armR.add(shovel); shovel.position.set(0, -0.6, 0.15); shovel.rotation.set(1.2, 0, 0); shovel.visible = true; }
    house.visible = t > tc - 0.05; const hu = r(t, tc - 0.05, tc + 0.45); house.position.set(0, lerp(7, 0, ei(hu)), 0); house.rotation.set(0, 0, 0);
    if (t > tc + 0.4) st.shake = 1 - r(t, tc + 0.42, tc + 0.8);
    K = camKeys([[0, V(2.4, 1.6, 6.2), V(0.3, -0.4, -1.6), 42], [tc - 0.4, V(1.2, 0.4, 13), V(0, -1.2, -1), 40], [T.B, ...CAM_H]], t);
    st.html += pill(t, wt(0, 'subsolo'), 'SUBSOLO?', V2(800, 760), '', V(0.6, -1.4, -1.5));
  } else if (sh === 'B') { // afunda e desmorona
    house.visible = true; const u = sm(r(t, S(1) + 0.4, S(1) + 2.0)); house.position.set(0, -1.25 * u, 0); house.rotation.set(0.04 * u, 0, 0.1 * u);
    chunksG.visible = true; chunksG.children.forEach(m => { const d = m.userData; const k = r(t, wt(1, 'desmor') - 0.3 + d.d, wt(1, 'desmor') + 0.4 + d.d); const y = lerp(d.y0, PB + 0.12, ei(k) * d.sp > 1 ? 1 : ei(k)); m.position.set(d.sx * lerp(PW + 0.05, PW - 0.4 - d.d * 0.6, k), y, d.z); m.visible = k > 0; m.rotation.set(t * 3 + d.d * 9, t * 2, 0); });
    st.shake = 0.6 * r(t, S(1) + 0.4, S(1) + 0.7) * (1 - r(t, S(1) + 1.8, S(1) + 2.3)) + 0.8 * r(t, wt(1, 'desmor'), wt(1, 'desmor') + 0.2) * (1 - r(t, wt(1, 'desmor') + 0.6, wt(1, 'desmor') + 1.1));
    K = camKeys([[T.B, ...CAM_H], [T.C, V(0.9, -0.2, 17.5), V(0, -1.1, 0), 40]], t);
    st.html += pill(t, S(1) + 0.8, 'AFUNDOU!', V2(780, 420), 'red', V(1.5, 0.8, -1.5));
    st.red = 0.18 * r(t, S(1) + 0.6, S(1) + 1.2);
  } else if (sh === 'C') { // sapata corrida
    const tf = wt(2, 'faixa') - 0.1; footings.children.forEach((m, i) => { const k = back(r(t, tf + i * 0.15, tf + 0.5 + i * 0.15)); m.scale.y = Math.max(0.01, k); m.position.y = -2.9 + 0.15 * k; });
    const te = wt(2, 'espalh') - 0.2;
    for (const [j, sx] of [[0, -1], [1, 1]]) { placeArrow(loadArrows[j * 3], V(sx * WX, 0.9, -0.2), V(0, -1, 0), 2.4 * eo(r(t, tf + 0.6, tf + 1.2)) + 0.01);
      placeArrow(loadArrows[j * 3 + 1], V(sx * WX, -3.0, -0.2), V(-0.7, -1, 0), 1.1 * eo(r(t, te, te + 0.5)) + 0.01); placeArrow(loadArrows[j * 3 + 2], V(sx * WX, -3.0, -0.2), V(0.7, -1, 0), 1.1 * eo(r(t, te, te + 0.5)) + 0.01); }
    K = camKeys([[T.C, ...CAM_B], [T.D, V(0.2, -1.8, 13.5), V(0, -2.3, 0), 40]], t);
    st.flash = 0;
    st.html += pill(t, S(3) + 0.05, 'SAPATA CORRIDA', V2(540, 1120), 'green', V(-WX, -2.75, -0.1));
  } else if (sh === 'D') { // paredes sobem
    walls.children.forEach((m, i) => { const k = eo(r(t, S(4) + 0.4 + i * 0.12, S(4) + 1.5 + i * 0.12)); m.scale.y = Math.max(0.01, k); m.position.y = -2.6 + WH * k / 2; });
    slab.visible = t > S(4) + 1.2;
    K = camKeys([[T.D, V(0.2, -1.8, 13.5), V(0, -2.3, 0), 40], [T.E, V(-1.2, -1.4, 13.6), V(0, -2.0, 0), 40]], t);
    placeP(you, -0.6, SLAB, -1.8, 0.4); pose(you, { armL: [-2.6, 0.3], armR: [-0.3, -0.1] }); idle(you, t);
  } else if (sh === 'E') { // empuxo + racha
    const ys = [-0.5, -1.2, -1.9, -2.4];
    ys.forEach((y, i) => { for (const [j, sx] of [[0, -1], [1, 1]]) { const len = (0.7 + i * 0.32) * eo(r(t, S(5) + 0.6 + i * 0.12, S(5) + 1.1 + i * 0.12)); placeArrow(pushArrows[i * 2 + j], V(sx * (WX + 0.25 + len + 0.3), y, 0.1), V(-sx, 0, 0), len + 0.01); } });
    const cr = r(t, S(6) + 0.55, S(6) + 1.0); crack.children.forEach(m => m.visible = m.userData.i / 9 < cr);
    if (t > S(6) + 0.5) { st.red = 0.2 * r(t, S(6) + 0.5, S(6) + 0.8); st.shake = 0.7 * (1 - r(t, S(6) + 0.6, S(6) + 1.0)) * (t > S(6) + 0.55 ? 1 : 0); }
    K = camKeys([[T.E, V(-1.2, -1.4, 13.6), V(0, -2.0, 0), 40], [S(6) + 0.3, V(0.3, -1.5, 12.5), V(0, -1.6, -1), 40], [T.F, V(0.2, -1.5, 11.5), V(0, -1.4, -1.5), 40]], t);
    st.html += carsCard(t, wt(5, '15') - 0.3, S(6) + 0.3);
    st.html += pill(t, S(6) + 0.75, 'RACHOU!', V2(300, 520), 'red', V(-0.2, -1.0, PZ + 0.5));
  } else if (sh === 'F') { // concreto armado
    mats.wallT.opacity = lerp(1, 0.28, r(t, S(7) + 0.3, S(7) + 0.8)); mats.wallT.depthWrite = false;
    const g = eo(r(t, wt(7, 'barras'), wt(7, 'barras') + 1.0)); rebar.children.forEach((m, i) => { m.scale.y = Math.max(0.01, g); });
    K = camKeys([[T.F, V(0.2, -1.5, 11.5), V(0, -1.4, -1.5), 40], [T.G, V(2.2, -1.2, 10.5), V(0.4, -1.6, -1.3), 40]], t);
    st.html += pill(t, S(8) + 0.05, 'CONCRETO ARMADO', V2(540, 380), 'green', V(-WX, -0.6, -0.6));
  } else if (sh === 'G') { // a água
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const y = -1.8 - (i >> 1) * 0.35; const len = 0.9 * eo(r(t, wt(9, 'água') - 0.3 + i * 0.06, wt(9, 'água') + 0.2 + i * 0.06)); placeArrow(flowArrows[i], V(sx * 3.6, y, 0.12), V(-sx, 0.15, 0), len + 0.01); }
    K = camKeys([[T.G, ...CAM_B], [T.H, V(0.5, -2.2, 14.8), V(0, -2.6, 0), 40]], t);
    st.html += big(t, wt(9, 'água') - 0.1, 'O INIMIGO<br>É A ÁGUA', 360, '#7cc4ff', 110);
  } else if (sh === 'H') { // dreno
    const td = wt(10, 'cano') - 0.15; drain.scale.setScalar(1); drain.children.forEach((m, i) => { m.visible = t > td + (i % 40) * 0.012; });
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const k = ((t * 0.8 + i * 0.17) % 1); placeArrow(flowArrows[i], V(sx * (2.9 - k * 0.6), -1.4 - k * 1.0, 0.12), V(-sx * 0.55, -1, 0), 0.55); }
    K = camKeys([[T.H, V(0.5, -2.2, 14.8), V(0, -2.6, 0), 40], [S(11) - 0.4, V(3.0, -2.2, 6.6), V(1.8, -2.7, -0.4), 40], [T.I, V(3.0, -2.3, 6.2), V(1.8, -2.7, -0.4), 40]], t);
    st.html += pill(t, S(11) + 0.05, 'DRENO', V2(330, 600), 'green', V(1.93, -2.72, -0.05));
  } else if (sh === 'I') { // água sem saída
    setWaterIn(0.42 * sm(r(t, S(12) + 0.4, E(12))));
    for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); placeArrow(flowArrows[i], V((i % 2 ? 1 : -1) * 1.9, -2.7, -0.5 - i * 0.6), V(i % 2 ? -1 : 1, 0.6, 0), 0.4 + k * 0.2); }
    K = camKeys([[T.I, V(0.3, -1.7, 11.5), V(0, -2.4, -1), 40], [T.J, V(0.6, -1.9, 10.5), V(0.3, -2.5, -1), 40]], t);
    st.html += pill(t, wt(12, 'água') + 0.2, 'PRA ONDE VAI?', V2(540, 420), 'orange');
  } else if (sh === 'J') { // poço + bomba com boia
    const ts = wt(13, 'poço') - 0.2; sump.visible = t > ts; sump.scale.setScalar(Math.max(0.01, xB(t, ts, 0.35))); sump.position.set(1.15 * (1 - sump.scale.x), -3.0 * (1 - sump.scale.y), -0.35 * (1 - sump.scale.z));
    const on = t > wt(13, 'bomba'); const lvl = on ? 0.42 * (1 - sm(r(t, wt(13, 'joga'), E(13)))) : 0.42; setWaterIn(lvl);
    sumpWater.visible = t > ts + 0.3; sumpWater.scale.y = 0.45; sumpWater.position.y = -3.45 + 0.225;
    floatBall.position.y = lerp(-3.25, -3.0, on ? 1 : r(t, ts + 0.3, ts + 0.8)); pump.position.x = on ? 1.15 + Math.sin(t * 60) * 0.006 : 1.15;
    setJet(t, on && t > wt(13, 'joga'));
    K = camKeys([[T.J, V(2.6, -2.2, 6.5), V(1.1, -2.9, -0.4), 40], [wt(13, 'joga') - 0.2, V(2.6, -2.0, 6.8), V(1.2, -2.8, -0.4), 40], [T.K, V(2.4, -0.6, 9.5), V(1.0, -1.2, -0.4), 40]], t);
    st.html += pill(t, wt(13, 'bomba') + 0.05, 'BOMBA', V2(300, 1060), '', V(1.15, -3.3, -0.2));
    st.html += pill(t, wt(13, 'boia') + 0.05, 'BOIA', V2(820, 1080), 'orange', V(1.28, -3.0, -0.25));
  } else if (sh === 'K') { // tempestade, gerador
    house.visible = true; house.position.set(0, 0, 0); house.rotation.set(0, 0, 0);
    scene.background = STORM; hemi.intensity = 0.6; sun.intensity = 0.7; setRain(t, true);
    const tl = wt(14, 'tempest'), tg = wt(14, 'gerador'); const lightning = t > tl && t < tl + 0.12 || t > tl + 0.25 && t < tl + 0.32;
    st.flash = (t > tl && t < tl + 0.2) ? 0.22 * (1 - r(t, tl, tl + 0.2)) : 0; const off = t > wt(14, 'acaba') && t < tg + 0.1; st.dark = off ? 0.35 : 0.1;
    gen.visible = t > tg - 0.15; gen.scale.setScalar(Math.max(0.01, xB(t, tg - 0.15, 0.35)));
    sumpWater.visible = true; sumpWater.scale.y = 0.45; sumpWater.position.y = -3.45 + 0.225;
    setWaterIn(off ? 0.3 * r(t, wt(14, 'acaba'), tg) : (t > tg ? 0.3 * (1 - r(t, tg + 0.3, E(14))) : 0)); pump.position.x = !off && t > tg ? 1.15 + Math.sin(t * 60) * 0.006 : 1.15; setJet(t, t > tg + 0.3);
    K = camKeys([[T.K, ...CAM_H], [T.L, V(-0.6, 0.2, 18.5), V(-0.4, -0.9, 0), 40]], t);
    st.html += pill(t, tg + 0.05, 'GERADOR', V2(250, 640), 'green', V(-3.0, 0.7, -1.5));
    if (off) st.html += pill(t, wt(14, 'acaba') + 0.1, 'SEM LUZ', V2(760, 560), 'red', null, tg);
  } else if (sh === 'L') { // esponja + manta
    const te = wt(15, 'esponja'); const wet = r(t, te - 0.2, te + 0.4) * (1 - r(t, wt(15, 'cobre'), wt(15, 'cobre') + 1.2));
    mats.wallT.color.set('#bdb8ae').lerp(new THREE.Color('#5d7f9e'), wet * 0.7);
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const k = ((t * 0.9 + i * 0.2) % 1); placeArrow(flowArrows[i], V(sx * (3.3 - k * 0.9), -0.8 - (i >> 1) * 0.6, 0.12), V(-sx, 0, 0), 0.45, wet > 0.05); }
    K = camKeys([[T.L, V(0.3, -1.5, 12.5), V(0, -1.6, -1), 40], [wt(15, 'cobre'), V(-2.2, -1.3, 10.5), V(-0.6, -1.5, -1.2), 40], [T.M, V(-2.6, -1.2, 10.0), V(-0.8, -1.5, -1.2), 40]], t);
    st.html += pill(t, wt(15, 'manta') + 0.05, 'MANTA ASFÁLTICA', V2(330, 520), '', V(-WX - 0.13, -1.2, -0.05), S(16) - 0.1);
    st.html += big(t, S(16) + 0.05, 'IMPERMEABILIZAÇÃO', 330, '#7dffa8', 84);
  } else if (sh === 'M') { // bomba que liga sozinha no prédio
    building.visible = true; carN.visible = true; carN.position.set(0.25, SLAB + 0.02, -1.75); carN.rotation.set(0, 0, 0); carN.scale.setScalar(0.92);
    lamps.visible = true; lampLight.intensity = 1.2; sumpWater.visible = true; sumpWater.scale.y = 0.45; sumpWater.position.y = -3.45 + 0.225;
    const run = Math.floor(t * 2) % 3 !== 2 || t > S(18); pump.position.x = 1.15 + Math.sin(t * 60) * 0.006; setJet(t, true);
    for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1; const k = ((t * 0.8 + i * 0.17) % 1); placeArrow(flowArrows[i], V(sx * (2.9 - k * 0.6), -1.6 - k * 0.9, 0.12), V(-sx * 0.55, -1, 0), 0.5, t > S(18) - 0.1); }
    K = camKeys([[T.M, V(0.4, 1.5, 24), V(0, 0.6, 0), 40], [S(17) + 1.8, V(0.5, -0.6, 15.5), V(0.2, -1.6, 0), 40], [T.N, V(1.6, -1.6, 9.5), V(0.8, -2.4, -0.5), 40]], t);
    st.html += pill(t, S(17) + 0.5, 'GARAGEM DO PRÉDIO', V2(540, 300), '');
    st.html += vrrr(t, wt(17, 'liga'), V(1.15, -3.0, -0.3));
    st.html += pill(t, wt(17, 'defeito') - 0.05, 'NÃO É DEFEITO', V2(760, 560), 'green');
    st.html += pill(t, S(18) + 0.4, 'ÁGUA DO CHÃO', V2(300, 820), '', V(-2.6, -2.0, 0.1));
  } else if (sh === 'N') { // escada, lâmpadas, vizinho
    house.visible = true; house.position.set(0, 0, 0); house.rotation.set(0, 0, 0);
    stairs.children.forEach((m, i) => { const k = xB(t, wt(19, 'escada') - 0.1 + i * 0.05, 0.3); m.visible = k > 0.02; m.scale.set(1, Math.max(0.01, k), 1); });
    const tl = wt(19, 'lâmp'); lamps.visible = t > tl; lampLight.intensity = t > tl ? 1.4 : 0;
    const tv = wt(19, 'vaga') - 0.1; carN.visible = t > tv; const cu = eo(r(t, tv, tv + 0.9)); carN.position.set(0.55, SLAB + 0.02, lerp(4.5, -1.75, cu)); carN.rotation.set(0, 0, 0); carN.scale.setScalar(0.85);
    K = camKeys([[T.N, V(0.5, -1.4, 12.5), V(0, -1.8, -1), 40], [T.O, V(0.9, -1.1, 13.2), V(0, -1.6, -1), 40]], t);
    st.html += pill(t, wt(19, 'escada') + 0.1, 'ESCADA', V2(260, 470), '', V(-0.5, -1.4, PZ + 0.9));
    st.html += pill(t, wt(19, 'vizinho') - 0.05, 'O CARRO DO VIZINHO', V2(720, 420), 'red', V(0.55, -1.6, -1.0));
  } else if (sh === 'O') { // parabéns
    house.visible = true; house.position.set(0, 0, 0); house.rotation.set(0, 0, 0); carN.visible = true; carN.position.set(0.55, SLAB + 0.02, -1.75); carN.scale.setScalar(0.85);
    lamps.visible = true; lampLight.intensity = 1.4; stairs.visible = true;
    const u = r(t, T.O, END); K = [0, V(Math.sin(u * 1.2) * 3, 0.6, 19.5 - u * 2), V(0, -0.8, -1), 40];
    st.html += big(t, wt(20, 'parab') - 0.05, 'PARABÉNS!', 230, '#FFD21F', 120);
    st.html += big(t, wt(20, 'constr') - 0.05, 'VOCÊ CONSTRUIU<br>UM SUBSOLO', 380, '#fff', 84);
    st.html += confetti(t, wt(20, 'parab'));
  }
  st.cam = K; return st;
}
function V2(x, y) { return { x, y }; }
function carsCard(t, t0, t1) { if (t < t0 || t > t1 + 0.25) return ''; const k = pop(t, t0, 0.4) * (1 - r(t, t1, t1 + 0.25));
  let ic = ''; for (let i = 0; i < 15; i++) { const s = back(r(t, t0 + 0.2 + i * 0.05, t0 + 0.45 + i * 0.05)); ic += `<svg width="96" height="56" viewBox="0 0 96 56" style="transform:scale(${s})"><path d="M10 34 L18 18 Q22 12 30 12 L62 12 Q70 12 76 18 L86 30 Q92 32 92 38 L92 44 L4 44 L4 38 Q4 34 10 34Z" fill="#ff7a1a"/><circle cx="24" cy="44" r="8" fill="#222"/><circle cx="72" cy="44" r="8" fill="#222"/><rect x="26" y="17" width="16" height="12" rx="2" fill="#bfe0ff"/><rect x="47" y="17" width="16" height="12" rx="2" fill="#bfe0ff"/></svg>`; }
  return `<div class="card" style="left:110px;top:150px;width:860px;padding:26px 30px 24px;text-align:center;transform-origin:50% 0;transform:scale(${k})">
   <div style="font-weight:800;font-size:38px;margin-bottom:12px">EMPURRÃO DA TERRA MOLHADA <span style="color:#ff7a1a">≈ 15 CARROS</span></div>
   <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px 10px">${ic}</div></div>`; }
function vrrr(t, t0, p) { if (t < t0) return ''; const a = scr(p); const k = back(r(t, t0, t0 + 0.3)); const w = Math.sin(t * 30) * 4;
  return `<div style="position:absolute;left:${a.x + 60}px;top:${a.y - 150}px;font-weight:900;font-size:58px;color:#FFD21F;transform:scale(${k}) rotate(${-8 + w * 0.4}deg);text-shadow:0 0 3px #000,0 4px 0 #000">VRRRR</div>`; }
function confetti(t, t0) { if (t < t0) return ''; let h = ''; const cols = ['#FFD21F', '#ff5a5a', '#3dd17a', '#4aa3ff', '#ff9a1f', '#fff'];
  for (let i = 0; i < 70; i++) { const u = t - t0; const x = (i * 157) % 1080 + Math.sin(u * 2 + i) * 30; const y = -40 + u * (260 + (i * 37) % 200) - 60 * ((i * 13) % 5); if (y < -40 || y > 1950) continue;
    h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${12 + i % 3 * 4}px;height:${22 - i % 3 * 4}px;background:${cols[i % 6]};transform:rotate(${u * 300 + i * 40}deg)"></div>`; }
  return h; }
// ---------- avatar no canto (igual ao vídeo de pavimentação) ----------
function avatarCorner(f) {
  const out = cl(1 - (f - window.F_END) / 8); if (out <= 0) return ''; const inS = springSim(f - 4, 12, 140); const m = mouthAt(f);
  return `<div style="position:absolute;left:50px;top:1515px;width:270px;height:270px;opacity:${out};transform:translateY(${-m * 5}px) rotate(${Math.sin(f / 23) * 2 + m * 1.5}deg) scale(${inS * (0.9 + 0.1 * out)})">
   <div style="width:270px;height:270px;box-sizing:border-box;border-radius:135px;overflow:hidden;background:#30343A;border:9px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${window.AV.svg(m, window.AV.blinkAt(f), Math.sin(f / 70) * 0.6)}</div></div>`;
}
// ---------- quadro ----------
window.renderFrame = f => {
  const t = f / FPS; const st = world(t); const K = st.cam;
  let p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.08; p.add(V(noise(t * 30) * a, noise(t * 37, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.04, Math.sin(t * 0.9) * 0.03, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -1.5); sun.position.set(5, 11, 7.5);
  R.render(scene, cam);
  canvas.style.filter = st.blur ? `blur(${st.blur}px)` : 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`
    + (st.red ? `<div style="position:absolute;inset:0;background:#c41010;opacity:${st.red};mix-blend-mode:multiply"></div>` : '')
    + (st.dark ? `<div style="position:absolute;inset:0;background:#000;opacity:${st.dark}"></div>` : '')
    + (st.flash ? `<div style="position:absolute;inset:0;background:#fff;opacity:${st.flash}"></div>` : '');
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 3.2, dist = 21) => {
  const t = S(20) + 0.3; world(t);
  cam.position.set(1.2, cy - 0.6, dist); cam.fov = 40; cam.up.set(0, 1, 0); cam.lookAt(V(0, cy, -1)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, 0); sun.position.set(5, 11, 9); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 34%,rgba(14,22,34,0) 52%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:290px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:36px;letter-spacing:5px;padding:12px 30px;border-radius:40px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:300px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:44px">#01</div>
   <div style="position:absolute;left:110px;right:80px;top:390px;font-family:InterD;font-weight:900;font-size:112px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Como um<br><span style="color:#8fd0ff">buraco</span> vira<br>um <span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">subsolo</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

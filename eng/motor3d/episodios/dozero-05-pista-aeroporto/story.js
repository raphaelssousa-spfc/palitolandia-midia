// ================= PISTA DE AEROPORTO: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const NP = TM.phrases.length;
const shotOf = t => { if (t < S(0) - 0.1) return -1; let k = 0; for (let i = 1; i < NP; i++) if (t >= S(i) - 0.1) k = i; return k; };
const TS = i => S(i) - 0.1;
function V2(x, y) { return { x, y }; }
// ---------- estados ----------
function hideMachines() { [plane, paver, roller, exc, truck, groover, pipa].forEach(m => m.g.visible = false); worker.g.visible = false; worker2.g.visible = false; }
function base(t) {
  scene.fog.far = 140; scene.fog.near = 50;
  fofa.visible = false; fofa.scale.y = 1; thin.forEach(g => { g.visible = false; g.position.y = 0; g.rotation.set(0, 0, 0); });
  ['subleito', 'subbase', 'base', 'capa'].forEach(k => { layerTo(k, 0); LAY[k].position.y = LAY[k].userData.y0 ??= LAY[k].position.y; });
  chan.forEach(c => { c.visible = true; c.scale.y = 1; }); chanFill.forEach(f => { f.visible = false; f.scale.y = 1; }); chanWater.forEach(w => { w.visible = true; w.scale.y = 1; });
  marks.visible = true; rubber.visible = true; rubberPieces.forEach(m => m.material.opacity = 0.7); grooves.forEach(g => g.visible = true); far.visible = true;
  sheet.material.opacity = 0; wet.material.opacity = 0; setRain(t, 0);
  hideMachines(); smoke.update(0); dust.update(0); spray.update(0); [...blueA, ...redA].forEach(a => a.visible = false);
  plane.g.rotation.set(0, -Math.PI / 2, 0); plane.body.rotation.set(0, 0, 0); plane.set({ trem: 1 });
}
function raw() { ['subleito', 'subbase', 'base', 'capa'].forEach(k => LAY[k].visible = false); chan.forEach(c => c.visible = false); chanWater.forEach(w => w.visible = false); chanFill.forEach(f => f.visible = true);
  marks.visible = false; rubber.visible = false; grooves.forEach(g => g.visible = false); far.visible = false; }
function noDrain() { chan.forEach(c => c.visible = false); chanWater.forEach(w => w.visible = false); chanFill.forEach(f => f.visible = true); }
function setRain(t, o) { rainMat.opacity = o; rain.forEach(m => { m.visible = o > 0.01; if (!m.visible) return; const d = m.userData; m.position.set(d.x, 12 - ((t * 7 + d.o * 13) % 13), d.z); }); }
// avião: posição do pé do trem (x, y, z), arfagem (nariz p/ cima +)
function setPlane(x, y, z, pitch = 0, yaw = 0, roll = 0) { plane.g.visible = true; plane.g.position.set(x, y, z); plane.g.rotation.set(0, -Math.PI / 2 + yaw, 0); plane.body.rotation.set(roll, 0, pitch); }
function landing(t, t0, z0, z1, dur) { // aproxima pelo fundo, toca e rola na direção da câmera (+z)
  const u = r(t, t0, t0 + dur); const z = lerp(z0, z1, 1 - Math.pow(1 - u, 1.6)); const tTouch = 0.45;
  const y = u < tTouch ? 6 * Math.pow(1 - u / tTouch, 2) : 0; const p = u < tTouch ? 0.12 : 0.12 * (1 - r(u, tTouch, tTouch + 0.15));
  setPlane(0, y, z, p); plane.set({ roda: t * 8 }); return { z, touch: t0 + dur * tTouch };
}
function finishedPlane(t) { const z = -60 + ((t * 9) % 40); setPlane(0, 0, z, 0); plane.set({ roda: t * 8 }); }
function world(t) {
  const sh = shotOf(t); const st = { cam: null, shake: 0, vig: 0.3, html: '' };
  base(t); let K;
  if (sh === -1) { // ABERTURA: pista pronta, avião tocando + giro rápido + selo
    const L = landing(t, -0.9, -70, -24, 2.2); smoke.g.position.set(0, 0.3, L.z - 0.5); smoke.update(r(t, L.touch, L.touch + 1.2));
    const u = r(t, 0, S(0) - 0.1); const a = lerp(-0.9, -0.3, eo(u));
    K = [0, V(Math.sin(a) * 26, 7 - u * 2, -18 + Math.cos(a) * 26), V(0, 0.5, -22), 44];
    st.html += selo(t);
  } else if (sh === 0) { // asfalto direto na terra
    raw(); fofa.visible = true; const zp = lerp(-34, 1.5, sm(r(t, TS(0), wt(0, 'pista') + 0.2)));
    thin.forEach((g, i) => g.visible = -SL * i - SL < zp - 2.2);
    paver.g.visible = true; paver.g.position.set(0, 0, zp); dust.g.position.set(0, 0.3, zp - 2.6); dust.update(0.35 + 0.1 * Math.sin(t));
    K = camKeys([[TS(0), V(10, 5.5, 8), V(0, -0.4, -8), 42], [S(1) - 0.2, V(8.5, 3.6, 9.5), V(0, -0.6, -4), 42]], t);
    st.html += pill(t, wt(0, 'asfalto') - 0.05, 'ASFALTO', V2(760, 330), 'orange', V(-2, 0.06, -8), wt(0, 'pista') - 0.2);
    st.html += pill(t, wt(0, 'terra') - 0.05, 'TERRA', V2(300, 1040), 'orange', V(-2.5, -1.0, 0), wt(0, 'pista') - 0.2);
    st.html += pill(t, wt(0, 'pista') - 0.05, 'PISTA DE AVIÃO?', V2(540, 340), '', V(0, 0.1, -10));
  } else if (sh === 1) { // avião pesado: afunda
    raw(); fofa.visible = true; thin.forEach(g => g.visible = true);
    const ta = wt(1, 'afunda') - 0.2; const L = landing(t, TS(1) - 0.4, -80, -19, ta - TS(1) + 0.4);
    const ds = 0.7 * eo(r(t, ta, ta + 0.5));
    thin.forEach((g, i) => { const zc = -SL * (i + 0.5); const d = Math.abs(zc - L.z); if (d < 7) { const k = 1 - d / 7; g.position.y = -ds * k; g.rotation.x = 0.08 * ds * Math.sign(zc - L.z) * (1 - k); } });
    if (t > ta) { setPlane(0, -ds, L.z, -0.1 * ds / 0.7, 0, 0.05 * ds); }
    smoke.g.position.set(0, 0.3, L.z - 0.5); smoke.update(r(t, L.touch, L.touch + 1.2));
    dust.g.position.set(0, 0.0, L.z); dust.update(r(t, ta + 0.1, ta + 1.4)); if (t > ta) st.shake = 0.6 * (1 - r(t, ta + 0.1, ta + 0.8));
    for (let i = 0; i < 3; i++) placeArrow(redA[i], V(-1.5 + i * 1.5, 4.2, L.z), V(0, -1, 0), 1.4 * eo(r(t, ta + i * 0.08, ta + 0.4)) + 0.01);
    K = camKeys([[TS(1), V(9, 9, 4), V(0, 2, -34), 42], [wt(1, '500'), V(7, 6.5, 2), V(0, 0.8, -22), 42], [S(2) - 0.2, V(6, 5.5, 0), V(0, 0, -19), 42]], t);
    st.html += pill(t, wt(1, '500') - 0.05, '+500 TONELADAS', V2(540, 340), 'orange', V(0, 1.6, L.z), ta - 0.2);
    st.html += pill(t, ta + 0.1, 'A PISTA AFUNDA!', V2(540, 340), 'red', V(0, 0, L.z + 3));
  } else if (sh === 2) { // tira a terra fofa, compacta: subleito
    raw(); fofa.visible = true; const tc = wt(2, 'compacta') - 0.3;
    KIT.grow(fofa, 1 - eo(r(t, TS(2) + 0.2, tc)));
    exc.g.visible = true; exc.g.position.set(3.2, 0, -7); exc.g.rotation.y = Math.PI * 0.75 + 0.35 * Math.sin(t * 2.2); exc.set({ giro: 0, lanca: -0.6 + 0.2 * Math.sin(t * 2.2), braco: 2.2, cacamba: 0.9 });
    dust.g.position.set(0.5, -1.2, -5); dust.update(r(t, TS(2) + 0.2, tc + 0.6));
    const zf = lerp(-30, 0.01, sm(r(t, tc, wt(2, 'isso') + 0.2))); if (t > tc - 0.05) { layerTo('subleito', zf); roller.g.visible = true; roller.g.position.set(-1.5, YSB, Math.min(zf - 1.6, -1.6)); roller.set({ roda: t * 5 }); }
    if (t > tc + 0.2) exc.g.visible = false;
    K = camKeys([[TS(2), V(-6, 3.4, 11), V(0, -1.2, -3), 42], [S(3) - 0.2, V(-5, 2.2, 10), V(0, -1.4, -2), 42]], t);
    st.html += pill(t, wt(2, 'terra') - 0.05, 'TERRA FOFA', V2(300, 1040), 'red', V(-2.5, -1.0, 0), tc - 0.1);
    st.html += pill(t, wt(2, 'compacta') - 0.05, 'COMPACTA', V2(780, 340), 'orange', roller.g.visible ? V(-1.5, YSB + 1.2, Math.min(zf - 1.6, -1.6)) : null, wt(2, 'isso') - 0.2);
    st.html += pill(t, wt(2, 'subleito') - 0.05, 'SUBLEITO', V2(300, 1040), 'green', V(-2.5, (YSB + YSL) / 2, 0));
  } else if (sh === 3) { // sub-base e base
    raw(); LAY.subleito.visible = true; layerTo('subleito', 0); const tf = wt(3, 'fina') - 0.2;
    const z1 = lerp(-30, 0.01, sm(r(t, TS(3) + 0.1, tf))); layerTo('subbase', z1);
    const z2 = lerp(-30, 0.01, sm(r(t, tf, wt(3, 'isso') + 0.3))); if (t > tf) layerTo('base', z2);
    truck.g.visible = true; const zt = t < tf ? z1 : z2; truck.g.position.set(2.4, t < tf ? YB : YA, Math.min(zt + 2.6, -2.4)); truck.set({ basculha: 0.75, carga: true, tipoCarga: t < tf ? 'brita' : 'base', roda: t * 4 });
    if (zt > -0.5) truck.g.visible = false;
    K = camKeys([[TS(3), V(-6, 2.6, 10.5), V(0, -0.9, -2), 42], [S(4) - 0.2, V(-5, 1.6, 9.5), V(0, -0.9, -1), 42]], t);
    st.html += pill(t, wt(3, 'grossa') - 0.05, 'PEDRA GROSSA', V2(780, 340), 'orange', V(-2.5, (YB + YSB) / 2, 0), tf);
    st.html += pill(t, wt(3, 'fina') - 0.05, 'PEDRA FINA', V2(780, 340), 'orange', V(-2.5, (YA + YB) / 2, 0), wt(3, 'isso') - 0.2);
    st.html += pill(t, wt(3, 'sub') - 0.05, 'SUB-BASE', V2(270, 1050), 'green', V(-3, (YB + YSB) / 2, 0));
    st.html += pill(t, wt(3, 'base') - 0.05, 'BASE', V2(800, 340), 'green', V(-1, (YA + YB) / 2, 0));
  } else if (sh === 4) { // revestimento: asfalto grosso
    raw(); ['subleito', 'subbase', 'base'].forEach(k => { LAY[k].visible = true; layerTo(k, 0); });
    const zf = lerp(-28, 0.01, sm(r(t, TS(4), wt(4, 'isso')))); layerTo('capa', zf);
    paver.g.visible = true; paver.g.position.set(0.5, YA, Math.min(zf + 1.8, -2.2)); roller.g.visible = true; roller.g.position.set(-1.8, 0, Math.min(zf - 4, -2)); roller.set({ roda: t * 5 });
    smoke.g.position.set(0, 0.2, zf - 0.5); smoke.update(0.3 + 0.05 * Math.sin(t * 1.3));
    K = camKeys([[TS(4), V(-6, 2.8, 10.5), V(0, -0.5, -2), 42], [S(5) - 0.2, V(-4.5, 1.6, 9), V(0, -0.6, -1), 42]], t);
    st.html += pill(t, wt(4, 'asfalto') - 0.05, 'ASFALTO BEM GROSSO', V2(540, 340), 'orange', V(-2.5, YA / 2, 0), wt(4, 'isso') - 0.2);
    st.html += dim(t, wt(4, 'grosso') - 0.1, V(-RW + 0.2, YA, 0.1), V(-RW + 0.2, 0, 0.1), 'capa', 1);
    st.html += pill(t, wt(4, 'revest') - 0.05, 'REVESTIMENTO', V2(540, 340), 'green', V(-2.5, YA / 2, 0));
  } else if (sh === 5) { // chuva entra por baixo, amolece
    noDrain(); marks.visible = false; rubber.visible = false; grooves.forEach(g => g.visible = false); far.visible = false;
    setRain(t, 0.6 * r(t, TS(5), TS(5) + 0.4)); sheet.material.opacity = 0.35 * r(t, TS(5), TS(5) + 0.8);
    const tb = wt(5, 'baixo') - 0.3, ta = wt(5, 'amolece') - 0.2; wet.material.opacity = 0.5 * r(t, tb, ta + 0.4);
    for (let i = 0; i < 4; i++) placeArrow(blueA[i], V(-RW + 0.6 + (i % 2) * (2 * RW - 1.2), 0.9, 0.3), V(i < 2 ? 0.3 : -0.3, -1, 0), 1.6 * eo(r(t, tb + i * 0.1, tb + 0.6)) + 0.01);
    const sag = 0.08 * eo(r(t, ta, ta + 0.6)); LAY.capa.position.y -= sag; LAY.base.position.y -= sag * 0.6;
    K = camKeys([[TS(5), V(5.5, 2.0, 10), V(0, -0.7, -1), 42], [S(6) - 0.2, V(4, 0.8, 8.5), V(0, -0.9, 0), 42]], t);
    st.html += pill(t, wt(5, 'água') - 0.05, 'ÁGUA DA CHUVA', V2(540, 340), 'orange', V(-RW + 0.8, 0.9, 0.3), ta - 0.2);
    st.html += pill(t, ta + 0.05, 'AMOLECE!', V2(780, 1040), 'red', V(1.5, (YA + YSL) / 2, 0.1));
  } else if (sh === 6) { // canais dos lados: drenagem
    marks.visible = false; rubber.visible = false; grooves.forEach(g => g.visible = false); far.visible = false;
    const tk = TS(6) + 0.1, tl = wt(6, 'lados') + 0.2;
    chanFill.forEach(f => { f.visible = true; KIT.grow(f, 1 - eo(r(t, tk, tk + 0.7))); }); chan.forEach(c => KIT.grow(c, eo(r(t, tk + 0.5, tl)))); chanWater.forEach(w => { w.visible = t > tl; KIT.grow(w, r(t, tl, tl + 0.6)); });
    setRain(t, 0.5); sheet.material.opacity = 0.3 * (1 - r(t, tl, tl + 1.2)); wet.material.opacity = 0.5 * (1 - r(t, tl, tl + 1.5));
    for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, j = i >> 1; placeArrow(blueA[i], V(s * (1.8 + j * 0.6), 0.35, -1.0 - j * 2.2), V(s, -0.12, 0), (RW - 1.2 - j * 0.6) * eo(r(t, tl - 0.2 + j * 0.1, tl + 0.5)) + 0.01); }
    K = camKeys([[TS(6), V(9, 3.2, 9), V(4.6, -0.6, -1.5), 42], [S(7) - 0.2, V(8.5, 2.6, 8), V(4.8, -0.6, -1.2), 42]], t);
    st.html += pill(t, wt(6, 'canais') - 0.05, 'CANAIS DOS LADOS', V2(540, 340), 'orange', V(RW + CW / 2, -0.3, 0), wt(6, 'isso') - 0.2);
    st.html += pill(t, wt(6, 'drenagem') - 0.05, 'DRENAGEM', V2(540, 340), 'green', V(RW + CW / 2, -0.4, 0));
  } else if (sh === 7) { // PIADA: avião aquaplanando + placa NÃO!
    grooves.forEach(g => g.visible = false); setRain(t, 0.6); sheet.material.opacity = 0.45;
    const tb = wt(7, 'boia') - 0.2, te = wt(7, 'escorrega') - 0.25;
    const L = landing(t, TS(7) - 0.6, -80, -14, te - TS(7) + 1.4); const us = eo(r(t, te, te + 0.9));
    setPlane(2.6 * us, 0, L.z, 0, 0.55 * us, -0.05 * us); plane.set({ roda: t * 8 });
    spray.g.position.set(2.6 * us, 0.3, L.z - 1); spray.update(r(t, tb, tb + 1.8));
    worker.g.visible = true; worker.g.position.set(8.5, 0, -11); worker.g.rotation.set(0, -0.9, 0);
    pose(worker, t > te ? { armR: [-2.9, 0.1], armL: [-2.6, 0.5], eyes: 1.8 } : { armR: [-0.3, -0.1] });
    if (t > te) st.shake = 0.35 * (1 - r(t, te + 0.2, te + 0.8));
    K = camKeys([[TS(7), V(13, 6, 2), V(0, 0.8, -22), 42], [te, V(12, 4.2, -1), V(1, 0.6, -15), 42], [S(8) - 0.2, V(11.5, 3.8, -2), V(2, 0.6, -13), 42]], t);
    st.html += pill(t, wt(7, 'pneu') - 0.05, 'O PNEU BOIA', V2(540, 340), 'orange', V(0, 0.4, L.z), te - 0.1);
    if (t > te && t < E(7) + 0.4) st.html += `<div style="position:absolute;left:340px;top:330px;width:400px;text-align:center;font-weight:900;font-size:150px;color:#fff;background:#d32424;border:10px solid #fff;border-radius:30px;transform:rotate(-8deg) scale(${back(r(t, te, te + 0.3))});box-shadow:0 10px 30px rgba(0,0,0,.4)">NÃO!</div>`;
  } else if (sh === 8) { // grooving
    const tr = wt(8, 'riscos') - 0.4, ta = wt(8, 'água') - 0.2; const zg = lerp(-22, -1.2, sm(r(t, TS(8), wt(8, 'isso'))));
    grooves.forEach(g => g.visible = g.position.z < zg - 1.0);
    groover.g.visible = true; groover.g.scale.setScalar(0.8); groover.g.position.set(0, 0, zg); groover.set({ giro: t * 2 });
    dust.g.position.set(0, 0.2, zg - 1.2); dust.update(0.35 + 0.05 * Math.sin(t));
    sheet.material.opacity = 0.3 * r(t, ta - 0.2, ta + 0.4) * (1 - r(t, ta + 0.8, ta + 1.8)); setRain(t, 0.35 * r(t, ta - 0.3, ta + 0.2));
    for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, j = i >> 1; placeArrow(blueA[i], V(s * 0.6, 0.12, zg - 2.5 - j * 1.4), V(s, 0, 0), 3.4 * eo(r(t, ta + j * 0.1, ta + 0.6)) + 0.01); }
    K = camKeys([[TS(8), V(7, 5, -4), V(0, 0, -16), 42], [ta, V(5.5, 4.0, 2), V(0, 0, -8), 42], [S(9) - 0.2, V(5, 3.6, 2.5), V(0, 0, -7), 42]], t);
    st.html += pill(t, wt(8, 'riscos') - 0.05, 'RISCOS FINOS', V2(540, 340), 'orange', V(0, 0.05, zg - 2.5), ta - 0.2);
    st.html += pill(t, ta + 0.05, 'A ÁGUA FOGE', V2(780, 1040), 'orange', V(2.5, 0.12, zg - 3), wt(8, 'isso') - 0.2);
    st.html += pill(t, wt(8, 'grooving') - 0.05, 'GROOVING', V2(540, 340), 'green', V(0, 0.05, -4));
  } else if (sh === 9) { // Galeão: 4 km
    scene.fog.near = 300; scene.fog.far = 1100; finishedPlane(t);
    K = camKeys([[TS(9), V(12, 8, 12), V(0, 0, -40), 42], [wt(9, '4') + 0.3, V(18, 42, 30), V(0, 0, -300), 44], [S(10) - 0.2, V(20, 50, 40), V(0, 0, -340), 44]], t);
    st.html += pill(t, wt(9, 'galeão') - 0.05, 'GALEÃO · RIO', V2(540, 340), 'orange', null, wt(9, '4') - 0.2);
    st.html += big(t, wt(9, '4') - 0.1, '4 km', 330, '#FFD21F', 170, wt(9, 'quase') - 0.15);
    st.html += fields(t, wt(9, 'quase') - 0.05);
  } else if (sh === 10) { // revelação: borracha de pneu + limpeza
    const tb = wt(10, 'borracha') - 0.1, tl = wt(10, 'limpar') - 0.4;
    const zp = lerp(-6, -34, sm(r(t, tl, E(10) + 0.2))); if (t > tl - 0.3) { pipa.g.visible = true; pipa.g.position.set(1.9, 0, zp); pipa.set({ roda: t * 5, agua: 0.5 + 0.05 * Math.sin(t * 2) }); }
    rubberPieces.forEach(m => m.material.opacity = t > tl && m.position.z > zp + 1.2 ? 0.7 * (1 - r(m.position.z, zp + 1.2, zp + 3)) : 0.7);
    const tp = wt(10, 'pouso') - 0.6; if (t > tp - 1.4 && t < tl - 0.3) { const L = landing(t, tp - 1.4, -90, -28, 2.0); smoke.g.position.set(0, 0.3, L.z - 0.5); smoke.update(r(t, L.touch, L.touch + 1.2)); }
    K = camKeys([[TS(10), V(6, 4, -8), V(0, 0, -21), 42], [tl, V(6.5, 3.5, -7), V(0.5, 0, -19), 42], [S(11) - 0.2, V(8, 6, -7), V(1, 0, -26), 42]], t);
    st.html += pill(t, wt(10, 'marcas') - 0.05, 'MARCAS PRETAS?', V2(540, 340), 'orange', V(-1.6, 0.05, -20), tb - 0.2);
    st.html += pill(t, tb, 'BORRACHA DE PNEU', V2(540, 340), 'green', V(-1.6, 0.05, -20), tl - 0.2);
    st.html += pill(t, tl + 0.1, 'LIMPEZA', V2(540, 340), 'green', V(1.9, 1.2, zp), wt(10, 'escorrega') - 0.2);
    st.html += pill(t, wt(10, 'escorrega') - 0.05, 'SENÃO ESCORREGA', V2(540, 340), 'red', null);
  } else { // parabéns + CTA (+ tela final por cima)
    const tt = t - TS(11); const L = landing(t, TS(11) - 1.2, -80, -16, 3.4); smoke.g.position.set(0, 0.3, L.z - 0.5); smoke.update(r(t, L.touch, L.touch + 1.4));
    const u = r(t, TS(11), END); const a = -0.5 + u * 0.9;
    K = [0, V(Math.sin(a) * 26, 8, -20 + Math.cos(a) * 26), V(0, 0.5, -20), 44];
    if (sh === 11) { st.html += big(t, wt(11, 'parab') - 0.05, 'PARABÉNS!', 300, '#FFD21F', 120); st.html += big(t, wt(11, 'constr') - 0.05, 'VOCÊ CONSTRUIU UMA<br>PISTA DE AEROPORTO', 450, '#fff', 74); st.html += confetti(t, wt(11, 'parab')); }
    if (sh >= 12) st.html += ctaCard(t);
  }
  st.cam = K; return st;
}
function fields(t, t0) { if (t < t0) return ''; const k = pop(t, t0, 0.4);
  let h = `<div style="position:absolute;left:90px;right:90px;top:300px;padding:26px 20px 30px;background:rgba(20,23,29,.9);border:5px solid #3dd17a;border-radius:36px;transform:scale(${k});text-align:center">
   <div style="font-weight:900;font-size:62px;color:#fff;margin-bottom:18px">QUASE <span style="color:#3dd17a">40</span> CAMPOS DE FUTEBOL</div><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">`;
  for (let i = 0; i < 40; i++) { const a = r(t, t0 + 0.2 + i * 0.03, t0 + 0.35 + i * 0.03);
    h += `<div style="width:78px;height:50px;box-sizing:border-box;background:#2f9a4e;border:3px solid #fff;position:relative;opacity:${a};transform:scale(${0.4 + 0.6 * a})"><div style="position:absolute;left:36px;top:0;bottom:0;width:3px;background:#fff"></div><div style="position:absolute;left:28px;top:14px;width:16px;height:16px;border:3px solid #fff;border-radius:50%"></div></div>`; }
  return h + '</div></div>'; }
function selo(t) { const k = back(r(t, 0.05, 0.4)), o = 1 - r(t, S(0) - 0.3, S(0) - 0.05);
  return `<div style="position:absolute;left:0;right:0;top:330px;text-align:center;opacity:${o};transform:scale(${0.5 + 0.5 * k})">
   <div style="display:inline-block;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:92px;letter-spacing:6px;padding:14px 50px;border-radius:70px;box-shadow:0 12px 40px rgba(0,0,0,.45)">DO ZERO</div>
   <div style="font-family:InterD;font-weight:900;font-size:170px;color:#fff;line-height:1.1;text-shadow:0 8px 30px rgba(0,0,0,.6)">#05</div></div>`; }
function ctaCard(t) { const t0 = TS(12); if (t < t0 || t > window.F_END / FPS + 0.2) return '';
  const items = [['curte', '#ff4d6d', '<path d="M50 84 L18 52 Q6 38 16 24 Q28 10 44 22 L50 28 L56 22 Q72 10 84 24 Q94 38 82 52 Z" fill="#ff4d6d"/>', 'CURTE'],
    ['salva', '#FFD21F', '<path d="M26 12 H74 V88 L50 70 L26 88 Z" fill="#FFD21F"/>', 'SALVA'],
    ['manda', '#4aa3ff', '<path d="M10 46 L90 12 L62 88 L48 56 Z" fill="#4aa3ff"/>', 'MANDA'],
    ['comenta', '#3dd17a', '<path d="M14 18 H86 V66 H46 L24 86 V66 H14 Z" fill="#3dd17a"/>', 'COMENTA']];
  let h = '<div style="position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;gap:26px">';
  for (const [w, c, svg, lab] of items) { const k = back(r(t, wt(12, w) - 0.15, wt(12, w) + 0.15));
    h += `<div style="width:220px;text-align:center;transform:scale(${k});opacity:${cl(k)}"><div style="width:190px;height:190px;margin:0 auto;border-radius:40px;background:rgba(20,23,29,.92);border:5px solid ${c};display:flex;align-items:center;justify-content:center"><svg width="120" height="120" viewBox="0 0 100 100">${svg}</svg></div><div style="font-weight:900;font-size:40px;color:#fff;margin-top:10px;text-shadow:0 3px 0 #000">${lab}</div></div>`; }
  return h + '</div>'; }
function confetti(t, t0) { if (t < t0) return ''; let h = ''; const cols = ['#FFD21F', '#ff5a5a', '#3dd17a', '#4aa3ff', '#ff9a1f', '#fff'];
  for (let i = 0; i < 70; i++) { const u = t - t0; const x = (i * 157) % 1080 + Math.sin(u * 2 + i) * 30; const y = -40 + u * (260 + (i * 37) % 200) - 60 * ((i * 13) % 5); if (y < -40 || y > 1950) continue;
    h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${12 + i % 3 * 4}px;height:${22 - i % 3 * 4}px;background:${cols[i % 6]};transform:rotate(${u * 300 + i * 40}deg)"></div>`; }
  return h; }
function avatarCorner(f) {
  const out = cl(1 - (f - window.F_END) / 8); if (out <= 0) return ''; const inS = springSim(f - 4, 12, 140); const m = mouthAt(f);
  return `<div style="position:absolute;left:50px;top:1515px;width:270px;height:270px;opacity:${out};transform:translateY(${-m * 5}px) rotate(${Math.sin(f / 23) * 2 + m * 1.5}deg) scale(${inS * (0.9 + 0.1 * out)})">
   <div style="width:270px;height:270px;box-sizing:border-box;border-radius:135px;overflow:hidden;background:#30343A;border:9px solid #FFC20E;box-shadow:0 18px 40px rgba(0,0,0,.5)">${window.AV.svg(m, window.AV.blinkAt(f), Math.sin(f / 70) * 0.6)}</div></div>`;
}
function camSet(K, t, st) { const p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.12; p.add(V(noise(t * 2.5) * a, noise(t * 2.8, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.05, Math.sin(t * 0.9) * 0.04, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.far = 1200; cam.up.set(0, 1, 0); cam.setViewOffset(W, H, 0, 260, W, H);
  cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); }
window.renderFrame = f => {
  const t = f / FPS; let st = world(t); let K = st.cam; camSet(K, t, st); st = world(t); K = st.cam;
  camSet(K, t, st);
  sun.target.position.set(0, -1, -12); sun.position.set(10, 24, 6);   // luz FIXA
  R.render(scene, cam);
  canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`;
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 1, dist = 14) => {
  const t = 5; world(-1); base(t); const L = landing(1.0, 0, -70, -18, 2.0); smoke.g.position.set(0, 0.3, L.z - 0.5); smoke.update(0.35);
  groover.g.visible = false;
  cam.clearViewOffset(); cam.position.set(14, cy + 5, L.z + dist); cam.fov = 44; cam.far = 1200; cam.up.set(0, 1, 0); cam.lookAt(V(0, cy - 0.5, L.z - 2)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -1, -12); sun.position.set(10, 24, 6); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 30%,rgba(14,22,34,0) 46%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:270px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:64px;letter-spacing:6px;padding:14px 40px;border-radius:50px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:250px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:120px;line-height:1">#05</div>
   <div style="position:absolute;left:110px;right:80px;top:420px;font-family:InterD;font-weight:900;font-size:104px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Como se faz uma <span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">pista de avião</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

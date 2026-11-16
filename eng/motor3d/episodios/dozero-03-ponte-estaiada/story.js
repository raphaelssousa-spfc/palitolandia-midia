// ================= PONTE ESTAIADA: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const NP = TM.phrases.length;
const shotOf = t => { if (t < S(0) - 0.1) return -1; let k = 0; for (let i = 1; i < NP; i++) if (t >= S(i) - 0.1) k = i; return k; };
const TS = i => S(i) - 0.1;
function V2(x, y) { return { x, y }; }
const xB = (t, a, b) => back(r(t, a, a + b));
// pista: R aduelas à direita e L à esquerda (fracionário = aduela nascendo)
function setDeck(R, L, withStays = true) {
  segs[0].visible = R > 0 || L > 0;
  for (let k = 1; k <= NSEG; k++) for (const s of [1, -1]) { const n = s > 0 ? R : L; const u = cl(n - (k - 1)); const g = segs[s * k];
    g.visible = u > 0.01; g.scale.set(Math.max(0.01, u), 1, 1); g.position.set(s * (k * SEG - (1 - u) * SEG / 2), DY - DT, DZ); g.rotation.set(0, 0, 0);
    setStay(s * k, withStays ? r(u, 0.45, 1) : 0); }
  const tipR = R > 0 ? Math.min(R, NSEG) * SEG + SEG / 2 : 0, tipL = L > 0 ? Math.min(L, NSEG) * SEG + SEG / 2 : 0;
  return { tipR, tipL };
}
function base() {
  plank.visible = false; splash.update(0); piles.visible = false; beamBr.visible = false; boat.visible = false;
  bridge.rotation.set(0, 0, 0); tower.visible = true; tower.scale.set(1, 1, 1); abut.forEach(a => { a.visible = true; a.scale.set(1, 1, 1); });
  travR.visible = travL.visible = false; worker.g.visible = false; worker2.g.visible = false; mats.ghost.opacity = 0; ghost.visible = false;
  tall.visible = false; tall.scale.set(1, 1, 1); cars.forEach(c => c.g.visible = false); [...upArrows, ...dnArrows].forEach(a => a.visible = false); dust.update(0);
  crane.g.visible = true; crane.set({ giro: 0.3, desce: 3 });
  setDeck(NSEG, NSEG);
}
function driveCars(t) { cars.forEach((c, i) => { const dir = i % 2 ? -1 : 1; const x = dir * (((t * 3.2 + i * 6.5) % 26) - 13); c.g.visible = true; c.g.position.set(x, DY + 0.03, DZ + (dir > 0 ? 0.35 : -0.35)); c.g.rotation.set(0, dir > 0 ? 0 : Math.PI, 0); c.set({ roda: t * 6 }); }); }
function world(t) {
  const sh = shotOf(t); const st = { cam: null, blur: 0, red: 0, dark: 0, flash: 0, vig: 0.3, shake: 0, html: '' };
  base(); let K;
  const early = sh >= 0 && sh <= 3;           // antes do mastro
  if (early) { tower.visible = false; setDeck(0, 0); abut.forEach(a => a.visible = false); crane.g.visible = false; }
  if (sh === -1) { // ABERTURA: ponte pronta, giro rápido + selo
    driveCars(t + 3); const u = r(t, 0, S(0) - 0.1); const a = lerp(-0.75, 0.15, eo(u));
    K = [0, V(3 + Math.sin(a) * 30, 9 - u * 2, 1.5 + Math.cos(a) * 30), V(3, 5.2, 0), 42];
    st.html += selo(t);
  } else if (sh === 0) { // tábua
    plank.visible = true; KIT.drop(plank, r(t, TS(0) + 0.1, wt(0, 'tábua') + 0.3), 3);
    worker2.g.visible = true; worker2.g.position.set(-0.6, 0, DZ + 1.2); worker2.g.rotation.set(0, 0.6, 0); pose(worker2, { armL: [-0.4, 0.3], armR: [-0.4, -0.3] }); idle(worker2, t);
    K = camKeys([[TS(0), V(6.5, 4.0, 31), V(6.5, -0.8, 0), 42], [S(1) - 0.2, V(6.0, 3.0, 27), V(6.5, -0.8, 0), 42]], t);
    st.html += pill(t, wt(0, 'ponte') - 0.1, 'PONTE?', V2(540, 420), '', V(6.5, 0.2, DZ));
  } else if (sh === 1) { // quebra no meio
    plank.visible = true; splash.g.position.set(PLM, WL, DZ); const tq = wt(1, 'quebra') - 0.1; const a = 0.32 * ei(r(t, tq, tq + 0.35));
    plankL.rotation.z = -a; plankR.rotation.z = a;
    splash.update(r(t, tq + 0.3, tq + 1.4)); if (t > tq) st.shake = 0.5 * (1 - r(t, tq + 0.3, tq + 0.8));
    worker2.g.visible = true; worker2.g.position.set(-0.6, 0, DZ + 1.2); worker2.g.rotation.set(0, 0.6, 0); pose(worker2, t > tq ? { armL: [-2.6, 0.5], armR: [-2.6, -0.5], eyes: 1.6 } : {});
    for (let i = 0; i < 3; i++) placeArrow(dnArrows[i], V(5.6 + i * 0.9, 3.0, DZ), V(0, -1, 0), 1.1 * eo(r(t, S(1) + 0.3 + i * 0.08, S(1) + 0.8)) + 0.01, t < tq + 0.2);
    K = camKeys([[TS(1), V(6.0, 3.0, 27), V(6.5, -0.8, 0), 42], [S(2) - 0.2, V(6.8, 1.8, 23), V(6.5, -1.0, 0), 42]], t);
    st.html += pill(t, wt(1, 'largo') - 0.05, 'RIO LARGO', V2(300, 420), '', V(3, WL, DZ), tq - 0.1);
    st.html += pill(t, tq + 0.1, 'QUEBROU!', V2(760, 400), 'red', V(PLM, -0.2, DZ));
  } else if (sh === 2) { // estacas + pilares
    const te = wt(2, 'estacas') - 0.3, tp = wt(2, 'pilares') - 0.3;
    piles.visible = true; KIT.drop(piles, r(t, te, te + 0.5), 5); dust.g.position.set(6.5, BED, DZ); dust.update(r(t, te + 0.4, te + 1.6));
    if (t > te + 0.4) st.shake = 0.4 * (1 - r(t, te + 0.45, te + 0.9));
    beamBr.visible = t > tp; pillars.children.forEach(p => KIT.grow(p, r(t, tp, tp + 0.7))); beamDeck.visible = t > tp + 0.6; KIT.drop(beamDeck, r(t, tp + 0.6, tp + 1.0), 2, DY - DT);
    crane.set({ giro: lerp(0.3, -0.05, sm(r(t, TS(2), te))), desce: lerp(2, 6, r(t, TS(2), te + 0.5)) });
    K = camKeys([[TS(2), V(6.5, 0.0, 27), V(6.5, -2.8, 0), 42], [S(3) - 0.2, V(5.5, 1.0, 26), V(6.5, -1.8, 0), 42]], t);
    st.html += pill(t, te + 0.25, 'ESTACAS', V2(300, 1060), 'orange', V(4.0, BED - 1.8, FZ + 0.1));
    st.html += pill(t, tp + 0.25, 'PILARES', V2(800, 430), 'orange', V(8.5, 0.6, DZ));
  } else if (sh === 3) { // barco não passa
    piles.visible = true; beamBr.visible = true; boat.visible = true;
    const tb = wt(3, 'passa') - 0.15; const zb = t < tb ? lerp(-26, -1.9, eo(r(t, TS(3) - 0.6, tb))) : -1.9 - 0.35 * Math.sin(Math.PI * r(t, tb, tb + 0.4));
    boat.position.set(6.5, WL, zb); boat.rotation.set(t > tb ? -0.05 * (1 - r(t, tb, tb + 0.6)) : 0, 0, 0);
    if (t > tb) st.shake = 0.6 * (1 - r(t, tb + 0.1, tb + 0.6));
    K = camKeys([[TS(3), V(-4, 6, 20), V(6.5, 0.3, -4), 42], [S(4) - 0.2, V(-3, 4.5, 17), V(6.5, 0.6, -2), 42]], t);
    st.html += xmark(t, tb, V(8.5, 1.0, DZ));
    st.html += pill(t, tb + 0.05, 'NÃO PASSA!', V2(540, 400), 'red');
  } else if (sh === 4) { // tira o pilar, ergue a torre
    const tt = wt(4, 'ergue') - 0.2;
    boat.visible = t < TS(4) + 1.2; boat.position.set(6.5, WL, lerp(-1.9, 12, r(t, TS(4) + 0.2, TS(4) + 1.4)));
    beamBr.visible = t < TS(4) + 0.35; piles.visible = false;
    tower.visible = true; KIT.grow(tower, sm(r(t, tt, E(4) + 0.1)));
    crane.set({ giro: 0.9 + Math.sin(t * 1.2) * 0.2, desce: 2 }); dust.g.position.set(0, 0, DZ + 1.5); dust.update(r(t, tt, tt + 1.5));
    setDeck(0, 0); abut.forEach(a => a.visible = false);
    const h = 14 * sm(r(t, tt, E(4) + 0.1));
    K = camKeys([[TS(4), V(6, 4, 22), V(1, 1.5, 0), 42], [tt + 0.2, V(5, 4, 24), V(0.5, 2.5, 0), 42], [S(5) - 0.2, V(4, 6, 29), V(0, 6.5, 0), 42]], t);
    st.html += pill(t, wt(4, 'torre') - 0.05, 'TORRE GIGANTE', V2(760, 380), 'orange', V(0, Math.max(1, h - 1), DZ));
  } else if (sh === 5) { // isso é o mastro
    setDeck(0, 0); abut.forEach(a => a.visible = false);
    K = camKeys([[TS(5), V(7, 1.5, 21), V(0, 6.8, 0), 46], [S(6) - 0.2, V(5.5, 1.3, 19), V(0, 7.0, 0), 46]], t);
    st.html += pill(t, S(5) + 0.15, 'MASTRO', V2(760, 420), 'green', V(0.3, 11, DZ));
  } else if (sh === 6) { // pista sem apoio: aduela cai
    abut.forEach(a => a.visible = false); setDeck(1, 0, false);
    const tf = wt(6, 'apoio') - 0.1; const g = segs[1]; const a = 0.9 * ei(r(t, tf, tf + 0.4)); const dy = 3.2 * ei(r(t, tf + 0.15, tf + 0.6));
    g.position.y = DY - DT - dy; g.rotation.z = -a; g.visible = dy < 3.1;
    splash.g.position.set(1.8, WL, DZ); splash.update(r(t, tf + 0.55, tf + 1.5));
    for (let i = 0; i < 3; i++) placeArrow(dnArrows[i], V(1.2 + i * 0.6, 4.6, DZ), V(0, -1, 0), 1.2 * eo(r(t, S(6) + i * 0.06, S(6) + 0.5)) + 0.01);
    K = camKeys([[TS(6), V(7, 4.0, 15), V(2.2, 1.8, 0), 42], [S(7) - 0.2, V(6.5, 3.5, 14), V(2.2, 1.6, 0), 42]], t);
    st.html += pill(t, wt(6, 'apoio') - 0.05, 'SEM APOIO!', V2(760, 420), 'red', V(1.5, DY - 0.5, DZ));
  } else if (sh === 7) { // pendura com cabos: estai
    abut.forEach(a => a.visible = false); const tc = wt(7, 'cabos') - 0.3;
    const R = 3 * eo(r(t, TS(7), tc)); setDeck(R, 0, false); for (let k = 1; k <= 3; k++) setStay(k, r(t, tc + (k - 1) * 0.15, tc + 0.5 + (k - 1) * 0.15));
    K = camKeys([[TS(7), V(8, 5.5, 18), V(2.6, 5.2, 0), 42], [S(8) - 0.2, V(7, 5.0, 16.5), V(2.6, 5.4, 0), 42]], t);
    st.html += pill(t, tc + 0.15, 'CABOS DE AÇO', V2(780, 330), 'orange', anchorT(2).lerp(anchorD(2), 0.5), wt(7, 'estai') - 0.25);
    st.html += pill(t, wt(7, 'estai') - 0.05, 'ESTAI', V2(780, 340), 'green', anchorT(3).lerp(anchorD(3), 0.55));
  } else if (sh === 8) { // não dá pra concretar tudo no ar
    abut.forEach(a => a.visible = false); setDeck(3, 0);
    ghost.visible = true; mats.ghost.opacity = 0.55 * eo(r(t, S(8) + 0.1, S(8) + 0.5));
    K = camKeys([[TS(8), V(19, 8, 27), V(0, 4.0, 0), 42], [S(9) - 0.2, V(18, 7.5, 25), V(0.5, 4.0, 0), 42]], t);
    st.html += pill(t, S(8) + 0.3, 'TUDO DE UMA VEZ?', V2(540, 360), 'red', V(-6, DY, DZ));
    st.html += xmark(t, wt(8, 'ar') - 0.1, V(6, DY, DZ));
  } else if (sh === 9) { // pedaço por pedaço: aduela
    abut.forEach(a => a.visible = false);
    const R = 3 + 3 * r(t, S(9) + 0.2, wt(9, 'isso') - 0.1); const { tipR } = setDeck(R, 0);
    travR.visible = true; travR.position.set(Math.max(1.4, tipR - 0.6), DY, DZ);
    worker.g.visible = true; worker.g.position.set(tipR - 1.6, DY, DZ + 0.3); worker.g.rotation.set(0, 1.2, 0); pose(worker, { armR: [-0.8, -0.2] }); idle(worker, t);
    const kNew = Math.ceil(R - 0.001);
    K = [0, V(tipR + 1.5, 4.6, 14), V(tipR - 2.2, 3.8, 0), 42];
    st.html += pill(t, wt(9, 'pedaço') - 0.05, 'PEDAÇO POR PEDAÇO', V2(540, 360), 'orange', null, wt(9, 'isso') - 0.2);
    st.html += pill(t, wt(9, 'aduela') - 0.05, 'ADUELA', V2(700, 420), 'green', V(kNew * SEG - 0.3, DY - 0.15, DZ));
  } else if (sh === 10) { // PIADA: só de um lado -> torre tomba
    abut.forEach(a => a.visible = false); const { tipR } = setDeck(6, 0);
    travR.visible = true; travR.position.set(tipR - 0.6, DY, DZ);
    const tt = wt(10, 'tomba') - 0.35; const a = 0.16 * eo(r(t, tt, tt + 0.5)) + 0.01 * Math.sin(t * 9) * r(t, tt + 0.4, tt + 0.6);
    bridge.rotation.z = -a;
    worker.g.visible = true; worker.g.position.set(tipR - 1.8, DY + 0.5 * Math.sin(Math.PI * r(t, tt + 0.1, tt + 0.6)), DZ + 0.3); worker.g.rotation.set(0, 0.6, 0);
    pose(worker, t > tt ? { armL: [-2.8, 0.6], armR: [-2.8, -0.6], eyes: 1.7, legL: 0.5, legR: -0.4 } : {});
    for (let i = 0; i < 2; i++) placeArrow(dnArrows[i], V(5 + i * 2.5, 6.2, DZ), V(0, -1, 0), 1.2 * eo(r(t, wt(10, 'lado') - 0.2, wt(10, 'lado') + 0.3)) + 0.01, t < tt);
    if (t > tt) st.shake = 0.4 * (1 - r(t, tt + 0.3, tt + 0.9));
    K = camKeys([[TS(10), V(5, 7, 30), V(3.5, 5.5, 0), 42], [S(11) - 0.2, V(5.5, 7, 29), V(3.5, 5.5, 0), 42]], t);
    st.html += pill(t, wt(10, 'lado') - 0.05, 'SÓ DE UM LADO', V2(760, 400), 'orange', V(6, DY, DZ), tt);
    if (t > tt + 0.2) st.html += `<div style="position:absolute;left:340px;top:330px;width:400px;text-align:center;font-weight:900;font-size:150px;color:#fff;background:#d32424;border:10px solid #fff;border-radius:30px;transform:rotate(-8deg) scale(${back(r(t, tt + 0.2, tt + 0.5))});box-shadow:0 10px 30px rgba(0,0,0,.4)">NÃO!</div>`;
  } else if (sh === 11) { // balanço sucessivo
    const tb = wt(11, 'isso') - 0.1;
    bridge.rotation.z = -0.16 * (1 - eo(r(t, TS(11), TS(11) + 0.5)));
    const L = 6 * sm(r(t, TS(11) + 0.2, tb)), R = 6 + 1 * sm(r(t, tb, E(11)));
    const { tipR, tipL } = setDeck(R, L + r(t, tb, E(11)));
    abut.forEach(a => a.visible = false);
    travR.visible = travL.visible = true; travR.position.set(tipR - 0.6, DY, DZ); travL.position.set(-tipL + 0.6, DY, DZ);
    K = camKeys([[TS(11), V(17, 8, 28), V(0, 5.2, 0), 42], [S(12) - 0.2, V(15, 8, 29), V(0, 5.4, 0), 42]], t);
    st.html += pill(t, wt(11, 'dois') - 0.05, 'OS DOIS LADOS', V2(540, 360), 'orange', null, tb - 0.15);
    st.html += pill(t, wt(11, 'balanço') - 0.05, 'BALANÇO SUCESSIVO', V2(540, 360), 'green', V(-4, DY + 0.2, DZ));
    st.html += balanca(t, S(11) + 0.4, tb - 0.15);
  } else if (sh === 12) { // 138 m, prédio de 40 andares
    const u = sm(r(t, TS(12), TS(12) + 0.6)); setDeck(7 + u, 7 + u); abut.forEach(a => KIT.grow(a, u));
    tall.visible = true; KIT.grow(tall, sm(r(t, wt(12, 'prédio') - 0.3, wt(12, 'prédio') + 0.4)));
    K = camKeys([[TS(12), V(-10, 6, 32), V(-1.5, 6.5, 0), 42], [S(13) - 0.2, V(-13, 6.5, 33), V(-2.5, 6.6, 0), 42]], t);
    st.html += dim(t, wt(12, '138') - 0.25, V(1.2, 0, FZ - 0.5), V(1.2, MH, FZ - 0.5), '138 m', 1);
    st.html += pill(t, wt(12, 'prédio') + 0.1, '40 ANDARES', V2(330, 380), 'orange', V(-6.5, 10, -4.5));
  } else if (sh === 13) { // pendurada
    const tp = wt(13, 'pendurada') - 0.15;
    K = camKeys([[TS(13), V(10, 4.5, 17), V(5.5, 4.0, 0), 42], [S(14) - 0.2, V(9, 4.0, 15.5), V(5.5, 4.2, 0), 42]], t);
    for (let i = 0; i < 5; i++) { const k = 2 + i; const a = anchorD(k), b = anchorT(k); placeArrow(upArrows[i], a.clone().add(V(0, 0.4, 0.3)), b.clone().sub(a), 1.3 * eo(r(t, tp - 0.3 + i * 0.07, tp + 0.2 + i * 0.07)) + 0.01); }
    st.html += xmark(t, wt(13, 'apoiada') - 0.1, V(6.5, WL + 0.6, DZ), tp - 0.1);
    st.html += pill(t, wt(13, 'apoiada') - 0.05, 'NÃO FICA APOIADA', V2(540, 1060), 'red', null, tp - 0.15);
    st.html += pill(t, tp + 0.05, 'PENDURADA!', V2(540, 360), 'green', anchorT(5).lerp(anchorD(5), 0.6));
  } else { // parabéns + CTA (+ tela final por cima)
    driveCars(t); const u = r(t, TS(14), END);
    K = [0, V(3 + Math.sin(-0.4 + u * 0.8) * 30, 8, 1.5 + Math.cos(-0.4 + u * 0.8) * 30), V(2, 5.0, 0), 42];
    crane.g.visible = false;
    if (sh === 14) { st.html += big(t, wt(14, 'parab') - 0.05, 'PARABÉNS!', 300, '#FFD21F', 120); st.html += big(t, wt(14, 'constr') - 0.05, 'VOCÊ CONSTRUIU UMA<br>PONTE ESTAIADA', 450, '#fff', 74); st.html += confetti(t, wt(14, 'parab')); }
    if (sh >= 15) st.html += ctaCard(t);
  }
  if (!(sh === 4 || sh === 5)) crane.g.visible = false;
  st.cam = K; return st;
}
function selo(t) { const k = back(r(t, 0.05, 0.4)), o = 1 - r(t, S(0) - 0.3, S(0) - 0.05);
  return `<div style="position:absolute;left:0;right:0;top:330px;text-align:center;opacity:${o};transform:scale(${0.5 + 0.5 * k})">
   <div style="display:inline-block;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:92px;letter-spacing:6px;padding:14px 50px;border-radius:70px;box-shadow:0 12px 40px rgba(0,0,0,.45)">DO ZERO</div>
   <div style="font-family:InterD;font-weight:900;font-size:170px;color:#fff;line-height:1.1;text-shadow:0 8px 30px rgba(0,0,0,.6)">#03</div></div>`; }
function balanca(t, t0, t1) { if (t < t0 || t > t1 + 0.2) return ''; const k = pop(t, t0) * (1 - r(t, t1, t1 + 0.2)); const a = 8 * Math.sin(t * 2.2) * (1 - r(t, t0, t1));
  return `<svg style="position:absolute;left:390px;top:450px;transform:scale(${k})" width="300" height="220" viewBox="0 0 300 220"><g transform="rotate(${a} 150 60)"><rect x="20" y="54" width="260" height="12" rx="6" fill="#FFD21F"/>
   <path d="M30 66 L10 130 H70 Z M270 66 L250 130 H310 Z" fill="none" stroke="#FFD21F" stroke-width="6"/><rect x="0" y="128" width="80" height="12" rx="6" fill="#FFD21F"/><rect x="230" y="128" width="80" height="12" rx="6" fill="#FFD21F"/></g>
   <rect x="142" y="60" width="16" height="140" fill="#fff"/><rect x="100" y="196" width="100" height="16" rx="8" fill="#fff"/></svg>`; }
function ctaCard(t) { const t0 = TS(15); if (t < t0 || t > window.F_END / FPS + 0.2) return '';
  const items = [['curte', '#ff4d6d', '<path d="M50 84 L18 52 Q6 38 16 24 Q28 10 44 22 L50 28 L56 22 Q72 10 84 24 Q94 38 82 52 Z" fill="#ff4d6d"/>', 'CURTE'],
    ['salva', '#FFD21F', '<path d="M26 12 H74 V88 L50 70 L26 88 Z" fill="#FFD21F"/>', 'SALVA'],
    ['manda', '#4aa3ff', '<path d="M10 46 L90 12 L62 88 L48 56 Z" fill="#4aa3ff"/>', 'MANDA'],
    ['comenta', '#3dd17a', '<path d="M14 18 H86 V66 H46 L24 86 V66 H14 Z" fill="#3dd17a"/>', 'COMENTA']];
  let h = '<div style="position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;gap:26px">';
  for (const [w, c, svg, lab] of items) { const k = back(r(t, wt(15, w) - 0.15, wt(15, w) + 0.15));
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
window.renderFrame = f => {
  const t = f / FPS; const st = world(t); const K = st.cam;
  let p = K[1].clone(), q = K[2].clone();
  if (st.shake > 0) { const a = st.shake * 0.12; p.add(V(noise(t * 2.5) * a, noise(t * 2.8, 1.3) * a, 0)); }
  p.add(V(Math.sin(t * 0.7) * 0.05, Math.sin(t * 0.9) * 0.04, 0));
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.setViewOffset(W, H, 0, 260, W, H);
  cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(2, 0, 0); sun.position.set(10, 22, 14);   // luz FIXA
  R.render(scene, cam);
  canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`;
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = 4.5, dist = 30) => {
  const t = 5; world(-1); base(); setDeck(6, 6); travR.visible = travL.visible = true; travR.position.set(6 * SEG + SEG / 2 - 0.6, DY, DZ); travL.position.set(-(6 * SEG + SEG / 2) + 0.6, DY, DZ);
  abut.forEach(a => a.visible = false); crane.g.visible = true; crane.set({ giro: 0.9, desce: 3 });
  worker.g.visible = true; worker.g.position.set(8, DY, DZ + 0.3); worker.g.rotation.set(0, 0.8, 0); pose(worker, { armR: [-0.8, -0.2] });
  cam.clearViewOffset(); cam.position.set(6, 3.5, dist); cam.fov = 42; cam.up.set(0, 1, 0); cam.lookAt(V(1.5, cy, 0)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(2, 0, 0); sun.position.set(10, 22, 14); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 30%,rgba(14,22,34,0) 46%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:270px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:64px;letter-spacing:6px;padding:14px 40px;border-radius:50px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:250px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:120px;line-height:1">#03</div>
   <div style="position:absolute;left:110px;right:80px;top:420px;font-family:InterD;font-weight:900;font-size:104px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Como se constrói uma <span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">ponte estaiada</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

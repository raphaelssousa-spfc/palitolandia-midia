// ================= TÚNEL DE METRÔ: história =================
const wt = (i, pre) => { const w = TM.words.find(w => w.p === i && w.w.toLowerCase().replace(/[^a-zà-ú0-9@]/g, '').startsWith(pre)); return w ? w.s : S(i); };
const NP = TM.phrases.length;
const shotOf = t => { if (t < S(0) - 0.1) return -1; let k = 0; for (let i = 1; i < NP; i++) if (t >= S(i) - 0.1) k = i; return k; };
const TS = i => S(i) - 0.1;
function V2(x, y) { return { x, y }; }
truck.g.scale.setScalar(0.6);
// ---------- estados ----------
function setCore(xf) { core.visible = xf < XE + 60; core.position.x = xf; }
function setRings(xEnd, nExtra = 0) { // anéis inteiros até xEnd; nExtra = anel seguinte com peças parciais (0..3)
  let n = 0; rings.forEach((rg, i) => { const ok = XT0 + (i + 1) * RW <= xEnd + 1e-6; rg.g.visible = ok; rg.segs.forEach(s => { s.visible = true; s.position.set(0, 0, 0); }); if (ok) n = i + 1; });
  return n; }
function setTBM(xt, giro, o = {}) { tbm.g.visible = true; tbm.g.position.set(xt, o.y ?? TY, 0); tbm.back.visible = !!o.back; tbm.set({ giro, macaco: o.macaco || 0, erector: o.erector ?? 0.3 }); }
function setBelt(x0, x1, t, on = true) { const L = x1 - x0; belt.visible = on && L > 0.1; belt.position.x = (x0 + x1) / 2; belt.scale.x = Math.max(0.01, L);
  blobs.forEach((b, i) => { const u = ((i / blobs.length) + t * 0.22) % 1; b.visible = belt.visible; b.position.set(x1 - u * L, TY + 0.98, -0.6); }); }
function driveCars(t, stop = false) { cars.forEach((c, i) => { const dir = i % 2 ? -1 : 1; const x = -7 + (((t * (stop ? 0 : 2.6) * dir + i * 6.3) % 36) + 36) % 36; c.g.visible = true;
  c.g.position.set(x, 0.05, dir > 0 ? -1.55 : -3.05); c.g.rotation.set(0, dir > 0 ? 0 : Math.PI, 0); c.set({ roda: t * 6 }); }); }
function base(t) {
  tbm.g.visible = false; setCore(XT0); setRings(XT0 - 1); belt.visible = false; blobs.forEach(b => b.visible = false);
  floorS.visible = false; train.visible = false; worker.g.visible = false; shovel.visible = false; pieces.forEach(c => c.visible = false); pile.visible = false; dust.update(0);
  sink.position.y = 0; sink.rotation.set(0, 0, 0); [...dnArrows, ...fwArrows].forEach(a => a.visible = false);
  crane.set({ giro: 0, desce: 6 }); bucket.position.y = -6.9; bucketDirt.visible = false; driveCars(t);
}
function finished(x) { setCore(XE + 70); setRings(XE); floorS.visible = true; train.visible = true; train.position.x = x; }
function hide(ws) { ws.g.visible = false; }
function world(t) {
  const sh = shotOf(t); const st = { cam: null, shake: 0, vig: 0.3, html: '' };
  base(t); let K;
  if (sh === -1) { // ABERTURA: metrô pronto, giro rápido + selo
    finished(2 + t * 4); const u = r(t, 0, S(0) - 0.1); const a = lerp(-0.8, 0.1, eo(u));
    K = [0, V(-2 + Math.sin(a) * 24, -1 - u * 1.5, Math.cos(a) * 24), V(-2, -4.2, 0), 44];
    st.html += selo(t);
  } else if (sh === 0) { // cava à mão
    const xf = XT0 + 2.8 * eo(r(t, TS(0) + 0.3, wt(0, 'túnel'))); setCore(xf);
    worker.g.visible = true; shovel.visible = true; worker.g.position.set(xf - 0.55, TY - 1.72, -0.55); worker.g.rotation.set(0, Math.PI / 2, 0);
    const sw = Math.sin(t * 2 * Math.PI * 1.6); pose(worker, { armR: [-1.0 + 0.35 * sw, -0.2], armL: [-0.8 + 0.3 * sw, 0.2], lean: 0.25 });
    K = camKeys([[TS(0), V(-9, 2.0, 22), V(-9.5, -1.8, 0), 42], [wt(0, 'cidade') + 0.5, V(-9.3, 1.6, 21), V(-9.7, -2.0, 0), 42], [wt(0, 'túnel') - 0.1, V(-10, -3.5, 14), V(-10.3, -5.6, 0), 42], [S(1) - 0.2, V(-10.3, -4.3, 11.5), V(-10.5, -6.2, 0), 42]], t);
    st.html += pill(t, wt(0, 'cidade') - 0.05, 'CIDADE', V2(780, 330), '', V(-6, 1.2, -4), wt(0, 'túnel') - 0.2);
    st.html += pill(t, wt(0, 'túnel') - 0.05, 'TÚNEL?', V2(300, 1000), '', V(xf - 1.2, TY - 0.6, -0.6));
  } else if (sh === 1) { // desaba + rua afunda
    const xf = XT0 + 2.8; setCore(xf); const td = wt(1, 'desaba') - 0.25, tr = wt(1, 'rua') - 0.15;
    worker.g.visible = true; worker.g.position.set(xf - 0.55 - 0.7 * eo(r(t, td + 0.2, td + 0.6)), TY - 1.72, -0.55); worker.g.rotation.set(0, Math.PI / 2, 0);
    pose(worker, t > td + 0.15 ? { armL: [-2.6, 0.5], armR: [-2.6, -0.5], eyes: 1.7 } : {});
    pieces.forEach((c, i) => { const t0 = td + i * 0.07; c.visible = t > t0; const u = r(t, t0, t0 + 0.45); c.position.set(xf - 0.4 - (i % 4) * 0.55, TY + RT - 0.3 - (2.9 - 0.12 * (i % 3)) * ei(u), -0.3 - (i % 3) * 0.45); c.rotation.set(i, u * 2, 0); });
    dust.g.position.set(xf - 1.2, TY - RT + 0.2, -0.6); dust.update(r(t, td + 0.4, td + 1.6)); if (t > td + 0.4) st.shake = 0.5 * (1 - r(t, td + 0.5, td + 1.0));
    const dd = 0.45 * eo(r(t, tr, tr + 0.5)); sink.position.y = -dd; sink.rotation.z = 0.05 * eo(r(t, tr, tr + 0.5));
    driveCars(t, true); cars[0].g.position.set(-9.6, 0.05 - dd * 0.9, -1.55); cars[0].g.rotation.set(0, 0, 0.12 * eo(r(t, tr + 0.1, tr + 0.5)));
    for (let i = 0; i < 3; i++) placeArrow(dnArrows[i], V(-10.6 + i * 1.0, 2.2, -2.0), V(0, -1, 0), 1.2 * eo(r(t, tr + i * 0.08, tr + 0.4)) + 0.01);
    if (t > tr + 0.3) st.shake = Math.max(st.shake, 0.4 * (1 - r(t, tr + 0.35, tr + 0.8)));
    K = camKeys([[TS(1), V(-10.3, -4.3, 11.5), V(-10.5, -6.2, 0), 42], [tr - 0.15, V(-10.3, -4.0, 12), V(-10.5, -5.9, 0), 42], [tr + 0.35, V(-10, 1.8, 20), V(-10, -2.8, 0), 42], [S(2) - 0.2, V(-10, 2.0, 21), V(-10, -2.8, 0), 42]], t);
    st.html += pill(t, td + 0.1, 'DESABA!', V2(300, 1010), 'red', V(xf - 1.2, TY - 0.8, -0.4), tr - 0.1);
    st.html += pill(t, tr + 0.1, 'A RUA AFUNDA!', V2(560, 340), 'red', V(-9.5, 0, -1.5));
  } else if (sh === 2) { // tubo de aço: tatuzão desce no poço e começa a cavar
    const tl = TS(2) + 0.1, td = tl + 1.1, ti = wt(2, 'isso') - 0.1;
    const y = TY + 12 * (1 - eo(r(t, tl, td))); const xt = XS + LS / 2 + 2.6 * sm(r(t, td + 0.2, E(2)));
    setTBM(xt, (t - td) * 1.4); tbm.g.position.y = y; setCore(Math.max(XT0, xt + 0.42));
    crane.set({ giro: 0, desce: lerp(1, 6, r(t, tl, td)) }); bucket.position.y = -99;
    dust.g.position.set(xt + 0.5, TY - RT + 0.3, -0.6); dust.update(r(t, td + 0.3, td + 1.6));
    if (t > td - 0.05) st.shake = 0.4 * (1 - r(t, td, td + 0.5));
    K = camKeys([[TS(2), V(-12, 0.5, 24), V(-12.5, -3.2, 0), 42], [td + 0.2, V(-11.5, -2.5, 19), V(-12, -5.0, 0), 42], [S(3) - 0.2, V(-10.5, -3.5, 15.5), V(-10.5, -6.0, 0), 42]], t);
    st.html += pill(t, wt(2, 'tubo') - 0.05, 'TUBO DE AÇO', V2(760, 360), 'orange', V(xt - 1.6, y + 1.0, -0.6), ti - 0.2);
    st.html += pill(t, ti + 0.15, 'TATUZÃO', V2(540, 380), 'green', V(xt - 1.6, TY + 1.2, -0.6));
  } else if (sh === 3) { // cabeça de corte
    const xt = lerp(-10.8, -5.6, r(t, TS(3), E(3) + 0.2)); setTBM(xt, (t - TS(3)) * 1.6); setCore(xt + 0.42);
    dust.g.position.set(xt + 0.5, TY - RT + 0.3, 0.2); dust.update(r(t, TS(3) + 0.2, E(3) + 0.4));
    K = camKeys([[TS(3), V(xt + 5.5, TY + 2.2, 9.5), V(xt - 0.4, TY, 0), 44], [S(4) - 0.2, V(xt + 4.6, TY + 1.6, 8.6), V(xt - 0.2, TY, 0), 44]], t);
    st.html += pill(t, wt(3, 'roda') - 0.05, 'RODA GIRANDO', V2(700, 330), 'orange', V(xt + 0.2, TY + 1.2, 0.5), wt(3, 'isso') - 0.2);
    st.html += pill(t, wt(3, 'cabeça') - 0.05, 'CABEÇA DE CORTE', V2(560, 340), 'green', V(xt + 0.2, TY + 1.0, 0.6));
  } else if (sh === 4) { // atrás: sem parede
    const xt = -5.4 + 0.3 * r(t, TS(4), E(4)); setTBM(xt, (t - TS(4)) * 1.6); setCore(xt + 0.42);
    const tw = wt(4, 'parede') - 0.3;
    pieces.forEach((c, i) => { const t0 = tw + (i % 4) * 0.12 + Math.floor(i / 4) * 0.5; c.visible = t > t0; const u = r(t, t0, t0 + 0.5); c.position.set(-11.6 + i * 0.5, TY + RT - 0.3 - 2.9 * ei(u), -0.4 - (i % 3) * 0.4); c.rotation.set(i, u * 2, 0); });
    for (let i = 0; i < 3; i++) placeArrow(dnArrows[i], V(-11.2 + i * 1.1, TY + 0.7, -0.2), V(0, -1, 0), 1.0 * eo(r(t, tw + i * 0.08, tw + 0.4)) + 0.01);
    K = camKeys([[TS(4), V(-8.0, TY + 2.5, 17), V(-8.2, TY + 0.3, 0), 42], [S(5) - 0.2, V(-8.8, TY + 2.0, 15), V(-8.8, TY + 0.2, 0), 42]], t);
    st.html += pill(t, wt(4, 'tubo') - 0.05, 'ATRÁS DO TUBO', V2(540, 330), 'orange', V(-10.5, TY + RT - 0.2, -0.5), tw - 0.1);
    st.html += pill(t, tw + 0.1, 'SEM PAREDE!', V2(540, 330), 'red', V(-10.5, TY + RT - 0.2, -0.5));
  } else if (sh === 5) { // aduelas montadas peça por peça
    const xt = -5.1; setTBM(xt, (t - TS(5)) * 1.6, { erector: 0 }); setCore(xt + 0.42);
    const tail = xt - LS; const nFull = Math.floor((tail - XT0) / RW) - 1;      // último anel = o que o braço monta
    const tq = r(t, TS(5) + 0.1, TS(5) + 1.4); const nShow = Math.floor(nFull * tq); setRings(XT0 + nShow * RW);
    const tp = wt(5, 'peça') - 0.4, tI = wt(5, 'isso') - 0.1; const last = rings[nFull]; last.g.visible = t > tp;
    let erA = -0.9;
    last.segs.forEach((s, i) => { const t0 = tp + i * 0.45, u = eo(r(t, t0, t0 + 0.35)); s.visible = t > t0; const m = s.userData.mid; const d = (1 - u) * 0.7; s.position.set(0, -Math.sin(m) * d, Math.cos(m) * d); if (t > t0 - 0.15) erA = m; });
    tbm.set({ giro: (t - TS(5)) * 1.6, erector: erA });
    K = camKeys([[TS(5), V(-9.5, TY + 1.8, 15.5), V(-9.0, TY, 0), 42], [tp, V(-8.6, TY + 1.2, 10.5), V(-8.6, TY, 0), 42], [S(6) - 0.2, V(-8.8, TY + 1.1, 10), V(-8.8, TY, 0), 42]], t);
    st.html += pill(t, wt(5, 'braço') - 0.05, 'BRAÇO', V2(820, 380), 'orange', V(tail + 0.35, TY + 0.6, -0.5), tI - 0.2);
    st.html += pill(t, wt(5, 'anéis') - 0.05, 'ANÉIS DE CONCRETO', V2(420, 1010), 'orange', V(-10.5, TY - 1.2, -0.3), tI - 0.2);
    st.html += pill(t, tI + 0.1, 'ADUELAS', V2(540, 360), 'green', V(XT0 + nFull * RW + 0.25, TY + 1.4, -0.4));
  } else if (sh === 6) { // macacos empurram
    const t0 = TS(6) + 0.3, t1 = wt(6, 'isso') - 0.2; const xt = -5.1 + 0.5 * sm(r(t, t0, t1));
    const nR = setRings(-5.1 - LS + 0.01); const xr = XT0 + nR * RW;
    setTBM(xt, (t - TS(6)) * 1.6, { macaco: (xt - LS + 0.15) - xr }); setCore(xt + 0.42);
    for (let i = 0; i < 3; i++) placeArrow(fwArrows[i], V(xt - LS + 0.2, TY - 1.0 + i * 1.0, 0.3), V(1, 0, 0), 1.4 * eo(r(t, t0 + i * 0.08, t0 + 0.5)) + 0.01, t < E(6));
    K = camKeys([[TS(6), V(-7.8, TY + 1.4, 11), V(-8.0, TY, 0), 42], [S(7) - 0.2, V(-7.2, TY + 1.2, 10), V(-7.6, TY - 0.1, 0), 42]], t);
    st.html += pill(t, wt(6, 'empurra') - 0.05, 'EMPURRA!', V2(780, 360), 'orange', V(xt - LS + 0.9, TY + 1.0, 0.3), t1);
    st.html += pill(t, wt(6, 'macacos') - 0.05, 'MACACOS HIDRÁULICOS', V2(540, 340), 'green', V(xt - LS - 0.2, TY + 1.4, -0.5));
  } else if (sh === 7) { // PIADA: terra sem saída, operário soterrado
    const xt = -4.6; setTBM(xt, (t - TS(7)) * 1.6); setCore(xt + 0.42); setRings(xt - LS + 0.01);
    const tg = TS(7) + 0.2, tn = wt(7, 'ir') - 0.2; const u = eo(r(t, tg, tn));
    pile.visible = true; pile.position.set(xt - LS - 1.5, TY - RT + 0.15, -1.0); pile.scale.set(0.3 + 0.7 * u, Math.max(0.05, u), 0.3 + 0.7 * u);
    worker.g.visible = true; worker.g.position.set(xt - LS - 1.5, TY - 1.72, -0.35); worker.g.rotation.set(0, 0.5, 0);
    pose(worker, t > tn ? { armL: [-2.8, 0.6], armR: [-2.8, -0.6], eyes: 1.8 } : { eyes: 1 + 0.6 * u });
    dust.g.position.set(xt - LS - 1.0, TY - RT + 0.4, -0.7); dust.update(r(t, tg, tg + 1.4));
    K = camKeys([[TS(7), V(-9.4, TY + 1.0, 10), V(-9.4, TY - 0.3, 0), 42], [S(8) - 0.2, V(-9.4, TY + 0.5, 8), V(-9.4, TY - 0.5, 0), 42]], t);
    st.html += pill(t, wt(7, 'terra') - 0.05, 'E A TERRA?', V2(540, 330), 'orange', null, tn);
    if (t > tn) st.html += `<div style="position:absolute;left:340px;top:330px;width:400px;text-align:center;font-weight:900;font-size:150px;color:#fff;background:#d32424;border:10px solid #fff;border-radius:30px;transform:rotate(-8deg) scale(${back(r(t, tn, tn + 0.3))});box-shadow:0 10px 30px rgba(0,0,0,.4)">NÃO!</div>`;
  } else if (sh === 8) { // esteira leva pra fora
    const xt = lerp(-4.6, -0.6, r(t, TS(8), E(8) + 0.2)); setTBM(xt, (t - TS(8)) * 1.6, { back: true }); setCore(xt + 0.42); setRings(xt - LS + 0.01);
    const tb = wt(8, 'esteira') - 0.3, tf = wt(8, 'fora') - 0.3; const x1 = xt - LS + 0.25; setBelt(lerp(x1, XS - 0.8, eo(r(t, tb, tb + 0.6))), x1, t);
    const ub = r(t, tf - 0.4, tf + 1.0); const dsc = lerp(15.6, 2.5, sm(ub)); crane.set({ giro: 0, desce: dsc }); bucket.position.y = -dsc - 0.85; bucketDirt.visible = true; crane.g.updateMatrixWorld(true);
    K = camKeys([[TS(8), V(-8.5, TY + 1.8, 14), V(-7.5, TY + 0.3, 0), 42], [tf - 0.5, V(-12, -3.0, 22), V(-11.5, -4.2, 0), 42], [S(9) - 0.2, V(-13.5, 0.5, 26), V(-13, -2.0, 0), 42]], t);
    st.html += pill(t, wt(8, 'esteira') - 0.05, 'ESTEIRA', V2(760, 360), 'orange', V(-7.5, TY + 1.0, -0.6), wt(8, 'isso') - 0.2);
    st.html += pill(t, wt(8, 'correia') - 0.05, 'CORREIA TRANSPORTADORA', V2(540, 1010), 'green', V(-10, TY + 1.0, -0.6));
    st.html += pill(t, tf + 0.1, 'PRA FORA', V2(320, 360), 'orange', bucket.getWorldPosition(V(0, 0, 0)), wt(8, 'correia') - 0.2);
  } else if (sh === 9) { // números
    const xt = 2.0 + 0.4 * r(t, TS(9), E(9)); setTBM(xt, (t - TS(9)) * 1.6, { back: true }); setCore(xt + 0.42); setRings(xt - LS + 0.01); setBelt(XS - 0.8, xt - LS + 0.25, t);
    K = camKeys([[TS(9), V(0.5, TY + 1.5, 16), V(0, TY + 0.2, 0), 42], [S(10) - 0.2, V(-0.5, TY + 1.8, 18.5), V(-0.5, TY + 0.5, 0), 42]], t);
    st.html += pill(t, wt(9, 'são') - 0.05, 'SÃO PAULO', V2(540, 330), 'orange', null, wt(9, 'pesa') - 0.2);
    st.html += dim(t, wt(9, '10') - 0.25, V(xt - 1.0, TY - RT + 0.05, 0.3), V(xt - 1.0, TY + RT, 0.3), '+10 m', 1);
    st.html += pill(t, wt(9, 'pesa') - 0.05, '≈ 2 MIL TONELADAS', V2(540, 330), 'green', V(xt - 2.5, TY + 0.6, -0.6));
  } else if (sh === 10) { // a cidade nem para
    const xt = 6 + 0.4 * r(t, TS(10), E(10)); setTBM(xt, (t - TS(10)) * 1.6, { back: true }); setCore(xt + 0.42); setRings(xt - LS + 0.01); setBelt(XS - 0.8, xt - LS + 0.25, t);
    K = camKeys([[TS(10), V(4, 0.0, 25), V(3.5, -3.4, 0), 42], [S(11) - 0.2, V(5, 0.6, 27), V(4, -3.2, 0), 42]], t);
    st.html += pill(t, wt(10, 'cima') - 0.05, 'A CIDADE NEM PARA', V2(540, 330), 'green', V(4, 0.6, -2.3));
    st.html += pill(t, wt(10, 'segredo') - 0.05, 'TATUZÃO TRABALHANDO', V2(540, 1010), 'orange', V(xt - 1.6, TY, -0.6));
  } else { // parabéns + CTA (+ tela final por cima)
    finished(-4 + (t - TS(11)) * 3); const u = r(t, TS(11), END);
    K = [0, V(-2 + Math.sin(-0.35 + u * 0.7) * 22, -1.2, Math.cos(-0.35 + u * 0.7) * 22), V(-2, -4.0, 0), 44];
    if (sh === 11) { st.html += big(t, wt(11, 'parab') - 0.05, 'PARABÉNS!', 300, '#FFD21F', 120); st.html += big(t, wt(11, 'constr') - 0.05, 'VOCÊ CONSTRUIU UM<br>TÚNEL DE METRÔ', 450, '#fff', 74); st.html += confetti(t, wt(11, 'parab')); }
    if (sh >= 12) st.html += ctaCard(t);
  }
  st.cam = K; return st;
}
function selo(t) { const k = back(r(t, 0.05, 0.4)), o = 1 - r(t, S(0) - 0.3, S(0) - 0.05);
  return `<div style="position:absolute;left:0;right:0;top:330px;text-align:center;opacity:${o};transform:scale(${0.5 + 0.5 * k})">
   <div style="display:inline-block;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:92px;letter-spacing:6px;padding:14px 50px;border-radius:70px;box-shadow:0 12px 40px rgba(0,0,0,.45)">DO ZERO</div>
   <div style="font-family:InterD;font-weight:900;font-size:170px;color:#fff;line-height:1.1;text-shadow:0 8px 30px rgba(0,0,0,.6)">#04</div></div>`; }
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
  cam.position.copy(p); cam.fov = K[3]; cam.up.set(0, 1, 0); cam.setViewOffset(W, H, 0, 260, W, H);
  cam.lookAt(q); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); }
window.renderFrame = f => {
  const t = f / FPS; let st = world(t); let K = st.cam; camSet(K, t, st); st = world(t); K = st.cam;
  camSet(K, t, st);
  sun.target.position.set(0, -3, 0); sun.position.set(8, 22, 16);   // luz FIXA
  R.render(scene, cam);
  canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${st.vig}) 100%)"></div>`;
  ov.innerHTML = st.html + telaFinal(f) + (f < window.F_END ? `<div class="wm">@eng.raphaelserra</div>` : '') + caption(t) + avatarCorner(f)
    + `<div style="position:absolute;inset:0;background:#000;opacity:${cl((f - (F_TOT - 18)) / 18)}"></div>`;
};
await document.fonts.load('900 40px InterD'); await document.fonts.load('800 40px InterD'); await document.fonts.load('800 40px P'); await document.fonts.load('900 40px P'); await document.fonts.load('700 40px P'); await document.fonts.load('600 40px P');

window.renderCover = (cy = -5, dist = 13) => {
  const t = 5; world(-1); base(t); const xt = -2; setTBM(xt, 0.4, { back: true }); setCore(xt + 0.42); setRings(xt - LS + 0.01); setBelt(XS - 0.8, xt - LS + 0.25, t);
  dust.g.position.set(xt + 0.5, TY - RT + 0.3, 0.2); dust.update(0.45);
  cam.clearViewOffset(); cam.position.set(xt + 3.5, cy + 1.2, dist); cam.fov = 44; cam.up.set(0, 1, 0); cam.lookAt(V(xt - 1.5, cy, 0)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  sun.target.position.set(0, -3, 0); sun.position.set(8, 22, 16); R.render(scene, cam); canvas.style.filter = 'none';
  fxd.innerHTML = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,34,.92) 0%,rgba(14,22,34,.78) 30%,rgba(14,22,34,0) 46%,rgba(14,22,34,0) 74%,rgba(14,22,34,.9) 86%)"></div>`;
  const av = window.AV.svg(0, 0, 0);
  ov.innerHTML = `<div style="position:absolute;left:110px;top:270px;background:#FFC20E;color:#111;font-family:InterD;font-weight:900;font-size:64px;letter-spacing:6px;padding:14px 40px;border-radius:50px">DO ZERO</div>
   <div style="position:absolute;right:110px;top:250px;color:#FFC20E;font-family:InterD;font-weight:900;font-size:120px;line-height:1">#04</div>
   <div style="position:absolute;left:110px;right:80px;top:420px;font-family:InterD;font-weight:900;font-size:104px;line-height:1.0;letter-spacing:-4px;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.5)">Como se cava um <span style="display:inline-block;background:#FFC20E;color:#111;padding:0 18px 8px;border-radius:18px;transform:rotate(-2deg)">túnel de metrô</span>?</div>
   <div style="position:absolute;left:110px;top:1560px;display:flex;align-items:center;gap:26px">
    <div style="width:150px;height:150px;box-sizing:border-box;border-radius:75px;overflow:hidden;background:#30343A;border:7px solid #FFC20E">${av}</div>
    <div><div style="font-family:InterD;font-weight:900;font-size:50px;color:#fff">@eng.raphaelserra</div><div style="font-family:InterD;font-weight:600;font-size:34px;color:#c9d2dc">Engenheiro civil explica</div></div></div>`;
};
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }

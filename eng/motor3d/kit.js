// ================= KIT DE PEÇAS 3D (série DO ZERO) =================
// Peças low-poly prontas e PARAMÉTRICAS (tamanho, cor, quantidade). O episódio só MONTA (como Lego) e anima.
// Tudo fica dentro de KIT.* para não colidir com nomes do episódio. Toda peça tem origem na BASE (y = 0 no pé),
// assim KIT.grow(peça, u) "sobe" a peça do chão. Ver KIT.md para a lista completa e exemplos.
const KIT = (() => {
  // ---------- texturas de material (cada uma 1x; repetição por tamanho via UV) ----------
  const T = {};
  const tex = (k, w, h, draw) => (T[k] ||= canvasTex(w, h, draw));
  const stones = (g, w, h, base, cols, n, rmin, rmax) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const x = rnd() * w, y = rnd() * h, rr = rmin + rnd() * (rmax - rmin); g.fillStyle = cols[(rnd() * cols.length) | 0];
      g.beginPath(); for (let a = 0; a < 6; a++) { const an = a / 6 * 7 + rnd() * 0.5, q = rr * (0.7 + rnd() * 0.5); g.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q * 0.8); } g.fill();
      g.strokeStyle = '#00000033'; g.lineWidth = 1.5; g.stroke(); } };
  const SOIL = {
    terra:    ['#a8693f', g => speckle(g, 512, 512, '#a8693f', ['#94592f', '#b97b4c', '#86512c', '#c58d5c'], 2400, 1.5, 6)],
    argila:   ['#b5653a', g => speckle(g, 512, 512, '#b5653a', ['#a3552e', '#c27448', '#9a4f2a'], 1800, 2, 7)],
    areia:    ['#d9b97c', g => speckle(g, 512, 512, '#d9b97c', ['#cdac6c', '#e6c98e', '#c49f62', '#f0d9a6'], 5200, 0.8, 2.2)],
    brita:    ['#8f8b85', g => stones(g, 512, 512, '#6f6b66', ['#9a958e', '#a9a49c', '#85817b', '#b6b1a8'], 900, 7, 16)],
    base:     ['#9d968a', g => stones(g, 512, 512, '#8a8378', ['#a49d91', '#b3ac9f', '#7e776d'], 1600, 3, 8)],
    subbase:  ['#b49a73', g => stones(g, 512, 512, '#a98d66', ['#c2a77f', '#9c8160', '#b89d75'], 1300, 2, 6)],
    asfalto:  ['#2c2c30', g => speckle(g, 512, 512, '#2c2c30', ['#3d3d42', '#47474d', '#232326', '#55555b'], 4200, 0.8, 2.6)],
    asfaltoQ: ['#3b2f2a', g => speckle(g, 512, 512, '#33292a', ['#4a3a33', '#2a2222', '#5a463c'], 4200, 0.8, 2.6)], // quente/fresco
    concreto: ['#bdb9b1', g => speckle(g, 512, 512, '#bdb9b1', ['#aeaaa2', '#cbc7bf', '#a29e96'], 1500, 1, 3.5)],
    concretoF:['#8f8c86', g => speckle(g, 512, 512, '#8f8c86', ['#84817b', '#9c9993', '#787570'], 1500, 1, 3.5)], // fresco/molhado
    rocha:    ['#6f6a66', g => stones(g, 512, 512, '#5f5a56', ['#77726d', '#6a6560', '#837e78', '#55504c'], 220, 18, 44)],
    grama:    ['#7fae4f', g => speckle(g, 512, 512, '#7fae4f', ['#6f9e42', '#8fbe5c', '#5f8e36'], 3000, 1, 3)],
    lama:     ['#5a4232', g => speckle(g, 512, 512, '#5a4232', ['#4c3729', '#6a4f3c'], 1600, 2, 6)],
    tijolo:   ['#b8603e', g => { g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) {
                 g.fillStyle = ['#b8603e', '#a9553a', '#c26a45', '#b05a3b'][(x * 7 + y * 3 + 16) % 4]; g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26); } }],
    madeira:  ['#b07a45', g => { g.fillStyle = '#b07a45'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) { g.fillStyle = '#00000030'; g.fillRect(0, y, 512, 4);
                 for (let i = 0; i < 40; i++) { g.strokeStyle = '#8a5a30' + '55'; g.beginPath(); const yy = y + 6 + rnd() * 54; g.moveTo(0, yy); g.bezierCurveTo(170, yy + 6, 340, yy - 6, 512, yy); g.stroke(); } } }],
  };
  const soilMat = {};
  const matOf = (type, o = {}) => { const k = type + JSON.stringify(o); if (soilMat[k]) return soilMat[k]; const d = SOIL[type] || SOIL.terra;
    const t = tex(type, 512, 512, d[1]); return (soilMat[k] = M('#ffffff', { map: t, roughness: type.startsWith('asfalto') ? 0.7 : 0.9, ...o })); };
  // UV proporcional ao tamanho (1 textura = 1,5 m) para a mesma "escala de grão" em qualquer peça
  function uvScale(geo, sx, sy, sz, tile = 1.5) { const uv = geo.attributes.uv, n = geo.attributes.normal;
    for (let i = 0; i < uv.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
      uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile); } return geo; }
  const box = (w, h, d, mat, parent, x = 0, y = 0, z = 0, cast = true) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); uvScale(g, w, h, d); return mesh(g, mat, parent, x, y, z, cast); };
  const cyl = (rt, rb, h, seg, mat, parent, x = 0, y = 0, z = 0) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, h / 2, 0); return mesh(g, mat, parent, x, y, z); };
  const grp = (parent = scene, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const C = (c, o) => M(c, o);
  const ROT = (o, x = 0, y = 0, z = 0) => { o.rotation.set(x, y, z); return o; };

  // chão (grama/terra) com BURACOS retangulares onde entram os blocos em corte — evita chão sobreposto (= piscada)
  // buracos = [[x, z, w, d], ...] (centro e tamanho). Ex.: KIT.chao({ buracos: [[0, -2.5, 9, 5]] }). Blocos de KIT.corte devem ter a face da frente em z = frente.
  function chao({ tipo = 'grama', w = 400, d = 120, x = 0, frente = 0, buracos = [], parent = scene } = {}) {
    const z = frente - d / 2; // o chão acaba na linha do CORTE (z = frente): na frente dele a câmera vê as camadas por baixo
    const s = new THREE.Shape(); s.moveTo(x - w / 2, -(z - d / 2)); s.lineTo(x + w / 2, -(z - d / 2)); s.lineTo(x + w / 2, -(z + d / 2)); s.lineTo(x - w / 2, -(z + d / 2));
    for (const [bx, bz, bw, bd] of buracos) { const h = new THREE.Path(); h.moveTo(bx - bw / 2, -(bz - bd / 2)); h.lineTo(bx - bw / 2, -(bz + bd / 2)); h.lineTo(bx + bw / 2, -(bz + bd / 2)); h.lineTo(bx + bw / 2, -(bz - bd / 2)); s.holes.push(h); }
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.5, uv.getY(i) / 1.5);
    return mesh(g, matOf(tipo, { side: THREE.DoubleSide }), parent, 0, 0, 0, false);
  }
  // ---------- 1) SOLO EM CORTE ----------
  // camadas = [[tipo, espessura], ...] de CIMA para BAIXO. Topo em y. Retorna {g, layers[], tops[], bottom}
  function corte({ w = 12, d = 6, camadas = [['grama', 0.12], ['terra', 1.2], ['argila', 1.5], ['rocha', 1.5]], x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, 0, z); let top = y; const layers = [], tops = [];
    for (const [type, h] of camadas) { const m = box(w, h, d, matOf(type), g, 0, top - h, 0, false); m.receiveShadow = true; layers.push(m); tops.push(top); top -= h; }
    return { g, layers, tops, bottom: top };
  }
  // pavimento: mesmas camadas, nomes de estrada (de cima p/ baixo). Retorna também cada camada para animar (grow)
  function pavimento({ w = 8, d = 5, x = 0, y = 0, z = 0, parent = scene, camadas = [['asfalto', 0.12], ['base', 0.2], ['subbase', 0.25], ['terra', 1.4]] } = {}) {
    return corte({ w, d, x, y, z, parent, camadas });
  }
  // vala / buraco retangular aberto num bloco de solo (parede de corte na frente). Retorna {g, fill} — fill = terra que sai (KIT.grow para cavar)
  function vala({ w = 2, d = 2, prof = 1.5, larg = 10, comp = 6, tipo = 'terra', x = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, 0, z), mat = matOf(tipo);
    const side = (larg - w) / 2;
    box(side, prof, comp, mat, g, -(w / 2 + side / 2), -prof, 0, false); box(side, prof, comp, mat, g, w / 2 + side / 2, -prof, 0, false);
    box(w, prof, (comp - d) / 2, mat, g, 0, -prof, -(d / 2 + (comp - d) / 4), false);
    box(larg, 1.2, comp, matOf('argila'), g, 0, -prof - 1.2, 0, false);
    const fill = box(w - 0.01, prof, d - 0.01, mat, g, 0, -prof, (comp - d) / 4 * 0 + 0, false);
    return { g, fill };
  }
  // ---------- 2) ESTRUTURA ----------
  function ferragem({ w = 3, d = 3, esp = 0.2, r = 0.018, cor = '#a35a32', camadas = 1, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), mat = C(cor, { roughness: 0.5, metalness: 0.3 });
    for (let k = 0; k < camadas; k++) { const yy = k * 0.12;
      for (let i = -w / 2; i <= w / 2 + 1e-6; i += esp) mesh(new THREE.CylinderGeometry(r, r, d, 6).rotateX(Math.PI / 2), mat, g, i, yy, 0);
      for (let j = -d / 2; j <= d / 2 + 1e-6; j += esp) mesh(new THREE.CylinderGeometry(r, r, w, 6).rotateZ(Math.PI / 2), mat, g, 0, yy + r * 2, j); }
    return g;
  }
  // pilar/coluna de ferragem vertical (4 barras + estribos)
  function armadura({ a = 0.25, h = 3, r = 0.018, esp = 0.2, cor = '#a35a32', x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), mat = C(cor, { roughness: 0.5, metalness: 0.3 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cyl(r, r, h, 6, mat, g, sx * a / 2, 0, sz * a / 2);
    for (let yy = 0.1; yy < h; yy += esp) mesh(new THREE.TorusGeometry(a * 0.72, r * 0.6, 4, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4), mat, g, 0, yy, 0);
    return g;
  }
  function forma({ w = 2, h = 0.5, d = 2, t = 0.04, x = 0, y = 0, z = 0, parent = scene, aberta = 'cima' } = {}) {
    const g = grp(parent, x, y, z), mat = matOf('madeira');
    box(w + 2 * t, h, t, mat, g, 0, 0, d / 2 + t / 2); box(w + 2 * t, h, t, mat, g, 0, 0, -d / 2 - t / 2);
    box(t, h, d, mat, g, w / 2 + t / 2, 0, 0); box(t, h, d, mat, g, -w / 2 - t / 2, 0, 0);
    if (aberta !== 'cima') box(w, t, d, mat, g, 0, -t, 0);
    for (let i = -w / 2; i <= w / 2; i += 0.6) for (const sz of [1, -1]) box(0.06, h + 0.05, 0.06, C('#8a5a30'), g, i, 0, sz * (d / 2 + t + 0.03)); // gravatas
    return g;
  }
  // bloco de concreto (sapata, viga, laje, pilar). fresco=true deixa cinza escuro (molhado)
  const concreto = ({ w = 1, h = 1, d = 1, fresco = false, x = 0, y = 0, z = 0, parent = scene } = {}) => box(w, h, d, matOf(fresco ? 'concretoF' : 'concreto'), parent, x, y, z);
  const parede = ({ w = 3, h = 2.6, d = 0.15, tipo = 'tijolo', x = 0, y = 0, z = 0, parent = scene } = {}) => box(w, h, d, matOf(tipo), parent, x, y, z);
  function tubo({ comp = 4, r = 0.2, cor = '#e07b2a', eixo = 'x', aberto = true, x = 0, y = 0, z = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z), mat = C(cor, { roughness: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.CylinderGeometry(r, r, comp, 20, 1, aberto); const m = mesh(geo, mat, g);
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(r * 1.02, r * 0.12, 6, 20).rotateX(Math.PI / 2), mat, g, 0, s * comp / 2 * 0.98, 0);
    if (aberto) mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, comp * 0.99, 20, 1, true), C('#1d1d1f', { side: THREE.BackSide }), g);
    if (eixo === 'x') g.rotation.z = Math.PI / 2; else if (eixo === 'z') g.rotation.x = Math.PI / 2;
    return g;
  }
  // ---------- 3) MÁQUINAS (amarelo de obra; cor muda por parâmetro) ----------
  const glass = () => C('#9fc6d8', { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.65 });
  function rodas(parent, xs, zs, r, w, mat, y = r) { const out = []; for (const x of xs) for (const z of zs) {
    const wh = grp(parent, x, y, z); mesh(new THREE.CylinderGeometry(r, r, w, 16).rotateX(Math.PI / 2), mat, wh); mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 10).rotateX(Math.PI / 2), C('#c9c9c9', { metalness: 0.4 }), wh); out.push(wh); } return out; }
  function escavadeira({ cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = C('#26262a'), S = C('#7d8288', { metalness: 0.4 });
    for (const s of [-1, 1]) { const tr = box(2.6, 0.55, 0.55, K, g, 0, 0, s * 0.75); mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.56, 12).rotateX(Math.PI / 2), K, g, 1.3, 0.27, s * 0.75); mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.56, 12).rotateX(Math.PI / 2), K, g, -1.3, 0.27, s * 0.75); }
    const turret = grp(g, 0, 0.55, 0); box(2.2, 0.7, 1.7, Y, turret, -0.2, 0, 0); box(0.9, 0.5, 1.6, K, turret, -1.25, 0.1, 0);
    const cab = box(0.9, 0.95, 0.85, Y, turret, 0.45, 0.7, 0.4); box(0.82, 0.7, 0.87, glass(), turret, 0.47, 0.82, 0.4);
    const boom = grp(turret, 0.6, 0.6, -0.35); const b1 = box(0.3, 2.4, 0.3, Y, boom, 0, 0, 0); boom.rotation.z = -0.9;
    const stick = grp(boom, 0, 2.35, 0); box(0.24, 1.8, 0.24, Y, stick, 0, 0, 0); stick.rotation.z = 2.0;
    const bucket = grp(stick, 0, 1.8, 0); const bk = box(0.7, 0.55, 0.7, S, bucket, 0.15, -0.1, 0); for (let i = -0.25; i <= 0.26; i += 0.17) mesh(new THREE.ConeGeometry(0.05, 0.16, 4).rotateZ(Math.PI), S, bucket, 0.45, -0.18, i);
    bucket.rotation.z = 0.6;
    const set = ({ giro = 0, lanca = -0.9, braco = 2.0, cacamba = 0.6 } = {}) => { turret.rotation.y = giro; boom.rotation.z = lanca; stick.rotation.z = braco; bucket.rotation.z = cacamba; };
    return { g, turret, boom, stick, bucket, set };
  }
  function caminhao({ cor = '#e8532b', cacamba = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Cc = C(cor), Cb = C(cacamba), K = C('#26262a');
    box(4.2, 0.25, 1.3, K, g, 0, 0.45, 0); const cab = box(1.2, 1.3, 1.7, Cc, g, 1.55, 0.6, 0); box(0.05, 0.6, 1.5, glass(), g, 2.16, 1.15, 0); box(0.9, 0.5, 1.72, glass(), g, 1.5, 1.2, 0);
    const bed = grp(g, -1.9, 0.75, 0); box(2.9, 0.95, 1.9, Cb, bed, 1.45, 0, 0); box(2.7, 0.05, 1.7, C('#3c3c40'), bed, 1.45, 0.9, 0); // pivô atrás
    const load = box(2.7, 0.5, 1.7, matOf('terra'), bed, 1.45, 0.5, 0); load.visible = false;
    const wheels = rodas(g, [1.5, -0.9, -1.6], [-0.75, 0.75], 0.42, 0.32, K);
    const set = ({ basculha = 0, roda = 0, carga = false, tipoCarga = 'terra' } = {}) => { bed.rotation.z = basculha * 0.85; wheels.forEach(w => w.rotation.z = -roda); load.visible = carga; if (carga) load.material = matOf(tipoCarga); };
    return { g, bed, wheels, load, set };
  }
  function rolo({ cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = C('#26262a'), S = C('#8f959b', { metalness: 0.5, roughness: 0.4 });
    const drum = grp(g, 1.1, 0.6, 0); mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.7, 22).rotateX(Math.PI / 2), S, drum); box(0.3, 0.9, 1.9, Y, g, 1.1, 0.75, 0);
    box(1.9, 0.9, 1.5, Y, g, -0.5, 0.35, 0); const cab = grp(g, -0.6, 1.25, 0); for (const [a, b] of [[-0.45, -0.6], [0.45, -0.6], [-0.45, 0.6], [0.45, 0.6]]) box(0.06, 1.0, 0.06, K, cab, a, 0, b); box(1.1, 0.08, 1.4, Y, cab, 0, 1.0, 0);
    const wheels = rodas(g, [-0.9], [-0.7, 0.7], 0.45, 0.35, K);
    const set = ({ roda = 0 } = {}) => { drum.rotation.z = -roda; wheels.forEach(w => w.rotation.z = -roda * 1.3); };
    return { g, drum, set };
  }
  function betoneira({ cor = '#f4f4f2', tambor = '#e8532b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const K = C('#26262a');
    box(4.4, 0.25, 1.3, K, g, 0, 0.45, 0); box(1.2, 1.3, 1.7, C(cor), g, 1.65, 0.6, 0); box(0.9, 0.5, 1.72, glass(), g, 1.6, 1.2, 0);
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(0.15 + Math.sin(u * Math.PI) * 0.75 + (1 - u) * 0.1, u * 2.8 - 1.4)); }
    const drum = grp(g, -0.6, 1.55, 0); drum.rotation.z = Math.PI / 2 - 0.25; const dm = mesh(new THREE.LatheGeometry(pts, 18), C(tambor), drum);
    for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(0.62, 0.05, 4, 18, Math.PI), C('#f4f4f2'), drum, 0, -0.8 + i * 0.5, 0).rotation.y = i;
    const chute = grp(g, -2.1, 1.1, 0); box(0.9, 0.06, 0.35, C('#8f959b', { metalness: 0.4 }), chute, 0.45, 0, 0); chute.rotation.z = -0.5;
    const wheels = rodas(g, [1.6, -0.9, -1.6], [-0.75, 0.75], 0.42, 0.32, K);
    const set = ({ giro = 0, roda = 0, bica = -0.5 } = {}) => { drum.rotation.y = giro; wheels.forEach(w => w.rotation.z = -roda); chute.rotation.z = bica; };
    return { g, drum, chute, set };
  }
  // vibroacabadora (espalha o asfalto)
  function acabadora({ cor = '#f2b51b', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; const Y = C(cor), K = C('#26262a');
    for (const s of [-1, 1]) box(2.4, 0.5, 0.45, K, g, 0, 0, s * 0.9);
    box(2.2, 0.9, 1.9, Y, g, 0, 0.5, 0); const hop = grp(g, 1.3, 0.6, 0); box(0.9, 0.7, 2.4, Y, hop, 0, 0, 0); const mix = box(0.85, 0.3, 2.3, matOf('asfaltoQ'), hop, 0, 0.42, 0);
    const screed = box(0.6, 0.35, 3.0, Y, g, -1.5, 0.05, 0); box(0.3, 0.9, 0.3, K, g, -0.6, 1.4, 0.5); box(0.7, 0.08, 0.9, Y, g, -0.6, 2.3, 0.3);
    return { g, hop, mix, screed };
  }
  // ---------- 4) RUA, CIDADE E OBRA ----------
  function cone({ x = 0, y = 0, z = 0, parent = scene, s = 1 } = {}) { const g = grp(parent, x, y, z); g.scale.setScalar(s);
    box(0.4, 0.04, 0.4, C('#26262a'), g); const c = cyl(0.03, 0.17, 0.62, 14, C('#ff6b1a'), g, 0, 0.04, 0); cyl(0.115, 0.135, 0.12, 14, C('#ffffff'), g, 0, 0.3, 0); return g; }
  function barreira({ comp = 2, x = 0, y = 0, z = 0, ry = 0, parent = scene, cor = '#e8e8e4' } = {}) { const g = grp(parent, x, y, z); g.rotation.y = ry;
    const s = new THREE.Shape([V2s(-0.3, 0), V2s(0.3, 0), V2s(0.12, 0.3), V2s(0.08, 0.8), V2s(-0.08, 0.8), V2s(-0.12, 0.3)]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: comp, bevelEnabled: false }); geo.translate(0, 0, -comp / 2); mesh(geo, C(cor), g).rotation.y = Math.PI / 2; return g; }
  function V2s(x, y) { return new THREE.Vector2(x, y); }
  function placa({ texto = 'OBRA', cor = '#ff9a1f', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); g.rotation.y = ry;
    cyl(0.03, 0.03, 1.4, 8, C('#9aa3ab', { metalness: 0.5 }), g); const t = canvasTex(256, 256, (c, w, h) => { c.fillStyle = cor; c.beginPath(); c.moveTo(w / 2, 6); c.lineTo(w - 6, h / 2); c.lineTo(w / 2, h - 6); c.lineTo(6, h / 2); c.fill();
      c.lineWidth = 10; c.strokeStyle = '#111'; c.stroke(); c.fillStyle = '#111'; c.font = '900 52px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(texto, w / 2, h / 2); });
    mesh(new THREE.PlaneGeometry(0.7, 0.7), M('#fff', { map: t, side: THREE.DoubleSide }), g, 0, 1.6, 0.04); return g; }
  function poste({ h = 4, x = 0, y = 0, z = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); cyl(0.05, 0.08, h, 8, C('#4a5058'), g); box(0.9, 0.06, 0.08, C('#4a5058'), g, 0.4, h - 0.05, 0);
    box(0.4, 0.1, 0.22, C('#fff3c0', { emissive: '#ffe08a', emissiveIntensity: 0.3 }), g, 0.8, h - 0.15, 0); return g; }
  function arvore({ h = 2.2, r = 1, x = 0, y = 0, z = 0, parent = scene, cor = '#4f8a3a' } = {}) { const g = grp(parent, x, y, z); cyl(0.09, 0.14, h, 7, C('#6e4a2f'), g);
    mesh(new THREE.IcosahedronGeometry(r, 0), C(cor, { flatShading: true }), g, 0, h + r * 0.5, 0); mesh(new THREE.IcosahedronGeometry(r * 0.7, 0), C('#3f7a30', { flatShading: true }), g, r * 0.5, h + r * 0.1, 0.2); return g; }
  function casa({ w = 3, h = 2.4, d = 3, parede = '#efe6d8', telhado = '#c0563a', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) {
    const g = grp(parent, x, y, z); g.rotation.y = ry; box(w, h, d, C(parede), g);
    const roof = new THREE.CylinderGeometry(0.01, w * 0.8, h * 0.55, 4, 1); roof.rotateY(Math.PI / 4); roof.scale(1, 1, d / w); mesh(roof, C(telhado, { flatShading: true }), g, 0, h + h * 0.27, 0);
    box(0.7, 1.3, 0.05, C('#6c4a33'), g, 0, 0, d / 2 + 0.01); for (const s of [-1, 1]) box(0.6, 0.6, 0.05, C('#4d5c66'), g, s * w * 0.3, h * 0.5, d / 2 + 0.01); return g; }
  function carro({ cor = '#3a7bd5', x = 0, y = 0, z = 0, ry = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); g.rotation.y = ry; const K = C('#222');
    box(3.6, 0.55, 1.6, C(cor), g, 0, 0.3, 0); box(1.9, 0.55, 1.45, C(cor), g, -0.2, 0.85, 0); box(1.95, 0.4, 1.47, glass(), g, -0.2, 0.9, 0);
    const wheels = rodas(g, [1.15, -1.15], [-0.78, 0.78], 0.34, 0.25, K); return { g, wheels, set: ({ roda = 0 } = {}) => wheels.forEach(w => w.rotation.z = -roda) }; }
  // ---------- 5) GENTE ----------
  const CAMISAS = ['#ff7a1a', '#2f7fd6', '#2aa35a', '#d63b3b', '#f2c21b', '#7a4fd6'];
  function operario(i = 0, o = {}) { return person({ shirt: CAMISAS[i % CAMISAS.length], helmet: ['#f5f5f2', '#f2c21b', '#ff7a1a'][i % 3], ...o }); }
  // ---------- 6) EFEITOS ----------
  const puffTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  // poeira/fumaça/vapor: n sprites que sobem e somem. update(u) com u 0..1 (use r(t,t0,t1))
  function nuvem({ n = 14, cor = '#c9b49a', x = 0, y = 0, z = 0, raio = 1, parent = scene } = {}) {
    const g = grp(parent, x, y, z); const sp = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: cor, transparent: true, depthWrite: false, opacity: 0 }));
      s.userData = { a: rnd() * 7, d: 0.3 + rnd() * 0.7, h: 0.5 + rnd() * 1.2 }; g.add(s); sp.push(s); }
    const update = u => { g.visible = u > 0 && u < 1; sp.forEach(s => { const d = s.userData; const k = cl(u * 1.2 - d.d * 0.2);
      s.position.set(Math.cos(d.a) * raio * d.d * (0.3 + k), d.h * k, Math.sin(d.a) * raio * d.d * (0.3 + k)); s.scale.setScalar(0.4 + k * 1.4 * raio); s.material.opacity = 0.75 * Math.sin(Math.PI * cl(k)); }); };
    update(0); return { g, update };
  }
  // seta 3D (fluxo de água, carga, empuxo). comprimento L ao longo de +x; gire com ry/rz
  function seta({ L = 1.2, cor = '#2f8cff', x = 0, y = 0, z = 0, ry = 0, rz = 0, parent = scene } = {}) { const g = grp(parent, x, y, z); g.rotation.set(0, ry, rz); const m = C(cor, { emissive: cor, emissiveIntensity: 0.35 });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, L * 0.7, 10).rotateZ(-Math.PI / 2), m, g, L * 0.35, 0, 0); mesh(new THREE.ConeGeometry(0.16, L * 0.3, 14).rotateZ(-Math.PI / 2), m, g, L * 0.85, 0, 0); return g; }
  // ---------- 7) ANIMAÇÃO ----------
  const grow = (o, u, eixo = 'y') => { u = cl(u); o.visible = u > 0.001; o.scale[eixo] = Math.max(0.001, u); return o; };  // peça nasce do chão (origem na base)
  const drop = (o, u, h = 4, y0 = 0) => { o.visible = u > 0; o.position.y = y0 + h * (1 - eo(u)); return o; };          // cai do céu e assenta
  const slide = (o, u, from, to) => { o.position.copy(lv(from, to, sm(u))); return o; };
  const popIn = (o, u) => { const k = back(u); o.visible = u > 0; o.scale.setScalar(Math.max(0.001, k)); return o; };
  return { matOf, SOIL, uvScale, box, cyl, grp, chao, corte, pavimento, vala, ferragem, armadura, forma, concreto, parede, tubo,
    escavadeira, caminhao, rolo, betoneira, acabadora, cone, barreira, placa, poste, arvore, casa, carro, operario, CAMISAS, nuvem, seta, grow, drop, slide, popIn };
})();

// ================= KIT-DEMO: vitrine das peças (não é episódio) =================
KIT.chao({ buracos: [[0, -2.5, 9, 5], [12, -2.5, 9, 5], [24, -2.5, 9, 5]] });
// faixa de solo em corte contínua na frente de tudo (fundo da vitrine)
KIT.corte({ w: 80, d: 0.5, x: 40, z: -0.25 - 5.0, camadas: [['grama', 0.12], ['terra', 3]] });
const ST = [];
// 0: corte de solo + vala + escavadeira cavando
{ const x = 0; KIT.corte({ w: 9, d: 5, x, z: -2.5, camadas: [['grama', 0.12], ['terra', 1.0], ['argila', 1.2], ['areia', 0.8], ['rocha', 1.2]] });
  const ex = KIT.escavadeira({ x: x + 1.6, z: -3.5, ry: -0.5 }); ex.set({ giro: 0.4, lanca: -0.6, braco: 2.2, cacamba: 1.0 });
  KIT.operario(0).g.position.set(x - 2.2, 0, -1); ST.push([V(x + 0.5, 0.6, 10.5), V(x, -1.2, -2.5), 42]); }
// 1: pavimento em camadas + acabadora + rolo
{ const x = 12; KIT.pavimento({ w: 9, d: 5, x, z: -2.5 }); KIT.acabadora({ x: x - 1.5, y: 0, z: -3.5 }); const rl = KIT.rolo({ x: x + 2.5, z: -3.5 }); rl.set({ roda: 1 });
  KIT.cone({ x: x - 3.5, z: -0.6 }); KIT.cone({ x: x - 2.8, z: -0.6 }); KIT.placa({ texto: 'OBRA', x: x + 4, z: -1.2 }); ST.push([V(x + 0.5, 0.9, 10.5), V(x, -0.2, -2.5), 42]); }
// 2: fundação: forma + ferragem + concreto + betoneira
{ const x = 24; KIT.corte({ w: 9, d: 5, x, z: -2.5, camadas: [['terra', 0.6], ['argila', 2]] }); KIT.forma({ w: 2.4, h: 0.5, d: 2.4, x: x - 1.8, y: 0, z: -2.5 });
  KIT.ferragem({ w: 2.2, d: 2.2, esp: 0.22, x: x - 1.8, y: 0.12, z: -2.5, camadas: 2 }); KIT.armadura({ h: 2.6, x: x - 1.8, y: 0.1, z: -2.5 });
  KIT.concreto({ w: 2, h: 0.5, d: 2, fresco: true, x: x + 1.2, z: -2.5 }); KIT.betoneira({ x: x + 2.6, z: -6, ry: 0.3 }).set({ giro: 0.7 });
  KIT.operario(2).g.position.set(x - 0.2, 0, -0.5); ST.push([V(x + 0.3, 1.6, 10.5), V(x, 0.2, -3), 42]); }
// 3: rua/cidade: caminhão basculando, casas, poste, árvore, carro, tubo, barreira, seta, poeira
{ const x = 36; const tr = KIT.caminhao({ x: x - 1, z: -3, ry: 0.15 }); tr.set({ basculha: 0.6, carga: true, tipoCarga: 'brita' });
  KIT.casa({ x: x + 3.4, z: -8 }); KIT.casa({ x: x - 3.8, z: -9, parede: '#d9e6ef', telhado: '#7b5a4a' }); KIT.poste({ x: x + 2.2, z: -4 }); KIT.arvore({ x: x - 3, z: -5 });
  KIT.carro({ x: x + 2.5, z: -0.6, ry: 0.1, cor: '#d63b3b' }); KIT.tubo({ comp: 3, r: 0.3, x: x - 2, y: 0.3, z: -0.4 }); KIT.barreira({ comp: 2.5, x: x + 0.5, z: 0.4 });
  KIT.seta({ x: x - 3.4, y: 1.4, z: -0.4, L: 1.4 }); const nv = KIT.nuvem({ x: x - 2.8, y: 0.2, z: -3, raio: 1.2 }); nv.update(0.45);
  ST.push([V(x + 0.3, 3, 11), V(x, 0.6, -3.5), 42]); }

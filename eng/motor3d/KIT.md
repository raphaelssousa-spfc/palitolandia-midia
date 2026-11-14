# KIT de peças 3D — série DO ZERO

Peças prontas e **paramétricas** em `kit.js` (montado entre `base.js` e o `scene.js` do episódio por `build.py`).
O episódio **não modela mais do zero**: ele MONTA as peças (como Lego), muda tamanho/cor/quantidade e anima.
Só faça peça nova quando o tema exigir algo que não existe (ex.: sonda de poço, viga de ponte) — e, se servir para outros temas,
**acrescente ao kit.js** (com parâmetros) em vez de deixar só no episódio.

Vitrine: `episodios/kit-demo/` (`python3 build.py kit-demo` + `node render.mjs stills stills/k "0,1,2,3"`) → `episodios/kit-demo/vitrine.jpg`.
(Para a vitrine rodar, copie `episodios/kit-demo/timing.json` e `mouth.json` para `web/`.)

## Regra de ouro do corte (não piscar)
- `KIT.chao({ frente: 0, buracos: [[x, z, w, d], ...] })` faz o chão de grama/terra que **termina na linha do corte** (z = frente) e tem buracos onde entram os blocos.
- Blocos de `KIT.corte`/`KIT.pavimento` com a face da frente em z = frente. Assim a câmera na frente vê as camadas por baixo do chão.
- Nunca dois planos no mesmo lugar (z-fighting = piscada). Nunca alternar `material.transparent` entre quadros.

## Peças
| Grupo | Função | Principais parâmetros | Animação |
|---|---|---|---|
| Material | `KIT.matOf(tipo)` | terra, argila, areia, brita, base, subbase, asfalto, asfaltoQ (quente), concreto, concretoF (fresco), rocha, grama, lama, tijolo, madeira | — |
| Chão | `KIT.chao` | tipo, frente, buracos | — |
| Solo em corte | `KIT.corte` | w, d, camadas [[tipo, espessura]...] de cima p/ baixo, x, y, z | `.layers[i]` + `KIT.grow` |
| Pavimento | `KIT.pavimento` | idem (padrão: asfalto, base, sub-base, terra) | camada por camada |
| Vala | `KIT.vala` | w, d, prof, tipo | `.fill` com `KIT.grow` (cavar = encolher) |
| Ferragem (malha) | `KIT.ferragem` | w, d, esp, camadas, cor | `KIT.popIn` / `KIT.drop` |
| Armadura de pilar | `KIT.armadura` | a, h, esp | `KIT.grow` |
| Forma de madeira | `KIT.forma` | w, h, d, aberta | `KIT.drop` |
| Concreto | `KIT.concreto` | w, h, d, fresco | `KIT.grow` (concretagem) |
| Parede | `KIT.parede` | w, h, d, tipo (tijolo/concreto) | `KIT.grow` |
| Tubo | `KIT.tubo` | comp, r, cor, eixo x/y/z, aberto | `KIT.slide` |
| Escavadeira | `KIT.escavadeira` | cor, x, z, ry | `.set({giro, lanca, braco, cacamba})` |
| Caminhão basculante | `KIT.caminhao` | cor, cacamba | `.set({basculha 0..1, roda, carga, tipoCarga})` |
| Rolo compactador | `KIT.rolo` | cor | `.set({roda})` |
| Betoneira (caminhão) | `KIT.betoneira` | cor, tambor | `.set({giro, roda, bica})` |
| Vibroacabadora | `KIT.acabadora` | cor | mover `g.position` |
| Cone / barreira / placa | `KIT.cone`, `KIT.barreira`, `KIT.placa({texto})` | | `KIT.popIn` |
| Poste / árvore / casa / carro | `KIT.poste`, `KIT.arvore`, `KIT.casa`, `KIT.carro` | cores, tamanhos | `.set({roda})` no carro |
| Operário | `KIT.operario(i, opções)` | i escolhe camisa (6 cores) e capacete | `pose()` e `idle()` do base.js |
| Poeira/fumaça/vapor | `KIT.nuvem` | n, cor, raio | `.update(u)` com u = r(t, t0, t1) |
| Seta 3D | `KIT.seta` | L, cor, ry, rz | `KIT.popIn` |
| Animação | `KIT.grow(o,u,eixo)`, `KIT.drop(o,u,h)`, `KIT.slide(o,u,de,para)`, `KIT.popIn(o,u)` | | |

## Exemplos de montagem
- **Estrada:** `chao` + `pavimento` + `acabadora` + `rolo` + `caminhao({tipoCarga:'asfaltoQ'})` + `cone`s.
- **Poço artesiano:** `chao` + `corte` com 6–8 camadas (terra, argila, areia, rocha, rocha...) + `tubo({eixo:'y'})` + peça nova (sonda).
- **Laje:** `forma` + `ferragem({camadas:2})` + `betoneira` + `concreto({fresco:true})` + `operario`s.
- **Bueiro/galeria:** `vala` + `tubo` grande + `seta`s azuis (água) + `pavimento` por cima.

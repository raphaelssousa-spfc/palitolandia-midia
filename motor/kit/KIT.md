# KIT da Palitolândia (peças prontas para montar cada vídeo)

Objetivo: NÃO construir tudo do zero. Cada vídeo parte de um CENÁRIO pronto, usa as ROUPAS e as PLACAS da biblioteca
e só cria o que o tema exige (e, se servir para outros temas, acrescenta aqui).

Vitrine dos cenários: `kit/vitrine/cenarios.jpg`.

## 1) Cenários prontos (copie o projeto inteiro e troque só a história)
| Cenário | Projeto base (motor/<projeto>/) | O que tem no mundo (web/main.js) |
|---|---|---|
| Parque ensolarado + Sol de óculos | `sol` | gramado, morros, árvores, toalha de piquenique, céu com nuvens; set do espaço em x = 300 |
| Espaço (Sol, Terra, órbita) | `sol` | céu estrelado, Sol 3D, Terra, anel de onda, órbita |
| Paris com Torre Eiffel | `torre` | Torre Eiffel em treliça (cresce/inclina), chapéu e gorro, parque com árvores |
| Egito antigo + Lua | `cleopatra` | areia, pirâmide, palmeiras, Lua com bandeira e astronauta, lousa/linha do tempo, museu |
| Universidade (Oxford) | `oxford` | gramado, prédio gótico com torre do relógio |
| Pirâmide asteca (Tenochtitlan) | `oxford` (x = 300) | pirâmide em degraus com templos, lago, palmeiras, andaime (pirâmide "em construção") |
| Rua de Paris (prédio haussmanniano) | `fax` | calçada, prédio creme com telhado de ardósia, postes, toldos, mesa com máquina de fax de pêndulo |
| Rua/loja antiga (lata, isqueiro) | `lata`, `isqueiro` | variações da rua de Paris com vitrine e balcão |
| Laboratório/cozinha (chocolate) | `micro-ondas` | laboratório com lousa, bancada, magnetron |
Para mudar de cidade/época basta trocar cores, placas e alguns objetos do mundo — não refaça o mundo inteiro.

## 2) Personagens (web/roman.js + web/toonbase.js do kit → `cat toonbase.js roman.js > toon.js`)
Roupas prontas: legion, old, toga, civA, civB, civC, civD, workA, workB, pobre, padeiro, juiz, velha, engenheiro, tecnico,
cleo (Cleópatra), astro (astronauta), inventor (cartola + bigode), amigo (chapéu-coco), soldado, aluno/aluno2/aluno3 (beca + capelo),
asteca0/asteca (imperador sem/com cocar). Acessórios por opção: crown, wig, collar, bubble, pack, mortar, feathers, tophat, bowler, stache.
Roupa nova = 1 linha em OUTFITS (+ bloco de desenho se tiver acessório novo). Sempre acrescente AQUI no kit também.

## 3) Placas e efeitos 2D (web/placas.js) — `import * as PL from './placas.js'`
| Função | Para que serve |
|---|---|
| `PL.plate(p, linhas, fundo, cor, tamanhos, rot)` | placa de texto (datas, "EM BREVE", "ATÉ HOJE!", CTA, logo final) — texto ≤ 560 px de largura |
| `PL.pop(f, a)` | entrada com "pulo" (multiplique o s do FX) |
| `PL.sunCard(p, mood, note)` / `PL.watchCard(p, graus)` | Sol de óculos (cool/wink, recado) / cronômetro com fatia |
| `PL.thermo(p, nivel)` | termômetro subindo |
| `PL.phone(p)` / `PL.diagram(p, t, balanço)` / `PL.doodle(p)` | telefone antigo / diagrama "como funciona" (2 máquinas + fio + imagem linha por linha) / desenho no papel |
| `PL.map(p, t)` | mapa (França) com linha tracejada animada entre 2 cidades — troque `FR` e os pontos para outro país |
| `PL.zzz(p, t)` / `PL.qm(p, n)` | "Zzz" de quem dorme / ponto de interrogação |
| `PL.gapCard(p, folga)` / `PL.snowCard(p, f)` | diagrama de folga entre peças / neve caindo |
Texturas pintadas (web/paint.js): linha do tempo (`timeline`), placa (`plaque`), lousa, areia, arenito, Lua, Terra, bandeira, grama, xadrez, madeira, pedra, telhas etc.

## 4) Como usar num vídeo novo
1. Escolha o cenário mais parecido na tabela e copie `motor/<projeto>/` para a pasta de trabalho.
2. Copie por cima `kit/web/roman.js`, `toonbase.js`, `paint.js`, `placas.js` (são a versão mais completa) e rode `cat web/toonbase.js web/roman.js > web/toon.js`.
3. Escreva só o `story.js` novo (cenas, câmeras, atores, placas com PL.*) e ajuste o mundo no `main.js` se precisar.
4. Peça/roupa/placa nova que sirva para outros temas → acrescente no `kit/` e nesta tabela.

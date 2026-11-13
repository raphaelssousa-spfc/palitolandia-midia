# @eng.raphaelserra — manual de produção e postagem automática

Tudo do perfil de engenharia fica na pasta `eng/` (não mexer nos arquivos da Palitolândia na raiz do repositório).
- `eng/fila.json`: fila de postagem · `eng/videos/`: vídeos e capas prontos · `eng/temas.md`: temas usados e ideias
- `eng/motor/`: motor de animação (Remotion + React), roteiros, avatar e ferramentas
Instagram: @eng.raphaelserra (Windsor.ai, conector `instagram`, conta id `17841404396456793`).
ATENÇÃO: a conta `17841460341094597` é a da Palitolândia; nunca postar engenharia nela.

## Regras do dono (obrigatórias)
1. Perfil: engenheiro civil explicando obras, construção e pavimentação para leigos. Tom simples, direto e confiável.
2. Narração SEMPRE com a voz `pm_santa`, ritmo dinâmico (`--vel 1.12` e pausas cortadas: o `tools/narracao.py` já faz isso).
3. Gancho forte no primeiro segundo: pergunta ou frase que desperte curiosidade (ex.: "Por que o asfalto do Brasil tem tanto buraco?").
4. A imagem muda A CADA FRASE (corte, novo enquadramento ou nova ilustração). Nada de imagem parada por mais de uma frase.
5. Muitas figuras, efeitos e sons (whoosh, pop, impacto, caixa registradora, chuva, caminhão: `motor/public/*.wav`).
6. Final de verdade: a solução/resumo e depois uma tela final com o avatar grande, "@eng.raphaelserra", botão "Seguir" virando "Seguindo ✓",
   "Até o próximo!" e fade para preto (~3 s depois da última fala). Nunca terminar seco.
7. Legenda queimada palavra por palavra (componente `Captions`) — entregar só a versão COM legenda.
8. Avatar ilustrado do Raphael (`src/Raphael.tsx`) narrando no canto inferior esquerdo, boca sincronizada (`mouth_<id>.json`),
   e grande na tela final. Copiar `AvatarCorner`, `mouthAt`, `blinkAt` de `src/Pave.tsx`.
9. Siglas e nomes difíceis: escrever foneticamente só no texto da voz (IBGE → "i bê gê é") usando `voz || legenda` no roteiro.
10. Conferir todo número/fato com WebSearch em fonte confiável (IBGE/SINAPI, ABNT, DNIT, CNT...). Na dúvida, não afirmar ou trocar de tema.
    Estimativas de mercado ditas como "pode", "até", "cerca de".
11. Duração 30–40 s, 1080x1920, 30 fps.
12. Legenda do post CURTA, sem entregar o conteúdo: a pergunta do vídeo + uma pergunta ao público + "Comenta aqui 👇" + hashtags. Ex.:
    "Por que o asfalto do Brasil tem tanto buraco? 🕳️\nComo está a pista na sua cidade?\nComenta aqui 👇\n\n#engenhariacivil #pavimentacao #asfalto ..."
13. Capa 1080x1920 no padrão da série (etiqueta da série, número do episódio, título grande com a palavra-chave destacada,
    ilustração do tema, rodapé com o avatar + "@eng.raphaelserra" + "Engenheiro civil explica"). Conteúdo na faixa central (grade 3:4 do perfil).

## Arquivos baixados no notebook do dono (regra do dono, a partir de 12/11)
Vale para QUALQUER fluxo que baixe arquivo no notebook dele (ex.: cenas do TAAFT pelo navegador, imagens, testes, Reel montado):
- O nome do arquivo baixado SEMPRE começa com `robo-ia_<id>_`, onde `<id>` é o id do item na fila (`fila.json` ou `eng/fila.json`).
  Ex.: `robo-ia_dozero-02-tunel_cena1.mp4`, `robo-ia_dozero-02-tunel_teste_calmo.mp4`. No download pelo navegador, definir o nome no `a.download`.
- Se o fluxo puder escolher a pasta, salvar em `Downloads\robo-ia\<id>\`; senão, direto em `Downloads` com o prefixo acima.
- Nunca salvar arquivo do robô sem esse prefixo: a limpeza semanal (domingo 21:23) só apaga `robo-ia_*` com 7+ dias cujo item já está "postado".
  Arquivo sem o prefixo fica para sempre no notebook.

## Séries e estilos (não misturar)
| Série | Estilo | Base para copiar |
|---|---|---|
| Construção (PATOLOGIAS, CUSTOS DE OBRA, ERROS DE OBRA, FUNDAÇÕES...) | Minimalista premium: fundo creme #F6F3EE, preto #1A1A1A, laranja #D9480F, casas isométricas | `src/Erros.tsx` (mais completo), `src/Custo.tsx`; capas em `src/Capas.tsx` |
| Pavimentação (PAVIMENTAÇÃO) | Asfalto: fundo escuro com textura, faixa amarela correndo na lateral, amarelo #FFC20E, medidor "Condição da pista" | `src/Pave.tsx` (também tem a capa `CapaPave01`) |
| DO ZERO ("Se você...", inspirada no You Made It) | 3D low-poly em corte (three.js), 60–75 s, voz pm_santa 1.15, legenda palavra a palavra, avatar no canto e tela final | `motor3d/` (scene.js + story.js do subsolo) |
Alternar as séries (ver a última linha de `temas.md`). A série DO ZERO é produzida sob pedido do dono (não entra na produção automática diária).
Fórmula DO ZERO: "Se você [faz do jeito mais simples], você tem um [coisa]" → "Mas…" (problema) → "Então você…" (solução) → "Isso é um [nome técnico]" (6–8 vezes) → revelação ("aquilo que você vê… não é defeito") → 3 itens finais com piada → "Parabéns. Você construiu um ___." → tela final.
Palavras sensíveis: evitar "morte", "morreu", "tragédia" etc. (usar "casos fatais", "vítimas"). Episódios numerados por série.
Produção: 2 vídeos por dia (tarefa diária 02:47), parando quando houver 4 ou mais pendentes na fila.

## Como produzir um vídeo
1. Ler `eng/temas.md` e `eng/fila.json`. Escolher um tema NÃO usado (preferir a lista de ideias). Pesquisar os fatos.
2. `cd eng/motor && npm install` (≈30 s). Ferramentas Python já vêm em `tools/` (voz baixa o modelo pelo npm na 1ª vez).
3. Escrever `roteiros/<id>.txt`: UMA CENA POR LINHA (6–8 cenas). Primeira cena = gancho; última = solução + "Segue pra mais ... e até o próximo!".
   `<id>` = `<serie>-<NN>-<slug>`, ex.: `pavimentacao-02-tapa-buraco`, `construcao-04-fundacao`.
4. `python3 tools/narracao.py roteiros/<id>.txt <id>` → gera `public/voice_<id>.wav`, `src/timing_<id>.json`, `src/mouth_<id>.json`.
5. Copiar o .tsx da série para `src/<Nome>.tsx`, trocar os imports de timing/mouth/voz para o `<id>`, reescrever as cenas
   (uma componente por cena, tempos com `wt(cena, 'palavra')`), usar `useCam`/`CutFlash` (Pave.tsx) para mudar o quadro a cada frase.
   Criar `src/<id>-index.ts` registrando o Root. Incluir a composição da capa no mesmo arquivo.
6. PRÉVIA ANTES DO RENDER: `tools/render.sh still src/<id>-index.ts <Comp> "q1,q2,..." out/previa` e OLHAR `out/previa/sheet.jpg`
   (texto saindo da tela, sobreposição com legenda/avatar, elementos cortados). Corrigir e repetir.
7. `tools/render.sh video src/<id>-index.ts <Comp> ../videos/<id>.mp4` (≈8 min) e `tools/render.sh capa ... ../videos/<id>-capa.jpg`.
   Conferir 2–3 quadros do MP4 final com ffmpeg.
8. Acrescentar o item em `eng/fila.json` (status "pendente", legenda, comentario), registrar o tema em `eng/temas.md`,
   commit (só arquivos de `eng/`; não versionar node_modules/out/build) e push.

## Armadilhas já resolvidas
- Chromium: `@sparticuz/chromium` + `--chrome-mode=headless-shell` (o `render.sh` já faz). Não rodar `remotion browser ensure`.
- Legenda fica em top 1255; avatar em top 1515 (270 px). Ilustrações principais entre y 300 e 1200 para não brigar com eles.
- O Instagram cobre ~300 px de baixo e a coluna direita (botões): nada importante ali.
- Áudio: sempre passar pelo limitador (`render.sh video` já aplica `alimiter=0.89`).
- Não usar fundo creme na série de pavimentação nem fundo escuro na de construção.

## Como postar (tarefa diária 11:30 — 1 Reel animado por dia)
1. `git pull`; abrir `eng/fila.json`; pegar o PRIMEIRO item com status "pendente".
2. URLs públicas: `https://raw.githubusercontent.com/raphaelssousa-spfc/palitolandia-midia/main/eng/<campo video>` e `.../eng/<campo capa>`; conferir 200 com curl.
3. Windsor `execute_action`, conector `instagram`, conta `17841404396456793`, ação `create_video_post` com video_url, cover_url, caption = legenda, share_to_feed = true.
4. `create_comment` no media_id com o texto de `comentario`.
5. Marcar "postado", `postado_em` (America/Fortaleza) e `media_id`; commit e push.
6. Fila vazia: não postar e avisar o dono. Falha: tentar 1 vez de novo; depois registrar `erro`, manter "pendente" e avisar.

## Carrosséis (3 por semana: seg, qua, sex às 09:10)
Formato 1080x1350 (4:5), 7 a 10 slides, gerados a partir de um JSON — NÃO precisa escrever código:
`eng/motor/carrosseis/<id>.json` → `cd eng/motor && tools/carrossel.sh carrosseis/<id>.json` → `eng/carrosseis/<id>/01.jpg ...`
e a folha de prévia `eng/motor/out/<id>_previa.jpg` (OLHAR antes de publicar: texto estourando, ícone errado).
- `<id>` = `<serie>-cNN-<slug>` (ex.: `pavimentacao-c02-sinais-estrada-ruim`). Exemplo completo: `motor/carrosseis/construcao-c01-sinais-infiltracao.json`.
- `serie`: "construcao" (creme/laranja) ou "pavimentacao" (asfalto/amarelo). `categoria`: etiqueta curta em MAIÚSCULAS. `episodio`: "CARROSSEL #NN".
- Alternar os formatos: CHECKLIST/DICAS (slides "item" numerados, `alerta` ok/atencao/perigo) e PASSO A PASSO (slides "passo").
- Estrutura: 1) "capa" (titulo + destaque = palavra-chave colorida, subtitulo que gera curiosidade, ilustracao)
  2) 5–7 "item" ou "passo" (titulo ≤ 45 caracteres, texto ≤ 110 caracteres, icone) 3) "resumo" (3–4 pontos curtos) 4) "final" (pergunta ao público).
- Ícones disponíveis: casa, rachadura, gota, mofo, bolha, rodape, nariz, salitre, laje, fundacao, tijolo, planta, dinheiro, calendario, regua,
  martelo, capacete, check, alerta, x, estrada, buraco, cone, caminhao, chuva, rolo, sol, lupa, camadas, bueiro, compactador, termometro. (Para um ícone novo, acrescente em `src/Carrossel.tsx`.)
- Fatos conferidos com WebSearch, igual aos vídeos. Legenda do post curta: título + gancho + pergunta + "Comenta aqui 👇" + hashtags.
- Fila: `eng/fila_carrossel.json` (campos: id, status, pasta, imagens [lista de caminhos relativos a eng/], legenda, comentario).
### Como postar carrossel
URLs: `https://raw.githubusercontent.com/raphaelssousa-spfc/palitolandia-midia/main/eng/<imagem>` (conferir 200 em todas).
Windsor `execute_action`, conector `instagram`, conta `17841404396456793`, ação `create_carousel_post`, `image_urls` na ordem, `caption` = legenda.
Depois `create_comment` com `comentario`; marcar "postado", `postado_em`, `media_id`; commit e push.

### Referências virais (regra do dono, a partir de 13/11)
Antes de cada carrossel novo:
1. Pesquisar (WebSearch/WebFetch: Instagram, TikTok, Pinterest, Google) os carrosséis MAIS VIRAIS do nicho
   (engenharia civil, construção, reforma, obra, pavimentação, arquitetura) — priorizar os com mais curtidas, salvamentos e compartilhamentos.
2. Escolher um tema que já viralizou e que ainda NÃO está em "Carrosséis já usados" (temas.md). Fazer o MESMO TEMA com conteúdo próprio:
   texto escrito do zero, fatos conferidos, ícones do nosso kit. Nunca copiar frases, imagens, marca ou @ de outro perfil.
3. Design INSPIRADO na referência, não igual: copiar só a ideia (paleta, tipo de capa, ritmo dos slides), ajustando com
   `"cores"` (bg, card, text, grey, acc, ring, pill, pillText) e `"capa_estilo"` ("padrao" ou "centro") no JSON. Se a referência usar um layout
   marcante, pode criar uma variação nova em `src/Carrossel.tsx`, mantendo sempre a identidade do perfil (avatar, @, "arraste →", slide final).
4. Registrar o link da referência no campo `"referencia"` do JSON e em temas.md.

### Fotos reais (preferência do dono)
- Sempre que existir foto real do assunto em `eng/fotos/` (ver `eng/fotos/LEIAME.md`), USE: `"foto": "fotos/<arquivo>.jpg"` na capa
  (vira capa de foto em tela cheia) e nos itens/passos (a foto entra no lugar do ícone).
- O ambiente automático NÃO consegue baixar imagens da internet (bancos de fotos são bloqueados pela rede). Então só use fotos do banco
  `eng/fotos/`. Sem foto adequada, use as ilustrações do kit e, na mensagem ao dono, diga quais 2–3 fotos ajudariam (nome sugerido do arquivo).
- Nunca use foto de outro perfil, nem imagem sem licença livre.

## Horário de postagens avulsas (regra do dono, a partir de 12/11)
Para vídeos fora da fila fixa (ex.: série DO ZERO), SEMPRE:
1. Analisar o melhor horário para AQUELE dia da semana (dados recentes de Buffer/Metricool/mLabs para Reels no Brasil e, quando houver
   histórico suficiente, o alcance por horário do próprio @eng.raphaelserra no Windsor.ai).
2. Conferir a grade já ocupada (list_triggers): @eng.raphaelserra 09:10 (carrossel), 13:10 e 19:10 (Reels); Palitolândia é outra conta.
   Se o melhor horário chocar ou ficar a menos de ~2 h de outra postagem do mesmo perfil, escolher o próximo horário bom do dia.
3. Marcar o item em eng/fila.json com status "agendado" e "agendado_para" (não "pendente", para não entrar na fila fixa)
   e criar uma tarefa agendada única (create_trigger com run_once_at) que posta só esse item.
4. Avisar o dono do horário escolhido e o porquê em uma linha.

## Motor 3D (DO ZERO): erros do #01 que NÃO podem se repetir
Problemas vistos no DO ZERO #01 (subsolo): partes piscando e coisas narradas que não apareceram. Regras:
1. Nada de clarão branco de tela cheia (corte com flash, raio piscando duas vezes). No máximo um clarão suave (≤ 0,25) e único.
2. Nunca alternar `material.transparent` (ou outra propriedade que muda o shader) entre quadros: o render em sequência ignora e a parede
   fica opaca (foi o que escondeu a armadura). Deixe o material sempre transparent e mude só a opacidade, ou use outro material + needsUpdate.
3. Sem superfícies coplanares (z-fighting = chão "chuviscando"): separar ≥ 3 cm. Câmera com near ≥ 0,2.
4. Luz/sombra FIXA (não seguir o alvo da câmera), senão a sombra "treme".
5. Animações rápidas (pá cavando, vibração de bomba, "VRRRR") com amplitude pequena e frequência ≤ 3 Hz: oscilação rápida vira pisca-pisca.
6. Tudo que a narração CITA tem que estar na tela, grande e em foco DURANTE a frase: entrar ~0,2 s antes da palavra e ficar até o fim da frase,
   dentro da faixa y 300–1150 (abaixo disso ficam legenda, @ e avatar e o objeto some atrás deles — foi o caso da bomba/boia).
   Se o objeto é pequeno (lâmpada, brita, boia), a câmera aproxima nele naquela frase.
7. Os tempos de cada palavra são estimados por sílaba dentro da frase; para eventos visuais importantes use o INÍCIO DA FRASE (exato)
   ou a palavra-chave com folga de 0,3 s para antes.
8. QA obrigatório antes de entregar (ferramentas em `motor3d/`):
   - `python3 qa_palavras.py <mp4> work/timing.json "1:desmor,6:racha,..." folha.jpg` → OLHAR: cada palavra-chave mostra o objeto citado?
   - `python3 qa_piscadas.py <mp4>` → lista trechos suspeitos (confete e texto pulando também aparecem; olhe os quadros seguidos de cada trecho).
   - Corrigir, re-renderizar só os trechos afetados e repetir.

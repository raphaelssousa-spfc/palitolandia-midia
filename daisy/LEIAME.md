# Daisy Dinners — Reels diários (TAAFT)

> ⚠️ Este manual vale MAIS que o texto da rotina agendada. A seção "FORMATO 24/11" manda sobre o resto.
> - NAVEGADOR (25/11, pedido do Raphael: "use o Chrome aqui sempre"): TAAFT e Unsplash SEMPRE pelo Google Chrome do PC (Claude in Chrome, ferramentas mcp__claude-in-chrome__*). NÃO usar o navegador embutido. Chrome precisa estar aberto e logado no TAAFT.
> - 3 clipes. Foto real do prato = <Image 2> sempre. Montar com `assemble_v2.py roteiro.json`.

Daisy Parker, 34, mãe de 3 em Ohio. Jantas baratas pra família. Bordão: "Dinner's handled."
Vende o e-book "The $75 Dinner Plan" (30 jantas, EM PROMOÇÃO: US$ 9.99, era US$ 17): https://payhip.com/b/7QkKt
Tudo em inglês americano. Instagram @daisy.dinners (conta Windsor 17841417624005059; link na bio).

## FORMATO 24/11 (pedido do Raphael: "mude tudo que der": mais humor, mais qualidade, menos rosto)
Por quê: Reels 03–07 tiveram 79–141 views, 62–80% pulam nos 3 s, média assistida 3–5 s, 0 seguidor, 1 curtida.
E eram postados às 3–4 h da manhã nos EUA. Quem cresce no nicho ("recession meals", mãe com orçamento) faz SÉRIE, humor de mãe real e mostra comida de verdade; IA que cresce é personagem com piada/história, não "prova" de comida.

1. CURTO: alvo 14–18 s no total. Cada fala com 9–13 palavras (não 14–20). Sem enrolação, sem "Hi guys".
2. MENOS ROSTO: a Daisy aparece no clipe 1 (setup da piada) e no fim do clipe 3 (CTA). No resto, FOTOS REAIS por cima com a voz dela continuando (campo "broll" do roteiro). Use 3 fotos reais por vídeo:
   - foto A = prato pronto (abre o vídeo 1,0 s + <Image 2> + "dish_img");
   - foto B = ingredientes/mercado ou panela no meio do preparo (cobre ~70% do clipe 2);
   - foto C = prato servido/família/porção no prato (primeiros ~1,5 s do clipe 3).
   Exemplo: "broll": [{"img":"a.jpg","clip":0,"at":0,"len":1.0},{"img":"b.jpg","clip":1,"at":0.3,"len":2.6},{"img":"c.jpg","clip":2,"at":0,"len":1.5}]
3. HUMOR (toda fala 1 é piada de mãe real ou contraste de preço; nada de "This dinner cost..." seco). Bancos de gancho:
   - "My kids asked what's for dinner eleven times. Here's my answer." / "POV: it's 5 PM and nobody planned dinner."
   - Delivery x casa: "Pizza for five? Sixty-two dollars. This? About nine." (humor + número, o povo manda pros outros)
   - "My husband said 'let's just order out.' I said, watch this."
   - "Things that cost more than this dinner: one fancy coffee, a kids' meal…"
   Texto do gancho na tela (hook) = a piada curta em 2 linhas, MAIÚSCULAS, com $ (ex.: "TAKEOUT: $62" / "MINE: $9 😏").
4. SÉRIE: toda receita do e-book entra como "DAY N OF 30" (N = número em receitas.json). Ponha no "hook_sub" (ex.: "Day 14 of 30 · family of 5") e na 1ª linha da legenda. Cria hábito de voltar.
5. RODÍZIO SEMANAL (dia da semana, America/Fortaleza):
   - seg: delivery x casa (receita do e-book com preço de delivery comparável, "about")
   - ter, qui, sáb: receita do e-book, série DAY N, gancho de humor
   - qua: humor de mãe (POV 5 PM, criança enjoada, marido) + receita rápida do e-book
   - sex: dica rápida (sobra vira outra janta, congelar, lista de US$ 75) com piada
   - dom: venda direta do plano (promoção US$ 9.99, sem urgência falsa)
6. LEGENDA: 1ª linha = gancho/piada curta (aparece antes do "mais"). Depois "Full 30-dinner plan in my bio, on sale for $9.99 (was $17)." Depois chamada de ENVIO: "Send this to the mom who hates 5 PM 😅" (varie, nunca repita a mesma da semana) + uma pergunta. 3–5 hashtags.
7. COMENTÁRIO FIXO: logo depois de postar, create_comment no próprio Reel com uma pergunta divertida ligada ao tema (ex.: "Be honest: what's your 'I give up' dinner? 👇").
8. HORA: a rotina agora roda 09:17 (Fortaleza) e posta perto de 10–11 h em Nova York. Não postar de madrugada.
9. Selo de IA: o perfil PRECISA do selo oficial "AI-generated" do Instagram (desde 31/08/2026 perfil de IA sem selo perde recomendação). Raphael ativa no app; a rotina não consegue.

### Achar fotos reais (Unsplash) pelo navegador
Na aba do PC, abra https://unsplash.com/s/photos/<termo>?license=free, pegue os ids dos `figure img[src*="images.unsplash.com/photo-"]`, desenhe uma folha de contato num canvas (12 miniaturas 250x250 com número) e devolva `toDataURL('image/jpeg',0.6)`; o resultado vem salvo num .txt → extraia o base64 com Python e OLHE. Escolha foto caseira (panela, assadeira, prato simples), nada de restaurante/comida asiática se a receita é americana. Depois baixe a escolhida (`?w=1080&q=80&fm=jpg`, FileReader → base64) do mesmo jeito. O sandbox não acessa images.unsplash.com direto.

## Arquivos
- assets/rosto-daisy.jpg — rosto aprovado. SEMPRE a imagem de referência no TAAFT.
- assets/Perfil-A.png — logo com nome (só tela final do assemble.py). assets/logo-avental.png — símbolo sem letras (avental). assets/fonts/ — legenda.
- assemble_v2.py — MONTAGEM ATUAL (desde 22/11): `python3 assemble_v2.py roteiro.json` (formato no topo do arquivo). Gancho em texto grande, foto real em tela cheia na abertura, legenda animada palavra por palavra, figurinhas (emoji), etiqueta "THE SECRET", "LINK IN BIO" + selo da promoção, barra de progresso, cortes de silêncio, tela final 1,3 s.
- assemble.py — montagem antiga (não usar mais).
  Normaliza 1080x1920, legenda palavra por palavra (3 palavras, atual em amarelo), tela final 2,5 s.
- receitas.json — as 30 jantas do e-book (título, regra, custo, ingredientes). Fonte dos temas.
- fila.json — vídeos feitos (id, tema, tipo, roupa, falas, legenda, status).
- videos/daisy-NN.mp4 — vídeos finais.

## Mix de conteúdo (por semana)
- Maioria: Daisy cozinhando UMA receita do e-book (mostra os ingredientes, o preparo, o prato pronto).
- 1–2 por semana: dica rápida (lista de compras de US$ 75, truque de sobra, congelar, criança enjoada).
- 1 por semana: venda direta do plano (o que tem dentro, por que funciona, "link in my bio"). Fale da promoção: "It's on sale right now, under ten dollars instead of seventeen."
- Não repetir receita/tema já em fila.json.

## Por que mudou (análise 22/11)
Reels 03–05: ~65% pulavam nos 3 primeiros segundos, média assistida 3–5 s, zero interação, postados 4–5 h da manhã nos EUA, comida da IA estranha. Regras novas:
- Abrir com COMIDA DE VERDADE (foto real Unsplash em tela cheia, ~1,2 s) + texto de gancho com preço. Nunca abrir só com a Daisy falando.
- 3 clipes (gancho, segredo, prato+CTA) = ~20–25 s. 4 clipes só se o 2º for muito bom.
- Close de comida = SEMPRE foto real (b-roll do assemble_v2), nunca a comida da IA em close.
- Legenda do post termina com pergunta pra puxar comentário (ex. "What's your go-to $5 dinner?").

## Roteiro (3 clipes de 8 s; antes eram 4)
1. Gancho (curiosidade forte, número/preço): ex. "This whole dinner cost me nine dollars. Watch."
2. Ingredientes/preço ou primeiro passo.
3. Passo principal / segredo da receita.
4. Prato pronto + CTA: termina SEMPRE com algo como "...The whole plan is in my bio. Dinner's handled!"
   Enquanto durar a promoção, cite no CTA: ex. "All thirty dinners are on sale in my bio. Dinner's handled!"
   Sem urgência falsa ("só hoje", "últimas horas"): só "on sale" / "under ten dollars".
Cada fala: 9–13 palavras (FORMATO 24/11). Preço sempre "about", família de 4–5.
Números escritos por extenso na fala ("nine dollars").

## Legenda (Instagram)
Ver FORMATO 24/11, item 6.

## Visual da Daisy (a partir do vídeo 03)
- Sempre avental de cozinha branco com o símbolo da marca (assets/logo-avental.png: prato com margarida, garfo e faca, SEM LETRAS) num patch redondo verde-sálvia no peito + chapéu de cozinheira branco. Nada escrito no avental nem no chapéu. Igual em todo vídeo.
- A ÚNICA coisa que muda de um vídeo pro outro é a roupa por baixo do avental. Rodízio (use a próxima depois da última em fila.json, campo "roupa"):
  1. sage green t-shirt  2. navy blue long-sleeve top  3. mustard yellow t-shirt  4. light gray hoodie  5. coral pink t-shirt  6. white and blue striped shirt  7. denim chambray shirt  8. burgundy sweater
- Mesma roupa nos 4 clipes do mesmo vídeo.

## Imagens de referência no TAAFT (nesta ordem)
1. assets/rosto-daisy.jpg (rosto) — sempre.
2. Foto REAL do prato do dia — OBRIGATÓRIA em todo clipe que mostra comida (sem ela a IA inventa comida estranha). A MESMA foto vai no assemble_v2 como "broll" (abertura) e "dish_img" (círculo). Pegue o JPG pelo navegador (fetch → base64, 1 fatia; ?w=1080&q=80&fm=jpg) e salve no sandbox. (Unsplash, licença free; buscar em unsplash.com no navegador do PC e subir de images.unsplash.com/photo-...?w=1080&fm=jpg). Escolher foto caseira, molho/comida misturada, nada de prato de restaurante.
3. assets/logo-avental.png (símbolo do avental, sem letras) — a partir do vídeo 03.
Tirar as imagens antigas (Remove image) e subir de novo quando a ordem mudar. Imagens públicas: dá pra dar fetch direto do raw.githubusercontent.com no navegador (não precisa base64).

## Prompt do TAAFT (mesmo modelo nos 4 clipes; troque só ROUPA, ACTION e FALA)
```
<Image 1> is the reference image for the woman. <Image 2> is the reference for how the food looks. <Image 3> is the symbol on her apron. Vertical 9:16 realistic smartphone UGC video, filmed handheld by a friend, one continuous shot, no cuts, 8 seconds. The woman must exactly match <Image 1> in every frame: same face, same light freckles, same blue-gray eyes, same light brown hair in a loose messy bun. Do not alter or stylize her face. OUTFIT: a {ROUPA} under a clean white cooking apron with a small round sage-green patch on the chest showing only the symbol from <Image 3> (white plate with a yellow daisy, fork and knife), with no letters and no words anywhere on the apron or hat, and a white chef hat; the same outfit in every frame. SETTING: the same bright cozy home kitchen as <Image 1>: white cabinets, wooden counter, window with soft natural daylight, evening. ACTION: {ACTION} FOOD: real home-cooked food like a normal phone video of a family dinner: natural textures, matte, slightly messy, not glossy, not styled, not plastic, looking like the food in <Image 2>. She is framed from the waist up, centered, looking into the camera most of the time, friendly and relaxed, natural hand gestures. AUDIO: she speaks directly to the camera in a warm, natural, upbeat American English voice, a 34-year-old mom from Ohio, at a natural fast pace, clearly saying exactly: "{FALA}" Quiet kitchen ambience only. No music, no subtitles, no captions, no text on screen, no letters or words on clothing.
```
Dicas de ACTION/comida (aprendido nos vídeos 01–06):
- QUALIDADE DA COMIDA (22/11): a IA erra comida de perto. Na ACTION, a comida fica a meio metro da câmera, na altura da cintura (panela no fogão ou prato baixo), nunca "close to the camera". Escreva a comida igual à foto: "exactly the same dish as <Image 2>, same colors and textures". Prefira pratos que a IA acerta (arroz, macarrão com molho, sopa, assadeira de frango e batata, chili). Evite tacos, quesadillas, queijo derretido, ovos fritos, coisas recheadas.
- Ao olhar os 4 quadros: comida com formato estranho, cor de plástico, pedaços derretidos/fundidos, garfo/mão deformada = REFAZ.
- NUNCA "food magazine photo"/"appetizing": a IA faz comida brilhante e de plástico. Peça comida caseira, fosca, um pouco bagunçada, igual a <Image 2>.
- Uma ação simples e lenta por clipe: segurar a panela parada, mexer devagar, mostrar o prato perto da câmera. Nada de enrolar macarrão no garfo, morder ou despejar líquido (a IA erra).
- No clipe 4 ela NÃO come: segura o prato e aponta, pra fala final sair clara.
- Frango desfiado: "tender, juicy, pale white shredded chicken breast meat with no skin".
- Se aparecer letra/palavra no avental ou o símbolo sair muito deformado, refaça o clipe.

## TAAFT (Google Chrome do PC do Raphael, via Claude in Chrome)
- Página: https://theresanaiforthat.com/@taaft/video-generator/ (ele já está logado; 100 vídeos/dia).
- Modelo "Quality", orientação Portrait (retrato), 1 imagem de referência = assets/rosto-daisy.jpg.
- Só 1 geração por vez. Cada clipe leva ~15–25 min. Ocupado = texto da página tem "Generating Video" ou "Waiting in queue".
- Subir a imagem: o sandbox lê o arquivo; passe em base64 pro javascript_tool e monte um File num DataTransfer em `input[type=file][accept^="image/jpeg"]` (dispatch change). Se já houver imagem (botão `button[aria-label*="Remove image"]`, exatamente 1), não suba de novo.
- Prompt: `textarea[placeholder="Enter your prompt here"]`, setar pelo setter nativo de HTMLTextAreaElement.value + evento input; depois clicar no botão visível com texto exato "Generate".
- Clipe pronto: primeiro `<video>` da página com src em taaft-videogen.b-cdn.net (novo = diferente dos que já existiam antes de gerar).
- Trazer o MP4 pro sandbox (o sandbox não acessa o CDN): no javascript_tool, fetch → base64 em window._b64; depois devolva em fatias de 250000 caracteres com um prefixo ("K00|", "K01|"...). Cada resposta grande é salva num .txt em /tmp/claude-tool-results/...; junte as fatias pela ordem do prefixo e decodifique. Apague window._b64 no fim.
- OLHE 4 quadros de cada clipe (ffmpeg) antes de usar: rosto igual, comida bonita (não queimada/estranha), sem texto na tela. Ruim → gere de novo (no máximo 2 tentativas por clipe).

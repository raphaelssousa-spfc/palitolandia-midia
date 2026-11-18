# Daisy Dinners — Reels diários (TAAFT)

Daisy Parker, 34, mãe de 3 em Ohio. Jantas baratas pra família. Bordão: "Dinner's handled."
Vende o e-book "The $75 Dinner Plan" (30 jantas, US$ 17): https://payhip.com/b/7QkKt
Tudo em inglês americano. Instagram @daisydinners (link na bio).

## Arquivos
- assets/rosto-daisy.jpg — rosto aprovado. SEMPRE a imagem de referência no TAAFT.
- assets/Perfil-A.png, assets/fonts/ — usados pelo assemble.py (tela final + legenda).
- assemble.py — `python3 assemble.py saida.mp4 c1.mp4 "fala 1" c2.mp4 "fala 2" ...`
  Normaliza 1080x1920, legenda palavra por palavra (3 palavras, atual em amarelo), tela final 2,5 s.
- receitas.json — as 30 jantas do e-book (título, regra, custo, ingredientes). Fonte dos temas.
- fila.json — vídeos feitos (id, tema, tipo, falas, legenda, status).
- videos/daisy-NN.mp4 — vídeos finais.

## Mix de conteúdo (por semana)
- Maioria: Daisy cozinhando UMA receita do e-book (mostra os ingredientes, o preparo, o prato pronto).
- 1–2 por semana: dica rápida (lista de compras de US$ 75, truque de sobra, congelar, criança enjoada).
- 1 por semana: venda direta do plano (o que tem dentro, por que funciona, "link in my bio").
- Não repetir receita/tema já em fila.json.

## Roteiro (4 clipes de 8 s = ~34 s com a tela final)
1. Gancho (curiosidade forte, número/preço): ex. "This whole dinner cost me nine dollars. Watch."
2. Ingredientes/preço ou primeiro passo.
3. Passo principal / segredo da receita.
4. Prato pronto + CTA: termina SEMPRE com algo como "...The whole plan is in my bio. Dinner's handled!"
Cada fala: 14–20 palavras no máximo (cabe em 8 s em ritmo natural). Preço sempre "about", família de 4–5.
Números escritos por extenso na fala ("nine dollars").

## Prompt do TAAFT (mesmo modelo nos 4 clipes; troque só ACTION e a fala)
```
<Image 1> is the reference image. Vertical 9:16 realistic smartphone UGC video, filmed handheld by a friend, one continuous shot, no cuts, 8 seconds. The woman must exactly match <Image 1> in every frame: same face, same light freckles, same blue-gray eyes, same light brown hair in a loose messy bun, same sage green t-shirt. Do not alter or stylize her face. SETTING: the same bright cozy home kitchen as <Image 1>: white cabinets, wooden counter, window with soft natural daylight, evening. ACTION: {ACTION} She is framed from the waist up, centered, looking into the camera most of the time, friendly and relaxed, natural hand gestures. AUDIO: she speaks directly to the camera in a warm, natural, upbeat American English voice, a 34-year-old mom from Ohio, at a natural fast pace, saying exactly: "{FALA}" Quiet kitchen ambience only. No music, no subtitles, no captions, no text on screen, no logos.
```
Dicas de ACTION (aprendido no vídeo 01):
- Comida sempre descrita CLARA e apetitosa: "fresh, colorful, appetizing like a food magazine photo", "pale, juicy". Nunca deixe a IA inventar comida escura — sai com cara de queimada.
- Frango desfiado: "tender, juicy, pale white shredded chicken breast meat with no skin".
- Uma ação simples por clipe (segurar, mexer, montar, mostrar o prato). Nada de muita coisa ao mesmo tempo.
- Roupa sempre a camiseta verde-sálvia (igual à referência).

## TAAFT (navegador embutido do PC do Raphael)
- Página: https://theresanaiforthat.com/@taaft/video-generator/ (ele já está logado; 100 vídeos/dia).
- Modelo "Quality", orientação Portrait (retrato), 1 imagem de referência = assets/rosto-daisy.jpg.
- Só 1 geração por vez. Cada clipe leva ~15–25 min. Ocupado = texto da página tem "Generating Video" ou "Waiting in queue".
- Subir a imagem: o sandbox lê o arquivo; passe em base64 pro javascript_tool e monte um File num DataTransfer em `input[type=file][accept^="image/jpeg"]` (dispatch change). Se já houver imagem (botão `button[aria-label*="Remove image"]`, exatamente 1), não suba de novo.
- Prompt: `textarea[placeholder="Enter your prompt here"]`, setar pelo setter nativo de HTMLTextAreaElement.value + evento input; depois clicar no botão visível com texto exato "Generate".
- Clipe pronto: primeiro `<video>` da página com src em taaft-videogen.b-cdn.net (novo = diferente dos que já existiam antes de gerar).
- Trazer o MP4 pro sandbox (o sandbox não acessa o CDN): no javascript_tool, fetch → base64 em window._b64; depois devolva em fatias de 250000 caracteres com um prefixo ("K00|", "K01|"...). Cada resposta grande é salva num .txt em /tmp/claude-tool-results/...; junte as fatias pela ordem do prefixo e decodifique. Apague window._b64 no fim.
- OLHE 4 quadros de cada clipe (ffmpeg) antes de usar: rosto igual, comida bonita (não queimada/estranha), sem texto na tela. Ruim → gere de novo (no máximo 2 tentativas por clipe).

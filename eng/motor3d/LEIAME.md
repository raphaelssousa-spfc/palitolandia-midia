# motor3d — série DO ZERO (3D em corte, "Se você...")
Regras de conteúdo e erros a evitar: ver eng/PRODUCAO.md (seções "DO ZERO", "Motor 3D", "Horário de postagens avulsas").

## Passo a passo de um episódio (rodar dentro de eng/motor3d)
0. Preparar: `npm i --no-save react@18.3.1 react-dom@18.3.1 remotion@4.0.242 esbuild@0.23.1` só se for recompilar o avatar (web/avatar.js já vem pronto).
   Playwright/Chromium: `ln -sfn "$(npm root -g)/playwright" node_modules/playwright` (o container já tem; não instalar outro).
   Voz: `pip install --break-system-packages kokoro-onnx soundfile` se faltar (voz.py baixa o modelo sozinho).
1. Criar episodios/<id>/script.json  → lista de {"say": texto falado, "show": legenda}. Números na legenda em algarismo, falados por extenso.
2. Narração: `cp episodios/<id>/script.json script.json && VEL=1.15 python3 tts.py` → voice.wav + work/timing.json (60–75 s com a tela final).
   Se passar de 75 s, enxugar frases e repetir. Ajuste NUM em tts.py para palavras com números/siglas na legenda.
3. Boca do avatar: `python3 boca_do_audio.py voice.wav web/mouth.json && cp work/timing.json web/`
4. Cenas: MONTE o cenário com as peças do KIT (ver KIT.md — chão com buracos, solo em corte, pavimento, ferragem, forma, máquinas, operários, poeira, setas).
   Copie episodios/dozero-01-subsolo/story.js como ponto de partida e escreva episodios/<id>/scene.js usando KIT.* (peça nova só se o tema exigir; se servir para outros temas, acrescente ao kit.js)
   e história/câmeras (story.js: tabela T de tomadas por frase, world(t), renderCover). A última frase tem "Segue ... Até o próximo!" (tela final).
   `python3 build.py <id>`
5. Prévia: `node render.mjs stills stills/a "f1,f2,..."` nos momentos mais cheios + `python3 sheet.py stills/a sheet.jpg` → OLHAR e corrigir.
6. Render: ajustar o caminho em renderall.sh e rodar (≈0,5 s/quadro). Concat → video.mp4.
7. Som: escrever os cues em audio.py (whoosh nos cortes, pop nos rótulos, etc.) → `python3 audio.py && python3 mix.py voice.wav music.wav sfx.wav`,
   loudnorm -14 LUFS, juntar com o vídeo (-c:v copy).
8. QA obrigatório: `python3 qa_palavras.py <mp4> work/timing.json "<frase>:<palavra>,..." qa.jpg` (OLHAR) e `python3 qa_piscadas.py <mp4>`.
   Corrigir e re-renderizar só os trechos afetados.
9. Capa: `node cover.mjs videos/<id>-capa.jpg <cy> <dist>` (renderCover no story.js: etiqueta DO ZERO, #NN, título com palavra destacada, rodapé com avatar).

## Dicas do #02 (rodovia de concreto)
- O som de cada episódio fica em `episodios/<id>/audio.py` (rodar de dentro de motor3d: `python3 episodios/<id>/audio.py`).
- `cam.setViewOffset(W, H, 0, 260, W, H)` no renderFrame sobe o centro do quadro 260 px: o assunto fica acima da legenda sem mexer em cada câmera.
- Objeto com `visible=false` numa tomada precisa voltar a `true` no "estado base" do world(t), senão some nas tomadas seguintes.
- Render em paralelo (3 processos): ver `work/run.sh` gerado no #02 (`xargs -P3` sobre a lista de trechos) e rodar com `setsid nohup`.

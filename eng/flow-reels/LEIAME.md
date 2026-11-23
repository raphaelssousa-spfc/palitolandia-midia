# Reels realistas do @eng.raphaelserra no Google Flow

Formato aprovado em 23/11/2026 (vídeo modelo: eng/videos/flow-01-camadas-estrada.mp4).
Raphael (clone realista) fala pra câmera numa obra de verdade, como se alguém gravasse;
a câmera sai dele e mostra a etapa (aerial pullback, speed ramp, rack focus, órbita), sempre com a narração contínua.

## Regras do dono
- Clone com a cara dele, **1,93 m** (uma cabeça mais alto que os peões), jeito **calmo**, voz do próprio Flow, boca natural (sem exagero).
- **Roupa nova a cada tema** (mudar a cor da camisa; anotar em temas usados), sempre com **EPI**: capacete branco, **colete refletivo**, óculos escuros estilo Ray-Ban, botina.
- Som das máquinas baixo por baixo da voz. Sem música, sem texto na tela (a legenda é nossa).
- Tema que **prende e que a pessoa se identifica** (coisa que ela vê na rua/casa). Gancho forte no clipe 1.
- Mostrar o equipamento de verdade como ele trabalha (ex.: caminhão espargidor na velocidade normal, barra com bicos em leque).
- **Evitar palavras que a IA pronuncia mal** ("enquanto" saiu "encanto"; "boiam"). Na dúvida, reescreva a frase.
- Última fala = pergunta pra comentar ligada ao tema. Nada de palavra sensível ("morte" etc.).

## Flow (navegador embutido do PC do dono, já logado)
- https://flow.google.com → Novo projeto. Configuração (chip no canto do prompt): **Vídeo · Elementos · 9:16 · Veo 3.1 Lite · x1** (10 créditos/clipe; 50 créditos/dia por conta → **5 clipes por dia**).
- Referência: botão **+** → ícone de upload (o input de arquivo é criado ao clicar; intercepte `HTMLInputElement.prototype.click` e coloque o File) → depois clicar no **nome** da imagem pra anexar. Conferir que o chip continua "720p" (se aparecer 360p, anexou vídeo por engano: remova).
- Fotos de referência: ref/rosto.jpg (rosto), ref/capacete.jpg (capacete/óculos, braços cruzados), ref/corpo.jpg (corpo inteiro). Suba as 3 e anexe as 3.
- Cada clipe leva ~2 min. Dá pra mandar vários seguidos (anexar a referência de novo em cada um).
- Baixar: botão direito no card → **Fazer o download** → vai pra pasta Downloads do PC → device_stage_files.

## Prompt (molde)
`Ultra-realistic cinematic 9:16 vertical video, documentary Reel style, golden-hour light, teal-and-orange grade, natural film grain. The presenter is exactly the man in the reference images: same face, salt-and-pepper hair, thick dark eyebrows, full dark beard with white strands on the chin, white hard hat, black Ray-Ban Wayfarer style sunglasses, <CAMISA> long-sleeve work shirt, bright orange high-visibility vest with silver reflective stripes, dark work pants, brown safety boots. He is 1.93 m tall, clearly a head taller than the construction workers around him. Location: <LOCAL>. SHOT: <MOVIMENTO DE CÂMERA E AÇÃO>. He speaks Brazilian Portuguese in a calm warm baritone voice, relaxed natural pace, clear pronunciation, subtle natural lip movements, no exaggerated mouth movement: "<FALA 14–20 palavras>" Background sound: <máquinas>, low under his voice. No music, no subtitles, no text on screen.`

## Montagem
1. Pasta de trabalho com c1.mp4 … c5.mp4 (na ordem) e falas.json (lista com a fala exata de cada clipe).
2. Tela final: copie endcard/ pra uma pasta, troque o texto de `#q` no index.html pela pergunta do vídeo (2 linhas, 2ª em `<em>`) e renderize com HyperFrames:
   `HYPERFRAMES_SKIP_SKILLS=1 npx -y hyperframes render -o <pasta_trabalho>/endcard_raw.mp4` (dentro da pasta do endcard).
3. `python3 montar.py <pasta_trabalho> <saida.mp4>` → legenda palavra por palavra (palavra falada em amarelo, altura do peito, sincronizada pela voz), tela final e volume -14 LUFS.
4. Olhe uma folha de quadros (início com legenda, meio, tela final) antes de entregar.

# Palitolândia.ia — manual de produção e postagem automática

Este repositório guarda a fila de postagem (`fila.json`), os vídeos prontos (`videos/`) e o motor de animação (`motor/`).
Instagram: @palitolandia.ia (conectado via Windsor.ai, conector `instagram`, conta id `17841460341094597`).

## Regras do canal (do dono — obrigatórias)
1. Narração SEMPRE com a voz `pm_santa` (`voz.py ... --voz pm_santa --vel 1.08`).
2. O vídeo SEMPRE começa com uma PERGUNTA na primeira frase (ex.: "O que veio primeiro: o fax ou o telefone?"), e a pergunta já traz as duas datas ou fatos que parecem fora de ordem.
   Gancho nos 3 primeiros segundos: **duas datas ou fatos que parecem fora de ordem** (formato do Reel da Cleópatra, o campeão: 4x o alcance).
   Estrutura: gancho → a conta simples que prova → uma imagem engraçada → a virada → pedido de interação → CTA.
3. Final de verdade: depois da última fala, ~2,5 s de cena final com o logo "PALITOLÂNDIA.IA / curiosidades animadas", brilhos, acorde final na música e fade-out (nunca terminar seco).
4. Pedir interação no fim: "Comenta aí se você sabia" e/ou "manda pra quem vai duvidar", em placas na tela também.
5. CTA: na tela "SEGUE @PALITOLANDIA.IA"; na narração escrever **"Segue Palitolândia ponto i a."** (o TTS lê "í á" errado).
6. Entregar só a versão COM legenda queimada (estilo de `legendas.py`: DejaVu Sans Bold 92, palavra ativa amarela, palavras-chave verdes, ≤13 caracteres por bloco). Datas na legenda em algarismos.
7. Legenda do post: CURTA, com mistério, sem entregar datas/respostas do vídeo. Ex.: "Isso parece fora de ordem... mas é real 🎓🦅 / Assiste até o fim e comenta se você sabia 👀 / Segue @palitolandia.ia / 4-5 hashtags".
8. Vídeos de 25–32 s, 1080x1920, 30 fps. Capa 1080x1920 com faixas de gancho (ver `motor/capas.py`) + etiqueta "PALITOLÂNDIA.IA".
9. Conferir fatos (datas, números) com WebSearch antes de narrar. Na dúvida, escolher outro tema.
10. Pronúncia: testar nomes estrangeiros com `from kokoro_onnx.tokenizer import Tokenizer; Tokenizer().phonemize(texto,'pt-br')` e reescrever foneticamente só no texto da voz (ex.: Oxford → "Óquisfór"); a legenda mantém a grafia certa.

## Arquivos baixados no notebook do dono (regra do dono, a partir de 12/11)
Vale para QUALQUER fluxo que baixe arquivo no notebook dele (ex.: cenas do TAAFT pelo navegador, imagens, testes, Reel montado):
- O nome do arquivo baixado SEMPRE começa com `robo-ia_<id>_`, onde `<id>` é o id do item na fila (`fila.json` ou `eng/fila.json`).
  Ex.: `robo-ia_dozero-02-tunel_cena1.mp4`, `robo-ia_dozero-02-tunel_teste_calmo.mp4`. No download pelo navegador, definir o nome no `a.download`.
- Se o fluxo puder escolher a pasta, salvar em `Downloads\robo-ia\<id>\`; senão, direto em `Downloads` com o prefixo acima.
- Nunca salvar arquivo do robô sem esse prefixo: a limpeza semanal (domingo 21:23) só apaga `robo-ia_*` com 7+ dias cujo item já está "postado".
  Arquivo sem o prefixo fica para sempre no notebook.

## Regras de crescimento (12/11 — o dono pediu)
11. **Série numerada "PARECE MENTIRA #N".** N = número do episódio (o próximo número está em `proximo.md`). Aparece no começo do vídeo (placa pequena no canto nos primeiros 3 s), na capa (faixa acima do título) e na legenda do post ("Parece mentira #N").
    Episódios: #1 Cleópatra, #2 Chocolate/micro-ondas, #3 Sol, #4 Torre Eiffel, #5 Oxford, #6 lata x abridor, #7 isqueiro x fósforo (estes dois feitos antes da regra). O fax (refazer) será o #8.
12. **Anúncio do próximo episódio antes do CTA.** Ao produzir o episódio N, escolha JÁ o tema do N+1 (conferido), escreva em `proximo.md` e feche o vídeo com uma pergunta-teaser falada e em placa:
    "No próximo: <pergunta curta do tema N+1>". Ex.: "No próximo: o que é mais velho, o tubarão ou as árvores?". A execução seguinte DEVE produzir exatamente o tema de `proximo.md`.
13. **Comentário com escolha.** Em vez de só "comenta se você sabia", peça uma escolha: "Qual veio primeiro: A ou B? Comenta antes de ver o final!" (placa no meio do vídeo, logo depois da pergunta inicial) e no fim "manda pra quem vai duvidar". O comentário automático do post também deve ser uma escolha ("Fax ou telefone: em quem você apostou? 👇").
Ordem final do vídeo: virada → "No próximo: ..." → "manda pra quem vai duvidar" → "Segue Palitolândia ponto i a" → logo/acorde/fade.

## KIT (montar, não construir do zero) — regra do dono, 14/11
Todo vídeo parte do KIT em `motor/kit/` (ver `motor/kit/KIT.md`): cenário pronto da tabela, roupas de `kit/web/roman.js`,
placas/efeitos de `kit/web/placas.js` (PL.plate, PL.sunCard, PL.map, PL.zzz...). Só crie o que o tema exige; se a peça nova
servir para outros temas, acrescente ao kit e ao KIT.md (assim cada vídeo deixa o kit maior e o próximo sai mais rápido).

## Armadilhas técnicas já resolvidas (não repetir)
- Dois planos de chão sobrepostos causam "piscadas" (z-fighting). Nunca sobrepor chão de cenários diferentes.
- Não usar KICKS de câmera (tranco de 1 quadro parece falha): `const KICKS = []`.
- Antes de finalizar, rodar a checagem de piscadas (quadro isolado diferente dos vizinhos) — script em "Checagem" abaixo — e re-renderizar os quadros apontados.
- O servidor `python3 -m http.server 8123` precisa rodar a partir da pasta do projeto durante o render.
- Placas: texto não pode passar da largura (560 px no cartão); conferir na prévia.
- Prévia: `node render.mjs stills/a "lista,de,quadros"` + `python3 sheet.py stills/a stills/sheet.jpg` e OLHAR antes do render completo.

## Como produzir um vídeo
1. Ler `temas.md`, escolher um tema NÃO usado, com duas datas/fatos fora de ordem. Pesquisar os fatos.
2. Copiar o projeto mais parecido de `motor/` (oxford = dois cenários + placas de datas + personagens com roupas; cleopatra = linha do tempo; torre = estrutura 3D; sol = espaço) para uma pasta de trabalho,
   copiar `motor/lib/three.module.js` para `web/lib/`, e a skill `desenho-animado-viral` (kit) se precisar de ferramentas.
3. Escrever `script.txt` (uma frase por linha), gerar voz, `python3 timing.py voice.wav script.txt --out work`.
4. Reescrever `web/main.js` (mundo) e `web/story.js` (cenas, câmeras, atores, placas) conforme as frases. Novas roupas em `web/roman.js` → `cat web/toonbase.js web/roman.js > web/toon.js`.
5. Prévia → corrigir → `audio.py` (DUR, MUSIC_END, efeitos por quadro) → `ffmpeg -i voice.wav -af apad=whole_dur=<DUR> voice_p.wav` → `python3 mix.py voice_p.wav music.wav sfx.wav`.
6. Render completo em blocos: `RESUME=1 node render.mjs frames "0-259"` etc. (~4 s/quadro).
7. `finish.sh` (com fade-out final) → checagem de piscadas → `legendas.py` → queimar legenda → capa → copiar para `videos/<id>.mp4` e `videos/<id>-capa.jpg` (JPEG).
8. Acrescentar o item em `fila.json` (status "pendente"), o tema em `temas.md`, commit e push.

## Checagem de piscadas
```python
from PIL import Image; import numpy as np
v=[np.asarray(Image.open(f'frames/f{f:04d}.jpg').convert('L').resize((108,192)),dtype=np.float32) for f in range(N)]
bad=[f for f in range(1,N-1) if np.abs(v[f]-v[f-1]).mean()>6 and np.abs(v[f+1]-v[f]).mean()>6 and np.abs(v[f+1]-v[f-1]).mean()<0.5*np.abs(v[f]-v[f-1]).mean()]
```
Quadros de corte de cena e placas surgindo são esperados; o resto é defeito.

## Como postar (1 Reel por dia: 19:10 de domingo a quinta, 20:40 sexta e sábado)
1. `git pull`; abrir `fila.json`; pegar o PRIMEIRO item com status "pendente".
2. URLs públicas: `https://raw.githubusercontent.com/raphaelssousa-spfc/palitolandia-midia/main/<caminho>`.
3. Windsor `execute_action` conector `instagram`, conta `17841460341094597`, ação `create_video_post` com `video_url`, `cover_url` (a capa .jpg), `caption` = legenda, `share_to_feed: true`.
4. Depois, `create_comment` no media_id com o texto de `comentario`.
5. Marcar o item como "postado" com data/hora e media_id; commit e push.
6. Se a fila estiver vazia: não postar nada e avisar o dono.

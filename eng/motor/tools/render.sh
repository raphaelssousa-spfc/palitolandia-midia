#!/bin/bash
# uso (dentro de eng/motor):
#   tools/render.sh still  src/<x>-index.ts <ComposicaoId> "30,250,560" out/previa    -> quadros + out/previa/sheet.jpg
#   tools/render.sh video  src/<x>-index.ts <ComposicaoId> ../videos/<id>.mp4          -> vídeo final (com limitador de áudio)
#   tools/render.sh capa   src/<x>-index.ts <ComposicaoId> ../videos/<id>-capa.jpg     -> capa JPEG
set -e
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install --silent >/dev/null
CH=$(node -e "require('@sparticuz/chromium').default.executablePath().then(p=>console.log(p))")
B=build_$(basename "$2" .ts)
rm -rf "$B"; npx remotion bundle "$2" --out-dir="$B" >/dev/null
OPTS="--browser-executable=$CH --chrome-mode=headless-shell"
case "$1" in
  still)
    mkdir -p "$5"; IFS=',' read -ra FR <<< "$4"
    for f in "${FR[@]}"; do npx remotion still "$B" "$3" "$5/f$f.png" --frame=$f $OPTS >/dev/null 2>&1 & done; wait
    python3 tools/sheet.py "$5" "$5/sheet.jpg" ;;
  video)
    npx remotion render "$B" "$3" out/tmp_render.mp4 $OPTS --concurrency=2 --crf=18 >out/render.log 2>&1
    ffmpeg -y -loglevel error -i out/tmp_render.mp4 -c:v copy -af alimiter=limit=0.89 -c:a aac -b:a 192k -movflags +faststart "$4"
    rm out/tmp_render.mp4; ffprobe -v error -show_entries format=duration -of csv=p=0 "$4" ;;
  capa)
    npx remotion still "$B" "$3" out/capa.png --frame=0 $OPTS >/dev/null 2>&1
    ffmpeg -y -loglevel error -i out/capa.png -q:v 2 "$4" ;;
esac

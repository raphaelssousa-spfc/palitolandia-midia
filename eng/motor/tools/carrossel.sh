#!/bin/bash
# uso (dentro de eng/motor):  tools/carrossel.sh carrosseis/<id>.json
#   → ../carrosseis/<id>/01.jpg, 02.jpg ... (1080x1350, JPEG) + ../carrosseis/<id>/previa.jpg
set -e
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install --silent >/dev/null
SPEC="$1"; ID=$(basename "$SPEC" .json); OUT=../carrosseis/$ID
CH=$(node -e "require('@sparticuz/chromium').default.executablePath().then(p=>console.log(p))")
rm -rf build_carrossel; npx remotion bundle src/carrossel-index.ts --out-dir=build_carrossel >/dev/null
mkdir -p "$OUT" out/car_$ID; rm -f "$OUT"/*.jpg
N=$(python3 -c "import json,sys;print(len(json.load(open('$SPEC'))['slides']))")
for ((i=0;i<N;i++)); do
  python3 -c "import json;print(json.dumps({'spec':json.load(open('$SPEC')),'i':$i}))" > out/car_$ID/p$i.json
  npx remotion still build_carrossel Slide out/car_$ID/s$i.png --frame=0 --props=out/car_$ID/p$i.json --browser-executable="$CH" --chrome-mode=headless-shell >/dev/null 2>&1 &
done; wait
for ((i=0;i<N;i++)); do ffmpeg -y -loglevel error -i out/car_$ID/s$i.png -q:v 2 "$OUT/$(printf %02d $((i+1))).jpg"; done
python3 - "$OUT" <<'PY'
import sys,glob
from PIL import Image
fs=sorted(glob.glob(sys.argv[1]+"/[0-9][0-9].jpg")); ims=[Image.open(f).resize((324,405)) for f in fs]
c=Image.new("RGB",(324*min(5,len(ims)),405*((len(ims)+4)//5)),"white")
for k,im in enumerate(ims): c.paste(im,((k%5)*324,(k//5)*405))
c.save(sys.argv[1].replace('/carrosseis/','/motor/out/')+"_previa.jpg",quality=85)
PY
ls "$OUT"

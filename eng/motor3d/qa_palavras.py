"""Folha "palavra-chave -> quadro": para cada palavra que nomeia algo na tela, mostra o quadro 0,3 s depois dela.
uso: python3 qa_palavras.py video.mp4 work/timing.json "1:desmor,6:racha,7:barras,..." saida.jpg
Confira que CADA palavra tem o objeto citado visível, grande e em foco. Se não tiver, ajuste a cena e re-renderize o trecho."""
import sys, json, subprocess, unicodedata
from PIL import Image, ImageDraw
vid, tj, lista, out = sys.argv[1:5]
T = json.load(open(tj)); W = T['words']
norm = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if c.isalnum())
tiles = []
for item in lista.split(','):
    i, pre = item.split(':'); i = int(i); pre = norm(pre)
    w = next((w for w in W if w['p'] == i and norm(w['w']).startswith(pre)), None)
    if not w: print('palavra não achada:', item); continue
    png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(w['s'] + 0.3), '-i', vid, '-frames:v', '1', '-vf', 'scale=216:384', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True).stdout
    from io import BytesIO; im = Image.open(BytesIO(png)).convert('RGB'); d = ImageDraw.Draw(im); d.rectangle((0, 0, 216, 22), fill='black'); d.text((4, 5), f"{w['w']} {w['s']:.1f}s", fill='yellow'); tiles.append(im)
c = 7; r = (len(tiles) + c - 1) // c; S = Image.new('RGB', (216 * c, 384 * r))
for k, im in enumerate(tiles): S.paste(im, ((k % c) * 216, (k // c) * 384))
S.save(out, quality=85); print(out)

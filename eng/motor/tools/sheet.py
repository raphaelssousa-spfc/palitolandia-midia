"""Junta os PNGs de uma pasta numa folha de prévia: python3 tools/sheet.py pasta saida.jpg"""
import sys, glob, re
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + "/f*.png"), key=lambda p: int(re.findall(r"f(\d+)", p.split("/")[-1])[0]))
ims = [Image.open(f).convert("RGB").resize((270, 480)) for f in fs]
cols = min(4, len(ims)); rows = (len(ims) + cols - 1) // cols
s = Image.new("RGB", (270 * cols, 480 * rows), "white")
for k, im in enumerate(ims): s.paste(im, ((k % cols) * 270, (k // cols) * 480))
s.save(sys.argv[2], quality=85)

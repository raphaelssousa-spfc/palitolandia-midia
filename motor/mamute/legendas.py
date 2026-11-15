"""Legendas estilo Shorts (ASS): 2-3 palavras por vez, MAIÚSCULAS, palavra falada em amarelo, números/palavras-chave em destaque."""
import re
SEGS = [(0.13, 2.49, 'Os mamutes viram as pirâmides prontas?'), (2.74, 3.62, 'Viu ou não viu?'), (3.95, 4.68, 'Comenta!'), (4.94, 5.5, 'Pirâmide:'), (5.69, 8.22, '2560 a.C.'), (8.5, 10.93, 'Último mamute: 2000 a.C.'), (11.21, 13.23, 'Mais de 500 anos depois!'), (13.48, 15.23, 'Enquanto o faraó suava no deserto,'), (15.37, 16.43, 'tinha mamute no gelo.'), (16.72, 17.7, 'Faraó de sandália,'), (17.82, 18.88, 'mamute de casaco!'), (19.33, 21.91, 'Foi numa ilha do Ártico, há uns 4.000 anos.'), (22.16, 24.97, 'No próximo: o tiranossauro conheceu o estegossauro?'), (25.25, 26.98, 'Manda pra quem vai duvidar!'), (27.24, 28.99, 'Segue @palitolandia.ia')]
KEY = {'deserto', '2560', 'estegossauro', 'mamute', 'mamutes', 'tiranossauro', '@palitolandia.ia', 'a.C.', 'gelo', '2000', 'faraó', 'duvidar', 'pirâmides', 'casaco', '4.000', 'sandália', 'ártico', 'comenta', '500', 'pirâmide'}
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
words = []  # (t0, t1, palavra)
for a, b, txt in SEGS:
    ws = txt.split(); w = [max(len(x.strip(",.!?:")), 2) for x in ws]; tot = sum(w); t = a
    for x, l in zip(ws, w):
        d = (b - a) * l / tot; words.append((t, t + d, x)); t += d
# agrupa em blocos de até 3 palavras (quebra em vírgula/segmento longo)
blocks, cur = [], []
for i, wd in enumerate(words):
    cur.append(wd)
    nxt = words[i + 1] if i + 1 < len(words) else None
    last = nxt is None or wd[2].endswith(",") or len(cur) == 3 or (nxt[0] - wd[1] > 0.3) or sum(len(c[2]) + 1 for c in cur) + len(nxt[2]) > 13
    if last: blocks.append(cur); cur = []
Y, W, K = "&H0000E6FF&", "&H00FFFFFF&", "&H0040D060&"   # BGR: amarelo, branco, verde
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,11,5,2,60,60,520,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
ev = []
for bi, blk in enumerate(blocks):
    for k, (t0, t1, w) in enumerate(blk):
        end = blk[k + 1][0] if k + 1 < len(blk) else (blocks[bi + 1][0][0] if bi + 1 < len(blocks) and blocks[bi + 1][0][0] - t1 < 0.15 else t1 + 0.12)
        parts = []
        for j, (_, _, x) in enumerate(blk):
            u = x.upper(); key = x.strip(",.!?:").lower() in KEY
            col = Y if j == k else (K if key else W)
            parts.append("{\\c" + col + "}" + u)
        pop = "{\\fscx88\\fscy88\\t(0,90,\\fscx108\\fscy108)\\t(90,160,\\fscx100\\fscy100)}" if k == 0 else ""
        ev.append(f"Dialogue: 0,{ts(t0)},{ts(end)},Cap,,0,0,0,,{pop}" + " ".join(parts))
open("legendas.ass", "w", encoding="utf-8").write(hdr + "\n".join(ev) + "\n")
print(len(blocks), "blocos,", len(words), "palavras")

"""Legendas estilo Shorts (ASS): 2-3 palavras por vez, MAIÚSCULAS, palavra falada em amarelo, números/palavras-chave em destaque."""
import re
SEGS = [(0.13, 3.46, 'Se o Sol sumisse agora ninguém ia perceber por oito minutos'), (3.67, 7.25, 'É o tempo que a luz dele leva para chegar até a Terra'), (7.69, 10.05, 'Nesse intervalo o céu continuaria azul e a tarde'), (10.18, 11.01, 'clara'), (11.43, 14.04, 'A própria gravidade viaja nessa velocidade'), (14.37, 17.4, 'então a Terra continuaria girando em volta do nada'), (17.85, 20.23, 'Acontece que passados os oito minutos'), (20.36, 21.77, 'tudo escurece de uma vez'), (22.19, 23.0, 'E tem mais:'), (23.13, 26.11, 'o Sol que você vê agora já é o de oito minutos atrás')]
KEY = {"sol", "oito", "minutos", "minuto", "luz", "terra", "gravidade", "escurece", "azul", "clara", "nada", "atrás", "perceber", "mais", "acontece"}
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
words = []  # (t0, t1, palavra)
for a, b, txt in SEGS:
    ws = txt.split(); w = [max(len(x.strip(",.")), 2) for x in ws]; tot = sum(w); t = a
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
            u = x.upper(); key = x.strip(",.").lower() in KEY
            col = Y if j == k else (K if key else W)
            parts.append("{\\c" + col + "}" + u)
        pop = "{\\fscx88\\fscy88\\t(0,90,\\fscx108\\fscy108)\\t(90,160,\\fscx100\\fscy100)}" if k == 0 else ""
        ev.append(f"Dialogue: 0,{ts(t0)},{ts(end)},Cap,,0,0,0,,{pop}" + " ".join(parts))
open("legendas.ass", "w", encoding="utf-8").write(hdr + "\n".join(ev) + "\n")
print(len(blocks), "blocos,", len(words), "palavras")

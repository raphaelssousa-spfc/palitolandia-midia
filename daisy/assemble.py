"""Monta o Reel da Daisy: clipes do TAAFT + legenda palavra por palavra + tela final.
Uso: python3 assemble.py saida.mp4 clip1.mp4 "fala 1" clip2.mp4 "fala 2" ...
"""
import sys, subprocess, re, json, os
ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
FONTS = os.path.join(ASSETS, "fonts")
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
pairs = list(zip(sys.argv[2::2], sys.argv[3::2]))
W, H = 1080, 1920
FONT = os.path.join(FONTS, "Bric-ExtraBold.ttf")
TMP = "/tmp/daisy_build"; os.makedirs(TMP, exist_ok=True)

def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())

def speech_span(f, d):
    out = subprocess.run(["ffmpeg", "-i", f, "-af", "silencedetect=noise=-32dB:d=0.25", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    s = 0.0
    if ends and starts and starts[0] < 0.05: s = ends[0]
    e = d
    if starts and starts[-1] > s + 1 and (len(ends) < len(starts)): e = starts[-1]
    return max(0, s), min(d, e)

# 1) normaliza clipes
norm = []
for i, (f, _) in enumerate(pairs):
    o = f"{TMP}/n{i}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-vf",
                    f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30,format=yuv420p",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-ar", "48000", "-ac", "2", o], check=True)
    norm.append(o)

# 2) tela final (2,5 s)
logo = Image.open(os.path.join(ASSETS, "Perfil-A.png")).convert("RGB").resize((560, 560))
card = Image.new("RGB", (W, H), "#5E8A68")
m = Image.new("L", (560, 560), 0); ImageDraw.Draw(m).ellipse((0, 0, 559, 559), fill=255)
card.paste(logo, ((W - 560) // 2, 430), m)
d = ImageDraw.Draw(card)
f1 = ImageFont.truetype(FONT, 78); f2 = ImageFont.truetype(os.path.join(FONTS, "Bric-SemiBold.ttf"), 50)
f3 = ImageFont.truetype(os.path.join(FONTS, "Caveat-Bold.ttf"), 84)
d.text((W / 2, 1110), "30 dinners. $75 a week.", font=f1, fill="white", anchor="mm")
d.text((W / 2, 1200), "The full plan is in my bio", font=f2, fill="#FFF3C4", anchor="mm")
# selo da promoção (trocar/remover quando a promoção acabar)
SALE = "ON SALE: $9.99 (was $17)"
if SALE:
    bw = d.textlength(SALE, font=f2) + 80
    d.rounded_rectangle(((W - bw) / 2, 1265, (W + bw) / 2, 1355), radius=45, fill="#F2B705")
    d.text((W / 2, 1310), SALE, font=f2, fill="#2F4A35", anchor="mm")
d.text((W / 2, 1450 if SALE else 1330), "Dinner's handled.", font=f3, fill="#F2B705", anchor="mm")
card.save(f"{TMP}/card.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", "2.5", "-i", f"{TMP}/card.png",
                "-f", "lavfi", "-t", "2.5", "-i", "anullsrc=r=48000:cl=stereo",
                "-vf", "fps=30,format=yuv420p,fade=in:0:8", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-c:a", "aac", "-shortest", f"{TMP}/card.mp4"], check=True)

# 3) concat
with open(f"{TMP}/list.txt", "w") as fh:
    for o in norm + [f"{TMP}/card.mp4"]: fh.write(f"file '{o}'\n")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{TMP}/list.txt",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", f"{TMP}/joined.mp4"], check=True)

# 4) legenda palavra por palavra (ASS)
def ts(t):
    h = int(t // 3600); m_ = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m_:02d}:{s:05.2f}"
events = []; off = 0.0
for (f, line), n in zip(pairs, norm):
    dd = dur(n); s, e = speech_span(n, dd)
    words = line.split(); weights = [len(re.sub(r"\W", "", w)) + 2 for w in words]; tot = sum(weights)
    # mostra em blocos de 3 palavras, destacando a atual
    t = off + s; span = max(0.5, e - s)
    times = []
    for w, wt in zip(words, weights):
        dt = span * wt / tot; times.append((t, t + dt)); t += dt
    for k in range(0, len(words), 3):
        grp = words[k:k + 3]
        for j in range(len(grp)):
            a, b = times[k + j]
            txt = " ".join((r"{\c&H05B7F2&}" + g + r"{\c&HFFFFFF&}") if jj == j else g for jj, g in enumerate(grp))
            events.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{txt}")
    off += dd
ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Bricolage Grotesque 96pt ExtraBold,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,2,2,60,60,520,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(events) + "\n"
open(f"{TMP}/caps.ass", "w").write(ass)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{TMP}/joined.mp4", "-vf",
                f"ass={TMP}/caps.ass:fontsdir={FONTS}", "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "20", "-c:a", "copy", "-movflags", "+faststart", OUT], check=True)
print("ok", OUT, round(dur(OUT), 1), "s")

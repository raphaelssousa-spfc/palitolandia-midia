"""Daisy Reel v2: gancho visual, cortes rápidos, legenda animada, figurinhas, tela final curta.
Uso: python3 assemble_v2.py roteiro.json
roteiro.json:
{
  "out": "videos/daisy-NN.mp4",
  "hook": ["THIS DINNER", "COST $5"],          # texto grande no topo (0-2.8 s)
  "hook_sub": "family of 5",                    # linha menor (opcional)
  "hook_emoji": "👀",                            # figurinha do gancho
  "dish": [2, 4.0],                              # [indice do clipe, segundo] -> foto do prato em círculo no gancho
  "clips": [
    {"file": "c1.mp4", "fala": "...", "tag": "", "emoji": ""},
    {"file": "c3.mp4", "fala": "...", "tag": "THE SECRET", "emoji": "🤫"},
    {"file": "c4.mp4", "fala": "...", "cta": true}
  ],
  "sale": "$9.99 (was $17)"                      # selo no CTA (vazio = sem)
}
"""
import sys, subprocess, re, json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets"); FONTS = os.path.join(ASSETS, "fonts")
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
W, H, FPS = 1080, 1920, 30
TMP = "/tmp/daisy_v2"; os.makedirs(TMP, exist_ok=True)
spec = json.load(open(sys.argv[1]))
BASE = os.path.dirname(os.path.abspath(sys.argv[1]))
def P(p): return p if os.path.isabs(p) else os.path.join(BASE, p)
def run(cmd): subprocess.run(cmd, check=True)
def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())

def speech_span(f, d):
    out = subprocess.run(["ffmpeg", "-i", f, "-af", "silencedetect=noise=-32dB:d=0.2", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    s = en[0] if (st and en and st[0] < 0.05) else 0.0
    e = d
    if st and st[-1] > s + 1 and len(en) < len(st): e = st[-1]
    return max(0, s - 0.12), min(d, e + 0.25)

def emoji_png(ch, size, path):
    f = ImageFont.truetype(EMOJI_FONT, 109)
    im = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox()).resize((size, size), Image.LANCZOS)
    im.save(path); return path

# 1) cortar silêncio, subir p/ 1080x1920 nítido, zoom lento alternado
clips = spec["clips"]; segs = []
for i, c in enumerate(clips):
    f = P(c["file"]); d = dur(f); s, e = speech_span(f, d); L = e - s
    z = "1.0+0.0016*on" if i % 2 == 0 else "1.08-0.0016*on"
    o = f"{TMP}/s{i}.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-t", f"{L:.3f}", "-i", f,
         "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},fps={FPS},"
                f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},"
                "unsharp=5:5:0.8:5:5:0,eq=saturation=1.08:contrast=1.03,format=yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-ar", "48000", "-ac", "2", o])
    segs.append((o, s, L))

# 2) tela final curta (1,3 s)
logo = Image.open(os.path.join(ASSETS, "Perfil-A.png")).convert("RGB").resize((420, 420))
card = Image.new("RGB", (W, H), "#5E8A68"); m = Image.new("L", (420, 420), 0)
ImageDraw.Draw(m).ellipse((0, 0, 419, 419), fill=255); card.paste(logo, ((W - 420) // 2, 560), m)
d = ImageDraw.Draw(card)
fB = ImageFont.truetype(os.path.join(FONTS, "Bric-ExtraBold.ttf"), 84)
fS = ImageFont.truetype(os.path.join(FONTS, "Bric-SemiBold.ttf"), 52)
fC = ImageFont.truetype(os.path.join(FONTS, "Caveat-Bold.ttf"), 90)
d.text((W / 2, 1090), "30 dinners. $75 a week.", font=fB, fill="white", anchor="mm")
d.text((W / 2, 1180), "Link in my bio", font=fS, fill="#FFF3C4", anchor="mm")
d.text((W / 2, 1300), "Dinner's handled.", font=fC, fill="#F2B705", anchor="mm")
card.save(f"{TMP}/card.png")
run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", "1.3", "-i", f"{TMP}/card.png", "-f", "lavfi", "-t", "1.3",
     "-i", "anullsrc=r=48000:cl=stereo", "-vf", f"fps={FPS},format=yuv420p,fade=in:0:5", "-c:v", "libx264",
     "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-shortest", f"{TMP}/card.mp4"])

with open(f"{TMP}/list.txt", "w") as fh:
    for o, _, _ in segs: fh.write(f"file '{o}'\n")
    fh.write(f"file '{TMP}/card.mp4'\n")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{TMP}/list.txt", "-c:v", "libx264",
     "-preset", "veryfast", "-crf", "18", "-c:a", "aac", f"{TMP}/joined.mp4"])
TOTAL = dur(f"{TMP}/joined.mp4"); VID_END = sum(L for _, _, L in segs)

# 3) ASS: gancho, etiquetas, CTA e legenda animada
def ts(t):
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"
Y, WH, GR, RD = "&H05B7F2&", "&HFFFFFF&", "&H68D47A&", "&H3B3BE8&"
ev = []
def add(a, b, style, txt, layer=1): ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},{style},,0,0,0,,{txt}")
POP = r"{\fscx40\fscy40\t(0,140,\fscx112\fscy112)\t(140,240,\fscx100\fscy100)}"
HOOK_END = min(2.8, segs[0][2])
hk = spec.get("hook", [])
for k, line in enumerate(hk):
    a = 0.0 + 0.12 * k
    add(a, HOOK_END, "Hook", r"{\an8\pos(540,%d)}" % (150 + 150 * k) + POP + line.replace("$", "{\\c" + Y + "}$", 1))
if spec.get("hook_sub"):
    add(0.35, HOOK_END, "Sub", r"{\an8\pos(540,%d)\fad(150,0)}" % (150 + 150 * len(hk) + 10) + spec["hook_sub"])
# etiquetas por clipe
off = 0.0; caps_y = 1060
for i, ((o, s, L), c) in enumerate(zip(segs, clips)):
    if c.get("tag"):
        add(off + 0.05, off + min(L, 3.0), "Tag", r"{\an8\pos(540,190)}" + POP + c["tag"])
    if c.get("cta"):
        add(off + max(0, L - 3.2), off + L, "Tag", r"{\an8\pos(540,190)}" + POP + "LINK IN BIO")
        if spec.get("sale"):
            add(off + max(0, L - 2.8), off + L, "Sale",
                r"{\an8\pos(540,330)\t(0,300,\fscx108\fscy108)\t(300,600,\fscx100\fscy100)\t(600,900,\fscx108\fscy108)\t(900,1200,\fscx100\fscy100)}"
                + "ON SALE " + spec["sale"])
    # legenda palavra por palavra
    o_s = 0.08; span = L - 0.08 - 0.25
    words = c["fala"].split(); wts = [len(re.sub(r"\W", "", w)) + 2 for w in words]; tot = sum(wts)
    t = off + o_s; times = []
    for w, wt in zip(words, wts):
        dt = span * wt / tot; times.append((t, t + dt)); t += dt
    k = 0
    while k < len(words):
        n = 2 if len(words[k]) > 7 else 3
        grp = words[k:k + n]
        for j in range(len(grp)):
            a, b = times[k + j]
            parts = []
            for jj, g in enumerate(grp):
                money = bool(re.search(r"dollar|\$|\d|five|nine|six|seven|eight|ten|thirty|free", g, re.I))
                if jj == j:
                    col = GR if money else Y
                    parts.append(r"{\c" + col + r"\fscx70\fscy70\t(0,90,\fscx118\fscy118)\t(90,170,\fscx108\fscy108)}" + g.upper() + r"{\fscx100\fscy100\c" + WH + "}")
                else:
                    parts.append(g.upper())
            add(a, b, "Cap", r"{\an5\pos(540,%d)}" % caps_y + " ".join(parts), 2)
        k += n
    off += L
head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Bricolage Grotesque 96pt ExtraBold,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,-1,0,0,0,100,100,0,0,1,8,4,5,50,50,0,1
Style: Hook,Bricolage Grotesque 96pt ExtraBold,118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,10,6,8,30,30,0,1
Style: Sub,Bricolage Grotesque 96pt ExtraBold,64,&H00161616,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,18,0,8,30,30,0,1
Style: Tag,Bricolage Grotesque 96pt ExtraBold,96,&H00FFFFFF,&H00FFFFFF,&H00687A5E,&H00687A5E,-1,0,0,0,100,100,2,0,3,22,0,8,30,30,0,1
Style: Sale,Bricolage Grotesque 96pt ExtraBold,66,&H00354A2F,&H00FFFFFF,&H0005B7F2,&H0005B7F2,-1,0,0,0,100,100,0,0,3,18,0,8,30,30,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(f"{TMP}/fx.ass", "w").write(head + "\n".join(ev) + "\n")

# 4) figurinhas PNG (prato em círculo + emojis)
ov = []  # (png, x, y, t0, t1)
if spec.get("dish"):
    ci, tt = spec["dish"]; o, s, L = segs[ci]
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, tt - s):.2f}", "-i", o, "-frames:v", "1", f"{TMP}/dish.png"])
    im = Image.open(f"{TMP}/dish.png").convert("RGB")
    cx, cy, r = W // 2, int(H * 0.70), 320  # recorte central-baixo (onde fica o prato)
    if spec.get("dish_box"): cx, cy, r = spec["dish_box"]
    im = im.crop((cx - r, cy - r, cx + r, cy + r)).resize((400, 400), Image.LANCZOS)
    D = 420; out = Image.new("RGBA", (D, D), (0, 0, 0, 0)); dd = ImageDraw.Draw(out)
    dd.ellipse((0, 0, D - 1, D - 1), fill="white")
    mk = Image.new("L", (400, 400), 0); ImageDraw.Draw(mk).ellipse((0, 0, 399, 399), fill=255)
    out.paste(im, (10, 10), mk); out.save(f"{TMP}/dish_c.png")
    ov.append((f"{TMP}/dish_c.png", 630, 560, 0.25, HOOK_END))
if spec.get("hook_emoji"):
    ov.append((emoji_png(spec["hook_emoji"], 150, f"{TMP}/e_hook.png"), 560, 520, 0.5, HOOK_END))
off = 0.0
for i, ((o, s, L), c) in enumerate(zip(segs, clips)):
    if c.get("emoji"):
        ov.append((emoji_png(c["emoji"], 170, f"{TMP}/e{i}.png"), 840, 330, off + 0.2, off + min(L, 3.0)))
    if c.get("cta"):
        ov.append((emoji_png("👆", 160, f"{TMP}/e_up.png"), 830, 60, off + max(0, L - 3.2), off + L))
    off += L

inputs = ["-i", f"{TMP}/joined.mp4"]
for p_, *_ in ov: inputs += ["-loop", "1", "-i", p_]
fc = []; last = "[0:v]"
for k, (p_, x, y, a, b) in enumerate(ov, start=1):
    # entra com "pop" (sobe 40 px nos 0,2 s) e some no fim
    fc.append(f"[{k}:v]format=rgba,fade=in:st={a:.2f}:d=0.15:alpha=1,fade=out:st={max(a, b - 0.15):.2f}:d=0.15:alpha=1[o{k}]")
    fc.append(f"{last}[o{k}]overlay=x={x}:y='{y}+40*max(0,1-(t-{a:.2f})/0.2)':enable='between(t,{a:.2f},{b:.2f})':shortest=1[v{k}]")
    last = f"[v{k}]"
# barra de progresso amarela no topo
fc.append(f"{last}drawbox=x=0:y=0:w='iw*min(1,t/{VID_END:.2f})':h=14:color=0xF2B705@0.95:t=fill:enable='lt(t,{VID_END:.2f})',"
          f"ass={TMP}/fx.ass:fontsdir={FONTS}[vout]")
run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "0:a",
     "-t", f"{TOTAL:.2f}", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", P(spec["out"])])
print("ok", spec["out"], round(dur(P(spec["out"])), 1), "s")

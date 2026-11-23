import subprocess, json, re, numpy as np, wave, os, sys
KIT = os.path.dirname(os.path.abspath(__file__))
WORK, SAIDA = sys.argv[1], os.path.abspath(sys.argv[2])
os.chdir(WORK)
CLIPS = sorted([f for f in os.listdir(".") if re.fullmatch(r"c\d+\.mp4", f)], key=lambda f: int(f[1:-4]))
FALAS = json.load(open("falas.json"))
assert len(FALAS) == len(CLIPS), "falas.json precisa ter 1 fala por clipe"
def sh(c): return subprocess.run(c, shell=True, check=True, capture_output=True, text=True).stdout
def dur(f): return float(sh(f"ffprobe -v error -show_entries format=duration -of csv=p=0 {f}"))

# 1) normalize each clip to 1080x1920 30fps, 48k stereo
for i, c in enumerate(CLIPS):
    sh(f"ffmpeg -v error -y -i {c} -vf scale=1080:1920:flags=lanczos,fps=30,format=yuv420p "
       f"-af aresample=48000,afade=t=in:d=0.05 -ac 2 -c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 192k n{i}.mp4")

# 2) speech window per clip: voice-band energy
def speech_runs(f):
    sh(f"ffmpeg -v error -y -i {f} -af highpass=f=250,lowpass=f=3000 -ac 1 -ar 16000 tmp.wav")
    w = wave.open("tmp.wav"); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
    h = 800; e = np.array([np.sqrt(np.mean(a[k:k+h]**2)) for k in range(0, len(a)-h, h)])  # 50 ms
    thr = 0.33 * np.percentile(e, 95)
    on = e > thr; runs = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            runs.append([i*0.05, j*0.05]); i = j
        else: i += 1
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < 0.35: merged[-1][1] = r[1]
        else: merged.append(r)
    return [r for r in merged if r[1] - r[0] >= 0.35]

def place_words(words, runs):
    total = sum(b - a for a, b in runs); tot = sum(len(w) + 1 for w in words)
    def tmap(x):  # voiced seconds -> clip time
        for a, b in runs:
            if x <= b - a: return a + x
            x -= b - a
        return runs[-1][1]
    out = []; c = 0.0
    for w in words:
        d = total * (len(w) + 1) / tot
        out.append((tmap(c + 0.001), tmap(c + d))); c += d
    return out

durs = [dur(f"n{i}.mp4") for i in range(len(CLIPS))]
END = 2.6
T = sum(durs) + END

def ass_time(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

events = []; off = 0.0
for i, f in enumerate(FALAS):
    words = f.split()
    times = [(off + a, off + b) for a, b in place_words(words, speech_runs(f"n{i}.mp4"))]
    # chunks of up to 3 words, break on punctuation
    chunks, cur = [], []
    for k, w in enumerate(words):
        cur.append(k)
        if len(cur) == 3 or w[-1] in ",.?:": chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    for ch in chunks:
        for k in ch:  # one event per word: whole chunk, current word yellow
            txt = " ".join(("{\\c&H00D7FF&}" + words[j].upper() + "{\\c&HFFFFFF&}") if j == k else words[j].upper() for j in ch)
            a, b = times[k]
            events.append(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Leg,,0,0,0,,{{\\q2}}{txt}")
    off += durs[i]

ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Fira Sans Black,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,7,3,2,90,90,560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(events) + "\n"
open("leg.ass", "w").write(ass)

# 3) end card (HyperFrames render) normalized
sh("ffmpeg -v error -y -i endcard_raw.mp4 -vf fps=30,format=yuv420p -af aresample=48000 -ac 2 -c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 192k end.mp4")

# 4) concat + subtitles
open("lista.txt", "w").write("".join(f"file 'n{i}.mp4'\n" for i in range(len(CLIPS))) + "file 'end.mp4'\n")
sh("ffmpeg -v error -y -f concat -safe 0 -i lista.txt -c copy junto.mp4")
sh(f"ffmpeg -v error -y -i junto.mp4 -vf \"ass=leg.ass:fontsdir={KIT}/endcard/assets/fonts\" "
   f"-af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 192k -movflags +faststart \"{SAIDA}\"")
print("ok", round(T, 2))

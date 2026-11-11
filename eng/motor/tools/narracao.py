"""Gera a narração de um vídeo do @eng.raphaelserra a partir de um roteiro.

uso:  python3 tools/narracao.py roteiros/<id>.txt <id> [--voz pm_santa] [--vel 1.12] [--fim 3.2]

Roteiro: UMA CENA POR LINHA (linhas vazias são ignoradas).
  Para a voz ler diferente da legenda (siglas, nomes): "texto da voz || texto da legenda"
  ex.: "Segundo o i bê gê é, o metro... || Segundo o IBGE, o metro..."

Saídas (rodar dentro de eng/motor):
  public/voice_<id>.wav     narração completa (ritmo dinâmico, pausas cortadas, -14 LUFS)
  src/timing_<id>.json      {"durs": [duração de cada cena em s], "words": [{w, s, e, scene}]}
  src/mouth_<id>.json       abertura da boca do avatar por quadro (30 fps), 0..1
"""
import os, re, sys, json, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MOTOR = os.path.dirname(HERE)
OFF = 0.1      # silêncio antes de cada cena
GAP = 0.18     # respiro no fim de cada cena

def arg(name, default):
    a = sys.argv
    return a[a.index(name) + 1] if name in a else default

def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))

def main():
    rot, vid = sys.argv[1], sys.argv[2]
    voz, vel, fim = arg("--voz", "pm_santa"), arg("--vel", "1.12"), float(arg("--fim", "3.2"))
    work = os.path.join(MOTOR, "out", "narr_" + vid); os.makedirs(work, exist_ok=True)
    cenas = [l.strip() for l in open(rot, encoding="utf-8") if l.strip()]
    pares = [(c.split("||")[0].strip(), (c.split("||")[1] if "||" in c else c.split("||")[0]).strip()) for c in cenas]
    N = len(pares)
    procs = []
    for i, (v, _) in enumerate(pares):
        open(f"{work}/v{i}.txt", "w", encoding="utf-8").write(v + "\n")
        procs.append(subprocess.Popen([sys.executable, os.path.join(HERE, "voz.py"), f"{work}/v{i}.txt", f"{work}/raw{i}.wav", "--voz", voz, "--vel", vel],
                                      stdout=subprocess.DEVNULL, stderr=subprocess.PIPE) if i else None)
        if i == 0:  # primeira sozinha (baixa o modelo se precisar)
            subprocess.run([sys.executable, os.path.join(HERE, "voz.py"), f"{work}/v0.txt", f"{work}/raw0.wav", "--voz", voz, "--vel", vel], check=True)
    for p in procs:
        if p and p.wait(): sys.exit(p.stderr.read().decode())
    words, durs, start = [], [], 0.0
    for sc, (_, leg) in enumerate(pares):
        f = f"{work}/n{sc}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{work}/raw{sc}.wav", "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.14:stop_threshold=-45dB,"
                        "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", f], check=True)
        L = dur(f)
        sents = [s for s in re.split(r"(?<=[.!?])\s+", leg) if s]
        r = subprocess.run(["ffmpeg", "-i", f, "-af", "silencedetect=n=-42dB:d=0.09", "-f", "null", "-"], capture_output=True, text=True).stderr
        ss = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
        se = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
        segs, cur = [], 0.0
        for a, b in zip(ss, se + [L] * (len(ss) - len(se))):
            if a > cur + 0.05: segs.append((cur, a))
            cur = b
        if cur < L - 0.05: segs.append((cur, L))
        if len(segs) != len(sents):
            s0, s1 = segs[0][0], segs[-1][1]; ch = [len(s) for s in sents]; tot = sum(ch); segs = []; a = s0
            for c in ch: segs.append((a, a + (s1 - s0) * c / tot)); a = segs[-1][1]
        D = round(round((L + OFF + (GAP if sc < N - 1 else fim)) * 30) / 30, 4); durs.append(D)
        for snt, (a, b) in zip(sents, segs):
            ws = snt.split(); wt = [len(w) + 2 + (3 if re.search(r"[,:]$", w) else 0) for w in ws]; tot = sum(wt); t = a
            for w, k in zip(ws, wt):
                d = (b - a) * k / tot
                words.append({"w": w, "s": round(start + OFF + t, 3), "e": round(start + OFF + t + d * (len(w) + 2) / k, 3), "scene": sc}); t += d
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-af",
                        f"aresample=48000,aformat=channel_layouts=stereo,adelay={int(OFF*1000)}|{int(OFF*1000)},apad",
                        "-t", str(D), "-c:a", "pcm_s16le", f"{work}/a{sc}.wav"], check=True)
        start += D
    open(f"{work}/alist.txt", "w").write("".join(f"file 'a{i}.wav'\n" for i in range(N)))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{work}/alist.txt", "-c", "copy", f"{work}/raw_all.wav"], check=True)
    voice = os.path.join(MOTOR, "public", f"voice_{vid}.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{work}/raw_all.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", voice], check=True)
    json.dump({"words": words, "durs": durs}, open(os.path.join(MOTOR, "src", f"timing_{vid}.json"), "w"), ensure_ascii=False)
    # boca do avatar
    w = wave.open(voice); sr = w.getframerate(); ch = w.getnchannels()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, ch).mean(1) / 32768
    hop = sr // 30; n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop] ** 2)) for i in range(n)])
    ref = np.percentile(rms[rms > 0.01], 90)
    m = np.clip((rms - 0.012) / (ref - 0.012), 0, 1); o = np.zeros_like(m)
    for i in range(n):
        p = o[i-1] if i else 0; o[i] = p + (m[i] - p) * (0.75 if m[i] > p else 0.45)
    json.dump([round(float(v), 3) for v in o], open(os.path.join(MOTOR, "src", f"mouth_{vid}.json"), "w"))
    print("cenas:", N, "durações:", durs, "total: %.2f s" % sum(durs))
    print("quadros de início de cada cena:", [round(sum(durs[:i]) * 30) for i in range(N)])

if __name__ == "__main__":
    main()

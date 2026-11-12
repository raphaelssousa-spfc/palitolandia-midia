"""Narração frase a frase (pm_santa) -> voice.wav + work/timing.json (frases e palavras com tempo exato)."""
import os, re, sys, json
sys.argv = ["x"]  # voz.py lê argv só no main
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "voz.py")).read().split("def main():")[0]
exec(src)  # MODEL, br()
k = Kokoro(MODEL, os.path.join(HERE, "vozes_ptbr.npz")); SR = 24000
VOICE, SPEED = "pm_santa", float(os.environ.get("VEL", "1.08"))
S = json.load(open(os.path.join(HERE, "script.json")))
NUM = {"15": 3, "@eng.raphaelserra": 9}
def syl(w):
    if w in NUM: return NUM[w]
    return max(1, len(re.findall(r"[aeiouáéíóúâêôãõà]+", w.lower())))
def pauses(y, thr=0.012, mind=0.11):
    """trechos de silêncio internos (em segundos) num clipe já aparado"""
    win = int(SR * 0.01); n = len(y) // win
    e = np.array([np.abs(y[i*win:(i+1)*win]).max() for i in range(n)])
    out = []; i = 0
    while i < n:
        if e[i] < thr:
            j = i
            while j < n and e[j] < thr: j += 1
            if (j - i) * 0.01 >= mind and i > 5 and j < n - 5: out.append(((i + j) / 2) * 0.01)
            i = j
        else: i += 1
    return out
parts = [np.zeros(int(SR * 0.08), np.float32)]; t = 0.08
phr, words = [], []
for idx, p in enumerate(S):
    y, _ = k.create(br(k.tokenizer.phonemize(p["say"], "pt-br")), voice=VOICE, speed=SPEED, is_phonemes=True)
    nz = np.where(np.abs(y) > 0.01)[0]; y = y[max(0, nz[0] - 200): nz[-1] + 400].astype(np.float32)
    d = len(y) / SR
    chunks = [c.strip() for c in re.split(r"(?<=[,:])\s+", p["show"]) if c.strip()]
    ps = pauses(y)
    bounds = [0.0]
    if len(ps) >= len(chunks) - 1 and len(chunks) > 1:
        # escolhe as pausas mais próximas das fronteiras esperadas por sílabas
        tot = sum(syl(w) for c in chunks for w in c.split()); acc = 0
        for c in chunks[:-1]:
            acc += sum(syl(w) for w in c.split()); exp = d * acc / tot
            best = min(ps, key=lambda x: abs(x - exp)); bounds.append(best)
        bounds = sorted(set(bounds))
        if len(bounds) != len(chunks): bounds = [0.0]
    if len(bounds) != len(chunks):
        chunks = [p["show"]]; bounds = [0.0]
    bounds.append(d)
    for ci, c in enumerate(chunks):
        a, b = bounds[ci], bounds[ci + 1]
        if ci > 0: a += 0.05
        if ci < len(chunks) - 1: b -= 0.05
        ws = c.split(); W = sum(syl(w) for w in ws); tt = a
        for w in ws:
            dd = (b - a) * syl(w) / W
            words.append({"w": w, "s": round(t + tt, 3), "e": round(t + tt + dd, 3), "p": idx}); tt += dd
    phr.append({"i": idx, "text": p["show"], "s": round(t, 3), "e": round(t + d, 3)})
    gap = 2.6 if idx == len(S) - 1 else (0.22 if p["say"].rstrip()[-1] in ".!?" else 0.12)
    parts += [y, np.zeros(int(SR * gap), np.float32)]; t += d + gap
y = np.concatenate(parts); sf.write(os.path.join(HERE, "voice.wav"), y, SR)
D = len(y) / SR
json.dump({"duration": D, "frames": int(round(D * 30)), "phrases": phr, "words": words}, open(os.path.join(HERE, "work/timing.json"), "w"), ensure_ascii=False, indent=1)
print(f"{D:.2f}s  {int(round(D*30))} quadros")
for p in phr: print(f"{p['i']:2d} {p['s']:6.2f}-{p['e']:6.2f} f{int(p['s']*30):4d}  {p['text']}")

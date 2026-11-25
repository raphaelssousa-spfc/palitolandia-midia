"""Música de fundo da Daisy: violão/ukulele dedilhado + baixo + chocalho leve, alegre e caseira.
Sintetizada aqui (Karplus-Strong), então não tem direito autoral.
Uso: python3 make_music.py saida.wav [segundos] [semente]
A semente (ex.: número do vídeo) troca progressão, andamento e tom, pra não repetir igual todo dia.
"""
import sys, wave, numpy as np

SR = 44100
out = sys.argv[1]
secs = float(sys.argv[2]) if len(sys.argv) > 2 else 20
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
rng = np.random.default_rng(seed)

PROGS = [  # graus em semitons a partir da tônica (maior, tudo "feliz")
    [(0, "M"), (7, "M"), (9, "m"), (5, "M")],    # I V vi IV
    [(0, "M"), (5, "M"), (7, "M"), (5, "M")],    # I IV V IV
    [(0, "M"), (9, "m"), (5, "M"), (7, "M")],    # I vi IV V
    [(5, "M"), (0, "M"), (7, "M"), (9, "m")],    # IV I V vi
]
prog = PROGS[seed % len(PROGS)]
key = [0, 2, 5, 7, -3][seed % 5]            # C, D, F, G, A
bpm = [96, 100, 104, 92][seed % 4]
beat = 60 / bpm
n = int(secs * SR) + SR
mix = np.zeros(n)

def pluck(freq, dur, amp, bright=0.5):
    L = int(SR / freq); N = int(dur * SR)
    buf = rng.uniform(-1, 1, L) * amp
    y = np.empty(N)
    for i in range(N):
        y[i] = buf[i % L]
        buf[i % L] = 0.996 * (bright * buf[i % L] + (1 - bright) * buf[(i + 1) % L])
    env = np.minimum(1, np.arange(N) / 80)
    return y * env

def hz(semi):  # semitons a partir do C4
    return 261.63 * 2 ** (semi / 12)

def add(sig, t):
    i = int(t * SR); j = min(n, i + len(sig)); mix[i:j] += sig[: j - i]

t = 0.0; bar = 0
pattern = [0, 2, 1, 2, 0, 2, 1, 2]  # dedilhado em colcheias: baixo-alto-meio-alto
while t < secs:
    root, q = prog[bar % 4]
    r = key + root
    third = 3 if q == "m" else 4
    tones = [r, r + 7, r + 12 + third]  # tônica, quinta, terça em cima
    # baixo (oitava de baixo) nos tempos 1 e 3
    for b in (0, 2):
        add(pluck(hz(r - 24), beat * 2, 0.55, 0.3), t + b * beat)
    for k, p in enumerate(pattern):
        tt = t + k * beat / 2 + rng.uniform(0, 0.012)
        add(pluck(hz(tones[p]), beat * 1.5, 0.28 + 0.05 * (k % 2 == 0), 0.55), tt)
    # chocalho suave nas colcheias
    for k in range(8):
        N = int(0.05 * SR)
        sh = rng.normal(0, 1, N) * np.exp(-np.arange(N) / (0.012 * SR)) * (0.025 if k % 2 else 0.015)
        sh = np.diff(sh, prepend=0)  # tira grave, fica chiado
        add(sh, t + k * beat / 2)
    t += 4 * beat; bar += 1

mix = mix[: int(secs * SR)]
# eco curto (ambiente) e normalização
d = int(0.18 * SR); mix[d:] += 0.25 * mix[:-d].copy()
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.8
st = np.stack([mix, np.roll(mix, int(0.012 * SR)) * 0.95], 1)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
print("ok", out, secs, "s", "bpm", bpm, "seed", seed)

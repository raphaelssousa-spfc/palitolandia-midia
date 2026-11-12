"""Gera a abertura da boca do avatar (0..1 por quadro, 30 fps) a partir da narração.
Mesmo cálculo usado no vídeo pavimentacao-01-buracos.

uso:  python3 boca_do_audio.py narracao.wav mouth.json
(se o áudio for MP3, converta antes:  ffmpeg -i narracao.mp3 -ar 48000 -ac 2 narracao.wav)
requer: numpy
"""
import sys, json, wave
import numpy as np

FPS = 30
LIMIAR = 0.012      # volume (RMS) abaixo disso = boca fechada
PERCENTIL = 90      # volume que corresponde à boca totalmente aberta
ATAQUE = 0.75       # rapidez para abrir (0..1)
SOLTURA = 0.45      # rapidez para fechar (0..1)

def main(entrada, saida):
    w = wave.open(entrada)
    sr, ch = w.getframerate(), w.getnchannels()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, ch).mean(1) / 32768
    hop = sr // FPS
    n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    ref = np.percentile(rms[rms > 0.01], PERCENTIL)
    alvo = np.clip((rms - LIMIAR) / (ref - LIMIAR), 0, 1)
    boca = np.zeros_like(alvo)
    for i in range(n):
        ant = boca[i - 1] if i else 0
        boca[i] = ant + (alvo[i] - ant) * (ATAQUE if alvo[i] > ant else SOLTURA)
    json.dump([round(float(v), 3) for v in boca], open(saida, "w"))
    print(f"{n} quadros ({n / FPS:.1f} s) -> {saida}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

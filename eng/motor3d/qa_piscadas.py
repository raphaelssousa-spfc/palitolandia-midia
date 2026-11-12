"""Detector de piscadas: aponta quadros que mudam muito e voltam no quadro seguinte (flash, objeto que some/aparece, z-fighting).
uso: python3 qa_piscadas.py video.mp4   -> lista tempos suspeitos (vazio = ok)"""
import sys, subprocess, numpy as np
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
n = len(raw) // (W * H); a = np.frombuffer(raw, np.uint8)[:n * W * H].reshape(n, H, W).astype(np.int16)
achou = 0
for i in range(1, n - 1):
    ida = np.abs(a[i] - a[i - 1]); volta = np.abs(a[i + 1] - a[i - 1]); vizinhos = np.abs(a[i + 1] - a[i])
    m = (ida > 45) & (vizinhos > 45) & (volta < 10)          # muda e volta = piscada
    if m.sum() > 60 or (ida.mean() > 18 and volta.mean() < ida.mean() * 0.3):
        ys, xs = np.nonzero(m) if m.sum() else ([0], [0]); achou += 1
        print(f'quadro {i}  t={i/30:.2f}s  área={int(m.sum())}px  y≈{int(np.mean(ys))*4} x≈{int(np.mean(xs))*4}')
print('OK: nenhuma piscada' if not achou else f'{achou} quadro(s) suspeito(s) — olhe e corrija antes de entregar')

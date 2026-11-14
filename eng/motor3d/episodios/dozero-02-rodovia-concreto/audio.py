"""Trilha + efeitos sintetizados -> music.wav, sfx.wav (48 kHz mono)"""
import json, numpy as np, wave
SR = 48000
TM = json.load(open('work/timing.json')); S = [p['s'] for p in TM['phrases']]; E = [p['e'] for p in TM['phrases']]; D = TM['duration']
N = int(D * SR) + SR
NP = len(S); LAST = NP - 1
WD = TM['words']
def wt(i, pre):
    for w in WD:
        if w['p']==i and ''.join(c for c in w['w'].lower() if c.isalnum() or c in 'àáâãéêíóôõúç').startswith(pre): return w['s']
    return S[i]
rng = np.random.default_rng(3)
music = np.zeros(N); sfx = np.zeros(N)
t_ = lambda d: np.arange(int(d * SR)) / SR
def put(buf, at, x, g=1.0):
    i = int(at * SR); x = x[: max(0, len(buf) - i)]; buf[i:i + len(x)] += x * g
def env(n, a=0.005, r=0.1, d=None):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if d is None: d = n / SR
    tt = np.arange(n) / SR; e *= np.exp(-tt / max(r, 1e-3)); return e
def lp(x, k=0.05):  # filtro passa-baixa simples
    y = np.zeros_like(x); a = 0.0
    for i in range(len(x)): a += k * (x[i] - a); y[i] = a
    return y
def lpf(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f > cutoff] *= np.exp(-(f[f > cutoff] - cutoff) / (cutoff * 0.3)); return np.fft.irfft(X, len(x))
def hpf(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f < cutoff] *= (f[f < cutoff] / cutoff) ** 2; return np.fft.irfft(X, len(x))
# ---------- efeitos ----------
def whoosh(d=0.5):
    n = int(d * SR); x = rng.standard_normal(n); x = lpf(x, 2500); x = hpf(x, 300); e = np.sin(np.linspace(0, np.pi, n)) ** 2; return x * e * 0.35
def thud(f=60, d=0.5):
    tt = t_(d); fr = f * (1 + 1.5 * np.exp(-tt * 25)); ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) * np.exp(-tt * 7); nz = lpf(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 18) * 0.6; return (x + nz) * 0.9
def boom(d=2.2):
    tt = t_(d); ph = 2 * np.pi * np.cumsum(45 * (1 + 0.8 * np.exp(-tt * 6))) / SR
    return (np.sin(ph) * np.exp(-tt * 1.6) + lpf(rng.standard_normal(len(tt)), 400) * np.exp(-tt * 3) * 0.5) * 0.9
def ding(f=1320, d=0.6):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 7) * 0.35
def pop(d=0.12):
    tt = t_(d); return np.sin(2 * np.pi * (500 + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30) * 0.4
def beep(f=2400, d=0.09):
    tt = t_(d); e = np.minimum(1, np.minimum(tt / 0.005, (d - tt) / 0.005)); return np.sign(np.sin(2 * np.pi * f * tt)) * e * 0.12
def alarm(at, f=880, n=2):
    for k in range(n): put(sfx, at + k * 0.22, beep(f, 0.14), 1.4)
def clank(d=0.25):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(1830, 1), (2710, .6), (4120, .4)]); return x * np.exp(-tt * 28) * 0.18
def heart(at, beats, bpm=72):
    for k in range(beats):
        b = at + k * 60 / bpm; put(sfx, b, thud(48, 0.3), 0.55); put(sfx, b + 0.18, thud(44, 0.3), 0.4)
def buzz(d=0.45):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * 140 * tt)) + 0.5 * np.sign(np.sin(2 * np.pi * 147 * tt)); return lpf(x, 1800) * np.minimum(1, (d - tt) / 0.05) * 0.18
def ring(d=1.4):
    tt = t_(d); x = np.sin(2 * np.pi * 1400 * tt) * (np.sin(2 * np.pi * 20 * tt) > 0) + 0.5 * np.sin(2 * np.pi * 1750 * tt) * (np.sin(2 * np.pi * 20 * tt) > 0)
    gate = ((tt % 0.7) < 0.45).astype(float); return x * gate * 0.13
def riser(d=0.9):
    tt = t_(d); x = hpf(rng.standard_normal(len(tt)), 1500) * (tt / d) ** 2; return x * 0.3
def tick(): tt = t_(0.03); return rng.standard_normal(len(tt)) * np.exp(-tt * 200) * 0.25


def scrape(d=0.18):
    n=int(d*SR); x=lpf(rng.standard_normal(n),1800); return x*np.exp(-np.arange(n)/SR*18)*0.5
def splash(d=0.5):
    n=int(d*SR); x=hpf(lpf(rng.standard_normal(n),3500),400); return x*np.exp(-np.arange(n)/SR*7)*0.4
def rumble(d=1.6):
    tt=t_(d); x=lpf(rng.standard_normal(len(tt)),220)*np.minimum(1,tt/0.2)*np.minimum(1,(d-tt)/0.4); return x*1.6
def crackS():
    tt=t_(0.4); x=hpf(rng.standard_normal(len(tt)),2000)*np.exp(-tt*14)*(np.sin(2*np.pi*31*tt)>0.2); return x*0.7
def hum(d, f=110):
    tt=t_(d); x=np.tanh(3*np.sin(2*np.pi*f*tt))+0.4*np.sin(2*np.pi*2*f*tt); return x*np.minimum(1,tt/0.1)*np.minimum(1,(d-tt)/0.1)*0.08

def rainS(d):
    n=int(d*SR); x=hpf(rng.standard_normal(n),1200)*0.12; return x*np.minimum(1,np.arange(n)/SR/0.3)*np.minimum(1,(d-np.arange(n)/SR)/0.3)
def engine(d, f=55):
    tt=t_(d); x=np.tanh(2*np.sin(2*np.pi*f*tt))+0.3*lpf(rng.standard_normal(len(tt)),300); return x*np.minimum(1,tt/0.2)*np.minimum(1,(d-tt)/0.3)*0.12
def sawS(d):
    tt=t_(d); x=np.sin(2*np.pi*(1800+60*np.sin(2*np.pi*3*tt))*tt)+0.5*hpf(rng.standard_normal(len(tt)),2500); return x*np.minimum(1,tt/0.1)*np.minimum(1,(d-tt)/0.1)*0.09
# cortes de tomada
for i in range(1, NP): put(sfx, S[i]-0.35, whoosh(0.55), 0.7)
# 0 betoneira
put(sfx, 0.1, engine(S[1]-0.3, 48), 1.0)
put(sfx, wt(0,'estrada')-0.1, pop(), 1)
# 1 caminhão, afunda, quebra
put(sfx, S[1]-0.1, engine(E[1]-S[1]+0.3, 42), 1.2); put(sfx, wt(1,'afunda')-0.1, rumble(1.0), 0.8)
put(sfx, wt(1,'quebra')-0.1, crackS(), 1.3); put(sfx, wt(1,'quebra')-0.05, thud(55,0.6), 1.2); put(sfx, wt(1,'quebra')+0.05, pop(), 0.8)
# 2 rolo compactador
put(sfx, S[2]+0.1, rumble(E[2]-S[2]), 0.7); put(sfx, wt(2,'compacta')-0.05, pop(), 0.9); put(sfx, wt(2,'camada')-0.05, pop(), 0.9)
put(sfx, S[3]+0.25, pop(), 1); put(sfx, S[3]+0.3, ding(1320), 0.9)
# 4 retração
put(sfx, S[4]-0.1, splash(0.4), 0.6)
put(sfx, wt(4,'racha')-0.15, crackS(), 1.2); put(sfx, wt(4,'racha')+0.1, crackS(), 0.8); put(sfx, wt(4,'racha')+0.05, pop(), 0.8)
# 5 serra
ts=wt(5,'serra')-0.5; put(sfx, ts, sawS(E[5]-ts), 1.2); put(sfx, wt(5,'serra')+0.05, pop(), 0.8)
put(sfx, S[6]+0.25, pop(), 1); put(sfx, S[6]+0.3, ding(1480), 0.9)
# 7 degrau
put(sfx, wt(7,'afunda')-0.2, thud(60,0.5), 1.0); put(sfx, wt(7,'degrau')+0.05, pop(), 1); put(sfx, wt(7,'degrau')+0.05, buzz(0.3), 0.5)
# 8-9 barras lisas
for i in range(10): put(sfx, wt(8,'barras')-0.25+i*0.06, clank(), 0.8)
put(sfx, wt(8,'lisas')-0.05, pop(), 0.8); put(sfx, S[9]+0.2, pop(), 1); put(sfx, S[9]+0.25, ding(1480), 0.9)
# 10-12 afastam / ligação
put(sfx, S[10]+0.3, rumble(0.9), 0.6); put(sfx, wt(10,'afast')+0.05, pop(), 1); put(sfx, wt(10,'afast')+0.05, buzz(0.3), 0.5)
for i in range(10): put(sfx, wt(11,'costura')-0.1+i*0.07, clank(), 0.7)
put(sfx, S[12]+0.2, pop(), 1); put(sfx, S[12]+0.25, ding(1660), 0.9)
# 13-15 chuva
put(sfx, S[13]-0.1, rainS(E[15]-S[13]+0.4), 1.0); put(sfx, S[13]+0.1, boom(1.8), 0.6)
for i in range(5): put(sfx, wt(13,'lava')-0.2+i*0.25, splash(0.35), 0.6)
put(sfx, wt(13,'lava')+0.05, pop(), 1)
for i in range(6): put(sfx, wt(14,'fecha')-0.1+i*0.08, pop(0.08), 0.5)
put(sfx, wt(14,'borracha')+0.05, pop(), 0.8); put(sfx, wt(14,'selante')-0.05, pop(), 1); put(sfx, wt(14,'selante'), ding(1760,0.5), 0.9)
put(sfx, S[15]+0.3, engine(1.0,70), 1.0); put(sfx, S[15]+0.8, hpf(rng.standard_normal(int(0.9*SR)),900)*np.exp(-t_(0.9)*3)*0.35, 1)
put(sfx, wt(15,'sabão')-0.05, pop(), 1); put(sfx, wt(15,'sabão')-0.05, buzz(0.3), 0.5)
# 16 pente
for x in np.arange(wt(16,'pente')-0.6, E[16]-0.2, 0.18): put(sfx, x, scrape(0.15), 0.6)
put(sfx, wt(16,'pente')+0.05, pop(), 0.8); put(sfx, wt(16,'texturiz')-0.05, pop(), 1); put(sfx, wt(16,'texturiz'), ding(1480), 0.9)
# 17 guindaste, toneladas, anos
put(sfx, S[17]+0.1, hum(1.4, 80), 1.0); put(sfx, wt(17,'pesa')-0.3, pop(), 1); put(sfx, wt(17,'toneladas')-0.05, thud(45,0.7), 1.1)
put(sfx, wt(17,'durar')-0.1, pop(), 1); put(sfx, wt(17,'durar'), ding(1320,0.5), 0.8)
# 18-19 tum tum
t0=S[18]-0.1; t1=E[19]
put(sfx, t0, engine(t1-t0, 60), 0.9)
for x in [-8,-4,0,4,8]:
    tt=t0+(x-0.8+12)/24*(t1-t0); put(sfx, tt, thud(70,0.25), 1.3); put(sfx, tt+0.11, thud(66,0.22), 1.0)
put(sfx, wt(18,'defeito')-0.05, pop(), 1); put(sfx, wt(18,'defeito'), ding(1660), 0.8)
put(sfx, S[19]+0.2, pop(), 0.8); put(sfx, wt(19,'cada')-0.1, whoosh(0.4), 0.6)
# 20 faixas, placa, radar
put(sfx, wt(20,'pinta')-0.15, whoosh(1.0), 0.6)
for i in range(6): put(sfx, wt(20,'pinta')+0.1+i*0.12, pop(0.08), 0.5)
put(sfx, wt(20,'placas')-0.15, pop(), 1); put(sfx, wt(20,'radar')-0.15, pop(), 1); put(sfx, wt(20,'radar')+0.15, beep(2400,0.09), 1.5); put(sfx, wt(20,'radar')+0.3, ring(0.15)*3, 0.6)
# 21 parabéns
tp=wt(21,'parab'); put(sfx, tp-0.05, boom(1.2)*0.3, 1)
for i in range(6): put(sfx, tp+i*0.08, pop(0.08), 0.6)
put(sfx, tp, ding(1320,0.6), 0.8); put(sfx, tp+0.12, ding(1660,0.6), 0.8); put(sfx, tp+0.24, ding(1980,0.8), 0.8)
# 22 CTA
for w in ['curte','salva','manda','comenta']: put(sfx, wt(22,w)-0.15, pop(), 1)
# tela final
WS=[w for w in WD if w['p']==LAST and w['w'].lower()=='segue'][0]['s']; WA=[w for w in WD if w['p']==LAST and w['w']=='Até'][0]['s']
put(sfx, WS-0.4, whoosh(0.55), 0.8); put(sfx, WS+16/30, pop(), 1.1); put(sfx, WS+16/30+0.05, ding(1760,0.4), 0.8); put(sfx, WA-0.07, pop(), 1)
# ---------- trilha ----------
def note(f, d, kind='pad'):
    tt = t_(d)
    if kind == 'pad': x = sum(np.sin(2 * np.pi * f * m * tt + m) / m for m in (1, 2, 3)) * np.minimum(1, tt / 0.4) * np.minimum(1, (d - tt) / 0.4)
    elif kind == 'bass': x = np.tanh(2 * np.sin(2 * np.pi * f * tt)) * np.exp(-tt * 4)
    elif kind == 'pluck': x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 6)
    return x
mtr = 60 / 100  # 100 bpm
def hat(at): put(music, at, hpf(rng.standard_normal(int(0.04 * SR)), 6000) * np.exp(-t_(0.04) * 90) * 0.15)
def kick(at, g=0.8): put(music, at, thud(50, 0.35), g)

prog2 = [(130.81, [261.6, 329.6, 392]), (98, [196, 246.9, 293.7]), (110, [220, 261.6, 329.6]), (87.31, [174.6, 220, 261.6])]
mel = [523.3, 659.3, 784, 659.3, 587.3, 659.3, 523.3, 392]
bar = mtr * 4; t0 = 0.0; k = 0
while t0 < D:
    root, ch = prog2[k % 4]
    for f in ch: put(music, t0, note(f, min(bar, D - t0 + 0.2)), 0.05)
    for b in range(8):
        tb = t0 + b * mtr / 2
        if tb < D:
            put(music, tb, note(root, mtr / 2, 'bass'), 0.2); hat(tb + mtr / 4)
            if b % 2 == 0: put(music, tb, note(mel[(b + k * 3) % 8], 0.4, 'pluck'), 0.06)
    for b in range(4):
        if t0 + b * mtr < D: kick(t0 + b * mtr, 0.5)
    t0 += bar; k += 1
# abaixa a música na tempestade
i0, i1 = int((S[13]-.1) * SR), int((S[15]-.1) * SR); music[i0:i1] *= 0.5
fade = np.ones(N); i = int((D - 1.2) * SR); fade[i:] = np.linspace(1, 0, N - i); music *= fade
def save(p, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
save('music.wav', music[:int(D * SR)]); save('sfx.wav', sfx[:int(D * SR)]); print('ok', D)

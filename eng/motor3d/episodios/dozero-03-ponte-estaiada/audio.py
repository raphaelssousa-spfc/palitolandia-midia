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
# ABERTURA (1º segundo já com som): giro rápido + selo DO ZERO
put(sfx, 0.0, whoosh(0.9), 1.2); put(sfx, 0.05, boom(1.4)*0.5, 1); put(sfx, 0.12, pop(), 1.2); put(sfx, 0.18, ding(1320,0.6), 0.9)
put(sfx, 0.0, engine(S[0]+0.2, 70), 0.6)
# 0 tábua
put(sfx, wt(0,'tábua')+0.25, thud(80,0.4), 1.0); put(sfx, wt(0,'ponte')-0.1, pop(), 1)
# 1 quebra
put(sfx, wt(1,'largo')-0.05, pop(), 0.8); tq=wt(1,'quebra')-0.1
put(sfx, tq, crackS(), 1.4); put(sfx, tq+0.3, splash(0.6), 1.3); put(sfx, tq+0.1, pop(), 0.9); put(sfx, tq+0.12, buzz(0.3), 0.5)
# 2 estacas e pilares
te=wt(2,'estacas')-0.3
for i in range(3): put(sfx, te+0.4+i*0.22, thud(55,0.4), 1.1)
put(sfx, te+0.25, pop(), 1); put(sfx, wt(2,'pilares')-0.3, rumble(0.8), 0.6); put(sfx, wt(2,'pilares'), pop(), 1)
# 3 barco bate
put(sfx, S[3]-0.4, engine(wt(3,'passa')-S[3]+0.4, 45), 1.1); tb=wt(3,'passa')-0.15
put(sfx, tb, thud(50,0.6), 1.4); put(sfx, tb, clank(), 1.0); put(sfx, tb+0.05, pop(), 1); put(sfx, tb+0.05, buzz(0.35), 0.6)
# 4 torre sobe
tt=wt(4,'ergue')-0.2; put(sfx, tt, rumble(E[4]-tt+0.2), 0.8); put(sfx, tt, riser(E[4]-tt), 0.8); put(sfx, wt(4,'torre')-0.05, pop(), 1)
# 5 mastro
put(sfx, S[5]+0.15, pop(), 1); put(sfx, S[5]+0.2, ding(1320), 0.9)
# 6 aduela cai
tf=wt(6,'apoio')-0.1; put(sfx, tf, whoosh(0.5), 0.8); put(sfx, tf+0.55, splash(0.7), 1.4); put(sfx, wt(6,'apoio')-0.05, pop(), 1); put(sfx, wt(6,'apoio'), buzz(0.3), 0.5)
# 7 cabos / estai
tc=wt(7,'cabos')-0.3
for i in range(3): put(sfx, tc+i*0.15, clank(), 0.9)
put(sfx, tc+0.15, pop(), 0.9); put(sfx, wt(7,'estai')-0.05, pop(), 1); put(sfx, wt(7,'estai'), ding(1480), 0.9)
# 8 tudo no ar
put(sfx, S[8]+0.3, pop(), 1); put(sfx, wt(8,'ar')-0.1, buzz(0.35), 0.7); put(sfx, wt(8,'ar')-0.1, pop(), 0.8)
# 9 pedaço por pedaço
a9=S[9]+0.2; b9=wt(9,'isso')-0.1
for i in range(3): put(sfx, a9+(b9-a9)*(i+0.6)/3, thud(70,0.3), 0.8); put(sfx, a9+(b9-a9)*(i+0.7)/3, clank(), 0.6)
put(sfx, wt(9,'pedaço')-0.05, pop(), 0.9); put(sfx, wt(9,'aduela')-0.05, pop(), 1); put(sfx, wt(9,'aduela'), ding(1660), 0.9)
# 10 PIADA: a torre tomba
tt=wt(10,'tomba')-0.35; put(sfx, wt(10,'lado')-0.05, pop(), 0.9)
put(sfx, tt, rumble(0.9), 1.0); put(sfx, tt+0.1, crackS(), 1.0); 
alarm(tt+0.2, 880, 3); put(sfx, tt+0.22, pop(), 1.2); put(sfx, tt+0.25, boom(1.0)*0.4, 1)
# 11 balanço sucessivo
put(sfx, S[11]+0.1, whoosh(0.5), 0.6)
for i in range(6): put(sfx, S[11]+0.4+i*0.35, thud(70,0.25), 0.6)
put(sfx, wt(11,'dois')-0.05, pop(), 0.9); put(sfx, wt(11,'balanço')-0.05, pop(), 1); put(sfx, wt(11,'balanço'), ding(1760), 0.9)
# 12 138 m e prédio
put(sfx, S[12]+0.1, thud(60,0.4), 0.8); put(sfx, wt(12,'138')-0.25, riser(0.6), 0.8); put(sfx, wt(12,'138')+0.1, pop(), 1); put(sfx, wt(12,'138')+0.15, ding(1320), 0.8)
put(sfx, wt(12,'prédio')-0.3, rumble(0.7), 0.6); put(sfx, wt(12,'prédio')+0.1, pop(), 1)
# 13 pendurada
put(sfx, wt(13,'apoiada')-0.1, buzz(0.3), 0.6); put(sfx, wt(13,'apoiada')-0.05, pop(), 0.9)
tp=wt(13,'pendurada')-0.3
for i in range(5): put(sfx, tp+i*0.07, pop(0.08), 0.5)
put(sfx, wt(13,'pendurada')+0.05, ding(1480), 0.9)
# 14 parabéns
tp=wt(14,'parab'); put(sfx, tp-0.05, boom(1.2)*0.3, 1)
for i in range(6): put(sfx, tp+i*0.08, pop(0.08), 0.6)
put(sfx, tp, ding(1320,0.6), 0.8); put(sfx, tp+0.12, ding(1660,0.6), 0.8); put(sfx, tp+0.24, ding(1980,0.8), 0.8)
put(sfx, S[14], engine(E[15]-S[14], 75), 0.4)
# 15 CTA
for w in ['curte','salva','manda','comenta']: put(sfx, wt(15,w)-0.15, pop(), 1)
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
fade = np.ones(N); i = int((D - 1.2) * SR); fade[i:] = np.linspace(1, 0, N - i); music *= fade
def save(p, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
save('music.wav', music[:int(D * SR)]); save('sfx.wav', sfx[:int(D * SR)]); print('ok', D)

import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_construcao-05-verga.json';
import mouthData from './mouth_construcao-05-verga.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';

const C = {
  navy: '#1A1A1A', yellow: '#D9480F', amber: '#E8890C', green: '#2F9E44', red: '#C92A2A',
  white: '#FFFFFF', brick: '#C9A48A', brickD: '#A9826A', mortar: '#EDE6DC',
  wall: '#FFFFFF', wallR: '#E9E4DC', wallT: '#F4F0EA', roof: '#2B2B2B', roofD: '#1A1A1A',
  grass: '#EFEBE4', grassD: '#DDD6CB', grassDD: '#CFC6B8', glass: '#9FD3F7', glassD: '#7FBCE8',
  crack: '#1A1A1A', cream: '#F6F3EE', grey: '#8A8278', light: '#A9A196',
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
// frame (relative to scene start) when a word that starts with `p` is spoken
const wt = (scene: number, p: string, nth = 0) => {
  const ws = timing.words.filter((w) => w.scene === scene && norm(w.w).startsWith(norm(p)));
  const w = ws[Math.min(nth, ws.length - 1)];
  return w ? Math.round((w.s - STARTS[scene]) * FPS) : 0;
};

// ---------- isometric helpers ----------
const CS = Math.cos(Math.PI / 6);
type P3 = [number, number, number];
const iso = ([x, y, z]: P3): [number, number] => [(x - y) * CS, (x + y) * 0.5 - z];
const pts = (ps: P3[]) => ps.map((p) => iso(p).join(',')).join(' ');
const Poly: React.FC<{p: P3[]; fill: string; stroke?: string; sw?: number; op?: number}> = ({p, fill, stroke, sw, op}) => (
  <polygon points={pts(p)} fill={fill} stroke={stroke ?? 'rgba(26,26,26,0.6)'} strokeWidth={sw ?? 2} strokeLinejoin="round" opacity={op ?? 1} />
);
const Box: React.FC<{x: number; y: number; z: number; w: number; d: number; h: number; top: string; left: string; right: string}> = ({x, y, z, w, d, h, top, left, right}) => {
  const x1 = x + w, y1 = y + d, z1 = z + h;
  return (
    <g>
      <Poly p={[[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]]} fill={left} />
      <Poly p={[[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]]} fill={right} />
      <Poly p={[[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]]} fill={top} />
    </g>
  );
};
// map (u,v) on the front-left face (plane y = Y) starting at x = X0, z = Z0
const faceL = (X0: number, Y: number, Z0: number) => (u: number, v: number): [number, number] => iso([X0 + u, Y, Z0 + v]);
const faceR = (X: number, Y0: number, Z0: number) => (u: number, v: number): [number, number] => iso([X, Y0 + u, Z0 + v]);
const rectOn = (f: (u: number, v: number) => [number, number], u0: number, v0: number, u1: number, v1: number) =>
  [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)].map((p) => p.join(',')).join(' ');

const partial = (ps: [number, number][], p: number): [number, number][] => {
  if (p <= 0) return [];
  const seg = ps.slice(1).map((q, i) => Math.hypot(q[0] - ps[i][0], q[1] - ps[i][1]));
  let L = seg.reduce((a, b) => a + b, 0) * Math.min(1, p);
  const out: [number, number][] = [ps[0]];
  for (let i = 0; i < seg.length; i++) {
    if (L >= seg[i]) { out.push(ps[i + 1]); L -= seg[i]; }
    else { const f = L / seg[i]; out.push([ps[i][0] + (ps[i + 1][0] - ps[i][0]) * f, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * f]); break; }
  }
  return out;
};
const Crack: React.FC<{ps: [number, number][]; p: number; w: number; color?: string}> = ({ps, p, w, color}) => {
  const q = partial(ps, p);
  if (q.length < 2) return null;
  const d = 'M' + q.map((a) => a.join(',')).join(' L');
  return (
    <g>
      <path d={d} stroke="rgba(255,255,255,0.0)" strokeWidth={w + 5} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(2,2)" />
      <path d={d} stroke={color ?? C.crack} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
const Dust: React.FC<{ps: [number, number][]; f: number; start: number; dur: number; seed: string; n?: number}> = ({ps, f, start, dur, seed, n = 26}) => (
  <g>
    {new Array(n).fill(0).map((_, i) => {
      const k = random(seed + i);
      const born = start + k * dur;
      const age = (f - born) / FPS;
      if (age < 0 || age > 1.2) return null;
      const src = ps[Math.floor(random(seed + 'p' + i) * ps.length)];
      const vx = (random(seed + 'x' + i) - 0.5) * 160;
      const vy = -random(seed + 'y' + i) * 90;
      const x = src[0] + vx * age, y = src[1] + vy * age + 380 * age * age;
      const r = 3 + random(seed + 'r' + i) * 6;
      return <circle key={i} cx={x} cy={y} r={r} fill="#B89C82" opacity={Math.max(0, 1 - age / 1.2)} />;
    })}
  </g>
);

// ---------- shared UI ----------
const pop = (f: number, at: number, fps: number, damping = 11) => spring({frame: f - at, fps, config: {damping, stiffness: 170, mass: 0.8}});

const Sky: React.FC<{a: string; b: string}> = () => <AbsoluteFill style={{background: C.cream}} />;

const Chip: React.FC<{text: string; bg: string; color?: string; f: number; at: number; top: number; rot?: number; size?: number; icon?: React.ReactNode}> = ({text, bg, f, at, top, size = 64, icon}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 200}});
  if (f < at) return null;
  if (size >= 90) {
    const t = text.charAt(0) + text.slice(1).toLowerCase();
    return (
      <div style={{position: 'absolute', top: top - 30, left: 80, right: 80, display: 'flex', alignItems: 'center', gap: 24, opacity: s, translate: `0 ${(1 - s) * 30}px`}}>
        {icon && <div style={{width: 92, height: 92, borderRadius: 46, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{icon}</div>}
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 116, color: C.navy, letterSpacing: -5, lineHeight: 1}}>
          {t.split(' ').map((w, i, arr) => <span key={i} style={{color: i === arr.length - 1 ? bg : C.navy}}>{w}{i < arr.length - 1 ? ' ' : ''}</span>)}
        </div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: s, translate: `0 ${(1 - s) * 24}px`}}>
      <div style={{background: bg, color: C.white, fontFamily: 'InterD', fontWeight: 800, fontSize: size * 0.82, padding: '16px 34px', borderRadius: 999, letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.12)'}}>{icon}{text}</div>
    </div>
  );
};

const Handle: React.FC = () => (
  <>
    <div style={{position: 'absolute', top: 110, left: 80, fontFamily: 'InterD', fontWeight: 600, fontSize: 32, color: C.grey, letterSpacing: 6}}>ALVENARIA · 05</div>
    <div style={{position: 'absolute', top: 110, right: 80, fontFamily: 'InterD', fontWeight: 600, fontSize: 32, color: C.grey}}>{HANDLE}</div>
  </>
);

const HardHat: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M14 70 Q14 28 50 26 Q86 28 86 70 Z" fill={C.yellow} stroke={C.navy} strokeWidth="6" strokeLinejoin="round" />
    <rect x="6" y="66" width="88" height="14" rx="7" fill={C.amber} stroke={C.navy} strokeWidth="6" />
    <rect x="44" y="22" width="12" height="44" rx="5" fill={C.amber} stroke={C.navy} strokeWidth="5" />
  </svg>
);

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top: 0, left: 0, height: 6, width: `${(f / TOTAL) * 100}%`, background: C.navy}} />
  );
};

// ---------- word-by-word captions ----------
type W = {w: string; s: number; e: number; scene: number};
const GROUPS: W[][] = (() => {
  const g: W[][] = []; let cur: W[] = [];
  for (const w of timing.words as W[]) {
    cur.push(w);
    if (/[,.!?:]$/.test(w.w) || cur.length === 3) { g.push(cur); cur = []; }
  }
  if (cur.length) g.push(cur);
  return g;
})();
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const gi = GROUPS.findIndex((g, i) => t >= g[0].s - 0.05 && t < (GROUPS[i + 1] ? GROUPS[i + 1][0].s - 0.05 : g[g.length - 1].e + 0.6));
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const gStart = Math.round(g[0].s * fps);
  const s = pop(f, gStart - 1, fps, 14);
  return (
    <div style={{position: 'absolute', top: 1235, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(0.85 + 0.15 * s)}}><div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 26px', maxWidth: 960, background: 'rgba(246,243,238,0.94)', borderRadius: 28, padding: '10px 30px 18px'}}>
      {g.map((w, i) => {
        const active = t >= w.s && t < w.e + 0.05;
        const spoken = t >= w.s;
        const ws = active ? spring({frame: f - Math.round(w.s * fps), fps, config: {damping: 10, stiffness: 220}}) : 0;
        return (
          <span key={i} style={{
            fontFamily: 'InterD', fontWeight: 800, fontSize: 80, lineHeight: 1.25, letterSpacing: -2,
            color: active ? C.navy : C.light, borderBottom: `10px solid ${active ? C.yellow : 'transparent'}`,
            scale: String(1 + 0.04 * ws), display: 'inline-block',
          }}>{w.w.replace(/[,.:]$/, '').toLowerCase()}</span>
        );
      })}
    </div></div>
  );
};

// scene wrapper: whip-zoom in
const SceneIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{
      scale: String(interpolate(f, [0, 9], [1.06, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})),
      filter: `blur(${interpolate(f, [0, 6], [6, 0], clamp)}px)`,
    }}>{children}</AbsoluteFill>
  );
};
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: C.cream, opacity: interpolate(f, [0, 6], [0.9, 0], clamp)}} />;
};

// ---------- House ----------
const House: React.FC<{crackP: number; crackW: number; f: number; dustStart: number}> = ({crackP, crackW, f, dustStart}) => {
  const X0 = -160, X1 = 160, Y0 = -130, Y1 = 130, H = 230, HR = 120, o = 22, YM = 0;
  const fl = faceL(X0, Y1, 0), fr = faceR(X1, Y0, 0);
  const crackUV: [number, number][] = [[178, H], [168, 205], [186, 178], [160, 150], [176, 118], [150, 88], [164, 58], [140, 26], [150, 0]];
  const crack = crackUV.map(([u, v]) => fl(u, v));
  return (
    <g>
      <Box x={-310} y={-290} z={-40} w={620} d={580} h={40} top={C.grass} left={C.grassD} right={C.grassDD} />
      {/* path */}
      <Poly p={[[40, 130, 0.5], [110, 130, 0.5], [110, 290, 0.5], [40, 290, 0.5]]} fill="#F2E3C6" sw={0} />
      <Box x={X0} y={Y0} z={0} w={320} d={260} h={H} top={C.wallT} left={C.wall} right={C.wallR} />
      {/* back roof plane, gable, front roof plane */}
      <Poly p={[[X0 - o, Y0 - o, H], [X1 + o, Y0 - o, H], [X1 + o, YM, H + HR], [X0 - o, YM, H + HR]]} fill={C.roofD} />
      <Poly p={[[X1, Y0, H], [X1, Y1, H], [X1, YM, H + HR]]} fill={C.wallR} />
      <Poly p={[[X0 - o, Y1 + o, H], [X1 + o, Y1 + o, H], [X1 + o, YM, H + HR], [X0 - o, YM, H + HR]]} fill={C.roof} />
      {/* door + windows */}
      <polygon points={rectOn(fl, 50, 0, 115, 140)} fill="#8B5A3C" stroke={C.navy} strokeWidth={4} />
      <circle cx={fl(102, 70)[0]} cy={fl(102, 70)[1]} r={6} fill={C.yellow} />
      <polygon points={rectOn(fl, 210, 95, 290, 175)} fill={C.glass} stroke={C.navy} strokeWidth={5} />
      <polygon points={rectOn(fr, 70, 95, 190, 175)} fill={C.glassD} stroke={C.navy} strokeWidth={5} />
      <Crack ps={crack} p={crackP} w={crackW} />
      <Dust ps={partial(crack, crackP)} f={f} start={dustStart} dur={40} seed="h" />
    </g>
  );
};

const Warn: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100"><path d="M50 8 L94 88 L6 88 Z" fill="white" stroke={C.navy} strokeWidth="6" strokeLinejoin="round" /><rect x="44" y="34" width="12" height="30" rx="5" fill={C.navy} /><circle cx="50" cy="75" r="7" fill={C.navy} /></svg>
);
// ---------- scenes ----------
const Sfx: React.FC<{at: number; src: string; vol?: number}> = ({at, src, vol = 0.35}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
);
const brl = (n: number) => Math.round(n).toLocaleString('pt-BR');
const countTo = (f: number, a: number, b: number, to: number) => interpolate(f, [a, b], [0, to], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});

const Coins: React.FC<{f: number; at: number; n?: number; seed: string; x?: number; y?: number; spread?: number}> = ({f, at, n = 14, seed, x = 540, y = 300, spread = 700}) => {
  if (f < at) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', pointerEvents: 'none'}}>
      {new Array(n).fill(0).map((_, i) => {
        const age = (f - at - random(seed + i) * 8) / FPS;
        if (age < 0 || age > 1.6) return null;
        const vx = (random(seed + 'x' + i) - 0.5) * spread;
        const vy = -400 - random(seed + 'y' + i) * 500;
        const cx = x + vx * age, cy = y + vy * age + 1100 * age * age;
        const rot = age * (300 + random(seed + 'r' + i) * 500);
        const sq = Math.abs(Math.cos((rot * Math.PI) / 180));
        return (
          <g key={i} transform={`translate(${cx},${cy}) scale(${0.25 + sq * 0.75},1)`} opacity={interpolate(age, [1.2, 1.6], [1, 0], clamp)}>
            <circle r={30} fill="#F2B632" stroke={C.navy} strokeWidth={4} />
            <circle r={21} fill="none" stroke="#B47E00" strokeWidth={3} />
            <text y={9} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={24} fill="#8A5A00">R$</text>
          </g>
        );
      })}
    </svg>
  );
};

const Pill: React.FC<{text: string; f: number; at: number; top: number; bg?: string; size?: number; color?: string}> = ({text, f, at, top, bg = C.navy, size = 40, color = C.white}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 12);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: bg, color, fontFamily: 'InterD', fontWeight: 800, fontSize: size, padding: '14px 32px', borderRadius: 999, letterSpacing: 2, scale: String(s), boxShadow: '0 16px 40px rgba(0,0,0,0.12)'}}>{text}</div>
    </div>
  );
};
const XMark: React.FC<{f: number; at: number; cx: number; cy: number; r: number; w?: number}> = ({f, at, cx, cy, r, w = 26}) => {
  if (f < at) return null;
  const p1 = interpolate(f, [at, at + 5], [0, 1], clamp), p2 = interpolate(f, [at + 4, at + 9], [0, 1], clamp);
  return (
    <g stroke={C.red} strokeWidth={w} strokeLinecap="round">
      <line x1={cx - r} y1={cy - r} x2={cx - r + 2 * r * p1} y2={cy - r + 2 * r * p1} />
      {p2 > 0 && <line x1={cx + r} y1={cy - r} x2={cx + r - 2 * r * p2} y2={cy - r + 2 * r * p2} />}
    </g>
  );
};
const Stage: React.FC<{children: React.ReactNode; x?: number; y?: number; s?: number}> = ({children, x = 540, y = 820, s = 1}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${x},${y}) scale(${s})`}>{children}</g></svg>
);
const Title: React.FC<{text: React.ReactNode; f: number; at?: number; top?: number; size?: number}> = ({text, f, at = 0, top = 230, size = 104}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 200}});
  return <div style={{position: 'absolute', top, left: 60, right: 70, opacity: s, translate: `0 ${(1 - s) * 30}px`}}><div style={{display: 'inline-block', background: 'rgba(246,243,238,0.9)', borderRadius: 26, padding: '8px 20px 14px', fontFamily: 'InterD', fontWeight: 900, fontSize: size, color: C.navy, letterSpacing: -5, lineHeight: 1}}>{text}</div></div>;
};
const Hi: React.FC<{c?: string; children: React.ReactNode}> = ({c, children}) => <span style={{color: c ?? C.yellow}}>{children}</span>;
const cut = (f: number, at: number) => f >= at;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
const CutFlash: React.FC<{cuts: number[]}> = ({cuts}) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...cuts.map((c) => interpolate(f, [c - 2, c, c + 5], [0, 0.6, 0], clamp)));
  return <AbsoluteFill style={{background: C.cream, opacity: o, pointerEvents: 'none'}} />;
};
const MOUTH: number[] = mouthData as number[];
const mouthAt = (g: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, g))] ?? 0;
const blinkAt = (g: number) => {
  const period = 96, k = Math.floor(g / period), start = k * period + Math.floor(random('bl' + k) * 50);
  const d = g - start;
  return d >= 0 && d < 5 ? [0.5, 1, 1, 0.5, 0.1][d] : 0;
};
const END_FRAME = Math.round(STARTS[6] * FPS) + wt(6, 'segue') - 4;
const AvatarCorner: React.FC = () => {
  const g = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = spring({frame: g - 4, fps, config: {damping: 12, stiffness: 140}});
  const out = interpolate(g, [END_FRAME, END_FRAME + 8], [1, 0], clamp);
  if (out <= 0) return null;
  const m = mouthAt(g);
  const SZ = 270;
  return (
    <div style={{position: 'absolute', left: 50, top: 1515, width: SZ, height: SZ, scale: String(inS * (0.9 + 0.1 * out)), opacity: out, rotate: `${Math.sin(g / 23) * 2 + m * 1.5}deg`, translate: `0 ${-m * 5}px`}}>
      <div style={{width: SZ, height: SZ, borderRadius: SZ / 2, overflow: 'hidden', background: C.white, border: `9px solid ${C.yellow}`, boxShadow: '0 18px 40px rgba(0,0,0,0.25)'}}>
        <Raphael mouth={m} blink={blinkAt(g)} look={Math.sin(g / 70) * 0.6} />
      </div>
    </div>
  );
};

// ---------- parede com janela ----------
type P2 = [number, number];
const fl = faceL(-300, 20, 0);
const WIN = {u0: 210, u1: 390, v0: 150, v1: 300};
const EXT = 36; // 30 cm numa janela de 1,5 m (20% do vão)
const VG = {u0: WIN.u0 - EXT, u1: WIN.u1 + EXT};
const CR: P2[][] = [
  [[210, 300], [195, 318], [200, 335], [180, 352], [186, 370], [165, 392], [170, 412]],
  [[390, 300], [405, 318], [400, 336], [420, 352], [414, 370], [436, 392], [430, 412]],
  [[210, 150], [194, 132], [200, 114], [180, 96], [186, 78], [166, 58], [172, 38]],
  [[390, 150], [406, 132], [400, 114], [420, 96], [414, 78], [434, 58], [428, 38]],
];
const CRS: P2[][] = CR.map((c) => c.map(([u, v]) => fl(u, v)));
const CORNERS: P2[] = [[210, 300], [390, 300], [210, 150], [390, 150]];
const Wall: React.FC<{f: number; cracks?: number[]; dustAt?: number; verga?: number; contra?: number; xray?: number; ghost?: number; glow?: number}> = ({f, cracks = [0, 0, 0, 0], dustAt = 9999, verga = 0, contra = 0, xray = 0, ghost = 0, glow = 0}) => {
  const rows = new Array(15).fill(0).map((_, i) => i * 30);
  const Bar: React.FC<{v0: number; v1: number; p: number; from: number}> = ({v0, v1, p, from}) => {
    if (p <= 0) return null;
    const dv = (1 - p) * from;
    const g = (u: number, v: number) => fl(u, v + dv);
    return (
      <g opacity={Math.min(1, p * 1.5)}>
        <polygon points={[g(VG.u0, v0), g(VG.u1, v0), g(VG.u1, v1), g(VG.u0, v1)].map((q) => q.join(',')).join(' ')} fill="#BDB8AE" stroke={C.navy} strokeWidth={3} />
        {new Array(12).fill(0).map((_, i) => { const q = g(VG.u0 + 10 + random('vg' + v0 + i) * (VG.u1 - VG.u0 - 20), v0 + 5 + random('vh' + v0 + i) * (v1 - v0 - 10)); return <circle key={i} cx={q[0]} cy={q[1]} r={2.5} fill="rgba(0,0,0,0.18)" />; })}
        {xray > 0 && <g opacity={xray}>
          {[v0 + 9, v1 - 9].map((v) => <line key={v} x1={g(VG.u0 + 6, v)[0]} y1={g(VG.u0 + 6, v)[1]} x2={g(VG.u1 - 6, v)[0]} y2={g(VG.u1 - 6, v)[1]} stroke="#7A3E1D" strokeWidth={6} strokeLinecap="round" />)}
          {new Array(9).fill(0).map((_, i) => { const u = VG.u0 + 16 + i * ((VG.u1 - VG.u0 - 32) / 8); return <line key={i} x1={g(u, v0 + 5)[0]} y1={g(u, v0 + 5)[1]} x2={g(u, v1 - 5)[0]} y2={g(u, v1 - 5)[1]} stroke="#7A3E1D" strokeWidth={3} />; })}
        </g>}
      </g>
    );
  };
  return (
    <g>
      <Box x={-380} y={-90} z={-30} w={760} d={230} h={30} top={C.grass} left={C.grassD} right={C.grassDD} />
      <Box x={-300} y={-20} z={0} w={600} d={40} h={440} top="#D8C2B0" left={C.brick} right={C.brickD} />
      {rows.map((v, i) => <line key={'r' + i} x1={fl(0, v)[0]} y1={fl(0, v)[1]} x2={fl(600, v)[0]} y2={fl(600, v)[1]} stroke={C.mortar} strokeWidth={4} />)}
      {rows.slice(0, 14).map((v, i) => new Array(11).fill(0).map((_, k) => { const u = k * 60 + (i % 2 ? 30 : 0); if (u <= 0 || u >= 600) return null; const a = fl(u, v), b = fl(u, v + 30); return <line key={i + '-' + k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.mortar} strokeWidth={4} />; }))}
      {/* janela */}
      <polygon points={rectOn(fl, WIN.u0 - 8, WIN.v0 - 8, WIN.u1 + 8, WIN.v1 + 8)} fill="#FFFFFF" stroke={C.navy} strokeWidth={4} />
      <polygon points={rectOn(fl, WIN.u0, WIN.v0, WIN.u1, WIN.v1)} fill={C.glass} stroke={C.navy} strokeWidth={4} />
      <line x1={fl(300, WIN.v0)[0]} y1={fl(300, WIN.v0)[1]} x2={fl(300, WIN.v1)[0]} y2={fl(300, WIN.v1)[1]} stroke="#FFFFFF" strokeWidth={8} />
      <polygon points={rectOn(fl, 225, 250, 260, 285)} fill="#FFFFFF" opacity={0.45} />
      {ghost > 0 && [[300, 335], [115, 150]].map(([a, b], i) => <polygon key={i} points={rectOn(fl, VG.u0, a, VG.u1, b)} fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="14 10" opacity={ghost} />)}
      {CRS.map((c, i) => <Crack key={i} ps={c} p={cracks[i]} w={7} />)}
      {CRS.map((c, i) => cracks[i] <= 0.01 ? null : <Dust key={'d' + i} ps={partial(c, cracks[i])} f={f} start={dustAt + i * 3} dur={24} seed={'w' + i} n={12} />)}
      <Bar v0={300} v1={335} p={verga} from={260} />
      <Bar v0={115} v1={150} p={contra} from={-200} />
      {glow > 0 && CORNERS.map(([u, v], i) => { const q = fl(u, v); return <circle key={i} cx={q[0]} cy={q[1]} r={22 + 10 * Math.sin(f / 4 + i)} fill={C.red} opacity={0.55 * glow} />; })}
    </g>
  );
};
const W_C: P2 = iso([0, 20, 220]);
const focus = (p: P2, s: number) => ({x: 540 - p[0] * s, y: 850 - p[1] * s, s});
const mixCam = (a: {x: number; y: number; s: number}, b: {x: number; y: number; s: number}, t: number) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t});
const WIDE = focus(W_C, 1.0);
const camTo = (f: number, at: number, a: {x: number; y: number; s: number}, b: {x: number; y: number; s: number}) => mixCam(a, b, interpolate(f, [at - 3, at + 6], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}));
const WStage: React.FC<{cam: {x: number; y: number; s: number}; f: number; children: React.ReactNode}> = ({cam, f, children}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${cam.x + Math.sin(f / 40) * 5},${cam.y}) scale(${cam.s})`}>{children}</g></svg>
);
const Stamp: React.FC<{text: string; f: number; at: number; x: number; y: number; color?: string; rot?: number; size?: number}> = ({text, f, at, x, y, color = C.red, rot = -8, size = 84}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = interpolate(pop(f, at, fps, 9), [0, 1], [2.2, 1]);
  return <div style={{position: 'absolute', left: x, top: y, fontFamily: 'InterD', fontWeight: 900, fontSize: size, color, border: `8px solid ${color}`, borderRadius: 18, padding: '4px 26px', rotate: `${rot}deg`, scale: String(s), opacity: interpolate(f, [at, at + 3], [0, 1], clamp), background: 'rgba(246,243,238,0.85)'}}>{text}</div>;
};

// ---------- cenas ----------
const V0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tTr = wt(0, 'trinca'), tCa = wt(0, 'canto'), tEl = wt(0, 'ela'), tCu = wt(0, 'culpado');
  const c1 = tCa - 3, c2 = tEl - 3;
  const corner = fl(390, 300);
  const cam = f < c1 ? mixCam(WIDE, focus(W_C, 1.2), ease(f, 0, c1)) : f < c2 ? camTo(f, c1, WIDE, focus(corner, 2.1)) : camTo(f, c2, focus(corner, 2.1), focus(W_C, 1.0));
  const cr = ease(f, tTr - 6, tCa + 20);
  const q = pop(f, c2 + 2, fps, 8);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={tTr - 6} src="thud.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      <Sfx at={tCu - 2} src="pop.wav" vol={0.5} />
      <WStage cam={cam} f={f}><Wall f={f} cracks={[cr * 0.7, cr, 0.4 * cr, 0.8 * cr]} dustAt={tTr - 6} /></WStage>
      {f < c1 && <Title text={<>A trinca <Hi>torta</Hi></>} f={f} />}
      {f >= c1 && f < c2 && <Title text={<>No canto da<br /><Hi>janela</Hi></>} f={f} at={c1} />}
      {f >= c2 && <Title text={<>Ela tem um<br /><Hi c={C.red}>culpado</Hi></>} f={f} at={c2} />}
      {f >= c2 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(820,600) scale(${q}) rotate(-12)`}>
            <circle r={80} fill="rgba(159,211,247,0.5)" stroke={C.navy} strokeWidth={14} />
            <rect x={60} y={50} width={30} height={110} rx={12} fill={C.navy} transform="rotate(-45 60 50)" />
          </g>
        </svg>
      )}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const V1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tBu = wt(1, 'buraco'), tPe = wt(1, 'peso'), tDe = wt(1, 'desce'), tCo = wt(1, 'concentra');
  const c1 = tPe - 4;
  const cam = f < c1 ? camTo(f, 0, focus(W_C, 1.3), WIDE) : camTo(f, c1, WIDE, focus(fl(300, 330), 1.35));
  const hole = f >= tBu - 4 ? 0.5 + 0.5 * Math.sin(f / 3) : 0;
  const land = interpolate(f, [tPe - 2, tPe + 8], [-300, 0], {...clamp, easing: Easing.in(Easing.quad)});
  const top = fl(300, 440);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={tBu - 4} src="pop.wav" vol={0.45} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tPe + 8} src="thud.wav" vol={0.7} />
      <Sfx at={tCo - 2} src="pop.wav" vol={0.45} />
      <WStage cam={cam} f={f}>
        <Wall f={f} glow={ease(f, tCo - 4, tCo + 6)} />
        {hole > 0 && f < c1 && <polygon points={rectOn(fl, WIN.u0 - 4, WIN.v0 - 4, WIN.u1 + 4, WIN.v1 + 4)} fill="none" stroke={C.yellow} strokeWidth={8} strokeDasharray="18 12" opacity={0.6 + 0.4 * hole} />}
        {f >= tPe - 2 && (
          <g transform={`translate(${top[0]},${top[1] - 60 + land})`}>
            <path d="M-90 50 L90 50 L65 -40 L-65 -40 Z" fill={C.navy} />
            <rect x={-20} y={-62} width={40} height={26} rx={8} fill="none" stroke={C.navy} strokeWidth={10} />
            <text y={30} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={44} fill="#fff">PESO</text>
          </g>
        )}
        {f >= tDe - 4 && [[230, 210], [270, 210], [330, 390], [370, 390], [120, -1], [480, -1]].map(([u, tu], i) => {
          const ph = ((f - tDe + i * 5) % 24) / 24;
          const v = 430 - ph * 110;
          const a = fl(u, v);
          if (tu < 0) { const b = fl(u, 0); return <g key={i} opacity={0.5}><line x1={a[0]} y1={a[1]} x2={a[0]} y2={Math.min(b[1], a[1] + 60)} stroke={C.navy} strokeWidth={8} strokeLinecap="round" /></g>; }
          const end = fl(tu, 306), st = fl(u, 430);
          const p = partial([st, fl(u, 330), end], ease(f, tDe - 4 + i * 2, tDe + 12 + i * 2));
          const last = p[p.length - 1];
          return (
            <g key={i}>
              <path d={'M' + p.map((x) => x.join(',')).join(' L')} stroke={C.yellow} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {p.length > 2 && <circle cx={last[0]} cy={last[1]} r={12} fill={C.yellow} />}
            </g>
          );
        })}
      </WStage>
      {f < c1 && <Title text={<>Janela =<br /><Hi>buraco</Hi> na parede</>} f={f} />}
      {f >= c1 && <Title text={<>O peso vai<br />pros <Hi c={C.red}>cantos</Hi></>} f={f} at={c1} />}
      <Pill text="CONCENTRA AQUI" f={f} at={tCo - 2} top={1090} bg={C.red} />
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const V2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tTr = wt(2, 'trinca'), tDi = wt(2, 'diagonal'), tPe = wt(2, 'perto'), tGr = wt(2, 'quarenta');
  const c1 = tPe - 3;
  const br = fl(390, 150);
  const cam = f < c1 ? camTo(f, 0, focus(W_C, 1.25), WIDE) : camTo(f, c1, WIDE, focus([br[0] + 30, br[1] + 70], 2.0));
  const crs = [0, 1, 2, 3].map((i) => ease(f, tTr - 4 + i * 4, tDi + 6 + i * 4));
  const arc = ease(f, tGr - 6, tGr + 10);
  const lab = pop(f, tGr - 2, fps, 9);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      {[0, 4, 8, 12].map((d) => <Sfx key={d} at={tTr - 4 + d} src="thud.wav" vol={0.45} />)}
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tGr - 2} src="pop.wav" vol={0.5} />
      <WStage cam={cam} f={f}>
        <Wall f={f} cracks={crs} dustAt={tTr - 4} />
        {f >= c1 && (() => {
          const h = fl(440, 150), d = fl(434, 58);
          const R = 45;
          const ang0 = Math.atan2(h[1] - br[1], h[0] - br[0]), ang1 = Math.atan2(d[1] - br[1], d[0] - br[0]);
          const a = ang0 + (ang1 - ang0) * arc;
          return (
            <g>
              <line x1={br[0]} y1={br[1]} x2={h[0]} y2={h[1]} stroke={C.yellow} strokeWidth={4} strokeDasharray="8 6" opacity={arc} />
              <path d={`M${br[0] + R * Math.cos(ang0)} ${br[1] + R * Math.sin(ang0)} A${R} ${R} 0 0 1 ${br[0] + R * Math.cos(a)} ${br[1] + R * Math.sin(a)}`} stroke={C.yellow} strokeWidth={6} fill="none" />
              <g transform={`translate(${br[0] + 70},${br[1] + 30}) scale(${lab})`}><rect x={-6} y={-30} width={70} height={40} rx={10} fill={C.yellow} /><text x={29} y={2} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={28} fill="#fff">45°</text></g>
            </g>
          );
        })()}
      </WStage>
      {f < c1 && <Title text={<>Trinca na<br /><Hi>diagonal</Hi></>} f={f} />}
      {f >= c1 && <Title text={<>Uns <Hi>45°</Hi></>} f={f} at={c1} size={130} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const V3: React.FC = () => {
  const f = useCurrentFrame();
  const tCu = wt(3, 'culpado'), tFa = wt(3, 'falta'), tVe = wt(3, 'verga'), tCo = wt(3, 'contraverga');
  const cam = camTo(f, tFa, focus(W_C, 1.0), focus(fl(300, 230), 1.25));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={tCu - 2} src="thud.wav" vol={0.6} />
      <Sfx at={tVe - 2} src="pop.wav" vol={0.45} />
      <Sfx at={tCo - 2} src="pop.wav" vol={0.45} />
      <WStage cam={cam} f={f}><Wall f={f} cracks={[1, 1, 1, 1]} ghost={ease(f, tVe - 4, tVe + 4)} /></WStage>
      <Title text={<>Faltou <Hi>verga</Hi><br />e <Hi>contraverga</Hi></>} f={f} at={0} size={96} />
      <Stamp text="CULPADO" f={f} at={tCu - 2} x={560} y={1060} />
      <CutFlash cuts={[tFa]} />
    </SceneIn>
  );
};

const V4: React.FC = () => {
  const f = useCurrentFrame();
  const tVe = wt(4, 'verga'), tCo = wt(4, 'concreto'), tAr = wt(4, 'armado'), tCi = wt(4, 'cima'), tCv = wt(4, 'contraverga');
  const c1 = tCv - 4;
  const fix = 1 - ease(f, 0, 12);
  const vg = ease(f, tVe - 4, tVe + 8), cv = ease(f, tCv - 2, tCv + 10);
  const xray = ease(f, tAr - 4, tAr + 6) * (f < c1 ? 1 : 1 - ease(f, c1, c1 + 10));
  const cam = f < tCo - 3 ? camTo(f, tVe, focus(W_C, 1.1), focus(fl(300, 320), 1.6)) : f < c1 ? camTo(f, tCo - 3, focus(fl(300, 320), 1.6), focus(fl(300, 320), 2.1)) : camTo(f, c1, focus(fl(300, 320), 2.1), focus(fl(300, 140), 1.6));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      <Sfx at={tVe + 8} src="thud.wav" vol={0.7} />
      <Sfx at={tAr - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tCi - 2} src="tick.wav" vol={0.4} />
      <Sfx at={tCv + 10} src="thud.wav" vol={0.7} />
      <WStage cam={cam} f={f}><Wall f={f} cracks={[fix, fix, fix, fix]} verga={vg} contra={cv} xray={xray} /></WStage>
      {f < c1 && <Title text={<><Hi>Verga</Hi>: em cima</>} f={f} at={0} />}
      {f >= c1 && <Title text={<><Hi>Contraverga</Hi>:<br />embaixo</>} f={f} at={c1} />}
      {f < c1 && <Pill text="CONCRETO ARMADO" f={f} at={tCo - 2} top={1090} />}
      {f < c1 && f >= tAr && <Pill text="+ BARRAS DE AÇO" f={f} at={tAr} top={420} bg={C.yellow} />}
      <CutFlash cuts={[tVe, tCo - 3, c1]} />
    </SceneIn>
  );
};

const Dim: React.FC<{a: P2; b: P2; label: string; p: number; color?: string; off?: number}> = ({a, b, label, p, color = C.yellow, off = 0}) => {
  if (p <= 0) return null;
  const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return (
    <g opacity={Math.min(1, p * 2)}>
      <line x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * p} y2={a[1] + (b[1] - a[1]) * p} stroke={color} strokeWidth={5} />
      <circle cx={a[0]} cy={a[1]} r={7} fill={color} /><circle cx={a[0] + (b[0] - a[0]) * p} cy={a[1] + (b[1] - a[1]) * p} r={7} fill={color} />
      <g transform={`translate(${m[0]},${m[1] - 34 + off}) scale(${p})`}>
        <rect x={-label.length * 10 - 14} y={-26} width={label.length * 20 + 28} height={44} rx={10} fill={color} />
        <text y={8} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={30} fill="#fff">{label}</text>
      </g>
    </g>
  );
};
const V5: React.FC = () => {
  const f = useCurrentFrame();
  const tPa = wt(5, 'passar'), tDo = wt(5, 'dois'), tNu = wt(5, 'numa'), tMe = wt(5, 'metro'), tTr = wt(5, 'trinta');
  const c1 = tNu - 3;
  const cam = f < c1 ? camTo(f, 0, focus(fl(300, 240), 1.2), focus(fl(300, 240), 1.5)) : camTo(f, c1, focus(fl(300, 240), 1.5), focus(fl(300, 260), 1.75));
  const ext = ease(f, tPa - 4, tDo + 6);
  const glowL = f < c1 ? 0.5 + 0.5 * Math.sin(f / 3) : 0;
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={tPa - 4} src="whoosh.wav" vol={0.4} />
      <Sfx at={tDo - 2} src="pop.wav" vol={0.45} />
      <Sfx at={tMe - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tTr - 4} src="pop.wav" vol={0.5} />
      <WStage cam={cam} f={f}>
        <Wall f={f} verga={1} contra={1} />
        {f < c1 && [[VG.u0, WIN.u0], [WIN.u1, VG.u1]].map(([a, b], i) => [[300, 335], [115, 150]].map(([v0, v1], k) => (
          <polygon key={i + '-' + k} points={rectOn(fl, a, v0, b, v1)} fill={C.yellow} opacity={ext * (0.35 + 0.35 * glowL)} />
        )))}
        {f < c1 && <g>
          {[[-1, VG.u0], [1, VG.u1]].map(([s, u], i) => { const q = fl(u, 318); return <g key={i} opacity={ext}><path d={`M${q[0]} ${q[1]} l${s * 40} 0`} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" /><path d={`M${q[0] + s * 52} ${q[1]} l${-s * 16} -12 l0 24 Z`} fill={C.yellow} /></g>; })}
        </g>}
        <Dim a={fl(WIN.u0, 228)} b={fl(WIN.u1, 228)} label="1,5 m" p={ease(f, tMe - 4, tMe + 8)} color={C.navy} />
        <Dim a={fl(VG.u0, 362)} b={fl(WIN.u0, 362)} label="30 cm" p={ease(f, tTr - 4, tTr + 6)} />
        <Dim a={fl(WIN.u1, 362)} b={fl(VG.u1, 362)} label="30 cm" p={ease(f, tTr, tTr + 10)} />
      </WStage>
      {f < c1 && <Title text={<>Passa dos<br /><Hi>dois lados</Hi></>} f={f} />}
      {f >= c1 && <Title text={<>Uns <Hi>30 cm</Hi><br />de cada lado</>} f={f} at={c1} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const V6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tPo = wt(6, 'pouco'), tEv = wt(6, 'evita'), tSe = wt(6, 'segue'), tAte = wt(6, 'ate');
  const B = tSe - 4;
  const press = tSe + 14;
  const followed = f >= press;
  const total = Math.round(DURS[6] * fps);
  const g0 = Math.round(STARTS[6] * FPS);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={tPo - 4} src="cash.wav" vol={0.35} />
      <Sfx at={tEv - 2} src="pop.wav" vol={0.5} />
      <Sfx at={B} src="whoosh.wav" vol={0.45} />
      <Sfx at={press} src="pop.wav" vol={0.5} />
      {!cut(f, B) && (
        <>
          <Handle />
          <WStage cam={camTo(f, tEv, focus(W_C, 1.0), focus(W_C, 1.12))} f={f}><Wall f={f} verga={1} contra={1} /></WStage>
          {f < tEv - 3 && <Title text={<>Custa <Hi c={C.green}>pouco</Hi></>} f={f} />}
          {f >= tEv - 3 && <Title text={<>Evita <Hi c={C.green}>trinca</Hi></>} f={f} at={tEv - 3} />}
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <g transform={`translate(860,560) scale(${pop(f, tEv - 2, fps, 8)})`}>
              <circle r={90} fill={C.green} />
              <path d="M-40 0 L-12 30 L44 -32" stroke="white" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <Coins f={f} at={tPo - 4} n={10} seed="vc" x={760} y={700} spread={500} />
        </>
      )}
      {cut(f, B) && (
        <AbsoluteFill>
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24}}>
            <div style={{width: 340, height: 340, borderRadius: 170, overflow: 'hidden', background: C.white, border: `12px solid ${C.yellow}`, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', scale: String(pop(f, B, fps, 11))}}>
              <Raphael mouth={mouthAt(f + g0)} blink={blinkAt(f + g0)} />
            </div>
            <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 60, color: C.navy}}>{HANDLE}</div>
            <div style={{fontFamily: 'InterD', fontWeight: 700, fontSize: 34, color: C.grey, letterSpacing: 4}}>ENGENHARIA DE OBRA</div>
            <div style={{marginTop: 10, background: followed ? C.white : C.yellow, color: followed ? C.navy : C.white, border: `5px solid ${followed ? C.navy : C.yellow}`, fontFamily: 'InterD', fontWeight: 900, fontSize: 50, padding: '14px 80px', borderRadius: 999, scale: String(followed ? 0.94 + 0.06 * pop(f, press, fps, 9) : 1)}}>{followed ? 'Seguindo ✓' : 'Seguir'}</div>
          </div>
          {f >= tAte - 2 && <div style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 96, color: C.yellow, letterSpacing: -3, scale: String(pop(f, tAte - 2, fps, 9))}}>Até o próximo!</div>}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [total - 18, total], [0, 1], clamp)}} />
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
};

const CapaVerga: React.FC = () => (
  <AbsoluteFill style={{background: C.cream}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(19).fill(0).map((_, i) => <line key={'v' + i} x1={i * 60} y1={0} x2={i * 60} y2={1920} stroke="#1A1A1A" opacity={0.035} />)}
      {new Array(33).fill(0).map((_, i) => <line key={'h' + i} x1={0} y1={i * 60} x2={1080} y2={i * 60} stroke="#1A1A1A" opacity={0.035} />)}
      <g transform={`translate(${560 - W_C[0] * 0.95},${1150 - W_C[1] * 0.95}) scale(0.95)`}><Wall f={0} cracks={[1, 1, 1, 1]} /></g>
      <g transform="translate(880,860) rotate(10)"><circle r={95} fill={C.yellow} /><text y={36} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={110} fill="white">?</text></g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>ALVENARIA</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: C.yellow, letterSpacing: 2}}>#05</div>
    </div>
    <div style={{position: 'absolute', top: 380, left: 80, right: 70, fontFamily: 'InterD', fontWeight: 900, fontSize: 118, color: C.navy, letterSpacing: -6, lineHeight: 0.98}}>
      A trinca no<br />canto da<br /><span style={{color: C.yellow}}>janela</span>
    </div>
    <div style={{position: 'absolute', top: 1540, left: 80, right: 80, display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 150, height: 150, borderRadius: 75, overflow: 'hidden', background: C.white, border: `7px solid ${C.yellow}`, flexShrink: 0}}><Raphael mouth={0} blink={0} /></div>
      <div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 44, color: C.navy}}>{HANDLE}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 600, fontSize: 30, color: C.grey}}>Engenheiro civil explica</div>
      </div>
    </div>
  </AbsoluteFill>
);

const SCENES = [V0, V1, V2, V3, V4, V5, V6];
const Main: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {SCENES.map((S, i) => (
        <Sequence key={i} from={Math.round(STARTS[i] * fps)} durationInFrames={Math.round(DURS[i] * fps)}>
          <S />
          {i > 0 && <Flash />}
        </Sequence>
      ))}
      <Captions />
      <AvatarCorner />
      <Progress />
      <Audio src={staticFile('voice_construcao-05-verga.wav')} />
    </AbsoluteFill>
  );
};
export const Root: React.FC = () => (
  <>
    <Composition id="VergaJanela" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaVerga" component={CapaVerga} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

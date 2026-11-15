import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_construcao-07-torre-pisa-completa.json';
import mouthData from './mouth_construcao-07-torre-pisa-completa.json';
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
    <div style={{position: 'absolute', top: 110, left: 80, fontFamily: 'InterD', fontWeight: 600, fontSize: 32, color: C.grey, letterSpacing: 6}}>OBRAS FAMOSAS · 01</div>
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
const LAST = DURS.length - 1;
const END_FRAME = Math.round(STARTS[LAST] * FPS) + wt(LAST, 'segue') - 4;
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

// ================= TORRE DE PISA =================
type P2 = [number, number];
const TIERS = [95, 60, 60, 60, 60, 60, 60, 70];
const TW = (i: number) => (i === 7 ? 128 : i === 0 ? 176 : 168);
const TOP_Y = -TIERS.reduce((a, b) => a + b, 0);
const Tier: React.FC<{i: number; y: number; h: number; g: number}> = ({i, y, h, g}) => {
  const w = TW(i);
  const hh = h * g;
  if (hh <= 0.5) return null;
  const n = i === 0 ? 4 : i === 7 ? 4 : 6;
  const cw = w / n;
  return (
    <g>
      <rect x={-w / 2} y={y - hh} width={w} height={hh} fill={C.wall} stroke={C.navy} strokeWidth={3} />
      <rect x={w / 2 - w * 0.3} y={y - hh} width={w * 0.3} height={hh} fill={C.wallR} />
      {g > 0.85 && new Array(n).fill(0).map((_, k) => {
        const x0 = -w / 2 + k * cw + cw * 0.22, x1 = x0 + cw * 0.56, yb = y - 8, yt = y - h + 18;
        return <path key={k} d={`M${x0} ${yb} L${x0} ${yt} A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 1 ${x1} ${yt} L${x1} ${yb} Z`} fill={k >= n - 2 ? '#CFC6B8' : '#DDD6CB'} />;
      })}
      {g > 0.95 && <rect x={-w / 2 - 7} y={y - h - 4} width={w + 14} height={9} rx={3} fill={C.wallT} stroke={C.navy} strokeWidth={3} />}
    </g>
  );
};
const Tower: React.FC<{ang: number; floors?: number; found?: number; sink?: number; curve?: number; lead?: number}> = ({ang, floors = 8, found = 0, sink = 0, curve = 0, lead = 0}) => {
  const rec = (i: number): React.ReactNode => {
    if (i >= TIERS.length) return floors >= 8 ? <rect x={-60} y={-14} width={120} height={14} rx={4} fill={C.roof} /> : null;
    const g = Math.max(0, Math.min(1, floors - i));
    if (g <= 0) return null;
    return (
      <g>
        <Tier i={i} y={0} h={TIERS[i]} g={g} />
        {g >= 1 && <g transform={`translate(0,${-TIERS[i]}) rotate(${i >= 3 ? -curve : 0})`}>{rec(i + 1)}</g>}
      </g>
    );
  };
  return (
    <g transform={`translate(0,${sink}) rotate(${ang})`}>
      {found > 0 && <g><rect x={-112} y={0} width={224} height={found} fill="#BDB8AE" stroke={C.navy} strokeWidth={3} />
        {new Array(10).fill(0).map((_, i) => <circle key={i} cx={-100 + random('fd' + i) * 200} cy={6 + random('fe' + i) * (found - 12)} r={3} fill="rgba(0,0,0,0.2)" />)}</g>}
      {lead > 0 && new Array(9).fill(0).map((_, i) => { const r = Math.floor(i / 3), c = i % 3; const p = Math.max(0, Math.min(1, lead * 9 - i)); if (p <= 0) return null; return <g key={'pb' + i} transform={`translate(${-200 + c * 50},${-20 - r * 34 - (1 - p) * 200}) scale(1.6)`}><rect x={-15} y={-10} width={30} height={20} rx={3} fill="#5F6670" stroke={C.navy} strokeWidth={3} /><text y={6} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={12} fill="#fff">Pb</text></g>; })}
      {rec(0)}
    </g>
  );
};
// chão em corte: camada de cima + argila mole
const Ground: React.FC<{section: number; f: number; glow?: number; dense?: number; dig?: number}> = ({section, f, glow = 0, dense = 0, dig = 0}) => (
  <g>
    <rect x={-700} y={0} width={1400} height={26} fill={C.grassD} />
    <line x1={-700} y1={0} x2={700} y2={0} stroke={C.navy} strokeWidth={4} />
    {section > 0 && <g opacity={section}>
      <rect x={-700} y={26} width={1400} height={70} fill="#D9C9B0" />
      <rect x={-700} y={96} width={1400} height={260} fill="#B9A58E" />
      <rect x={-700} y={96} width={1400} height={260} fill={C.yellow} opacity={0.25 * glow * (0.6 + 0.4 * Math.sin(f / 3))} />
      {new Array(7).fill(0).map((_, k) => <path key={k} d={`M-700 ${120 + k * 34} ` + new Array(28).fill(0).map((_, j) => `q25 ${j % 2 ? -10 : 10} 50 0`).join(' ')} stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" />)}
      {new Array(40).fill(0).map((_, i) => { const x = -660 + random('cl' + i) * 1320; const y0 = 110 + random('cm' + i) * 230; const y = y0 + (250 - y0) * 0.25 * dense; return <circle key={i} cx={x} cy={y} r={5} fill="#8E7B66" />; })}
      {dig > 0 && new Array(16).fill(0).map((_, i) => { const ph = ((f + i * 4) % 40) / 40; const a: P2 = [-90 + random('dg' + i) * 60, 70]; const b: P2 = [-330, -10]; return <circle key={'d' + i} cx={a[0] + (b[0] - a[0]) * ph} cy={a[1] + (b[1] - a[1]) * ph} r={7} fill="#8E7B66" opacity={dig} />; })}
      {dig > 0 && <line x1={-70} y1={72} x2={-340} y2={-12} stroke={C.navy} strokeWidth={14} strokeLinecap="round" opacity={dig} />}
      <rect x={-700} y={356} width={1400} height={60} fill="#CDBB9F" />
    </g>}
  </g>
);
type Cam = {x: number; y: number; s: number};
const TW_ = {x: 540, y: 1120, s: 1.22};
const SEC = {x: 560, y: 830, s: 1.0};
const at = (lx: number, ly: number, s: number, sx = 540, sy = 800): Cam => ({x: sx - lx * s, y: sy - ly * s, s});
const TStage: React.FC<{cam: Cam; f: number; children: React.ReactNode}> = ({cam, f, children}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${cam.x + Math.sin(f / 40) * 4},${cam.y}) scale(${cam.s})`}>{children}</g></svg>
);
const LEAN = 7;
const Q: React.FC<{f: number; at: number; x: number; y: number; color?: string; txt?: string}> = ({f, at: a, x, y, color = C.yellow, txt = '?'}) => {
  const {fps} = useVideoConfig();
  if (f < a) return null;
  return <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${x},${y}) scale(${pop(f, a, fps, 8)}) rotate(10)`}><circle r={90} fill={color} /><text y={38} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={110} fill="white">{txt}</text></g></svg>;
};

const WIDE0 = at(0, -260, 0.95, 540, 820);
const LOW3 = at(0, -100, 2.2, 540, 1080);
const SECR = at(-60, 80, 0.85, 640, 860);
const FOUND = at(40, 0, 1.7, 600, 860);
const Ghost: React.FC<{children: React.ReactNode; op?: number}> = ({children, op = 0.35}) => <g opacity={op}>{children}</g>;
const People: React.FC<{f: number; at: number; n?: number; sad?: boolean}> = ({f, at: a, n = 6, sad}) => {
  if (f < a) return null;
  return <g>{new Array(n).fill(0).map((_, i) => {
    const x = -420 + i * 130 + (i >= n / 2 ? 190 : 0);
    const s = spring({frame: f - a - i * 2, fps: FPS, config: {damping: 10, stiffness: 160}});
    return <g key={i} transform={`translate(${x},0) scale(${s * 1.8})`}>
      <circle cx={0} cy={-62} r={13} fill={C.navy} />
      <rect x={-12} y={-48} width={24} height={36} rx={10} fill={['#D9480F', '#2F9E44', '#1971C2', '#E8890C'][i % 4]} />
      <rect x={-10} y={-14} width={8} height={14} fill={C.navy} /><rect x={2} y={-14} width={8} height={14} fill={C.navy} />
      {!sad && <rect x={10} y={-50} width={18} height={13} rx={3} fill={C.navy} />}
    </g>;
  })}</g>;
};

// L0 gancho
const L0: React.FC = () => {
  const f = useCurrentFrame();
  const t8 = wt(0, '800'), tPo = wt(0, 'por'), tCa = wt(0, 'cai'), tDe = wt(0, 'detalhe'), tFi = wt(0, 'final');
  const c1 = tPo - 3, c2 = tDe - 6;
  const cam = f < c1 ? mixCam(WIDE0, TW_, ease(f, 0, c1)) : f < c2 ? camTo(f, c1, TW_, at(30, -330, 1.55, 540, 820)) : camTo(f, c2, at(30, -330, 1.55, 540, 820), at(0, -240, 0.9, 420, 900));
  const wob = f >= tCa ? 2.5 * Math.sin((f - tCa) / 2.2) * Math.exp(-(f - tCa) / 14) : 0;
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={t8 - 2} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={tCa} src="thud.wav" vol={0.7} />
      <Sfx at={c2} src="whoosh.wav" vol={0.45} />
      <Sfx at={tFi - 2} src="pop.wav" vol={0.5} />
      <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={LEAN + wob} /></TStage>
      {f < c1 && <Title text={<>Torta há<br /><Hi>800 anos</Hi></>} f={f} />}
      {f >= c1 && f < c2 && <Title text={<>Por que<br /><Hi c={C.red}>não cai?</Hi></>} f={f} at={c1} />}
      {f < c2 && <Q f={f} at={tCa - 2} x={860} y={640} />}
      {f >= c2 && <Title text={<>O detalhe mais<br /><Hi>louco</Hi> no final</>} f={f} at={c2} size={96} />}
      {f >= c2 && <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(800,800) scale(${pop(f, c2 + 2, FPS, 8)}) rotate(-8)`}>
        <rect x={-110} y={-80} width={220} height={160} rx={18} fill={C.yellow} stroke={C.navy} strokeWidth={8} />
        <rect x={-14} y={-80} width={28} height={160} fill={C.navy} /><rect x={-110} y={-14} width={220} height={28} fill={C.navy} />
        <text y={-100} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={70} fill={C.navy}>???</text>
      </g></svg>}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const L1: React.FC = () => {
  const f = useCurrentFrame();
  const t73 = wt(1, '1173'), tTe = wt(1, 'terceiro'), tAf = wt(1, 'afundava');
  const c1 = tTe - 3;
  const floors = interpolate(f, [4, tTe + 4], [0, 3], {...clamp, easing: Easing.out(Easing.quad)});
  const ang = 4 * ease(f, tAf - 6, tAf + 12);
  const cam = f < c1 ? camTo(f, 0, at(0, -60, 2.4, 540, 1050), LOW3) : camTo(f, c1, LOW3, at(40, -130, 2.5, 540, 960));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      {[0, 1, 2].map((k) => <Sfx key={k} at={4 + k * (tTe / 3)} src="tick.wav" vol={0.45} />)}
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tAf - 4} src="thud.wav" vol={0.7} />
      <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={ang} floors={floors} /></TStage>
      {f < c1 && <Title text={<>Começou em <Hi>1173</Hi></>} f={f} />}
      {f >= c1 && <Title text={<><Hi>3º andar</Hi>:<br />já afundava</>} f={f} at={c1} />}
      {f < c1 && <Pill text={`${Math.max(1, Math.ceil(floors))}º ANDAR`} f={f} at={t73} top={1090} />}
      <Stamp text="AFUNDANDO" f={f} at={tAf - 2} x={500} y={1050} />
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const L2: React.FC = () => {
  const f = useCurrentFrame();
  const tCh = wt(2, 'chao'), tAr = wt(2, 'argila'), tFu = wt(2, 'fundacao'), t3 = wt(2, '3');
  const c1 = tCh - 3, c2 = tFu - 3;
  const sec = ease(f, c1, c1 + 8);
  const cam = f < c1 ? camTo(f, 0, TW_, TW_) : f < c2 ? camTo(f, c1, TW_, SEC) : camTo(f, c2, SEC, FOUND);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={tAr - 2} src="thud.wav" vol={0.6} />
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      <Sfx at={t3 - 2} src="pop.wav" vol={0.5} />
      <TStage cam={cam} f={f}>
        <Ground section={sec} f={f} glow={f < c2 ? ease(f, tAr - 4, tAr + 6) : 0} />
        <Tower ang={LEAN} found={sec > 0 ? 46 : 0} />
        {f >= c2 && <Dim a={[-150, 0]} b={[-150, 48]} label="3 m" p={ease(f, t3 - 4, t3 + 6)} color={C.red} off={58} />}
      </TStage>
      {f < c1 && <Title text={<>O culpado?</>} f={f} />}
      {f >= c1 && f < c2 && <Title text={<>O <Hi>chão</Hi></>} f={f} at={c1} size={130} />}
      {f >= c2 && <Title text={<>Fundação de<br />só <Hi c={C.red}>3 metros</Hi></>} f={f} at={c2} />}
      {f < c2 && <Pill text="ARGILA MOLE" f={f} at={tAr - 2} top={1110} bg={C.red} />}
      {f < c2 && <Stamp text="CULPADO" f={f} at={0} x={560} y={560} />}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const L3: React.FC = () => {
  const f = useCurrentFrame();
  const t15 = wt(3, '15'), tPo = wt(3, 'pouco');
  const c1 = tPo - 8;
  const drop = interpolate(f, [t15 - 8, t15 + 2], [-500, 0], {...clamp, easing: Easing.in(Easing.quad)});
  const sq = f >= t15 + 2 ? 1 - 0.06 * Math.exp(-(f - t15 - 2) / 5) : 1;
  const cam = f < c1 ? camTo(f, 0, FOUND, at(0, -280, 0.95, 540, 980)) : camTo(f, c1, at(0, -280, 0.95, 540, 980), FOUND);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      <Sfx at={t15 + 2} src="thud.wav" vol={0.8} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tPo - 2} src="pop.wav" vol={0.5} />
      <TStage cam={cam} f={f}>
        <Ground section={1} f={f} />
        <g transform={`scale(1,${sq})`}><Tower ang={LEAN} found={46} /></g>
        {f >= t15 - 8 && f < c1 + 6 && <g transform={`translate(${Math.sin((LEAN * Math.PI) / 180) * -TOP_Y},${TOP_Y - 90 + drop})`}>
          <path d="M-120 60 L120 60 L90 -50 L-90 -50 Z" fill={C.navy} />
          <rect x={-26} y={-78} width={52} height={32} rx={10} fill="none" stroke={C.navy} strokeWidth={12} />
          <text y={30} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={48} fill="#fff">15.000 t</text>
        </g>}
        {f >= c1 && <Dim a={[-150, 0]} b={[-150, 48]} label="3 m" p={1} color={C.red} off={58} />}
      </TStage>
      {f < c1 && <Title text={<>Quase <Hi>15 mil</Hi><br />toneladas</>} f={f} />}
      {f >= c1 && <Title text={<>Em só <Hi c={C.red}>3 m</Hi>?</>} f={f} at={c1} size={130} />}
      <Stamp text="MUITO POUCO" f={f} at={tPo - 2} x={360} y={1060} />
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const L4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tSo = wt(4, 'sorte'), tGu = wt(4, 'guerras'), t100 = wt(4, '100');
  const c1 = tGu - 3;
  const cam = f < c1 ? camTo(f, 0, at(0, -100, 2.4, 540, 1080), LOW3) : camTo(f, c1, LOW3, at(0, -100, 1.9, 400, 1080));
  const yrs = Math.round(countTo(f, t100 - 14, t100 + 6, 100));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={tSo - 2} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tGu} src="thud.wav" vol={0.6} />
      <Sfx at={t100 - 14} src="tick.wav" vol={0.4} />
      <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={3} floors={3} /></TStage>
      {f < c1 && <Title text={<>Aí veio a <Hi c={C.green}>sorte</Hi></>} f={f} />}
      {f >= c1 && <Title text={<>Obra <Hi c={C.red}>parada</Hi></>} f={f} at={c1} />}
      {f >= c1 && (
        <div style={{position: 'absolute', top: 500, right: 90, textAlign: 'center', scale: String(pop(f, c1 + 2, fps, 10))}}>
          <div style={{background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 130, borderRadius: 28, padding: '10px 34px', lineHeight: 1}}>{f >= t100 - 14 ? yrs : 0}</div>
          <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 44, color: C.navy, marginTop: 10, letterSpacing: 3}}>ANOS</div>
        </div>
      )}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const L5: React.FC = () => {
  const f = useCurrentFrame();
  const tSo = wt(5, 'solo'), tFi = wt(5, 'firmou'), tSe = wt(5, 'sem'), tCa = wt(5, 'caido');
  const c1 = tSe - 3;
  const cam = f < c1 ? camTo(f, 0, LOW3, at(0, 120, 1.3, 540, 760)) : camTo(f, c1, at(0, 120, 1.3, 540, 760), at(60, -200, 1.0, 500, 960));
  const fall = ease(f, tCa - 14, tCa + 6);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      <Sfx at={tFi - 2} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tCa + 4} src="thud.wav" vol={0.8} />
      <TStage cam={cam} f={f}>
        <Ground section={f < c1 ? 1 : 0} f={f} dense={ease(f, tSo, tFi + 10)} />
        {f < c1 && [-200, 0, 200].map((x, i) => { const y = 120 + ((f * 2 + i * 20) % 60); return <path key={i} d={`M${x} ${y} l0 40 m-16 -16 l16 16 l16 -16`} stroke={C.green} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />; })}
        {f >= c1 && <Ghost op={0.4}><Tower ang={3 + 60 * fall} floors={8} /></Ghost>}
        <Tower ang={3} floors={f < c1 ? 3 : 3} found={f < c1 ? 46 : 0} />
      </TStage>
      {f < c1 && <Title text={<>O solo <Hi c={C.green}>firmou</Hi></>} f={f} />}
      {f < c1 && <Pill text="SOLO ESPREMIDO" f={f} at={tSo} top={1110} bg={C.green} />}
      {f >= c1 && <Title text={<>Sem a pausa...</>} f={f} at={c1} />}
      <Stamp text="TERIA CAÍDO" f={f} at={tCa + 2} x={420} y={1040} />
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const L6: React.FC = () => {
  const f = useCurrentFrame();
  const tVo = wt(6, 'volta'), tAn = wt(6, 'andares'), tAl = wt(6, 'altos'), tLa = wt(6, 'lado');
  const floors = interpolate(f, [tVo, tAl + 6], [3, 8], {...clamp, easing: Easing.out(Easing.quad)});
  const cam = camTo(f, tAn - 2, LOW3, at(0, -260, 1.05, 540, 980));
  const curve = 1.2 * ease(f, tAl - 4, tLa + 8);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      {[0, 6, 12, 18, 24].map((d) => <Sfx key={d} at={tVo + d} src="tick.wav" vol={0.35} />)}
      <Sfx at={tAl - 2} src="pop.wav" vol={0.5} />
      <TStage cam={cam} f={f}>
        <Ground section={0} f={f} /><Tower ang={3.5} floors={floors} curve={curve} />
        {f >= tLa && [0, 1, 2].map((k) => { const y = -260 - k * 70; return <g key={k} opacity={ease(f, tLa + k * 3, tLa + 8 + k * 3)}><path d={`M150 ${y} l0 -46 m-16 16 l16 -16 l16 16`} stroke={C.yellow} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>; })}
      </TStage>
      {f < tAn - 2 && <Title text={<>Na <Hi>volta</Hi>...</>} f={f} size={130} />}
      {f >= tAn - 2 && <Title text={<>Um lado<br /><Hi>mais alto</Hi></>} f={f} at={tAn - 2} />}
      <Pill text="PRA DISFARÇAR" f={f} at={tLa} top={1110} />
      <CutFlash cuts={[tAn - 2]} />
    </SceneIn>
  );
};

const L7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tCu = wt(7, 'curvada'), tBa = wt(7, 'banana');
  const cam = camTo(f, tCu - 2, at(0, -260, 1.05, 540, 980), at(0, -280, 1.12, 460, 1000));
  const axis = ease(f, tCu - 4, tCu + 10);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      <Sfx at={tCu - 2} src="pop.wav" vol={0.5} />
      <Sfx at={tBa - 2} src="pop.wav" vol={0.55} />
      <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={3.5} curve={1.2} />
        <path d={`M0 0 Q ${30} -300 ${-10 + 0} -${560 * axis}`} transform="rotate(3.5)" stroke={C.yellow} strokeWidth={8} strokeDasharray="16 12" fill="none" />
      </TStage>
      <Title text={<>Torre <Hi>curvada</Hi></>} f={f} />
      {f >= tBa - 2 && <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(870,700) scale(${pop(f, tBa - 2, fps, 8)}) rotate(-20)`}>
        <path d="M-90 -60 Q -100 80 60 90 Q 110 90 100 70 Q -20 60 -50 -60 Z" fill="#F7D046" stroke={C.navy} strokeWidth={8} strokeLinejoin="round" />
        <rect x={-98} y={-82} width={16} height={26} rx={4} fill="#6B4F1D" />
      </g></svg>}
    </SceneIn>
  );
};

const L8: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t200 = wt(8, '200'), tCo = wt(8, 'continuou'), tAn = wt(8, 'ano');
  const c1 = tCo - 3;
  const yrs = Math.round(countTo(f, t200 - 12, t200 + 8, 200));
  const ang = 3.5 + 3.5 * ease(f, c1, c1 + 40);
  const year = Math.round(interpolate(f, [c1, c1 + 40], [1372, 1990], clamp));
  const cam = f < c1 ? camTo(f, 0, at(0, -280, 1.12, 460, 1000), at(0, -280, 1.0, 420, 1000)) : camTo(f, c1, at(0, -280, 1.0, 420, 1000), TW_);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={t200 - 12} src="tick.wav" vol={0.4} />
      <Sfx at={t200 + 8} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tAn} src="tick.wav" vol={0.4} />
      <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={ang} curve={1.2} /></TStage>
      {f < c1 && <Title text={<>Quase <Hi>200 anos</Hi><br />de obra</>} f={f} />}
      {f >= c1 && <Title text={<>E continuou<br /><Hi c={C.red}>inclinando</Hi></>} f={f} at={c1} />}
      {f < c1 && <div style={{position: 'absolute', top: 560, right: 90, textAlign: 'center', scale: String(pop(f, t200 - 12, fps, 10))}}>
        <div style={{background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 130, borderRadius: 28, padding: '10px 34px', lineHeight: 1}}>{yrs}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 44, color: C.navy, marginTop: 10, letterSpacing: 3}}>ANOS</div>
      </div>}
      {f >= c1 && <Pill text={String(year)} f={f} at={c1} top={1110} bg={C.red} size={56} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const L9: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t90 = wt(9, '1990'), tPe = wt(9, 'perto'), tFe = wt(9, 'fecharam');
  const c1 = tPe - 3, c2 = tFe - 3;
  const cam = f < c1 ? camTo(f, 0, TW_, TW_) : f < c2 ? camTo(f, c1, TW_, at(40, -300, 1.4, 540, 800)) : camTo(f, c2, at(40, -300, 1.4, 540, 800), at(0, -200, 1.0, 600, 960));
  const arc = ease(f, tPe - 2, tPe + 10);
  const pulse = 0.6 + 0.4 * Math.sin(f / 2.5);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={t90 - 2} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tPe} src="tick.wav" vol={0.5} />
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      <Sfx at={tFe} src="thud.wav" vol={0.7} />
      <TStage cam={cam} f={f}>
        <Ground section={0} f={f} /><Tower ang={LEAN} curve={1.2} />
        {f >= c1 && <g opacity={arc}>
          <line x1={0} y1={0} x2={0} y2={TOP_Y - 30} stroke={C.navy} strokeWidth={4} strokeDasharray="14 10" />
          <path d={`M0 -380 A380 380 0 0 1 ${380 * Math.sin((LEAN * Math.PI) / 180) * arc} ${-380 * Math.cos((LEAN * Math.PI) / 180 * arc)}`} stroke={C.red} strokeWidth={8} fill="none" opacity={pulse} />
        </g>}
        {f >= c2 && [-30, 30].map((dy, i) => <line key={i} x1={-260} y1={-60 + dy} x2={-260 + 520 * ease(f, c2 + i * 3, c2 + 10 + i * 3)} y2={-80 + dy} stroke={C.red} strokeWidth={16} strokeDasharray="30 22" />)}
      </TStage>
      {f < c1 && <Title text={<>Em <Hi>1990</Hi>...</>} f={f} size={130} />}
      {f >= c1 && f < c2 && <Title text={<>Perto do<br /><Hi c={C.red}>limite</Hi></>} f={f} at={c1} />}
      {f >= c1 && f < c2 && <div style={{position: 'absolute', top: 560, right: 90, background: C.red, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 70, padding: '8px 28px', borderRadius: 22, scale: String(pop(f, tPe, fps, 9))}}>5,5°</div>}
      {f >= c2 && <Title text={<>Torre <Hi c={C.red}>fechada</Hi></>} f={f} at={c2} />}
      <Stamp text="FECHADA" f={f} at={tFe} x={330} y={600} size={100} />
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const L10: React.FC = () => {
  const f = useCurrentFrame();
  const tCe = wt(10, 'centenas'), tCh = wt(10, 'chumbo'), tLa = wt(10, 'lado'), tCo = wt(10, 'contrapeso');
  const lead = ease(f, tCe - 4, tCh + 20);
  const cam = f < tLa - 3 ? camTo(f, 0, at(0, -200, 1.0, 600, 960), at(-150, -80, 1.4, 600, 1000)) : camTo(f, tLa - 3, at(-150, -80, 1.4, 600, 1000), at(-60, -250, 1.05, 600, 1000));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      {[0, 5, 10, 15, 20].map((d) => <Sfx key={d} at={tCe + d} src="thud.wav" vol={0.4} />)}
      <Sfx at={tLa - 3} src="whoosh.wav" vol={0.4} />
      <Sfx at={tCo - 2} src="pop.wav" vol={0.5} />
      <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={LEAN} curve={1.2} lead={lead} />
        {f >= tCo - 2 && <g opacity={ease(f, tCo - 2, tCo + 6)}><path d="M-160 -120 l0 70 m-18 -22 l18 22 l18 -22" stroke={C.yellow} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
      </TStage>
      {f < tLa - 3 && <Title text={<>Contrapeso de<br /><Hi>chumbo</Hi></>} f={f} />}
      {f >= tLa - 3 && <Title text={<>No lado<br /><Hi>mais alto</Hi></>} f={f} at={tLa - 3} />}
      <Pill text="CENTENAS DE TONELADAS" f={f} at={tCe} top={480} bg={C.yellow} />
      <CutFlash cuts={[tLa - 3]} />
    </SceneIn>
  );
};

const L11: React.FC = () => {
  const f = useCurrentFrame();
  const tTi = wt(11, 'tiraram'), tAl = wt(11, 'alto'), tEd = wt(11, 'endireitou'), t40 = wt(11, '40');
  const c1 = tTi - 3, c2 = tEd - 3;
  const ang = LEAN - 1.6 * ease(f, tEd - 2, t40 + 8);
  const cam = f < c1 ? camTo(f, 0, TW_, TW_) : f < c2 ? camTo(f, c1, TW_, SECR) : camTo(f, c2, SECR, at(10, -250, 0.98, 540, 870));
  const topNow: P2 = [Math.sin((ang * Math.PI) / 180) * -TOP_Y, TOP_Y];
  const topOld: P2 = [Math.sin((LEAN * Math.PI) / 180) * -TOP_Y, TOP_Y];
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      {[0, 8, 16].map((d) => <Sfx key={d} at={tTi + d} src="tick.wav" vol={0.35} />)}
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      <Sfx at={t40 - 2} src="pop.wav" vol={0.55} />
      <TStage cam={cam} f={f}>
        <Ground section={f >= c1 ? 1 : 0} f={f} dig={f >= c1 && f < c2 + 20 ? ease(f, c1, c1 + 6) : 0} />
        {f >= c2 && <g opacity={0.35}><Tower ang={LEAN} curve={1.2} /></g>}
        <Tower ang={ang} found={f >= c1 ? 46 : 0} curve={1.2} lead={1} />
        {f >= c2 && <Dim a={[topOld[0], topOld[1] - 50]} b={[topNow[0] - 1, topNow[1] - 50]} label="40 cm" p={ease(f, t40 - 4, t40 + 6)} color={C.green} off={-10} />}
      </TStage>
      {f < c1 && <Title text={<>Depois...</>} f={f} size={130} />}
      {f >= c1 && f < c2 && <Title text={<>Tiram terra do<br /><Hi>lado alto</Hi></>} f={f} at={c1} />}
      {f >= c1 && f < c2 && <Pill text="AOS POUQUINHOS" f={f} at={wt(11, 'aos')} top={1110} />}
      {f >= c2 && <Title text={<>Endireitou<br /><Hi c={C.green}>40 cm</Hi></>} f={f} at={c2} />}
      {f >= c2 && <Pill text="← 40 cm" f={f} at={t40 - 2} top={470} bg={C.green} size={60} />}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const L12: React.FC = () => {
  const f = useCurrentFrame();
  const tDe = wt(12, 'deixaram'), tTo = wt(12, 'torta'), tPr = wt(12, 'proposito'), tRe = wt(12, 'reta'), tNi = wt(12, 'ninguem');
  const c1 = tDe - 3, c2 = tRe - 6;
  const cam = f < c1 ? camTo(f, 0, at(0, -200, 1.2, 540, 900), at(0, -200, 1.3, 540, 900)) : camTo(f, c1, at(0, -200, 1.3, 540, 900), at(0, -240, 0.92, 540, 1020));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={tPr - 2} src="pop.wav" vol={0.6} />
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      <Sfx at={tNi - 2} src="thud.wav" vol={0.6} />
      {f < c1 && <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={LEAN - 1.6} curve={1.2} /></TStage>}
      {f < c1 && <Title text={<>O detalhe mais<br /><Hi>louco</Hi>:</>} f={f} />}
      {f < c1 && <Q f={f} at={2} x={860} y={620} txt="!" />}
      {f >= c1 && f < c2 && <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={LEAN - 1.6} curve={1.2} /><People f={f} at={tTo} n={6} /></TStage>}
      {f >= c1 && f < c2 && <Title text={<>Torta de<br /><Hi c={C.green}>propósito</Hi></>} f={f} at={c1} />}
      {f >= c1 && f < c2 && <Stamp text="DE PROPÓSITO" f={f} at={tPr - 2} x={300} y={560} color={C.green} size={80} />}
      {f >= c2 && <TStage cam={cam} f={f}><Ground section={0} f={f} /><Tower ang={0} /></TStage>}
      {f >= c2 && <Title text={<>Reta? <Hi c={C.red}>Ninguém</Hi><br />ia ver</>} f={f} at={c2} />}
      {f >= c2 && <svg width={1080} height={1920} style={{position: 'absolute'}}><XMark f={f} at={tNi - 2} cx={540} cy={760} r={170} w={30} /></svg>}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const L13: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tCu = wt(13, 'curte'), tCo = wt(13, 'comenta'), tSe = wt(13, 'segue'), tAte = wt(13, 'ate');
  const B = tSe - 4;
  const press = tSe + 14;
  const followed = f >= press;
  const total = Math.round(DURS[LAST] * fps);
  const g0 = Math.round(STARTS[LAST] * FPS);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={tCu} src="pop.wav" vol={0.5} />
      <Sfx at={tCo - 2} src="pop.wav" vol={0.5} />
      <Sfx at={B} src="whoosh.wav" vol={0.45} />
      <Sfx at={press} src="pop.wav" vol={0.5} />
      {!cut(f, B) && (
        <>
          <Handle />
          <TStage cam={camTo(f, tCo - 3, at(0, 60, 0.8, 640, 900), at(0, -230, 1.0, 540, 900))} f={f}>
            <Ground section={f < tCo - 3 ? 1 : 0} f={f} dense={1} /><Tower ang={LEAN - 1.6} found={46} curve={1.2} lead={1} />
          </TStage>
          {f < tCo - 3 && <Title text={<>Curte, salva<br />e <Hi>manda</Hi></>} f={f} />}
          {f >= tCo - 3 && <Title text={<>Qual obra você<br />quer <Hi>ver</Hi>?</>} f={f} at={tCo - 3} size={96} />}
          <Q f={f} at={tCu} x={860} y={620} color={C.red} txt="♥" />
        </>
      )}
      {cut(f, B) && (
        <AbsoluteFill>
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24}}>
            <div style={{width: 340, height: 340, borderRadius: 170, overflow: 'hidden', background: C.white, border: `12px solid ${C.yellow}`, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', scale: String(pop(f, B, fps, 11))}}>
              <Raphael mouth={mouthAt(f + g0)} blink={blinkAt(f + g0)} />
            </div>
            <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 60, color: C.navy}}>{HANDLE}</div>
            <div style={{fontFamily: 'InterD', fontWeight: 700, fontSize: 34, color: C.grey, letterSpacing: 4}}>OBRAS FAMOSAS</div>
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

const CapaPisa2: React.FC = () => (
  <AbsoluteFill style={{background: C.cream}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(19).fill(0).map((_, i) => <line key={'v' + i} x1={i * 60} y1={0} x2={i * 60} y2={1920} stroke="#1A1A1A" opacity={0.035} />)}
      {new Array(33).fill(0).map((_, i) => <line key={'h' + i} x1={0} y1={i * 60} x2={1080} y2={i * 60} stroke="#1A1A1A" opacity={0.035} />)}
      <g transform="translate(470,1420) scale(1.12)"><Ground section={0} f={0} /><Tower ang={LEAN} curve={1.2} /></g>
      <g transform="translate(860,980) rotate(10)"><circle r={95} fill={C.yellow} /><text y={36} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={110} fill="white">?</text></g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>OBRAS FAMOSAS</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: C.yellow, letterSpacing: 2}}>#01</div>
    </div>
    <div style={{position: 'absolute', top: 380, left: 80, right: 70, fontFamily: 'InterD', fontWeight: 900, fontSize: 108, color: C.navy, letterSpacing: -6, lineHeight: 0.98}}>
      Torre de Pisa:<br />a história <span style={{color: C.yellow}}>completa</span>
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

const SCENES = [L0, L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12, L13];
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
      <Audio src={staticFile('voice_construcao-07-torre-pisa-completa.wav')} />
    </AbsoluteFill>
  );
};
export const Root: React.FC = () => (
  <>
    <Composition id="TorrePisaCompleta" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPisaCompleta" component={CapaPisa2} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

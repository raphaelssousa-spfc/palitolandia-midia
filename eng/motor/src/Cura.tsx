import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_construcao-04-cura-concreto.json';
import mouthData from './mouth_construcao-04-cura-concreto.json';
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
    <div style={{position: 'absolute', top: 110, left: 80, fontFamily: 'InterD', fontWeight: 600, fontSize: 32, color: C.grey, letterSpacing: 6}}>CONCRETO · 04</div>
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

// S1 — hook: the house builds itself
const C1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t60 = wt(0, 'sessenta'), tSur = wt(0, 'surpreender');
  const X0 = -160, X1 = 160, Y0 = -130, Y1 = 130, H = 230, HR = 120, o = 22;
  const ground = pop(f, 2, fps, 16);
  const slab = interpolate(f, [8, 18], [0, 1], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const walls = interpolate(f, [16, 36], [0, 1], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const roofDrop = interpolate(f, [34, 48], [260, 0], {...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0)});
  const roofBounce = f > 48 ? Math.sin((f - 48) / 2.2) * 14 * Math.exp(-(f - 48) / 6) : 0;
  const h = H * walls;
  const fl = faceL(X0, Y1, 0), fr = faceR(X1, Y0, 0);
  const details = pop(f, 50, fps);
  const tagS = pop(f, tSur - 6, fps, 8);
  const swing = Math.sin((f - tSur) / 5) * 12 * Math.exp(-Math.max(0, f - tSur) / 25);
  const zoom = interpolate(f, [0, 50, 170], [0.75, 1.02, 1.1], clamp);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={10} src="thud.wav" vol={0.5} />
      <Sfx at={30} src="pop.wav" />
      <Sfx at={47} src="thud.wav" vol={0.6} />
      <Sfx at={t60 - 2} src="pop.wav" />
      <Sfx at={tSur - 4} src="cash.wav" vol={0.4} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(540,880) scale(${zoom * ground})`}>
          <Box x={-300} y={-280} z={-36} w={600} d={560} h={36} top={C.grass} left={C.grassD} right={C.grassDD} />
          {slab > 0 && <Box x={X0 - 14} y={Y0 - 14} z={0} w={348} d={288} h={14 * slab} top="#D5D0C8" left="#BDB6AB" right="#A79F93" />}
          {walls > 0 && <g transform="translate(0,-14)">
            <Box x={X0} y={Y0} z={0} w={320} d={260} h={h} top={C.wallT} left={C.wall} right={C.wallR} />
            {walls >= 1 && (
              <g transform={`translate(0,${-roofDrop + roofBounce})`}>
                <Poly p={[[X0 - o, Y0 - o, H], [X1 + o, Y0 - o, H], [X1 + o, 0, H + HR], [X0 - o, 0, H + HR]]} fill={C.roofD} />
                <Poly p={[[X1, Y0, H], [X1, Y1, H], [X1, 0, H + HR]]} fill={C.wallR} />
                <Poly p={[[X0 - o, Y1 + o, H], [X1 + o, Y1 + o, H], [X1 + o, 0, H + HR], [X0 - o, 0, H + HR]]} fill={C.roof} />
              </g>
            )}
            {f >= 50 && <g opacity={details}>
              <polygon points={rectOn(fl, 50, 0, 115, 140 * details)} fill="#8B5A3C" stroke={C.navy} strokeWidth={4} />
              <polygon points={rectOn(fl, 200, 95, 290, 175)} fill={C.glass} stroke={C.navy} strokeWidth={5} />
              <polygon points={rectOn(fr, 70, 95, 190, 175)} fill={C.glassD} stroke={C.navy} strokeWidth={5} />
            </g>}
          </g>}
          {/* dimension on the ground */}
          {f >= t60 - 4 && (() => {
            const s = pop(f, t60 - 4, fps);
            const a = iso([X0 - 14, Y1 + 50, 0]), b = iso([X1 + 14, Y1 + 50, 0]);
            return (
              <g opacity={s}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.navy} strokeWidth={4} />
                <line x1={a[0]} y1={a[1] - 14} x2={a[0]} y2={a[1] + 14} stroke={C.navy} strokeWidth={4} />
                <line x1={b[0]} y1={b[1] - 14} x2={b[0]} y2={b[1] + 14} stroke={C.navy} strokeWidth={4} />
              </g>
            );
          })()}
        </g>
      </svg>
      {f >= t60 - 4 && (
        <div style={{position: 'absolute', top: 1030, left: 140, scale: String(pop(f, t60 - 4, fps, 9)), rotate: '-6deg'}}>
          <div style={{background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 64, padding: '10px 30px', borderRadius: 20, letterSpacing: -2}}>60 m²</div>
        </div>
      )}
      {/* swinging price tag */}
      {f >= tSur - 6 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(880,560) rotate(${swing}) scale(${tagS})`}>
            <line x1={0} y1={-90} x2={0} y2={0} stroke={C.navy} strokeWidth={5} />
            <path d="M-90 0 L90 0 L90 150 L0 200 L-90 150 Z" fill={C.yellow} stroke={C.navy} strokeWidth={6} strokeLinejoin="round" />
            <circle cx={0} cy={28} r={12} fill={C.cream} stroke={C.navy} strokeWidth={5} />
            <text x={0} y={120} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={58} fill={C.white}>R$ ?</text>
          </g>
        </svg>
      )}
      <Coins f={f} at={tSur - 4} seed="c1" x={880} y={660} />
      <Chip text="QUANTO CUSTA?" bg={C.yellow} f={f} at={0} top={250} size={100} />
    </SceneIn>
  );
};

// S2 — R$/m² counter and the 60-tile floor
const C2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tM = wt(1, 'metro'), tD = wt(1, 'dois'), tV = wt(1, 'vezes'), tC = wt(1, 'cento');
  const v = countTo(f, tM, tD + 8, 1999.73);
  const tiles = Math.floor(interpolate(f, [tV, tC - 4], [0, 60], clamp));
  const total = countTo(f, tC - 4, tC + 14, 120000);
  const totS = pop(f, tC - 4, fps, 9);
  const tileSz = 48;
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={tD + 8} src="pop.wav" />
      {new Array(12).fill(0).map((_, i) => <Sfx key={i} at={tV + i * ((tC - 4 - tV) / 12)} src="tick.wav" vol={0.25} />)}
      <Sfx at={tC + 2} src="cash.wav" vol={0.45} />
      <Pill text="IBGE · SINAPI · SET/2026" f={f} at={2} top={200} size={34} />
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, color: C.navy, letterSpacing: -6}}>
        <span style={{fontSize: 80, color: C.grey, letterSpacing: -2}}>R$ </span>
        <span style={{fontSize: 170}}>{Math.floor(v).toLocaleString('pt-BR')}</span>
        <span style={{fontSize: 64, color: C.yellow, letterSpacing: -1}}> /m²</span>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform="translate(540,640) scale(1.05)">
          {new Array(60).fill(0).map((_, i) => {
            const cx = i % 6, cy = Math.floor(i / 6);
            const x = (cx - 3) * tileSz + 40, y = (cy - 5) * tileSz;
            const on = i < tiles;
            const age = on ? (f - (tV + (i / 60) * (tC - 4 - tV))) : 0;
            const lift = on ? interpolate(age, [0, 5], [30, 0], clamp) : 0;
            return <Poly key={i} p={[[x, y, lift], [x + tileSz - 4, y, lift], [x + tileSz - 4, y + tileSz - 4, lift], [x, y + tileSz - 4, lift]]} fill={on ? ((cx + cy) % 2 ? '#E9C9A8' : '#F3DDC4') : 'rgba(26,26,26,0.05)'} stroke={on ? 'rgba(26,26,26,0.5)' : 'rgba(26,26,26,0.15)'} sw={1.5} />;
          })}
        </g>
      </svg>
      {f >= tV - 2 && (
        <div style={{position: 'absolute', top: 820, right: 110, scale: String(pop(f, tV - 2, fps, 9)), rotate: '8deg', fontFamily: 'InterD', fontWeight: 900, fontSize: 80, color: C.white, background: C.yellow, padding: '6px 26px', borderRadius: 20}}>× 60</div>
      )}
      {f >= tC - 4 && (
        <div style={{position: 'absolute', top: 1010, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: C.navy, color: C.white, borderRadius: 30, padding: '14px 44px', scale: String(totS), fontFamily: 'InterD', fontWeight: 900, fontSize: 104, letterSpacing: -4, boxShadow: '0 20px 50px rgba(0,0,0,0.18)'}}>
            ≈ R$ {brl(total)}
          </div>
        </div>
      )}
      <Coins f={f} at={tC + 2} seed="c2" x={540} y={1060} n={18} />
    </SceneIn>
  );
};

// icons
const BrickIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    {[[8, 56], [52, 56], [30, 30]].map(([x, y], i) => <rect key={i} x={x} y={y} width={40} height={22} rx={3} fill={C.brick} stroke={C.navy} strokeWidth={4} />)}
    <path d="M60 14 L88 14 L92 46 L56 46 Z" fill="#D9D3C7" stroke={C.navy} strokeWidth={4} strokeLinejoin="round" />
    <text x={74} y={36} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={11} fill={C.navy}>CIM</text>
  </svg>
);
const WorkerIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={46} r={20} fill="#E8B48A" stroke={C.navy} strokeWidth={4} />
    <path d="M26 40 Q26 16 50 15 Q74 16 74 40 Z" fill={C.amber} stroke={C.navy} strokeWidth={4} strokeLinejoin="round" />
    <rect x={20} y={37} width={60} height={8} rx={4} fill={C.amber} stroke={C.navy} strokeWidth={4} />
    <path d="M22 96 Q22 70 50 68 Q78 70 78 96 Z" fill="#4D7CC2" stroke={C.navy} strokeWidth={4} />
  </svg>
);

// S3 — material x labour donut
const C3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tMat = wt(2, 'material'), tMao = wt(2, 'mao');
  const pm = interpolate(f, [tMat - 18, tMat + 6], [0, 0.564], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const pl = interpolate(f, [tMao - 14, tMao + 8], [0, 0.436], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const R = 210, CIRC = 2 * Math.PI * R;
  const ring = pop(f, 0, fps, 15);
  const card = (i: number, at: number, icon: React.ReactNode, label: string, val: number, pct: string, col: string) => {
    if (f < at) return null;
    const s = pop(f, at, fps, 11);
    return (
      <div style={{position: 'absolute', top: 870, left: i ? 560 : 80, width: 440, height: 300, background: C.white, borderRadius: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', borderTop: `14px solid ${col}`, translate: `0 ${(1 - s) * 200}px`, opacity: s, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 6}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>{icon}<div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 46, color: C.navy, letterSpacing: -1}}>{label}</div></div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 64, color: col, letterSpacing: -3}}>≈ R$ {brl(countTo(f, at, at + 18, val))}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 34, color: C.grey}}>{pct} do total</div>
      </div>
    );
  };
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={tMat - 8} src="pop.wav" />
      <Sfx at={tMao - 6} src="pop.wav" />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(540,560) scale(${ring}) rotate(-90)`}>
          <circle r={R} fill="none" stroke="rgba(26,26,26,0.07)" strokeWidth={90} />
          <circle r={R} fill="none" stroke={C.yellow} strokeWidth={90} strokeDasharray={`${pm * CIRC} ${CIRC}`} />
          <circle r={R} fill="none" stroke={C.navy} strokeWidth={90} strokeDasharray={`${pl * CIRC} ${CIRC}`} strokeDashoffset={-0.564 * CIRC} />
        </g>
        <text x={540} y={548} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={40} fill={C.grey}>TOTAL</text>
        <text x={540} y={612} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={58} fill={C.navy} letterSpacing={-2}>R$ 120 mil</text>
      </svg>
      {card(0, tMat - 8, <BrickIcon size={74} />, 'Material', 67630, '56%', C.yellow)}
      {card(1, tMao - 6, <WorkerIcon size={74} />, 'Mão de obra', 52354, '44%', C.navy)}
    </SceneIn>
  );
};

// S4 — finishing is the villain: room gets floor tiles, wall tiles and paint
const C4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tVil = wt(3, 'vilao'), tP = wt(3, 'piso'), tR = wt(3, 'revestimento'), tPi = wt(3, 'pintura'), tT = wt(3, 'terco');
  const W = 330, D = 330, Hh = 280;
  const room = pop(f, 0, fps, 15);
  const nF = Math.floor(interpolate(f, [tP - 6, tP + 14], [0, 36], clamp));
  const nW = Math.floor(interpolate(f, [tR - 6, tR + 18], [0, 30], clamp));
  const paint = interpolate(f, [tPi - 6, tPi + 22], [0, 1], {...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1)});
  const pieS = pop(f, tT - 6, fps, 9);
  const fb = faceR(0, 0, 0); // plane x=0 (left-back wall): u along y
  const rb = faceL(0, 0, 0); // plane y=0 (right-back wall): u along x
  const rollerP = rb(W * 0.55, Hh * paint);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      {[tP, tR, tPi].map((t, i) => <Sfx key={i} at={t - 6} src="pop.wav" />)}
      <Sfx at={tT - 4} src="cash.wav" vol={0.4} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(560,780) scale(${1.2 * room})`}>
          <Poly p={[[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]]} fill="#E7E1D7" />
          <Poly p={[[0, 0, 0], [0, D, 0], [0, D, Hh], [0, 0, Hh]]} fill="#F1ECE4" />
          <Poly p={[[0, 0, 0], [W, 0, 0], [W, 0, Hh], [0, 0, Hh]]} fill={C.white} />
          {/* floor tiles */}
          {new Array(nF).fill(0).map((_, i) => {
            const cx = i % 6, cy = Math.floor(i / 6), s = W / 6;
            return <Poly key={'f' + i} p={[[cx * s + 2, cy * s + 2, 0.5], [cx * s + s - 2, cy * s + 2, 0.5], [cx * s + s - 2, cy * s + s - 2, 0.5], [cx * s + 2, cy * s + s - 2, 0.5]]} fill={(cx + cy) % 2 ? '#C9B8A3' : '#DCCDBB'} sw={1} />;
          })}
          {/* wall tiles on left-back wall (x=0) */}
          {new Array(nW).fill(0).map((_, i) => {
            const cu = i % 6, cv = Math.floor(i / 6), s = D / 6, sv = 26;
            return <polygon key={'w' + i} points={rectOn(fb, cu * s + 2, cv * sv + 2, cu * s + s - 2, cv * sv + sv - 2)} fill={(cu + cv) % 2 ? '#9FC9D9' : '#B8D9E5'} stroke="rgba(26,26,26,0.4)" strokeWidth={1} />;
          })}
          {/* paint on right-back wall (y=0) */}
          {paint > 0 && <polygon points={rectOn(rb, 0, 0, W, Hh * paint)} fill="#F4A261" opacity={0.92} />}
          {paint > 0 && paint < 1 && (
            <g transform={`translate(${rollerP[0]},${rollerP[1]})`}>
              <rect x={-70} y={-18} width={140} height={36} rx={14} fill="#F4A261" stroke={C.navy} strokeWidth={5} />
              <path d="M0 18 L0 60 L-30 60 L-30 150" stroke={C.navy} strokeWidth={10} fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      </svg>
      {/* pie 1/3 */}
      {f >= tT - 6 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(890,400) scale(${pieS * 0.8})`}>
            <circle r={110} fill={C.white} stroke={C.navy} strokeWidth={8} />
            <path d={`M0 0 L0 -110 A110 110 0 0 1 ${110 * Math.sin((2 * Math.PI) / 3)} ${-110 * Math.cos((2 * Math.PI) / 3)} Z`} fill={C.red} stroke={C.navy} strokeWidth={6} />
            <text x={0} y={180} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={56} fill={C.navy}>até 1/3</text>
          </g>
        </svg>
      )}
      {[['PISO', tP, 0], ['REVESTIMENTO', tR, 1], ['PINTURA', tPi, 2]].map(([t, at, i]) => {
        const a = at as number;
        if (f < a - 6) return null;
        const s = pop(f, a - 6, fps, 11);
        return <div key={t as string} style={{position: 'absolute', top: 380 + (i as number) * 74, left: 60, scale: String(s), transformOrigin: 'left center', background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 800, fontSize: 38, padding: '10px 26px', borderRadius: 999, letterSpacing: 2}}>✓ {t as string}</div>;
      })}
      <Chip text="O VILÃO" bg={C.red} f={f} at={tVil - 4} top={250} size={100} />
    </SceneIn>
  );
};

// S5 — what is NOT included
const PinIcon: React.FC = () => (
  <svg width={150} height={150} viewBox="0 0 100 100">
    <path d="M10 78 L50 62 L90 78 L50 94 Z" fill={C.grass} stroke={C.navy} strokeWidth={4} strokeLinejoin="round" />
    <path d="M50 70 C30 46 30 22 50 18 C70 22 70 46 50 70 Z" fill={C.red} stroke={C.navy} strokeWidth={4} />
    <circle cx={50} cy={36} r={8} fill={C.white} />
  </svg>
);
const PlanIcon: React.FC = () => (
  <svg width={150} height={150} viewBox="0 0 100 100">
    <rect x={14} y={20} width={72} height={60} rx={4} fill="#2F6FB5" stroke={C.navy} strokeWidth={4} />
    <path d="M24 30 L58 30 L58 52 L76 52 L76 70 L24 70 Z" fill="none" stroke="white" strokeWidth={3} />
    <line x1={42} y1={30} x2={42} y2={70} stroke="white" strokeWidth={3} />
    <circle cx={86} cy={50} r={10} fill="#5B8FD0" stroke={C.navy} strokeWidth={4} />
  </svg>
);
const StampIcon: React.FC = () => (
  <svg width={150} height={150} viewBox="0 0 100 100">
    <rect x={20} y={14} width={56} height={72} rx={4} fill={C.white} stroke={C.navy} strokeWidth={4} />
    {[30, 40, 50].map((y) => <line key={y} x1={30} y1={y} x2={66} y2={y} stroke={C.light} strokeWidth={4} strokeLinecap="round" />)}
    <circle cx={64} cy={70} r={18} fill="none" stroke={C.red} strokeWidth={5} />
    <text x={64} y={75} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={14} fill={C.red}>R$</text>
  </svg>
);
const C5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tA = wt(4, 'atencao'), ts = [wt(4, 'terreno'), wt(4, 'projeto'), wt(4, 'taxas')], tDez = wt(4, 'dez');
  const items = [{t: 'Terreno', i: <PinIcon />}, {t: 'Projeto', i: <PlanIcon />}, {t: 'Taxas', i: <StampIcon />}];
  const badge = pop(f, tDez - 4, fps, 8);
  const lo = countTo(f, tDez - 2, tDez + 16, 132), hi = countTo(f, tDez - 2, tDez + 16, 144);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      {ts.map((t, i) => <Sfx key={i} at={t - 4} src="thud.wav" vol={0.55} />)}
      <Sfx at={tDez - 2} src="cash.wav" vol={0.45} />
      <div style={{position: 'absolute', top: 380, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 800, fontSize: 46, color: C.grey, opacity: interpolate(f, [tA, tA + 8], [0, 1], clamp)}}>
        <span style={{textDecoration: 'line-through', textDecorationColor: C.red, textDecorationThickness: 6}}>incluso nos R$ 120 mil</span>
      </div>
      {items.map((it, i) => {
        const at = ts[i] - 8;
        if (f < at) return null;
        const drop = interpolate(f, [at, at + 8], [-700, 0], {...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0)});
        const bounce = f > at + 8 ? Math.sin((f - at - 8) / 2) * 16 * Math.exp(-(f - at - 8) / 5) : 0;
        return (
          <div key={i} style={{position: 'absolute', top: 480 + drop - bounce, left: 70 + i * 320, width: 300, height: 360, background: C.white, borderRadius: 30, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', rotate: `${(i - 1) * 4}deg`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, borderBottom: `12px solid ${C.red}`}}>
            {it.i}
            <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 52, color: C.navy, letterSpacing: -1}}>{it.t}</div>
            <div style={{position: 'absolute', top: -20, right: -16, width: 64, height: 64, borderRadius: 32, background: C.red, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>+</div>
          </div>
        );
      })}
      {f >= tDez - 4 && (
        <div style={{position: 'absolute', top: 900, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          <div style={{background: C.red, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 92, padding: '6px 36px', borderRadius: 24, scale: String(badge), rotate: `${-4 * badge}deg`, letterSpacing: -3}}>+10 a 20%</div>
          <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 62, color: C.navy, letterSpacing: -2, opacity: badge}}>≈ R$ {Math.round(lo)} a {Math.round(hi)} mil</div>
        </div>
      )}
      <Chip text="ATENÇÃO" bg={C.amber} f={f} at={tA - 4} top={250} size={96} icon={<Warn size={70} />} />
    </SceneIn>
  );
};

// S6 — follow + save
const C6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tSeg = wt(6, 'segue'), tSal = wt(6, 'salva');
  const card = pop(f, 0, fps, 13);
  const press = tSeg + 10;
  const followed = f >= press;
  const handX = interpolate(f, [0, press - 2], [420, 0], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const handS = f >= press - 2 && f < press + 5 ? 0.85 : 1;
  const bm = pop(f, tSal - 4, fps, 8);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={press} src="pop.wav" vol={0.5} />
      <Sfx at={tSal - 4} src="pop.wav" vol={0.5} />
      <div style={{position: 'absolute', top: 330, left: 90, right: 90, height: 420, background: C.white, borderRadius: 40, boxShadow: '0 24px 60px rgba(0,0,0,0.12)', scale: String(card), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24}}>
        <div style={{width: 150, height: 150, borderRadius: 75, background: C.cream, border: `6px solid ${C.navy}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><HardHat size={110} /></div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 56, color: C.navy}}>{HANDLE}</div>
        <div style={{position: 'relative'}}>
          <div style={{background: followed ? C.cream : C.yellow, color: followed ? C.navy : C.white, border: followed ? `4px solid ${C.navy}` : '4px solid transparent', fontFamily: 'InterD', fontWeight: 900, fontSize: 46, padding: '14px 70px', borderRadius: 999, scale: String(followed ? pop(f, press, fps, 9) * 0.1 + 0.9 : 1)}}>{followed ? 'Seguindo ✓' : 'Seguir'}</div>
          <svg width={110} height={110} viewBox="0 0 100 100" style={{position: 'absolute', left: 170 + handX, top: 40, scale: String(handS)}}>
            <path d="M38 10 Q46 6 50 14 L52 46 L70 44 Q82 46 82 60 L78 84 Q74 96 60 96 L44 96 Q34 94 30 84 L20 60 Q18 52 26 52 L34 56 L32 16 Q32 10 38 10 Z" fill="white" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {f >= tSal - 4 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(540,930) scale(${bm}) rotate(${-8 * bm})`}>
            <path d="M-80 -110 L80 -110 L80 110 L0 55 L-80 110 Z" fill={C.yellow} stroke={C.navy} strokeWidth={10} strokeLinejoin="round" />
          </g>
        </svg>
      )}
      <Coins f={f} at={tSal - 2} seed="c6" x={540} y={930} n={10} spread={900} />
    </SceneIn>
  );
};

// ================= CURA DO CONCRETO =================
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
const BLUE = '#3B8FD9';
const Slab: React.FC<{wet?: number; f?: number}> = ({wet = 0}) => {
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  return (
    <g>
      <Box x={-300} y={-220} z={-50} w={600} d={440} h={50} top={mix('#C9C4BB', '#8F8B84', wet)} left="#A9A39A" right="#958F86" />
      {new Array(40).fill(0).map((_, i) => { const q = iso([-280 + random('sx' + i) * 560, -200 + random('sy' + i) * 400, 0.5]); return <circle key={i} cx={q[0]} cy={q[1]} r={2 + random('sr' + i) * 3} fill="rgba(0,0,0,0.12)" />; })}
    </g>
  );
};
const Hose: React.FC<{f: number; on: boolean; x0?: number; y0?: number}> = ({f, on, x0 = -430, y0 = -330}) => (
  <g>
    <path d={`M${x0 - 200} ${y0 + 260} Q${x0 - 60} ${y0 + 160} ${x0} ${y0}`} stroke="#2F9E44" strokeWidth={18} fill="none" strokeLinecap="round" />
    <rect x={x0 - 14} y={y0 - 24} width={40} height={30} rx={8} fill="#F2B632" stroke={C.navy} strokeWidth={4} transform={`rotate(-30 ${x0} ${y0})`} />
    {on && new Array(22).fill(0).map((_, i) => {
      const ph = ((f * 1.6 + i * 9) % 40) / 40;
      const x = x0 + 30 + ph * 420 + (random('hx' + i) - 0.5) * 30, y = y0 - 20 - 260 * ph + 520 * ph * ph + (random('hy' + i) - 0.5) * 20;
      return <ellipse key={i} cx={x} cy={y} rx={7} ry={10} fill={BLUE} opacity={0.85} />;
    })}
  </g>
);
const Stage: React.FC<{children: React.ReactNode; x?: number; y?: number; s?: number}> = ({children, x = 540, y = 820, s = 1}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${x},${y}) scale(${s})`}>{children}</g></svg>
);
const Title: React.FC<{text: React.ReactNode; f: number; at?: number; top?: number; size?: number}> = ({text, f, at = 0, top = 230, size = 104}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 200}});
  return <div style={{position: 'absolute', top, left: 80, right: 70, fontFamily: 'InterD', fontWeight: 900, fontSize: size, color: C.navy, letterSpacing: -5, lineHeight: 1, opacity: s, translate: `0 ${(1 - s) * 30}px`}}>{text}</div>;
};
const Hi: React.FC<{c?: string; children: React.ReactNode}> = ({c, children}) => <span style={{color: c ?? C.yellow}}>{children}</span>;
const cut = (f: number, at: number) => f >= at;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
const CutFlash: React.FC<{cuts: number[]}> = ({cuts}) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...cuts.map((c) => interpolate(f, [c - 2, c, c + 5], [0, 0.6, 0], clamp)));
  return <AbsoluteFill style={{background: C.cream, opacity: o, pointerEvents: 'none'}} />;
};

const K0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = wt(0, 'parece') - 3;
  const zoom = cut(f, B) ? interpolate(f, [B, B + 40], [1.35, 1.5], clamp) : interpolate(f, [0, B], [0.9, 1.05], clamp);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={wt(0, 'molha') - 4} src="rain.wav" vol={0.25} />
      <Sfx at={B} src="whoosh.wav" vol={0.4} />
      {[0, 6, 12].map((d) => <Sfx key={d} at={B + 4 + d} src="pop.wav" vol={0.4} />)}
      <Stage y={cut(f, B) ? 900 : 860} s={zoom} x={cut(f, B) ? 600 : 560}>
        <Slab wet={ease(f, wt(0, 'molha'), B)} />
        <Hose f={f} on={f > wt(0, 'molha') - 4} />
      </Stage>
      {!cut(f, B) && <Title text={<>Por que molhar o<br />concreto <Hi>pronto?</Hi></>} f={f} />}
      {cut(f, B) && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          {[[190, 640, -14, 1.0], [880, 560, 12, 1.3], [900, 1000, 8, 0.85]].map(([x, y, r, s], i) => {
            const p = pop(f, B + 4 + i * 6, fps, 8);
            return <text key={i} x={x} y={y} fontFamily="InterD" fontWeight={900} fontSize={200 * s} fill={i === 1 ? C.yellow : C.navy} textAnchor="middle" transform={`rotate(${r * p} ${x} ${y}) scale(${p})`} style={{transformOrigin: `${x}px ${y}px`}}>?</text>;
          })}
        </svg>
      )}
      <Pill text="PARECE LOUCURA" f={f} at={B + 6} top={1080} bg={C.red} />
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
};

const GRAINS: [number, number, number][] = new Array(9).fill(0).map((_, i) => [(i % 3 - 1) * 170 + (random('gx' + i) - 0.5) * 50, (Math.floor(i / 3) - 1) * 150 + (random('gy' + i) - 0.5) * 40, 46 + random('gr' + i) * 18]);
const K1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = wt(1, 'ele') - 3;
  const tRe = wt(1, 'reacao'), tCi = wt(1, 'cimento'), tAg = wt(1, 'agua');
  const grow = ease(f, tRe, tAg + 14);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={wt(1, 'nao') + 6} src="thud.wav" vol={0.5} />
      <Sfx at={B} src="whoosh.wav" vol={0.4} />
      <Sfx at={tRe} src="pop.wav" vol={0.4} />
      {!cut(f, B) && (
        <>
          <Title text={<>O concreto<br /><Hi c={C.red}>não seca!</Hi></>} f={f} />
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <g transform={`translate(540,830) scale(${pop(f, 2, fps, 12)})`}>
              <circle r={120} fill="#FFC94D" />
              {new Array(12).fill(0).map((_, i) => { const a = (i / 12) * Math.PI * 2 + f / 30; return <line key={i} x1={Math.cos(a) * 150} y1={Math.sin(a) * 150} x2={Math.cos(a) * 200} y2={Math.sin(a) * 200} stroke="#FFC94D" strokeWidth={16} strokeLinecap="round" />; })}
              <XMark f={f} at={wt(1, 'nao')} cx={0} cy={0} r={170} w={30} />
            </g>
          </svg>
        </>
      )}
      {cut(f, B) && (
        <>
          <Title text={<>Reação <Hi>química</Hi></>} f={f} at={B} />
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <g transform={`translate(540,800) scale(${pop(f, B, fps, 14)})`}>
              <circle r={400} fill={C.white} stroke={C.navy} strokeWidth={10} />
              <clipPath id="lensK"><circle r={395} /></clipPath>
              <g clipPath="url(#lensK)">
                {GRAINS.map(([x, y, r], i) => GRAINS.slice(i + 1).map(([x2, y2], j) => {
                  if (Math.hypot(x2 - x, y2 - y) > 260) return null;
                  const p = ease(f, tRe + (i + j) * 2, tRe + (i + j) * 2 + 30);
                  return <line key={i + '-' + j} x1={x} y1={y} x2={x + (x2 - x) * p} y2={y + (y2 - y) * p} stroke="#9C8F7E" strokeWidth={6} strokeLinecap="round" />;
                }))}
                {GRAINS.map(([x, y, r], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r={r} fill="#8E8A84" stroke={C.navy} strokeWidth={4} />
                    {grow > 0 && new Array(8).fill(0).map((_, k) => { const a = (k / 8) * Math.PI * 2 + i; return <line key={k} x1={x + Math.cos(a) * r} y1={y + Math.sin(a) * r} x2={x + Math.cos(a) * (r + 34 * grow)} y2={y + Math.sin(a) * (r + 34 * grow)} stroke="#C9BBA6" strokeWidth={5} strokeLinecap="round" />; })}
                  </g>
                ))}
                {new Array(14).fill(0).map((_, i) => {
                  const sx = (random('wx' + i) - 0.5) * 700, sy = -420 - random('wy' + i) * 100;
                  const g = GRAINS[i % GRAINS.length];
                  const p = ease(f, B + 4 + i * 2, B + 30 + i * 2);
                  const x = sx + (g[0] + 30 - sx) * p, y = sy + (g[1] - g[2] - 10 - sy) * p;
                  return <path key={i} transform={`translate(${x},${y})`} d="M0 -18 C9 -4 13 2 13 9 A13 13 0 0 1 -13 9 C-13 2 -9 -4 0 -18 Z" fill={BLUE} opacity={interpolate(f, [tAg, tAg + 20], [1, 0.25], clamp)} />;
                })}
              </g>
            </g>
          </svg>
          <Pill text="CIMENTO" f={f} at={tCi - 4} top={1130} bg={C.navy} />
          <div style={{position: 'absolute', top: 1130, left: 0, right: 0}}><Pill text="+ ÁGUA" f={f} at={tAg - 4} top={-90} bg={BLUE} /></div>
        </>
      )}
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
};

const K2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = wt(2, 'essa') - 3;
  const tPa = wt(2, 'para');
  const fill = Math.min(0.45, interpolate(f, [B, tPa], [0.05, 0.45], clamp));
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={wt(2, 'vento') - 4} src="whoosh.wav" vol={0.35} />
      <Sfx at={B} src="whoosh.wav" vol={0.4} />
      <Sfx at={tPa} src="thud.wav" vol={0.7} />
      {!cut(f, B) && (
        <>
          <Title text={<>Sol e vento:<br /><Hi c={C.red}>a água foge</Hi></>} f={f} />
          <Stage y={960} s={0.95}>
            <Slab wet={interpolate(f, [0, B], [0.8, 0.1], clamp)} />
            {new Array(16).fill(0).map((_, i) => {
              const ph = ((f + i * 6) % 50) / 50;
              const q = iso([-260 + random('ex' + i) * 520, -190 + random('ey' + i) * 380, 0]);
              return <path key={i} transform={`translate(${q[0]},${q[1] - ph * 260}) scale(${1 - ph * 0.5})`} d="M0 -14 C7 -3 10 2 10 7 A10 10 0 0 1 -10 7 C-10 2 -7 -3 0 -14 Z" fill={BLUE} opacity={1 - ph} />;
            })}
          </Stage>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <g transform={`translate(850,520) scale(${pop(f, wt(2, 'sol') - 4, fps, 10)})`}>
              <circle r={90} fill="#FFC94D" />
              {new Array(10).fill(0).map((_, i) => { const a = (i / 10) * Math.PI * 2 + f / 25; return <line key={i} x1={Math.cos(a) * 110} y1={Math.sin(a) * 110} x2={Math.cos(a) * 150} y2={Math.sin(a) * 150} stroke="#FFC94D" strokeWidth={13} strokeLinecap="round" />; })}
            </g>
            {f > wt(2, 'vento') - 6 && new Array(6).fill(0).map((_, i) => {
              const x = ((f * 26 + i * 260) % 1500) - 300, y = 600 + i * 70;
              return <path key={i} d={`M${x} ${y} q 60 -20 120 0 t 120 0`} stroke={C.grey} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />;
            })}
          </svg>
        </>
      )}
      {cut(f, B) && (
        <>
          <Title text={<>A reação<br /><Hi c={C.red}>para no meio</Hi></>} f={f} at={B} />
          <div style={{position: 'absolute', top: 640, left: 90, right: 90}}>
            <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 34, color: C.grey, letterSpacing: 4, marginBottom: 16}}>ENDURECIMENTO</div>
            <div style={{height: 90, borderRadius: 45, background: 'rgba(26,26,26,0.08)', overflow: 'hidden'}}>
              <div style={{width: `${fill * 100}%`, height: '100%', background: f >= tPa ? C.red : C.green, borderRadius: 45}} />
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'InterD', fontWeight: 800, fontSize: 30, color: C.grey, marginTop: 12}}><span>início</span><span>concreto forte</span></div>
          </div>
          {f >= tPa && (
            <div style={{position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              <div style={{width: 200, height: 200, borderRadius: 100, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, scale: String(pop(f, tPa, fps, 8))}}>
                <div style={{width: 34, height: 100, background: 'white', borderRadius: 8}} /><div style={{width: 34, height: 100, background: 'white', borderRadius: 8}} />
              </div>
            </div>
          )}
        </>
      )}
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
};

const MAPC: [number, number][][] = new Array(20).fill(0).map((_, i) => {
  let x = -240 + random('mx' + i) * 480, y = -170 + random('my' + i) * 340, a = random('ma' + i) * Math.PI * 2;
  const out: P3[] = [[x, y, 0.6]];
  for (let k = 0; k < 5; k++) { a += (random(`mk${i}-${k}`) - 0.5) * 1.6; x = Math.max(-290, Math.min(290, x + Math.cos(a) * 50)); y = Math.max(-210, Math.min(210, y + Math.sin(a) * 45)); out.push([x, y, 0.6]); }
  return out.map(iso);
});
const K3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = wt(3, 'e', 0) - 3;
  const tFr = wt(3, 'fraco'), tFi = wt(3, 'fissuras');
  const res = interpolate(f, [wt(3, 'mais') - 4, tFr + 10], [1, 0.55], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const cp = ease(f, B + 6, tFi + 10);
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={tFr - 4} src="thud.wav" vol={0.6} />
      <Sfx at={B} src="whoosh.wav" vol={0.4} />
      <Sfx at={tFi - 4} src="thud.wav" vol={0.7} />
      {!cut(f, B) && (
        <>
          <Title text={<>Concreto<br /><Hi c={C.red}>mais fraco</Hi></>} f={f} />
          <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 80, alignItems: 'flex-end', height: 560}}>
            {[['BEM CURADO', 1, C.green], ['SEM CURA', res, C.red]].map(([l, v, c]) => (
              <div key={l as string} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
                <div style={{width: 200, height: 480 * (v as number) * pop(f, 4, fps, 14), background: c as string, borderRadius: 20, border: `5px solid ${C.navy}`}} />
                <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 36, color: C.navy}}>{l as string}</div>
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 800, fontSize: 34, color: C.grey, letterSpacing: 4}}>RESISTÊNCIA</div>
        </>
      )}
      {cut(f, B) && (
        <>
          <Title text={<>Cheio de<br /><Hi c={C.red}>fissuras</Hi></>} f={f} at={B} />
          <Stage y={880} s={interpolate(f, [B, B + 60], [1.15, 1.35], clamp)}>
            <Slab wet={0} />
            {MAPC.map((ps, i) => <Crack key={i} ps={ps} p={interpolate(cp, [i / 40, Math.min(1, i / 40 + 0.5)], [0, 1], clamp)} w={4} color="#3A342E" />)}
          </Stage>
        </>
      )}
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
};

const K4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = wt(4, 'manter') - 3;
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={wt(4, 'cura') - 4} src="cash.wav" vol={0.35} />
      <Sfx at={B} src="whoosh.wav" vol={0.4} />
      <Sfx at={B} src="rain.wav" vol={0.25} />
      {!cut(f, B) && (
        <>
          <Title text={<>Por isso existe<br />a <Hi c={C.green}>cura</Hi></>} f={f} />
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <g transform={`translate(540,820) scale(${pop(f, wt(4, 'cura') - 6, fps, 8)})`}>
              <circle r={230} fill={C.green} />
              <path d="M-100 0 L-30 70 L110 -80" stroke="white" strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </>
      )}
      {cut(f, B) && (
        <>
          <Title text={<>Concreto<br /><Hi c={BLUE}>sempre úmido</Hi></>} f={f} at={B} />
          <Stage y={900} s={1.05}>
            <Slab wet={ease(f, B, B + 30)} />
            <Hose f={f} on />
            {new Array(18).fill(0).map((_, i) => { const q = iso([-260 + random('dx' + i) * 520, -190 + random('dy' + i) * 380, 0.6]); const p = pop(f, B + 6 + i, fps, 12); return <ellipse key={i} cx={q[0]} cy={q[1]} rx={22 * p} ry={9 * p} fill={BLUE} opacity={0.55} />; })}
          </Stage>
        </>
      )}
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
};

const ToolIcon: React.FC<{k: number}> = ({k}) => (
  <svg width={150} height={150} viewBox="0 0 100 100">
    {k === 0 && <><path d="M10 80 Q30 50 46 34" stroke="#2F9E44" strokeWidth={10} fill="none" strokeLinecap="round" /><rect x={40} y={22} width={22} height={16} rx={4} fill="#F2B632" stroke={C.navy} strokeWidth={4} transform="rotate(-30 50 30)" />{[0, 1, 2].map((i) => <ellipse key={i} cx={66 + i * 9} cy={44 + i * 12} rx={4} ry={6} fill={BLUE} />)}</>}
    {k === 1 && <><path d="M10 40 Q30 28 50 40 T90 40 L90 80 Q70 68 50 80 T10 80 Z" fill="#2C6BB5" stroke={C.navy} strokeWidth={4} />{[20, 50, 80].map((x) => <circle key={x} cx={x} cy={46} r={3} fill="white" />)}</>}
    {k === 2 && <><rect x={12} y={34} width={76} height={44} rx={8} fill="#C9A87C" stroke={C.navy} strokeWidth={4} />{[22, 36, 50, 64, 78].map((x) => <line key={x} x1={x} y1={38} x2={x} y2={74} stroke="#A98A60" strokeWidth={3} />)}{[0, 1].map((i) => <ellipse key={i} cx={34 + i * 34} cy={26} rx={5} ry={8} fill={BLUE} />)}</>}
  </svg>
);
const K5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = wt(5, 'com') - 3;
  const tSe = wt(5, 'sete');
  const days = Math.floor(interpolate(f, [wt(5, 'pelo') - 2, tSe + 8], [0, 7], clamp));
  const ts = [wt(5, 'agua'), wt(5, 'lona'), wt(5, 'manta')];
  return (
    <SceneIn>
      <Sky a="" b="" /><Handle />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      {new Array(7).fill(0).map((_, i) => <Sfx key={i} at={wt(5, 'pelo') - 2 + i * ((tSe + 10 - wt(5, 'pelo')) / 7)} src="tick.wav" vol={0.35} />)}
      <Sfx at={B} src="whoosh.wav" vol={0.4} />
      {ts.map((t, i) => <Sfx key={'t' + i} at={t - 4} src="pop.wav" vol={0.45} />)}
      {!cut(f, B) && (
        <>
          <Title text={<>Pelo menos<br /><Hi>7 dias</Hi></>} f={f} />
          <div style={{position: 'absolute', top: 560, left: 90, right: 90, background: C.white, borderRadius: 34, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', overflow: 'hidden', scale: String(pop(f, 2, fps, 13))}}>
            <div style={{background: C.yellow, color: 'white', fontFamily: 'InterD', fontWeight: 900, fontSize: 44, padding: '16px 0', textAlign: 'center', letterSpacing: 4}}>CURA ÚMIDA</div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, padding: 30}}>
              {new Array(8).fill(0).map((_, i) => {
                if (i === 7) return <div key={i} />;
                const on = i < days;
                return (
                  <div key={i} style={{height: 140, borderRadius: 22, background: on ? C.green : C.cream, border: `4px solid ${on ? C.green : 'rgba(26,26,26,0.1)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: on ? 'white' : C.grey, fontFamily: 'InterD', fontWeight: 900}}>
                    <div style={{fontSize: 30}}>DIA</div><div style={{fontSize: 60, lineHeight: 1}}>{on ? '✓' : i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {cut(f, B) && (
        <>
          <Title text={<>Como <Hi c={BLUE}>molhar</Hi></>} f={f} at={B} />
          {['Água', 'Lona', 'Manta molhada'].map((t, i) => {
            if (f < ts[i] - 6) return null;
            const s = pop(f, ts[i] - 6, fps, 10);
            return (
              <div key={t} style={{position: 'absolute', top: 400 + i * 250, left: 90, right: 90, height: 220, background: C.white, borderRadius: 30, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', borderLeft: `14px solid ${BLUE}`, display: 'flex', alignItems: 'center', gap: 30, paddingLeft: 30, translate: `${(i % 2 ? 1 : -1) * (1 - s) * 900}px 0`}}>
                <ToolIcon k={i} />
                <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 64, color: C.navy, letterSpacing: -2}}>{t}</div>
              </div>
            );
          })}
        </>
      )}
      <CutFlash cuts={[B]} />
    </SceneIn>
  );
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

const K6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tSe = wt(6, 'segue'), tAte = wt(6, 'ate');
  const B = tSe - 4;
  const press = tSe + 14;
  const followed = f >= press;
  const total = Math.round(DURS[6] * fps);
  const g0 = Math.round(STARTS[6] * FPS);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Sfx at={0} src="whoosh.wav" vol={0.45} />
      <Sfx at={wt(6, 'decadas') - 4} src="cash.wav" vol={0.35} />
      <Sfx at={B} src="whoosh.wav" vol={0.45} />
      <Sfx at={press} src="pop.wav" vol={0.5} />
      {!cut(f, B) && (
        <>
          <Handle />
          <Title text={<>Dura <Hi c={C.green}>décadas</Hi></>} f={f} />
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <ellipse cx={560} cy={1160} rx={360} ry={46} fill="#000" opacity={0.07} />
            <g transform={`translate(560,900) scale(${pop(f, 2, fps, 13) * 0.95})`}><House crackP={0} crackW={1} f={f} dustStart={999} /></g>
            <g transform={`translate(860,520) scale(${pop(f, wt(6, 'decadas') - 4, fps, 8)})`}>
              <circle r={90} fill={C.green} />
              <path d="M-40 0 L-12 30 L44 -32" stroke="white" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
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

const CapaCura: React.FC = () => (
  <AbsoluteFill style={{background: C.cream}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(19).fill(0).map((_, i) => <line key={'v' + i} x1={i * 60} y1={0} x2={i * 60} y2={1920} stroke="#1A1A1A" opacity={0.035} />)}
      {new Array(33).fill(0).map((_, i) => <line key={'h' + i} x1={0} y1={i * 60} x2={1080} y2={i * 60} stroke="#1A1A1A" opacity={0.035} />)}
      <ellipse cx={560} cy={1420} rx={380} ry={48} fill="#000" opacity={0.07} />
      <g transform="translate(600,1180) scale(0.95)"><Slab wet={0.55} /><Hose f={12} on /></g>
      <g transform="translate(880,860) rotate(10)"><circle r={95} fill={C.yellow} /><text y={36} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={110} fill="white">?</text></g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: C.navy, color: C.white, fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>CONCRETO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: C.yellow, letterSpacing: 2}}>#04</div>
    </div>
    <div style={{position: 'absolute', top: 380, left: 80, right: 70, fontFamily: 'InterD', fontWeight: 900, fontSize: 124, color: C.navy, letterSpacing: -6, lineHeight: 0.98}}>
      Por que molham<br />o concreto<br /><span style={{color: C.yellow}}>pronto?</span>
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

const SCENES = [K0, K1, K2, K3, K4, K5, K6];

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
      <Audio src={staticFile('voice_construcao-04-cura-concreto.wav')} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="CuraConcreto" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaCura" component={CapaCura} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

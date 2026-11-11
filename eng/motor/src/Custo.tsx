import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_custo.json';

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
    <div style={{position: 'absolute', top: 110, left: 80, fontFamily: 'InterD', fontWeight: 600, fontSize: 32, color: C.grey, letterSpacing: 6}}>CUSTOS DE OBRA · 01</div>
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
  const tSeg = wt(5, 'segue'), tSal = wt(5, 'salva');
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

const SCENES = [C1, C2, C3, C4, C5, C6];


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
      <Progress />
      <Audio src={staticFile('voice_custo.wav')} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition id="CustoCasa" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);

import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing.json';

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
    <div style={{position: 'absolute', top: 110, left: 80, fontFamily: 'InterD', fontWeight: 600, fontSize: 32, color: C.grey, letterSpacing: 6}}>PATOLOGIAS · 01</div>
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

// ---------- scenes ----------
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tPer = wt(0, 'perigosa');
  const cStart = 6, cEnd = tPer;
  const crackP = interpolate(f, [cStart, cEnd], [0, 1], {...clamp, easing: Easing.bezier(0.5, 0, 0.3, 1)});
  const zoom = interpolate(f, [0, 22, tPer + 10, tPer + 40], [0.85, 1.2, 1.2, 1.5], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const shake = f > cStart && f < cEnd + 8 ? (random('k' + f) - 0.5) * 12 : 0;
  const shakeY = f > cStart && f < cEnd + 8 ? (random('ky' + f) - 0.5) * 10 : 0;
  const focusT = interpolate(f, [tPer + 10, tPer + 40], [0, 1], clamp);
  const cx = -120 * focusT, cy = -60 * focusT + 40 * (1 - focusT);
  return (
    <SceneIn>
      <Sky a="#7FD1FF" b="#E8F7FF" />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(${540 + shake},${930 + shakeY}) scale(${zoom}) translate(${-cx},${-cy})`}>
          <House crackP={crackP} crackW={4 + 10 * crackP} f={f} dustStart={cStart} />
        </g>
      </svg>
      <Chip text="É PERIGOSA?" bg={C.red} f={f} at={tPer - 2} top={250} rot={-5} size={100} />
      <Handle />
    </SceneIn>
  );
};

const WallPanel: React.FC<{w: number; h: number; brick?: boolean; children?: React.ReactNode}> = ({w, h, brick, children}) => {
  const fl = faceL(0, 0, 0);
  const D = 26;
  return (
    <g>
      <Poly p={[[w, 0, 0], [w, -D, 0], [w, -D, h], [w, 0, h]]} fill={brick ? C.brickD : C.wallR} />
      <Poly p={[[0, -D, h], [w, -D, h], [w, 0, h], [0, 0, h]]} fill={brick ? '#D8B9A2' : C.wallT} />
      <polygon points={rectOn(fl, 0, 0, w, h)} fill={brick ? C.mortar : C.wall} stroke="rgba(26,26,26,0.6)" strokeWidth={2} />
      {brick && new Array(Math.ceil(h / 30)).fill(0).map((_, r) =>
        new Array(Math.ceil(w / 60) + 1).fill(0).map((__, c) => {
          const u0 = c * 60 - (r % 2 ? 30 : 0) + 3, u1 = u0 + 54, v0 = r * 30 + 3, v1 = v0 + 24;
          if (u1 <= 0 || u0 >= w || v0 >= h) return null;
          return <polygon key={r + '-' + c} points={rectOn(fl, Math.max(0, u0), v0, Math.min(w, u1), Math.min(h, v1))} fill={(r + c) % 3 ? C.brick : '#BE977C'} />;
        }))}
      {children}
    </g>
  );
};

const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ts = [wt(1, 'fissura'), wt(1, 'trinca'), wt(1, 'rachadura')];
  const rows = [
    {name: 'FISSURA', mm: 'até 0,5 mm', w: 3, col: C.green},
    {name: 'TRINCA', mm: '0,5 a 1,5 mm', w: 9, col: C.amber},
    {name: 'RACHADURA', mm: 'acima de 1,5 mm', w: 20, col: C.red},
  ];
  const rulerS = pop(f, 2, fps, 14);
  return (
    <SceneIn>
      <Sky a="#FFE08A" b="#FFF7DE" />
      <Handle />
      {/* ruler */}
      <div style={{position: 'absolute', top: 205, left: 90, right: 90, height: 96, background: C.white, border: `3px solid ${C.navy}`, borderRadius: 12, scale: `${rulerS} 1`, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.08)'}}>
        {new Array(45).fill(0).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: 12 + i * 20, top: 0, width: 5, height: i % 5 === 0 ? 48 : 26, background: C.navy}} />
        ))}
        <div style={{position: 'absolute', right: 22, bottom: 6, fontFamily: 'InterD', fontWeight: 900, fontSize: 34, color: C.navy}}>mm</div>
      </div>
      {rows.map((r, i) => {
        const s = pop(f, ts[i] - 6, fps);
        if (f < ts[i] - 6) return null;
        const p = interpolate(f, [ts[i] - 2, ts[i] + 14], [0, 1], clamp);
        const fl = faceL(0, 0, 0);
        const crack: [number, number][] = [[95, 150], [80, 118], [104, 88], [84, 58], [100, 30], [88, 0]].map(([u, v]) => fl(u, v));
        return (
          <div key={i} style={{position: 'absolute', top: 360 + i * 285, left: 70, right: 70, height: 250, background: C.white, borderRadius: 34, borderLeft: `14px solid ${r.col}`, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', translate: `${(1 - s) * 900}px 0`, display: 'flex', alignItems: 'center'}}>
            <svg width={300} height={250} style={{flexShrink: 0}}>
              <g transform="translate(70,165) scale(1.05)">
                <WallPanel w={190} h={150} brick={i === 2}>
                  <Crack ps={crack} p={p} w={r.w} />
                </WallPanel>
              </g>
            </svg>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 74, color: C.navy, letterSpacing: -3}}>{r.name.charAt(0) + r.name.slice(1).toLowerCase()}</div>
              <div style={{alignSelf: 'flex-start', background: r.col, color: C.white, fontFamily: 'InterD', fontWeight: 900, fontSize: 42, padding: '6px 18px', borderRadius: 14}}>{r.mm}</div>
            </div>
          </div>
        );
      })}
    </SceneIn>
  );
};

const MAP: [number, number][][] = new Array(18).fill(0).map((_, i) => {
  let x = 40 + random('mx' + i) * 420, y = 30 + random('my' + i) * 300, a = random('ma' + i) * Math.PI * 2;
  const out: [number, number][] = [[x, y]];
  for (let k = 0; k < 4; k++) {
    a += (random(`m${i}-${k}`) - 0.5) * 1.8;
    x = Math.min(490, Math.max(10, x + Math.cos(a) * (30 + random(`l${i}-${k}`) * 40)));
    y = Math.min(350, Math.max(10, y + Math.sin(a) * (30 + random(`n${i}-${k}`) * 40)));
    out.push([x, y]);
  }
  return out;
});

const Check: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="white" /><path d="M28 52 L44 68 L74 36" stroke={C.green} strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Warn: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100"><path d="M50 8 L94 88 L6 88 Z" fill="white" stroke={C.navy} strokeWidth="6" strokeLinejoin="round" /><rect x="44" y="34" width="12" height="30" rx="5" fill={C.navy} /><circle cx="50" cy="75" r="7" fill={C.navy} /></svg>
);

const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tTeia = wt(2, 'teia'), tRet = wt(2, 'retracao'), tTr = wt(2, 'tranquilo');
  const fl = faceL(0, 0, 0);
  const mapPts = MAP.map((l) => l.map(([u, v]) => fl(u, v)));
  const lensT = interpolate(f, [tTeia, tTeia + 50], [0, 1], {...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1)});
  const a = fl(130, 250), b = fl(370, 110);
  const lx = interpolate(lensT, [0, 1], [a[0], b[0]]), ly = interpolate(lensT, [0, 1], [a[1], b[1]]);
  const lensS = pop(f, tTeia - 4, fps);
  const wallS = pop(f, 0, fps, 15);
  const cracks = (w: number, col: string, full: boolean) => mapPts.map((ps, i) => <Crack key={i} ps={ps} p={full ? 1 : interpolate(f, [8 + i * 3, 30 + i * 3], [0, 1], clamp)} w={w} color={col} />);
  return (
    <SceneIn>
      <Sky a="#9BE7B4" b="#EAFBF0" />
      <Handle />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs><clipPath id="lens"><circle cx={lx} cy={ly} r={110} /></clipPath></defs>
        <g transform={`translate(540,900) scale(${1.4 * wallS}) translate(-216,55)`}>
          <WallPanel w={500} h={360}>{null}</WallPanel>
          {cracks(2.5, '#8C7A68', false)}
          {f >= tTeia - 4 && (
            <g opacity={lensS}>
              <g clipPath="url(#lens)">
                <circle cx={lx} cy={ly} r={110} fill={C.wall} />
                <g transform={`translate(${lx},${ly}) scale(2.4) translate(${-lx},${-ly})`}>{cracks(2.2, '#5E4B3A', true)}</g>
              </g>
              <circle cx={lx} cy={ly} r={110} fill="none" stroke={C.navy} strokeWidth={14} />
              <line x1={lx + 78} y1={ly + 78} x2={lx + 160} y2={ly + 160} stroke={C.navy} strokeWidth={28} strokeLinecap="round" />
            </g>
          )}
        </g>
      </svg>
      <Chip text="RETRAÇÃO DA ARGAMASSA" bg={C.navy} f={f} at={tRet - 3} top={1140} size={50} />
      <Chip text="TRANQUILO" bg={C.green} f={f} at={tTr - 4} top={250} rot={-4} size={96} icon={<Check size={90} />} />
    </SceneIn>
  );
};

const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tAt = wt(3, 'atencao'), tTr = wt(3, 'trinca'), tRec = wt(3, 'recalque');
  const W = 520, Hh = 380;
  const fl = faceL(-260, 0, -60);
  const wx0 = 190, wx1 = 330, wy0 = 120, wy1 = 250;
  const c1: [number, number][] = [[wx1 + 8, wy1 + 8], [wx1 + 40, wy1 + 44], [wx1 + 70, wy1 + 70], [wx1 + 104, wy1 + 112], [wx1 + 128, Hh]].map(([u, v]) => fl(u, v));
  const c2: [number, number][] = [[wx0 - 8, wy0 - 8], [wx0 - 42, wy0 - 40], [wx0 - 70, wy0 - 74], [wx0 - 102, wy0 - 104], [wx0 - 118, 0]].map(([u, v]) => fl(u, v));
  const pc = interpolate(f, [tTr - 2, tTr + 30], [0, 1], {...clamp, easing: Easing.bezier(0.5, 0, 0.3, 1)});
  const sink = interpolate(f, [tRec, tRec + 24], [0, 1], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});
  const corner = fl(wx1 + 8, wy1 + 8);
  const arcS = pop(f, tTr + 22, fps);
  const arrowS = pop(f, tRec, fps);
  const footL = fl(0, 0), footR = fl(W, 0);
  return (
    <SceneIn>
      <Sky a="#FFC371" b="#FFF1DA" />
      <Handle />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform="translate(560,860) scale(1.12)">
          {/* foundation */}
          <Box x={-280} y={-40} z={-110} w={560} d={60} h={50} top="#BFC5CC" left="#9AA3AD" right="#7D8792" />
          <g transform={`rotate(${-3.2 * sink} ${footL[0]} ${footL[1]}) translate(0 ${18 * sink})`}>
            <g transform="translate(0,0)">
              <g transform={`translate(${iso([-260, 0, -60])[0]},${iso([-260, 0, -60])[1]})`}>
                <WallPanel w={W} h={Hh} brick />
              </g>
              <polygon points={rectOn(fl, wx0 - 14, wy0 - 14, wx1 + 14, wy1 + 14)} fill="#FFFFFF" stroke={C.navy} strokeWidth={5} />
              <polygon points={rectOn(fl, wx0, wy0, wx1, wy1)} fill={C.glass} stroke={C.navy} strokeWidth={5} />
              <line x1={fl((wx0 + wx1) / 2, wy0)[0]} y1={fl((wx0 + wx1) / 2, wy0)[1]} x2={fl((wx0 + wx1) / 2, wy1)[0]} y2={fl((wx0 + wx1) / 2, wy1)[1]} stroke="white" strokeWidth={9} />
              <Crack ps={c1} p={pc} w={9} />
              <Crack ps={c2} p={pc} w={9} />
              <Dust ps={[...partial(c1, pc), ...partial(c2, pc)]} f={f} start={tTr} dur={30} seed="w" n={30} />
              {f >= tTr + 22 && (
                <g opacity={arcS}>
                  <path d={`M ${corner[0] + 95} ${corner[1]} A 95 95 0 0 0 ${corner[0] + 67} ${corner[1] - 67}`} stroke={C.yellow} strokeWidth={10} fill="none" />
                  <text x={corner[0] + 110} y={corner[1] - 40} fontFamily="InterD" fontWeight={900} fontSize={64} fill={C.yellow} stroke={C.navy} strokeWidth={12} paintOrder="stroke">45°</text>
                </g>
              )}
            </g>
          </g>
          {f >= tRec && (
            <g transform={`translate(${footR[0] + 40},${footR[1] - 40}) scale(${arrowS})`}>
              <path d="M0 -90 L0 30" stroke={C.red} strokeWidth={22} strokeLinecap="round" />
              <path d="M-42 0 L0 60 L42 0 Z" fill={C.red} />
            </g>
          )}
        </g>
      </svg>
      <Chip text="ATENÇÃO" bg={C.amber} f={f} at={tAt - 4} top={250} rot={-4} size={96} icon={<Warn size={90} />} />
      <Chip text="RECALQUE DA FUNDAÇÃO" bg={C.red} f={f} at={tRec - 2} top={1140} size={50} />
    </SceneIn>
  );
};

const CoinIcon: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = interpolate(f, [at, at + 24], [0, 1], {...clamp, easing: Easing.bezier(0.5, 0, 0.3, 1)});
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <rect x="20" y="20" width="160" height="160" rx="20" fill={C.wall} stroke={C.navy} strokeWidth="6" />
      <path d="M100 20 L92 70 L108 110 L94 150 L100 180" stroke={C.crack} strokeWidth="22" fill="none" strokeLinejoin="round" />
      <g transform={`translate(${interpolate(p, [0, 1], [170, 100])},${interpolate(p, [0, 1], [40, 100])}) rotate(${interpolate(p, [0, 1], [0, 80])})`}>
        <ellipse cx="0" cy="0" rx="44" ry="44" fill="#F5C04A" stroke={C.navy} strokeWidth="6" />
        <text x="0" y="14" textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize="38" fill="#8A5A00">R$</text>
      </g>
    </svg>
  );
};
const WidenIcon: React.FC<{f: number}> = ({f}) => {
  const g = 12 + 14 * (0.5 + 0.5 * Math.sin(f / 4));
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <rect x="20" y="20" width="160" height="160" rx="20" fill={C.wall} stroke={C.navy} strokeWidth="6" />
      <path d={`M${100 - g} 20 L${92 - g} 100 L${100 - g} 180 L${100 + g} 180 L${108 + g} 100 L${100 + g} 20 Z`} fill={C.crack} />
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${100 + s * (g + 44)},100)`}>
          <path d={`M0 0 L${s * 30} 0`} stroke={C.red} strokeWidth="12" strokeLinecap="round" />
          <path d={`M${s * 46} 0 L${s * 24} -16 L${s * 24} 16 Z`} fill={C.red} />
        </g>
      ))}
    </svg>
  );
};
const DoorIcon: React.FC<{f: number}> = ({f}) => {
  const r = Math.sin(f / 2.2) * 4;
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <rect x="44" y="18" width="112" height="170" rx="6" fill="white" stroke={C.navy} strokeWidth="7" />
      <g transform={`rotate(${r} 60 100)`}>
        <rect x="58" y="32" width="84" height="156" rx="4" fill="#8B5A3C" stroke={C.navy} strokeWidth="6" />
        <circle cx="126" cy="112" r="8" fill={C.yellow} />
      </g>
      <circle cx="160" cy="34" r="28" fill={C.red} stroke={C.navy} strokeWidth="6" />
      <text x="160" y="48" textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize="42" fill="white">!</text>
    </svg>
  );
};

const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ts = [wt(4, 'moeda'), wt(4, 'aumentando'), wt(4, 'porta')];
  const items = [
    {t: 'MOEDA PASSA', s: 'na abertura', icon: <CoinIcon f={f} at={ts[0]} />},
    {t: 'TRINCA CRESCE', s: 'dia após dia', icon: <WidenIcon f={f} />},
    {t: 'PORTA EMPERRA', s: 'ou a janela', icon: <DoorIcon f={f} />},
  ];
  return (
    <SceneIn>
      <Sky a="#FF9A8B" b="#FFEDEA" />
      <Handle />
      <Chip text="CHAME UM ENGENHEIRO" bg={C.red} f={f} at={0} top={205} rot={-3} size={70} icon={<HardHat size={84} />} />
      {items.map((it, i) => {
        const at = ts[i] - 8;
        if (f < at) return null;
        const s = pop(f, at, fps);
        return (
          <div key={i} style={{position: 'absolute', top: 370 + i * 285, left: 70, right: 70, height: 250, background: C.white, borderRadius: 34, borderLeft: `14px solid ${C.red}`, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', translate: `${(i % 2 ? 1 : -1) * (1 - s) * 900}px 0`, display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 26}}>
            <div style={{width: 200, height: 200, flexShrink: 0}}>{it.icon}</div>
            <div>
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 62, color: C.navy, letterSpacing: -2}}>{it.t.charAt(0) + it.t.slice(1).toLowerCase()}</div>
              <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 44, color: C.grey}}>{it.s}</div>
            </div>
          </div>
        );
      })}
    </SceneIn>
  );
};

const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tM = wt(5, 'manda');
  const b = pop(f, 2, fps, 8);
  const p = pop(f, tM - 3, fps, 8);
  const h = pop(f, tM + 12, fps, 12);
  return (
    <SceneIn>
      <Sky a="" b="" />
      <Handle />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(360,520) scale(${b}) rotate(${-8 * b})`}>
          <path d="M-110 -150 L110 -150 L110 150 L0 75 L-110 150 Z" fill="white" stroke={C.navy} strokeWidth="14" strokeLinejoin="round" />
          <path d="M-60 -60 L60 -60" stroke={C.navy} strokeWidth="14" strokeLinecap="round" />
        </g>
        {f >= tM - 3 && (
          <g transform={`translate(${740 + (1 - p) * -200},${500 - (1 - p) * -100}) scale(${p}) rotate(-14)`}>
            <path d="M-140 10 L140 -110 L60 130 L10 40 Z" fill="white" stroke={C.navy} strokeWidth="14" strokeLinejoin="round" />
            <path d="M10 40 L140 -110" stroke={C.navy} strokeWidth="12" />
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', top: 780, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40}}>
        {['SALVA', 'MANDA'].map((t, i) => {
          const s = i === 0 ? b : p;
          if (i === 1 && f < tM - 3) return null;
          return <div key={t} style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 120, color: i === 0 ? C.navy : C.yellow, letterSpacing: -5, scale: String(s)}}>{t.charAt(0) + t.slice(1).toLowerCase()}</div>;
        })}
      </div>
      {f >= tM + 12 && (
        <div style={{position: 'absolute', top: 990, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: C.navy, color: C.white, borderRadius: 999, padding: '22px 48px 22px 30px', display: 'flex', alignItems: 'center', gap: 22, scale: String(h), boxShadow: '0 20px 50px rgba(0,0,0,0.15)'}}>
            <HardHat size={96} />
            <div>
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 56, color: C.white}}>{HANDLE}</div>
              <div style={{fontFamily: 'InterD', fontWeight: 600, fontSize: 34, color: C.light}}>Engenheiro civil</div>
            </div>
          </div>
        </div>
      )}
    </SceneIn>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6];

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
      <Audio src={staticFile('voice.wav')} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition id="RachadurasMinimal" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);

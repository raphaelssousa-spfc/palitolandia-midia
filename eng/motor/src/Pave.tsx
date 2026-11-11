import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pave.json';
import mouthData from './mouth_pave.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 01';

const K = {
  bg: '#25282D', bg2: '#1C1E22', grain: '#3A3E44', card: '#30343A', text: '#FFFFFF', grey: '#9AA0A8', dim: '#6B7078',
  yellow: '#FFC20E', red: '#FF4D4D', green: '#3DDC84', blue: '#5FA8D8', amber: '#FF9F1C',
  asph: '#3A3D42', asphS: '#4A4E55', base: '#A8A39A', sub: '#D9C9A3', soil: '#9C6B45', hole: '#17191C', stroke: 'rgba(0,0,0,0.75)',
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const wt = (scene: number, p: string, nth = 0) => {
  const ws = timing.words.filter((w) => w.scene === scene && norm(w.w).startsWith(norm(p)));
  const w = ws[Math.min(nth, ws.length - 1)];
  return w ? Math.round((w.s - STARTS[scene]) * FPS) : 0;
};
const pop = (f: number, at: number, fps: number, damping = 11) => spring({frame: f - at, fps, config: {damping, stiffness: 170, mass: 0.8}});
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1)});

// ---------- iso ----------
const CS = Math.cos(Math.PI / 6);
type P3 = [number, number, number];
type P2 = [number, number];
const iso = ([x, y, z]: P3): P2 => [(x - y) * CS, (x + y) * 0.5 - z];
const pts = (ps: P3[]) => ps.map((p) => iso(p).join(',')).join(' ');
const Poly: React.FC<{p: P3[]; fill: string; stroke?: string; sw?: number; op?: number}> = ({p, fill, stroke, sw, op}) => (
  <polygon points={pts(p)} fill={fill} stroke={stroke ?? K.stroke} strokeWidth={sw ?? 2} strokeLinejoin="round" opacity={op ?? 1} />
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
const partial = (ps: P2[], p: number): P2[] => {
  if (p <= 0) return [];
  const seg = ps.slice(1).map((q, i) => Math.hypot(q[0] - ps[i][0], q[1] - ps[i][1]));
  let L = seg.reduce((a, b) => a + b, 0) * Math.min(1, p);
  const out: P2[] = [ps[0]];
  for (let i = 0; i < seg.length; i++) {
    if (L >= seg[i]) { out.push(ps[i + 1]); L -= seg[i]; }
    else { const f = L / seg[i]; out.push([ps[i][0] + (ps[i + 1][0] - ps[i][0]) * f, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * f]); break; }
  }
  return out;
};
const path = (ps: P2[], close = false) => 'M' + ps.map((a) => a.join(',')).join(' L') + (close ? ' Z' : '');

// ---------- road ----------
const X0 = -330, W = 660, Y0 = -150, D = 300;
const HC: [number, number] = [60, 10];
const HOLE: P3[] = new Array(14).fill(0).map((_, i) => {
  const a = (i / 14) * Math.PI * 2, r = 95 + random('hole' + i) * 30;
  return [HC[0] + Math.cos(a) * r, HC[1] + Math.sin(a) * r * 0.8, 0];
});
const holeAt = (s: number): P2[] => HOLE.map(([x, y]) => iso([HC[0] + (x - HC[0]) * s, HC[1] + (y - HC[1]) * s, 0.6]));
const CRACKS: P2[][] = new Array(16).fill(0).map((_, i) => {
  const a0 = (i / 16) * Math.PI * 2 + random('ca' + i) * 0.3;
  let x = HC[0] + Math.cos(a0) * 110, y = HC[1] + Math.sin(a0) * 90, a = a0;
  const out: P3[] = [[x, y, 0.6]];
  for (let k = 0; k < 5; k++) {
    a += (random(`c${i}-${k}`) - 0.5) * 1.4;
    x = Math.max(X0 + 10, Math.min(X0 + W - 10, x + Math.cos(a) * (28 + random(`cl${i}-${k}`) * 30)));
    y = Math.max(Y0 + 30, Math.min(Y0 + D - 30, y + Math.sin(a) * (24 + random(`cm${i}-${k}`) * 24)));
    out.push([x, y, 0.6]);
  }
  return out.map(iso);
});

type RoadState = {f: number; hole?: number; cracks?: number; seep?: number; puddle?: number; holeWater?: boolean; asphT?: number; patch?: number; sinkX?: number | null; fresh?: boolean};
const Road: React.FC<RoadState> = ({f, hole = 0, cracks = 0, seep = 0, puddle = 0, holeWater = true, asphT = 32, patch = 0, sinkX = null}) => {
  const layers: [number, number, string][] = [[-170, -115, K.soil], [-115, -75, K.sub], [-75, -asphT, K.base], [-asphT, 0, K.asph]];
  return (
    <g>
      {layers.map(([z0, z1, col], i) => (
        <g key={i}>
          <Poly p={[[X0, Y0 + D, z0], [X0 + W, Y0 + D, z0], [X0 + W, Y0 + D, z1], [X0, Y0 + D, z1]]} fill={col} />
          <Poly p={[[X0 + W, Y0, z0], [X0 + W, Y0 + D, z0], [X0 + W, Y0 + D, z1], [X0 + W, Y0, z1]]} fill={col} op={0.85} />
        </g>
      ))}
      {new Array(44).fill(0).map((_, i) => {
        const q = iso([X0 + random('gx' + i) * W, Y0 + D, -72 + random('gz' + i) * (72 - asphT - 4)]);
        return <circle key={i} cx={q[0]} cy={q[1]} r={2 + random('gr' + i) * 4} fill="rgba(0,0,0,0.25)" />;
      })}
      {/* water seeping into base (front face) */}
      {seep > 0 && (
        <g opacity={0.6}>
          <Poly p={[[-40, Y0 + D, -asphT], [200, Y0 + D, -asphT], [200, Y0 + D, -asphT - (115 - asphT) * seep], [-40, Y0 + D, -asphT - (115 - asphT) * seep]]} fill={K.blue} sw={0} />
          {new Array(8).fill(0).map((_, i) => {
            const ph = ((f + i * 7) % 30) / 30;
            const q = iso([-20 + i * 28, Y0 + D, -asphT - ph * (115 - asphT) * seep]);
            return <circle key={i} cx={q[0]} cy={q[1]} r={5} fill="#BFE3FA" opacity={1 - ph} />;
          })}
        </g>
      )}
      <Poly p={[[X0, Y0, 0], [X0 + W, Y0, 0], [X0 + W, Y0 + D, 0], [X0, Y0 + D, 0]]} fill={K.asphS} />
      {new Array(5).fill(0).map((_, i) => <Poly key={i} p={[[X0 + 20 + i * 140, -6, 0.5], [X0 + 90 + i * 140, -6, 0.5], [X0 + 90 + i * 140, 6, 0.5], [X0 + 20 + i * 140, 6, 0.5]]} fill={K.yellow} sw={0} />)}
      <Poly p={[[X0, Y0 + 14, 0.5], [X0 + W, Y0 + 14, 0.5], [X0 + W, Y0 + 24, 0.5], [X0, Y0 + 24, 0.5]]} fill="#FFFFFF" sw={0} op={0.85} />
      <Poly p={[[X0, Y0 + D - 24, 0.5], [X0 + W, Y0 + D - 24, 0.5], [X0 + W, Y0 + D - 14, 0.5], [X0, Y0 + D - 14, 0.5]]} fill="#FFFFFF" sw={0} op={0.85} />
      {sinkX !== null && (() => { const c = iso([sinkX, -75, 0]); return <ellipse cx={c[0]} cy={c[1]} rx={150} ry={60} fill="rgba(0,0,0,0.35)" />; })()}
      {/* cracks */}
      {cracks > 0 && CRACKS.map((c, i) => {
        const q = partial(c, interpolate(cracks, [i / 32, Math.min(1, i / 32 + 0.6)], [0, 1], clamp));
        return q.length > 1 ? <path key={i} d={path(q)} stroke="#111" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null;
      })}
      {/* puddle */}
      {puddle > 0 && (() => { const c = iso([HC[0], HC[1], 0.6]); return <g><ellipse cx={c[0]} cy={c[1]} rx={210 * puddle} ry={110 * puddle} fill={K.blue} opacity={0.75} /><ellipse cx={c[0] - 40 * puddle} cy={c[1] - 20 * puddle} rx={60 * puddle} ry={10 * puddle} fill="white" opacity={0.45} /></g>; })()}
      {/* hole */}
      {hole > 0 && (
        <g>
          <path d={path(holeAt(hole), true)} fill={K.hole} stroke="#000" strokeWidth={3} />
          <path d={path(holeAt(hole * 0.8).map(([x, y]) => [x, y + 16 * hole] as P2), true)} fill={K.base} opacity={0.55} />
          {holeWater && <path d={path(holeAt(hole * 0.62).map(([x, y]) => [x, y + 16 * hole] as P2), true)} fill={K.blue} opacity={0.9} />}
          {new Array(9).fill(0).map((_, i) => { const q = holeAt(hole * 1.05)[(i * 3) % 14]; return <circle key={i} cx={q[0] + (random('pb' + i) - 0.5) * 50 * hole} cy={q[1] + (random('pc' + i) - 0.5) * 30 * hole} r={(5 + random('pd' + i) * 6) * hole} fill={K.base} stroke="#000" strokeWidth={2} />; })}
        </g>
      )}
      {/* patch */}
      {patch > 0 && <path d={path(holeAt(1.12 * patch), true)} fill="#2A2C30" stroke="#55595F" strokeWidth={5} />}
    </g>
  );
};

const Car: React.FC<{x: number; y?: number; color?: string}> = ({x, y = 70, color = '#E63946'}) => (
  <g>
    <Box x={x - 60} y={y - 34} z={6} w={120} d={68} h={30} top={color} left="#B02A33" right="#C8303A" />
    <Box x={x - 30} y={y - 30} z={36} w={60} d={60} h={24} top="#DDEFFC" left="#9FD3F7" right="#7FBCE8" />
  </g>
);
const Truck: React.FC<{x: number; y?: number}> = ({x, y = -75}) => (
  <g>
    <Box x={x - 150} y={y - 42} z={10} w={230} d={84} h={120} top="#F1F1F1" left="#D8D8D8" right="#C4C4C4" />
    <Box x={x + 86} y={y - 40} z={10} w={70} d={80} h={88} top={K.yellow} left="#E0A800" right="#C99700" />
    <Box x={x + 130} y={y - 34} z={60} w={26} d={68} h={30} top="#DDEFFC" left="#9FD3F7" right="#7FBCE8" />
  </g>
);

// ---------- UI ----------
const Sfx: React.FC<{at: number; src: string; vol?: number; dur?: number}> = ({at, src, vol = 0.35, dur}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={dur} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
);
const Bg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: K.bg}}>
      <svg width={1080} height={1920}>
        {new Array(260).fill(0).map((_, i) => <circle key={i} cx={random('ax' + i) * 1080} cy={random('ay' + i) * 1920} r={1 + random('ar' + i) * 3} fill={random('ac' + i) > 0.5 ? K.grain : K.bg2} />)}
        {new Array(13).fill(0).map((_, i) => <rect key={i} x={60} y={((i * 170 + f * 6) % 2210) - 170} width={20} height={100} rx={4} fill={K.yellow} opacity={0.85} />)}
      </svg>
    </AbsoluteFill>
  );
};
const Header: React.FC = () => (
  <div style={{position: 'absolute', top: 105, left: 120, right: 80, display: 'flex', justifyContent: 'space-between', fontFamily: 'InterD', fontWeight: 800, fontSize: 30, color: K.grey, letterSpacing: 5}}>
    <span>{SERIES}</span><span style={{letterSpacing: 0}}>{HANDLE}</span>
  </div>
);
const LEVELS = [0.72, 0.56, 0.42, 0.3, 0.2, 0.1, 1];
const Meter: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let sc = 0;
  for (let i = 0; i < STARTS.length; i++) if (t >= STARTS[i]) sc = i;
  const enter = Math.round(STARTS[sc] * fps) + (sc === 6 ? 40 : 10);
  const p = spring({frame: f - enter, fps, config: {damping: 16, stiffness: 110}});
  const prev = sc > 0 ? LEVELS[sc - 1] : 1;
  const w = prev + (LEVELS[sc] - prev) * p;
  const col = w > 0.66 ? K.green : w > 0.35 ? K.amber : K.red;
  return (
    <div style={{position: 'absolute', top: 165, left: 120, right: 80, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 24, color: K.grey, letterSpacing: 4, whiteSpace: 'nowrap'}}>CONDIÇÃO DA PISTA</div>
      <div style={{flex: 1, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
        <div style={{width: `${w * 100}%`, height: '100%', background: col, borderRadius: 11, boxShadow: `0 0 18px ${col}`}} />
      </div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 30, color: col, width: 80, textAlign: 'right'}}>{Math.round(w * 100)}%</div>
    </div>
  );
};
const Big: React.FC<{lines: string[]; accent?: string; f: number; at?: number; top?: number; size?: number}> = ({lines, accent = K.yellow, f, at = 0, top = 240, size = 110}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  return (
    <div style={{position: 'absolute', top, left: 120, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: size, color: K.text, letterSpacing: -5, lineHeight: 0.98}}>
      {lines.map((l, i) => {
        const s = spring({frame: f - at - i * 3, fps, config: {damping: 200}});
        const last = i === lines.length - 1;
        return <div key={i} style={{opacity: s, translate: `0 ${(1 - s) * 40}px`, color: last ? accent : K.text}}>{l}</div>;
      })}
    </div>
  );
};
const Pill: React.FC<{text: string; f: number; at: number; x: number; y: number; bg?: string; color?: string; size?: number; rot?: number}> = ({text, f, at, x, y, bg = K.yellow, color = '#111', size = 40, rot = 0}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 10);
  return <div style={{position: 'absolute', left: x, top: y, background: bg, color, fontFamily: 'InterD', fontWeight: 900, fontSize: size, padding: '10px 26px', borderRadius: 14, scale: String(s), rotate: `${rot}deg`, boxShadow: '0 14px 30px rgba(0,0,0,0.35)', whiteSpace: 'nowrap', transformOrigin: 'left center'}}>{text}</div>;
};
const XMark: React.FC<{f: number; at: number; cx: number; cy: number; r: number; w?: number}> = ({f, at, cx, cy, r, w = 22}) => {
  if (f < at) return null;
  const p1 = interpolate(f, [at, at + 5], [0, 1], clamp), p2 = interpolate(f, [at + 4, at + 9], [0, 1], clamp);
  return (
    <g stroke={K.red} strokeWidth={w} strokeLinecap="round">
      <line x1={cx - r} y1={cy - r} x2={cx - r + 2 * r * p1} y2={cy - r + 2 * r * p1} />
      {p2 > 0 && <line x1={cx + r} y1={cy - r} x2={cx + r - 2 * r * p2} y2={cy - r + 2 * r * p2} />}
    </g>
  );
};
const Rain: React.FC<{f: number; a: number}> = ({f, a}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', pointerEvents: 'none'}} opacity={a}>
    {new Array(70).fill(0).map((_, i) => {
      const sp = 38 + random('rs' + i) * 20;
      const y = ((random('ry' + i) * 1920 + f * sp) % 1500) + 200;
      const x = random('rx' + i) * 1180 - 50 - (y - 200) * 0.25;
      return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 42} stroke="#9FD3F7" strokeWidth={3} opacity={0.55} strokeLinecap="round" />;
    })}
  </svg>
);
const HardHat: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M14 70 Q14 28 50 26 Q86 28 86 70 Z" fill={K.yellow} stroke="#111" strokeWidth="6" strokeLinejoin="round" />
    <rect x="6" y="66" width="88" height="14" rx="7" fill="#E0A800" stroke="#111" strokeWidth="6" />
    <rect x="44" y="22" width="12" height="44" rx="5" fill="#E0A800" stroke="#111" strokeWidth="5" />
  </svg>
);
const ConeIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-50 0 L50 0 L40 -12 L-40 -12 Z" fill="#111" />
    <path d="M-34 -12 L34 -12 L10 -140 L-10 -140 Z" fill="#FF6B1A" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
    <path d="M-24 -50 L24 -50 L19 -75 L-19 -75 Z" fill="white" />
    <path d="M-15 -98 L15 -98 L12 -115 L-12 -115 Z" fill="white" />
  </g>
);

// captions
type Wd = {w: string; s: number; e: number; scene: number};
const GROUPS: Wd[][] = (() => {
  const g: Wd[][] = []; let cur: Wd[] = [];
  for (const w of timing.words as Wd[]) { cur.push(w); if (/[,.!?:]$/.test(w.w) || cur.length === 3) { g.push(cur); cur = []; } }
  if (cur.length) g.push(cur);
  return g;
})();
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const gi = GROUPS.findIndex((g, i) => t >= g[0].s - 0.05 && t < (GROUPS[i + 1] ? GROUPS[i + 1][0].s - 0.05 : g[g.length - 1].e + 0.5));
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const s = pop(f, Math.round(g[0].s * fps) - 1, fps, 14);
  return (
    <div style={{position: 'absolute', top: 1255, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(0.85 + 0.15 * s)}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 28px', maxWidth: 960, background: 'rgba(28,30,34,0.92)', borderRadius: 26, padding: '8px 30px 16px'}}>
        {g.map((w, i) => {
          const active = t >= w.s && t < w.e + 0.05;
          return <span key={i} style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 84, lineHeight: 1.2, letterSpacing: -1, textTransform: 'uppercase', color: active ? K.yellow : t >= w.s ? K.text : K.dim, borderBottom: `10px solid ${active ? K.yellow : 'transparent'}`}}>{w.w.replace(/[,.:]$/, '')}</span>;
        })}
      </div>
    </div>
  );
};
const SceneIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{scale: String(interpolate(f, [0, 9], [1.06, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})), filter: `blur(${interpolate(f, [0, 6], [6, 0], clamp)}px)`}}>{children}</AbsoluteFill>;
};
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: K.bg2, opacity: interpolate(f, [0, 6], [0.9, 0], clamp)}} />;
};
const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', top: 0, left: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: K.yellow}} />;
};
// camera that changes framing at every spoken phrase
const phraseStarts = (scene: number): number[] => {
  const ws = (timing.words as Wd[]).filter((w) => w.scene === scene);
  const out: number[] = [];
  ws.forEach((w, i) => { if (i === 0 || /[,.!?:]$/.test(ws[i - 1].w)) out.push(Math.round((w.s - STARTS[scene]) * FPS)); });
  return out;
};
const CAMS = [{s: 1, x: 0, y: 0}, {s: 1.42, x: -40, y: -60}, {s: 0.94, x: 40, y: 30}, {s: 1.24, x: 90, y: -10}, {s: 1.55, x: -20, y: -90}];
const useCam = (scene: number, seed = 0) => {
  const f = useCurrentFrame();
  const ps = phraseStarts(scene);
  let k = 0;
  ps.forEach((p, i) => { if (f >= p - 3) k = i; });
  const a = CAMS[(k + seed) % CAMS.length], b = CAMS[(Math.max(0, k - 1) + seed) % CAMS.length];
  const t = k === 0 ? 1 : interpolate(f, [ps[k] - 3, ps[k] + 5], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const drift = Math.sin(f / 40) * 6;
  return {s: b.s + (a.s - b.s) * t, x: b.x + (a.x - b.x) * t + drift, y: b.y + (a.y - b.y) * t, cut: ps.slice(1)};
};
const RoadStage: React.FC<{children: React.ReactNode; y?: number; s?: number; x?: number; cam?: {s: number; x: number; y: number}}> = ({children, y = 860, s = 1.12, x = 570, cam}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${x + (cam?.x ?? 0)},${y + (cam?.y ?? 0)}) scale(${s * (cam?.s ?? 1)})`}>{children}</g></svg>
);
const CutFlash: React.FC<{cuts: number[]}> = ({cuts}) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...cuts.map((c) => interpolate(f, [c - 3, c, c + 5], [0, 0.35, 0], clamp)));
  return <AbsoluteFill style={{background: '#fff', opacity: o, pointerEvents: 'none'}} />;
};

// ---------- scenes ----------
const HOLES_TD: [number, number, number][] = [[430, 560, 1], [650, 680, 0.8], [470, 840, 1.2], [690, 960, 0.9], [410, 1080, 0.85], [620, 1170, 0.7]];
const TopHole: React.FC<{x: number; y: number; s: number; seed: string}> = ({x, y, s, seed}) => {
  const ptsTD = new Array(12).fill(0).map((_, i) => { const a = (i / 12) * Math.PI * 2, r = (50 + random(seed + i) * 22) * s; return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.75] as P2; });
  return (
    <g>
      <path d={path(ptsTD, true)} fill={K.hole} stroke="#000" strokeWidth={4} />
      <path d={path(ptsTD.map(([a, b]) => [x + (a - x) * 0.6, y + (b - y) * 0.6 + 6] as P2), true)} fill={K.blue} opacity={0.85} />
      {new Array(6).fill(0).map((_, i) => <circle key={i} cx={ptsTD[i * 2][0] + (random(seed + 'p' + i) - 0.5) * 30} cy={ptsTD[i * 2][1] + (random(seed + 'q' + i) - 0.5) * 20} r={4 + random(seed + 'r' + i) * 5} fill={K.base} stroke="#000" strokeWidth={2} />)}
    </g>
  );
};
const P0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tTem = wt(0, 'tem'), tNao = wt(0, 'nao'), tFal = wt(0, 'falta'), tDin = wt(0, 'dinheiro');
  const c1 = tTem - 3, c2 = tNao - 3, c3 = tFal - 3;
  const shot = f < c1 ? 0 : f < c2 ? 1 : f < c3 ? 2 : 3;
  const bill = pop(f, tDin - 6, fps, 9);
  return (
    <SceneIn>
      <Bg />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={0} src="car.wav" vol={0.4} />
      {[c1, c2, c3].map((c, i) => <Sfx key={i} at={c} src="whoosh.wav" vol={0.4} />)}
      {HOLES_TD.map((_, i) => <Sfx key={'h' + i} at={c1 + 2 + i * Math.max(1, (c2 - c1 - 6) / HOLES_TD.length)} src="thud.wav" vol={0.45} />)}
      <Sfx at={tDin - 6} src="pop.wav" vol={0.5} />
      {shot === 0 && (() => {
        const hz = 640;
        return (
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B2330" /><stop offset="1" stopColor="#3B4A5E" /></linearGradient></defs>
            <rect x={0} y={0} width={1080} height={hz} fill="url(#sk)" />
            <rect x={0} y={hz} width={1080} height={1920 - hz} fill="#2E3A2A" />
            <path d={`M520 ${hz} L560 ${hz} L1180 1920 L-100 1920 Z`} fill={K.asphS} />
            <path d={`M520 ${hz} L524 ${hz} L40 1920 L0 1920 Z`} fill="#fff" opacity={0.85} />
            <path d={`M556 ${hz} L560 ${hz} L1080 1920 L1040 1920 Z`} fill="#fff" opacity={0.85} />
            {new Array(8).fill(0).map((_, i) => {
              const d = ((i / 8 + f * 0.035) % 1);
              const y0 = hz + 1280 * d * d, y1 = hz + 1280 * Math.min(1, (d + 0.05) * (d + 0.05));
              const w0 = 2 + 26 * d, w1 = 2 + 26 * (d + 0.05);
              return <path key={i} d={`M${540 - w0} ${y0} L${540 + w0} ${y0} L${540 + w1} ${y1} L${540 - w1} ${y1} Z`} fill={K.yellow} />;
            })}
            {new Array(14).fill(0).map((_, i) => {
              const d = ((random('sl' + i) + f * 0.05) % 1);
              const side = random('sd' + i) > 0.5 ? 1 : -1;
              const x = 540 + side * (60 + 900 * d * d), y = hz + 700 * d * d;
              return <line key={'s' + i} x1={x} y1={y} x2={x + side * 80 * d} y2={y + 60 * d} stroke="#fff" strokeWidth={3} opacity={0.35} />;
            })}
          </svg>
        );
      })()}
      {shot === 1 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}} transform={`translate(${(random('k' + f) - 0.5) * 10},${(random('kk' + f) - 0.5) * 10})`}>
          <rect x={300} y={0} width={480} height={1920} fill={K.asphS} />
          <rect x={312} y={0} width={10} height={1920} fill="#fff" opacity={0.8} />
          <rect x={758} y={0} width={10} height={1920} fill="#fff" opacity={0.8} />
          {new Array(14).fill(0).map((_, i) => <rect key={i} x={533} y={((i * 150 + f * 14) % 2100) - 150} width={14} height={80} fill={K.yellow} />)}
          {HOLES_TD.map(([x, y, sc], i) => {
            const at = c1 + 2 + i * Math.max(1, (c2 - c1 - 6) / HOLES_TD.length);
            if (f < at) return null;
            const p = pop(f, at, fps, 8);
            return <g key={i} transform={`translate(${x},${y}) scale(${p}) translate(${-x},${-y})`}><TopHole x={x} y={y} s={sc} seed={'td' + i} /></g>;
          })}
        </svg>
      )}
      {shot >= 2 && (
        <RoadStage y={900} s={1.12 * (shot === 2 ? interpolate(f, [c2, c3], [1.2, 1.45], clamp) : 0.95)} cam={shot === 2 ? {s: 1, x: -40, y: -50} : undefined}>
          <Road f={f} hole={1} cracks={1} /><ConeIcon x={-330} y={150} />
        </RoadStage>
      )}
      <Header />
      {shot === 0 && <Big lines={['Por que o asfalto', 'do Brasil...']} f={f} at={0} />}
      {shot === 1 && <Big lines={['...tem tanto', 'buraco?']} f={f} at={c1} />}
      {shot === 2 && <Big lines={['Não é só...']} accent={K.text} f={f} at={c2} />}
      {shot === 3 && <Big lines={['...falta de', 'dinheiro']} accent={K.red} f={f} at={c3} />}
      {f >= tDin - 6 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(800,640) scale(${bill}) rotate(-10)`}>
            <rect x={-130} y={-70} width={260} height={140} rx={14} fill="#7BC67E" stroke="#111" strokeWidth={6} />
            <circle r={44} fill="#5FAE63" stroke="#111" strokeWidth={4} />
            <text y={16} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={46} fill="#123">R$</text>
          </g>
          <g transform="translate(800,640)"><XMark f={f} at={tDin} cx={0} cy={0} r={90} /></g>
        </svg>
      )}
      <CutFlash cuts={[c1, c2, c3]} />
    </SceneIn>
  );
};

const P1: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(1, 1);
  const tTr = wt(1, 'trincas'), tAm = wt(1, 'amolece'), tAg = wt(1, 'agua');
  const cracks = ease(f, tTr - 10, tTr + 10);
  const seep = ease(f, tTr + 2, tAm + 20);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="rain.wav" vol={0.35} />
      <Sfx at={tAg - 2} src="pop.wav" vol={0.4} />
      <Sfx at={tTr - 6} src="pop.wav" vol={0.4} />
      <Sfx at={tAm - 4} src="pop.wav" vol={0.4} />
      <RoadStage cam={cam}><Road f={f} hole={0.35} cracks={0.25 + 0.75 * cracks} seep={seep} /></RoadStage>
      <CutFlash cuts={cam.cut} />
      <Rain f={f} a={interpolate(f, [0, 10], [0, 1], clamp)} />
      <Big lines={['Inimigo nº 1:', 'a água']} accent={K.blue} f={f} at={0} />
      <Pill text="TRINCAS" f={f} at={tTr - 6} x={640} y={600} />
      <Pill text="BASE ENCHARCADA" f={f} at={tAm - 4} x={430} y={1120} bg={K.blue} color="#fff" />
    </SceneIn>
  );
};

const P2: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(2, 2);
  const {fps} = useVideoConfig();
  const tDr = wt(2, 'drenagem'), tPa = wt(2, 'parada'), tCa = wt(2, 'carro'), tBo = wt(2, 'bombeia');
  const puddle = ease(f, tPa - 10, tPa + 14);
  const carX = interpolate(f, [tCa - 8, tBo + 26], [-560, 560], clamp);
  const pump = interpolate(Math.abs(carX - HC[0]), [0, 140], [1, 0], clamp);
  const seep = 0.3 + 0.7 * ease(f, tBo - 6, tBo + 20);
  const grate = pop(f, tDr - 6, fps, 10);
  const c = iso([HC[0], HC[1], 0]);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="rain.wav" vol={0.25} />
      <Sfx at={tDr - 4} src="thud.wav" vol={0.4} />
      <Sfx at={tCa - 12} src="car.wav" vol={0.6} />
      <RoadStage cam={cam}>
        <Road f={f} hole={0.35} cracks={1} seep={seep} puddle={puddle} />
        {pump > 0.05 && f > tCa && [-40, 0, 40].map((dx) => (
          <g key={dx} transform={`translate(${c[0] + dx},${c[1] + 10})`} opacity={pump}>
            <path d="M0 0 L0 70" stroke={K.blue} strokeWidth={10} strokeLinecap="round" />
            <path d="M-16 60 L0 86 L16 60 Z" fill={K.blue} />
          </g>
        ))}
        {f > tCa - 8 && <Car x={carX} />}
        {f >= tDr - 6 && (
          <g transform={`translate(${iso([300, 120, 0])[0] + 60},${iso([300, 120, 0])[1] + 40}) scale(${grate})`}>
            <rect x={-60} y={-30} width={120} height={60} rx={8} fill="#55595F" stroke="#111" strokeWidth={5} />
            {[-36, -12, 12, 36].map((x) => <line key={x} x1={x} y1={-22} x2={x} y2={22} stroke="#111" strokeWidth={6} />)}
            <XMark f={f} at={tDr} cx={0} cy={0} r={55} w={14} />
          </g>
        )}
      </RoadStage>
      <Rain f={f} a={interpolate(f, [0, 10, 60, 90], [1, 1, 1, 0.4], clamp)} />
      <Big lines={['Sem', 'drenagem']} f={f} at={0} />
      <Pill text="BOMBEAMENTO" f={f} at={tBo - 4} x={600} y={1110} bg={K.blue} color="#fff" />
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const P3: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(3, 3);
  const {fps} = useVideoConfig();
  const tCam = wt(3, 'caminhao'), tLim = wt(3, 'limite'), tEs = wt(3, 'esmaga');
  const tx = interpolate(f, [tCam - 10, DURS[3] * fps], [-620, 520], clamp);
  const hole = 0.35 + 0.65 * ease(f, tEs - 4, tEs + 16);
  const bob = Math.sin(f / 2) * 3;
  const badge = pop(f, tLim - 6, fps, 8);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tCam - 10} src="truck.wav" vol={0.7} />
      <Sfx at={tLim - 6} src="thud.wav" vol={0.6} />
      <Sfx at={tEs - 4} src="thud.wav" vol={0.8} />
      <RoadStage cam={cam}>
        <Road f={f} hole={hole} cracks={1} seep={1} sinkX={f > tCam - 10 ? tx : null} />
        {f > tCam - 10 && <g transform={`translate(0,${bob})`}><Truck x={tx} /></g>}
      </RoadStage>
      <Big lines={['Depois,', 'o peso']} f={f} at={0} />
      {f >= tLim - 6 && (
        <div style={{position: 'absolute', top: 560, right: 70, scale: String(badge), rotate: '6deg', display: 'flex', flexDirection: 'column', alignItems: 'center', background: K.red, borderRadius: 22, padding: '14px 26px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)'}}>
          <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 70, color: '#fff', lineHeight: 1}}>+ t</div>
          <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: 2}}>ACIMA DO LIMITE</div>
        </div>
      )}
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const Stack: React.FC<{x: number; title: string; asph: number; voids: number; f: number; at: number; good: boolean}> = ({x, title, asph, voids, f, at, good}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 12);
  const Wd = 340, base = 150, sub = 130, soil = 90, top = 640;
  return (
    <g transform={`translate(${x},${top + (1 - s) * 300})`} opacity={s}>
      <text x={Wd / 2} y={-30} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={46} fill={good ? K.green : K.red}>{title}</text>
      <rect x={0} y={0} width={Wd} height={asph} fill={K.asph} stroke="#000" strokeWidth={3} />
      <rect x={0} y={asph} width={Wd} height={base} fill={K.base} stroke="#000" strokeWidth={3} />
      {new Array(24).fill(0).map((_, i) => <circle key={i} cx={10 + random(title + 'g' + i) * (Wd - 20)} cy={asph + 10 + random(title + 'h' + i) * (base - 20)} r={3 + random(title + 'r' + i) * 5} fill="rgba(0,0,0,0.25)" />)}
      {voids > 0 && new Array(9).fill(0).map((_, i) => <ellipse key={'v' + i} cx={30 + random(title + 'vx' + i) * (Wd - 60)} cy={asph + 20 + random(title + 'vy' + i) * (base - 40)} rx={20 * voids} ry={12 * voids} fill={K.bg2} stroke="#000" strokeWidth={2} />)}
      <rect x={0} y={asph + base} width={Wd} height={sub} fill={K.sub} stroke="#000" strokeWidth={3} />
      <rect x={0} y={asph + base + sub} width={Wd} height={soil} fill={K.soil} stroke="#000" strokeWidth={3} />
    </g>
  );
};
const P4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tFi = wt(4, 'fina'), tCo = wt(4, 'compactada');
  const asphReal = interpolate(f, [tFi - 8, tFi + 6], [70, 24], clamp);
  const voids = ease(f, tCo - 6, tCo + 10);
  const roll = pop(f, tCo - 2, fps, 10);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={4} src="pop.wav" vol={0.4} />
      <Sfx at={12} src="pop.wav" vol={0.4} />
      <Sfx at={tFi - 6} src="whoosh.wav" vol={0.4} />
      <Sfx at={tCo - 4} src="thud.wav" vol={0.6} />
      <Big lines={['Já nasce', 'fraca']} f={f} at={0} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <Stack x={150} title="IDEAL" asph={70} voids={0} f={f} at={4} good />
        <Stack x={590} title="REAL" asph={asphReal} voids={voids} f={f} at={12} good={false} />
        {f >= tFi - 6 && (
          <g opacity={ease(f, tFi - 6, tFi + 2)}>
            <path d={`M950 640 L966 640 L966 ${640 + asphReal} L950 ${640 + asphReal}`} stroke={K.yellow} strokeWidth={6} fill="none" />
            <text x={966} y={570} textAnchor="end" fontFamily="InterD" fontWeight={900} fontSize={34} fill={K.yellow}>camada fina</text>
          </g>
        )}
        {f >= tCo - 2 && (
          <g transform={`translate(760,1150) scale(${roll})`}>
            <rect x={-70} y={-80} width={140} height={60} rx={10} fill={K.yellow} stroke="#111" strokeWidth={5} />
            <circle cx={-40} cy={0} r={34} fill="#55595F" stroke="#111" strokeWidth={5} />
            <rect x={10} y={-26} width={90} height={52} rx={26} fill="#55595F" stroke="#111" strokeWidth={5} />
            <XMark f={f} at={tCo + 4} cx={0} cy={-20} r={70} w={14} />
          </g>
        )}
      </svg>
    </SceneIn>
  );
};

const P5: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(5, 1);
  const {fps} = useVideoConfig();
  const tTa = wt(5, 'tapa'), tCau = wt(5, 'causa'), tVo = wt(5, 'volta');
  const patch = ease(f, tTa, tTa + 14);
  const reCrack = ease(f, tVo - 14, tVo + 2);
  const reHole = ease(f, tVo - 4, tVo + 10);
  const shovel = interpolate(f, [tTa - 10, tTa, tTa + 14, tTa + 22], [0, 1, 1, 0], clamp);
  const loop = pop(f, tVo - 2, fps, 9);
  const c = iso([HC[0], HC[1], 0]);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tTa} src="thud.wav" vol={0.6} />
      <Sfx at={tVo - 4} src="thud.wav" vol={0.8} />
      <RoadStage cam={cam}>
        <Road f={f} hole={reHole > 0 ? reHole : 1 - patch} cracks={reCrack} seep={1} patch={reHole > 0 ? 0 : patch} holeWater={false} />
        {shovel > 0 && (
          <g transform={`translate(${c[0] + 120},${c[1] - 160}) rotate(${-30 + 50 * shovel})`} opacity={shovel}>
            <rect x={-8} y={-220} width={16} height={200} rx={6} fill="#8B5A3C" stroke="#111" strokeWidth={4} />
            <path d="M-50 -30 L50 -30 L40 40 Q0 70 -40 40 Z" fill="#9AA0A8" stroke="#111" strokeWidth={5} />
            <ellipse cx={0} cy={-10} rx={42} ry={18} fill="#2A2C30" />
          </g>
        )}
      </RoadStage>
      <Big lines={['O tapa-', 'buraco']} f={f} at={0} />
      <Pill text="NÃO TRATA A CAUSA" f={f} at={tCau - 4} x={420} y={600} bg={K.red} color="#fff" rot={-3} />
      {f >= tVo - 2 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(880,1100) scale(${loop}) rotate(${f * 6})`}>
            <path d="M-60 0 A60 60 0 1 1 0 60" stroke={K.yellow} strokeWidth={16} fill="none" strokeLinecap="round" />
            <path d="M-22 40 L0 66 L-30 84 Z" fill={K.yellow} />
          </g>
        </svg>
      )}
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const P6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tPr = wt(6, 'projeto'), tDr = wt(6, 'drenagem'), tMa = wt(6, 'manutencao'), tSe = wt(6, 'segue'), tAte = wt(6, 'ate');
  const fix = ease(f, 6, 40);
  const items: [string, number][] = [['Projeto', tPr], ['Drenagem', tDr], ['Manutenção', tMa]];
  const endStart = tSe - 4;
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[6] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={8} src="whoosh.wav" vol={0.4} />
      {items.map(([, t], i) => <Sfx key={i} at={t - 4} src="pop.wav" vol={0.45} />)}
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />

      <AbsoluteFill style={{opacity: 1 - end}}>
        <RoadStage y={980}><Road f={f} hole={1 - fix} cracks={1 - fix} seep={1 - fix} /><ConeIcon x={-330} y={150} /></RoadStage>
        <Big lines={['A solução']} accent={K.green} f={f} at={0} />
        {items.map(([t, at], i) => {
          if (f < at - 4) return null;
          const s = pop(f, at - 4, fps, 10);
          return (
            <div key={t} style={{position: 'absolute', top: 400 + i * 100, left: 120, display: 'flex', alignItems: 'center', gap: 18, scale: String(s), transformOrigin: 'left center'}}>
              <div style={{width: 72, height: 72, borderRadius: 36, background: K.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 44, color: '#0B3D25'}}>✓</div>
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 68, color: K.text, letterSpacing: -2}}>{t}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      {f >= endStart && (
        <AbsoluteFill style={{opacity: end}}>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <ConeIcon x={150} y={940} s={1.1} />
            <ConeIcon x={930} y={940} s={1.1} />
          </svg>
          <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, translate: `0 ${(1 - end) * 60}px`}}>
            <div style={{width: 300, height: 300, borderRadius: 150, overflow: 'hidden', background: K.card, border: `10px solid ${K.yellow}`, boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}><Raphael mouth={mouthAt(f + Math.round(STARTS[6] * FPS))} blink={blinkAt(f + Math.round(STARTS[6] * FPS))} /></div>
            <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 62, color: K.text}}>{HANDLE}</div>
            <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 36, color: K.grey, letterSpacing: 3}}>ENGENHARIA DE ESTRADA</div>
            <div style={{marginTop: 20, background: followed ? K.card : K.yellow, color: followed ? K.yellow : '#111', border: `5px solid ${K.yellow}`, fontFamily: 'InterD', fontWeight: 900, fontSize: 52, padding: '16px 80px', borderRadius: 999, scale: String(followed ? 0.94 + 0.06 * pop(f, tSe + 16, fps, 9) : 1)}}>{followed ? 'Seguindo ✓' : 'Seguir'}</div>
          </div>
          {f >= tAte - 2 && (
            <div style={{position: 'absolute', top: 960, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 96, color: K.yellow, letterSpacing: -3, scale: String(pop(f, tAte - 2, fps, 9))}}>Até o próximo!</div>
          )}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
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
      <div style={{width: SZ, height: SZ, borderRadius: SZ / 2, overflow: 'hidden', background: K.card, border: `9px solid ${K.yellow}`, boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}>
        <Raphael mouth={m} blink={blinkAt(g)} look={Math.sin(g / 70) * 0.6} />
      </div>
    </div>
  );
};

const SCENES = [P0, P1, P2, P3, P4, P5, P6];

const Main: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: K.bg}}>
      {SCENES.map((S, i) => (
        <Sequence key={i} from={Math.round(STARTS[i] * fps)} durationInFrames={Math.round(DURS[i] * fps)}>
          <S />
          {i > 0 && <Flash />}
        </Sequence>
      ))}
      <Meter />
      <Captions />
      <AvatarCorner />
      <Progress />
      <Audio src={staticFile('voice_pave.wav')} />
    </AbsoluteFill>
  );
};


const CapaPave01: React.FC = () => (
  <AbsoluteFill style={{background: K.bg}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(320).fill(0).map((_, i) => <circle key={i} cx={random('ax' + i) * 1080} cy={random('ay' + i) * 1920} r={1 + random('ar' + i) * 3} fill={random('ac' + i) > 0.5 ? K.grain : K.bg2} />)}
      {new Array(13).fill(0).map((_, i) => <rect key={i} x={60} y={i * 170 - 40} width={20} height={100} rx={4} fill={K.yellow} opacity={0.9} />)}
      <ellipse cx={590} cy={1490} rx={360} ry={42} fill="#000" opacity={0.35} />
      <g transform="translate(600,1115) scale(0.93)"><Road f={0} hole={1.15} cracks={1} seep={0.7} /><ConeIcon x={-330} y={150} s={1.1} /><ConeIcon x={330} y={-120} s={0.9} /></g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#01</div>
    </div>
    <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 122, color: K.text, letterSpacing: -6, lineHeight: 0.98}}>
      Por que o asfalto<br />
      do <span style={{display: 'inline-block', background: '#009C3B', color: '#FFDF00', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', border: '6px solid #FFDF00', boxShadow: '0 14px 36px rgba(0,156,59,0.45)', letterSpacing: -3, margin: '10px 0'}}>BRASIL</span><br />
      tem tanto <span style={{color: K.yellow}}>buraco?</span>
    </div>
    <div style={{position: 'absolute', top: 1575, left: 130, right: 80, display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 150, height: 150, borderRadius: 75, overflow: 'hidden', background: K.card, border: `7px solid ${K.yellow}`, flexShrink: 0}}><Raphael mouth={0} blink={0} /></div>
      <div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 44, color: K.text}}>{HANDLE}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 600, fontSize: 30, color: K.grey}}>Engenheiro civil explica</div>
      </div>
    </div>
  </AbsoluteFill>
);
export const Root: React.FC = () => (
  <>
    <Composition id="BuracoAsfalto" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave01" component={CapaPave01} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

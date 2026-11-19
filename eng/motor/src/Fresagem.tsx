import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-07-fresagem.json';
import mouthData from './mouth_pavimentacao-07-fresagem.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 07';

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

type RoadState = {f: number; top?: string; hole?: number; cracks?: number; seep?: number; puddle?: number; holeWater?: boolean; asphT?: number; patch?: number; sinkX?: number | null; fresh?: boolean};
const Road: React.FC<RoadState> = ({f, top = K.asphS, hole = 0, cracks = 0, seep = 0, puddle = 0, holeWater = true, asphT = 32, patch = 0, sinkX = null}) => {
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
      <Poly p={[[X0, Y0, 0], [X0 + W, Y0, 0], [X0 + W, Y0 + D, 0], [X0, Y0 + D, 0]]} fill={top} />
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
const LEVELS = [0.3, 0.45, 0.6, 0.65, 0.15, 0.08, 0.85, 0.92, 0.97];
const Meter: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let sc = 0;
  for (let i = 0; i < STARTS.length; i++) if (t >= STARTS[i]) sc = i;
  const enter = Math.round(STARTS[sc] * fps) + (sc === 8 ? 40 : 10);
  const p = spring({frame: f - enter, fps, config: {damping: 16, stiffness: 110}});
  const prev = sc > 0 ? LEVELS[sc - 1] : 1;
  const w = prev + (LEVELS[sc] - prev) * p;
  const col = w > 0.66 ? K.green : w > 0.35 ? K.amber : K.red;
  return (
    <div style={{position: 'absolute', top: 165, left: 120, right: 80, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 24, color: K.grey, letterSpacing: 4, whiteSpace: 'nowrap'}}>VIDA DO RECAPE</div>
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

const Tire: React.FC<{f: number; lift: number}> = ({f, lift}) => {
  const wob = lift * Math.sin(f / 3) * 5;
  return (
    <g transform={`translate(0,${-lift * 38}) rotate(${wob})`}>
      <path d="M-230 -200 Q-230 -330 0 -330 Q230 -330 230 -200 L230 -150 L190 -150 Q190 -290 0 -290 Q-190 -290 -190 -150 L-230 -150 Z" fill="#E63946" stroke="#111" strokeWidth={6} />
      <circle cx={0} cy={-150} r={150} fill="#1B1C1F" stroke="#111" strokeWidth={6} />
      <g transform={`translate(0,-150) rotate(${f * 14})`}>
        {new Array(16).fill(0).map((_, i) => <rect key={i} x={-8} y={-150} width={16} height={22} fill="#3A3D42" transform={`rotate(${i * 22.5})`} />)}
        <circle r={78} fill="#B9BDC2" stroke="#111" strokeWidth={5} />
        {new Array(5).fill(0).map((_, i) => <rect key={i} x={-9} y={-70} width={18} height={56} rx={6} fill="#8A9097" transform={`rotate(${i * 72})`} />)}
        <circle r={20} fill="#555" stroke="#111" strokeWidth={4} />
      </g>
    </g>
  );
};
const MOUTH: number[] = mouthData as number[];
const mouthAt = (g: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, g))] ?? 0;
const blinkAt = (g: number) => {
  const period = 96, k = Math.floor(g / period), start = k * period + Math.floor(random('bl' + k) * 50);
  const d = g - start;
  return d >= 0 && d < 5 ? [0.5, 1, 1, 0.5, 0.1][d] : 0;
};
const END_FRAME = Math.round(STARTS[8] * FPS) + Math.min(wt(8, 'segue'), wt(8, 'comenta')) - 4;
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

const Note: React.FC<{text: string}> = ({text}) => <div style={{position: 'absolute', top: 480, left: 124, fontFamily: 'InterD', fontWeight: 600, fontSize: 28, color: K.grey}}>{text}</div>;
const Check: React.FC<{ok: boolean; size?: number}> = ({ok, size = 64}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: ok ? K.green : K.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: size * 0.62, color: ok ? '#0B3D25' : '#fff'}}>{ok ? '✓' : '✕'}</div>
);

// ---------- mistura asfáltica em close ----------
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const lerpC = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`; };
const binderCol = (age: number) => lerpC('#121316', '#5B5D62', age);
const STONES = new Array(46).fill(0).map((_, i) => {
  const cx = -350 + random('mx' + i) * 700, cy = -165 + random('my' + i) * 330, r = 24 + random('mr' + i) * 26;
  const n = 7;
  const p = new Array(n).fill(0).map((__, k) => { const a = (k / n) * Math.PI * 2 + random(`ma${i}`); const rr = r * (0.72 + random(`mq${i}-${k}`) * 0.4); return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.85).toFixed(1)}`; }).join(' ');
  return {cx, cy, r, p, col: ['#8E9399', '#A9ADB2', '#7A7F86', '#B8B2A6'][i % 4]};
});
type MixP = {f: number; stones?: number; binder?: number; film?: number; age?: number; oil?: number; cracks?: number; topWear?: number};
const Mix: React.FC<MixP> = ({f, stones = 1, binder = 1, film = 1, age = 0, oil = 0, cracks = 0, topWear = 0}) => {
  const bc = binderCol(age);
  return (
    <g>
      <defs><clipPath id="mixclip"><rect x={-380} y={-190} width={760} height={380} rx={26} /></clipPath></defs>
      <rect x={-380} y={-190} width={760} height={380} rx={26} fill="#2B2E33" stroke="#111" strokeWidth={6} />
      <g clipPath="url(#mixclip)">
        <rect x={-380} y={190 - 380 * binder} width={760} height={380 * binder} fill={bc} />
        {STONES.map((s, i) => {
          const sc = interpolate(stones, [i / 60, i / 60 + 0.25], [0, 1], clamp);
          if (sc <= 0) return null;
          const wear = s.cy < -90 ? topWear : 0;
          const fo = Math.max(0, film * binder * (1 - wear));
          return (
            <g key={i} transform={`translate(${s.cx},${s.cy}) scale(${sc}) translate(${-s.cx},${-s.cy})`}>
              <polygon points={s.p} fill={s.col} stroke={bc} strokeWidth={4 + 10 * fo} strokeLinejoin="round" />
              <polygon points={s.p} fill={bc} opacity={fo * 0.94} />
              <circle cx={s.cx - s.r * 0.3} cy={s.cy - s.r * 0.3} r={s.r * 0.18} fill="#fff" opacity={0.25 * (1 - fo)} />
            </g>
          );
        })}
        {oil > 0 && new Array(12).fill(0).map((_, i) => {
          const ph = ((f * 1.1 + i * 9) % 40) / 40;
          const x = -330 + random('ox' + i) * 660;
          return <ellipse key={i} cx={x + Math.sin(f / 8 + i) * 8} cy={150 - ph * 380} rx={11} ry={15} fill="#C99A2E" stroke="#5A3F0A" strokeWidth={3} opacity={oil * (1 - ph)} />;
        })}
        {cracks > 0 && [[-300, -190, -250, -60, -280, 40], [20, -190, 60, -80, 10, 30, 50, 120], [250, -190, 210, -40, 260, 60]].map((c, i) => {
          const ps: P2[] = []; for (let k = 0; k < c.length; k += 2) ps.push([c[k], c[k + 1]]);
          const q = partial(ps, interpolate(cracks, [i * 0.15, i * 0.15 + 0.6], [0, 1], clamp));
          return q.length > 1 ? <path key={i} d={path(q)} stroke="#0A0A0A" strokeWidth={9} fill="none" strokeLinecap="round" /> : null;
        })}
      </g>
    </g>
  );
};
// faixa de pista vista de cima
const DOTS = new Array(150).fill(0).map((_, i) => ({x: random('px' + i), y: random('py' + i), r: 4 + random('pr' + i) * 9, c: ['#8E9399', '#A9ADB2', '#7A7F86'][i % 3]}));
const Patch: React.FC<{x: number; y: number; w: number; h: number; film: number; age: number; label?: string; lc?: string}> = ({x, y, w, h, film, age, label, lc = K.yellow}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={22} fill={binderCol(age)} stroke="#111" strokeWidth={6} />
    {DOTS.map((d, i) => <circle key={i} cx={x + 14 + d.x * (w - 28)} cy={y + 14 + d.y * (h - 28)} r={d.r} fill={lerpC('#1A1B1E', d.c, 1 - film)} />)}
    {new Array(4).fill(0).map((_, i) => <rect key={i} x={x + 30 + i * (w / 4)} y={y + h / 2 - 8} width={w / 8} height={16} fill={K.yellow} opacity={0.35 + 0.6 * film} />)}
    {label && <text x={x + 26} y={y + 62} fontFamily="InterD" fontWeight={900} fontSize={48} fill={lc}>{label}</text>}
  </g>
);
const Sun: React.FC<{f: number; x: number; y: number; s?: number}> = ({f, x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <g transform={`rotate(${f * 2})`}>{new Array(12).fill(0).map((_, i) => <rect key={i} x={-8} y={-128} width={16} height={40} rx={8} fill={K.yellow} transform={`rotate(${i * 30})`} />)}</g>
    <circle r={78} fill={K.yellow} stroke="#111" strokeWidth={6} />
    <circle r={58} fill="#FFD84D" />
  </g>
);
const Barrel: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-70} y={-100} width={140} height={200} rx={18} fill="#1E2024" stroke="#111" strokeWidth={6} />
    {[-55, 0, 55].map((yy) => <rect key={yy} x={-74} y={yy - 7} width={148} height={14} rx={6} fill={K.yellow} stroke="#111" strokeWidth={4} />)}
    <path d="M0 -40 Q26 -6 0 18 Q-26 -6 0 -40 Z" fill="#000" stroke={K.yellow} strokeWidth={4} transform="translate(0,6)" />
  </g>
);
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => <svg width={1080} height={1920} style={{position: 'absolute'}}>{children}</svg>;
const shotOf = (f: number, ps: number[]) => ps.filter((p, i) => i > 0 && f >= p - 3).length;
const phr = (sc: number) => { const ps = phraseStarts(sc); return ps.map((p, i) => (i === 0 ? 0 : p - 3)); };

// ================= COMPACTAÇÃO (vista lateral) =================
const GY = 1030; // topo da base
const Ground: React.FC<{th: (x: number) => number; hot?: number; f: number; marks?: (x: number) => number; matFrom?: number; matTo?: number; water?: number}> = ({th, hot = 0, f, marks, matFrom = -600, matTo = 1680, water = 0}) => {
  const xs2 = new Array(91).fill(0).map((_, i) => matFrom + (i / 90) * (matTo - matFrom));
  const top = (x: number) => GY - th(x);
  return (
    <g>
      <rect x={-600} y={GY + 70} width={2280} height={60} fill={K.sub} stroke="#111" strokeWidth={4} />
      <rect x={-600} y={GY} width={2280} height={70} fill={K.base} stroke="#111" strokeWidth={4} />
      {new Array(26).fill(0).map((_, i) => <circle key={i} cx={random('bx' + i) * 1080} cy={GY + 12 + random('by' + i) * 50} r={4 + random('br' + i) * 5} fill="rgba(0,0,0,0.2)" />)}
      {matTo > matFrom && <polygon points={[...xs2.map((x) => `${x},${top(x)}`), `${matTo},${GY}`, `${matFrom},${GY}`].join(' ')} fill={lerpC('#1E2024', '#2A1E18', hot)} stroke="#111" strokeWidth={4} strokeLinejoin="round" />}
      {matTo > matFrom && DOTS.slice(0, 70).map((d, i) => { const x = matFrom + d.x * (matTo - matFrom); const t = th(x); return <circle key={i} cx={x} cy={GY - 6 - d.y * Math.max(0, t - 12)} r={d.r * 0.45} fill="#4A4E55" />; })}
      {marks && xs2.filter((_, i) => i % 2 === 0).map((x, i) => { const m = marks(x); return m > 0 ? <rect key={i} x={x - 6} y={top(x) - 3} width={12} height={6} fill="#5A5E66" opacity={m} /> : null; })}
      {hot > 0 && matTo > matFrom && new Array(10).fill(0).map((_, i) => {
        const x = matFrom + ((i + 0.5) / 10) * (matTo - matFrom);
        const ph = ((f + i * 11) % 45) / 45;
        const y0 = top(x) - 10 - ph * 140;
        return <path key={i} d={`M${x},${y0 + 40} q16,-14 0,-28 q-16,-14 0,-28`} stroke="#E8E8E8" strokeWidth={8} fill="none" strokeLinecap="round" opacity={hot * 0.55 * (1 - ph)} />;
      })}
      {water > 0 && new Array(14).fill(0).map((_, i) => {
        const x = 40 + i * 75 + random('wx' + i) * 30;
        const ph = ((f * 1.3 + i * 13) % 30) / 30;
        return <g key={i}><line x1={x} y1={top(x) - 340 + ph * 300} x2={x - 6} y2={top(x) - 310 + ph * 300} stroke="#9FD3F7" strokeWidth={5} strokeLinecap="round" opacity={water} />
          {ph > 0.85 && <circle cx={x} cy={top(x) - 6} r={8 + (ph - 0.85) * 120} fill="none" stroke="#9FD3F7" strokeWidth={3} opacity={water * (1 - ph) * 5} />}</g>;
      })}
    </g>
  );
};
const Drum: React.FC<{cx: number; r: number; f: number; steel?: boolean}> = ({cx, r, f, steel}) => (
  <g transform={`translate(${cx},${-r}) rotate(${f * 9})`}>
    <circle r={r} fill={steel ? '#B9BDC2' : '#1B1C1F'} stroke="#111" strokeWidth={6} />
    {steel ? <><circle r={r * 0.55} fill="#8A9097" stroke="#111" strokeWidth={4} /><rect x={-5} y={-r} width={10} height={r * 0.45} fill="#6B7078" /></>
      : <><circle r={r * 0.5} fill="#B9BDC2" stroke="#111" strokeWidth={4} />{new Array(10).fill(0).map((_, i) => <rect key={i} x={-5} y={-r} width={10} height={12} fill="#3A3D42" transform={`rotate(${i * 36})`} />)}</>}
  </g>
);
const Roller: React.FC<{x: number; y?: number; f: number; kind: 'liso' | 'pneus'; s?: number; flip?: boolean; bounce?: number}> = ({x, y = GY, f, kind, s = 1, flip, bounce = 0}) => {
  const steel = kind === 'liso';
  const r = steel ? 78 : 52;
  const vib = steel ? Math.sin(f * 2.2) * 1.5 : 0;
  return (
    <g transform={`translate(${x},${y + vib - bounce}) scale(${flip ? -s : s},${s})`}>
      {steel ? <><Drum cx={-120} r={r} f={f} steel /><Drum cx={120} r={r} f={f} steel /></> : <><Drum cx={-150} r={r} f={f} /><Drum cx={-90} r={r} f={f} /><Drum cx={95} r={r} f={f} /><Drum cx={155} r={r} f={f} /></>}
      <rect x={-200} y={-r * 2 - 70} width={400} height={86} rx={16} fill={K.yellow} stroke="#111" strokeWidth={6} />
      <rect x={-200} y={-r * 2 - 70} width={400} height={20} rx={8} fill="#E0A800" />
      <rect x={-70} y={-r * 2 - 210} width={140} height={140} rx={10} fill="#2B2E33" stroke="#111" strokeWidth={6} />
      <rect x={-52} y={-r * 2 - 192} width={104} height={70} rx={6} fill="#9FD3F7" stroke="#111" strokeWidth={4} />
      <rect x={-86} y={-r * 2 - 226} width={172} height={22} rx={8} fill={K.yellow} stroke="#111" strokeWidth={5} />
      <g transform={flip ? 'scale(-1,1)' : ''}><text x={0} y={-r * 2 - 14} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={44} fill="#111">{steel ? 'LISO' : 'PNEUS'}</text></g>
      <circle cx={0} cy={-r * 2 - 236} r={12} fill={K.amber} opacity={Math.floor(f / 6) % 2 ? 1 : 0.35} />
    </g>
  );
};
const Paver: React.FC<{x: number; f: number}> = ({x, f}) => (
  <g transform={`translate(${x},${GY})`}>
    <rect x={-170} y={-54} width={330} height={54} rx={26} fill="#2B2E33" stroke="#111" strokeWidth={5} />
    {[-140, -80, -20, 40, 100].map((wx) => <g key={wx} transform={`translate(${wx + 10},-27) rotate(${f * 10})`}><circle r={18} fill="#555" stroke="#111" strokeWidth={3} /><rect x={-3} y={-16} width={6} height={32} fill="#222" /></g>)}
    <rect x={-160} y={-200} width={300} height={150} rx={14} fill={K.yellow} stroke="#111" strokeWidth={6} />
    <path d="M140 -190 L250 -250 L250 -110 L140 -80 Z" fill="#E0A800" stroke="#111" strokeWidth={6} strokeLinejoin="round" />
    <path d="M150 -180 L240 -230 L240 -200 L150 -160 Z" fill="#2A1E18" />
    <rect x={-270} y={-60} width={120} height={50} rx={6} fill="#8A9097" stroke="#111" strokeWidth={5} />
    <rect x={-100} y={-300} width={130} height={100} rx={8} fill="#2B2E33" stroke="#111" strokeWidth={5} />
    <rect x={-120} y={-316} width={170} height={20} rx={8} fill={K.yellow} stroke="#111" strokeWidth={5} />
    <text x={-10} y={-110} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={38} fill="#111">ACABADORA</text>
  </g>
);
const DumpTruck: React.FC<{x: number; tilt: number; f: number; pour: number}> = ({x, tilt, f, pour}) => (
  <g transform={`translate(${x},${GY})`}>
    {[-150, -80, 120].map((wx) => <g key={wx} transform={`translate(${wx},-34) rotate(${f * 8})`}><circle r={34} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><circle r={14} fill="#B9BDC2" /></g>)}
    <rect x={-210} y={-82} width={400} height={30} rx={6} fill="#444" stroke="#111" strokeWidth={4} />
    <path d="M70 -82 L70 -220 L150 -220 L195 -150 L195 -82 Z" fill="#E63946" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M86 -205 L140 -205 L172 -155 L86 -155 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    <g transform={`translate(-210,-82) rotate(${-tilt * 38})`}>
      <path d="M0 0 L270 0 L270 -150 L0 -150 Z" fill="#C8303A" stroke="#111" strokeWidth={6} />
      <path d="M10 -150 Q130 -200 260 -150 Z" fill="#2A1E18" stroke="#111" strokeWidth={4} />
    </g>
    {pour > 0 && new Array(26).fill(0).map((_, i) => {
      const ph = ((f * 1.2 + i * 7) % 26) / 26;
      return <circle key={i} cx={-215 - random('pq' + i) * 40 - ph * 30} cy={-150 + ph * 150} r={7 + random('pr2' + i) * 7} fill={i % 3 ? '#2A1E18' : '#5A4A40'} opacity={pour} />;
    })}
  </g>
);
const Thermo: React.FC<{x: number; y: number; v: number; s?: number}> = ({x, y, v, s = 1}) => {
  const col = v > 0.6 ? K.red : v > 0.35 ? K.amber : K.blue;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-34} y={-260} width={68} height={280} rx={34} fill="#fff" stroke="#111" strokeWidth={8} />
      <rect x={-16} y={-240 + 230 * (1 - v)} width={32} height={230 * v + 20} rx={16} fill={col} />
      <circle cx={0} cy={40} r={56} fill={col} stroke="#111" strokeWidth={8} />
    </g>
  );
};
// close-up: pedras + ar
const VS = new Array(28).fill(0).map((_, i) => ({u: (i % 7 + (Math.floor(i / 7) % 2) * 0.5) / 7 + 0.05, v: Math.floor(i / 7) / 4 + 0.1, r: 30 + random('vr' + i) * 16, c: ['#8E9399', '#A9ADB2', '#7A7F86', '#B8B2A6'][i % 4], k: random('vk' + i)}));
const VB = new Array(22).fill(0).map((_, i) => ({u: random('bu' + i), v: random('bv' + i), r: 14 + random('bR' + i) * 14}));
const Voids: React.FC<{x: number; y: number; p: number; f: number; s?: number; airLeft?: number}> = ({x, y, p, f, s = 1, airLeft}) => {
  const W2 = 720, H0 = 470, H1 = 330;
  const H = H0 + (H1 - H0) * p;
  const air = airLeft ?? 1 - 0.85 * p;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs><clipPath id="vclip"><rect x={-W2 / 2} y={-H} width={W2} height={H} rx={24} /></clipPath></defs>
      <rect x={-W2 / 2} y={-H} width={W2} height={H} rx={24} fill="#141518" stroke={K.yellow} strokeWidth={8} />
      <g clipPath="url(#vclip)">
        {VS.map((st, i) => {
          const jit = (1 - p) * (st.k - 0.5) * 30;
          const cx = -W2 / 2 + st.u * W2 + jit, cy = -H + (st.v * (H - 20)) + 30 + (1 - p) * 10;
          return <circle key={i} cx={cx} cy={cy} r={st.r * (0.9 + 0.25 * p)} fill={st.c} stroke="#0A0A0A" strokeWidth={6} />;
        })}
        {VB.map((b, i) => {
          const rr = b.r * air * (1 + 0.08 * Math.sin(f / 4 + i));
          return rr > 1 ? <circle key={i} cx={-W2 / 2 + b.u * W2} cy={-H + 20 + b.v * (H - 40)} r={rr} fill="#FFFFFF" opacity={0.85} stroke="#9FD3F7" strokeWidth={3} /> : null;
        })}
      </g>
    </g>
  );
};
const Zoom: React.FC<{z: number; dy?: number; dx?: number; children: React.ReactNode}> = ({z, dy = 0, dx = 0, children}) => <g transform={`translate(${540 + dx},${GY + dy}) scale(${z}) translate(-540,${-GY})`}>{children}</g>;
const DownArrows: React.FC<{f: number; at: number; y: number}> = ({f, at, y}) => f < at ? null : (
  <g>{[-220, 0, 220].map((dx, i) => { const ph = ((f - at + i * 5) % 18) / 18; return <path key={i} d={`M${540 + dx},${y + ph * 40} l-34,-44 h22 v-60 h24 v60 h22 Z`} fill={K.yellow} stroke="#111" strokeWidth={4} opacity={1 - ph * 0.6} />; })}</g>
);
const BigNum: React.FC<{text: string; f: number; at: number; top: number; color?: string; size?: number}> = ({text, f, at, top, color = K.yellow, size = 190}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  return <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: size, color, letterSpacing: -6, scale: String(pop(f, at, fps, 9)), textShadow: '0 12px 30px rgba(0,0,0,0.5)'}}>{text}</div>;
};

// ================= FRESAGEM =================
const OLD = 56, CUT = 36, MT = GY - OLD + CUT;
const OLDC = '#62656C';
const CRX = [70, 220, 380, 540, 690, 850, 1000, 1150];
const crackPath = (x0: number, top: number, depth: number, seed: string) => {
  let s = `M${x0},${top}`; let x = x0;
  for (let k = 1; k <= 4; k++) { x += (random(seed + k) - 0.5) * 22; s += ` L${x},${top + (depth * k) / 4}`; }
  return s;
};
const CHUNKS = new Array(60).fill(0).map((_, i) => ({u: random('cu' + i), w: 8 + random('cw' + i) * 12, h: 6 + random('ch' + i) * 8, r: random('cr' + i) * 60}));
type RoadP = {f: number; millFrom?: number; millTo?: number; cracks?: boolean; debrisFrom?: number; debrisTo?: number; tackFrom?: number; tackTo?: number; newFrom?: number; newTo?: number; hot?: number};
const MillRoad: React.FC<RoadP> = ({f, millFrom = -600, millTo = -600, cracks = true, debrisFrom = 0, debrisTo = 0, tackFrom = 0, tackTo = 0, newFrom = 0, newTo = 0, hot = 0}) => {
  const a = Math.max(-600, millFrom), b = Math.min(1680, millTo);
  const has = b > a;
  const milled = (x: number) => has && x >= a && x <= b;
  const T = GY - OLD;
  const poly = has ? [[-600, T], [a, T], [a, MT], [b, MT], [b, T], [1680, T], [1680, GY], [-600, GY]] : [[-600, T], [1680, T], [1680, GY], [-600, GY]];
  const ta = Math.max(a, tackFrom), tb = Math.min(b, tackTo);
  const na = newFrom, nb = newTo;
  return (
    <g>
      <rect x={-600} y={GY + 70} width={2280} height={80} fill={K.sub} stroke="#111" strokeWidth={4} />
      <rect x={-600} y={GY} width={2280} height={70} fill={K.base} stroke="#111" strokeWidth={4} />
      {new Array(30).fill(0).map((_, i) => <circle key={i} cx={-300 + random('bx' + i) * 1700} cy={GY + 12 + random('by' + i) * 50} r={4 + random('br' + i) * 5} fill="rgba(0,0,0,0.2)" />)}
      <polygon points={poly.map((p) => p.join(',')).join(' ')} fill={OLDC} stroke="#111" strokeWidth={4} strokeLinejoin="round" />
      {DOTS.slice(0, 90).map((d, i) => { const x = -400 + d.x * 1900; const y = T + 6 + d.y * (OLD - 12); if (milled(x) && y < MT + 3) return null; return <circle key={i} cx={x} cy={y} r={d.r * 0.4} fill="#8A8E95" />; })}
      {cracks && CRX.map((x, i) => (milled(x) || milled(x + 15) || milled(x - 15)) ? null : <path key={i} d={crackPath(x, T, CUT - 4, 'k' + i)} stroke="#111" strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
      {has && new Array(Math.max(0, Math.floor((b - a) / 18))).fill(0).map((_, i) => <path key={i} d={`M${a + 9 + i * 18},${MT} l6,7 l6,-7`} stroke="#44474D" strokeWidth={3} fill="none" />)}
      {has && CHUNKS.map((c, i) => { const x = a + c.u * (b - a); if (x < debrisFrom || x > debrisTo) return null; return <rect key={i} x={x} y={MT - c.h} width={c.w} height={c.h} rx={2} fill={i % 2 ? '#7A7E86' : '#55585F'} stroke="#111" strokeWidth={2} transform={`rotate(${c.r - 30},${x},${MT})`} />; })}
      {tb > ta && <g><rect x={ta} y={MT - 7} width={tb - ta} height={8} fill="#2A160A" /><rect x={ta} y={MT - 7} width={tb - ta} height={2} fill="#B07A4A" opacity={0.8} /></g>}
      {nb > na && <g>
        <rect x={na} y={T - 6} width={nb - na} height={MT - T + 6} fill="#1C1E22" stroke="#111" strokeWidth={4} />
        {DOTS.slice(90, 140).map((d, i) => { const x = na + d.x * (nb - na); return <circle key={i} cx={x} cy={T + d.y * (CUT - 6)} r={d.r * 0.35} fill="#3A3D44" />; })}
        {hot > 0 && new Array(6).fill(0).map((_, i) => { const x = na + ((i + 0.5) / 6) * (nb - na); const ph = ((f + i * 11) % 45) / 45; const y0 = T - 20 - ph * 120; return <path key={i} d={`M${x},${y0 + 40} q16,-14 0,-28 q-16,-14 0,-28`} stroke="#E8E8E8" strokeWidth={8} fill="none" strokeLinecap="round" opacity={hot * 0.5 * (1 - ph)} />; })}
      </g>}
    </g>
  );
};
const Track: React.FC<{cx: number; y: number; f: number}> = ({cx, y, f}) => (
  <g transform={`translate(${cx},${y})`}>
    <rect x={-90} y={-60} width={180} height={60} rx={30} fill="#1B1C1F" stroke="#111" strokeWidth={5} />
    {[-55, 0, 55].map((wx) => <g key={wx} transform={`translate(${wx},-30) rotate(${f * 10})`}><circle r={20} fill="#555" stroke="#111" strokeWidth={3} /><rect x={-3} y={-18} width={6} height={36} fill="#222" /></g>)}
  </g>
);
const R_DR = 64;
const TeethDrum: React.FC<{r: number; f: number; n?: number}> = ({r, f, n = 14}) => (
  <g transform={`rotate(${f * 14})`}>
    <circle r={r} fill="#8A9097" stroke="#111" strokeWidth={Math.max(4, r / 14)} />
    <circle r={r * 0.62} fill="#6B7078" stroke="#111" strokeWidth={Math.max(3, r / 20)} />
    {new Array(n).fill(0).map((_, i) => <g key={i} transform={`rotate(${(i * 360) / n})`}>
      <path d={`M${-r * 0.1},${-r + 2} L${-r * 0.1},${-r * 1.14} L${r * 0.16},${-r * 1.24} L${r * 0.12},${-r + 2} Z`} fill="#C9CDD2" stroke="#111" strokeWidth={Math.max(3, r / 22)} strokeLinejoin="round" />
    </g>)}
    <circle r={r * 0.16} fill="#333" />
  </g>
);
const Flying: React.FC<{f: number; x: number; y: number; s?: number; n?: number}> = ({f, x, y, s = 1, n = 12}) => (
  <g>{new Array(n).fill(0).map((_, i) => {
    const ph = ((f + i * 5) % 18) / 18;
    const vx = 60 + random('fx' + i) * 140, vy = 90 + random('fy' + i) * 120;
    return <rect key={i} x={x + vx * ph * s} y={y - (vy * ph - 120 * ph * ph) * s} width={(8 + random('fw' + i) * 10) * s} height={(6 + random('fh' + i) * 8) * s} fill={i % 2 ? '#7A7E86' : '#55585F'} stroke="#111" strokeWidth={2} opacity={1 - ph * 0.6} transform={`rotate(${f * 20 + i * 40},${x + vx * ph * s},${y - (vy * ph - 120 * ph * ph) * s})`} />;
  })}</g>
);
const Fresadora: React.FC<{x: number; f: number; s?: number; load?: boolean; spray?: number}> = ({x, f, s = 1, load = true, spray = 0}) => {
  const bl = Math.floor(f / 6) % 2 ? 1 : 0.35;
  return (
    <g transform={`translate(${x},${GY - OLD}) scale(${s})`}>
      <g transform="translate(240,-180) rotate(-28)">
        <rect x={0} y={-22} width={430} height={44} rx={12} fill="#2B2E33" stroke="#111" strokeWidth={5} />
        {load && new Array(9).fill(0).map((_, i) => { const p = (f * 6 + i * 48) % 430; return <rect key={i} x={p} y={-36} width={18} height={14} rx={3} fill={i % 2 ? '#7A7E86' : '#55585F'} stroke="#111" strokeWidth={2} />; })}
        <rect x={400} y={-30} width={50} height={60} rx={8} fill={K.yellow} stroke="#111" strokeWidth={5} />
      </g>
      <rect x={-110} y={-110} width={200} height={110 + CUT - 20} rx={10} fill="#3A3D42" stroke="#111" strokeWidth={5} opacity={0.55} strokeDasharray="12 8" />
      <g transform={`translate(-10,${CUT - R_DR})`}><TeethDrum r={R_DR} f={f} n={12} /></g>
      {spray > 0 && new Array(6).fill(0).map((_, i) => { const ph = ((f * 1.5 + i * 6) % 14) / 14; return <line key={i} x1={-80 + i * 28} y1={-100 + ph * 40} x2={-84 + i * 28} y2={-80 + ph * 40} stroke="#9FD3F7" strokeWidth={6} strokeLinecap="round" opacity={spray * (1 - ph)} />; })}
      {load && <Flying f={f} x={50} y={CUT - 40} />}
      <Track cx={-260} y={CUT} f={f} />
      <Track cx={170} y={0} f={f} />
      <rect x={-350} y={-260} width={610} height={150} rx={18} fill={K.yellow} stroke="#111" strokeWidth={6} />
      <rect x={-350} y={-260} width={610} height={26} rx={10} fill="#E0A800" />
      <text x={-30} y={-158} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={50} fill="#111">FRESADORA</text>
      <rect x={-310} y={-400} width={170} height={140} rx={10} fill="#2B2E33" stroke="#111" strokeWidth={6} />
      <rect x={-292} y={-382} width={134} height={70} rx={6} fill="#9FD3F7" stroke="#111" strokeWidth={4} />
      <rect x={-330} y={-418} width={210} height={22} rx={8} fill={K.yellow} stroke="#111" strokeWidth={5} />
      <circle cx={-225} cy={-432} r={13} fill={K.amber} opacity={bl} />
    </g>
  );
};
// conveyor end (relative to fresadora x, in GY space)
const convEnd = (mx: number): P2 => [mx + 240 + 450 * Math.cos(0.4887), GY - OLD - 180 - 450 * Math.sin(0.4887)];
const Sweeper: React.FC<{x: number; f: number}> = ({x, f}) => (
  <g transform={`translate(${x},${MT})`}>
    {[-110, 120].map((wx) => <g key={wx} transform={`translate(${wx},-38) rotate(${f * 8})`}><circle r={38} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><circle r={15} fill="#B9BDC2" /></g>)}
    <rect x={-200} y={-200} width={300} height={130} rx={14} fill="#F1F1F1" stroke="#111" strokeWidth={5} />
    <path d="M100 -76 L100 -200 L170 -200 L205 -140 L205 -76 Z" fill={K.yellow} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M114 -186 L160 -186 L186 -144 L114 -144 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    <text x={-50} y={-122} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={40} fill="#111">VASSOURA</text>
    <g transform={`translate(-240,-44) rotate(${-f * 25})`}>
      <circle r={44} fill="#C99700" stroke="#111" strokeWidth={4} />
      {new Array(12).fill(0).map((_, i) => <line key={i} x1={0} y1={0} x2={0} y2={-56} stroke="#5A4A20" strokeWidth={5} transform={`rotate(${i * 30})`} />)}
    </g>
    {new Array(6).fill(0).map((_, i) => { const ph = ((f + i * 6) % 30) / 30; return <circle key={i} cx={-300 - ph * 80} cy={-30 - ph * 90} r={14 + ph * 30} fill="#B8B2A6" opacity={0.5 * (1 - ph)} />; })}
  </g>
);
const Sprayer: React.FC<{x: number; f: number}> = ({x, f}) => (
  <g transform={`translate(${x},${MT})`}>
    {[-150, -70, 140].map((wx) => <g key={wx} transform={`translate(${wx},-36) rotate(${f * 8})`}><circle r={36} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><circle r={14} fill="#B9BDC2" /></g>)}
    <rect x={-230} y={-90} width={430} height={26} rx={6} fill="#444" stroke="#111" strokeWidth={4} />
    <rect x={-225} y={-220} width={310} height={130} rx={65} fill="#2B2E33" stroke="#111" strokeWidth={5} />
    <text x={-70} y={-140} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={34} fill={K.yellow}>EMULSÃO</text>
    <path d="M100 -90 L100 -220 L170 -220 L215 -150 L215 -90 Z" fill="#E63946" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M114 -206 L160 -206 L192 -156 L114 -156 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    <rect x={-262} y={-74} width={40} height={14} fill="#111" />
    <rect x={-270} y={-60} width={50} height={10} fill="#555" />
    {new Array(10).fill(0).map((_, i) => { const ph = ((f * 1.4 + i * 5) % 16) / 16; return <circle key={i} cx={-265 + (i % 5) * 10 - ph * 30} cy={-50 + ph * 46} r={5} fill="#5A3416" opacity={1 - ph * 0.4} />; })}
  </g>
);
const Dim: React.FC<{x: number; y1: number; y2: number; f: number; at: number}> = ({x, y1, y2, f, at}) => {
  const p = ease(f, at, at + 10);
  if (p <= 0) return null;
  const m = (y1 + y2) / 2, h = ((y2 - y1) / 2) * p;
  return <g stroke={K.yellow} strokeWidth={6} fill={K.yellow}><line x1={x} y1={m - h} x2={x} y2={m + h} /><line x1={x - 22} y1={m - h} x2={x + 22} y2={m - h} /><line x1={x - 22} y1={m + h} x2={x + 22} y2={m + h} /></g>;
};

// ---------- cenas ----------
const S0: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[0] * FPS);
  const mx = interpolate(f, [0, total], [330, 720]);
  return (
    <SceneIn>
      <Bg />
      <Sfx at={0} src="truck.wav" vol={0.45} dur={total} />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      {[4, 16, 28, 40, 52, 64, 76, 88, 100].map((d) => <Sfx key={d} at={d} src="tick.wav" vol={0.3} />)}
      <Svg>
        <Zoom z={1.2 + 0.1 * ease(f, 0, total)} dy={90} dx={-40}>
          <MillRoad f={f} millFrom={-600} millTo={mx - 10} debrisFrom={mx - 180} debrisTo={mx} />
          <Fresadora x={mx} f={f} />
        </Zoom>
      </Svg>
      <Header />
      <Big lines={['Por que', 'RASPA o asfalto?']} accent={K.yellow} f={f} at={0} size={104} />
      <Pill text="FRESAGEM" f={f} at={8} x={130} y={480} bg={K.card} color="#fff" size={44} rot={-3} />
    </SceneIn>
  );
};
const DrumClose: React.FC<{f: number; spray?: number; cut?: number}> = ({f, spray = 0, cut = 1}) => {
  const cx = 540, cy = 780, r = 220;
  const bottom = cy + r * 1.1;
  const top = bottom - 70;
  return (
    <g>
      <rect x={0} y={bottom + 80} width={1080} height={120} fill={K.base} stroke="#111" strokeWidth={4} />
      <polygon points={`0,${bottom} ${cx},${bottom} ${cx},${top} 1080,${top} 1080,${bottom + 80} 0,${bottom + 80}`} fill={OLDC} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
      {[700, 860, 1000].map((x, i) => <path key={i} d={crackPath(x, top, 60, 'dc' + i)} stroke="#111" strokeWidth={8} fill="none" />)}
      {new Array(12).fill(0).map((_, i) => <path key={i} d={`M${20 + i * 42},${bottom} l10,10 l10,-10`} stroke="#44474D" strokeWidth={4} fill="none" />)}
      <path d={`M${cx - r - 60},${cy + 30} L${cx - r - 60},${cy - 60} Q${cx},${cy - r - 140} ${cx + r + 60},${cy - 60} L${cx + r + 60},${cy + 30}`} fill="none" stroke="#2B2E33" strokeWidth={34} strokeLinejoin="round" />
      <g transform={`translate(${cx},${cy})`}><TeethDrum r={r} f={f * cut} n={16} /></g>
      {cut > 0 && <Flying f={f} x={cx + r * 0.7} y={top - 10} s={2.4} n={14} />}
      {spray > 0 && new Array(9).fill(0).map((_, i) => { const ph = ((f * 1.5 + i * 5) % 14) / 14; const x = cx - 240 + i * 60; return <g key={i}><rect x={x - 14} y={cy - r - 150} width={28} height={30} fill="#111" /><line x1={x} y1={cy - r - 110 + ph * 90} x2={x - 6} y2={cy - r - 70 + ph * 90} stroke="#9FD3F7" strokeWidth={10} strokeLinecap="round" opacity={spray * (1 - ph * 0.7)} /></g>; })}
      {spray > 0 && new Array(5).fill(0).map((_, i) => { const ph = ((f + i * 9) % 40) / 40; return <circle key={i} cx={cx + 280 + ph * 120} cy={top - 40 - ph * 200} r={30 + ph * 50} fill="#C8C3B8" opacity={0.35 * (1 - ph) * (1 - spray * 0.7)} />; })}
    </g>
  );
};
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[1] * FPS);
  const c1 = wt(1, 'embaixo') - 3;
  const shot = f >= c1 ? 1 : 0;
  const mx = interpolate(f, [0, c1], [-100, 460], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="truck.wav" vol={0.5} dur={c1} />
      <Sfx at={c1} src="whoosh.wav" vol={0.5} />
      <Sfx at={c1 + 2} src="truck.wav" vol={0.3} dur={total - c1} />
      {[10, 20, 30, 40, 50].map((d) => <Sfx key={d} at={c1 + d} src="tick.wav" vol={0.35} />)}
      <Svg>
        {shot === 0 && <Zoom z={1.2} dy={90} dx={-40}><MillRoad f={f} millTo={mx - 10} /><Fresadora x={mx} f={f} load={false} /></Zoom>}
        {shot === 1 && <g transform={`translate(540,880) scale(${0.95 + 0.08 * ease(f, c1, total)}) translate(-540,-880)`}><DrumClose f={f} /></g>}
      </Svg>
      {shot === 0 && <Big lines={['Isso é a', 'FRESADORA']} accent={K.yellow} f={f} at={0} />}
      {shot === 1 && <Big lines={['Rolo cheio', 'de DENTES']} accent={K.yellow} f={f} at={c1} />}
      {shot === 1 && <Pill text="DENTES DE AÇO" f={f} at={wt(1, 'dentes') - 2} x={600} y={500} bg={K.red} color="#fff" size={42} rot={-3} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[2] * FPS);
  const t5 = wt(2, '5'), tT = wt(2, 'trincas');
  const dx = interpolate(f, [0, total], [380, 900]);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="truck.wav" vol={0.35} dur={total} />
      <Sfx at={t5 - 2} src="pop.wav" vol={0.55} />
      <Sfx at={tT - 2} src="thud.wav" vol={0.5} />
      {[6, 18, 30, 42, 54, 66, 78, 90, 102].map((d) => <Sfx key={d} at={d} src="tick.wav" vol={0.25} />)}
      <Svg>
        <Zoom z={1.9} dy={-60} dx={-120}>
          <MillRoad f={f} millFrom={-600} millTo={dx} debrisFrom={dx - 60} debrisTo={dx} />
          <g transform={`translate(${dx},${MT - R_DR})`}><TeethDrum r={R_DR} f={f} n={12} /></g>
          <Flying f={f} x={dx + 30} y={MT - 30} s={0.8} n={8} />
          <Dim x={300} y1={GY - OLD} y2={MT} f={f} at={t5 - 6} />
        </Zoom>
      </Svg>
      <Big lines={['Arranca a', 'capa VELHA']} accent={K.yellow} f={f} at={0} />
      <BigNum text="~5 cm" f={f} at={t5 - 2} top={470} size={150} />
      {f >= tT - 2 && <Pill text="TRINCAS JUNTO ✓" f={f} at={tT - 2} x={520} y={1120} bg={K.green} color="#0B3D25" size={42} rot={-2} />}
    </SceneIn>
  );
};
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[3] * FPS);
  const c1 = wt(3, 'esteira') - 6;
  const shot = f >= c1 ? 1 : 0;
  const mx = interpolate(f, [c1, total], [160, 260]);
  const fill = ease(f, c1 + 6, total);
  const [ex, ey] = convEnd(mx);
  const tx = ex + 75;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="rain.wav" vol={0.4} dur={c1} />
      <Sfx at={c1} src="whoosh.wav" vol={0.5} />
      <Sfx at={c1 + 2} src="truck.wav" vol={0.45} dur={total - c1} />
      {[12, 24, 36].map((d) => <Sfx key={d} at={c1 + d} src="thud.wav" vol={0.3} />)}
      <Svg>
        {shot === 0 && <g transform="translate(0,90)"><DrumClose f={f} spray={1} /></g>}
        {shot === 1 && <Zoom z={0.9} dy={110} dx={-60}>
          <MillRoad f={f} millTo={mx - 10} />
          <DumpTruck x={tx} tilt={0} f={0} pour={0} />
          <path d={`M${tx - 200},${GY - 232} Q${tx - 75},${GY - 232 - 110 * fill} ${tx + 50},${GY - 232} Z`} fill={OLDC} stroke="#111" strokeWidth={4} />
          {new Array(10).fill(0).map((_, i) => { const ph = ((f * 1.4 + i * 4) % 20) / 20; return <rect key={i} x={ex - 10 + random('dx' + i) * 30} y={ey + ph * 180} width={16} height={12} fill={i % 2 ? '#7A7E86' : '#55585F'} stroke="#111" strokeWidth={2} />; })}
          <Fresadora x={mx} f={f} />
        </Zoom>}
      </Svg>
      {shot === 0 && <Big lines={['ÁGUA esfria', 'os dentes']} accent="#9FD3F7" f={f} at={0} />}
      {shot === 1 && <Big lines={['Esteira →', 'CAMINHÃO']} accent={K.yellow} f={f} at={c1} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};
// corte transversal com meio-fio
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.round(DURS[4] * FPS);
  const tR = wt(4, 'rua'), tM = wt(4, 'meio'), tA = wt(4, 'agua');
  const layers = [tR - 4, tR + 8, tM - 4].map((t) => ease(f, t, t + 10));
  const RY = 960, CH = 96, LX = 100, CX = 730;
  const add = layers.reduce((a, b) => a + b, 0) * (CH / 3);
  const water = ease(f, tA - 4, tA + 14);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      {[tR - 4, tR + 8, tM - 4].map((t, i) => <Sfx key={i} at={t} src="thud.wav" vol={0.5} />)}
      <Sfx at={tA - 4} src="rain.wav" vol={0.45} dur={total - tA + 4} />
      <Svg>
        <g transform={`translate(470,850) scale(${1.15 + 0.08 * ease(f, 0, total)}) translate(-540,-900)`}>
          <rect x={0} y={RY + 60} width={1080} height={200} fill={K.base} stroke="#111" strokeWidth={4} />
          <rect x={LX - 200} y={RY} width={CX - LX + 200} height={60} fill="#1C1E22" stroke="#111" strokeWidth={4} />
          {layers.map((p, i) => p > 0 ? <rect key={i} x={LX - 200} y={RY - (CH / 3) * (i + 1) * 1 + (1 - p) * -120} width={CX - LX + 200} height={CH / 3} fill={['#2A2C30', '#24262A', '#1E2024'][i]} stroke="#111" strokeWidth={4} opacity={p} /> : null)}
          <rect x={CX} y={RY - CH} width={60} height={CH + 60} fill="#C9C4BA" stroke="#111" strokeWidth={5} />
          <rect x={CX + 60} y={RY - CH} width={500} height={50} fill="#B8B2A6" stroke="#111" strokeWidth={5} />
          <rect x={CX + 60} y={RY - CH + 50} width={500} height={CH + 10} fill={K.base} stroke="#111" strokeWidth={4} />
          <g transform={`translate(930,${RY - CH})`}>
            <rect x={-70} y={-170} width={140} height={170} fill="#F1F1F1" stroke="#111" strokeWidth={5} />
            <path d="M-90 -170 L0 -240 L90 -170 Z" fill="#E63946" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
            <rect x={-22} y={-80} width={44} height={80} fill="#8B5A2B" stroke="#111" strokeWidth={4} />
          </g>
          {f >= tM && <g><path d={`M${CX - 20},${RY - CH - 40} l0,-${50 * ease(f, tM, tM + 8)}`} /><XMark f={f} at={tM + 2} cx={CX + 30} cy={RY - CH - 70} r={40} w={14} /></g>}
          {water > 0 && <g>
            <rect x={LX - 200} y={RY - add - 22 * water} width={(CX - LX + 200) + 380 * water} height={22 * water} fill={K.blue} opacity={0.8} />
            {new Array(6).fill(0).map((_, i) => { const ph = ((f + i * 7) % 28) / 28; return <ellipse key={i} cx={200 + i * 110} cy={RY - add - 11 * water} rx={20 + ph * 50} ry={6 + ph * 10} fill="none" stroke="#DDF1FF" strokeWidth={3} opacity={1 - ph} />; })}
          </g>}
        </g>
      </Svg>
      <Big lines={['E se jogasse', 'POR CIMA?']} accent={K.amber} f={f} at={0} />
      <Pill text="A RUA SOBE ↑" f={f} at={tR - 2} x={130} y={500} bg={K.card} color="#fff" size={42} rot={-2} />
      <Pill text="MEIO-FIO SUMIU" f={f} at={tM} x={500} y={600} bg={K.red} color="#fff" size={42} rot={3} />
      <Pill text="ÁGUA EMPOÇA" f={f} at={tA} x={180} y={700} bg={K.blue} color="#0B2233" size={42} rot={-3} />
      {void fps}
    </SceneIn>
  );
};
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[5] * FPS);
  const tS = wt(5, 'sobe'), tA = wt(5, 'aparece');
  const lay = ease(f, 0, 12);
  const grow = ease(f, tS - 4, tA + 6);
  const OY = 960, NY = 860;
  const cr = (x0: number, seed: string, p: number) => {
    const pts: P2[] = [];
    let x = x0;
    for (let k = 0; k <= 8; k++) { pts.push([x, OY + 100 - k * 25]); x += (random(seed + k) - 0.5) * 30; }
    return partial(pts, 0.5 + 0.5 * p);
  };
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="thud.wav" vol={0.5} />
      <Sfx at={tS - 4} src="tick.wav" vol={0.4} />
      <Sfx at={tS + 4} src="tick.wav" vol={0.4} />
      <Sfx at={tA - 2} src="thud.wav" vol={0.7} />
      <Svg>
        <g transform={`translate(540,920) scale(${1.1 + 0.15 * ease(f, 0, total)}) translate(-540,-920)`}>
          <rect x={-100} y={OY + 100} width={1300} height={160} fill={K.base} stroke="#111" strokeWidth={4} />
          <rect x={-100} y={OY} width={1300} height={100} fill={OLDC} stroke="#111" strokeWidth={4} />
          <rect x={-100} y={NY - (1 - lay) * 200} width={1300} height={100} fill="#1C1E22" stroke="#111" strokeWidth={4} opacity={lay} />
          {[300, 560, 800].map((x, i) => { const q = cr(x, 'rc' + i, grow); return <path key={i} d={path(q)} stroke={grow > 0.02 && q[q.length - 1][1] < OY ? K.red : '#111'} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />; })}
          {grow > 0.1 && [300, 560, 800].map((x, i) => { const ph = ((f + i * 6) % 18) / 18; return <path key={i} d={`M${x},${OY + 10 - ph * 70} l-22,26 h14 v26 h16 v-26 h14 Z`} fill={K.yellow} stroke="#111" strokeWidth={3} opacity={1 - ph} />; })}
        </g>
      </Svg>
      <Big lines={['PIOR: a trinca', 'SOBE']} accent={K.red} f={f} at={0} />
      <Pill text="CAPA NOVA" f={f} at={6} x={760} y={680} bg={K.card} color="#fff" size={36} />
      <Pill text="CAPA VELHA TRINCADA" f={f} at={14} x={330} y={1150} bg={K.card} color="#fff" size={36} />
    </SceneIn>
  );
};
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[6] * FPS);
  const c1 = wt(6, 'passa') - 3, c2 = wt(6, 'ai') - 3;
  const shot = f >= c2 ? 2 : f >= c1 ? 1 : 0;
  const sx = interpolate(f, [0, c1], [300, 1000], clamp);
  const px = interpolate(f, [c1, c2], [350, 1050], clamp);
  const vx = interpolate(f, [c2, total], [400, 1000], clamp);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="truck.wav" vol={0.4} dur={total} />
      <Sfx at={c1} src="whoosh.wav" vol={0.5} />
      <Sfx at={c1 + 4} src="rain.wav" vol={0.3} dur={c2 - c1} />
      <Sfx at={c2} src="whoosh.wav" vol={0.5} />
      <Sfx at={c2 + 10} src="pop.wav" vol={0.5} />
      <Svg>
        <Zoom z={1.5} dy={60}>
          {shot === 0 && <><MillRoad f={f} millFrom={-600} millTo={1680} debrisFrom={sx - 200} debrisTo={2000} /><Sweeper x={sx} f={f} /></>}
          {shot === 1 && <><MillRoad f={f} millFrom={-600} millTo={1680} tackFrom={-600} tackTo={px - 250} /><Sprayer x={px} f={f} /></>}
          {shot === 2 && <><MillRoad f={f} millFrom={-600} millTo={1680} tackFrom={vx - 270} tackTo={1680} newFrom={-600} newTo={vx - 270} hot={1} /><g transform={`translate(0,${-(OLD - CUT) - 6})`}><Paver x={vx} f={f} /></g></>}
        </Zoom>
      </Svg>
      {shot === 0 && <Big lines={['1º', 'VARRE']} accent={K.yellow} f={f} at={0} />}
      {shot === 1 && <Big lines={['Pintura de', 'LIGAÇÃO']} accent={K.amber} f={f} at={c1} />}
      {shot === 1 && <Pill text="COLA DE ASFALTO" f={f} at={wt(6, 'cola') - 2} x={430} y={500} bg={K.amber} color="#111" size={42} rot={-3} />}
      {shot === 2 && <Big lines={['Aí vem a', 'CAPA NOVA']} accent={K.green} f={f} at={c2} />}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.round(DURS[7] * FPS);
  const tL = wt(7, 'lixo'), tP = wt(7, 'pode');
  const lid = pop(f, 4, fps, 12);
  const flow = ease(f, tP - 10, tP);
  const pts: P2[] = [[240, 960], [380, 760], [540, 700]];
  const pts2: P2[] = [[620, 760], [760, 900], [840, 960]];
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={4} src="pop.wav" vol={0.4} />
      <Sfx at={tL} src="thud.wav" vol={0.5} />
      <Sfx at={tP - 6} src="whoosh.wav" vol={0.5} />
      <Sfx at={tP + 8} src="cash.wav" vol={0.35} />
      <Svg><g transform="translate(540,880) scale(1.1) translate(-540,-880)">
        {/* monte de fresado */}
        <g transform={`translate(230,1000) scale(${lid})`}>
          <path d="M-170 0 Q0 -230 170 0 Z" fill={OLDC} stroke="#111" strokeWidth={6} />
          {CHUNKS.slice(0, 26).map((c, i) => <rect key={i} x={-120 + c.u * 230} y={-14 - random('py' + i) * 120 * (1 - Math.abs(c.u - 0.5) * 1.6)} width={c.w * 1.4} height={c.h * 1.4} fill={i % 2 ? '#7A7E86' : '#55585F'} stroke="#111" strokeWidth={2} />)}
        </g>
        <text x={230} y={1070} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={40} fill={K.grey}>FRESADO</text>
        {/* lixeira riscada */}
        {f >= tL - 2 && f < tP - 8 && <g transform={`translate(760,880) scale(${pop(f, tL - 2, fps, 10)})`}>
          <rect x={-70} y={-120} width={140} height={160} rx={10} fill="#5A5E66" stroke="#111" strokeWidth={6} />
          <rect x={-86} y={-140} width={172} height={24} rx={8} fill="#6B7078" stroke="#111" strokeWidth={6} />
          <XMark f={f} at={tL + 2} cx={0} cy={-40} r={110} w={22} />
        </g>}
        {/* usina */}
        {f >= tP - 10 && <g opacity={flow}>
          <g transform="translate(560,700)">
            <rect x={-150} y={-60} width={300} height={120} rx={60} fill={K.yellow} stroke="#111" strokeWidth={6} />
            {new Array(5).fill(0).map((_, i) => <line key={i} x1={-120 + ((f * 4 + i * 60) % 300) - 30} y1={-55} x2={-120 + ((f * 4 + i * 60) % 300) - 30} y2={55} stroke="#C99700" strokeWidth={8} />)}
            {[-1, 1].map((d) => <path key={d} d={`M${d * 40 - 20},${70} q20,${-30 - Math.sin(f / 3) * 10} 40,0 Z`} fill={K.red} />)}
            <rect x={60} y={-150} width={40} height={90} fill="#5A5E66" stroke="#111" strokeWidth={5} />
            {new Array(4).fill(0).map((_, i) => { const ph = ((f + i * 8) % 32) / 32; return <circle key={i} cx={80 + ph * 40} cy={-160 - ph * 120} r={18 + ph * 26} fill="#D8D8D8" opacity={0.5 * (1 - ph)} />; })}
            <text x={-30} y={14} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={42} fill="#111">USINA</text>
          </g>
          {[pts, pts2].map((ps, j) => new Array(5).fill(0).map((_, i) => { const ph = ((f * 1.2 + i * 6) % 30) / 30; const q = partial(ps, Math.max(0.01, ph)); const p = q[q.length - 1]; return <rect key={j * 10 + i} x={p[0] - 9} y={p[1] - 9} width={18} height={14} fill={j ? '#1C1E22' : '#7A7E86'} stroke="#111" strokeWidth={2} />; }))}
          <g transform="translate(860,1000)">
            <path d="M-150 0 Q0 -200 150 0 Z" fill="#1C1E22" stroke="#111" strokeWidth={6} />
            {new Array(4).fill(0).map((_, i) => { const ph = ((f + i * 10) % 40) / 40; return <path key={i} d={`M${-60 + i * 40},${-60 - ph * 120} q16,-14 0,-28 q-16,-14 0,-28`} stroke="#E8E8E8" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6 * (1 - ph)} />; })}
          </g>
          <text x={860} y={1070} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={40} fill={K.green}>ASFALTO NOVO</text>
        </g>}
      </g></Svg>
      <Big lines={['Não é', 'LIXO']} accent={K.green} f={f} at={0} />
      <Pill text="RECICLA ♻" f={f} at={tP + 6} x={560} y={300} bg={K.green} color="#0B3D25" size={46} rot={-3} />
      {void total}
    </SceneIn>
  );
};
const S8: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tCu = wt(8, 'curte'), tSe = wt(8, 'segue'), tAte = wt(8, 'ate');
  const items: [string, number][] = [['Raspa a capa velha', 6], ['Tira as trincas', 16], ['Cola + capa nova', 26]];
  const endStart = Math.min(tSe - 4, wt(8, 'comenta') - 4);
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[8] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  const mx = interpolate(f, [0, endStart], [80, 560], clamp);
  return (
    <SceneIn>
      <Bg /><Header />
      {items.map(([, t], i) => <Sfx key={i} at={t} src="pop.wav" vol={0.45} />)}
      <Sfx at={0} src="truck.wav" vol={0.3} dur={endStart} />
      <Sfx at={tCu} src="pop.wav" vol={0.4} />
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />
      <AbsoluteFill style={{opacity: 1 - end}}>
        <Svg><Zoom z={0.8} dy={150}><MillRoad f={f} millTo={mx - 10} /><Fresadora x={mx} f={f} /></Zoom></Svg>
        <Big lines={['Raspar faz o', 'RECAPE durar']} accent={K.yellow} f={f} at={0} size={100} />
        {items.map(([t, at], i) => {
          if (f < at) return null;
          const s = pop(f, at, fps, 10);
          return (
            <div key={t} style={{position: 'absolute', top: 480 + i * 84, left: 120, display: 'flex', alignItems: 'center', gap: 18, scale: String(s), transformOrigin: 'left center'}}>
              <Check ok size={58} />
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 52, color: K.text, letterSpacing: -2}}>{t}</div>
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
            <div style={{width: 300, height: 300, borderRadius: 150, overflow: 'hidden', background: K.card, border: `10px solid ${K.yellow}`, boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}><Raphael mouth={mouthAt(f + Math.round(STARTS[8] * FPS))} blink={blinkAt(f + Math.round(STARTS[8] * FPS))} /></div>
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

const SCENES = [S0, S1, S2, S3, S4, S5, S6, S7, S8];
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
      <Audio src={staticFile('voice_pavimentacao-07-fresagem.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave07: React.FC = () => {
  const mx = 420;
  const [ex, ey] = convEnd(mx);
  return (
    <AbsoluteFill style={{background: K.bg}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {new Array(320).fill(0).map((_, i) => <circle key={i} cx={random('ax' + i) * 1080} cy={random('ay' + i) * 1920} r={1 + random('ar' + i) * 3} fill={random('ac' + i) > 0.5 ? K.grain : K.bg2} />)}
        {new Array(13).fill(0).map((_, i) => <rect key={i} x={60} y={i * 170 - 40} width={20} height={100} rx={4} fill={K.yellow} opacity={0.9} />)}
        <g transform="translate(540,1330) scale(1.05) translate(-540,-1030)">
          <MillRoad f={9} millTo={mx - 10} debrisFrom={mx - 200} debrisTo={mx} />
          <DumpTruck x={ex + 75} tilt={0} f={0} pour={0} />
          <path d={`M${ex - 125},${GY - 232} Q${ex},${GY - 320} ${ex + 125},${GY - 232} Z`} fill={OLDC} stroke="#111" strokeWidth={4} />
          {new Array(6).fill(0).map((_, i) => <rect key={i} x={ex - 10 + random('cx' + i) * 30} y={ey + i * 26} width={16} height={12} fill={i % 2 ? '#7A7E86' : '#55585F'} stroke="#111" strokeWidth={2} />)}
          <Fresadora x={mx} f={9} />
          <Flying f={9} x={mx + 50} y={MT - 40} n={14} s={1.4} />
        </g>
      </svg>
      <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#07</div>
      </div>
      <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 112, color: K.text, letterSpacing: -5, lineHeight: 0.98}}>
        Por que<br />raspam o<br />
        <span style={{display: 'inline-block', background: K.yellow, color: '#111', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(0,0,0,0.35)', letterSpacing: -3, margin: '10px 0'}}>asfalto?</span>
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
};
export const Root: React.FC = () => (
  <>
    <Composition id="Fresagem" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave07" component={CapaPave07} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

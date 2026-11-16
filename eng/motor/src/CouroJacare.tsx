import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-05-couro-jacare.json';
import mouthData from './mouth_pavimentacao-05-couro-jacare.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 05';

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
const LEVELS = [0.45, 0.42, 0.8, 0.35, 0.1, 0.3, 0.92, 1];
const Meter: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let sc = 0;
  for (let i = 0; i < STARTS.length; i++) if (t >= STARTS[i]) sc = i;
  const enter = Math.round(STARTS[sc] * fps) + (sc === 7 ? 40 : 10);
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
const END_FRAME = Math.round(STARTS[7] * FPS) + Math.min(wt(7, 'segue'), wt(7, 'comenta')) - 4;
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

// ---------- trinca couro de jacaré (vista de cima) ----------
const GN = 10, GM = 6;
const GP: P2[][] = new Array(GM + 1).fill(0).map((_, j) => new Array(GN + 1).fill(0).map((__, i) => {
  const edge = i === 0 || i === GN || j === 0 || j === GM;
  return [i / GN + (edge ? 0 : (random(`gx${i}-${j}`) - 0.5) * 0.06), j / GM + (edge ? 0 : (random(`gy${i}-${j}`) - 0.5) * 0.1)] as P2;
}));
const Gator: React.FC<{x: number; y: number; w: number; h: number; p: number; skin?: boolean; label?: string; lc?: string; lift?: number}> = ({x, y, w, h, p, skin = false, label, lc = K.yellow, lift = 0}) => {
  const P = (q: P2): P2 => [x + q[0] * w, y + q[1] * h];
  const segs: [P2, P2, number][] = [];
  for (let j = 0; j <= GM; j++) for (let i = 0; i <= GN; i++) {
    const d = Math.hypot(i / GN - 0.5, (j / GM - 0.5) * 0.8);
    if (i < GN && j > 0 && j < GM) segs.push([GP[j][i], GP[j][i + 1], d]);
    if (j < GM && i > 0 && i < GN) segs.push([GP[j][i], GP[j + 1][i], d]);
  }
  const base = skin ? '#4F7A3A' : '#2B2D31';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={22} fill={base} stroke="#111" strokeWidth={6} />
      {!skin && DOTS.map((d, i) => <circle key={i} cx={x + 14 + d.x * (w - 28)} cy={y + 14 + d.y * (h - 28)} r={d.r * 0.7} fill="#3E4147" />)}
      {skin && GP.slice(0, GM).map((row, j) => row.slice(0, GN).map((q, i) => {
        const c = P([(q[0] + GP[j + 1][i + 1][0]) / 2, (q[1] + GP[j + 1][i + 1][1]) / 2]);
        return <ellipse key={`${i}-${j}`} cx={c[0]} cy={c[1]} rx={w / GN * 0.34} ry={h / GM * 0.3} fill="#6A9A4C" />;
      }))}
      {segs.map(([a, b, d], k) => {
        const t = interpolate(p, [d * 1.3, d * 1.3 + 0.25], [0, 1], clamp);
        if (t <= 0) return null;
        const A = P(a), B = P(b);
        const mid: P2 = [(A[0] + B[0]) / 2 + (random('jm' + k) - 0.5) * 16, (A[1] + B[1]) / 2 + (random('jn' + k) - 0.5) * 16];
        const q = partial([A, mid, B], t);
        return <path key={k} d={path(q)} stroke={skin ? '#26401A' : '#0A0A0A'} strokeWidth={skin ? 7 : 6 + 4 * lift} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      })}
      {label && <text x={x + 24} y={y + 60} fontFamily="InterD" fontWeight={900} fontSize={46} fill={lc} stroke="#111" strokeWidth={2}>{label}</text>}
    </g>
  );
};

// ---------- corte lateral da pista ----------
const SX = 430;
const xs = new Array(61).fill(0).map((_, i) => -SX + (i / 60) * 2 * SX);
const Section: React.FC<{d: (x: number) => number; water?: number; wl?: number}> = ({d, water = 0, wl = 0}) => {
  const band = (top: (x: number) => number, bot: (x: number) => number, col: string) => (
    <polygon points={[...xs.map((x) => `${x},${top(x)}`), ...xs.slice().reverse().map((x) => `${x},${bot(x)}`)].join(' ')} fill={col} stroke="#111" strokeWidth={4} strokeLinejoin="round" />
  );
  return (
    <g>
      {band((x) => 190 + d(x) * 0.3, () => 380, K.soil)}
      {band((x) => 70 + d(x) * 0.6, (x) => 190 + d(x) * 0.3, K.base)}
      {band((x) => d(x), (x) => 70 + d(x) * 0.6, K.asph)}
      {new Array(30).fill(0).map((_, i) => { const x = -SX + 20 + random('sx' + i) * (2 * SX - 40); return <circle key={i} cx={x} cy={100 + d(x) * 0.5 + random('sy' + i) * 70} r={4 + random('sr' + i) * 6} fill="rgba(0,0,0,0.22)" />; })}
      {water > 0 && <polygon points={[...xs.map((x) => `${x},${wl}`), ...xs.slice().reverse().map((x) => `${x},${Math.max(wl, d(x))}`)].join(' ')} fill={K.blue} opacity={0.9 * water} />}
    </g>
  );
};
const TruckSide: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-150} y={-150} width={200} height={110} rx={10} fill="#F1F1F1" stroke="#111" strokeWidth={5} />
    <path d="M55 -40 L55 -125 L105 -125 L140 -80 L140 -40 Z" fill={K.yellow} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M70 -112 L100 -112 L124 -82 L70 -82 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    {[-110, -60, 100].map((wx) => <g key={wx} transform={`translate(${wx},-28) rotate(${f * 12})`}><circle r={26} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><rect x={-4} y={-18} width={8} height={36} fill="#777" /></g>)}
  </g>
);
const CarSide: React.FC<{x: number; y: number; s?: number; rot?: number; f: number}> = ({x, y, s = 1, rot = 0, f}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-130 -30 L-130 -70 Q-120 -82 -80 -84 L-50 -125 Q-40 -132 40 -132 Q60 -130 80 -90 L120 -84 Q138 -78 138 -60 L138 -30 Z" fill="#E63946" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M-38 -118 L-60 -88 L0 -88 L0 -118 Z M12 -118 L12 -88 L68 -88 L50 -118 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    {[-80, 85].map((wx) => <g key={wx} transform={`translate(${wx},-26) rotate(${f * 18})`}><circle r={28} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><circle r={12} fill="#B9BDC2" /><rect x={-3} y={-12} width={6} height={24} fill="#555" /></g>)}
  </g>
);
const Battery: React.FC<{x: number; y: number; lvl: number; s?: number}> = ({x, y, lvl, s = 1}) => {
  const col = lvl > 0.6 ? K.green : lvl > 0.3 ? K.amber : K.red;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-170} y={-80} width={320} height={160} rx={26} fill={K.card} stroke="#fff" strokeWidth={10} />
      <rect x={156} y={-34} width={30} height={68} rx={8} fill="#fff" />
      <rect x={-150} y={-60} width={280 * lvl} height={120} rx={14} fill={col} />
    </g>
  );
};
const Warn: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M0 -150 L140 100 L-140 100 Z" fill={K.yellow} stroke="#111" strokeWidth={12} strokeLinejoin="round" />
    <rect x={-14} y={-70} width={28} height={110} rx={12} fill="#111" />
    <circle cx={0} cy={70} r={16} fill="#111" />
  </g>
);

// ---------- cenas ----------
const S0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1] = phr(0);
  const shot = f >= c1 ? 1 : 0;
  const tJa = wt(0, 'jacare'), tBu = wt(0, 'buraco');
  const sk = pop(f, tJa - 6, fps, 11);
  const hole = pop(f, tBu - 4, fps, 10);
  return (
    <SceneIn>
      <Bg />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      {[0, 4, 8, 12, 16].map((d) => <Sfx key={d} at={4 + d} src="tick.wav" vol={0.35} />)}
      <Sfx at={tJa - 6} src="pop.wav" vol={0.55} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={tBu - 4} src="thud.wav" vol={0.8} />
      <Svg>
        {shot === 0 && (
          <g transform={`translate(540,${f < tJa - 6 ? 800 : 820}) scale(${f < tJa - 6 ? 1 + 0.05 * ease(f, 0, 60) : 0.86})`}>
            <g transform={`translate(0,${f < tJa - 6 ? 0 : -175})`}><Gator x={-420} y={-160} w={840} h={320} p={ease(f, 2, tJa - 6)} label="ASFALTO" /></g>
            {f >= tJa - 6 && <g transform={`translate(0,175) scale(${sk})`}><Gator x={-420} y={-160} w={840} h={320} p={1} skin label="JACARÉ" lc="#fff" /></g>}
          </g>
        )}
        {shot === 1 && (
          <RoadStage y={900}><Road f={f} top="#55585E" cracks={1} hole={f >= tBu - 4 ? hole : 0} /></RoadStage>
        )}
      </Svg>
      <Header />
      {shot === 0 && <Big lines={['Esse desenho', 'no asfalto?']} accent={K.yellow} f={f} at={0} size={104} />}
      {shot === 1 && <Big lines={['É aviso de', 'BURACO!']} accent={K.red} f={f} at={c1} />}
      {shot === 1 && <Pill text="ATENÇÃO" f={f} at={tBu} x={620} y={1060} bg={K.red} color="#fff" size={46} rot={-4} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1] = phr(1);
  const shot = f >= c1 ? 1 : 0;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={2} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={c1 + 6} src="thud.wav" vol={0.6} />
      <Svg>
        <g transform={`translate(540,${shot ? 860 : 820}) scale(${shot ? 1.05 + 0.08 * ease(f, c1, c1 + 60) : 0.9})`}><Gator x={-420} y={-200} w={840} h={400} p={1} /></g>
        {shot === 0 && <g transform={`translate(540,820) scale(${pop(f, 4, fps, 9)})`}><circle r={150} fill="none" stroke={K.yellow} strokeWidth={18} /><line x1={106} y1={106} x2={230} y2={230} stroke={K.yellow} strokeWidth={28} strokeLinecap="round" /></g>}
      </Svg>
      {shot === 0 && <Big lines={['O nome', 'é esse mesmo']} accent={K.yellow} f={f} at={0} />}
      {shot === 1 && <Big lines={['Trinca', 'COURO DE JACARÉ']} accent={K.yellow} f={f} at={c1} size={98} />}
      {shot === 1 && <Pill text="TÁ NA NORMA DO DNIT" f={f} at={c1 + 12} x={250} y={1090} size={44} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1] = phr(2);
  const shot = f >= c1 ? 1 : 0;
  const total = Math.round(DURS[2] * FPS);
  const tx = interpolate(f, [c1, total], [-520, 520], clamp);
  const d = (x: number) => 26 * Math.exp(-((x - tx) ** 2) / (2 * 110 ** 2));
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={2} src="whoosh.wav" vol={0.4} />
      <Sfx at={c1} src="truck.wav" vol={0.45} dur={total - c1} />
      <Svg>
        {shot === 0 && <Battery x={540} y={800} lvl={1 - 0.8 * ease(f, 6, c1 - 4)} s={1.5 * pop(f, 2, fps, 10)} />}
        {shot === 1 && (
          <g transform="translate(540,860)">
            <Section d={d} />
            <g transform={`translate(${tx},${d(tx)}) scale(0.62)`}><Tire f={f} lift={0} /></g>
            <path d={`M${tx - 220},${d(tx) + 40} Q${tx},${d(tx) + 120} ${tx + 220},${d(tx) + 40}`} stroke={K.yellow} strokeWidth={6} strokeDasharray="14 12" fill="none" opacity={ease(f, c1 + 8, c1 + 16)} />
          </g>
        )}
      </Svg>
      {shot === 0 && <Big lines={['Nasce do', 'CANSAÇO']} accent={K.amber} f={f} at={0} />}
      {shot === 0 && <Pill text="FADIGA" f={f} at={12} x={380} y={1040} bg={K.amber} size={50} rot={-3} />}
      {shot === 1 && <Big lines={['Cada caminhão', 'DOBRA o asfalto']} accent={K.yellow} f={f} at={c1} size={98} />}
      {shot === 1 && <Pill text="um pouquinho..." f={f} at={wt(2, 'pouquinho') - 4} x={560} y={1160} bg={K.card} color="#fff" size={40} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1] = phr(3);
  const shot = f >= c1 ? 1 : 0;
  const n = Math.round(interpolate(f, [2, c1 - 2], [0, 1000000], {...clamp, easing: Easing.in(Easing.cubic)}));
  const tRa = wt(3, 'racha');
  return (
    <SceneIn>
      <Bg /><Header />
      {[0, 6, 12, 18, 24, 30].map((d) => <Sfx key={d} at={4 + d} src="tick.wav" vol={0.35} />)}
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={tRa - 4} src="thud.wav" vol={0.7} />
      <Svg>
        {shot === 0 && [0, 1, 2].map((k) => {
          const ph = ((f * 1.6 + k * 40) % 120) / 120;
          return <TruckSide key={k} x={-200 + ph * 1480} y={1060 - k * 0} s={0.9} f={f} />;
        })}
        {shot === 0 && <rect x={0} y={1060} width={1080} height={14} fill={K.asphS} />}
        {shot === 1 && <g transform={`translate(540,860) scale(${1.05 + 0.06 * ease(f, c1, c1 + 50)})`}><Gator x={-420} y={-220} w={840} h={440} p={ease(f, c1 + 2, tRa + 12)} lift={ease(f, tRa, tRa + 10)} /></g>}
      </Svg>
      {shot === 0 && <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 170, color: K.yellow, letterSpacing: -6}}>{n.toLocaleString('pt-BR')}</div>}
      {shot === 0 && <div style={{position: 'absolute', top: 770, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 800, fontSize: 52, color: K.text}}>passadas de eixo</div>}
      {shot === 0 && <Big lines={['Depois de', 'MILHÕES...']} accent={K.yellow} f={f} at={0} />}
      {shot === 1 && <Big lines={['Racha em', 'PEDACINHOS']} accent={K.red} f={f} at={c1} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};

const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1, c2, c3] = phr(4);
  const shot = shotOf(f, phraseStarts(4));
  const cam = useCam(4, 1);
  const hole = pop(f, c3 + 2, fps, 10);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="rain.wav" vol={0.35} dur={c3 + 6} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="pop.wav" vol={0.5} />
      {[0, 3, 6].map((d) => <Sfx key={d} at={c2 + 4 + d} src="tick.wav" vol={0.45} />)}
      <Sfx at={c3 + 2} src="thud.wav" vol={0.85} />
      <RoadStage cam={cam} y={900}>
        <Road f={f} top="#55585E" cracks={1} seep={shot >= 1 ? ease(f, c1, c2) : shot === 0 ? 0.15 * ease(f, 4, c1) : 0} hole={shot === 3 ? hole : 0} />
        {shot === 2 && new Array(10).fill(0).map((_, i) => {
          const t0 = c2 + 4 + i * 2, ph = interpolate(f, [t0, t0 + 20], [0, 1], clamp);
          if (ph <= 0 || ph >= 1) return null;
          const q = iso([HC[0] - 90 + (i % 5) * 45, HC[1] - 40 + Math.floor(i / 5) * 60, 0]);
          return <rect key={i} x={q[0] + ph * (i % 2 ? 110 : -110) - 14} y={q[1] - 140 * ph + 190 * ph * ph - 10} width={28} height={20} rx={4} fill="#2B2D31" stroke="#000" strokeWidth={3} transform={`rotate(${ph * 200 * (i % 2 ? 1 : -1)},${q[0]},${q[1]})`} />;
        })}
      </RoadStage>
      {shot <= 1 && <Rain f={f} a={0.8} />}
      {shot === 0 && <Big lines={['A chuva', 'ENTRA']} accent={K.blue} f={f} at={0} />}
      {shot === 1 && <Big lines={['Amolece', 'a BASE']} accent={K.blue} f={f} at={c1} />}
      {shot === 1 && <Pill text="BASE MOLE" f={f} at={c1 + 8} x={300} y={1100} bg={K.blue} color="#111" size={46} />}
      {shot === 2 && <Big lines={['Os pedaços', 'se SOLTAM']} accent={K.amber} f={f} at={c2} />}
      {shot === 3 && <Big lines={['BURACO!']} accent={K.red} f={f} at={c3} size={150} />}
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1, c2, c3] = phr(5);
  const shot = shotOf(f, phraseStarts(5));
  const total = Math.round(DURS[5] * FPS);
  const rut = shot >= 1 ? ease(f, c1, c1 + 24) : 0;
  const d = (x: number) => 34 * rut * (Math.exp(-((x + 210) ** 2) / (2 * 55 ** 2)) + Math.exp(-((x - 210) ** 2) / (2 * 55 ** 2)));
  const water = shot >= 2 ? ease(f, c2, c2 + 20) : 0;
  const slide = shot === 3 ? ease(f, c3 + 6, total) : 0;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={2} src="pop.wav" vol={0.55} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={c2} src="rain.wav" vol={0.35} dur={total - c2} />
      <Sfx at={c3} src="car.wav" vol={0.5} />
      <Sfx at={c3 + 14} src="whoosh.wav" vol={0.5} />
      <Svg>
        {shot === 0 && <Warn x={540} y={780} s={1.3 * pop(f, 2, fps, 9)} />}
        {shot >= 1 && (
          <g transform={`translate(540,${shot === 3 ? 900 : 860}) scale(${shot === 1 ? 1.05 : 1})`}>
            <Section d={d} water={water} wl={14} />
            {shot === 1 && [-210, 210].map((x) => <g key={x}><path d={`M${x} -160 L${x} -60`} stroke={K.yellow} strokeWidth={12} strokeLinecap="round" /><polygon points={`${x - 26},-70 ${x + 26},-70 ${x},-36`} fill={K.yellow} /></g>)}
            {shot === 3 && <g><CarSide x={-300 + slide * 520} y={10} s={1.1} rot={-14 * Math.sin(slide * Math.PI * 1.5)} f={f * (1 - slide)} />
              {new Array(10).fill(0).map((_, i) => { const ph = ((f + i * 5) % 20) / 20; return <circle key={i} cx={-300 + slide * 520 - 120 - ph * 90} cy={0 - 60 * ph + 70 * ph * ph} r={10 * (1 - ph)} fill="#BFE3FA" />; })}</g>}
          </g>
        )}
      </Svg>
      {shot >= 2 && <Rain f={f} a={0.7} />}
      {shot === 0 && <Big lines={['Outro', 'AVISO:']} accent={K.yellow} f={f} at={0} />}
      {shot === 1 && <Big lines={['Duas valas', 'onde passa o pneu']} accent={K.yellow} f={f} at={c1} size={94} />}
      {shot === 1 && <Pill text="TRILHA DE RODA" f={f} at={wt(5, 'trilha') - 4} x={300} y={1110} size={46} />}
      {shot === 2 && <Big lines={['Na chuva,', 'junta ÁGUA']} accent={K.blue} f={f} at={c2} />}
      {shot === 3 && <Big lines={['O carro', 'AQUAPLANA']} accent={K.red} f={f} at={c3} />}
      {shot === 3 && <Pill text="PERIGO!" f={f} at={c3 + 14} x={640} y={560} bg={K.red} color="#fff" size={46} rot={-5} />}
      <CutFlash cuts={[c1, c2, c3]} />
    </SceneIn>
  );
};

const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [, c1] = phr(6);
  const shot = f >= c1 ? 1 : 0;
  const total = Math.round(DURS[6] * FPS);
  const tCo = wt(6, 'cortar'), tRe = wt(6, 'refazer');
  const cut = ease(f, tCo - 4, tCo + 10), fill = ease(f, tRe - 2, tRe + 18), cap = ease(f, tRe + 14, total - 6);
  const cx0 = HC[0] - 150, cx1 = HC[0] + 150, cy0 = HC[1] - 120, cy1 = HC[1] + 120;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={4} src="pop.wav" vol={0.5} />
      <Sfx at={22} src="thud.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Sfx at={tCo - 4} src="truck.wav" vol={0.4} dur={30} />
      <Sfx at={tRe - 2} src="pop.wav" vol={0.5} />
      <Sfx at={total - 8} src="cash.wav" vol={0.3} />
      <Svg>
        {shot === 0 && (
          <g transform="translate(540,830) scale(0.95)">
            <Gator x={-420} y={-200} w={840} h={400} p={1} />
            <ellipse cx={0} cy={0} rx={250 * pop(f, 4, fps, 10)} ry={150 * pop(f, 4, fps, 10)} fill="#151618" stroke="#55595F" strokeWidth={6} />
            {f > 26 && new Array(8).fill(0).map((_, i) => { const a = (i / 8) * Math.PI * 2; const q = partial([[Math.cos(a) * 60, Math.sin(a) * 40], [Math.cos(a + 0.3) * 160, Math.sin(a + 0.3) * 95], [Math.cos(a) * 250, Math.sin(a) * 150]], ease(f, 26, c1 - 2)); return q.length > 1 ? <path key={i} d={path(q)} stroke="#000" strokeWidth={7} fill="none" strokeLinecap="round" /> : null; })}
          </g>
        )}
        {shot === 0 && <XMark f={f} at={22} cx={880} cy={600} r={60} w={18} />}
      </Svg>
      {shot === 1 && (
        <RoadStage y={900}>
          <Road f={f} top="#55585E" cracks={1 - fill * 0.0} />
          {cut > 0 && <Poly p={[[cx0, cy0, 1], [cx1, cy0, 1], [cx1, cy1, 1], [cx0, cy1, 1]]} fill={fill > 0 ? lerpC('#17191C', K.base, fill) : '#17191C'} stroke={K.yellow} sw={6} op={cut} />}
          {cap > 0 && <Poly p={[[cx0, cy0, 2], [cx0 + (cx1 - cx0) * cap, cy0, 2], [cx0 + (cx1 - cx0) * cap, cy1, 2], [cx0, cy1, 2]]} fill="#141518" sw={0} />}
        </RoadStage>
      )}
      {shot === 0 && <Big lines={['Tapar por cima', 'NÃO resolve']} accent={K.red} f={f} at={0} size={100} />}
      {shot === 0 && <Pill text="A TRINCA VOLTA" f={f} at={34} x={320} y={1090} bg={K.red} color="#fff" size={44} />}
      {shot === 1 && <Big lines={['Cortar a', 'parte DOENTE']} accent={K.yellow} f={f} at={c1} />}
      {shot === 1 && <Pill text="BASE NOVA" f={f} at={tRe} x={140} y={1080} bg={K.base} size={42} />}
      {shot === 1 && <Pill text="CAPA NOVA ✓" f={f} at={tRe + 20} x={560} y={1080} bg={K.green} color="#0B3D25" size={42} />}
      <CutFlash cuts={[c1]} />
    </SceneIn>
  );
};
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tCu = 0, tSe = wt(7, 'segue'), tAte = wt(7, 'ate');
  const items: [string, number][] = [['Jacaré = cansaço', tCu + 4], ['Água amolece a base', tCu + 14], ['Cortar e refazer', tCu + 24]];
  const endStart = Math.min(tSe - 4, wt(7, 'comenta') - 4);
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[7] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  return (
    <SceneIn>
      <Bg /><Header />
      {items.map(([, t], i) => <Sfx key={i} at={t} src="pop.wav" vol={0.45} />)}
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />
      <AbsoluteFill style={{opacity: 1 - end}}>
        <Svg><g transform="translate(540,960) scale(0.78)"><Gator x={-430} y={-150} w={420} h={300} p={1} label="ALERTA" lc={K.amber} /><Patch x={10} y={-150} w={420} h={300} film={1} age={0} label="REFEITO" lc={K.green} /></g></Svg>
        <Big lines={['Viu o jacaré?', 'É alerta!']} accent={K.amber} f={f} at={0} size={100} />
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
            <div style={{width: 300, height: 300, borderRadius: 150, overflow: 'hidden', background: K.card, border: `10px solid ${K.yellow}`, boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}><Raphael mouth={mouthAt(f + Math.round(STARTS[7] * FPS))} blink={blinkAt(f + Math.round(STARTS[7] * FPS))} /></div>
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

const SCENES = [S0, S1, S2, S3, S4, S5, S6, S7];

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
      <Audio src={staticFile('voice_pavimentacao-05-couro-jacare.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave05: React.FC = () => (
  <AbsoluteFill style={{background: K.bg}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(320).fill(0).map((_, i) => <circle key={i} cx={random('ax' + i) * 1080} cy={random('ay' + i) * 1920} r={1 + random('ar' + i) * 3} fill={random('ac' + i) > 0.5 ? K.grain : K.bg2} />)}
      {new Array(13).fill(0).map((_, i) => <rect key={i} x={60} y={i * 170 - 40} width={20} height={100} rx={4} fill={K.yellow} opacity={0.9} />)}
      <g transform="translate(560,1180) scale(0.95)"><Gator x={-430} y={-150} w={420} h={300} p={1} label="ASFALTO" /><Gator x={10} y={-150} w={420} h={300} p={1} skin label="JACARÉ" lc="#fff" /></g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#05</div>
    </div>
    <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 112, color: K.text, letterSpacing: -5, lineHeight: 0.98}}>
      Esse desenho<br />no asfalto é<br />
      <span style={{display: 'inline-block', background: K.red, color: '#fff', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(0,0,0,0.35)', letterSpacing: -3, margin: '10px 0'}}>perigoso?</span>
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
    <Composition id="CouroJacare" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave05" component={CapaPave05} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

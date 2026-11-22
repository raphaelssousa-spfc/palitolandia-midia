import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-09-asfalto-mole.json';
import mouthData from './mouth_pavimentacao-09-asfalto-mole.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 09';

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
const LEVELS = [0.9, 0.95, 0.6, 0.3, 0.2, 0.1, 0.92, 0.95];
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
      <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 24, color: K.grey, letterSpacing: 4, whiteSpace: 'nowrap'}}>FIRMEZA DA PISTA</div>
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
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => <svg width={1080} height={1920} style={{position: 'absolute'}}><Defs />{children}</svg>;
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="glass" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
      <stop offset="35%" stopColor="#CFEAFF" stopOpacity={0.75} />
      <stop offset="100%" stopColor="#5E93C2" stopOpacity={0.7} />
    </radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#070A12" /><stop offset="100%" stopColor="#1B2335" />
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="9" /></filter>
    <filter id="blur2"><feGaussianBlur stdDeviation="22" /></filter>
  </defs>
);
const CamG: React.FC<{s: number; x?: number; y?: number; cx?: number; cy?: number; children: React.ReactNode}> = ({s, x = 0, y = 0, cx = 540, cy = 900, children}) => (
  <g transform={`translate(${cx + x},${cy + y}) scale(${s}) translate(${-cx},${-cy})`}>{children}</g>
);
const Sparkle: React.FC<{x: number; y: number; s: number; f: number}> = ({x, y, s, f}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${f * 3})`} opacity={0.9}>
    <path d="M0 -40 L8 -8 L40 0 L8 8 L0 40 L-8 8 L-40 0 L-8 -8 Z" fill="#FFFFFF" />
  </g>
);
const pl = (ps: P2[]) => ps.map((p) => p.join(',')).join(' ');

// ================= PISTA EM CORTE (vista de frente da faixa) =================
const SY = 820, TH = 150, WL = 330, WR = 750;
const gauss = (x: number, c: number, w: number) => Math.exp(-((x - c) ** 2) / (2 * w * w));
type Rut = {x: number; d: number; w?: number};
const surfY = (x: number, ruts: Rut[]) => SY + ruts.reduce((a, r) => {
  const w = r.w ?? 70;
  return a + r.d * gauss(x, r.x, w) - r.d * 0.4 * (gauss(x, r.x - w * 2.1, w * 0.7) + gauss(x, r.x + w * 2.1, w * 0.7));
}, 0);
const wheelRuts = (d: number): Rut[] => [{x: WL, d}, {x: WR, d}];
const STONES = new Array(64).fill(0).map((_, i) => {
  const x = -40 + random('stx' + i) * 1160, y = SY + 22 + random('sty' + i) * (TH - 36), r = 13 + random('str' + i) * 15;
  const p = new Array(6).fill(0).map((_, k) => {
    const a = (k / 6) * Math.PI * 2 + random(`sta${i}-${k}`) * 0.6, rr = r * (0.7 + random(`stb${i}-${k}`) * 0.5);
    return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  return {x, y, p, c: ['#8E8A82', '#A8A39A', '#77736C', '#B5AFA4'][i % 4]};
});
type SlabP = {f: number; ruts?: Rut[]; soft?: number; glue?: number; jiggle?: number; stoneIn?: number; water?: number; firm?: boolean};
const Slab: React.FC<SlabP> = ({f, ruts = [], soft = 0, glue = 1, jiggle = 0, stoneIn = 1, water = 0}) => {
  const xs = new Array(63).fill(0).map((_, i) => -80 + i * 20);
  const top = xs.map((x) => [x, surfY(x, ruts)] as P2);
  const line = 'M' + top.map((p) => p.join(',')).join(' L');
  const body = line + ` L1160,${SY + TH} L-80,${SY + TH} Z`;
  const binder = lerpC('#2B2D31', '#4A3020', soft);
  const maxD = Math.max(0, ...ruts.map((r) => r.d));
  const lvl = SY + maxD * (1 - water * 0.85);
  return (
    <g>
      <rect x={-80} y={SY + TH} width={1240} height={110} fill={K.base} stroke="#111" strokeWidth={4} />
      <rect x={-80} y={SY + TH + 110} width={1240} height={400} fill={K.soil} />
      <text x={1000} y={SY + TH + 72} textAnchor="end" fontFamily="InterD" fontWeight={900} fontSize={34} fill="rgba(0,0,0,0.45)">BASE</text>
      <clipPath id="slabclip"><path d={body} /></clipPath>
      <path d={body} fill={binder} opacity={glue} />
      <g clipPath={stoneIn >= 1 ? 'url(#slabclip)' : undefined}>
        {STONES.map((s, i) => {
          const dep = 1 - (s.y - SY) / (TH * 1.5);
          const d = ruts.reduce((a, r) => a + r.d * gauss(s.x, r.x, (r.w ?? 70) * 1.2), 0) * dep;
          const side = ruts.reduce((a, r) => a + Math.sign(s.x - r.x) * r.d * 0.7 * gauss(s.x, r.x, (r.w ?? 70) * 1.5), 0) * dep;
          const jx = jiggle * Math.sin(f / 4 + i) * 6, jy = jiggle * Math.cos(f / 5 + i * 2) * 4;
          const drop = (1 - Math.min(1, stoneIn * (1.2 + random('sd' + i) * 0.6))) * -700;
          return <polygon key={i} points={s.p} transform={`translate(${s.x + side + jx},${s.y + d + jy + drop})`} fill={s.c} stroke="#111" strokeWidth={3} />;
        })}
      </g>
      {glue > 0.5 && <path d={line} stroke={soft > 0.4 ? K.amber : '#111'} strokeWidth={soft > 0.4 ? 8 : 6} fill="none" />}
      {soft > 0.5 && new Array(6).fill(0).map((_, i) => <ellipse key={i} cx={100 + i * 180} cy={surfY(100 + i * 180, ruts) + 10} rx={40} ry={6} fill="#fff" opacity={0.25 * soft * (0.6 + 0.4 * Math.sin(f / 6 + i))} />)}
      {water > 0 && <path d={'M' + top.map(([x, y]) => `${x},${Math.max(lvl, y)}`).join(' L') + ` L1160,${lvl} L-80,${lvl} Z`} fill={K.blue} opacity={0.85} />}
    </g>
  );
};
const TireFront: React.FC<{x: number; yb: number; f: number; w?: number; h?: number}> = ({x, yb, f, w = 120, h = 190}) => (
  <g>
    <clipPath id={'tf' + x}><rect x={x - w / 2} y={yb - h} width={w} height={h} rx={30} /></clipPath>
    <rect x={x - w / 2} y={yb - h} width={w} height={h} rx={30} fill="#1B1C1F" stroke="#111" strokeWidth={6} />
    <g clipPath={`url(#tf${x})`}>{new Array(8).fill(0).map((_, k) => <rect key={k} x={x - w / 2} y={yb - h + ((k * 30 + f * 7) % (h + 30)) - 15} width={w} height={9} fill="#3A3D42" />)}</g>
  </g>
);
const Heat: React.FC<{f: number; a: number; y0?: number}> = ({f, a, y0 = SY - 30}) => (
  <g opacity={a}>
    {new Array(7).fill(0).map((_, i) => {
      const ph = ((f * 1.6 + i * 23) % 150) / 150, x = 80 + i * 155, y = y0 - ph * 320;
      let d = `M${x} ${y}`;
      for (let k = 1; k <= 6; k++) d += ` Q${x + (k % 2 ? 24 : -24)} ${y - k * 22 + 11} ${x} ${y - k * 22}`;
      return <path key={i} d={d} stroke={K.amber} strokeWidth={7} fill="none" strokeLinecap="round" opacity={Math.sin(ph * Math.PI)} />;
    })}
  </g>
);
const Sun: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => (
  <g transform={`translate(${x},${y}) scale(${s * (1 + 0.04 * Math.sin(f / 5))})`}>
    <circle r={150} fill={K.yellow} opacity={0.15} />
    <g transform={`rotate(${f * 1.5})`}>{new Array(12).fill(0).map((_, i) => <rect key={i} x={-10} y={-138} width={20} height={46} rx={10} fill={K.yellow} transform={`rotate(${i * 30})`} />)}</g>
    <circle r={80} fill={K.yellow} stroke="#E0A800" strokeWidth={6} />
    <circle cx={-24} cy={-24} r={26} fill="#FFE98A" />
  </g>
);
const Thermo: React.FC<{x: number; y: number; v: number; s?: number}> = ({x, y, v, s = 1}) => {
  const h = 420, p = Math.max(0, Math.min(1, (v - 10) / 60)), col = lerpC('#5FA8D8', '#FF4D4D', p);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-38} y={-h} width={76} height={h + 20} rx={38} fill="#F2F2F2" stroke="#111" strokeWidth={6} />
      <rect x={-19} y={-h + 20 + (h - 40) * (1 - p)} width={38} height={(h - 40) * p + 30} rx={19} fill={col} />
      <circle cx={0} cy={50} r={64} fill={col} stroke="#111" strokeWidth={6} />
      {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={38} x2={66} y1={-h + 20 + (h - 40) * (1 - t)} y2={-h + 20 + (h - 40) * (1 - t)} stroke="#fff" strokeWidth={6} />)}
    </g>
  );
};
const TruckRear: React.FC<{yb: number; f: number; s: number; press?: number}> = ({yb, f, s, press = 0}) => {
  const bob = Math.sin(f / 5) * 3;
  return (
    <g transform={`translate(540,${yb}) scale(${s}) translate(-540,${-yb})`}>
      {[WL - 62, WL + 62, WR - 62, WR + 62].map((x) => <TireFront key={x} x={x} yb={yb} f={f} w={112} h={180} />)}
      <g transform={`translate(0,${bob + press * 8})`}>
        <rect x={190} y={yb - 640} width={700} height={430} rx={16} fill="#F1F1F1" stroke="#111" strokeWidth={7} />
        <rect x={530} y={yb - 630} width={20} height={410} fill="#C4C4C4" />
        <rect x={180} y={yb - 215} width={720} height={44} rx={8} fill="#55585F" stroke="#111" strokeWidth={6} />
        <rect x={210} y={yb - 205} width={70} height={26} rx={6} fill={K.red} /><rect x={800} y={yb - 205} width={70} height={26} rx={6} fill={K.red} />
        <rect x={470} y={yb - 300} width={140} height={60} rx={6} fill="#EDEDED" stroke="#111" strokeWidth={4} />
        <text x={540} y={yb - 520} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={80} fill="#111">40 t</text>
      </g>
    </g>
  );
};
const Arrow: React.FC<{x: number; y: number; dir: number; f: number; at: number; col?: string}> = ({x, y, dir, f, at, col = K.yellow}) => {
  if (f < at) return null;
  const p = ease(f, at, at + 10), wig = Math.sin(f / 3) * 8;
  return (
    <g transform={`translate(${x + dir * (p * 40 + wig)},${y}) scale(${dir},1)`} opacity={p}>
      <path d="M-50 -16 L20 -16 L20 -40 L70 0 L20 40 L20 16 L-50 16 Z" fill={col} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

// ================= CENAS =================
const S0: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[0] * FPS);
  const d = interpolate(f, [0, total], [6, 62], clamp);
  const cam = interpolate(f, [0, total], [1.05, 1.18], clamp);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="truck.wav" vol={0.35} />
      <Sfx at={2} src="whoosh.wav" vol={0.4} />
      <Sfx at={wt(0, 'afunda')} src="thud.wav" vol={0.5} />
      <Svg><CamG s={cam} cy={SY}>
        <Slab f={f} ruts={wheelRuts(d)} soft={0.6} />
        <Heat f={f} a={0.9} />
        <TireFront x={WL} yb={surfY(WL, wheelRuts(d)) + 4} f={f} />
        <TireFront x={WR} yb={surfY(WR, wheelRuts(d)) + 4} f={f} />
      </CamG>
        <Sun x={880} y={560} s={0.8} f={f} />
      </Svg>
      <Big lines={['Por que', 'AFUNDA?']} f={f} at={0} size={130} />
    </SceneIn>
  );
};
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const tC = wt(1, 'colada') - 3, tPi = wt(1, 'piche') - 3, tPe = wt(1, 'petroleo') - 4;
  const stoneIn = ease(f, 0, 22);
  const glue = ease(f, tC, tPi + 10);
  const cam = interpolate(f, [0, tPi, tPi + 12], [1.0, 1.0, 1.35], clamp);
  const pour = f >= tC;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={2} src="pop.wav" vol={0.4} />
      <Sfx at={10} src="tick.wav" vol={0.4} />
      <Sfx at={tC} src="whoosh.wav" vol={0.35} />
      <Sfx at={tPe} src="pop.wav" vol={0.45} />
      <Svg>
        <CamG s={cam} cy={SY + 60}>
          <Slab f={f} stoneIn={stoneIn} glue={glue} />
          {pour && f < tPe + 20 && <rect x={524} y={560} width={32} height={SY - 560 + 4} rx={14} fill="#1E1F22" opacity={1 - ease(f, tPe + 8, tPe + 20)} />}
        </CamG>
        {pour && (() => {
          const s = pop(f, tC, 30, 10);
          return <g transform={`translate(540,470) rotate(${-20 + Math.sin(f / 6) * 3}) scale(${s})`}>
            <rect x={-110} y={-130} width={220} height={230} rx={20} fill="#1E1F22" stroke="#111" strokeWidth={6} />
            <rect x={-110} y={-70} width={220} height={18} fill={K.yellow} /><rect x={-110} y={30} width={220} height={18} fill={K.yellow} />
            <text x={0} y={-5} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={40} fill={K.yellow}>PICHE</text>
          </g>;
        })()}
      </Svg>
      <Pill text="PEDRA" f={f} at={4} x={130} y={300} size={60} bg="#B5AFA4" />
      <Pill text="+ COLA" f={f} at={tPi} x={500} y={300} size={60} />
      {f >= tPe && <Pill text="FEITA DE PETRÓLEO" f={f} at={tPe} x={180} y={SY + 190} size={50} bg="#FFFFFF" rot={-2} />}
    </SceneIn>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[2] * FPS);
  const tS = wt(2, '60') - 6;
  const v = Math.round(interpolate(f, [4, tS + 8], [25, 60], {...clamp, easing: Easing.bezier(0.5, 0, 0.3, 1)}));
  const hot = (v - 25) / 35;
  const cam = interpolate(f, [0, total], [1, 1.1], clamp);
  return (
    <SceneIn>
      <AbsoluteFill style={{background: lerpC('#25282D', '#3A2620', hot)}} />
      <Header />
      <Sfx at={0} src="whoosh.wav" vol={0.35} />
      {new Array(6).fill(0).map((_, i) => <Sfx key={i} at={6 + i * 10} src="tick.wav" vol={0.3} />)}
      <Sfx at={tS + 8} src="thud.wav" vol={0.5} />
      <Svg><CamG s={cam} cy={900}>
        <Slab f={f} soft={hot * 0.6} />
        <Heat f={f} a={hot} />
        <Sun x={300} y={SY - 170} s={1 + hot * 0.25} f={f} />
        <Thermo x={830} y={SY - 20} v={v} />
      </CamG></Svg>
      <div style={{position: 'absolute', top: 250, left: 120, fontFamily: 'InterD', fontWeight: 900, fontSize: 170, letterSpacing: -6, color: lerpC('#FFFFFF', '#FF4D4D', hot), scale: String(f >= tS + 8 ? 1 + 0.08 * (1 - pop(f, tS + 8, 30, 8)) : 1)}}>{v}°C{v >= 60 ? '+' : ''}</div>
      <Pill text="NA PISTA" f={f} at={wt(2, 'pista') - 2} x={660} y={310} size={46} bg="#FFFFFF" />
    </SceneIn>
  );
};
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const tCh = wt(3, 'chiclete') - 4, tP = wt(3, 'pedras') - 4;
  const soft = ease(f, 0, 14);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tCh, tP]} />
      <Sfx at={wt(3, 'amolece')} src="whoosh.wav" vol={0.35} />
      <Sfx at={tCh} src="pop.wav" vol={0.45} />
      <Sfx at={tP} src="tick.wav" vol={0.45} />
      {f < tCh && <>
        <Svg><CamG s={1.5} cy={SY + 40}><Slab f={f} soft={soft} /><Heat f={f} a={0.8} y0={SY - 10} />
          {new Array(4).fill(0).map((_, i) => { const ph = ((f + i * 9) % 36) / 36; return <ellipse key={i} cx={200 + i * 230} cy={SY + 8 + ph * 40} rx={12} ry={18 + ph * 10} fill="#4A3020" opacity={1 - ph} />; })}
        </CamG></Svg>
        <Big lines={['A cola', 'AMOLECE']} accent={K.amber} f={f} at={0} size={120} />
      </>}
      {f >= tCh && f < tP && (() => {
        const st = ease(f, tCh, tCh + 26), L = 300 - 0 * st, gap = 60 + st * 380, thin = 70 - st * 52;
        const x1 = 540 - gap / 2, x2 = 540 + gap / 2, y = 820;
        return <>
          <Svg>
            <path d={`M${x1} ${y - 70} C${x1 + gap * 0.35} ${y - thin} ${x2 - gap * 0.35} ${y - thin} ${x2} ${y - 70} L${x2} ${y + 70} C${x2 - gap * 0.35} ${y + thin} ${x1 + gap * 0.35} ${y + thin} ${x1} ${y + 70} Z`} fill="#FF8FB8" stroke="#111" strokeWidth={6} />
            <circle cx={x1 - 30} cy={y} r={90} fill="#F1C27D" stroke="#111" strokeWidth={6} />
            <circle cx={x2 + 30} cy={y} r={90} fill="#F1C27D" stroke="#111" strokeWidth={6} />
            {void L}
            <Sun x={880} y={520} s={0.6} f={f} />
          </Svg>
          <Big lines={['Igual', 'CHICLETE']} accent="#FF8FB8" f={f} at={tCh} size={120} />
        </>;
      })()}
      {f >= tP && <>
        <Svg><CamG s={1.6} cy={SY + 60}><Slab f={f} soft={1} jiggle={ease(f, tP, tP + 10)} /></CamG>
          <Arrow x={330} y={SY + 90} dir={-1} f={f} at={tP + 6} /><Arrow x={750} y={SY + 90} dir={1} f={f} at={tP + 6} />
        </Svg>
        <Pill text="PEDRAS SOLTAS" f={f} at={tP} x={200} y={330} size={66} />
      </>}
    </SceneIn>
  );
};
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[4] * FPS);
  const tE = wt(4, 'empurra') - 4;
  const d = interpolate(f, [8, total], [0, 48], clamp);
  const s = interpolate(f, [0, total], [0.55, 0.78], clamp);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="truck.wav" vol={0.45} />
      <Sfx at={wt(4, 'pesado')} src="thud.wav" vol={0.5} />
      <Sfx at={tE} src="whoosh.wav" vol={0.4} />
      <Svg><CamG s={1.08} cy={SY}>
        <Slab f={f} ruts={wheelRuts(d)} soft={0.8} />
        <TruckRear yb={SY + d * 0.85} f={f} s={s} press={d / 48} />
        <Arrow x={WL - 190} y={SY + 70} dir={-1} f={f} at={tE} col={K.amber} />
        <Arrow x={WR + 190} y={SY + 70} dir={1} f={f} at={tE} col={K.amber} />
      </CamG></Svg>
      <Pill text="PESADO" f={f} at={wt(4, 'pesado') - 2} x={130} y={SY + 200} size={58} />
      <Pill text="DEVAGAR" f={f} at={wt(4, 'devagar') - 2} x={520} y={SY + 200} size={58} bg="#FFFFFF" />
      <Pill text="MASSA PRO LADO" f={f} at={tE + 4} x={240} y={SY + 300} size={48} bg={K.amber} />
    </SceneIn>
  );
};
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const tT = wt(5, 'trilha') - 4, tC = wt(5, 'chuva') - 4, tA = wt(5, 'aquaplanagem') - 6;
  const day = Math.round(interpolate(f, [0, tC - 6], [1, 365], {...clamp, easing: Easing.in(Easing.quad)}));
  const d = interpolate(f, [0, tC - 6], [10, 80], clamp);
  const rain = f >= tC;
  const water = ease(f, tC + 4, tC + 30);
  const pass = (f % 24) / 24;
  const slide = ease(f, tA, tA + 30);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tC]} />
      {new Array(4).fill(0).map((_, i) => <Sfx key={i} at={2 + i * 24} src="car.wav" vol={0.2} dur={20} />)}
      <Sfx at={tT} src="pop.wav" vol={0.45} />
      <Sfx at={tC} src="rain.wav" vol={0.4} />
      <Sfx at={tA} src="whoosh.wav" vol={0.5} />
      <Svg><CamG s={rain ? 1.25 : 1.1} cy={SY}>
        <Slab f={f} ruts={wheelRuts(d)} soft={rain ? 0.2 : 0.6} water={water} />
        {!rain && pass < 0.55 && [WL, WR].map((x) => <TireFront key={x} x={x} yb={surfY(x, wheelRuts(d)) + 4} f={f} />)}
        {rain && f >= tA && (() => {
          const x = WL + slide * 160, rot = slide * 14;
          return <g transform={`rotate(${rot} ${x} ${SY})`}>
            <TireFront x={x} yb={SY + d * 0.3} f={0} />
            {new Array(10).fill(0).map((_, i) => { const ph = ((f + i * 4) % 20) / 20; return <circle key={i} cx={x + (i % 2 ? 1 : -1) * (70 + ph * 120)} cy={SY - ph * 140 + ph * ph * 120} r={10} fill="#BFE3FA" opacity={1 - ph} />; })}
          </g>;
        })()}
      </CamG></Svg>
      {rain && <Rain f={f} a={0.9} />}
      {!rain && <div style={{position: 'absolute', top: 270, left: 120, fontFamily: 'InterD', fontWeight: 900, fontSize: 130, color: K.text, letterSpacing: -5}}>DIA <span style={{color: K.yellow}}>{day}</span></div>}
      {!rain && <Pill text="TRILHA DA RODA" f={f} at={tT} x={300} y={SY + 220} size={50} />}
      {!rain && f >= tT && <Svg><Arrow x={WL} y={SY + 150} dir={-1} f={f} at={tT} /></Svg>}
      {rain && <Pill text="POÇA" f={f} at={wt(5, 'poca') - 2} x={130} y={330} size={66} bg="#9FD3F7" />}
      {rain && <Pill text="AQUAPLANAGEM" f={f} at={tA} x={360} y={330} size={66} bg={K.red} color="#fff" rot={-2} />}
    </SceneIn>
  );
};
const Sample: React.FC<{x: number; y: number; f: number; melt: number; label: string; good: boolean}> = ({x, y, f, melt, label, good}) => {
  const w = 130 + melt * 90, h = 150 - melt * 100;
  return (
    <g transform={`translate(${x},${y}) scale(1.35)`}>
      <rect x={-170} y={0} width={340} height={40} rx={10} fill="#9AA0A8" stroke="#111" strokeWidth={5} />
      {[0, 1, 2].map((i) => <path key={i} d={`M${-90 + i * 90} 70 q14 22 0 44 q-14 22 0 44`} stroke={K.red} strokeWidth={8} fill="none" opacity={0.5 + 0.5 * Math.sin(f / 4 + i)} />)}
      <path d={`M${-w} 0 Q${-w * 0.9} ${-h} 0 ${-h - 10} Q${w * 0.9} ${-h} ${w} 0 Z`} fill={good ? '#3A3D42' : '#7A4A26'} stroke={good ? K.yellow : '#111'} strokeWidth={6} />
      {!good && melt > 0.3 && [-1, 1].map((sg) => <path key={sg} d={`M${sg * (w - 10)} 0 q${sg * 10} ${30 + melt * 60} 0 ${40 + melt * 90}`} stroke="#7A4A26" strokeWidth={18} strokeLinecap="round" fill="none" />)}
      <text x={0} y={-h - 40 - (good ? 0 : 0)} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={42} fill={good ? K.green : K.red}>{label}</text>
    </g>
  );
};
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tPo = wt(6, 'polimero') - 4, tB = wt(6, 'borracha') - 4, tAg = wt(6, 'aguenta') - 4;
  const melt = ease(f, 6, 50);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tAg]} />
      <Sfx at={0} src="whoosh.wav" vol={0.4} />
      <Sfx at={tPo} src="pop.wav" vol={0.5} />
      <Sfx at={tB} src="tick.wav" vol={0.45} />
      <Sfx at={tAg} src="cash.wav" vol={0.35} />
      {f < tAg && <>
        <Svg><g transform="translate(0,-130)">
          <Sample x={290} y={1000} f={f} melt={melt} label="COMUM" good={false} />
          <Sample x={790} y={1000} f={f} melt={f >= tPo ? 0.05 * Math.abs(Math.sin(f / 4)) : melt} label="POLÍMERO" good={f >= tPo} />
          {f >= tB && (() => { const st = Math.abs(Math.sin((f - tB) / 6)) * Math.exp(-(f - tB) / 30); return <g>
            <path d={`M690 ${860 - st * 200} Q790 ${780 - st * 300} 890 ${860 - st * 200}`} stroke="#E0A800" strokeWidth={16} fill="none" strokeLinecap="round" />
            <circle cx={790} cy={790 - st * 260} r={22} fill="#C4C4C4" stroke="#111" strokeWidth={5} />
          </g>; })()}
          {f >= tPo && <g transform={`translate(790,590) scale(${pop(f, tPo + 6, fps, 9)})`}><circle r={50} fill={K.green} stroke="#111" strokeWidth={5} /><path d="M-22 0 L-6 18 L26 -18" stroke="#0B3D25" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
        </g></Svg>
        <Big lines={['A', 'SOLUÇÃO']} accent={K.green} f={f} at={0} size={120} />
        {f >= tB && <Pill text="TIPO BORRACHA" f={f} at={tB} x={520} y={1040} size={46} bg="#FFFFFF" />}
      </>}
      {f >= tAg && <>
        <Svg><CamG s={1.12} cy={SY}>
          <Slab f={f} ruts={wheelRuts(2)} soft={0.15} />
          <Heat f={f} a={0.8} />
          {[WL, WR].map((x) => <TireFront key={x} x={x} yb={SY + 6} f={f} />)}
        </CamG>
          <Sun x={880} y={560} s={0.7} f={f} />
        </Svg>
        <Big lines={['Aguenta', 'O CALOR']} accent={K.green} f={f} at={tAg} size={120} />
      </>}
    </SceneIn>
  );
};
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tCu = wt(7, 'curte'), tSu = wt(7, 'sua') - 4, tSe = wt(7, 'segue'), tAte = wt(7, 'ate');
  const endStart = Math.min(tSe - 4, wt(7, 'comenta') - 4);
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[7] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  const items: [string, number][] = [['Calor amolece', tCu + 6], ['Peso afunda', tCu + 18], ['Polímero segura', tCu + 30]];
  return (
    <SceneIn>
      {items.map(([, t], i) => <Sfx key={i} at={t} src="pop.wav" vol={0.45} />)}
      <Sfx at={tSu} src="tick.wav" vol={0.45} />
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />
      <AbsoluteFill style={{opacity: 1 - end}}>
        {f < tSu && <>
          <Bg /><Header />
          <Svg><g transform="translate(0,260)"><CamG s={0.9} cy={SY}><Slab f={f} ruts={wheelRuts(40)} soft={0.5} /><Heat f={f} a={0.6} /></CamG></g></Svg>
          <Big lines={['Asfalto', 'NO CALOR']} accent={K.amber} f={f} at={0} size={110} />
          {items.map(([t, at], i) => f < at ? null : (
            <div key={t} style={{position: 'absolute', top: 520 + i * 110, left: 120, display: 'flex', alignItems: 'center', gap: 20, scale: String(pop(f, at, fps, 10)), transformOrigin: 'left center'}}>
              <Check ok={i === 2} size={70} /><div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 62, color: K.text, letterSpacing: -2}}>{t}</div>
            </div>
          ))}
        </>}
        {f >= tSu && <>
          <Bg />
          <Svg><g transform="translate(0,300)"><CamG s={0.9} cy={SY}><Slab f={f} ruts={wheelRuts(30)} soft={0.5} /><Heat f={f} a={0.6} /></CamG></g></Svg>
          <AbsoluteFill style={{background: 'rgba(10,12,16,0.45)'}} />
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: -3}}>Na sua cidade...</div>
          {[['A', 'AGUENTA', K.yellow, '#111', 0], ['B', 'AFUNDA', K.card, '#fff', 8]].map(([l, t, bg, c, d]) => {
            const s = pop(f, tSu + (d as number), fps, 9);
            return <div key={l as string} style={{position: 'absolute', top: 470 + (d as number) * 25, left: 140, right: 140, display: 'flex', alignItems: 'center', gap: 26, background: bg as string, color: c as string, border: `6px solid ${K.yellow}`, borderRadius: 30, padding: '22px 36px', scale: String(s), fontFamily: 'InterD', fontWeight: 900, fontSize: 80}}>
              <span style={{background: '#111', color: K.yellow, borderRadius: 18, padding: '0 22px'}}>{l as string}</span>{t as string}</div>;
          })}
        </>}
      </AbsoluteFill>
      {f >= endStart && (
        <AbsoluteFill style={{opacity: end}}>
          <Bg />
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
      <Audio src={staticFile('voice_pavimentacao-09-asfalto-mole.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave09: React.FC = () => (
  <AbsoluteFill style={{background: '#2A1E1A'}}>
    <Bg />
    <AbsoluteFill style={{background: 'rgba(80,30,10,0.35)'}} />
    <Svg><g transform="translate(0,180)"><CamG s={1.15} cy={SY}>
      <Slab f={20} ruts={wheelRuts(70)} soft={0.8} />
      <Heat f={40} a={1} />
      <TireFront x={WL} yb={surfY(WL, wheelRuts(70)) + 4} f={0} />
      <TireFront x={WR} yb={surfY(WR, wheelRuts(70)) + 4} f={0} />
    </CamG></g>
      <Thermo x={920} y={SY + 120} v={62} s={0.6} />
    </Svg>
    <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#09</div>
    </div>
    <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 118, color: K.text, letterSpacing: -5, lineHeight: 0.98, textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>
      Por que<br />o asfalto<br />
      <span style={{display: 'inline-block', background: K.amber, color: '#111', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(0,0,0,0.35)', letterSpacing: -3, margin: '10px 0', textShadow: 'none'}}>afunda?</span>
    </div>
    <div style={{position: 'absolute', top: 1575, left: 130, right: 80, display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 150, height: 150, borderRadius: 75, overflow: 'hidden', background: K.card, border: `7px solid ${K.yellow}`, flexShrink: 0}}><Raphael mouth={0} blink={0} /></div>
      <div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 44, color: K.text, textShadow: '0 4px 16px #000'}}>{HANDLE}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 600, fontSize: 30, color: K.grey}}>Engenheiro civil explica</div>
      </div>
    </div>
  </AbsoluteFill>
);
export const Root: React.FC = () => (
  <>
    <Composition id="Calor" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave09" component={CapaPave09} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

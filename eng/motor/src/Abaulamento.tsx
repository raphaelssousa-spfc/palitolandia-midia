import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-03-abaulamento.json';
import mouthData from './mouth_pavimentacao-03-abaulamento.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 03';

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
const LEVELS = [0.85, 0.85, 0.85, 0.92, 0.4, 0.18, 0.75, 1];
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


// ---------- corte transversal da pista (abaulamento) ----------
const HW = 300;
const surf = (x: number, crown: number) => { const a = Math.abs(x); return a <= HW ? -crown * (1 - a / HW) : a <= 350 ? ((a - HW) / 50) * 6 : 6; };
const band = (crown: number, d0: number, d1: number, n = 24) => {
  const top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= n; i++) { const x = -HW + (2 * HW * i) / n; top.push(`${x},${surf(x, crown) + d0}`); bot.unshift(`${x},${surf(x, crown) + d1}`); }
  return [...top, ...bot].join(' ');
};
type XS = {f: number; crown: number; slide?: number; puddle?: number; flow?: number; arrows?: number; soft?: number; level?: number};
const XSec: React.FC<XS> = ({f, crown, slide = 0, puddle = 0, flow = 0, arrows = 0, soft = 0, level = 0}) => (
  <g>
    <rect x={-520} y={0} width={1040} height={270} fill={K.soil} stroke={K.stroke} strokeWidth={2} />
    {new Array(40).fill(0).map((_, i) => <circle key={i} cx={-500 + random('sx' + i) * 1000} cy={150 + random('sy' + i) * 110} r={3 + random('sr' + i) * 5} fill="rgba(0,0,0,0.22)" />)}
    {[-1, 1].map((s) => (
      <g key={s} transform={`scale(${s},1)`}>
        <polygon points="300,0 350,6 350,40 300,40" fill="#6B6F75" stroke={K.stroke} strokeWidth={2} />
        <path d="M350 6 Q371 30 392 6 L392 44 L350 44 Z" fill="#B9BDC2" stroke={K.stroke} strokeWidth={2} />
        {flow > 0 && <path d={`M354 ${10 + 12 * (1 - flow)} Q371 ${26} 388 ${10 + 12 * (1 - flow)} Z`} fill={K.blue} opacity={0.95} />}
        <polygon points="392,6 432,66 472,6" fill="#5A3C26" stroke={K.stroke} strokeWidth={3} strokeLinejoin="round" />
        {flow > 0 && <polygon points={`${432 - 24 * flow},${66 - 36 * flow} 432,66 ${432 + 24 * flow},${66 - 36 * flow}`} fill={K.blue} opacity={0.95} />}
        <rect x={392} y={-2} width={4} height={8} fill="#4C9A52" />
        <rect x={472} y={-4} width={48} height={10} fill="#4C9A52" />
        {new Array(5).fill(0).map((_, i) => <path key={i} d={`M${478 + i * 9} 0 l-4 -14 M${478 + i * 9} 0 l4 -12`} stroke="#4C9A52" strokeWidth={4} />)}
      </g>
    ))}
    <polygon points={band(crown, 85, 130)} fill={K.sub} stroke={K.stroke} strokeWidth={2} />
    <polygon points={band(crown, 28, 85)} fill={K.base} stroke={K.stroke} strokeWidth={2} />
    {new Array(30).fill(0).map((_, i) => { const x = -280 + random('gb' + i) * 560; return <circle key={i} cx={x} cy={surf(x, crown) + 40 + random('gc' + i) * 38} r={3 + random('gd' + i) * 4} fill="rgba(0,0,0,0.25)" />; })}
    {soft > 0 && <polygon points={band(crown, 28, 85)} fill="#3B6FA0" opacity={0.55 * soft} />}
    <polygon points={band(crown, 0, 28)} fill={K.asph} stroke={K.stroke} strokeWidth={2} />
    <polygon points={band(crown, -1, 4)} fill={K.asphS} />
    <rect x={-8} y={surf(0, crown) - 3} width={16} height={7} fill={K.yellow} />
    {[-1, 1].map((s) => <rect key={s} x={s * 272 - 6} y={surf(272, crown) - 3} width={12} height={6} fill="#fff" />)}
    {level > 0 && <line x1={-320} y1={0} x2={-320 + 640 * level} y2={0} stroke="#fff" strokeWidth={5} strokeDasharray="18 12" />}
    {puddle > 0 && (
      <g>
        <rect x={-280 * puddle} y={-30 * puddle} width={560 * puddle} height={30 * puddle} rx={6} fill={K.blue} opacity={0.85} />
        {new Array(4).fill(0).map((_, i) => <ellipse key={i} cx={-200 + i * 130 + Math.sin(f / 9 + i) * 10} cy={-20 * puddle} rx={30 * puddle} ry={3} fill="#fff" opacity={0.5} />)}
      </g>
    )}
    {slide > 0 && new Array(12).fill(0).map((_, i) => {
      const s = i % 2 ? 1 : -1;
      const ph = ((f * 1.2 + i * 11) % 40) / 40;
      const x = s * Math.min(371, 30 + ph * 360);
      const y = Math.abs(x) > 350 ? 14 : surf(x, crown) - 9;
      return <circle key={i} cx={x} cy={y} r={10} fill="#8FD0FF" stroke="#2B6A9A" strokeWidth={2} opacity={slide * (ph < 0.9 ? 1 : (1 - ph) * 10)} />;
    })}
    {arrows > 0 && [-1, 1].map((s) => {
      const x0 = s * 30, x1 = s * (30 + 230 * arrows);
      const y0 = surf(x0, crown) - 50, y1 = surf(x1, crown) - 50;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      return (
        <g key={s}>
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={K.yellow} strokeWidth={12} strokeLinecap="round" />
          <polygon points="0,-20 34,0 0,20" fill={K.yellow} transform={`translate(${x1},${y1}) rotate(${(ang * 180) / Math.PI})`} />
        </g>
      );
    })}
  </g>
);
const Stage: React.FC<{children: React.ReactNode; x?: number; y?: number; s?: number; cam?: {s: number; x: number; y: number}}> = ({children, x = 540, y = 820, s = 1.15, cam}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}><g transform={`translate(${x + (cam?.x ?? 0)},${y + (cam?.y ?? 0)}) scale(${s * (cam?.s ?? 1)})`}>{children}</g></svg>
);
const Note: React.FC<{text: string}> = ({text}) => <div style={{position: 'absolute', top: 480, left: 124, fontFamily: 'InterD', fontWeight: 600, fontSize: 28, color: K.grey}}>{text}</div>;
const Check: React.FC<{ok: boolean; size?: number}> = ({ok, size = 64}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: ok ? K.green : K.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: size * 0.62, color: ok ? '#0B3D25' : '#fff'}}>{ok ? '✓' : '✕'}</div>
);

// ---------- cenas ----------
const S0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ps = phraseStarts(0);
  const c1 = ps[1] - 3, c2 = ps[2] - 3;
  const shot = f < c1 ? 0 : f < c2 ? 1 : 2;
  const crown = 100 * ease(f, 4, 24);
  const cam = shot === 0 ? {s: 1, x: 0, y: 0} : shot === 1 ? {s: 1.35, x: 0, y: 40} : {s: 0.95, x: 0, y: 20};
  return (
    <SceneIn>
      <Bg />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={4} src="car.wav" vol={0.3} />
      <Sfx at={20} src="pop.wav" vol={0.45} />
      {[c1, c2].map((x, i) => <Sfx key={i} at={x} src="whoosh.wav" vol={0.4} />)}
      <Sfx at={c1 + 8} src="thud.wav" vol={0.5} />
      <Sfx at={c2 + 4} src="pop.wav" vol={0.5} />
      <Stage cam={cam}>
        <XSec f={f} crown={crown} level={ease(f, 12, 26)} />
        {shot === 0 && f > 20 && <g transform={`translate(0,${-crown - 70}) scale(${pop(f, 20, fps, 9)})`}>
          <polygon points="0,-46 -30,0 30,0" fill={K.yellow} /><rect x={-10} y={0} width={20} height={36} fill={K.yellow} />
        </g>}
      </Stage>
      <Header />
      {shot === 0 && <Big lines={['Estrada mais', 'alta no meio?']} f={f} at={0} size={104} />}
      {shot === 1 && <Big lines={['Não é', 'defeito']} accent={K.red} f={f} at={c1} />}
      {shot === 1 && <Pill text="DEFEITO?" f={f} at={c1 + 2} x={590} y={560} bg={K.red} color="#fff" rot={-4} size={48} />}
      {shot === 1 && <svg width={1080} height={1920} style={{position: 'absolute'}}><XMark f={f} at={c1 + 8} cx={735} cy={597} r={70} w={16} /></svg>}
      {shot === 2 && <Big lines={['É de', 'propósito!']} accent={K.green} f={f} at={c2} />}
      {shot === 2 && <Pill text="PROJETADO ✓" f={f} at={c2 + 4} x={560} y={560} bg={K.green} color="#0B3D25" rot={-3} size={46} />}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const S1: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(1, 2);
  const tAb = wt(1, 'abaulamento'), tDe = wt(1, 'desce'), tCe = wt(1, 'centro'), tBe = wt(1, 'beiradas');
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tAb - 4} src="pop.wav" vol={0.55} />
      <Sfx at={tDe - 4} src="whoosh.wav" vol={0.45} />
      <Sfx at={tBe - 3} src="pop.wav" vol={0.4} />
      <Stage cam={cam} y={840}>
        <XSec f={f} crown={100} arrows={ease(f, tDe - 4, tBe + 4)} />
      </Stage>
      {f < tAb - 4 && <Big lines={['O nome', 'disso é...']} accent={K.text} f={f} at={0} />}
      {f >= tAb - 4 && <Big lines={['O nome é', 'ABAULAMENTO']} f={f} at={tAb - 4} />}
      <Pill text="DO CENTRO" f={f} at={tCe - 4} x={130} y={590} size={40} />
      <Pill text="PRAS BEIRADAS" f={f} at={tBe - 4} x={520} y={590} size={40} />
      <Note text="(desenho exagerado)" />
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ps = phraseStarts(2);
  const c1 = ps[1] - 3, c2 = ps[2] - 3;
  const shot = f < c1 ? 0 : f < c2 ? 1 : 2;
  const crown = 100 - 75 * ease(f, 4, 24);
  const r = ease(f, c2 + 2, c2 + 16);
  const drop = ease(f, c2 + 14, c2 + 26);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={c1 + 3} src="thud.wav" vol={0.6} />
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      {[0, 4, 8, 12].map((d) => <Sfx key={d} at={c2 + 2 + d} src="tick.wav" vol={0.35} />)}
      <Sfx at={c2 + 16} src="pop.wav" vol={0.5} />
      {shot === 0 && <Stage s={1.3} y={840}><XSec f={f} crown={crown} level={1} /></Stage>}
      {shot === 0 && <Big lines={['É', 'pouquinho']} f={f} at={0} />}
      {shot === 1 && (
        <>
          <div style={{position: 'absolute', top: 430, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 380, color: K.yellow, letterSpacing: -16, scale: String(pop(f, c1 + 2, fps, 8)), textShadow: '0 20px 60px rgba(255,194,14,0.35)'}}>2%</div>
          <div style={{position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 800, fontSize: 52, color: K.text, opacity: ease(f, c1 + 8, c1 + 16)}}>de inclinação</div>
          <Big lines={['Cerca de']} accent={K.text} f={f} at={c1} />
        </>
      )}
      {shot === 2 && (
        <>
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <line x1={150} y1={820} x2={150 + 760 * r} y2={820} stroke="#fff" strokeWidth={5} strokeDasharray="18 12" />
            <line x1={150} y1={820} x2={150 + 760 * r} y2={820 + 90 * drop * r} stroke={K.yellow} strokeWidth={16} strokeLinecap="round" />
            <rect x={150} y={940} width={760 * r} height={34} fill={K.amber} stroke="#111" strokeWidth={4} />
            {new Array(11).fill(0).map((_, i) => (i / 10 <= r ? <line key={i} x1={150 + i * 76} y1={940} x2={150 + i * 76} y2={i % 5 === 0 ? 974 : 958} stroke="#111" strokeWidth={4} /> : null))}
            {drop > 0 && <g opacity={drop}>
              <line x1={950} y1={820} x2={950} y2={910} stroke={K.red} strokeWidth={8} />
              <polygon points="934,890 966,890 950,914" fill={K.red} />
              <line x1={930} y1={820} x2={970} y2={820} stroke={K.red} strokeWidth={6} />
            </g>}
          </svg>
          <div style={{position: 'absolute', top: 990, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 56, color: K.amber, opacity: r}}>1 METRO</div>
          <Pill text="2 cm" f={f} at={c2 + 16} x={760} y={700} bg={K.red} color="#fff" size={52} />
          <Big lines={['2 cm a', 'cada metro']} f={f} at={c2} />
          <Note text="(desenho exagerado)" />
        </>
      )}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
};

const S3: React.FC = () => {
  const f = useCurrentFrame();
  const ps = phraseStarts(3);
  const c1 = ps[1] - 3, c2 = ps[2] - 3;
  const shot = f < c1 ? 0 : f < c2 ? 1 : 2;
  const total = Math.round(DURS[3] * FPS);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="rain.wav" vol={0.35} dur={total} />
      <Sfx at={c1} src="whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="whoosh.wav" vol={0.4} />
      <Sfx at={c2 + 10} src="thud.wav" vol={0.5} />
      {shot < 2 && <Stage s={shot === 0 ? 1.0 : 1.3} y={shot === 0 ? 820 : 860}><XSec f={f} crown={100} slide={shot === 0 ? ease(f, 6, 20) * 0.5 : 1} flow={shot === 1 ? ease(f, c1, c1 + 30) : 0.2} /></Stage>}
      {shot === 2 && <Stage s={1.1} y={860}><XSec f={f} crown={0} puddle={ease(f, c2, c2 + 12)} /></Stage>}
      <Rain f={f} a={1} />
      {shot === 0 && <Big lines={['Quando', 'chove...']} accent={K.blue} f={f} at={0} />}
      {shot === 1 && <Big lines={['A água', 'escorre']} accent={K.blue} f={f} at={c1} />}
      {shot === 1 && <Pill text="PROS LADOS" f={f} at={c1 + 6} x={580} y={570} bg={K.blue} color="#fff" rot={-3} />}
      {shot === 2 && <Big lines={['Pista reta:', 'água parada']} accent={K.red} f={f} at={c2} />}
      {shot === 2 && <svg width={1080} height={1920} style={{position: 'absolute'}}><XMark f={f} at={c2 + 10} cx={880} cy={620} r={60} w={16} /></svg>}
      <CutFlash cuts={[c1, c2]} />
    </SceneIn>
  );
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
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(4, 1);
  const tFl = wt(4, 'flutuar'), tAq = wt(4, 'aquaplanagem');
  const lift = ease(f, tFl - 4, tFl + 8);
  const ps = phraseStarts(4);
  const c1 = ps[1] - 3;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="car.wav" vol={0.45} />
      <Sfx at={tFl - 4} src="whoosh.wav" vol={0.5} />
      <Sfx at={tAq - 4} src="thud.wav" vol={0.6} />
      <Stage cam={cam} y={980} s={1}>
        <rect x={-560} y={20} width={1120} height={120} fill={K.asph} stroke="#111" strokeWidth={4} />
        {new Array(8).fill(0).map((_, i) => <rect key={i} x={((i * 180 - f * 22) % 1440 + 1440) % 1440 - 720} y={60} width={90} height={12} fill={K.yellow} opacity={0.7} />)}
        <rect x={-560} y={0} width={1120} height={22} fill={K.blue} opacity={0.85} />
        {lift > 0 && <path d={`M-150 4 Q0 ${-50 * lift} 150 4 Z`} fill={K.blue} />}
        {new Array(14).fill(0).map((_, i) => {
          const ph = ((f * 1.5 + i * 7) % 24) / 24;
          const sd = i % 2 ? 1 : -1;
          return <circle key={i} cx={sd * (140 + ph * 220)} cy={-ph * 160 + ph * ph * 220} r={7 + (i % 3) * 3} fill="#8FD0FF" opacity={(1 - ph) * (0.4 + lift)} />;
        })}
        <Tire f={f} lift={lift} />
      </Stage>
      {f < c1 && <Big lines={['Água parada', 'é perigosa']} accent={K.red} f={f} at={0} />}
      {f >= c1 && <Big lines={['O pneu', 'flutua!']} accent={K.blue} f={f} at={c1} />}
      <Pill text="AQUAPLANAGEM" f={f} at={tAq - 4} x={180} y={1080} bg={K.red} color="#fff" size={58} rot={-3} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {f < c1 && <g transform={`translate(860,560) scale(${pop(f, 8, 30, 9)})`}>
          <polygon points="0,-70 64,46 -64,46" fill={K.yellow} stroke="#111" strokeWidth={6} strokeLinejoin="round" />
          <rect x={-7} y={-34} width={14} height={46} rx={5} fill="#111" /><circle cx={0} cy={28} r={8} fill="#111" />
        </g>}
      </svg>
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const S5: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(5, 3);
  const {fps} = useVideoConfig();
  const tEn = wt(5, 'entra'), tAm = wt(5, 'amolece'), tBu = wt(5, 'buraco');
  const ps = phraseStarts(5);
  const c1 = ps[1] - 3, c2 = ps[2] - 3;
  const seep = ease(f, tEn - 4, tAm + 6);
  const hole = pop(f, tBu - 4, fps, 10);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tEn - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tAm - 4} src="whoosh.wav" vol={0.4} />
      <Sfx at={tBu - 4} src="thud.wav" vol={0.8} />
      <RoadStage cam={cam} y={940}>
        <Road f={f} seep={seep} puddle={f < tBu - 4 ? 0.5 : 0} cracks={ease(f, tAm, tBu)} hole={f >= tBu - 4 ? hole : 0} sinkX={f >= tAm ? HC[0] : null} />
      </RoadStage>
      {f < c1 && <Big lines={['A água', 'entra...']} accent={K.blue} f={f} at={0} />}
      {f >= c1 && f < c2 && <Big lines={['...e amolece', 'a base']} accent={K.amber} f={f} at={c1} />}
      {f >= c2 && <Big lines={['Nasce o', 'buraco!']} accent={K.red} f={f} at={c2} />}
      {f >= c1 && f < c2 && <Pill text="BASE MOLE" f={f} at={tAm - 2} x={600} y={1080} bg={K.amber} color="#111" rot={-3} />}
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const S6: React.FC = () => {
  const f = useCurrentFrame();
  const tSa = wt(6, 'sarjeta'), tVa = wt(6, 'valeta'), tEm = wt(6, 'embora');
  const ps = phraseStarts(6);
  const c1 = ps[1] - 3;
  const zs = interpolate(f, [0, 12, c1, c1 + 8], [1.6, 2.0, 2.0, 1.7], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const cx = 360;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="rain.wav" vol={0.2} dur={Math.round(DURS[6] * FPS)} />
      <Sfx at={tSa - 4} src="pop.wav" vol={0.5} />
      <Sfx at={tVa - 4} src="pop.wav" vol={0.5} />
      <Sfx at={c1} src="whoosh.wav" vol={0.45} />
      <Stage x={540 - cx * zs + Math.sin(f / 40) * 6} y={800} s={zs}>
        <XSec f={f} crown={100} slide={1} flow={ease(f, 4, tVa + 10)} />
        {f >= tEm - 6 && [0, 1, 2].map((i) => {
          const ph = ((f + i * 10) % 30) / 30;
          return <circle key={i} cx={432} cy={50} r={8 + ph * 26} fill="none" stroke="#BFE3FA" strokeWidth={4} opacity={1 - ph} />;
        })}
      </Stage>
      <Rain f={f} a={0.5} />
      {f < c1 && <Big lines={['Na beirada:']} accent={K.yellow} f={f} at={0} />}
      {f >= c1 && <Big lines={['Leva a água', 'embora']} accent={K.blue} f={f} at={c1} />}
      <Pill text="SARJETA" f={f} at={tSa - 4} x={360} y={640} size={44} />
      <Pill text="VALETA" f={f} at={tVa - 4} x={600} y={1110} size={44} bg={K.amber} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {f >= tSa - 2 && <line x1={460} y1={712} x2={540 - cx * zs + 371 * zs} y2={800 + 8 * zs} stroke={K.yellow} strokeWidth={6} opacity={ease(f, tSa - 2, tSa + 4)} />}
        {f >= tVa - 2 && <line x1={680} y1={1108} x2={540 - cx * zs + 432 * zs} y2={800 + 50 * zs} stroke={K.amber} strokeWidth={6} opacity={ease(f, tVa - 2, tVa + 4)} />}
      </svg>
    </SceneIn>
  );
};

const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tEn = wt(7, 'engenharia'), tSe = wt(7, 'segue'), tAte = wt(7, 'ate');
  const items: [string, number][] = [['Escoa a chuva', tEn - 2], ['Evita aquaplanagem', tEn + 6], ['Protege a base', tEn + 14]];
  const endStart = tSe - 4;
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
        <Stage y={1040} s={0.85 + 0.05 * ease(f, 0, 40)}><XSec f={f} crown={100} slide={1} flow={1} arrows={1} /></Stage>
        <Big lines={['Curvinha =', 'engenharia!']} accent={K.green} f={f} at={0} />
        {items.map(([t, at], i) => {
          if (f < at) return null;
          const s = pop(f, at, fps, 10);
          return (
            <div key={t} style={{position: 'absolute', top: 500 + i * 88, left: 120, display: 'flex', alignItems: 'center', gap: 18, scale: String(s), transformOrigin: 'left center'}}>
              <Check ok size={60} />
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 56, color: K.text, letterSpacing: -2}}>{t}</div>
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
const MOUTH: number[] = mouthData as number[];
const mouthAt = (g: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, g))] ?? 0;
const blinkAt = (g: number) => {
  const period = 96, k = Math.floor(g / period), start = k * period + Math.floor(random('bl' + k) * 50);
  const d = g - start;
  return d >= 0 && d < 5 ? [0.5, 1, 1, 0.5, 0.1][d] : 0;
};
const END_FRAME = Math.round(STARTS[7] * FPS) + wt(7, 'segue') - 4;
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
      <Audio src={staticFile('voice_pavimentacao-03-abaulamento.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave03: React.FC = () => (
  <AbsoluteFill style={{background: K.bg}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(320).fill(0).map((_, i) => <circle key={i} cx={random('ax' + i) * 1080} cy={random('ay' + i) * 1920} r={1 + random('ar' + i) * 3} fill={random('ac' + i) > 0.5 ? K.grain : K.bg2} />)}
      {new Array(13).fill(0).map((_, i) => <rect key={i} x={60} y={i * 170 - 40} width={20} height={100} rx={4} fill={K.yellow} opacity={0.9} />)}
      <g transform="translate(560,1260) scale(0.92)"><XSec f={14} crown={80} slide={1} flow={1} arrows={1} /></g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#03</div>
    </div>
    <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 118, color: K.text, letterSpacing: -5, lineHeight: 0.98}}>
      Por que a<br />estrada é<br />
      <span style={{display: 'inline-block', background: K.yellow, color: '#111', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(255,194,14,0.35)', letterSpacing: -3, margin: '10px 0'}}>mais alta</span><br />
      no <span style={{color: K.yellow}}>meio?</span>
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
    <Composition id="Abaulamento" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave03" component={CapaPave03} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

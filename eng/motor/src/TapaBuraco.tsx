import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-02-tapa-buraco.json';
import mouthData from './mouth_pavimentacao-02-tapa-buraco.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 02';

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
const LEVELS = [0.6, 0.45, 0.3, 0.15, 0.45, 0.72, 1];
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

// ---------- objetos do tapa-buraco ----------
const BA: [number, number] = [HC[0] - 125, HC[1] - 80], BB: [number, number] = [HC[0] + 125, HC[1] + 80];
const BOXD = 62;
// caixa de corte retangular (iso). open: 0..1 (abertura), tack: cola, fill: 0..1 nivel da massa, comp: massa compactada (cor)
const CutBox: React.FC<{f: number; open?: number; tack?: number; fill?: number; hot?: number; clean?: number; layers?: number}> = ({f, open = 1, tack = 0, fill = 0, hot = 0, clean = 1, layers = 0}) => {
  if (open <= 0) return null;
  const d = BOXD * open;
  const [xa, ya] = BA, [xb, yb] = BB;
  const opening: P3[] = [[xa, ya, 0.7], [xb, ya, 0.7], [xb, yb, 0.7], [xa, yb, 0.7]];
  const wallY = (z0: number, z1: number): P3[] => [[xa, ya, z0], [xb, ya, z0], [xb, ya, z1], [xa, ya, z1]];
  const wallX = (z0: number, z1: number): P3[] => [[xa, ya, z0], [xa, yb, z0], [xa, yb, z1], [xa, ya, z1]];
  const zf = -d + d * fill;
  const tackCol = 'rgba(10,10,12,' + (0.85 * tack) + ')';
  return (
    <g>
      <defs><clipPath id="boxclip"><polygon points={pts(opening)} /></clipPath></defs>
      <g clipPath="url(#boxclip)">
        <Poly p={[[xa, ya, -d], [xb, ya, -d], [xb, yb, -d], [xa, yb, -d]]} fill="#8E887E" />
        <Poly p={wallY(-d, -32)} fill={K.base} /><Poly p={wallY(-32, 0.7)} fill="#2E3136" />
        <Poly p={wallX(-d, -32)} fill="#97918A" /><Poly p={wallX(-32, 0.7)} fill="#26292D" />
        {clean < 1 && new Array(14).fill(0).map((_, i) => { const q = iso([xa + 20 + random('db' + i) * 210, ya + 20 + random('dc' + i) * 120, -d]); return <circle key={i} cx={q[0]} cy={q[1]} r={4 + random('dd' + i) * 6} fill="#6B5A44" stroke="#000" strokeWidth={2} opacity={1 - clean} />; })}
        {tack > 0 && <g>
          <Poly p={[[xa, ya, -d], [xb, ya, -d], [xb, yb, -d], [xa, yb, -d]]} fill={tackCol} sw={0} />
          <Poly p={wallY(-d, 0.7)} fill={tackCol} sw={0} /><Poly p={wallX(-d, 0.7)} fill={tackCol} sw={0} />
          {new Array(10).fill(0).map((_, i) => { const q = iso([xa + 20 + random('tk' + i) * 210, ya + 20 + random('tl' + i) * 120, -d]); return <ellipse key={i} cx={q[0]} cy={q[1]} rx={14} ry={4} fill="#fff" opacity={0.35 * tack * (0.6 + 0.4 * Math.sin(f / 6 + i))} />; })}
        </g>}
        {fill > 0 && <g>
          <Poly p={[[xa, ya, zf], [xb, ya, zf], [xb, yb, zf], [xa, yb, zf]]} fill={hot > 0.5 ? '#1E1F22' : '#2C2F34'} stroke="#000" />
          {new Array(26).fill(0).map((_, i) => { const q = iso([xa + 10 + random('mx' + i) * 230, ya + 10 + random('my' + i) * 140, zf]); return <circle key={i} cx={q[0]} cy={q[1]} r={2 + random('mr' + i) * 3} fill="#55595F" />; })}
          {layers > 0 && new Array(layers).fill(0).map((_, i) => <Poly key={i} p={wallX(-d + (i + 1) * d / (layers + 1), -d + (i + 1) * d / (layers + 1) + 1)} fill={K.yellow} sw={0} op={0.9} />)}
        </g>}
      </g>
      <polygon points={pts(opening)} fill="none" stroke="#111" strokeWidth={3} />
    </g>
  );
};
const Steam: React.FC<{f: number; a: number; cx: number; cy: number}> = ({f, a, cx, cy}) => {
  if (a <= 0) return null;
  return (
    <g opacity={a}>
      {new Array(6).fill(0).map((_, i) => {
        const ph = ((f + i * 9) % 54) / 54;
        const x = cx - 130 + i * 52;
        return <path key={i} d={`M${x} ${cy - ph * 160} q 18 -25 0 -50 q -18 -25 0 -50`} stroke="#E8E8E8" strokeWidth={8} fill="none" strokeLinecap="round" opacity={(1 - ph) * 0.7} />;
      })}
    </g>
  );
};
// remendo mal feito: massa empelotada por cima do buraco redondo
const BadPatch: React.FC<{f: number; s?: number; gap?: number; lift?: number; gone?: number}> = ({f, s = 1, gap = 0, lift = 0, gone = 0}) => {
  if (s <= 0) return null;
  const sh = holeAt(1.15 * s);
  const wob = lift * Math.sin(f / 4) * 3;
  return (
    <g transform={`translate(0,${-lift * 10 + wob})`} opacity={1 - gone}>
      {gap > 0 && <path d={path(holeAt(1.22 * s), true)} fill="none" stroke={K.red} strokeWidth={6 * gap} strokeDasharray="14 10" />}
      <path d={path(sh, true)} fill="#2A2C30" stroke={gap > 0 ? '#000' : '#55595F'} strokeWidth={4 + 6 * gap} />
      {new Array(16).fill(0).map((_, i) => { const q = holeAt((0.15 + random('bp' + i) * 0.9) * s)[i % 14]; return <circle key={i} cx={q[0] + (random('bq' + i) - 0.5) * 40} cy={q[1] - 6 + (random('br' + i) - 0.5) * 20} r={(10 + random('bs' + i) * 14) * s} fill="#34373C" stroke="#111" strokeWidth={2} />; })}
    </g>
  );
};
const Chunks: React.FC<{f: number; at: number}> = ({f, at}) => {
  if (f < at) return null;
  const t = (f - at) / 30;
  const c = iso([HC[0], HC[1], 0]);
  return (
    <g>
      {new Array(12).fill(0).map((_, i) => {
        const vx = (random('vx' + i) - 0.3) * 520, vy = -300 - random('vy' + i) * 300;
        const x = c[0] + (random('cx' + i) - 0.5) * 120 + vx * t, y = c[1] + vy * t + 900 * t * t;
        return <rect key={i} x={x - 10} y={y - 8} width={16 + random('cw' + i) * 14} height={12 + random('ch' + i) * 10} rx={4} fill="#34373C" stroke="#111" strokeWidth={2} transform={`rotate(${f * 12 + i * 40},${x},${y})`} opacity={interpolate(t, [0.6, 1], [1, 0], clamp)} />;
      })}
    </g>
  );
};
const Shovel: React.FC<{x: number; y: number; rot: number; load?: boolean}> = ({x, y, rot, load = true}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-8} y={-230} width={16} height={210} rx={6} fill="#8B5A3C" stroke="#111" strokeWidth={4} />
    <path d="M-52 -30 L52 -30 L42 42 Q0 74 -42 42 Z" fill="#9AA0A8" stroke="#111" strokeWidth={5} />
    {load && <ellipse cx={0} cy={-12} rx={44} ry={20} fill="#2A2C30" />}
  </g>
);
const Saw: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-20} y={-210} width={40} height={150} rx={10} fill={K.amber} stroke="#111" strokeWidth={5} transform="rotate(25)" />
    <g transform={`rotate(${f * 40})`}>
      <circle r={70} fill="#C9CDD2" stroke="#111" strokeWidth={5} />
      {new Array(16).fill(0).map((_, i) => <path key={i} d="M-8 -70 L0 -84 L8 -70 Z" fill="#C9CDD2" stroke="#111" strokeWidth={3} transform={`rotate(${i * 22.5})`} />)}
      <circle r={16} fill="#555" stroke="#111" strokeWidth={4} />
    </g>
    <rect x={-90} y={-30} width={110} height={70} rx={12} fill={K.yellow} stroke="#111" strokeWidth={5} />
    {new Array(6).fill(0).map((_, i) => <circle key={i} cx={60 + random('sp' + i + f) * 60} cy={40 - random('sq' + i + f) * 60} r={3} fill={K.yellow} />)}
  </g>
);
const Roller: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g transform={`translate(${x},${y + Math.sin(f) * 2})`}>
    <rect x={-40} y={-170} width={150} height={100} rx={14} fill={K.yellow} stroke="#111" strokeWidth={6} />
    <rect x={-10} y={-230} width={90} height={64} rx={8} fill="#DDEFFC" stroke="#111" strokeWidth={5} />
    <rect x={-150} y={-80} width={150} height={92} rx={46} fill="#8A9097" stroke="#111" strokeWidth={6} />
    <line x1={-120} y1={-34} x2={-30} y2={-34} stroke="#111" strokeWidth={4} opacity={0.5} />
    <circle cx={80} cy={-20} r={42} fill="#2A2C30" stroke="#111" strokeWidth={6} />
    <circle cx={80} cy={-20} r={14} fill="#8A9097" />
  </g>
);
const Glue: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-50} y={-70} width={100} height={130} rx={18} fill="#F1F1F1" stroke="#111" strokeWidth={6} />
    <path d="M-20 -70 L-12 -110 L12 -110 L20 -70 Z" fill={K.amber} stroke="#111" strokeWidth={5} />
    <text y={10} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={34} fill="#111">COLA</text>
  </g>
);

// ---------- cenas ----------
const PATCHES_TD: [number, number, number][] = [[450, 640, 1], [660, 860, 0.85], [470, 1060, 1.1]];
const T0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tAb = wt(0, 'abre'), tPr = wt(0, 'problema'), tJe = wt(0, 'jeito');
  const c1 = tAb - 3, c2 = tPr - 3, c3 = tJe - 3;
  const shot = f < c1 ? 0 : f < c2 ? 1 : f < c3 ? 2 : 3;
  const c = iso([HC[0], HC[1], 0]);
  return (
    <SceneIn>
      <Bg />
      <Sfx at={0} src="whoosh.wav" vol={0.5} />
      <Sfx at={2} src="car.wav" vol={0.35} />
      {[c1, c2, c3].map((x, i) => <Sfx key={i} at={x} src="whoosh.wav" vol={0.4} />)}
      {PATCHES_TD.map((_, i) => <Sfx key={'p' + i} at={6 + i * 6} src="pop.wav" vol={0.4} />)}
      {PATCHES_TD.map((_, i) => <Sfx key={'h' + i} at={c1 + 2 + i * 5} src="thud.wav" vol={0.5} />)}
      {shot <= 1 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}} transform={shot === 1 ? `translate(${(random('k' + f) - 0.5) * 10},${(random('kk' + f) - 0.5) * 10})` : undefined}>
          <rect x={300} y={0} width={480} height={1920} fill={K.asphS} />
          <rect x={312} y={0} width={10} height={1920} fill="#fff" opacity={0.8} />
          <rect x={758} y={0} width={10} height={1920} fill="#fff" opacity={0.8} />
          {new Array(14).fill(0).map((_, i) => <rect key={i} x={533} y={((i * 150 + f * 4) % 2100) - 150} width={14} height={80} fill={K.yellow} />)}
          {PATCHES_TD.map(([x, y, sc], i) => {
            const at = 6 + i * 6;
            if (f < at) return null;
            const p = pop(f, at, fps, 9);
            const broken = f >= c1 + 2 + i * 5;
            return (
              <g key={i} transform={`translate(${x},${y}) scale(${p}) translate(${-x},${-y})`}>
                {broken ? <TopHole x={x} y={y} s={sc * 1.1} seed={'tb' + i} /> : (
                  <g>
                    <rect x={x - 70 * sc} y={y - 52 * sc} width={140 * sc} height={104 * sc} rx={40 * sc} fill="#1F2124" stroke="#5A5E64" strokeWidth={6} />
                    {new Array(5).fill(0).map((_, k) => <circle key={k} cx={x + (random('tp' + i + k) - 0.5) * 100 * sc} cy={y + (random('tq' + i + k) - 0.5) * 70 * sc} r={8 * sc} fill="#34373C" />)}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {shot >= 2 && (
        <RoadStage y={900} s={shot === 2 ? 1.3 : 1.05}>
          <Road f={f} hole={1} cracks={0.6} holeWater={false} />
          <Shovel x={c[0] + 150} y={c[1] - 120} rot={-25 + Math.sin(f / 5) * 12} />
          <ConeIcon x={-330} y={150} />
        </RoadStage>
      )}
      <Header />
      {shot === 0 && <Big lines={['Por que o', 'tapa-buraco...']} f={f} at={0} />}
      {shot === 1 && <Big lines={['...abre de novo', 'tão rápido?']} accent={K.red} f={f} at={c1} />}
      {shot === 2 && <Big lines={['O problema é...']} accent={K.text} f={f} at={c2} />}
      {shot === 3 && <Big lines={['...o jeito', 'de fazer']} f={f} at={c3} />}
      <CutFlash cuts={[c1, c2, c3]} />
    </SceneIn>
  );
};

const T1: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(1, 1);
  const tJo = wt(1, 'jogam'), tAg = wt(1, 'agua'), tLa = wt(1, 'lama');
  const c = iso([HC[0], HC[1], 0]);
  const dump = interpolate(f, [tJo - 4, tJo + 8], [0, 1], clamp);
  const fillP = ease(f, tJo + 4, tJo + 30);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tJo} src="thud.wav" vol={0.6} />
      <Sfx at={tAg - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tLa - 4} src="pop.wav" vol={0.45} />
      <RoadStage cam={cam}>
        <Road f={f} hole={1} cracks={0.6} puddle={0.45} />
        {f >= tLa - 4 && <path d={path(holeAt(0.55).map(([x, y]) => [x + 20, y + 14] as P2), true)} fill="#7A5A3A" opacity={ease(f, tLa - 4, tLa + 6)} />}
        <BadPatch f={f} s={fillP} />
        {new Array(5).fill(0).map((_, i) => {
          const t0 = tJo + i * 3; if (f < t0 || f > t0 + 14) return null;
          const p = (f - t0) / 14;
          return <circle key={i} cx={c[0] + 120 - 110 * p + i * 8} cy={c[1] - 200 + 220 * p * p} r={16} fill="#2A2C30" stroke="#111" strokeWidth={3} />;
        })}
        <Shovel x={c[0] + 160} y={c[1] - 180} rot={-20 - 70 * dump} />
      </RoadStage>
      <Big lines={['Jeito', 'errado']} accent={K.red} f={f} at={0} />
      <Pill text="ÁGUA" f={f} at={tAg - 4} x={640} y={560} bg={K.blue} color="#fff" rot={-4} />
      <Pill text="LAMA" f={f} at={tLa - 4} x={700} y={680} bg="#7A5A3A" color="#fff" rot={3} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}><XMark f={f} at={tLa + 6} cx={180} cy={1060} r={60} w={18} /></svg>
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const T2: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(2, 3);
  const {fps} = useVideoConfig();
  const tBo = wt(2, 'borda'), tCo = wt(2, 'cola'), tGr = wt(2, 'gruda');
  const gap = ease(f, tBo - 4, tBo + 8);
  const lift = ease(f, tGr - 4, tGr + 8);
  const g = pop(f, tCo - 6, fps, 9);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tBo - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tCo - 6} src="pop.wav" vol={0.45} />
      <Sfx at={tGr - 2} src="thud.wav" vol={0.5} />
      <RoadStage cam={cam}>
        <Road f={f} hole={1} cracks={0.8} holeWater={false} />
        <BadPatch f={f} gap={gap} lift={lift} />
      </RoadStage>
      {f < tCo - 6 && <Big lines={['Borda', 'torta']} accent={K.red} f={f} at={0} />}
      {f >= tCo - 6 && <Big lines={['Sem', 'cola']} accent={K.red} f={f} at={tCo - 6} />}
      {f >= tCo - 6 && (
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <Glue x={850} y={560} s={g} />
          <XMark f={f} at={tCo} cx={850} cy={540} r={80} w={16} />
        </svg>
      )}
      <Pill text="NÃO GRUDA" f={f} at={tGr - 4} x={560} y={1110} bg={K.red} color="#fff" rot={-3} />
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const T3: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(3, 2);
  const {fps} = useVideoConfig();
  const tBa = wt(3, 'batem'), tCo = wt(3, 'compactar'), tPn = wt(3, 'pneu'), tAr = wt(3, 'arranca');
  const c = iso([HC[0], HC[1], 0]);
  const tap = f < tCo - 4 ? Math.abs(Math.sin(((f - tBa + 8) / 10) * Math.PI)) : 0;
  const carX = interpolate(f, [tPn - 14, tAr + 22], [-560, 560], clamp);
  const gone = ease(f, tAr - 2, tAr + 8);
  const tags = [tBa - 2, tBa + 8, tBa + 18].filter((x) => x < tCo - 4);
  return (
    <SceneIn>
      <Bg /><Header />
      {tags.map((x, i) => <Sfx key={i} at={x} src="thud.wav" vol={0.45} />)}
      <Sfx at={tPn - 14} src="car.wav" vol={0.6} />
      <Sfx at={tAr - 2} src="thud.wav" vol={0.8} />
      <RoadStage cam={cam}>
        <Road f={f} hole={gone > 0 ? 1 : 0} cracks={0.8} holeWater={false} />
        <BadPatch f={f} gone={gone} />
        <Chunks f={f} at={tAr - 2} />
        {f < tCo - 4 && <Shovel x={c[0] + 40} y={c[1] - 40 - tap * 60} rot={-160} load={false} />}
        {f > tPn - 14 && <Car x={carX} y={HC[1] + 10} />}
      </RoadStage>
      <Big lines={['Só na', 'pá']} f={f} at={0} />
      <Pill text="SEM COMPACTAR" f={f} at={tCo - 4} x={500} y={560} bg={K.red} color="#fff" rot={-3} />
      {f >= tAr - 2 && <div style={{position: 'absolute', top: 1080, left: 520, fontFamily: 'InterD', fontWeight: 900, fontSize: 90, color: K.red, scale: String(pop(f, tAr - 2, fps, 8)), rotate: '-6deg'}}>VOLTOU!</div>}
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const T4: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(4, 0);
  const {fps} = useVideoConfig();
  const tCo = wt(4, 'cortando'), tPa = wt(4, 'paredes'), tBa = wt(4, 'base');
  const [xa, ya] = BA, [xb, yb] = BB;
  const outline: P2[] = [[xa, ya], [xb, ya], [xb, yb], [xa, yb], [xa, ya]].map(([x, y]) => iso([x, y, 0.8]));
  const cut = ease(f, tCo - 6, tPa - 8);
  const sawP = partial(outline, cut);
  const sp = sawP[sawP.length - 1] ?? outline[0];
  const open = ease(f, tPa - 8, tPa + 6);
  const ok = pop(f, tBa - 2, fps, 9);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tCo - 6} src="truck.wav" vol={0.35} dur={Math.max(1, tPa - tCo)} />
      {[0, 6, 12, 18, 24].map((d) => <Sfx key={d} at={tCo - 4 + d} src="tick.wav" vol={0.35} />)}
      <Sfx at={tPa - 6} src="whoosh.wav" vol={0.45} />
      <Sfx at={tBa - 2} src="pop.wav" vol={0.5} />
      <RoadStage cam={cam}>
        <Road f={f} hole={open < 0.5 ? 1 : 0} cracks={0.5 * (1 - open)} holeWater={false} />
        <CutBox f={f} open={open} clean={0} />
        {cut > 0 && open < 0.5 && <path d={path(sawP)} stroke={K.yellow} strokeWidth={6} strokeDasharray="16 10" fill="none" />}
        {cut > 0 && cut < 1 && <g transform={`translate(${sp[0]},${sp[1] - 70}) scale(0.8)`}><Saw x={0} y={0} f={f} /></g>}
        {f >= tPa - 4 && [[xa, ya], [xa, yb]].map(([x, y], i) => { const q = iso([x, y, -BOXD / 2]); return <g key={i} opacity={ease(f, tPa - 4, tPa + 4)}><path d={`M${q[0] - 24} ${q[1] - 40} L${q[0] - 24} ${q[1] + 30}`} stroke={K.yellow} strokeWidth={7} /><rect x={q[0] - 24} y={q[1] + 6} width={22} height={22} fill="none" stroke={K.yellow} strokeWidth={5} /></g>; })}
      </RoadStage>
      <Big lines={['Jeito', 'certo']} accent={K.green} f={f} at={0} />
      <Pill text="RETÂNGULO" f={f} at={wt(4, 'retangulo') - 4} x={620} y={560} />
      <Pill text="PAREDES RETAS" f={f} at={tPa - 4} x={560} y={680} />
      {f >= tBa - 2 && (
        <div style={{position: 'absolute', top: 1100, left: 470, display: 'flex', alignItems: 'center', gap: 14, scale: String(ok), transformOrigin: 'left center'}}>
          <div style={{width: 70, height: 70, borderRadius: 35, background: K.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 42, color: '#0B3D25'}}>✓</div>
          <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 56, color: K.text}}>BASE FIRME</div>
        </div>
      )}
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const T5: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCam(5, 2);
  const tLi = wt(5, 'limpa'), tPi = wt(5, 'pintura'), tEn = wt(5, 'enche'), tQu = wt(5, 'quente'), tCa = wt(5, 'camadas');
  const clean = ease(f, tLi - 2, tLi + 14);
  const tack = ease(f, tPi - 4, tPi + 16);
  const fill = 0.45 * ease(f, tEn - 2, tEn + 14) + 0.45 * ease(f, tCa - 2, tCa + 12);
  const c = iso([HC[0], HC[1], 0]);
  const phase = f < tPi - 4 ? 0 : f < tEn - 4 ? 1 : 2;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tLi - 2} src="whoosh.wav" vol={0.5} />
      <Sfx at={tPi - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tEn - 2} src="thud.wav" vol={0.55} />
      <Sfx at={tQu - 4} src="pop.wav" vol={0.45} />
      <Sfx at={tCa - 2} src="thud.wav" vol={0.55} />
      <RoadStage cam={cam}>
        <Road f={f} hole={0} cracks={0} />
        <CutBox f={f} clean={clean} tack={tack} fill={fill} hot={fill > 0 ? 1 : 0} layers={f >= tCa ? 1 : 0} />
        {phase === 0 && new Array(6).fill(0).map((_, i) => { const p = ((f * 2 + i * 10) % 30) / 30; return <line key={i} x1={c[0] - 100 + i * 40} y1={c[1] - 10 - p * 120} x2={c[0] - 80 + i * 40} y2={c[1] - 40 - p * 120} stroke="#fff" strokeWidth={6} opacity={(1 - p) * 0.7} strokeLinecap="round" />; })}
        {phase === 1 && (
          <g transform={`translate(${c[0] + 60 + Math.sin(f / 4) * 40},${c[1] - 150})`}>
            <rect x={-10} y={-120} width={20} height={130} rx={6} fill="#555" stroke="#111" strokeWidth={4} />
            <path d="M-40 10 L40 10 L20 40 L-20 40 Z" fill="#333" stroke="#111" strokeWidth={4} />
            {new Array(5).fill(0).map((_, i) => <line key={i} x1={-16 + i * 8} y1={44} x2={-24 + i * 12} y2={44 + 30 + ((f + i * 3) % 10) * 3} stroke="#111" strokeWidth={4} opacity={0.8} />)}
          </g>
        )}
        <Steam f={f} a={phase === 2 ? ease(f, tQu - 4, tQu + 6) : 0} cx={c[0]} cy={c[1] - 20} />
      </RoadStage>
      {phase === 0 && <Big lines={['1. Limpa']} accent={K.green} f={f} at={0} />}
      {phase === 1 && <Big lines={['2. Cola de', 'asfalto']} accent={K.yellow} f={f} at={tPi - 4} />}
      {phase === 2 && <Big lines={['3. Massa', 'quente']} accent={K.amber} f={f} at={tEn - 4} />}
      {phase === 1 && <Pill text="PINTURA DE LIGAÇÃO" f={f} at={tPi + 2} x={400} y={1110} size={36} />}
      <Pill text="EM CAMADAS" f={f} at={tCa - 4} x={640} y={560} bg={K.amber} />
      <CutFlash cuts={cam.cut} />
    </SceneIn>
  );
};

const T6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tRo = wt(6, 'rolo'), tPl = wt(6, 'placa'), tDu = wt(6, 'dura'), tSe = wt(6, 'segue'), tAte = wt(6, 'ate');
  const rx = interpolate(f, [4, tDu - 4], [-520, 440], clamp);
  const comp = ease(f, 10, tDu - 6);
  const done = ease(f, tDu - 6, tDu + 6);
  const items: [string, number][] = [['Corte reto', tDu - 4], ['Cola de asfalto', tDu + 2], ['Massa quente', tDu + 8], ['Compactação', tDu + 14]];
  const endStart = tSe - 4;
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[6] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={4} src="truck.wav" vol={0.45} dur={Math.max(1, tDu - 8)} />
      <Sfx at={tRo - 4} src="pop.wav" vol={0.4} />
      <Sfx at={tPl - 4} src="pop.wav" vol={0.4} />
      {items.map(([, t], i) => <Sfx key={i} at={t} src="pop.wav" vol={0.45} />)}
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />
      <AbsoluteFill style={{opacity: 1 - end}}>
        <RoadStage y={f < tDu - 6 ? 900 : 1080} s={f < tDu - 6 ? 1.2 : 0.95}>
          <Road f={f} hole={0} cracks={0} />
          {done < 1 && <g opacity={1 - done}><CutBox f={f} fill={0.9 + 0.1 * comp} hot={0} layers={1} /></g>}
          {done > 0 && <path d={path([[BA[0], BA[1]], [BB[0], BA[1]], [BB[0], BB[1]], [BA[0], BB[1]]].map(([x, y]) => iso([x, y, 0.8])), true)} fill="#2C2F34" stroke="#1A1B1E" strokeWidth={4} opacity={done} />}
          {f < tDu && <Roller x={iso([rx, HC[1] + 40, 0])[0]} y={iso([rx, HC[1] + 40, 0])[1] + 10} f={f} />}
        </RoadStage>
        {f < tDu - 6 && <Big lines={['Compacta', 'cada camada']} f={f} at={0} />}
        {f >= tDu - 6 && <Big lines={['Agora', 'dura!']} accent={K.green} f={f} at={tDu - 6} />}
        {f < tDu - 6 && <Pill text="ROLO" f={f} at={tRo - 4} x={640} y={560} />}
        {f < tDu - 6 && <Pill text="PLACA VIBRATÓRIA" f={f} at={tPl - 4} x={480} y={670} size={36} />}
        {f >= tDu - 6 && items.map(([t, at], i) => {
          if (f < at) return null;
          const s = pop(f, at, fps, 10);
          return (
            <div key={t} style={{position: 'absolute', top: 500 + i * 92, left: 120, display: 'flex', alignItems: 'center', gap: 18, scale: String(s), transformOrigin: 'left center'}}>
              <div style={{width: 64, height: 64, borderRadius: 32, background: K.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: '#0B3D25'}}>✓</div>
              <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 60, color: K.text, letterSpacing: -2}}>{t}</div>
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

const SCENES = [T0, T1, T2, T3, T4, T5, T6];

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
      <Audio src={staticFile('voice_pavimentacao-02-tapa-buraco.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave02: React.FC = () => (
  <AbsoluteFill style={{background: K.bg}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(320).fill(0).map((_, i) => <circle key={i} cx={random('ax' + i) * 1080} cy={random('ay' + i) * 1920} r={1 + random('ar' + i) * 3} fill={random('ac' + i) > 0.5 ? K.grain : K.bg2} />)}
      {new Array(13).fill(0).map((_, i) => <rect key={i} x={60} y={i * 170 - 40} width={20} height={100} rx={4} fill={K.yellow} opacity={0.9} />)}
      <ellipse cx={590} cy={1490} rx={360} ry={42} fill="#000" opacity={0.35} />
      <g transform="translate(600,1125) scale(0.95)">
        <Road f={0} hole={1} cracks={1} holeWater={false} />
        <BadPatch f={0} lift={0.6} gap={0.8} />
        <Chunks f={9} at={0} />
        <ConeIcon x={-330} y={150} s={1.1} /><ConeIcon x={330} y={-120} s={0.9} />
      </g>
    </svg>
    <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#02</div>
    </div>
    <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 122, color: K.text, letterSpacing: -6, lineHeight: 0.98}}>
      Por que o<br />
      <span style={{display: 'inline-block', background: K.yellow, color: '#111', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(255,194,14,0.35)', letterSpacing: -3, margin: '10px 0'}}>tapa-buraco</span><br />
      não <span style={{color: K.red}}>dura?</span>
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
    <Composition id="TapaBuraco" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave02" component={CapaPave02} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

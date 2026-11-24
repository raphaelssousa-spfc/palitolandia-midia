import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-10-junta-ponte.json';
import mouthData from './mouth_pavimentacao-10-junta-ponte.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 10';

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
const LEVELS = [0.85, 0.9, 0.75, 0.7, 0.15, 0.95, 0.35, 0.95];
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
      <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 24, color: K.grey, letterSpacing: 4, whiteSpace: 'nowrap'}}>SAÚDE DA PONTE</div>
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
const Arrow: React.FC<{x: number; y: number; dir: number; f: number; at: number; col?: string}> = ({x, y, dir, f, at, col = K.yellow}) => {
  if (f < at) return null;
  const p = ease(f, at, at + 10), wig = Math.sin(f / 3) * 8;
  return (
    <g transform={`translate(${x + dir * (p * 40 + wig)},${y}) scale(${dir},1)`} opacity={p}>
      <path d="M-50 -16 L20 -16 L20 -40 L70 0 L20 40 L20 16 L-50 16 Z" fill={col} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};
// ---------- ponte ----------
const SY = 880;
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
const JX = 430;
const gaussf = (x: number, c: number, w: number) => Math.exp(-((x - c) ** 2) / (2 * w * w));
const ROAD_CR: [number, number][][] = new Array(5).fill(0).map((_, i) => {
  let x = JX - 190 + i * 40, y = 0; const out: [number, number][] = [[x, y]];
  for (let k = 0; k < 4; k++) { x += (random('rcx' + i + k) - 0.5) * 30; y += 14 + random('rcy' + i + k) * 10; out.push([x, y]); }
  return out;
});
const DECK_CR: P2[][] = new Array(5).fill(0).map((_, i) => {
  let x = 40 + i * 55, y = 0; const out: P2[] = [[x, y]];
  for (let k = 0; k < 5; k++) { x += (random('dcx' + i + k) - 0.5) * 40; y += 16 + random('dcy' + i + k) * 8; out.push([x, y]); }
  return out;
});
type BP = {f: number; gap?: number; bulge?: number; cracks?: number; deckCr?: number; dirt?: number; noJoint?: boolean; deckCol?: string};
const roadTop = (x: number, bulge: number) => SY - bulge * 70 * gaussf(x, JX - 110, 60);
const Bridge: React.FC<BP> = ({f, gap = 18, bulge = 0, cracks = 0, deckCr = 0, dirt = 0, noJoint = false, deckCol = '#B8BDC4'}) => {
  const x0 = JX + gap;
  const xs = new Array(84).fill(0).map((_, i) => -400 + i * 10).filter((x) => x <= JX).concat([JX]);
  const top = xs.map((x) => [x, roadTop(x, bulge)] as P2);
  const asphalt = 'M' + top.map((p) => p.join(',')).join(' L') + ' ' + top.slice().reverse().map((p) => `L${p[0]},${p[1] + 36}`).join(' ') + ' Z';
  const base = 'M' + top.map((p) => `${p[0]},${p[1] + 36}`).join(' L') + ` L${JX},${SY + 80} L-400,${SY + 80} Z`;
  return (
    <g>
      <rect x={JX} y={SY + 330} width={1400} height={700} fill="#1E4E6E" />
      {new Array(9).fill(0).map((_, i) => <rect key={i} x={JX + 40 + ((i * 150 + f * 3) % 1300)} y={SY + 360 + (i % 3) * 60} width={70} height={8} rx={4} fill="#5FA8D8" opacity={0.5} />)}
      <rect x={-400} y={SY + 80} width={JX + 400} height={950} fill={K.soil} stroke="#111" strokeWidth={5} />
      {new Array(30).fill(0).map((_, i) => <circle key={i} cx={-380 + random('sx' + i) * (JX + 340)} cy={SY + 110 + random('sy' + i) * 500} r={3 + random('sr' + i) * 6} fill="rgba(0,0,0,0.2)" />)}
      <rect x={JX - 70} y={SY + 36} width={70} height={420} fill="#9AA0A8" stroke="#111" strokeWidth={5} />
      <path d={base} fill={K.base} stroke="#111" strokeWidth={4} />
      <path d={asphalt} fill={K.asph} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
      {cracks > 0 && ROAD_CR.map((c, i) => {
        const q = partial(c.map(([x, y]) => [x, roadTop(x, bulge) + y] as P2), interpolate(cracks, [i * 0.12, i * 0.12 + 0.5], [0, 1], clamp));
        return q.length > 1 ? <path key={i} d={path(q)} stroke="#0A0A0A" strokeWidth={6} fill="none" strokeLinecap="round" /> : null;
      })}
      {/* pilar e tabuleiro */}
      <rect x={880} y={SY + 150} width={90} height={500} fill="#A3A8AF" stroke="#111" strokeWidth={5} />
      <rect x={x0} y={SY + 100} width={1600} height={50} fill="#8E949B" stroke="#111" strokeWidth={5} />
      <rect x={x0} y={SY + 16} width={1600} height={86} fill={deckCol} stroke="#111" strokeWidth={5} />
      <rect x={x0} y={SY} width={1600} height={18} fill={K.asph} stroke="#111" strokeWidth={4} />
      {new Array(22).fill(0).map((_, i) => <rect key={i} x={x0 + 20 + i * 70} y={SY - 46} width={10} height={46} fill="#D8DCE0" stroke="#111" strokeWidth={2} />)}
      <rect x={x0} y={SY - 52} width={1600} height={12} rx={6} fill="#D8DCE0" stroke="#111" strokeWidth={3} />
      {deckCr > 0 && DECK_CR.map((c, i) => {
        const q = partial(c.map(([x, y]) => [x0 + x, SY + 20 + y] as P2), interpolate(deckCr, [i * 0.12, i * 0.12 + 0.5], [0, 1], clamp));
        return q.length > 1 ? <path key={i} d={path(q)} stroke="#111" strokeWidth={5} fill="none" strokeLinecap="round" /> : null;
      })}
      {!noJoint && <g>
        <rect x={JX - 14} y={SY - 2} width={14} height={24} fill="#5B6168" stroke="#111" strokeWidth={3} />
        <rect x={x0} y={SY - 2} width={14} height={24} fill="#5B6168" stroke="#111" strokeWidth={3} />
        {gap > 0 && <rect x={JX} y={SY} width={gap} height={60} fill="#0B0C0E" />}
      </g>}
      {dirt > 0 && new Array(12).fill(0).map((_, i) => {
        const a = interpolate(dirt, [i / 16, i / 16 + 0.3], [0, 1], clamp);
        return <circle key={i} cx={JX + 4 + random('dx' + i) * Math.max(4, gap - 8) + (i > 8 ? (random('dz' + i) - 0.5) * 60 : 0)} cy={SY + 50 - (i % 9) * 6 - (i > 8 ? 6 : 0)} r={(6 + random('dr' + i) * 6) * a} fill={i % 2 ? '#7A5230' : '#9C6B45'} stroke="#111" strokeWidth={2} />;
      })}
    </g>
  );
};
const CarSide: React.FC<{x: number; f: number; gap?: number; color?: string}> = ({x, f, gap = 18, color = '#E63946'}) => {
  const b = (wx: number) => (gap > 0 ? 9 * gaussf(wx, JX + gap / 2, 9) : 0);
  const bf = b(x + 62), br = b(x - 62);
  const lift = (bf + br) * 0.7, tilt = (br - bf) * 0.5;
  const wheel = (wx: number, bb: number) => (
    <g transform={`translate(${wx},${SY - 28 - bb}) rotate(${f * 18})`}>
      <circle r={28} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><circle r={12} fill="#B9BDC2" />
      <rect x={-3} y={-24} width={6} height={14} fill="#55595F" />
    </g>
  );
  return (
    <g>
      <g transform={`translate(0,${-lift}) rotate(${tilt} ${x} ${SY - 60})`}>
        <path d={`M${x - 70} ${SY - 84} L${x - 40} ${SY - 128} L${x + 38} ${SY - 128} L${x + 76} ${SY - 84} Z`} fill={color} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${x - 52} ${SY - 86} L${x - 33} ${SY - 116} L${x - 4} ${SY - 116} L${x - 4} ${SY - 86} Z M${x + 6} ${SY - 86} L${x + 6} ${SY - 116} L${x + 33} ${SY - 116} L${x + 56} ${SY - 86} Z`} fill="#BFE3FA" />
        <rect x={x - 104} y={SY - 88} width={208} height={48} rx={16} fill={color} stroke="#111" strokeWidth={5} />
        <rect x={x + 88} y={SY - 78} width={14} height={10} rx={4} fill={K.yellow} />
      </g>
      {wheel(x - 62, br)}{wheel(x + 62, bf)}
    </g>
  );
};
// quando a roda (dianteira e traseira) passa na junta
const tecTimes = (x0: number, v: number, start = 0, gap = 18) => [(JX + gap / 2 - 62 - x0) / v + start, (JX + gap / 2 + 62 - x0) / v + start];
const Tec: React.FC<{f: number; at: number; x: number; y: number; rot?: number}> = ({f, at, x, y, rot = -8}) => {
  if (f < at || f > at + 26) return null;
  const s = pop(f, at, 30, 8), o = interpolate(f, [at + 16, at + 26], [1, 0], clamp);
  return <g transform={`translate(${x},${y - (f - at) * 1.5}) rotate(${rot}) scale(${s})`} opacity={o}>
    <path d="M-110 -50 L-60 -60 L-40 -95 L0 -62 L50 -90 L60 -55 L115 -50 L80 -10 L110 35 L50 30 L30 70 L0 35 L-50 65 L-55 25 L-110 30 L-80 -10 Z" fill={K.yellow} stroke="#111" strokeWidth={6} strokeLinejoin="round" />
    <text x={0} y={14} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={54} fill="#111">TEC!</text>
  </g>;
};
// junta dente-de-pente vista de cima
const Finger: React.FC<{g: number; cy?: number; dirt?: number; broken?: number}> = ({g, cy = 820, dirt = 0, broken = 0}) => {
  const eL = 540 - 60 - g / 2, eR = 540 + 60 + g / 2, y0 = cy - 260, n = 7, h = 520 / n;
  return (
    <g>
      <rect x={-50} y={y0 - 20} width={1180} height={560} fill={K.asph} />
      {new Array(60).fill(0).map((_, i) => <circle key={i} cx={random('fx' + i) * 1080} cy={y0 - 10 + random('fy' + i) * 540} r={2 + random('fr' + i) * 4} fill="rgba(255,255,255,0.12)" />)}
      <rect x={eL - 170} y={y0} width={170} height={520} fill="#8A9097" stroke="#111" strokeWidth={5} />
      <rect x={eR} y={y0} width={170} height={520} fill="#8A9097" stroke="#111" strokeWidth={5} />
      <rect x={eL} y={y0} width={eR - eL} height={520} fill="#0B0C0E" />
      {new Array(n).fill(0).map((_, i) => i % 2 === 0
        ? <rect key={i} x={eL - 6} y={y0 + i * h + 6} width={126} height={h - 12} rx={8} fill="#A3A9B0" stroke="#111" strokeWidth={4} transform={broken > 0 && i === 2 ? `rotate(${broken * 25} ${eL} ${y0 + i * h + h / 2})` : undefined} />
        : <rect key={i} x={eR - 120} y={y0 + i * h + 6} width={126} height={h - 12} rx={8} fill="#A3A9B0" stroke="#111" strokeWidth={4} />)}
      {new Array(10).fill(0).map((_, i) => <circle key={i} cx={eL - 140 + (i % 2) * 90} cy={y0 + 30 + Math.floor(i / 2) * 115} r={12} fill="#55595F" stroke="#111" strokeWidth={3} />)}
      {new Array(10).fill(0).map((_, i) => <circle key={i} cx={eR + 50 + (i % 2) * 90} cy={y0 + 30 + Math.floor(i / 2) * 115} r={12} fill="#55595F" stroke="#111" strokeWidth={3} />)}
      {dirt > 0 && new Array(40).fill(0).map((_, i) => {
        const a = interpolate(dirt, [i / 50, i / 50 + 0.25], [0, 1], clamp);
        return <circle key={i} cx={eL + 10 + random('fd' + i) * (eR - eL - 20)} cy={y0 + 20 + random('fe' + i) * 480} r={(12 + random('ff' + i) * 14) * a} fill={i % 3 ? '#7A5230' : '#9C6B45'} stroke="#111" strokeWidth={3} />;
      })}
    </g>
  );
};
const DimLine: React.FC<{x1: number; x2: number; y: number; p: number; label: string; f: number; at: number}> = ({x1, x2, y, p, label, f, at}) => {
  const xe = x1 + (x2 - x1) * p;
  return <g>
    <line x1={x1} y1={y} x2={xe} y2={y} stroke={K.yellow} strokeWidth={8} />
    <line x1={x1} y1={y - 26} x2={x1} y2={y + 26} stroke={K.yellow} strokeWidth={8} />
    {p >= 1 && <line x1={x2} y1={y - 26} x2={x2} y2={y + 26} stroke={K.yellow} strokeWidth={8} />}
    {f >= at && <g transform={`translate(${(x1 + x2) / 2},${y - 50}) scale(${pop(f, at, 30, 9)})`}>
      <rect x={-130} y={-56} width={260} height={84} rx={16} fill={K.yellow} stroke="#111" strokeWidth={5} />
      <text x={0} y={8} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={62} fill="#111">{label}</text>
    </g>}
  </g>;
};
const Moon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={140} fill="#9FD3F7" opacity={0.12} />
    <path d="M30 -78 A80 80 0 1 0 30 78 A62 62 0 1 1 30 -78 Z" fill="#E8F1FA" stroke="#9FD3F7" strokeWidth={5} />
  </g>
);
const Stars: React.FC<{f: number; a: number}> = ({f, a}) => (
  <g opacity={a}>{new Array(26).fill(0).map((_, i) => <circle key={i} cx={random('stx' + i) * 1080} cy={300 + random('sty' + i) * 420} r={2 + random('str' + i) * 3} fill="#fff" opacity={0.5 + 0.5 * Math.sin(f / 6 + i)} />)}</g>
);

// ================= CENAS =================
const S0: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[0] * FPS);
  const v = 10, x0 = 40;
  const [t1, t2] = tecTimes(x0, v);
  const cam = interpolate(f, [0, total], [1.05, 1.4], clamp);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="car.wav" vol={0.35} />
      <Sfx at={t1} src="thud.wav" vol={0.55} /><Sfx at={t1} src="tick.wav" vol={0.6} />
      <Sfx at={t2} src="thud.wav" vol={0.55} /><Sfx at={t2} src="tick.wav" vol={0.6} />
      <Sfx at={wt(0, 'por') - 2} src="whoosh.wav" vol={0.35} />
      <Svg><CamG s={cam} cx={JX} cy={SY} y={30}>
        <Bridge f={f} />
        <CarSide x={x0 + v * f} f={f} />
      </CamG>
        <Tec f={f} at={t1} x={330} y={740} />
        <Tec f={f} at={t2} x={720} y={720} rot={8} />
      </Svg>
      <Big lines={['Por que', 'TEC-TEC?']} f={f} at={0} size={130} />
    </SceneIn>
  );
};
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const tF = wt(1, 'fenda') - 3, tM = wt(1, 'metal') - 3, tP = wt(1, 'ponte') - 3, tE = wt(1, 'estrada') - 3;
  const g = 60 + 14 * Math.sin(f / 9);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tF]} />
      <Sfx at={2} src="whoosh.wav" vol={0.4} />
      <Sfx at={wt(1, 'junta') - 2} src="pop.wav" vol={0.45} />
      <Sfx at={tF} src="whoosh.wav" vol={0.4} />
      <Sfx at={tM} src="tick.wav" vol={0.5} />
      <Sfx at={tP} src="pop.wav" vol={0.4} /><Sfx at={tE} src="pop.wav" vol={0.4} />
      {f < tF && <>
        <Svg><CamG s={interpolate(f, [0, tF], [2.2, 2.6], clamp)} cx={JX} cy={SY} x={110 - JX + 540 - 110} y={40}>
          <Bridge f={f} gap={18} />
        </CamG>
          <path d={`M540 ${SY - 260} L540 ${SY - 110}`} stroke={K.yellow} strokeWidth={12} strokeLinecap="round" />
          <path d={`M505 ${SY - 150} L540 ${SY - 100} L575 ${SY - 150}`} stroke={K.yellow} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Pill text="JUNTA DE" f={f} at={wt(1, 'junta') - 3} x={130} y={300} size={70} />
        <Pill text="DILATAÇÃO" f={f} at={wt(1, 'dilatacao') - 3} x={130} y={410} size={70} bg="#FFFFFF" />
      </>}
      {f >= tF && <>
        <Svg><CamG s={interpolate(f, [tF, tF + 60], [1.15, 1.0], clamp)} cy={820}><Finger g={g} /></CamG></Svg>
        <Big lines={['Uma', 'FENDA']} f={f} at={tF} size={120} />
        {f >= tM && <Pill text="DE METAL" f={f} at={tM} x={600} y={1105} size={50} bg="#B9BDC2" />}
        {f >= tE && <Pill text="ESTRADA" f={f} at={tE} x={80} y={1105} size={46} bg="#FFFFFF" />}
        {f >= tP && <Pill text="PONTE" f={f} at={tP} x={760} y={480} size={46} />}
      </>}
    </SceneIn>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const tFr = wt(2, 'no', 1) - 4, tE = wt(2, 'estica') - 4, tEn = wt(2, 'encolhe') - 4;
  const heat = ease(f, 4, tE + 6) * (1 - ease(f, tFr, tFr + 14));
  const cold = ease(f, tFr, tEn + 6);
  const gap = 40 - 28 * heat + 30 * cold;
  const night = f >= tFr;
  const v = Math.round(25 + heat * 35 - cold * 15);
  return (
    <SceneIn>
      <AbsoluteFill style={{background: night ? lerpC('#25282D', '#101830', cold) : lerpC('#25282D', '#3A2620', heat)}} />
      <Header />
      <CutFlash cuts={[tFr]} />
      <Sfx at={0} src="whoosh.wav" vol={0.35} />
      <Sfx at={tE} src="pop.wav" vol={0.45} />
      <Sfx at={tFr} src="whoosh.wav" vol={0.4} />
      <Sfx at={tEn} src="pop.wav" vol={0.45} />
      <Svg>
        {night && <Stars f={f} a={cold} />}
        {!night ? <Sun x={interpolate(f, [0, tFr], [700, 900], clamp)} y={620} s={0.7 + heat * 0.2} f={f} /> : <Moon x={860} y={620} s={0.8} />}
        <CamG s={0.95} cx={JX} cy={SY} x={-120} y={60}>
          <Bridge f={f} gap={gap} deckCol={night ? lerpC('#B8BDC4', '#9FC3E0', cold) : lerpC('#B8BDC4', '#E8A07A', heat)} />
          {!night && heat > 0.1 && <Heat f={f} a={heat} y0={SY - 40} />}
        </CamG>
        {!night && <Arrow x={JX - 120 + 140} y={SY - 70} dir={-1} f={f} at={tE} col={K.amber} />}
        {night && <Arrow x={JX - 120 + 160} y={SY - 70} dir={1} f={f} at={tEn} col={K.blue} />}
        <Thermo x={960} y={1130} v={v} s={0.45} />
      </Svg>
      {!night && <Big lines={['No sol', 'ESTICA']} accent={K.amber} f={f} at={0} size={120} />}
      {night && <Big lines={['No frio', 'ENCOLHE']} accent={K.blue} f={f} at={tFr} size={120} />}
    </SceneIn>
  );
};
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const t100 = wt(3, '100') - 4, t3 = wt(3, '3') - 4;
  const dim = ease(f, t100, t100 + 14);
  const g = 40 + 110 * (0.5 + 0.5 * Math.sin((f - t3) / 10));
  const cm = Math.min(3, Math.max(0, (f - t3) / 6)).toFixed(0);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[t3]} />
      <Sfx at={t100} src="whoosh.wav" vol={0.4} />
      <Sfx at={t100 + 14} src="pop.wav" vol={0.45} />
      <Sfx at={t3} src="thud.wav" vol={0.5} />
      {[0, 6, 12].map((d) => <Sfx key={d} at={t3 + d} src="tick.wav" vol={0.4} />)}
      {f < t3 && <>
        <Svg><CamG s={interpolate(f, [0, t3], [0.75, 0.68], clamp)} cx={JX} cy={SY} x={-260} y={40}>
          <Bridge f={f} gap={22} />
          <DimLine x1={JX + 22} x2={JX + 1500} y={SY - 160} p={dim} label="100 m" f={f} at={t100 + 12} />
          <CarSide x={JX + 1400 - f * 8} f={-f} />
        </CamG></Svg>
        <Big lines={['Ponte de', '100 METROS']} f={f} at={0} size={115} />
      </>}
      {f >= t3 && <>
        <Svg><CamG s={1.05} cy={860}><Finger g={g} cy={860} /></CamG>
          <g>
            <line x1={540 - g / 2 - 60} x2={540 + g / 2 + 60} y1={600} y2={600} stroke={K.yellow} strokeWidth={10} />
            <path d={`M${540 - g / 2 - 40} 575 L${540 - g / 2 - 70} 600 L${540 - g / 2 - 40} 625`} stroke={K.yellow} strokeWidth={10} fill="none" />
            <path d={`M${540 + g / 2 + 40} 575 L${540 + g / 2 + 70} 600 L${540 + g / 2 + 40} 625`} stroke={K.yellow} strokeWidth={10} fill="none" />
          </g>
        </Svg>
        <div style={{position: 'absolute', top: 250, left: 120, fontFamily: 'InterD', fontWeight: 900, fontSize: 190, letterSpacing: -8, color: K.yellow, scale: String(0.9 + 0.1 * pop(f, t3, 30, 8)), transformOrigin: 'left center'}}>{cm} cm</div>
        <Pill text="FRIO ↔ CALOR" f={f} at={wt(3, 'frio') - 3} x={560} y={330} size={46} bg="#FFFFFF" />
      </>}
    </SceneIn>
  );
};
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const tEm = wt(4, 'empurra') - 4, tEs = wt(4, 'estufa') - 4, tR = wt(4, 'racha') - 4;
  const bulge = ease(f, tEm, tEs + 10);
  const cracks = ease(f, tR, tR + 20);
  const shake = f >= tR && f < tR + 12 ? Math.sin(f * 3) * 8 : 0;
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tEm]} />
      <Sfx at={0} src="whoosh.wav" vol={0.35} />
      <Sfx at={tEm} src="truck.wav" vol={0.35} dur={40} />
      <Sfx at={tEs} src="thud.wav" vol={0.55} />
      <Sfx at={tR} src="thud.wav" vol={0.6} /><Sfx at={tR + 3} src="tick.wav" vol={0.5} />
      <Svg><CamG s={interpolate(f, [0, tEm, tEm + 10], [1.1, 1.1, 1.55], clamp)} cx={JX} cy={SY} x={shake - 60} y={60}>
        <Bridge f={f} gap={0} noJoint bulge={bulge} cracks={cracks} deckCol={lerpC('#B8BDC4', '#E8A07A', ease(f, 0, 20))} />
        {f >= tEm && <Arrow x={JX + 170} y={SY - 60} dir={-1} f={f} at={tEm} col={K.red} />}
      </CamG>
        <XMark f={f} at={tR + 6} cx={830} cy={560} r={60} />
      </Svg>
      <Pill text="SEM JUNTA" f={f} at={2} x={130} y={300} size={70} bg={K.red} color="#fff" />
      <Pill text="ESTUFA" f={f} at={tEs} x={130} y={420} size={60} bg={K.amber} />
      <Pill text="RACHA" f={f} at={tR} x={430} y={420} size={60} />
    </SceneIn>
  );
};
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tR = wt(5, 'respira') - 4, tA = wt(5, 'abre') - 4, tFe = wt(5, 'fecha') - 4;
  const breathe = 0.5 + 0.5 * Math.sin(f / 9);
  const g = f < tFe ? 40 + 110 * ease(f, tA, tA + 12) : 150 - 120 * ease(f, tFe, tFe + 12);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tA]} />
      <Sfx at={0} src="whoosh.wav" vol={0.35} />
      <Sfx at={tR} src="pop.wav" vol={0.5} />
      <Sfx at={tA} src="whoosh.wav" vol={0.4} />
      <Sfx at={tFe} src="pop.wav" vol={0.45} />
      {f < tA && <>
        <Svg><CamG s={1.25} cx={JX} cy={SY} x={-40} y={60}>
          <Bridge f={f} gap={14 + 26 * breathe} />
          <Arrow x={JX + 160} y={SY - 70} dir={breathe > 0.5 ? 1 : -1} f={f} at={tR} col={K.green} />
        </CamG>
          {f >= tR + 4 && <g transform={`translate(880,560) scale(${pop(f, tR + 4, fps, 9)})`}><circle r={56} fill={K.green} stroke="#111" strokeWidth={5} /><path d="M-24 0 L-6 20 L28 -20" stroke="#0B3D25" strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
        </Svg>
        <Big lines={['A ponte', 'RESPIRA']} accent={K.green} f={f} at={0} size={120} />
      </>}
      {f >= tA && <>
        <Svg><CamG s={1.0} cy={860}><Finger g={g} cy={860} /></CamG>
          {f < tFe ? <Moon x={880} y={520} s={0.55} /> : <Sun x={880} y={520} s={0.5} f={f} />}
        </Svg>
        {f < tFe ? <Pill text="FRIO: ABRE" f={f} at={tA} x={120} y={330} size={70} bg={K.blue} /> : <Pill text="CALOR: FECHA" f={f} at={tFe} x={120} y={330} size={70} bg={K.amber} />}
      </>}
    </SceneIn>
  );
};
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const tRu = wt(6, 'ruim') - 4, tEn = wt(6, 'entupida') - 4, tTr = wt(6, 'trava') - 4, tTi = wt(6, 'trinca') - 4, tQ = wt(6, 'quebrada') - 4;
  const v = 12, x0 = -150;
  const [t1, t2] = tecTimes(x0, v);
  const dirt = ease(f, tEn, tEn + 18);
  return (
    <SceneIn>
      <Bg /><Header />
      <CutFlash cuts={[tRu, tTr]} />
      <Sfx at={0} src="car.wav" vol={0.3} />
      <Sfx at={t1} src="tick.wav" vol={0.6} /><Sfx at={t2} src="tick.wav" vol={0.6} />
      <Sfx at={wt(6, 'bom') - 2} src="cash.wav" vol={0.3} />
      <Sfx at={tRu} src="whoosh.wav" vol={0.4} />
      <Sfx at={tQ} src="thud.wav" vol={0.5} />
      <Sfx at={tEn} src="pop.wav" vol={0.45} />
      <Sfx at={tTr} src="thud.wav" vol={0.55} />
      <Sfx at={tTi} src="thud.wav" vol={0.6} />
      {f < tRu && <>
        <Svg><CamG s={1.3} cx={JX} cy={SY} y={40}>
          <Bridge f={f} />
          <CarSide x={x0 + v * f} f={f} color="#3DDC84" />
        </CamG>
          <Tec f={f} at={t1} x={330} y={740} /><Tec f={f} at={t2} x={740} y={720} rot={8} />
        </Svg>
        <Pill text="BOM SINAL ✓" f={f} at={wt(6, 'bom') - 3} x={130} y={300} size={80} bg={K.green} />
      </>}
      {f >= tRu && f < tTr && <>
        <Svg><CamG s={1.0} cy={860}><Finger g={70} cy={860} dirt={dirt} broken={ease(f, tQ, tQ + 8)} /></CamG>
          <XMark f={f} at={tEn + 8} cx={880} cy={530} r={55} />
        </Svg>
        <Pill text="QUEBRADA" f={f} at={tQ} x={120} y={300} size={66} bg={K.red} color="#fff" />
        <Pill text="ENTUPIDA" f={f} at={tEn} x={120} y={410} size={66} bg="#9C6B45" color="#fff" />
      </>}
      {f >= tTr && <>
        <Svg><CamG s={1.6} cx={JX} cy={SY} x={20} y={40}>
          <Bridge f={f} gap={20} dirt={1} deckCr={ease(f, tTi, tTi + 20)} deckCol={lerpC('#B8BDC4', '#E8A07A', ease(f, tTr, tTr + 12))} />
          <Arrow x={JX + 150} y={SY - 70} dir={-1} f={f} at={tTr} col={K.red} />
        </CamG></Svg>
        <Pill text="TRAVA" f={f} at={tTr} x={130} y={300} size={80} bg={K.red} color="#fff" />
        <Pill text="E TRINCA" f={f} at={tTi} x={460} y={300} size={80} />
      </>}
    </SceneIn>
  );
};
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tSu = wt(7, 'voce') - 4, tSe = wt(7, 'segue'), tAte = wt(7, 'ate');
  const endStart = Math.min(tSe - 4, wt(7, 'comenta') - 4);
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[7] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  const v = 11, x0 = 0;
  const [t1, t2] = tecTimes(x0, v);
  return (
    <SceneIn>
      <Sfx at={t1} src="tick.wav" vol={0.5} /><Sfx at={t2} src="tick.wav" vol={0.5} />
      <Sfx at={tSu} src="pop.wav" vol={0.45} />
      <Sfx at={tSu + 8} src="pop.wav" vol={0.45} />
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />
      <AbsoluteFill style={{opacity: 1 - end}}>
        {f < tSu && <>
          <Bg /><Header />
          <Svg><CamG s={1.15} cx={JX} cy={SY} y={40}><Bridge f={f} /><CarSide x={x0 + v * f} f={f} color={K.yellow} /></CamG>
            <Tec f={f} at={t1} x={330} y={740} /><Tec f={f} at={t2} x={740} y={720} rot={8} />
          </Svg>
          <Big lines={['Curte e', 'MANDA']} f={f} at={0} size={120} />
        </>}
        {f >= tSu && <>
          <Bg />
          <Svg><CamG s={1.15} cx={JX} cy={SY} y={120}><Bridge f={f} /></CamG></Svg>
          <AbsoluteFill style={{background: 'rgba(10,12,16,0.5)'}} />
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 80, color: '#fff', letterSpacing: -3}}>Já reparou no tec-tec?</div>
          {[['A', 'SIM', K.yellow, '#111', 0], ['B', 'NÃO', K.card, '#fff', 8]].map(([l, t, bg, c, d]) => {
            const s = pop(f, tSu + (d as number), fps, 9);
            return <div key={l as string} style={{position: 'absolute', top: 470 + (d as number) * 25, left: 200, right: 200, display: 'flex', alignItems: 'center', gap: 26, background: bg as string, color: c as string, border: `6px solid ${K.yellow}`, borderRadius: 30, padding: '22px 36px', scale: String(s), fontFamily: 'InterD', fontWeight: 900, fontSize: 84}}>
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
      <Audio src={staticFile('voice_pavimentacao-10-junta-ponte.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave10: React.FC = () => {
  const xc = JX - 62 + 9 - 2;
  return (
    <AbsoluteFill style={{background: K.bg}}>
      <Bg />
      <Svg><CamG s={1.55} cx={JX} cy={SY} x={110 - JX + 430} y={260}>
        <Bridge f={10} gap={26} />
        <CarSide x={xc + 4} f={0} gap={26} />
      </CamG>
        <Tec f={10} at={2} x={300} y={1000} />
        <Tec f={10} at={4} x={800} y={960} rot={8} />
      </Svg>
      <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#10</div>
      </div>
      <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 118, color: K.text, letterSpacing: -5, lineHeight: 0.98, textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>
        Por que<br />a ponte faz<br />
        <span style={{display: 'inline-block', background: K.yellow, color: '#111', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(0,0,0,0.35)', letterSpacing: -3, margin: '10px 0', textShadow: 'none'}}>tec-tec?</span>
      </div>
      <div style={{position: 'absolute', top: 1560, left: 110, right: 110, display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(20,22,26,0.85)', borderRadius: 100, padding: '14px 20px'}}>
        <div style={{width: 150, height: 150, borderRadius: 75, overflow: 'hidden', background: K.card, border: `7px solid ${K.yellow}`, flexShrink: 0}}><Raphael mouth={0} blink={0} /></div>
        <div>
          <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 44, color: K.text, textShadow: '0 4px 16px #000'}}>{HANDLE}</div>
          <div style={{fontFamily: 'InterD', fontWeight: 600, fontSize: 30, color: K.grey}}>Engenheiro civil explica</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const Root: React.FC = () => (
  <>
    <Composition id="Junta" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave10" component={CapaPave10} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);


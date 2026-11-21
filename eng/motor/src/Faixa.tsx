import React from 'react';
import {
  AbsoluteFill, Audio, Composition, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing, random,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timing from './timing_pavimentacao-08-faixa-brilha.json';
import mouthData from './mouth_pavimentacao-08-faixa-brilha.json';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

const FPS = 30;
const DURS: number[] = timing.durs;
const STARTS = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
const TOTAL = Math.round(DURS.reduce((a, b) => a + b, 0) * FPS);
const HANDLE = '@eng.raphaelserra';
const SERIES = 'PAVIMENTAÇÃO · 08';

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
const LEVELS = [0.95, 0.5, 0.7, 0.8, 0.98, 0.12, 0.85, 0.97];
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
      <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 24, color: K.grey, letterSpacing: 4, whiteSpace: 'nowrap'}}>BRILHO DA FAIXA</div>
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

// ================= ESTRADA À NOITE (vista do motorista) =================
const VPY = 560, BOT = 1300, RH = BOT - VPY;
const proj = (x0: number, d: number): P2 => [540 + (x0 * 640) / d, VPY + RH / d];
const quad = (x0: number, w: number, d1: number, d2: number) => {
  const a = Math.max(1, d1), b = Math.max(1.001, d2);
  return [proj(x0 - w, a), proj(x0 + w, a), proj(x0 + w, b), proj(x0 - w, b)].map((p) => p.join(',')).join(' ');
};
type NR = {f: number; speed?: number; beam?: number; glow?: number; wet?: number; fresh?: number; worn?: number};
const NightRoad: React.FC<NR> = ({f, speed = 0.11, beam = 1, glow = 1, wet = 0, fresh = 99, worn = 0.15}) => {
  const off = (f * speed) % 2;
  const br = (d: number) => {
    const g = d < fresh ? glow : worn;
    return Math.max(0, Math.min(1, g * beam * Math.max(0, (11 - d) / 9.5) * (1 - 0.8 * wet)));
  };
  const segs: {d: number; x0: number; col: string; w: number}[] = [];
  for (let k = 0; k < 20; k++) { const d = 1 + k * 2 - off; if (d > 0.4) segs.push({d, x0: 0, col: K.yellow, w: 0.035}); }
  for (let k = 0; k < 60; k++) { const d = 0.6 + k * 0.7; for (const x0 of [-0.86, 0.86]) segs.push({d, x0, col: '#FFFFFF', w: 0.03}); }
  const posts: number[] = [];
  for (let k = 0; k < 12; k++) { const d = 1 + k * 3 - ((f * speed) % 3); if (d > 0.7) posts.push(d); }
  return (
    <g>
      <rect x={-400} y={-400} width={1880} height={VPY + 400} fill="url(#sky)" />
      {new Array(60).fill(0).map((_, i) => <circle key={i} cx={random('sx' + i) * 1080} cy={random('sy' + i) * (VPY - 60)} r={1 + random('sr' + i) * 2} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(f / 15 + i))} />)}
      <circle cx={860} cy={300} r={46} fill="#F2EBC9" opacity={0.85} />
      <path d={`M-400 ${VPY} L1480 ${VPY} L1480 2000 L-400 2000 Z`} fill="#121417" />
      {[[-420, 140], [-160, 90], [1020, 120], [1240, 160]].map(([x, h], i) => <path key={i} d={`M${x - 120} ${VPY + 4} Q${x} ${VPY - h} ${x + 120} ${VPY + 4} Z`} fill="#0C0E12" />)}
      <polygon points={`${proj(-1.05, 30).join(',')} ${proj(1.05, 30).join(',')} ${proj(1.05, 0.62).join(',')} ${proj(-1.05, 0.62).join(',')}`} fill="#26292E" />
      {wet > 0 && new Array(9).fill(0).map((_, i) => <polygon key={i} points={quad(-0.6 + i * 0.15, 0.02, 1, 12)} fill="#8FB8D8" opacity={0.12 * wet} />)}
      <polygon points={`380,${BOT} 700,${BOT} ${proj(0.28, 9).join(',')} ${proj(-0.22, 9).join(',')}`} fill="#FFF3C4" opacity={0.1 * beam} filter="url(#blur2)" />
      {segs.map((s, i) => {
        const b = br(s.d);
        return <g key={i}>
          {b > 0.1 && <polygon points={quad(s.x0, s.w * 2.4, s.d, s.d + (s.x0 === 0 ? 0.9 : 0.5))} fill={s.col} opacity={b * 0.55} filter="url(#blur)" />}
          <polygon points={quad(s.x0, s.w, s.d, s.d + (s.x0 === 0 ? 0.9 : 0.5))} fill={lerpC('#3A3D43', s.col === K.yellow ? '#FFD23F' : '#FFFFFF', 0.12 + 0.88 * b)} />
        </g>;
      })}
      {posts.map((d, i) => [-1.2, 1.2].map((x0) => {
        const [x, y] = proj(x0, d); const h = (0.45 * 640) / d, w = (0.05 * 640) / d; const b = br(d);
        return <g key={i + '_' + x0}>
          <rect x={x - w / 2} y={y - h} width={w} height={h} fill="#D8D8D8" opacity={0.25 + 0.4 * b} />
          <rect x={x - w / 2} y={y - h} width={w} height={h * 0.18} fill={x0 < 0 ? K.amber : '#FF4040'} opacity={0.3 + 0.7 * b} />
        </g>;
      }))}
    </g>
  );
};
const CamG: React.FC<{s: number; x?: number; y?: number; cx?: number; cy?: number; children: React.ReactNode}> = ({s, x = 0, y = 0, cx = 540, cy = 900, children}) => (
  <g transform={`translate(${cx + x},${cy + y}) scale(${s}) translate(${-cx},${-cy})`}>{children}</g>
);
const Sparkle: React.FC<{x: number; y: number; s: number; f: number}> = ({x, y, s, f}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${f * 3})`} opacity={0.9}>
    <path d="M0 -40 L8 -8 L40 0 L8 8 L0 40 L-8 8 L-40 0 L-8 -8 Z" fill="#FFFFFF" />
  </g>
);
const Bead: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g><circle cx={x} cy={y} r={r} fill="url(#glass)" stroke="#9CC9EE" strokeWidth={Math.max(2, r / 12)} /><ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.22} ry={r * 0.13} fill="#fff" opacity={0.9} /></g>
);
const SideCar: React.FC<{x: number; y: number; s?: number; light?: number}> = ({x, y, s = 1, light = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-120 20 L-120 -20 Q-110 -40 -70 -44 L-40 -80 Q-20 -92 30 -90 L70 -50 Q110 -46 120 -20 L120 20 Z" fill="#E63946" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M-30 -78 L24 -78 L54 -48 L-50 -48 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    <circle cx={-70} cy={22} r={26} fill="#1B1C1F" stroke="#111" strokeWidth={4} /><circle cx={70} cy={22} r={26} fill="#1B1C1F" stroke="#111" strokeWidth={4} />
    <circle cx={-70} cy={22} r={10} fill="#B9BDC2" /><circle cx={70} cy={22} r={10} fill="#B9BDC2" />
    <circle cx={116} cy={-12} r={11} fill="#FFF3C4" opacity={0.4 + 0.6 * light} />
    <circle cx={-2} cy={-66} r={11} fill="#F1C27D" stroke="#111" strokeWidth={3} />
  </g>
);
const pl = (ps: P2[]) => ps.map((p) => p.join(',')).join(' ');

// ---------- caminhão de pintura (vista lateral) ----------
const RY = 1010;
const StripeTruck: React.FC<{x: number; f: number}> = ({x, f}) => (
  <g transform={`translate(${x},${RY})`}>
    <rect x={-340} y={-58} width={130} height={14} fill="#55585F" stroke="#111" strokeWidth={3} />
    <rect x={-300} y={-52} width={14} height={30} fill="#55585F" />
    <rect x={-352} y={-96} width={56} height={46} rx={6} fill="#B9D7EE" stroke="#111" strokeWidth={4} />
    <rect x={-230} y={-60} width={14} height={36} fill="#55585F" />
    <rect x={-250} y={-210} width={290} height={150} rx={10} fill="#F2F2F2" stroke="#111" strokeWidth={5} />
    <rect x={-250} y={-120} width={290} height={22} fill={K.yellow} />
    <circle cx={-170} cy={-160} r={34} fill="#DDDDDD" stroke="#111" strokeWidth={4} /><circle cx={-80} cy={-160} r={34} fill="#DDDDDD" stroke="#111" strokeWidth={4} />
    <path d="M40 -60 L40 -190 L120 -190 L160 -120 L160 -60 Z" fill={K.yellow} stroke="#111" strokeWidth={5} strokeLinejoin="round" />
    <path d="M60 -175 L112 -175 L140 -125 L60 -125 Z" fill="#9FD3F7" stroke="#111" strokeWidth={4} />
    <rect x={-20} y={-232} width={40} height={22} rx={6} fill={K.amber} opacity={0.6 + 0.4 * Math.abs(Math.sin(f / 4))} stroke="#111" strokeWidth={3} />
    {[-170, 100].map((wx) => <g key={wx} transform={`translate(${wx},-38)`}><circle r={40} fill="#1B1C1F" stroke="#111" strokeWidth={5} /><g transform={`rotate(${f * 12})`}>{[0, 72, 144, 216, 288].map((a) => <rect key={a} x={-5} y={-30} width={10} height={22} fill="#8A9097" transform={`rotate(${a})`} />)}</g><circle r={10} fill="#B9BDC2" /></g>)}
  </g>
);

// ================= CENAS =================
const S0: React.FC = () => {
  const f = useCurrentFrame();
  const beam = interpolate(f, [0, 8], [0.25, 1], clamp);
  const z = interpolate(f, [0, 90], [1, 1.14], clamp);
  return (
    <SceneIn>
      <Sfx at={0} src="car.wav" vol={0.35} />
      <Sfx at={2} src="whoosh.wav" vol={0.4} />
      <Svg><CamG s={z} cy={800}><NightRoad f={f + 30} speed={0.16} beam={beam} /></CamG>
        {[0, 1, 2].map((i) => { const t = ((f + i * 13) % 40) / 40; const [x, y] = proj(0, 1.3 + i * 2.1); return <Sparkle key={i} x={x} y={y - 6} s={0.4 + 0.8 * Math.sin(t * Math.PI)} f={f} />; })}
      </Svg>
      <Big lines={['Por que', 'BRILHA?']} f={f} at={0} size={130} />
    </SceneIn>
  );
};
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tSe = wt(1, 'segredo') - 4, tEs = wt(1, 'especial');
  const sh = f >= tSe;
  const shake = Math.sin(f / 2) * 4;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tEs + 4} src="thud.wav" vol={0.4} />
      <Sfx at={tSe} src="whoosh.wav" vol={0.4} />
      <Sfx at={wt(1, 'vidro')} src="pop.wav" vol={0.5} />
      {!sh && <>
        <Svg>
          <g transform={`translate(540,${830 + shake}) rotate(${shake / 2})`}>
            <ellipse cx={0} cy={-200} rx={190} ry={40} fill="#BFC3C8" stroke="#111" strokeWidth={6} />
            <path d="M-190 -200 L-190 180 Q0 230 190 180 L190 -200 Q0 -160 -190 -200 Z" fill="#D9DCE0" stroke="#111" strokeWidth={6} />
            <path d="M-190 -60 Q0 -20 190 -60 L190 90 Q0 130 -190 90 Z" fill={K.yellow} />
            <text x={0} y={45} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={64} fill="#111">TINTA</text>
            <path d="M-30 -220 Q-10 -320 60 -300" stroke="#111" strokeWidth={8} fill="none" />
          </g>
          <XMark f={f} at={tEs + 2} cx={540} cy={830} r={230} w={30} />
        </Svg>
        <Pill text="TINTA ESPECIAL?" f={f} at={2} x={250} y={420} size={56} rot={-3} />
      </>}
      {sh && <>
        <Svg>
          {new Array(26).fill(0).map((_, i) => {
            const at = tSe + i * 1.2; const p = pop(f, at, fps, 9);
            const x = 200 + random('bx' + i) * 680, yy = 620 + random('by' + i) * 520, r = 34 + random('br' + i) * 46;
            return f >= at ? <g key={i} transform={`translate(${x},${yy - (1 - p) * 300}) scale(${p})`}><Bead x={0} y={0} r={r} /></g> : null;
          })}
          {[0, 1, 2, 3].map((i) => { const t = ((f + i * 9) % 30) / 30; return <Sparkle key={i} x={260 + i * 190} y={700 + (i % 2) * 300} s={Math.sin(t * Math.PI) * 1.2} f={f} />; })}
        </Svg>
        <Big lines={['O segredo é', 'VIDRO']} accent="#9FD3F7" f={f} at={tSe} size={120} />
      </>}
    </SceneIn>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const total = Math.round(DURS[2] * FPS);
  const tB = wt(2, 'joga') - 4;
  const tx = interpolate(f, [0, total], [330, 880], clamp);
  const n1 = tx - 293, n2 = tx - 324;
  const zo = ease(f, tB, tB + 12);
  const s = 1.2 + zo * 0.6, cx = 540 + (n2 - 540) * zo;
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={0} src="truck.wav" vol={0.35} />
      <Sfx at={tB} src="whoosh.wav" vol={0.35} />
      <Sfx at={wt(2, 'bolinhas')} src="tick.wav" vol={0.4} />
      <Svg><CamG s={s} cx={cx} cy={RY - 80} x={540 - cx}>
        <rect x={-600} y={RY} width={2400} height={170} fill={K.asph} stroke="#111" strokeWidth={5} />
        {new Array(40).fill(0).map((_, i) => <circle key={i} cx={-500 + i * 55} cy={RY + 40 + (i % 3) * 35} r={5} fill="#55585F" />)}
        <rect x={-600} y={RY - 12} width={n1 + 600} height={13} fill="#F5F5F5" stroke="#111" strokeWidth={2} />
        {new Array(Math.max(0, Math.floor((n2 + 600) / 11))).fill(0).map((_, i) => <circle key={i} cx={-600 + i * 11 + 5} cy={RY - 13} r={4.5} fill="#CFEAFF" stroke="#7FB2DA" strokeWidth={1} />)}
        <polygon points={`${n1 - 4},${RY - 70} ${n1 + 4},${RY - 70} ${n1 + 26},${RY - 10} ${n1 - 26},${RY - 10}`} fill="#FFFFFF" opacity={0.55 + 0.3 * Math.sin(f)} />
        {f >= tB - 8 && new Array(14).fill(0).map((_, i) => { const ph = ((f * 1.3 + i * 3) % 16) / 16; return <circle key={i} cx={n2 - 22 + random('dx' + i) * 44} cy={RY - 50 + ph * 38} r={4} fill="#CFEAFF" stroke="#7FB2DA" strokeWidth={1} />; })}
        <StripeTruck x={tx} f={f} />
      </CamG></Svg>
      <Pill text="1. TINTA" f={f} at={wt(2, 'pinta')} x={130} y={480} size={54} bg="#FFFFFF" />
      <Pill text="2. VIDRO" f={f} at={wt(2, 'bolinhas')} x={560} y={480} size={54} bg="#9FD3F7" />
      <Pill text="TINTA MOLHADA" f={f} at={wt(2, 'molhada') - 2} x={300} y={600} size={40} bg={K.yellow} rot={-2} />
    </SceneIn>
  );
};
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tF = wt(3, 'fica') - 4;
  const sh = f >= tF;
  const sink = ease(f, tF + 4, tF + 22);
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={wt(3, 'tamanho')} src="pop.wav" vol={0.4} />
      <Sfx at={wt(3, 'areia')} src="pop.wav" vol={0.4} />
      <Sfx at={tF} src="whoosh.wav" vol={0.4} />
      <Svg>
        {!sh && <g>
          <g transform={`translate(330,820) scale(${pop(f, 0, fps, 9)})`}><Bead x={0} y={0} r={150} /></g>
          <g transform={`translate(760,820) scale(${pop(f, wt(3, 'areia') - 4, fps, 9)}) rotate(${f})`}><polygon points="-140,-40 -60,-150 70,-130 150,-20 110,110 -30,150 -150,80" fill="#C9A46A" stroke="#111" strokeWidth={6} /><circle cx={-30} cy={-30} r={14} fill="#A8844E" /><circle cx={50} cy={40} r={10} fill="#A8844E" /></g>
          {f >= wt(3, 'areia') && <text x={545} y={850} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={110} fill={K.yellow}>=</text>}
          <text x={330} y={1060} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={46} fill="#9FD3F7">VIDRO</text>
          {f >= wt(3, 'areia') - 4 && <text x={760} y={1060} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={46} fill="#C9A46A">AREIA</text>}
        </g>}
        {sh && <g>
          <circle cx={540} cy={820} r={360} fill="#30343A" stroke={K.yellow} strokeWidth={12} />
          <clipPath id="lupa"><circle cx={540} cy={820} r={354} /></clipPath>
          <g clipPath="url(#lupa)">
            <rect x={0} y={900} width={1080} height={400} fill={K.asph} />
            {[0, 1, 2, 3].map((i) => { const x = 300 + i * 160, y0 = 600, y1 = 900 - 6; const y = y0 + (y1 - y0) * ease(f, tF + i * 3, tF + 14 + i * 3); return <Bead key={i} x={x} y={y} r={62} />; })}
            <rect x={0} y={860} width={1080} height={50} fill="#F2F2F2" opacity={0.85} />
            <line x1={180} y1={860} x2={900} y2={860} stroke="#111" strokeWidth={4} />
          </g>
          <path d="M800 1080 L960 1240" stroke={K.yellow} strokeWidth={40} strokeLinecap="round" />
          {sink > 0.9 && <text x={540} y={1020} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={44} fill="#fff">TINTA</text>}
        </g>}
      </Svg>
      {sh && <Pill text="MEIO ENTERRADA" f={f} at={wt(3, 'enterrada') - 2} x={290} y={400} size={56} />}
      {!sh && <Pill text="MINÚSCULA" f={f} at={2} x={330} y={420} size={56} bg="#9FD3F7" />}
    </SceneIn>
  );
};
const BX = 620, BYC = 830, BR = 220;
const onB = (deg: number): P2 => [BX + BR * Math.cos((deg * Math.PI) / 180), BYC + BR * Math.sin((deg * Math.PI) / 180)];
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tL = wt(4, 'luz') - 2, tE = wt(4, 'entra'), tBa = wt(4, 'bate'), tV = wt(4, 'volta');
  const H: P2 = [266, 568], P1 = onB(-150), P2b = onB(100), P3 = onB(-125), E: P2 = [210, 520];
  const pin = ease(f, tL, tE + 10), phit = ease(f, tBa - 6, tBa + 4), pout = ease(f, tV - 4, tV + 14);
  const cam = interpolate(f, [0, tBa, tV], [1, 1.08, 0.98], clamp);
  return (
    <SceneIn>
      <AbsoluteFill style={{background: '#0B0F18'}} />
      <Header />
      <Sfx at={tL} src="whoosh.wav" vol={0.3} />
      <Sfx at={tBa} src="tick.wav" vol={0.5} />
      <Sfx at={tV} src="cash.wav" vol={0.35} />
      <Svg><g transform="translate(0,120)"><CamG s={cam} cy={800}>
        <circle cx={900} cy={380} r={50} fill="#F2EBC9" opacity={0.85} />
        <rect x={-100} y={BYC} width={1300} height={250} fill="#F2F2F2" />
        <rect x={-100} y={BYC + 250} width={1300} height={400} fill={K.asph} />
        <Bead x={BX} y={BYC} r={BR} />
        <path d={`M${BX - BR} ${BYC} A${BR} ${BR} 0 0 0 ${BX + BR} ${BYC} Z`} fill="#FFFFFF" opacity={0.28} />
        <SideCar x={150} y={600} light={1} />
        {pin > 0 && <polyline points={pl(partial([H, P1, P2b], pin))} fill="none" stroke={K.yellow} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34 16" strokeDashoffset={-f * 4} />}
        {phit > 0 && <circle cx={P2b[0]} cy={P2b[1]} r={20 + 60 * phit} fill={K.yellow} opacity={0.6 * (1 - phit * 0.6)} />}
        {pout > 0 && <polyline points={pl(partial([P2b, P3, E], pout))} fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34 16" strokeDashoffset={-f * 4} />}
        {pout > 0.95 && <Sparkle x={E[0]} y={E[1] - 20} s={0.8 + 0.3 * Math.sin(f / 3)} f={f} />}
      </CamG></g></Svg>
      <Pill text="FAROL" f={f} at={tL} x={330} y={600} size={46} />
      <Pill text="BATE NO FUNDO" f={f} at={tBa - 2} x={690} y={1120} size={40} bg="#9FD3F7" />
      <Big lines={['E VOLTA', 'PRO MOTORISTA']} accent="#FFFFFF" f={f} at={tV} top={250} size={92} />
      {f < tV && <Big lines={['À NOITE']} accent={K.yellow} f={f} at={0} top={260} size={110} />}
      {void fps}
    </SceneIn>
  );
};
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const tSo = wt(5, 'some') - 3, tCh = wt(5, 'chuva') - 3;
  const shot = f < tSo ? 0 : f < tCh ? 1 : 2;
  const H: P2 = [266, 568], P: P2 = [600, 830];
  const pin = ease(f, 0, 12);
  const sc = ease(f, wt(5, 'espalha') - 6, wt(5, 'espalha') + 10);
  return (
    <SceneIn>
      <Sfx at={wt(5, 'espalha')} src="whoosh.wav" vol={0.35} />
      <Sfx at={tSo} src="thud.wav" vol={0.4} />
      <Sfx at={tCh} src="rain.wav" vol={0.45} />
      {shot === 0 && <>
        <AbsoluteFill style={{background: '#0B0F18'}} /><Header />
        <Svg>
          <rect x={-100} y={830} width={1300} height={250} fill="#E8E8E8" />
          <rect x={-100} y={1080} width={1300} height={400} fill={K.asph} />
          <SideCar x={150} y={600} />
          <polyline points={pl(partial([H, P], pin))} fill="none" stroke={K.yellow} strokeWidth={14} strokeLinecap="round" strokeDasharray="34 16" strokeDashoffset={-f * 4} />
          {sc > 0 && [-170, -140, -110, -70, -40, -15].map((a, i) => { const r = 330 * sc; const x = P[0] + r * Math.cos((a * Math.PI) / 180), y = P[1] + r * Math.sin((a * Math.PI) / 180); return <g key={i}><line x1={P[0]} y1={P[1]} x2={x} y2={y} stroke={K.yellow} strokeWidth={10} strokeLinecap="round" opacity={0.8} /><circle cx={x} cy={y} r={12} fill={K.yellow} /></g>; })}
          <XMark f={f} at={wt(5, 'espalha') + 8} cx={210} cy={500} r={60} w={18} />
        </Svg>
        <Pill text="SEM VIDRO" f={f} at={0} x={130} y={300} size={60} bg={K.red} color="#fff" />
        <Pill text="SE ESPALHA" f={f} at={wt(5, 'espalha') - 2} x={560} y={430} size={46} />
      </>}
      {shot > 0 && <>
        <Svg><CamG s={shot === 1 ? 1.05 : 1.15} cy={800}><NightRoad f={f + 200} glow={0.13} wet={shot === 2 ? 1 : 0} /></CamG></Svg>
        {shot === 2 && <Rain f={f} a={1} />}
        <Big lines={shot === 1 ? ['A faixa', 'SOME'] : ['Com chuva,', 'PIORA']} accent={K.red} f={f} at={shot === 1 ? tSo : tCh} size={120} />
      </>}
    </SceneIn>
  );
};
const TopCar: React.FC<{x: number; y: number; color: string; up: boolean}> = ({x, y, color, up}) => (
  <g transform={`translate(${x},${y}) rotate(${up ? 0 : 180})`}>
    <rect x={-50} y={-90} width={100} height={180} rx={26} fill={color} stroke="#111" strokeWidth={5} />
    <rect x={-38} y={-60} width={76} height={40} rx={8} fill="#9FD3F7" stroke="#111" strokeWidth={3} />
    <rect x={-38} y={36} width={76} height={26} rx={8} fill="#9FD3F7" stroke="#111" strokeWidth={3} />
    <circle cx={-32} cy={-86} r={8} fill="#FFF3C4" /><circle cx={32} cy={-86} r={8} fill="#FFF3C4" />
  </g>
);
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const tA = wt(6, 'amarela') - 4, tB = wt(6, 'branca') - 4;
  const same = f >= tB;
  const L = 250, R = 830, T = 470, Bt = 1250;
  const wrap = (v: number) => T - 100 + (((v % (Bt - T + 200)) + (Bt - T + 200)) % (Bt - T + 200));
  return (
    <SceneIn>
      <Bg /><Header />
      <Sfx at={tA} src="whoosh.wav" vol={0.35} />
      <Sfx at={wt(6, 'vem')} src="car.wav" vol={0.3} />
      <Sfx at={tB} src="whoosh.wav" vol={0.35} />
      <Svg>
        <clipPath id="tr"><rect x={L} y={T} width={R - L} height={Bt - T} rx={20} /></clipPath>
        <g clipPath="url(#tr)">
          <rect x={L} y={T} width={R - L} height={Bt - T} fill={K.asph} />
          <rect x={L + 18} y={T} width={10} height={Bt - T} fill="#fff" /><rect x={R - 28} y={T} width={10} height={Bt - T} fill="#fff" />
          {!same && <><rect x={522} y={T} width={12} height={Bt - T} fill={K.yellow} /><rect x={546} y={T} width={12} height={Bt - T} fill={K.yellow} /></>}
          {same && new Array(8).fill(0).map((_, i) => <rect key={i} x={534} y={wrap(i * 120 + f * 10)} width={12} height={70} fill="#fff" />)}
          {!same && <><TopCar x={690} y={wrap(900 - f * 9)} color="#E63946" up /><TopCar x={390} y={wrap(200 + f * 9)} color="#5FA8D8" up={false} /></>}
          {same && <><TopCar x={690} y={wrap(900 - f * 7)} color="#E63946" up /><TopCar x={390} y={wrap(500 - f * 10)} color="#3DDC84" up /></>}
        </g>
        {f >= tA && !same && <g>
          <path d="M150 820 l-40 50 h26 v120 h28 v-120 h26 Z" fill="#5FA8D8" stroke="#111" strokeWidth={4} transform="rotate(180 150 905)" />
          <path d="M930 820 l-40 50 h26 v120 h28 v-120 h26 Z" fill="#E63946" stroke="#111" strokeWidth={4} />
        </g>}
        {same && <g>
          <path d="M150 820 l-40 50 h26 v120 h28 v-120 h26 Z" fill="#3DDC84" stroke="#111" strokeWidth={4} />
          <path d="M930 820 l-40 50 h26 v120 h28 v-120 h26 Z" fill="#E63946" stroke="#111" strokeWidth={4} />
        </g>}
      </Svg>
      {f < tA && <Big lines={['A cor', 'AVISA']} f={f} at={0} size={120} />}
      {!same && <Pill text="AMARELA: VAI ⇅ VEM" f={f} at={tA} x={150} y={300} size={58} />}
      {same && <Pill text="BRANCA: MESMO SENTIDO" f={f} at={tB} x={120} y={300} size={54} bg="#FFFFFF" />}
    </SceneIn>
  );
};
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tP = wt(7, 'pintar') - 2, tCu = wt(7, 'curte') - 3, tSu = wt(7, 'sua') - 4, tSe = wt(7, 'segue'), tAte = wt(7, 'ate');
  const endStart = Math.min(tSe - 4, wt(7, 'comenta') - 4);
  const end = spring({frame: f - endStart, fps, config: {damping: 200}});
  const total = Math.round(DURS[7] * fps);
  const fadeOut = interpolate(f, [total - 18, total], [0, 1], clamp);
  const followed = f >= tSe + 16;
  const fresh = interpolate(f, [tP, tP + 24], [0.5, 30], clamp);
  const items: [string, number][] = [['Tinta + vidro', tCu + 4], ['A luz volta', tCu + 14], ['Amarela ⇅  Branca ⇈', tCu + 24]];
  return (
    <SceneIn>
      <Sfx at={tP} src="whoosh.wav" vol={0.45} />
      {items.map(([, t], i) => <Sfx key={i} at={t} src="pop.wav" vol={0.45} />)}
      <Sfx at={tSu} src="tick.wav" vol={0.45} />
      <Sfx at={endStart} src="whoosh.wav" vol={0.45} />
      <Sfx at={tSe + 16} src="pop.wav" vol={0.5} />
      <Sfx at={tAte} src="cash.wav" vol={0.3} />
      <AbsoluteFill style={{opacity: 1 - end}}>
        {f < tCu && <>
          <Svg><CamG s={interpolate(f, [0, tCu], [1.02, 1.12], clamp)} cy={800}><NightRoad f={f + 400} fresh={fresh} glow={1} worn={0.13} /></CamG>
            {f >= tP && f < tP + 30 && (() => { const [x, y] = proj(0, Math.max(1.1, fresh)); return <Sparkle x={x} y={y} s={1.2} f={f} />; })()}
          </Svg>
          {f < tP ? <Big lines={['Parou de', 'BRILHAR?']} accent={K.red} f={f} at={0} size={110} /> : <Big lines={['Hora de', 'PINTAR DE NOVO']} f={f} at={tP} size={100} />}
        </>}
        {f >= tCu && f < tSu && <>
          <Bg /><Header />
          <Big lines={['Faixa que', 'BRILHA']} f={f} at={tCu} size={110} />
          {items.map(([t, at], i) => f < at ? null : (
            <div key={t} style={{position: 'absolute', top: 560 + i * 110, left: 120, display: 'flex', alignItems: 'center', gap: 20, scale: String(pop(f, at, fps, 10)), transformOrigin: 'left center'}}>
              <Check ok size={70} /><div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 62, color: K.text, letterSpacing: -2}}>{t}</div>
            </div>
          ))}
        </>}
        {f >= tSu && <>
          <Svg><CamG s={1} cy={800}><NightRoad f={f + 400} glow={0.55} /></CamG></Svg>
          <AbsoluteFill style={{background: 'rgba(10,12,16,0.45)'}} />
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: -3}}>Na sua rua...</div>
          {[['A', 'BRILHA', K.yellow, '#111', 0], ['B', 'SUMIU', K.card, '#fff', 8]].map(([l, t, bg, c, d]) => {
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
      <Audio src={staticFile('voice_pavimentacao-08-faixa-brilha.wav')} />
    </AbsoluteFill>
  );
};

const CapaPave08: React.FC = () => (
  <AbsoluteFill style={{background: '#070A12'}}>
    <Svg>
      <g transform="translate(0,260)"><NightRoad f={24} speed={0.16} /></g>
      {[0, 1].map((i) => { const [x, y] = proj(0, 1.4 + i * 2.1); return <Sparkle key={i} x={x} y={y + 254} s={1.3 - i * 0.4} f={10} />; })}
    </Svg>
    <div style={{position: 'absolute', top: 290, left: 130, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{background: K.yellow, color: '#111', fontFamily: 'InterD', fontWeight: 800, fontSize: 32, letterSpacing: 5, padding: '12px 26px', borderRadius: 999}}>PAVIMENTAÇÃO</div>
      <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 40, color: K.yellow, letterSpacing: 2}}>#08</div>
    </div>
    <div style={{position: 'absolute', top: 385, left: 130, right: 60, fontFamily: 'InterD', fontWeight: 900, fontSize: 118, color: K.text, letterSpacing: -5, lineHeight: 0.98, textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>
      Por que<br />a faixa<br />
      <span style={{display: 'inline-block', background: K.yellow, color: '#111', padding: '2px 26px 10px', borderRadius: 18, rotate: '-3deg', boxShadow: '0 14px 36px rgba(0,0,0,0.35)', letterSpacing: -3, margin: '10px 0', textShadow: 'none'}}>brilha?</span>
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
    <Composition id="Faixa" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="CapaPave08" component={CapaPave08} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);

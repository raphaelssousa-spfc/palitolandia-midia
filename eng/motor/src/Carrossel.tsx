// Carrossel do @eng.raphaelserra — slides 1080x1350 gerados a partir de um JSON (props).
// Uso: tools/carrossel.sh carrosseis/<id>.json  → eng/carrosseis/<id>/01.jpg ...
import React from 'react';
import {AbsoluteFill, Composition, staticFile, random} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Raphael} from './Raphael';

loadFont({family: 'InterD', url: staticFile('InterDisplay-Black.otf'), weight: '900'});
loadFont({family: 'InterD', url: staticFile('InterDisplay-ExtraBold.otf'), weight: '800'});
loadFont({family: 'InterD', url: staticFile('Inter-SemiBold.otf'), weight: '600'});

export type Slide =
  | {tipo: 'capa'; titulo: string; destaque?: string; subtitulo?: string; ilustracao?: string}
  | {tipo: 'item'; numero?: number; titulo: string; texto: string; icone?: string; alerta?: 'ok' | 'atencao' | 'perigo'}
  | {tipo: 'passo'; numero: number; titulo: string; texto: string; icone?: string}
  | {tipo: 'resumo'; titulo: string; pontos: string[]}
  | {tipo: 'final'; pergunta: string};
export type Cores = Partial<{bg: string; card: string; text: string; grey: string; acc: string; ring: string; pill: string; pillText: string}>;
export type Spec = {serie: 'construcao' | 'pavimentacao'; categoria: string; episodio?: string; cores?: Cores; capa_estilo?: 'padrao' | 'centro'; referencia?: string; slides: Slide[]};
const theme = (spec: Spec) => ({...THEMES[spec.serie], ...(spec.cores ?? {})});

const HANDLE = '@eng.raphaelserra';
const THEMES = {
  construcao: {bg: '#F6F3EE', card: '#FFFFFF', text: '#1A1A1A', grey: '#8A8278', acc: '#D9480F', grid: 'rgba(26,26,26,0.035)', ring: '#D9480F', pill: '#1A1A1A', pillText: '#FFFFFF'},
  pavimentacao: {bg: '#25282D', card: '#30343A', text: '#FFFFFF', grey: '#9AA0A8', acc: '#FFC20E', grid: 'rgba(255,255,255,0.03)', ring: '#FFC20E', pill: '#FFC20E', pillText: '#111111'},
};
const ALERT = {ok: '#2F9E44', atencao: '#E8890C', perigo: '#C92A2A'};
const BLUE = '#3B8FD9';
const NAVY = '#1A1A1A';

// ---------- ícones (viewBox 0 0 200 200) ----------
const I: Record<string, React.ReactNode> = {
  casa: <g><path d="M30 95 L100 35 L170 95" fill="#2B2B2B" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" /><rect x={48} y={92} width={104} height={80} fill="#FFFFFF" stroke={NAVY} strokeWidth={8} /><rect x={66} y={118} width={30} height={54} fill="#8B5A3C" stroke={NAVY} strokeWidth={6} /><rect x={112} y={112} width={26} height={24} fill="#9FD3F7" stroke={NAVY} strokeWidth={6} /></g>,
  rachadura: <g><rect x={36} y={30} width={128} height={140} rx={10} fill="#FFFFFF" stroke={NAVY} strokeWidth={8} /><path d="M104 30 L92 72 L112 104 L88 140 L98 170" stroke={NAVY} strokeWidth={10} fill="none" strokeLinejoin="round" /></g>,
  gota: <path d="M100 26 C130 70 150 96 150 124 A50 50 0 0 1 50 124 C50 96 70 70 100 26 Z" fill={BLUE} stroke={NAVY} strokeWidth={8} />,
  mofo: <g><rect x={36} y={30} width={128} height={140} rx={10} fill="#FBF6EE" stroke={NAVY} strokeWidth={8} />{[[70, 130, 18], [104, 146, 24], [138, 126, 14], [88, 104, 12], [124, 100, 10]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#3F5F3A" opacity={0.75} />)}</g>,
  bolha: <g><rect x={30} y={40} width={140} height={120} rx={10} fill="#F4E9D8" stroke={NAVY} strokeWidth={8} />{[[70, 90, 22], [120, 110, 28], [90, 130, 14]].map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={r} fill="#FFFFFF" stroke={NAVY} strokeWidth={5} /><path d={`M${x - r * 0.5} ${y - r * 0.3} q${r * 0.3} -${r * 0.3} ${r * 0.6} 0`} stroke="#C9BBA6" strokeWidth={4} fill="none" /></g>)}</g>,
  rodape: <g><rect x={30} y={40} width={140} height={100} fill="#FBF6EE" stroke={NAVY} strokeWidth={8} /><path d="M30 140 L170 140 L170 170 Q120 150 100 168 Q80 150 30 170 Z" fill="#C9A87C" stroke={NAVY} strokeWidth={6} /></g>,
  nariz: <g><circle cx={100} cy={100} r={70} fill="#FFFFFF" stroke={NAVY} strokeWidth={8} /><path d="M70 80 q15 -20 30 0 t30 0 M60 110 q20 -20 40 0 t40 0 M70 140 q15 -20 30 0 t30 0" stroke={BLUE} strokeWidth={8} fill="none" strokeLinecap="round" /></g>,
  salitre: <g><rect x={30} y={40} width={140} height={120} rx={10} fill="#D9B79A" stroke={NAVY} strokeWidth={8} />{new Array(26).fill(0).map((_, i) => <circle key={i} cx={45 + random('sa' + i) * 110} cy={110 + random('sb' + i) * 42} r={3 + random('sc' + i) * 4} fill="#FFFFFF" />)}</g>,
  laje: <g><path d="M20 120 L100 80 L180 120 L100 160 Z" fill="#C9C4BB" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" /><path d="M20 120 L20 136 L100 176 L100 160 Z" fill="#A9A39A" stroke={NAVY} strokeWidth={6} /><path d="M100 160 L100 176 L180 136 L180 120 Z" fill="#958F86" stroke={NAVY} strokeWidth={6} /></g>,
  fundacao: <g><rect x={30} y={120} width={140} height={50} fill="#9C6B45" stroke={NAVY} strokeWidth={6} /><rect x={60} y={60} width={80} height={70} fill="#BDB6AB" stroke={NAVY} strokeWidth={8} /><rect x={40} y={120} width={120} height={26} fill="#A8A39A" stroke={NAVY} strokeWidth={6} /></g>,
  tijolo: <g>{[[30, 110], [102, 110], [66, 70]].map(([x, y], i) => <rect key={i} x={x} y={y} width={68} height={36} rx={4} fill="#E8774A" stroke={NAVY} strokeWidth={6} />)}</g>,
  planta: <g><rect x={26} y={40} width={148} height={120} rx={6} fill="#2F6FB5" stroke={NAVY} strokeWidth={6} /><path d="M46 60 L116 60 L116 100 L154 100 L154 140 L46 140 Z M86 60 L86 140" stroke="white" strokeWidth={5} fill="none" /></g>,
  dinheiro: <g><rect x={26} y={60} width={148} height={84} rx={10} fill="#7BC67E" stroke={NAVY} strokeWidth={7} /><circle cx={100} cy={102} r={26} fill="#5FAE63" stroke={NAVY} strokeWidth={5} /><text x={100} y={112} textAnchor="middle" fontFamily="InterD" fontWeight={900} fontSize={26} fill="#123">R$</text></g>,
  calendario: <g><rect x={36} y={40} width={128} height={130} rx={14} fill="#FFFFFF" stroke={NAVY} strokeWidth={8} /><rect x={36} y={40} width={128} height={36} rx={10} fill="#C92A2A" />{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={54 + (i % 3) * 34} y={90 + Math.floor(i / 3) * 34} width={24} height={24} rx={4} fill="#E9E4DC" />)}</g>,
  regua: <g><rect x={20} y={80} width={160} height={46} rx={6} fill="#FFC20E" stroke={NAVY} strokeWidth={6} />{new Array(15).fill(0).map((_, i) => <line key={i} x1={30 + i * 10} y1={80} x2={30 + i * 10} y2={i % 5 ? 96 : 106} stroke={NAVY} strokeWidth={3} />)}</g>,
  martelo: <g><rect x={92} y={70} width={18} height={110} rx={6} fill="#8B5A3C" stroke={NAVY} strokeWidth={6} /><rect x={50} y={40} width={100} height={40} rx={8} fill="#9AA0A8" stroke={NAVY} strokeWidth={7} /></g>,
  capacete: <g><path d="M28 130 Q28 50 100 46 Q172 50 172 130 Z" fill="#FFC20E" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" /><rect x={14} y={124} width={172} height={22} rx={11} fill="#E0A800" stroke={NAVY} strokeWidth={8} /></g>,
  check: <g><circle cx={100} cy={100} r={74} fill="#2F9E44" /><path d="M64 102 L90 128 L140 74" stroke="white" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>,
  alerta: <g><path d="M100 24 L178 164 L22 164 Z" fill="#FFC20E" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" /><rect x={92} y={72} width={16} height={52} rx={6} fill={NAVY} /><circle cx={100} cy={142} r={10} fill={NAVY} /></g>,
  x: <g><circle cx={100} cy={100} r={74} fill="#C92A2A" /><path d="M70 70 L130 130 M130 70 L70 130" stroke="white" strokeWidth={18} strokeLinecap="round" /></g>,
  estrada: <g><path d="M70 20 L130 20 L180 180 L20 180 Z" fill="#4A4E55" stroke={NAVY} strokeWidth={6} /><path d="M98 30 L102 30 L104 60 L96 60 Z M95 80 L105 80 L107 115 L93 115 Z M92 135 L108 135 L110 172 L90 172 Z" fill="#FFC20E" /></g>,
  buraco: <g><ellipse cx={100} cy={110} rx={86} ry={46} fill="#4A4E55" stroke={NAVY} strokeWidth={6} /><path d="M50 108 Q60 82 100 86 Q146 82 150 110 Q140 134 100 132 Q62 136 50 108 Z" fill="#17191C" /><ellipse cx={100} cy={116} rx={36} ry={12} fill={BLUE} /></g>,
  cone: <g><path d="M40 176 L160 176 L148 160 L52 160 Z" fill={NAVY} /><path d="M70 160 L130 160 L108 30 L92 30 Z" fill="#FF6B1A" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" /><path d="M80 110 L120 110 L116 86 L84 86 Z" fill="white" /></g>,
  caminhao: <g><rect x={16} y={70} width={110} height={70} rx={6} fill="#F1F1F1" stroke={NAVY} strokeWidth={6} /><path d="M126 90 L164 90 L184 114 L184 140 L126 140 Z" fill="#FFC20E" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />{[50, 100, 160].map((x) => <circle key={x} cx={x} cy={146} r={16} fill={NAVY} />)}</g>,
  chuva: <g><path d="M50 90 Q46 56 80 54 Q92 30 120 40 Q150 36 152 66 Q176 70 172 92 Z" fill="#9AA8B6" stroke={NAVY} strokeWidth={6} />{[60, 90, 120, 150].map((x, i) => <line key={x} x1={x} y1={110 + (i % 2) * 14} x2={x - 10} y2={140 + (i % 2) * 14} stroke={BLUE} strokeWidth={8} strokeLinecap="round" />)}</g>,
  rolo: <g><rect x={30} y={40} width={110} height={44} rx={16} fill="#F4A261" stroke={NAVY} strokeWidth={7} /><path d="M140 62 L164 62 L164 110 L96 110 L96 180" stroke={NAVY} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>,
  sol: <g><circle cx={100} cy={100} r={44} fill="#FFC94D" />{new Array(10).fill(0).map((_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={100 + Math.cos(a) * 60} y1={100 + Math.sin(a) * 60} x2={100 + Math.cos(a) * 84} y2={100 + Math.sin(a) * 84} stroke="#FFC94D" strokeWidth={10} strokeLinecap="round" />; })}</g>,
  lupa: <g><circle cx={86} cy={86} r={52} fill="#FFFFFF" stroke={NAVY} strokeWidth={12} /><line x1={124} y1={124} x2={172} y2={172} stroke={NAVY} strokeWidth={22} strokeLinecap="round" /></g>,
};
const Icon: React.FC<{k?: string; size: number}> = ({k, size}) => <svg width={size} height={size} viewBox="0 0 200 200">{I[k ?? 'capacete'] ?? I.capacete}</svg>;

// ---------- peças ----------
const Frame: React.FC<{spec: Spec; i: number; n: number; children: React.ReactNode}> = ({spec, i, n, children}) => {
  const T = theme(spec);
  return (
    <AbsoluteFill style={{background: T.bg}}>
      <svg width={1080} height={1350} style={{position: 'absolute'}}>
        {new Array(19).fill(0).map((_, k) => <line key={'v' + k} x1={k * 60} y1={0} x2={k * 60} y2={1350} stroke={spec.serie === 'pavimentacao' ? '#FFFFFF' : '#1A1A1A'} opacity={0.035} />)}
        {new Array(23).fill(0).map((_, k) => <line key={'h' + k} x1={0} y1={k * 60} x2={1080} y2={k * 60} stroke={spec.serie === 'pavimentacao' ? '#FFFFFF' : '#1A1A1A'} opacity={0.035} />)}
        {spec.serie === 'pavimentacao' && new Array(9).fill(0).map((_, k) => <rect key={'f' + k} x={30} y={k * 170 - 20} width={16} height={90} rx={4} fill="#FFC20E" opacity={0.85} />)}
      </svg>
      <div style={{position: 'absolute', top: 60, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{background: T.pill, color: T.pillText, fontFamily: 'InterD', fontWeight: 800, fontSize: 26, letterSpacing: 4, padding: '10px 22px', borderRadius: 999}}>{spec.categoria}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 700, fontSize: 28, color: T.grey}}>{HANDLE}</div>
      </div>
      {children}
      {/* rodapé: progresso + arraste */}
      <div style={{position: 'absolute', bottom: 56, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 10}}>{new Array(n).fill(0).map((_, k) => <div key={k} style={{width: k === i ? 46 : 14, height: 14, borderRadius: 7, background: k === i ? T.acc : T.grey, opacity: k === i ? 1 : 0.35}} />)}</div>
        {i < n - 1 && <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 32, color: T.acc}}>arraste →</div>}
      </div>
    </AbsoluteFill>
  );
};
const AvatarBadge: React.FC<{size: number; ring: string; bg: string}> = ({size, ring, bg}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, overflow: 'hidden', background: bg, border: `${Math.round(size / 22)}px solid ${ring}`, flexShrink: 0}}><Raphael mouth={0} blink={0} /></div>
);
const titleParts = (t: string, d: string | undefined, acc: string) => {
  if (!d || !t.includes(d)) return <>{t}</>;
  const [a, b] = t.split(d);
  return <>{a}<span style={{color: acc}}>{d}</span>{b}</>;
};

const SlideView: React.FC<{spec: Spec; i: number}> = ({spec, i}) => {
  const T = theme(spec);
  const s = spec.slides[i];
  const n = spec.slides.length;
  if (s.tipo === 'capa' && spec.capa_estilo === 'centro') {
    return (
      <Frame spec={spec} i={i} n={n}>
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><svg width={460} height={460} viewBox="0 0 200 200"><circle cx={100} cy={100} r={96} fill={T.card} />{I[s.ilustracao ?? 'casa'] ?? I.casa}</svg></div>
        <div style={{position: 'absolute', top: 650, left: 70, right: 70, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 100, color: T.text, letterSpacing: -4, lineHeight: 1}}>{titleParts(s.titulo, s.destaque, T.acc)}</div>
        {s.subtitulo && <div style={{position: 'absolute', top: 1010, left: 100, right: 100, textAlign: 'center', fontFamily: 'InterD', fontWeight: 700, fontSize: 38, color: T.grey, lineHeight: 1.2}}>{s.subtitulo}</div>}
        <div style={{position: 'absolute', top: 1140, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
          <AvatarBadge size={80} ring={T.ring} bg={T.card} /><div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 32, color: T.text}}>{HANDLE}</div>
        </div>
      </Frame>
    );
  }
  if (s.tipo === 'capa') {
    return (
      <Frame spec={spec} i={i} n={n}>
        {spec.episodio && <div style={{position: 'absolute', top: 64, right: 0, left: 0, textAlign: 'center', fontFamily: 'InterD', fontWeight: 900, fontSize: 30, color: T.acc}}>{spec.episodio}</div>}
        <div style={{position: 'absolute', top: 170, left: 80, right: 70, fontFamily: 'InterD', fontWeight: 900, fontSize: 112, color: T.text, letterSpacing: -5, lineHeight: 0.98}}>{titleParts(s.titulo, s.destaque, T.acc)}</div>
        {s.subtitulo && <div style={{position: 'absolute', top: 640, left: 80, right: 420, fontFamily: 'InterD', fontWeight: 700, fontSize: 40, color: T.grey, lineHeight: 1.2}}>{s.subtitulo}</div>}
        <div style={{position: 'absolute', top: 640, right: 60}}><svg width={420} height={420} viewBox="0 0 200 200"><circle cx={100} cy={100} r={96} fill={T.card} />{I[s.ilustracao ?? 'casa'] ?? I.casa}</svg></div>
        <div style={{position: 'absolute', top: 1110, left: 80, display: 'flex', alignItems: 'center', gap: 18}}>
          <AvatarBadge size={110} ring={T.ring} bg={T.card} />
          <div><div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 36, color: T.text}}>{HANDLE}</div><div style={{fontFamily: 'InterD', fontWeight: 600, fontSize: 26, color: T.grey}}>Engenheiro civil explica</div></div>
        </div>
      </Frame>
    );
  }
  if (s.tipo === 'item' || s.tipo === 'passo') {
    const col = s.tipo === 'item' && s.alerta ? ALERT[s.alerta] : T.acc;
    const label = s.tipo === 'passo' ? `PASSO ${s.numero}` : s.numero ? `#${s.numero}` : '';
    return (
      <Frame spec={spec} i={i} n={n}>
        <div style={{position: 'absolute', top: 170, left: 80, display: 'flex', alignItems: 'center', gap: 24}}>
          {label && <div style={{background: col, color: '#fff', fontFamily: 'InterD', fontWeight: 900, fontSize: s.tipo === 'passo' ? 40 : 64, padding: s.tipo === 'passo' ? '10px 26px' : '4px 30px', borderRadius: 20}}>{label}</div>}
        </div>
        <div style={{position: 'absolute', top: 290, left: 80, right: 80, fontFamily: 'InterD', fontWeight: 900, fontSize: 84, color: T.text, letterSpacing: -3, lineHeight: 1.02}}>{s.titulo}</div>
        <div style={{position: 'absolute', top: 560, left: 80, right: 80, height: 620, display: 'flex', flexDirection: 'column', gap: 34, alignItems: 'center', justifyContent: 'center', background: T.card, borderRadius: 40, padding: '40px 56px', borderTop: `16px solid ${col}`, boxShadow: spec.serie === 'construcao' ? '0 20px 50px rgba(0,0,0,0.08)' : 'none'}}>
          <Icon k={s.icone} size={300} />
          <div style={{fontFamily: 'InterD', fontWeight: 700, fontSize: 46, color: T.text, lineHeight: 1.25, textAlign: 'center'}}>{s.texto}</div>
        </div>
      </Frame>
    );
  }
  if (s.tipo === 'resumo') {
    return (
      <Frame spec={spec} i={i} n={n}>
        <div style={{position: 'absolute', top: 170, left: 80, right: 80, fontFamily: 'InterD', fontWeight: 900, fontSize: 88, color: T.text, letterSpacing: -3, lineHeight: 1}}>{s.titulo}</div>
        <div style={{position: 'absolute', top: 400, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 22}}>
          {s.pontos.map((p, k) => (
            <div key={k} style={{display: 'flex', alignItems: 'center', gap: 24, background: T.card, borderRadius: 26, padding: '22px 30px'}}>
              <div style={{width: 64, height: 64, borderRadius: 32, background: T.acc, color: spec.serie === 'pavimentacao' ? '#111' : '#fff', fontFamily: 'InterD', fontWeight: 900, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>✓</div>
              <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 42, color: T.text, lineHeight: 1.15}}>{p}</div>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  // final
  return (
    <Frame spec={spec} i={i} n={n}>
      <div style={{position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        <AvatarBadge size={300} ring={T.ring} bg={T.card} />
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 52, color: T.text}}>{HANDLE}</div>
        <div style={{display: 'flex', gap: 20}}>
          <div style={{background: T.acc, color: spec.serie === 'pavimentacao' ? '#111' : '#fff', fontFamily: 'InterD', fontWeight: 900, fontSize: 44, padding: '16px 46px', borderRadius: 999}}>Salva</div>
          <div style={{border: `5px solid ${T.acc}`, color: T.acc, fontFamily: 'InterD', fontWeight: 900, fontSize: 44, padding: '11px 46px', borderRadius: 999}}>Segue</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 900, left: 80, right: 80, background: T.card, borderRadius: 34, padding: '36px 40px', textAlign: 'center'}}>
        <div style={{fontFamily: 'InterD', fontWeight: 900, fontSize: 50, color: T.text, lineHeight: 1.15}}>{s.pergunta}</div>
        <div style={{fontFamily: 'InterD', fontWeight: 800, fontSize: 36, color: T.acc, marginTop: 14}}>Comenta aqui 👇</div>
      </div>
    </Frame>
  );
};

const Root: React.FC = () => (
  <Composition id="Slide" component={SlideView as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1350}
    defaultProps={{spec: {serie: 'construcao', categoria: 'TESTE', slides: [{tipo: 'capa', titulo: 'Teste', destaque: 'Teste'}]}, i: 0}} />
);
export {Root};

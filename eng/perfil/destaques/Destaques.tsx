import React from 'react';
import {registerRoot, Composition, AbsoluteFill} from 'remotion';
import {Raphael} from '../../src/Raphael';
const Y = '#FFC20E', BG = '#25282D', CARD = '#30343A';
const Base: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: BG, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{width: 760, height: 760, borderRadius: 380, background: CARD, border: `22px solid ${Y}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
  </AbsoluteFill>
);
const Comece = () => <Base><div style={{width: 760, height: 760, marginTop: 40}}><Raphael mouth={0.15} blink={0} /></div></Base>;
const Asfalto = () => (
  <Base>
    <svg width={520} height={520} viewBox="0 0 200 200">
      <path d="M78 14 L122 14 L186 186 L14 186 Z" fill="#4A4E55" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
      <path d="M96 24 L104 24 L106 54 L94 54 Z M93 74 L107 74 L110 110 L90 110 Z M89 130 L111 130 L115 176 L85 176 Z" fill={Y} />
      <path d="M78 14 L32 186 M122 14 L168 186" stroke="#fff" strokeWidth={4} opacity={0.85} />
    </svg>
  </Base>
);
const Obra = () => (
  <Base>
    <svg width={520} height={520} viewBox="0 0 200 200">
      <path d="M36 130 Q36 52 100 48 Q164 52 164 130 Z" fill={Y} stroke="#111" strokeWidth={7} strokeLinejoin="round" />
      <rect x={20} y={124} width={160} height={22} rx={11} fill="#E0A800" stroke="#111" strokeWidth={7} />
      <rect x={90} y={44} width={20} height={84} rx={7} fill="#E0A800" stroke="#111" strokeWidth={6} />
      {[[40, 158], [104, 158], [72, 176]].map(([x, y], i) => <rect key={i} x={x} y={y - 6} width={58} height={20} rx={3} fill="#E8774A" stroke="#111" strokeWidth={4} />)}
    </svg>
  </Base>
);
registerRoot(() => (<>
  <Composition id="Comece" component={Comece} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Asfalto" component={Asfalto} durationInFrames={1} fps={30} width={1080} height={1920} />
  <Composition id="Obra" component={Obra} durationInFrames={1} fps={30} width={1080} height={1920} />
</>));

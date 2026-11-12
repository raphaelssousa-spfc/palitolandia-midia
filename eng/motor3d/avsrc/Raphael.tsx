import React from 'react';
import {random} from 'remotion';

// Illustrated avatar of Raphael. viewBox 0 0 400 400 (bust, centred)
const SK = '#EDBE9C', SKD = '#D9A07E', SKL = '#F6D2B6';
const HAIR = '#3A3836', HAIRG = '#8E8B88', BEARD = '#2F2B28', BEARDG = '#A7A4A0';
const SHIRT = '#1F3768', SHIRTD = '#172A52', SHIRTL = '#2B4A86';

export const Raphael: React.FC<{mouth: number; blink: number; helmet?: boolean; look?: number}> = ({mouth, blink, helmet, look = 0}) => {
  const m = Math.max(0, Math.min(1, mouth));
  const eyeH = 9 * (1 - blink);
  const jaw = m * 7;
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%">
      {/* shirt */}
      <path d="M40 400 C48 318 108 290 160 280 L240 280 C292 290 352 318 360 400 Z" fill={SHIRT} />
      <path d="M40 400 C48 330 90 302 130 292 L150 400 Z" fill={SHIRTD} opacity={0.6} />
      <path d="M360 400 C352 330 310 302 270 292 L250 400 Z" fill={SHIRTL} opacity={0.35} />
      {/* neck */}
      <path d="M165 238 L235 238 L240 292 Q200 312 160 292 Z" fill={SKD} />
      {/* collar */}
      <path d="M160 278 L200 318 L178 336 L146 292 Z" fill={SHIRTL} stroke={SHIRTD} strokeWidth={3} strokeLinejoin="round" />
      <path d="M240 278 L200 318 L222 336 L254 292 Z" fill={SHIRTL} stroke={SHIRTD} strokeWidth={3} strokeLinejoin="round" />
      <line x1={200} y1={318} x2={200} y2={400} stroke={SHIRTD} strokeWidth={3} />
      {[350, 384].map((y) => <circle key={y} cx={207} cy={y} r={4} fill="#C9D3E6" />)}
      <g transform={`translate(0 ${jaw * 0.25})`}>
        {/* ears */}
        <ellipse cx={122} cy={170} rx={14} ry={24} fill={SKD} />
        <ellipse cx={278} cy={170} rx={14} ry={24} fill={SKD} />
        {/* head */}
        <path d="M128 120 Q128 62 200 60 Q272 62 272 120 L272 200 Q268 262 200 272 Q132 262 128 200 Z" fill={SK} />
        <path d="M250 90 Q272 110 272 150 L272 200 Q270 230 252 248 Q262 190 250 90 Z" fill={SKD} opacity={0.35} />
        {/* hair */}
        <path d="M124 150 Q116 82 160 58 Q200 38 246 54 Q284 70 278 150 L270 150 Q268 112 252 98 Q214 86 200 92 Q176 84 150 100 Q132 116 132 150 Z" fill={HAIR} />
        <path d="M150 64 Q190 34 248 54 Q228 52 206 62 Q186 54 168 66 Z" fill={HAIRG} />
        {new Array(16).fill(0).map((_, i) => {
          const x = 140 + random('hx' + i) * 120, y = 58 + random('hy' + i) * 36;
          return <path key={i} d={`M${x} ${y} q${6 + random('hq' + i) * 8} -${4 + random('hr' + i) * 6} ${14 + random('hs' + i) * 10} 0`} stroke={HAIRG} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.85} />;
        })}
        <path d="M124 150 Q122 128 132 118 L134 160 Z" fill={HAIRG} opacity={0.8} />
        <path d="M276 150 Q278 128 268 118 L266 160 Z" fill={HAIRG} opacity={0.8} />
        {/* eyebrows */}
        <path d="M146 140 Q166 130 190 136 L190 145 Q168 140 148 149 Z" fill="#2A2420" />
        <path d="M254 140 Q234 130 210 136 L210 145 Q232 140 252 149 Z" fill="#2A2420" />
        {/* eyes */}
        {[170, 230].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy={161} rx={14} ry={Math.max(0.8, eyeH)} fill="#FFFFFF" />
            {eyeH > 3 && <circle cx={cx + look * 4} cy={162} r={7.5} fill="#5A3A22" />}
            {eyeH > 3 && <circle cx={cx + look * 4} cy={162} r={3.6} fill="#1A120C" />}
            {eyeH > 3 && <circle cx={cx + look * 4 + 3} cy={159} r={2} fill="#fff" />}
            <path d={`M${cx - 16} ${161 - eyeH + 3} Q${cx} ${161 - eyeH - 2} ${cx + 16} ${161 - eyeH + 3} L${cx + 16} ${152 - eyeH} L${cx - 16} ${152 - eyeH} Z`} fill={SK} />
            <path d={`M${cx - 16} ${161 - eyeH + 3} Q${cx} ${161 - eyeH - 2} ${cx + 16} ${161 - eyeH + 3}`} stroke="#3A2A20" strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        ))}
        <path d="M156 178 Q170 184 184 178" stroke={SKD} strokeWidth={2} fill="none" opacity={0.7} />
        <path d="M216 178 Q230 184 244 178" stroke={SKD} strokeWidth={2} fill="none" opacity={0.7} />
        {/* nose */}
        <path d="M196 158 Q194 186 186 198 Q198 206 214 198 Q206 186 204 158" fill={SKD} opacity={0.55} />
        <ellipse cx={200} cy={196} rx={12} ry={6} fill={SKL} opacity={0.5} />
      </g>
      {/* beard (moves with jaw) */}
      <g transform={`translate(0 ${jaw})`}>
        <path d={`M130 180 Q130 236 150 258 Q172 290 200 ${294 + jaw} Q228 290 250 258 Q270 236 270 180 L262 186 Q258 222 236 230 Q216 222 200 224 Q184 222 164 230 Q142 222 138 186 Z`} fill={BEARD} />
        <path d={`M182 252 Q200 ${300 + jaw} 218 252 Q212 280 200 ${292 + jaw} Q188 280 182 252 Z`} fill={BEARDG} opacity={0.85} />
        {new Array(12).fill(0).map((_, i) => {
          const x = 165 + random('bx' + i) * 70, y = 246 + random('by' + i) * 34;
          return <line key={i} x1={x} y1={y} x2={x + (random('bz' + i) - 0.5) * 6} y2={y + 8} stroke={random('bc' + i) > 0.4 ? BEARDG : '#4A4541'} strokeWidth={2} strokeLinecap="round" opacity={0.7} />;
        })}
        {/* mouth */}
        <ellipse cx={200} cy={232} rx={16 + 4 * m} ry={2.5 + 15 * m} fill="#5B2A26" />
        {m > 0.25 && <rect x={188} y={232 - (2.5 + 15 * m) + 1} width={24} height={5 * m} rx={2} fill="#F4F1EC" />}
        <path d={`M184 ${234 + 15 * m} Q200 ${240 + 16 * m} 216 ${234 + 15 * m}`} stroke="#B8706A" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8} />
      </g>
      {/* mustache (fixed to upper lip) */}
      <g transform={`translate(0 ${jaw * 0.25})`}>
        <path d="M160 222 Q176 206 200 214 Q224 206 240 222 Q226 228 212 222 Q204 220 200 224 Q196 220 188 222 Q174 228 160 222 Z" fill={BEARD} />
        <path d="M152 210 Q148 222 152 236 L160 226 Z" fill={BEARD} />
        <path d="M248 210 Q252 222 248 236 L240 226 Z" fill={BEARD} />
      </g>
      {helmet && (
        <g transform={`translate(0 ${jaw * 0.25})`}>
          <path d="M112 128 Q112 40 200 34 Q288 40 288 128 Z" fill="#FFC20E" stroke="#111" strokeWidth={6} strokeLinejoin="round" />
          <rect x={98} y={120} width={204} height={20} rx={10} fill="#E0A800" stroke="#111" strokeWidth={6} />
          <rect x={190} y={32} width={20} height={92} rx={8} fill="#E0A800" stroke="#111" strokeWidth={5} />
        </g>
      )}
    </svg>
  );
};

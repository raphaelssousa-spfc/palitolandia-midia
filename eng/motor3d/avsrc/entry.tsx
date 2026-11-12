import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {random} from 'remotion';
import {Raphael} from './Raphael';
const blinkAt = (g: number) => { const period = 96, k = Math.floor(g / period), start = k * period + Math.floor(random('bl' + k) * 50); const d = g - start; return d >= 0 && d < 5 ? [0.5, 1, 1, 0.5, 0.1][d] : 0; };
(window as any).AV = { svg: (mouth: number, blink: number, look = 0) => renderToStaticMarkup(<Raphael mouth={mouth} blink={blink} look={look} />), blinkAt };

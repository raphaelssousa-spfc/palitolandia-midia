// node render.mjs stills <dir> "f1,f2,..."   |   node render.mjs video <out.mp4> a b
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { chromium } from 'playwright';
const [, , mode, out, a, b] = process.argv;
const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); }
  const ct = p.endsWith('.js') ? 'text/javascript' : p.endsWith('.json') ? 'application/json' : p.endsWith('.woff2') ? 'font/woff2' : p.endsWith('.otf') ? 'font/otf' : 'text/html'; s.writeHead(200, { 'Content-Type': ct }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
pg.on('console', m => console.log('PAGE', m.text())); pg.on('pageerror', e => console.log('PERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
if (await pg.evaluate(() => window.err)) { console.log('page error'); process.exit(1); }
const t0 = Date.now(); let n = 0;
if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  for (const f of a.split(',').map(Number)) { await pg.evaluate(f => window.renderFrame(f), f); await pg.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 }); n++; }
} else {
  const tmp = out.replace(/\.mp4$/, '.part.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = +a; f <= +b; f++) { await pg.evaluate(f => window.renderFrame(f), f); const buf = await pg.screenshot({ type: 'jpeg', quality: 93 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); n++; }
  ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); if (code === 0) fs.renameSync(tmp, out); else console.log('ffmpeg failed', code);
}
console.log(`done ${n} frames, ${(n ? (Date.now() - t0) / n / 1000 : 0).toFixed(2)} s/frame`);
await br.close(); srv.close();

import http from 'http'; import fs from 'fs'; import path from 'path'; import { chromium } from 'playwright';
const root = path.resolve('web'); const [, , out, cy, dist] = process.argv;
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.json') ? 'application/json' : p.endsWith('.otf') ? 'font/otf' : p.endsWith('.woff2') ? 'font/woff2' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 120000 });
await pg.evaluate(([a, b]) => window.renderCover(+a, +b), [cy || 3.2, dist || 21]); await pg.screenshot({ path: out, type: 'jpeg', quality: 92 }); await br.close(); srv.close();

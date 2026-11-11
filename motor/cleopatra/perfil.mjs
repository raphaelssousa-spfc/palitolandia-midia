import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1080 } });
pg.on('pageerror', (e) => console.log('ERR', e.message));
await pg.goto('http://localhost:8123/web/perfil.html'); await pg.waitForFunction('window.ready === true', null, { timeout: 15000 });
await pg.locator('#c').screenshot({ path: 'out/perfil_palitolandia.png' }); await b.close(); console.log('ok');

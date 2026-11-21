// Captures the promo animation frame by frame with headless Chrome.
//   node scripts/promo/render.mjs --out <folder> [--from 0] [--to 1499] [--step 1] [--quality 92]
// A tiny local server serves the project (fonts, models, three.js) and the two gameplay videos from Downloads.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), 'promo-frames')));
const SUB = Number(arg('sub', 1)), SHUTTER = Number(arg('shutter', 0.5));
const FROM = Number(arg('from', 0)), TO = Number(arg('to', 1499)), STEP = Number(arg('step', 1)), Q = Number(arg('quality', 92));
const TT_DIR = process.env.TT_DIR || path.join(os.tmpdir(), 'promo', 'tt'); // Blender turntable frames
const CLIP_DIR = process.env.CLIP_DIR || path.join(os.homedir(), 'Downloads');
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('Chrome or Edge not found');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  let file = u.startsWith('/clips/') ? path.join(CLIP_DIR, u.slice(7)) : u.startsWith('/tt/') ? path.join(TT_DIR, u.slice(4)) : path.join(ROOT, u === '/' ? 'scripts/promo/index.html' : u);
  if (!file.startsWith(ROOT) && !file.startsWith(CLIP_DIR) && !file.startsWith(TT_DIR)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const size = fs.statSync(file).size; const type = MIME[path.extname(file)] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range); const start = m[1] ? Number(m[1]) : 0; const end = m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const dbg = 9333 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${profile}`, '--window-size=1920,1080', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill(); } catch { /* gone */ } server.close(); };
process.on('exit', cleanup);

let target;
for (let i = 0; i < 60 && !target; i++) { try { const r = await fetch(`http://127.0.0.1:${dbg}/json`); target = (await r.json()).find((t) => t.type === 'page'); } catch { /* not up yet */ } if (!target) await new Promise((r) => setTimeout(r, 250)); }
if (!target) throw new Error('Chrome did not start');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (['Runtime.consoleAPICalled', 'Runtime.exceptionThrown', 'Log.entryAdded'].includes(d.method)) logs.push(JSON.stringify(d.params).slice(0, 300)); };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (d) => (d.error ? rej(new Error(method + ': ' + d.error.message)) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://127.0.0.1:${port}/scripts/promo/index.html` });
for (let i = 0; i < 240; i++) {
  const r = await send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true });
  if (r.result.value) break;
  if (i === 239) { console.error(logs.join('\n')); throw new Error('page never became ready'); }
  await new Promise((r2) => setTimeout(r2, 500));
}
for (const e of (arg('eval', '') ? arg('eval', '').split(';;') : [])) { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result && r.result.value !== undefined) console.log(JSON.stringify(r.result.value)); }
console.log(`ready on port ${port}; rendering frames ${FROM}..${TO} step ${STEP} into ${OUT}`);
const t0 = Date.now();
for (let n = FROM; n <= TO; n += STEP) {
  for (let k = 0; k < SUB; k++) { // SUB sub-frames spread over the shutter angle are averaged afterwards (motion blur)
    const tt = SUB === 1 ? n : n + (k / (SUB - 1) - 0.5) * SHUTTER;
    const ev = await send('Runtime.evaluate', { expression: `renderFrame(${tt})`, awaitPromise: true, returnByValue: true });
    if (ev.exceptionDetails) { console.error(JSON.stringify(ev.exceptionDetails).slice(0, 600)); throw new Error('renderFrame failed at ' + n); }
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: Q, captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, SUB === 1 ? `f${String(n).padStart(5, '0')}.jpg` : `s${String(n).padStart(5, '0')}_${k}.jpg`), Buffer.from(shot.data, 'base64'));
  }
  if (n % 60 === 0) console.log(`frame ${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
if (logs.length) console.log('page logs:\n' + logs.slice(0, 8).join('\n'));
console.log('done');
cleanup();
process.exit(0);

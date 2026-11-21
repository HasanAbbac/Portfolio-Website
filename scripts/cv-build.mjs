// Rebuilds public/Hasan_Abbasi_CV.pdf from scripts/cv/cv.html with a headless Chrome or Edge:  npm run cv:build
// The CV uses the portfolio's own colours and fonts (see the :root block in cv.html). No extra dependency is needed.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'scripts', 'cv', 'cv.html');
const OUT = path.join(ROOT, 'public', 'Hasan_Abbasi_CV.pdf');

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) { console.error('No Chrome or Edge found. Set CHROME_PATH to its executable and run again.'); process.exit(1); }

const r = spawnSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files', `--print-to-pdf=${OUT}`, pathToFileURL(SRC).href], { stdio: 'inherit' });
if (r.status !== 0 || !fs.existsSync(OUT)) { console.error('PDF was not created.'); process.exit(1); }
console.log(`wrote ${path.relative(ROOT, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);

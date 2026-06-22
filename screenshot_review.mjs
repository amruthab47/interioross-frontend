import { execSync, spawn } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = 'C:\\Users\\91994\\interioross\\screenshots';

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Use Chrome's --screenshot flag (headless)
function screenshot(url, filename, delay = 2000) {
  return new Promise((resolve) => {
    const file = path.join(OUT, filename);
    const args = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
      `--screenshot=${file}`,
      `--virtual-time-budget=${delay}`,
      url
    ];
    const proc = spawn(CHROME, args, { stdio: 'pipe' });
    proc.on('close', () => {
      console.log(`✓ ${filename}`);
      resolve(file);
    });
    proc.on('error', (e) => {
      console.log(`✗ ${filename}: ${e.message}`);
      resolve(null);
    });
    setTimeout(() => { try { proc.kill(); } catch(e){} resolve(null); }, 15000);
  });
}

// We'll use puppeteer-like approach with Chrome DevTools Protocol
// Since puppeteer isn't available, use chrome-remote-interface style

// Actually, let's just use Chrome's built-in screenshot with localStorage manipulation
// by injecting auth state via URL-encoded data

const pages = [
  { url: `${BASE}/`, file: '01_homepage.png' },
  { url: `${BASE}/login`, file: '02_login.png' },
  { url: `${BASE}/signup`, file: '03_signup.png' },
];

async function run() {
  console.log('Taking screenshots...\n');
  for (const p of pages) {
    await screenshot(p.url, p.file, 3000);
  }
  console.log('\nDone! Screenshots saved to:', OUT);
}

run();

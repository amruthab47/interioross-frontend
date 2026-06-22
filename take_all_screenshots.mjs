import { spawn, execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = 'C:\\Users\\91994\\interioross\\screenshots';

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const USERS = {
  Admin:      { name: 'Akash R',      initials: 'AR', role: 'Admin',      phone: '+91 98400 00001', email: 'akash@squareinteriors.in',  city: 'Coimbatore' },
  Supervisor: { name: 'Ramesh Kumar', initials: 'RK', role: 'Supervisor', phone: '+91 98400 00002', email: 'ramesh@squareinteriors.in', city: 'Coimbatore' },
  Designer:   { name: 'Kavitha M',    initials: 'KM', role: 'Designer',   phone: '+91 98400 00003', email: 'kavitha@squareinteriors.in',city: 'Coimbatore' },
  Client:     { name: 'Priya K',      initials: 'PK', role: 'Client',     phone: '+91 98400 00004', email: 'priya@email.com',           city: 'Coimbatore' },
};

function makeSetupHtml(userData, redirectUrl) {
  const json = JSON.stringify(JSON.stringify(userData));
  return `<!DOCTYPE html><html><head><script>
    localStorage.setItem('interioross_user', ${json});
    window.location.replace(${JSON.stringify(redirectUrl)});
  </script></head><body></body></html>`;
}

let setupServer = null;
const setupPages = {};
let pageIndex = 0;

// Simple HTTP server for setup pages
import { createServer } from 'http';
const setupPort = 5174;
const server = createServer((req, res) => {
  const key = req.url.slice(1);
  if (setupPages[key]) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(setupPages[key]);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise(r => server.listen(setupPort, r));

async function screenshotPage(role, pagePath, filename, budget = 4000) {
  const userData = USERS[role];
  const targetUrl = `${BASE}${pagePath}`;
  const key = `setup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const html = makeSetupHtml(userData, targetUrl);
  setupPages[key] = html;

  const setupUrl = `http://localhost:${setupPort}/${key}`;
  const outFile = path.join(OUT, filename);

  return new Promise((resolve) => {
    const args = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
      `--screenshot=${outFile}`,
      `--virtual-time-budget=${budget}`,
      '--disable-web-security',
      '--allow-running-insecure-content',
      setupUrl
    ];
    const proc = spawn(CHROME, args, { stdio: 'pipe' });
    const timer = setTimeout(() => { try { proc.kill(); } catch(e){} resolve(false); }, 20000);
    proc.on('close', () => {
      clearTimeout(timer);
      delete setupPages[key];
      console.log(`  ✓ ${filename}`);
      resolve(true);
    });
    proc.on('error', (e) => {
      clearTimeout(timer);
      delete setupPages[key];
      console.log(`  ✗ ${filename}: ${e.message}`);
      resolve(false);
    });
  });
}

const PAGES = [
  // Public
  { role: null, path: '/',       file: '01_homepage.png',        budget: 3000 },
  { role: null, path: '/login',  file: '02_login.png',           budget: 2000 },
  { role: null, path: '/signup', file: '03_signup.png',          budget: 2000 },

  // Admin
  { role: 'Admin', path: '/dashboard',  file: '04_admin_dashboard.png',   budget: 5000 },
  { role: 'Admin', path: '/projects',   file: '05_admin_projects.png',    budget: 4000 },
  { role: 'Admin', path: '/projects/1', file: '06_admin_project_detail.png', budget: 4000 },
  { role: 'Admin', path: '/tasks',      file: '07_admin_tasks.png',       budget: 4000 },
  { role: 'Admin', path: '/finance',    file: '08_admin_finance.png',     budget: 4000 },
  { role: 'Admin', path: '/attendance', file: '09_admin_attendance.png',  budget: 4000 },
  { role: 'Admin', path: '/calendar',   file: '10_admin_calendar.png',    budget: 4000 },
  { role: 'Admin', path: '/chat',       file: '11_admin_chat.png',        budget: 4000 },
  { role: 'Admin', path: '/clients',    file: '12_admin_clients.png',     budget: 4000 },
  { role: 'Admin', path: '/vendors',    file: '13_admin_vendors.png',     budget: 4000 },
  { role: 'Admin', path: '/reports',    file: '14_admin_reports.png',     budget: 4000 },
  { role: 'Admin', path: '/settings',   file: '15_admin_settings.png',   budget: 4000 },
  { role: 'Admin', path: '/ai',         file: '16_admin_ai.png',          budget: 4000 },

  // Supervisor
  { role: 'Supervisor', path: '/supervisor', file: '17_supervisor_dashboard.png', budget: 5000 },
  { role: 'Supervisor', path: '/tasks',      file: '18_supervisor_tasks.png',     budget: 4000 },
  { role: 'Supervisor', path: '/attendance', file: '19_supervisor_attendance.png',budget: 4000 },
  { role: 'Supervisor', path: '/projects',   file: '20_supervisor_projects.png',  budget: 4000 },

  // Designer
  { role: 'Designer', path: '/designer',               file: '21_designer_dashboard.png',      budget: 5000 },
  { role: 'Designer', path: '/designer-studio',         file: '22_designer_studio.png',         budget: 4000 },
  { role: 'Designer', path: '/designer-collaboration',  file: '23_designer_collaboration.png',  budget: 4000 },
  { role: 'Designer', path: '/designer-materials',      file: '24_designer_materials.png',      budget: 4000 },
  { role: 'Designer', path: '/designer-marketplace',    file: '25_designer_marketplace.png',    budget: 4000 },
  { role: 'Designer', path: '/designer-finance',        file: '26_designer_finance.png',        budget: 4000 },
  { role: 'Designer', path: '/designer-timeline',       file: '27_designer_timeline.png',       budget: 4000 },
  { role: 'Designer', path: '/designer-documents',      file: '28_designer_documents.png',      budget: 4000 },
  { role: 'Designer', path: '/tasks',                   file: '29_designer_tasks.png',          budget: 4000 },
  { role: 'Designer', path: '/calendar',                file: '30_designer_calendar.png',       budget: 4000 },
  { role: 'Designer', path: '/chat',                    file: '31_designer_chat.png',           budget: 4000 },

  // Client
  { role: 'Client', path: '/client',               file: '32_client_dashboard.png',      budget: 5000 },
  { role: 'Client', path: '/client-designs',       file: '33_client_designs.png',        budget: 4000 },
  { role: 'Client', path: '/client-collaboration', file: '34_client_collaboration.png',  budget: 4000 },
  { role: 'Client', path: '/client-timeline',      file: '35_client_timeline.png',       budget: 4000 },
  { role: 'Client', path: '/client-marketplace',   file: '36_client_marketplace.png',    budget: 4000 },
  { role: 'Client', path: '/client-documents',     file: '37_client_documents.png',      budget: 4000 },
];

console.log(`\n📸 Taking ${PAGES.length} screenshots across all roles...\n`);

let prevRole = null;
for (const p of PAGES) {
  if (p.role !== prevRole) {
    console.log(`\n[${p.role ?? 'PUBLIC'}]`);
    prevRole = p.role;
  }
  if (p.role) {
    await screenshotPage(p.role, p.path, p.file, p.budget);
  } else {
    // Public page — just screenshot directly
    await new Promise((resolve) => {
      const outFile = path.join(OUT, p.file);
      const args = ['--headless=new','--no-sandbox','--disable-gpu','--window-size=1440,900',`--screenshot=${outFile}`,`--virtual-time-budget=${p.budget}`, `${BASE}${p.path}`];
      const proc = spawn(CHROME, args, { stdio: 'pipe' });
      const timer = setTimeout(() => { try{proc.kill();}catch(e){} resolve(false); }, 15000);
      proc.on('close', () => { clearTimeout(timer); console.log(`  ✓ ${p.file}`); resolve(true); });
      proc.on('error', (e) => { clearTimeout(timer); console.log(`  ✗ ${p.file}: ${e.message}`); resolve(false); });
    });
  }
  // Small delay between screenshots
  await new Promise(r => setTimeout(r, 500));
}

server.close();
console.log(`\n✅ All screenshots saved to: ${OUT}\n`);

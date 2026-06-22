/**
 * CDP screenshot tool — connects to already-running Chrome on port 9222
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { WebSocket } from 'ws';
import http from 'http';
import path from 'path';

const BASE = 'http://localhost:5173';
const OUT  = 'C:\\Users\\91994\\interioross\\screenshots';
const DEBUG_PORT = 9222;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getPageTab() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${DEBUG_PORT}/json`, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const tabs = JSON.parse(data);
          // Find an actual page tab (not extension)
          const page = tabs.find(t => t.type === 'page' && t.url.startsWith('http://localhost:5173'));
          resolve(page || tabs.find(t => t.type === 'page'));
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function cdpConnect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    const listeners = new Map();

    ws.on('open', () => resolve({ ws, send, on: onEvent, close: () => ws.close() }));
    ws.on('error', reject);
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
      if (msg.method) {
        const cbs = listeners.get(msg.method) || [];
        cbs.forEach(cb => cb(msg.params));
      }
    });

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const msgId = id++;
        pending.set(msgId, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }
    function onEvent(method, cb) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(cb);
    }
  });
}

async function screenshotPage(cdp, userData, pagePath, filename) {
  const url = `${BASE}${pagePath}`;

  // Set auth in localStorage BEFORE navigating
  await cdp.send('Runtime.evaluate', {
    expression: `localStorage.setItem('interioross_user', ${JSON.stringify(JSON.stringify(userData))})`,
  });

  // Navigate
  await cdp.send('Page.navigate', { url });

  // Wait for page load
  await sleep(3500);

  // Take screenshot
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 900, scale: 1 },
  });

  const filepath = path.join(OUT, filename);
  writeFileSync(filepath, Buffer.from(result.data, 'base64'));
  console.log(`  ✓ ${filename}`);
}

const USERS = {
  Admin:      { name: 'Akash R',      initials: 'AR', role: 'Admin',      phone: '+91 98400 00001', email: 'akash@squareinteriors.in',  city: 'Coimbatore' },
  Supervisor: { name: 'Ramesh Kumar', initials: 'RK', role: 'Supervisor', phone: '+91 98400 00002', email: 'ramesh@squareinteriors.in', city: 'Coimbatore' },
  Designer:   { name: 'Kavitha M',    initials: 'KM', role: 'Designer',   phone: '+91 98400 00003', email: 'kavitha@squareinteriors.in',city: 'Coimbatore' },
  Client:     { name: 'Priya K',      initials: 'PK', role: 'Client',     phone: '+91 98400 00004', email: 'priya@email.com',           city: 'Coimbatore' },
};

const PAGES = [
  { role: 'Admin',      path: '/dashboard',              file: '04_admin_dashboard.png'        },
  { role: 'Admin',      path: '/projects',               file: '05_admin_projects.png'         },
  { role: 'Admin',      path: '/projects/1',             file: '06_admin_project_detail.png'   },
  { role: 'Admin',      path: '/tasks',                  file: '07_admin_tasks.png'            },
  { role: 'Admin',      path: '/finance',                file: '08_admin_finance.png'          },
  { role: 'Admin',      path: '/attendance',             file: '09_admin_attendance.png'       },
  { role: 'Admin',      path: '/calendar',               file: '10_admin_calendar.png'         },
  { role: 'Admin',      path: '/chat',                   file: '11_admin_chat.png'             },
  { role: 'Admin',      path: '/clients',                file: '12_admin_clients.png'          },
  { role: 'Admin',      path: '/vendors',                file: '13_admin_vendors.png'          },
  { role: 'Admin',      path: '/reports',                file: '14_admin_reports.png'          },
  { role: 'Admin',      path: '/settings',               file: '15_admin_settings.png'         },
  { role: 'Admin',      path: '/ai',                     file: '16_admin_ai.png'               },
  { role: 'Supervisor', path: '/supervisor',             file: '17_supervisor_dashboard.png'   },
  { role: 'Supervisor', path: '/tasks',                  file: '18_supervisor_tasks.png'       },
  { role: 'Supervisor', path: '/attendance',             file: '19_supervisor_attendance.png'  },
  { role: 'Supervisor', path: '/projects',               file: '20_supervisor_projects.png'    },
  { role: 'Designer',   path: '/designer',               file: '21_designer_dashboard.png'     },
  { role: 'Designer',   path: '/designer-studio',        file: '22_designer_studio.png'        },
  { role: 'Designer',   path: '/designer-collaboration', file: '23_designer_collaboration.png' },
  { role: 'Designer',   path: '/designer-materials',     file: '24_designer_materials.png'     },
  { role: 'Designer',   path: '/designer-marketplace',   file: '25_designer_marketplace.png'   },
  { role: 'Designer',   path: '/designer-finance',       file: '26_designer_finance.png'       },
  { role: 'Designer',   path: '/designer-timeline',      file: '27_designer_timeline.png'      },
  { role: 'Designer',   path: '/designer-documents',     file: '28_designer_documents.png'     },
  { role: 'Designer',   path: '/tasks',                  file: '29_designer_tasks.png'         },
  { role: 'Designer',   path: '/calendar',               file: '30_designer_calendar.png'      },
  { role: 'Designer',   path: '/chat',                   file: '31_designer_chat.png'          },
  { role: 'Client',     path: '/client',                 file: '32_client_dashboard.png'       },
  { role: 'Client',     path: '/client-designs',         file: '33_client_designs.png'         },
  { role: 'Client',     path: '/client-collaboration',   file: '34_client_collaboration.png'   },
  { role: 'Client',     path: '/client-timeline',        file: '35_client_timeline.png'        },
  { role: 'Client',     path: '/client-marketplace',     file: '36_client_marketplace.png'     },
  { role: 'Client',     path: '/client-documents',       file: '37_client_documents.png'       },
];

async function main() {
  const tab = await getPageTab();
  if (!tab) throw new Error('No page tab found in Chrome debugger');
  console.log(`Connected to tab: ${tab.title} (${tab.url})\n`);

  const cdp = await cdpConnect(tab.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  let prevRole = null;
  for (const p of PAGES) {
    if (p.role !== prevRole) { console.log(`\n[${p.role}]`); prevRole = p.role; }
    await screenshotPage(cdp, USERS[p.role], p.path, p.file);
  }

  cdp.close();
  console.log(`\n✅ Done! Screenshots saved to: ${OUT}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });

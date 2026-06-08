import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '.screenshots');
await mkdir(OUT, { recursive: true });

const BASE = 'http://localhost:5176';

const PAGES = [
  { name: 'home',        path: '/',          waitFor: 'networkidle' },
  { name: 'login',       path: '/login',     waitFor: 'networkidle' },
  { name: 'dashboard',   path: '/dashboard', waitFor: 'networkidle' },
  { name: 'builder',     path: '/builder',   waitFor: 'networkidle' },
  { name: 'analytics',   path: '/analytics', waitFor: 'networkidle' },
  { name: 'playground',  path: '/playground',waitFor: 'networkidle' },
  { name: 'settings',    path: '/settings',  waitFor: 'networkidle' },
  { name: 'not-found',   path: '/404-test',  waitFor: 'networkidle' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

// Inject a dummy JWT cookie so auth-gated pages render
await context.addCookies([{
  name: 'archon_session',
  value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlci0wMDEiLCJlbWFpbCI6ImRldmVsb3BlckBhcmNob24uYWkiLCJuYW1lIjoiRGV2IFVzZXIiLCJhdmF0YXJfdXJsIjoiIiwicHJvdmlkZXIiOiJkZXYiLCJleHAiOjk5OTk5OTk5OTl9.fake',
  domain: 'localhost',
  path: '/',
}]);

// Also seed localStorage so the React AuthContext picks it up
const page = await context.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem('archon_user', JSON.stringify({
    id: 'dev-user-001',
    email: 'developer@archon.ai',
    name: 'Dev User',
    avatar_url: '',
    provider: 'dev',
  }));
  localStorage.setItem('archon_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlci0wMDEiLCJlbWFpbCI6ImRldmVsb3BlckBhcmNob24uYWkiLCJuYW1lIjoiRGV2IFVzZXIiLCJhdmF0YXJfdXJsIjoiIiwicHJvdmlkZXIiOiJkZXYiLCJleHAiOjk5OTk5OTk5OTl9.fake');
});

for (const { name, path: pagePath, waitFor } of PAGES) {
  try {
    await page.goto(`${BASE}${pagePath}`, { waitUntil: waitFor, timeout: 15000 });
    // Extra settle time for animations
    await page.waitForTimeout(1500);
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`✅ ${name} → ${file}`);
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    // Try screenshot anyway
    try {
      const file = path.join(OUT, `${name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`📸 ${name} partial → ${file}`);
    } catch {}
  }
}

await browser.close();
console.log('\nDone. Screenshots saved to .screenshots/');

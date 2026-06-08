import { chromium } from 'playwright';
import { mkdir, rename, readdir, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = path.join(__dirname, '.demo-video');
await mkdir(VIDEO_DIR, { recursive: true });

const BASE = 'http://localhost:5176';
const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlci0wMDEiLCJlbWFpbCI6ImRldmVsb3BlckBhcmNob24uYWkiLCJuYW1lIjoiRGV2IFVzZXIiLCJhdmF0YXJfdXJsIjoiIiwicHJvdmlkZXIiOiJkZXYiLCJleHAiOjk5OTk5OTk5OTl9.fake';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
});

await context.addCookies([{
  name: 'archon_session', value: FAKE_JWT,
  domain: 'localhost', path: '/',
}]);

const page = await context.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate((jwt) => {
  localStorage.setItem('archon_token', jwt);
  localStorage.setItem('archon_user', JSON.stringify({
    id: 'dev-user-001', email: 'developer@archon.ai', name: 'Dev User',
    avatar_url: '', provider: 'dev',
  }));
}, FAKE_JWT);

const wait = (ms) => page.waitForTimeout(ms);

console.log('▶ Recording Archon demo…');

// — Scene 1: Home —
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await wait(3500);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
await wait(1500);
await page.mouse.move(720, 300, { steps: 25 });
await wait(1500);

// — Scene 2: Login —
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await wait(3000);

// — Scene 3: Dashboard —
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await wait(3500);
await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
await wait(2000);

// — Scene 4: Builder —
await page.goto(`${BASE}/builder`, { waitUntil: 'networkidle' });
await wait(2000);
// Type in the description textarea
const textarea = await page.$('textarea');
if (textarea) {
  await textarea.click();
  await page.keyboard.type('A legal Q&A bot for law firms with citation tracking, 50k queries/month, GDPR compliance.', { delay: 22 });
  await wait(2500);
}
await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
await wait(2000);

// — Scene 5: Analytics —
await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' });
await wait(3000);

// — Scene 6: Playground —
await page.goto(`${BASE}/playground`, { waitUntil: 'networkidle' });
await wait(3000);
// Hover Load button to reveal dropdown
const loadBtn = await page.$('button:has-text("Load")');
if (loadBtn) {
  await loadBtn.click();
  await wait(2500);
  await page.mouse.click(50, 50);  // close
  await wait(500);
}

// — Scene 7: Settings —
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await wait(3000);
await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
await wait(2000);

// — Scene 8: NotFound —
await page.goto(`${BASE}/page-does-not-exist`, { waitUntil: 'networkidle' });
await wait(3000);

await page.close();
await context.close();
await browser.close();

// Rename the auto-generated video file
const files = await readdir(VIDEO_DIR);
const webm = files.find(f => f.endsWith('.webm'));
if (webm) {
  const dest = path.join(VIDEO_DIR, 'archon-demo.webm');
  if (path.join(VIDEO_DIR, webm) !== dest) {
    try { await rm(dest); } catch {}
    await rename(path.join(VIDEO_DIR, webm), dest);
  }
  console.log(`✅ Demo video saved: ${dest}`);
}

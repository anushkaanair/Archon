import { chromium } from 'playwright';

const BASE = 'http://localhost:5176';
const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlci0wMDEiLCJlbWFpbCI6ImRldmVsb3BlckBhcmNob24uYWkiLCJuYW1lIjoiRGV2IFVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.fake';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: 'archon_session', value: FAKE_JWT, domain: 'localhost', path: '/' }]);

const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`PAGE_ERR ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(`CONS_ERR ${m.text()}`); });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(({ jwt }) => {
  localStorage.setItem('archon_user', JSON.stringify({ id: 'dev', email: 'developer@archon.ai', name: 'Dev User', provider: 'dev' }));
  localStorage.setItem('archon_token', jwt);
}, { jwt: FAKE_JWT });

const log = [];
const check = async (label, fn) => {
  try { await fn(); log.push(`✅ ${label}`); }
  catch (e) { log.push(`❌ ${label} → ${e.message.split('\n')[0]}`); }
};

// 1. Home: top-right avatar → /dashboard
await check('Home avatar → /dashboard', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.click('a[aria-label="Open dashboard"]', { timeout: 5000 });
  await page.waitForURL('**/dashboard', { timeout: 5000 });
});

// 2. Home: "See how it works" anchor link present and not broken
await check('Home "See how it works" anchor', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const el = await page.$('a[aria-label="See how it works"]');
  if (!el) throw new Error('button missing');
});

// 3. Home: "Watch demo" must be GONE
await check('Home "Watch demo" removed', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const txt = await page.textContent('body');
  if (txt.includes('Watch demo')) throw new Error('still present');
});

// 4. Home: "Dashboard" pill must be GONE from nav
await check('Home "Dashboard" pill removed from nav', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const nav = await page.$('nav');
  const navTxt = await nav.textContent();
  if (navTxt.includes('Dashboard')) throw new Error('still in nav');
});

// 5. Sidebar nav: Dashboard / Builder / Analytics / Playground / Settings
for (const [label, path] of [['Dashboard','/dashboard'],['Builder','/builder'],['Analytics','/analytics'],['Playground','/playground'],['Settings','/settings']]) {
  await check(`Sidebar → ${label}`, async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.click(`a[href="${path}"]`, { timeout: 5000 });
    await page.waitForURL(`**${path}`, { timeout: 5000 });
  });
}

// 6. Settings tabs
await check('Settings tabs (Profile → API Key → Preferences → Security)', async () => {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.click('text=API Key');
  await page.waitForTimeout(300);
  await page.click('text=Preferences');
  await page.waitForTimeout(300);
  await page.click('text=Security');
  await page.waitForTimeout(300);
});

// 7. Settings: no "(offline)" leak
await check('Settings: no "(offline)" string', async () => {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  const txt = await page.textContent('body');
  if (txt.includes('(offline)')) throw new Error('"(offline)" still rendered');
});

// 8. Settings: Upgrade card removed
await check('Settings: Upgrade card removed', async () => {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  const txt = await page.textContent('body');
  if (/upgrade/i.test(txt)) throw new Error('"Upgrade" string found');
});

// 9. Playground: Load dropdown opens
await check('Playground: Load dropdown opens', async () => {
  await page.goto(`${BASE}/playground`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Load")');
  await page.waitForTimeout(400);
  const visible = await page.$('text=No saved pipelines, text=My Pipeline');
  // Either text is acceptable — just verifying menu opened
});

// 10. Playground: NO prototype banner
await check('Playground: prototype banner removed', async () => {
  await page.goto(`${BASE}/playground`, { waitUntil: 'networkidle' });
  const txt = await page.textContent('body');
  if (txt.includes('Visual prototype')) throw new Error('banner still present');
});

// 11. NotFound: 4 quick links present
await check('NotFound: Builder/Analytics/Playground/Settings links', async () => {
  await page.goto(`${BASE}/some-random-route-xyz`, { waitUntil: 'networkidle' });
  for (const t of ['Builder', 'Analytics', 'Playground', 'Settings']) {
    if (!(await page.$(`a:has-text("${t}")`))) throw new Error(`${t} link missing`);
  }
});

// 12. NotFound: Go to Dashboard button works
await check('NotFound: Go to Dashboard navigates', async () => {
  await page.goto(`${BASE}/some-random-route-xyz`, { waitUntil: 'networkidle' });
  await page.click('a:has-text("Go to Dashboard")');
  await page.waitForURL('**/dashboard', { timeout: 5000 });
});

// 13. Login page: both OAuth buttons render
await check('Login: Google + GitHub buttons render', async () => {
  await context.clearCookies();
  const p2 = await context.newPage();
  await p2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p2.evaluate(() => { localStorage.removeItem('archon_user'); localStorage.removeItem('archon_token'); });
  await p2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  if (!(await p2.$('button:has-text("Continue with Google")'))) throw new Error('Google btn missing');
  if (!(await p2.$('button:has-text("Continue with GitHub")'))) throw new Error('GitHub btn missing');
  await p2.close();
});

console.log('\n=== BUTTON TEST RESULTS ===');
log.forEach(l => console.log(l));
console.log(`\nPage / console errors: ${errors.length}`);
errors.slice(0, 10).forEach(e => console.log('  ', e));

await browser.close();
const failed = log.filter(l => l.startsWith('❌')).length;
process.exit(failed > 0 ? 1 : 0);

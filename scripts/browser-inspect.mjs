import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire('C:/Users/zKarina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://127.0.0.1:31297/daily-test-entry');
  await page.getByRole('button', { name: '每日学习', exact: true }).waitFor();
  await mkdir('docs/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/screenshots/host-start.png' });
  console.log((await page.locator('body').innerText()).slice(0, 5000));
  console.log('Buttons:', await page.getByRole('button').allTextContents());
} finally { await browser.close(); }

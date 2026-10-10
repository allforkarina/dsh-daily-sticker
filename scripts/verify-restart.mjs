import { createRequire } from 'node:module';
const require = createRequire('C:/Users/zKarina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });
const errors = [], prepare = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', req => { if (req.url().includes('/daily-learning/prepare')) prepare.push(req.url()); });
try {
  await page.goto(`http://127.0.0.1:${process.env.DSH_TEST_PORT || '31299'}/daily-test-entry`);
  await page.getByRole('button', { name: '每日学习', exact: true }).waitFor();
  for (const label of ['继续', '稍后配置']) {
    const button = page.getByRole('button', { name: label, exact: true });
    try { await button.waitFor({ timeout: 5000 }); await button.click(); } catch (e) { if (!String(e).includes('Timeout')) throw e; }
  }
  await page.getByRole('button', { name: '每日学习', exact: true }).click();
  await page.getByText('1 / 4 已完成', { exact: true }).waitFor();
  await page.getByText('已保存 · 模型规划', { exact: true }).waitFor();
  if (await page.locator('.dl-task').count() !== 4) throw new Error('Expected four restored tasks');
  await page.screenshot({ path: 'docs/screenshots/memo-final.png', fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'docs/screenshots/memo-dark-final.png', fullPage: true });
  console.log('Dark source link color:', await page.locator('.dl-sources a').first().evaluate(el => getComputedStyle(el).color));
  if (prepare.length) throw new Error('Restoring saved day unexpectedly requested planning');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Verified packaged restart recovery: four tasks, persisted checkbox, model plan, zero planning requests, no page errors');
} finally { await browser.close(); }

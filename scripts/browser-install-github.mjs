import { createRequire } from 'node:module';
const require = createRequire('C:/Users/zKarina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
try {
  await page.goto('http://127.0.0.1:31301/daily-test-entry');
  await page.getByRole('button', { name: '插件', exact: true }).waitFor();
  for (const label of ['继续', '稍后配置']) {
    const button = page.getByRole('button', { name: label, exact: true });
    try { await button.waitFor({ timeout: 5000 }); await button.click(); } catch (e) { if (!String(e).includes('Timeout')) throw e; }
  }
  await page.getByRole('button', { name: '插件', exact: true }).click();
  await page.getByRole('button', { name: '添加插件', exact: true }).click();
  const input = page.getByPlaceholder('例如 dsh-plugin-whale-pet', { exact: true });
  await input.fill('git+ssh://git@github.com/allforkarina/dsh-daily-sticker.git#main');
  await page.getByRole('button', { name: '安装', exact: true }).click();
  await page.getByRole('button', { name: '每日学习', exact: true }).waitFor({ timeout: 180000 });
  await page.screenshot({ path: 'docs/screenshots/github-ssh-install.png', fullPage: true });
  console.log('GUI installation via public GitHub SSH spec succeeded; Daily Learning sidebar entry exists');
} catch (error) {
  console.log('GUI:', (await page.locator('body').innerText()).slice(0, 6000));
  throw error;
} finally { await browser.close(); }

import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const runtime = process.env.PLAYWRIGHT_NODE_MODULES || 'C:/Users/zKarina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const require = createRequire(`${runtime}/package.json`);
const { chromium } = require('playwright');
const origin = `http://127.0.0.1:${process.env.DSH_TEST_PORT || '31297'}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('request', req => { if (req.url().includes('/daily-learning/')) console.log('Plugin request:', req.method(), new URL(req.url()).pathname); });
await mkdir('docs/screenshots', { recursive: true });
try {
  await page.goto(`${origin}/daily-test-entry`);
  await page.getByRole('button', { name: '每日学习', exact: true }).waitFor();
  const welcome = page.getByRole('button', { name: '继续', exact: true });
  try { await welcome.waitFor({ timeout: 8000 }); await welcome.click(); } catch (error) { if (!String(error).includes('Timeout')) throw error; }
  const later = page.getByRole('button', { name: '稍后配置', exact: true });
  try { await later.waitFor({ timeout: 8000 }); await later.click(); } catch (error) { if (!String(error).includes('Timeout')) throw error; }
  await page.getByRole('button', { name: '每日学习', exact: true }).click({ timeout: 20000 });
  await page.getByRole('heading', { name: '今日安排', exact: true }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/onboarding.png', fullPage: true });
  console.log('Native sidebar/main panel is visible without a session');
  if (!await page.getByLabel('数据目录').isVisible()) await page.locator('.dl-memo').getByRole('button', { name: '设置', exact: true }).click();
  await page.getByLabel('数据目录').fill(resolve(`.test-runtime/data-ui-${Date.now()}`));
  await page.getByRole('button', { name: '保存设置', exact: true }).click();
  await page.waitForTimeout(1000);
  console.log('Visible memo text:', (await page.locator('.dl-memo').innerText()).slice(0, 1400));
  if (await page.getByRole('button', { name: '准备今日任务', exact: true }).isVisible()) await page.getByRole('button', { name: '准备今日任务', exact: true }).click();
  await page.locator('.dl-task').first().waitFor({ timeout: 120000 });
  if (await page.locator('.dl-task').count() !== 4) throw new Error('Expected four memo tasks');
  await page.screenshot({ path: 'docs/screenshots/memo.png', fullPage: true });
  await page.locator('.dl-task').first().getByRole('checkbox').click();
  await page.getByText('1 / 4 已完成', { exact: true }).waitFor();
  await page.reload();
  try { await later.waitFor({ timeout: 8000 }); await later.click(); } catch (error) { if (!String(error).includes('Timeout')) throw error; }
  await page.getByRole('button', { name: '每日学习', exact: true }).click();
  await page.getByText('1 / 4 已完成', { exact: true }).waitFor();
  await page.locator('.dl-task').nth(1).getByRole('button', { name: '复制学习 Prompt', exact: true }).click();
  await page.getByText('已复制', { exact: true }).waitFor();
  await page.setViewportSize({ width: 850, height: 900 });
  await page.screenshot({ path: 'docs/screenshots/memo-narrow.png', fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'docs/screenshots/memo-dark.png', fullPage: true });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.locator('.dl-memo').getByRole('button', { name: '设置', exact: true }).click();
  await page.getByLabel('当前工程项目').fill('用于隔离测试的小型 Agent 项目：完善工具调用与验证。');
  const select = page.getByLabel('规划模型');
  const fixtureOption = await select.locator('option').filter({ hasText: 'Memo Fixture' }).getAttribute('value');
  await select.selectOption(fixtureOption);
  let failConfigurationOnce = true;
  await page.route('**/daily-learning/configure', async route => {
    if (failConfigurationOnce) {
      failConfigurationOnce = false;
      const input = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'server-response', rpcId: input.rpcId, result: { ok: false, error: { code: 'daily-learning/test', message: '测试配置失败，请重试', details: {} } } }) });
    } else await route.continue();
  });
  await page.getByRole('button', { name: '保存设置', exact: true }).click();
  await page.getByText('测试配置失败，请重试', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: '保存设置', exact: true }).click();
  await page.getByRole('button', { name: '保存设置', exact: true }).waitFor({ state: 'hidden' });
  if (!await page.getByRole('heading', { name: '今日安排', exact: true }).isVisible()) await page.getByRole('button', { name: '每日学习', exact: true }).click();
  await page.getByRole('button', { name: '重新规划未完成项', exact: true }).click();
  await page.getByText('已保存 · 模型规划', { exact: true }).waitFor({ timeout: 120000 });
  await page.getByText('1 / 4 已完成', { exact: true }).waitFor();
  const unauthorized = await page.request.post(`${origin}/daily-learning/state`, { headers: { Cookie: '' }, data: { type: 'client-request', rpcId: 'negative-test', method: 'state', payload: {} } });
  if (unauthorized.status() !== 401) throw new Error(`Unauthenticated route returned ${unauthorized.status()}`);
  const crossOrigin = await page.request.post(`${origin}/daily-learning/state`, { headers: { Origin: 'http://evil.example' }, data: { type: 'client-request', rpcId: 'negative-origin', method: 'state', payload: {} } });
  if (crossOrigin.status() !== 403) throw new Error('Cross-origin route was not refused');
  console.log('Passed: four tasks, configuration retry, checkbox, reload recovery, copy, model seam, narrow viewport, unauthenticated and cross-origin rejection');
  console.log('Browser errors:', JSON.stringify(errors));
  if (errors.length) throw new Error('Browser errors require investigation');
} catch (error) {
  await page.screenshot({ path: 'docs/screenshots/failure.png', fullPage: true }).catch(() => {});
  console.log('Failure UI:', (await page.locator('body').innerText()).slice(0, 3000));
  console.log('Browser errors:', JSON.stringify(errors));
  throw error;
} finally { await browser.close(); }

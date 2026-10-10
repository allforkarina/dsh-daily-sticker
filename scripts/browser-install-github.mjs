import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire('C:/Users/zKarina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const origin = `http://127.0.0.1:${process.env.DSH_TEST_PORT || '31301'}`;
const spec = process.env.DSH_INSTALL_SPEC || 'git+ssh://git@github.com/allforkarina/dsh-daily-sticker.git#main';
const npmInstall = !/github\.com|^github:|^git\+/.test(spec);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
try {
  await page.goto(`${origin}/daily-test-entry`);
  await page.getByRole('button', { name: '插件', exact: true }).waitFor();
  for (const label of ['继续', '稍后配置']) {
    const button = page.getByRole('button', { name: label, exact: true });
    try { await button.waitFor({ timeout: 5000 }); await button.click(); } catch (e) { if (!String(e).includes('Timeout')) throw e; }
  }
  await page.getByRole('button', { name: '插件', exact: true }).click();
  await page.getByRole('button', { name: '添加插件', exact: true }).click();
  const input = page.getByPlaceholder('例如 dsh-plugin-whale-pet', { exact: true });
  await input.fill(spec);
  if (process.env.DSH_INSTALL_SPEC) {
    const mirror = page.getByText('中国大陆镜像源', { exact: true });
    if (await mirror.isVisible()) { await mirror.click(); await page.getByText('npm 官方源', { exact: true }).last().click(); }
  }
  await page.getByRole('button', { name: '安装', exact: true }).click();
  await input.waitFor({ state: 'hidden', timeout: 180000 });
  const deadline = Date.now() + 180000;
  let manifest;
  if (!process.env.DSH_TEST_PROFILE) throw new Error('Set DSH_TEST_PROFILE to the isolated profile being verified');
  while (Date.now() < deadline) {
    manifest = JSON.parse(await readFile(`.test-runtime/home/profiles/${process.env.DSH_TEST_PROFILE}/package.json`, 'utf8'));
    if (manifest.dependencies?.['dsh-daily-learning']) break;
    await page.waitForTimeout(1000);
  }
  if (!manifest?.dependencies?.['dsh-daily-learning']) throw new Error('Installation did not commit the plugin dependency');
  if (!manifest.dsh?.profile?.bundles?.includes('dsh-daily-learning')) {
    await page.getByRole('button', { name: '立即启用', exact: true }).click({ timeout: 60000 });
  }
  const enabledDeadline=Date.now()+60000;
  while(Date.now()<enabledDeadline){manifest=JSON.parse(await readFile(`.test-runtime/home/profiles/${process.env.DSH_TEST_PROFILE}/package.json`,'utf8'));if(manifest.dsh?.profile?.bundles?.includes('dsh-daily-learning'))break;await page.waitForTimeout(500);}
  if(!manifest.dsh?.profile?.bundles?.includes('dsh-daily-learning'))throw new Error('Installed plugin was not enabled');
  const installed=JSON.parse(await readFile(`.test-runtime/home/profiles/${process.env.DSH_TEST_PROFILE}/node_modules/dsh-daily-learning/package.json`,'utf8'));
  if(installed.version!=='0.2.0')throw new Error(`Unexpected installed version ${installed.version}`);
  const state=await page.request.post(`${origin}/daily-learning/state`,{data:{type:'client-request',rpcId:'install-verification',method:'state',payload:{}}});
  if(state.status()!==200||(await state.json()).result.value.defaults.learningRequests.llm!== '')throw new Error('Installed 0.2.0 Host did not load');
  await page.getByRole('button', { name: '每日学习', exact: true }).waitFor({ timeout: 180000 });
  await page.screenshot({ path: npmInstall ? 'docs/screenshots/npm-install-020.png' : 'docs/screenshots/github-install-020.png', fullPage: true });
  console.log(`GUI installation committed: ${spec}; dependency and bundle registered in ${process.env.DSH_TEST_PROFILE}`);
} catch (error) {
  console.log('GUI:', (await page.locator('body').innerText()).slice(0, 6000));
  throw error;
} finally { await browser.close(); }

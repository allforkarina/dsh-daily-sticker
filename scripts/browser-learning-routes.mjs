import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

// Build-only preflight also provides a deterministic RED before a DSH runtime is available.
if (process.argv.includes('--build-only')) {
  const bundle = await readFile('lib/client.js', 'utf8');
  assert.match(bundle, /function LearningSettings\(/, 'Built client must include the learning settings component');
  assert.match(bundle, /routeGenerate/, 'Built client must call the route generation RPC');
  assert.doesNotMatch(bundle, /from ['"]\.\/learning\.ts['"]/, 'Client cannot import the Host TypeScript module');
  console.log('Passed: inline learning component and browser-safe route module');
} else {
  const runtime = process.env.PLAYWRIGHT_NODE_MODULES || 'C:/Users/zKarina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
  const require = createRequire(`${runtime}/package.json`);
  const { chromium } = require('playwright');
  const origin = `http://127.0.0.1:${process.env.DSH_TEST_PORT || '31297'}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const rpc = async (method, payload = {}) => {
    const response = await page.request.post(`${origin}/daily-learning/${method}`, { data: { type: 'client-request', rpcId: `learning-ui-${Date.now()}`, method, payload } });
    const body = await response.json();
    assert.equal(body.result?.ok, true, JSON.stringify(body));
    return body.result.value;
  };
  const enter = async () => {
    await page.goto(`${origin}/daily-test-entry`);
    await page.getByRole('button', { name: '每日学习', exact: true }).waitFor();
    for (const name of ['继续', '稍后配置']) {
      const button = page.getByRole('button', { name, exact: true });
      try { await button.waitFor({ timeout: 3000 }); await button.click(); }
      catch (error) { if (!String(error).includes('Timeout')) throw error; }
    }
    await page.getByRole('button', { name: '每日学习', exact: true }).click();
    await page.getByRole('heading', { name: '今日安排', exact: true }).waitFor();
  };
  const settings = async () => {
    if (!await page.getByLabel('数据目录').isVisible()) await page.locator('.dl-memo').getByRole('button', { name: '设置', exact: true }).click();
    await page.locator('.dl-settings').waitFor();
  };
  const llmDetails = page.locator('.dl-learning-category').filter({ has: page.getByText('LLM', { exact: true }) }).first();
  const openLLM = async () => {
    if (!await page.getByLabel('LLM 学习需求', { exact: true }).isVisible()) await llmDetails.locator(':scope > summary').click();
  };
  const request = '想理解 Attention，偏手算与实验。\n' + '保留中文、Markdown 与换行，不假定我有基础。\n'.repeat(350);
  const refreshView = async () => {
    const response = page.waitForResponse(response => new URL(response.url()).pathname === '/daily-learning/state');
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await response;
    await page.waitForTimeout(100);
  };
  const crossRoot = async () => {
    const rootA = resolve(`.test-runtime/data-learning-cross-a-${Date.now()}`);
    const rootB = resolve(`.test-runtime/data-learning-cross-b-${Date.now()}`);
    const guarded = root => process.argv.includes('--legacy-root-rpc') ? {} : { expectedDataRoot: root };
    let snapshot = await rpc('state');
    const originalConfig = structuredClone(snapshot.config);
    await rpc('configure', { ...snapshot.config, dataRoot: rootB, autoPrepareOnOpen: false, expectedConfig: snapshot.config });
    snapshot = await rpc('state');
    snapshot = await rpc('preferences', { ...guarded(rootB), revision: snapshot.state.revision, preferences: { ...snapshot.state.preferences, learningRequests: { ...snapshot.state.preferences.learningRequests, llm: '目录 B 的原需求。' } } });
    const originalB = structuredClone(snapshot.state);
    await rpc('configure', { ...snapshot.config, dataRoot: rootA, expectedConfig: snapshot.config });
    snapshot = await rpc('state');
    snapshot = await rpc('preferences', { ...guarded(rootA), revision: snapshot.state.revision, preferences: { ...snapshot.state.preferences, learningRequests: { ...snapshot.state.preferences.learningRequests, llm: '目录 A 的原需求。' } } });
    assert.equal(snapshot.state.revision, originalB.revision, 'Different roots intentionally share a revision');
    await refreshView(); await settings(); await openLLM();
    await page.getByLabel('LLM 学习需求', { exact: true }).fill('目录 A 尚未保存的草稿。');
    await rpc('configure', { ...snapshot.config, dataRoot: rootB, expectedConfig: snapshot.config });
    snapshot = await rpc('state');
    await refreshView();
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    const after = await rpc('state');
    assert.deepEqual(after.state.preferences, originalB.preferences, 'An old form must never overwrite another root with the same revision');
    await page.getByText('数据目录已被其他客户端更改；请收起并重新打开设置。', { exact: true }).first().waitFor();
    assert.equal(await page.getByLabel('LLM 学习需求', { exact: true }).inputValue(), '目录 A 尚未保存的草稿。');
    assert.equal(await page.getByRole('button', { name: '生成 LLM 路线', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: '收起', exact: true }).click();
    await settings(); await openLLM();
    assert.equal(await page.getByLabel('数据目录').inputValue(), rootB);
    assert.equal(await page.getByLabel('LLM 学习需求', { exact: true }).inputValue(), '目录 B 的原需求。');
    await page.getByRole('button', { name: '收起', exact: true }).click();
    snapshot = await rpc('state');
    await rpc('configure', { ...originalConfig, expectedConfig: snapshot.config });
    await refreshView();
    console.log('Passed: equal-revision cross-root save refuses overwrite, preserves draft, and reopens the active root.');
  };
  await mkdir('docs/screenshots', { recursive: true });
  try {
    await enter();
    if (process.argv.includes('--cross-root-only')) { await crossRoot(); }
    else {
    await settings();
    await page.getByLabel('数据目录').fill(resolve(`.test-runtime/data-learning-ui-${Date.now()}`));
    const select = page.getByLabel('规划模型');
    const fixture = await select.locator('option').filter({ hasText: 'Memo Fixture' }).getAttribute('value');
    assert.ok(fixture, 'Isolated runtime must expose the local fixture model');
    await select.selectOption(fixture);
    await page.getByLabel('首次打开今日备忘录时自动准备').uncheck();
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.locator('.dl-settings').waitFor({ state: 'hidden' });
    await settings(); await openLLM();
    await page.getByLabel('LLM 学习需求', { exact: true }).fill(request);
    await page.getByLabel('首次打开今日备忘录时自动准备').check();
    assert.equal(await page.getByLabel('LLM 学习需求', { exact: true }).getAttribute('maxlength'), '12000');
    assert.equal(await page.getByRole('button', { name: '生成 LLM 路线', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('设置已保存', { exact: true }).waitFor();
    // Saving can prepare the first day. The same open form must adopt that newer revision.
    await page.locator('.dl-task').first().waitFor({ timeout: 140000 });
    await page.locator('.dl-footer button:not([disabled])').waitFor({ timeout: 140000 });
    await page.getByText('时间预算与学习偏好', { exact: true }).click();
    await page.getByLabel('LLM / 分钟', { exact: true }).fill('31');
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('设置已保存', { exact: true }).waitFor();
    await page.route('**/daily-learning/routeGenerate', async route => {
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.continue();
    });
    await page.getByRole('button', { name: '生成 LLM 路线', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '收起设置', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: '保存设置', exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel('规划模型').isDisabled(), true);
    await page.getByText('路线已生成', { exact: true }).waitFor({ timeout: 140000 });
    await page.unroute('**/daily-learning/routeGenerate');
    await page.getByText('QKV', { exact: true }).first().waitFor();
    // Regression: route commit must update the settings revision without closing the panel.
    if (!await page.getByLabel('LLM / 分钟', { exact: true }).isVisible()) await page.getByText('时间预算与学习偏好', { exact: true }).click();
    await page.getByLabel('LLM / 分钟', { exact: true }).fill('35');
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('设置已保存', { exact: true }).waitFor();
    await page.getByText('时间预算已修改，可重新生成路线更新预计天数。', { exact: true }).waitFor();
    await page.getByText('时间预算与学习偏好', { exact: true }).click();
    await page.locator('.dl-learning').evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: 'docs/screenshots/learning-route-settings.png', fullPage: true });
    await enter(); await settings(); await openLLM();
    assert.equal(await page.getByLabel('LLM 学习需求', { exact: true }).inputValue(), request.trim());
    await page.getByText('QKV', { exact: true }).first().waitFor();
    const prepare = page.getByRole('button', { name: '准备今日任务', exact: true });
    if (await prepare.isVisible()) await prepare.click();
    else await page.getByRole('button', { name: '重新规划未完成项', exact: true }).click();
    await page.locator('.dl-task-learning').filter({ hasText: 'QKV' }).waitFor({ timeout: 140000 });
    await page.locator('.dl-footer button:not([disabled])').waitFor({ timeout: 140000 });
    if (!await page.getByLabel('LLM / 分钟', { exact: true }).isVisible()) await page.getByText('时间预算与学习偏好', { exact: true }).click();
    await page.getByLabel('LLM / 分钟', { exact: true }).fill('36');
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('设置已保存', { exact: true }).waitFor();
    const llmTask = page.locator('.dl-task').nth(1);
    await page.getByLabel('AI 探索兴趣').fill('保留勾选前正在编辑的兴趣草稿。');
    await llmTask.getByRole('checkbox').click();
    await page.getByText('1 / 4 已完成', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('AI 探索兴趣').inputValue(), '保留勾选前正在编辑的兴趣草稿。');
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('设置已保存', { exact: true }).waitFor();
    await page.getByRole('button', { name: '收起', exact: true }).click();
    const completedTitle = await llmTask.locator('h2').innerText();
    await settings(); await openLLM();
    await page.getByLabel('LLM 学习需求', { exact: true }).fill('改变方向：Attention 之后学习推理优化。');
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('需求已修改，路线尚未更新。', { exact: true }).waitFor();
    await page.getByRole('button', { name: '重新生成 LLM 路线', exact: true }).click();
    await page.getByText('路线已生成', { exact: true }).waitFor({ timeout: 140000 });
    await llmDetails.getByText('历史路线（1）', { exact: true }).click();
    await llmDetails.locator('.dl-route-versions > details > summary').click();
    await llmDetails.getByText('当时的学习需求', { exact: true }).click();
    assert.ok((await llmDetails.locator('.dl-route-versions > details').innerText()).includes('想理解 Attention'));
    // Force a model RPC failure and confirm the active route/version remains untouched.
    const goalBefore = await llmDetails.locator('.dl-route-current h4').innerText();
    await page.route('**/daily-learning/routeGenerate', async route => {
      const input = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'server-response', rpcId: input.rpcId, result: { ok: false, error: { code: 'daily-learning/test', message: '隔离测试：路线生成失败', details: {} } } }) });
    });
    await page.getByRole('button', { name: '重新生成 LLM 路线', exact: true }).click();
    await page.getByText('隔离测试：路线生成失败', { exact: true }).first().waitFor();
    assert.equal(await llmDetails.locator('.dl-route-current h4').innerText(), goalBefore);
    await page.unroute('**/daily-learning/routeGenerate');
    await page.getByRole('button', { name: '收起', exact: true }).click();
    await page.getByRole('button', { name: '重新规划未完成项', exact: true }).click();
    await page.locator('.dl-footer button:not([disabled])').waitFor({ timeout: 140000 });
    await page.getByText('1 / 4 已完成', { exact: true }).waitFor();
    assert.equal(await llmTask.locator('h2').innerText(), completedTitle);
    await llmTask.getByRole('button', { name: '复制学习 Prompt', exact: true }).click();
    // Browser clipboard may be unavailable; the plugin's fallback must carry the old task snapshot.
    const fallback = page.getByRole('region', { name: '手动复制' });
    if (await fallback.isVisible()) assert.ok((await fallback.locator('textarea').inputValue()).includes('想理解 Attention'));
    else {
      await page.getByText('已复制', { exact: true }).waitFor();
      const prompt = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(prompt.includes('想理解 Attention'), 'Copied historical task must retain its original learning request');
      assert.ok(!prompt.includes('改变方向：Attention'), 'Copied task must not use the new route request');
    }
    await page.setViewportSize({ width: 850, height: 900 });
    await page.locator('.dl-surface').evaluate(element => { element.scrollTop = 0; });
    assert.ok(await page.locator('.dl-surface').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Narrow memo must not overflow horizontally');
    await page.screenshot({ path: 'docs/screenshots/learning-route-memo.png', fullPage: true });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: 'docs/screenshots/learning-route-dark.png', fullPage: true });
    await settings(); await openLLM();
    const beforeConflict = await rpc('state');
    assert.equal(beforeConflict.state.routes.llm.versions.length, 2);
    assert.notEqual(beforeConflict.state.routes.llm.versions[0].id, beforeConflict.state.routes.llm.versions[1].id);
    await page.getByLabel('LLM 学习需求', { exact: true }).fill('暂未保存的路线编辑草稿。');
    await rpc('preferences', { expectedDataRoot: beforeConflict.config.dataRoot, revision: beforeConflict.state.revision, preferences: { ...beforeConflict.state.preferences, interests: '另一个客户端保存的兴趣。' } });
    const reloaded = page.waitForResponse(response => new URL(response.url()).pathname === '/daily-learning/state');
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await reloaded;
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.getByText('数据已更新，操作冲突；请刷新后重试', { exact: true }).first().waitFor();
    assert.equal(await page.getByLabel('LLM 学习需求', { exact: true }).inputValue(), '暂未保存的路线编辑草稿。');
    await page.getByRole('button', { name: '收起', exact: true }).click();
    await settings(); await openLLM();
    await page.getByLabel('LLM 学习需求', { exact: true }).fill('');
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.locator('.dl-settings').waitFor({ state: 'hidden' });
    const deactivated = await rpc('state');
    assert.equal(deactivated.state.routes.llm.activeId, null);
    assert.equal(deactivated.state.routes.llm.versions.length, 2, 'Clearing request preserves every historical route');
    assert.equal(deactivated.state.days[deactivated.today].tasks[1].learning.request, request.trim(), 'Clearing request preserves historical task snapshots');
    await crossRoot();
    assert.deepEqual(errors, []);
    console.log('Passed isolated fixture UI: long requests, generation, auto-prepare/replan/checkbox revision baselines, same-page budget save, reload, distinct old versions, failure preservation, completed task retention, copied old Prompt, external preference conflict, deactivation, 850px layout. No external model was called.');
    }
  } catch (error) {
    await page.screenshot({ path: 'docs/screenshots/learning-route-failure.png', fullPage: true }).catch(() => {});
    console.log((await page.locator('body').innerText()).slice(0, 4000));
    throw error;
  } finally { await browser.close(); }
}

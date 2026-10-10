const React = require('react');
const { createElement: h, useState, useEffect, useRef, useSyncExternalStore } = React;
const { categories, labels, defaults, llmTopics, taskText, promptFor, enteredDate } = domain;
const NAME = 'dsh-daily-learning';
const ROOT_SESSION_ERROR = '数据目录已被其他客户端更改；请收起并重新打开设置。';
const sameDataRoot = (left, right) => (left || '').trim() === (right || '').trim();

function Button({ children, ...props }) { return h('button', { type: 'button', ...props }, children); }
function Settings({ view, api, onReload, onClose, onError, onSavingChange, disabled }) {
  const [cfg, setCfg] = useState({ ...view.config });
  const [prefs, setPrefs] = useState(structuredClone(view.state?.preferences || defaults()));
  const baseRevision = useRef(view.state?.revision);
  const baseConfig = useRef(structuredClone(view.config));
  const basePreferences = useRef(structuredClone(prefs));
  const rootChanged = (cfg.dataRoot || '').trim() !== (baseConfig.current.dataRoot || '').trim();
  const sessionRootChanged = !sameDataRoot(view.config.dataRoot, baseConfig.current.dataRoot);
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const prefsChanged = JSON.stringify(prefs) !== JSON.stringify(basePreferences.current);
  const configChanged = JSON.stringify(cfg) !== JSON.stringify(baseConfig.current);
  const locked = disabled || saving || generating || view.preparing || Boolean(view.routeGenerating);
  const committed = saved => {
    if (!sameDataRoot(saved.config.dataRoot, baseConfig.current.dataRoot)) throw new Error(ROOT_SESSION_ERROR);
    baseRevision.current = saved.state.revision;
    basePreferences.current = structuredClone(saved.state.preferences);
    setPrefs(structuredClone(saved.state.preferences));
  };
  useEffect(() => {
    if (view.state && !rootChanged && (view.config.dataRoot || '').trim() === (baseConfig.current.dataRoot || '').trim() && JSON.stringify(view.state.preferences) === JSON.stringify(basePreferences.current)) baseRevision.current = view.state.revision;
  }, [view.state?.revision, view.config.dataRoot, rootChanged]);
  useEffect(() => { let alive = true; api.call('catalog', {}).then(value => { if (alive) setCatalog(value); }).catch(e => { if (alive) setMessage(e.message); }); return () => { alive = false; }; }, []);
  const field = (label, control, hint) => h('label', { className: 'dl-field' }, h('span', null, label), control, hint && h('small', null, hint));
  const number = (key, title) => field(title, h('input', { type: 'number', min: 5, max: 240, value: prefs[key], onChange: e => setPrefs({ ...prefs, [key]: Number(e.target.value) }) }));
  const save = async () => {
    if (sessionRootChanged) { setMessage(ROOT_SESSION_ERROR); onError(ROOT_SESSION_ERROR); return; }
    setSaving(true); onSavingChange(true); setMessage('');
    try {
      if (view.state && !rootChanged && JSON.stringify(prefs) !== JSON.stringify(basePreferences.current)) {
        const saved = await api.call('preferences', { preferences: prefs, revision: baseRevision.current, expectedDataRoot: baseConfig.current.dataRoot });
        committed(saved);
      }
      const changed = JSON.stringify(cfg) !== JSON.stringify(baseConfig.current);
      if (changed) {
        await api.call('configure', { ...cfg, dataRoot: cfg.dataRoot?.trim() || null, expectedConfig: baseConfig.current });
        baseConfig.current = structuredClone({ ...cfg, dataRoot: cfg.dataRoot?.trim() || null });
      }
      const refreshed = await onReload();
      if (refreshed && !sameDataRoot(refreshed.config.dataRoot, baseConfig.current.dataRoot)) throw new Error(ROOT_SESSION_ERROR);
      if (refreshed?.state && !rootChanged) committed(refreshed);
      if (rootChanged || !Object.values(prefs.learningRequests || {}).some(request => request.trim())) onClose();
      else setMessage('设置已保存');
    } catch (e) { setMessage(e.message); onError(e.message); }
    finally { setSaving(false); onSavingChange(false); }
  };
  const options = catalog.flatMap(provider => provider.models.map(model => ({ value: JSON.stringify({ provider: provider.id, model: model.id }), label: `${provider.name} / ${model.name || model.id}` })));
  const current = cfg.model ? JSON.stringify(cfg.model) : '';
  if (current && !options.some(o => o.value === current)) options.unshift({ value: current, label: `${cfg.model.provider} / ${cfg.model.model}` });
  return h('section', { className: 'dl-settings', 'aria-label': '规划设置' },
    h('div', { className: 'dl-section-head' }, h('h2', null, '规划设置'), h(Button, { onClick: onClose, disabled: sessionRootChanged ? saving || generating : locked }, '收起')),
    field('数据目录', h('input', { disabled: locked, value: cfg.dataRoot || '', placeholder: '例如 D:\\Learning\\DailyPlans', onChange: e => setCfg({ ...cfg, dataRoot: e.target.value }) }), '首次使用请选择空的本地目录。重选原目录可恢复计划。'),
    field('规划模型', h('select', { disabled: locked, value: current, onChange: e => setCfg({ ...cfg, model: e.target.value ? JSON.parse(e.target.value) : null }) }, h('option', { value: '' }, '暂不选择 · 使用模板'), ...options.map(o => h('option', { key: o.value, value: o.value }, o.label))), '使用宿主已配置的模型。这里无需填写 API Key。'),
    h('label', { className: 'dl-toggle' }, h('input', { disabled: locked, type: 'checkbox', checked: cfg.autoPrepareOnOpen, onChange: e => setCfg({ ...cfg, autoPrepareOnOpen: e.target.checked }) }), '首次打开今日备忘录时自动准备'),
    rootChanged && view.state && h('p', { className: 'dl-quiet' }, '更换目录后请先保存，再调整该目录的学习偏好。旧目录的偏好保留。'),
    sessionRootChanged && h('p', { className: 'dl-error', role: 'alert' }, ROOT_SESSION_ERROR),
    view.state && h('fieldset', { className: 'dl-preferences', disabled: rootChanged || locked },
      h(LearningSettings, { view, expectedDataRoot: baseConfig.current.dataRoot, requests: prefs.learningRequests || { algorithm: '', llm: '', agent: '', explore: '' }, onRequestsChange: learningRequests => { setMessage(''); setPrefs({ ...prefs, learningRequests }); }, api, onReload, onCommitted: committed, onError, disabled: sessionRootChanged || rootChanged || prefsChanged || configChanged || locked, onGeneratingChange: value => { setGenerating(value); onSavingChange(value); } }),
      field('当前工程项目', h('textarea', { rows: 3, value: prefs.project, placeholder: '可留空。以后有项目时填写背景、当前目标或公开仓库链接。', onChange: e => setPrefs({ ...prefs, project: e.target.value }) })),
      field('AI 探索兴趣', h('textarea', { rows: 2, value: prefs.interests, onChange: e => setPrefs({ ...prefs, interests: e.target.value }) })),
      h('details', null, h('summary', null, '时间预算与学习偏好'),
        h('div', { className: 'dl-grid' }, number('algorithmMinutes', '算法 / 分钟'), number('llmMinutes', 'LLM / 分钟'), number('agentMinMinutes', '工程下限 / 分钟'), number('agentMaxMinutes', '工程上限 / 分钟'), number('exploreMinutes', '探索 / 分钟')),
        field('LLM 起点', h('select', { value: prefs.llmStart, onChange: e => setPrefs({ ...prefs, llmStart: Number(e.target.value) }) }, ...llmTopics.map((t, i) => h('option', { key: t, value: i }, t)))),
        field('LeetCode 站点', h('select', { value: prefs.leetcodeSite, onChange: e => setPrefs({ ...prefs, leetcodeSite: e.target.value }) }, h('option', { value: 'cn' }, 'leetcode.cn'), h('option', { value: 'com' }, 'leetcode.com'))),
        field('时区', h('input', { value: prefs.timezone, onChange: e => setPrefs({ ...prefs, timezone: e.target.value }) }))),
      h('details', null, h('summary', null, '复制 Prompt 时的角色风格'), ...categories.map(c => field(labels[c], h('textarea', { rows: 3, value: prefs.roles[c], onChange: e => setPrefs({ ...prefs, roles: { ...prefs.roles, [c]: e.target.value } }) }))))),
    message && h('p', { role: message === '设置已保存' ? 'status' : 'alert', className: message === '设置已保存' ? 'dl-quiet' : 'dl-error' }, message),
    h(Button, { className: 'dl-primary', disabled: locked, onClick: save }, saving ? '正在保存…' : '保存设置'));
}

function Memo({ api, active }) {
  const selected = useSyncExternalStore(active.subscribe, active.getSnapshot, active.getSnapshot);
  const [view, setView] = useState(null);
  const [date, setDate] = useState('');
  const selectedDate = useRef(date);
  selectedDate.current = date;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [online, setOnline] = useState(true);
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState('');
  const [copyText, setCopyText] = useState(null);
  const fallback = useRef(null);
  const autoDates = useRef(new Set());
  const lastEnteredToday = useRef(null);
  const revision = view?.state?.revision;
  const load = async () => {
    try { const next = await api.call('state', {}); setView(next); setOnline(true); return next; }
    catch (e) { setOnline(false); setError(e.message); throw e; }
  };
  const run = async (method, payload) => {
    setBusy(true); setError('');
    try { const next = await api.call(method, { expectedDataRoot: view?.config.dataRoot, ...payload }); setView(next); setOnline(true); return next; }
    catch (e) { setError(e.message); await load().catch(() => {}); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    load().then(next => {
      if (!alive) return;
      const previousToday = lastEnteredToday.current;
      const targetDate = enteredDate(selectedDate.current, previousToday, next.today);
      setDate(targetDate);
      lastEnteredToday.current = next.today;
      if (targetDate === next.today && next.state && next.config.autoPrepareOnOpen && !next.state.days[next.today] && !autoDates.current.has(next.today) && document.visibilityState === 'visible' && api.isActive()) {
        autoDates.current.add(next.today);
        run('prepare', { force: false, expectedDataRoot: next.config.dataRoot });
      }
    }).catch(() => {});
    const reload = () => { if (document.visibilityState === 'visible' && api.isActive()) load().catch(() => {}); };
    const timer = setInterval(reload, 20000);
    document.addEventListener('visibilitychange', reload);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', reload); };
  }, [selected]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { if (copyText !== null) { fallback.current?.focus(); fallback.current?.select(); } }, [copyText]);
  const copy = async (content) => { try { await navigator.clipboard.writeText(content); setToast('已复制'); } catch { setCopyText(content); } };
  const today = view?.today;
  const shownDate = date || today;
  const plan = view?.state?.days[shownDate];
  const preferences = view?.state?.preferences || defaults();
  const dates = [...new Set([today, ...Object.keys(view?.state?.days || {})].filter(Boolean))].sort().reverse();
  const hasCurrent = Boolean(view?.state?.days[today]);
  const loading = busy || savingSettings || view?.preparing || Boolean(view?.routeGenerating);
  const start = async (force) => { setDate(today); await run('prepare', { force }); };
  return h('div', { className: 'dl-surface' }, h('style', null, css), h('main', { className: 'dl-memo' },
    h('header', { className: 'dl-header' },
      h('div', null, h('div', { className: 'dl-kicker' }, 'DAILY LEARNING'), h('h1', null, '今日安排'), h('p', { className: 'dl-subtitle' }, '把任务留在这里，把学习带到你的工具里。')),
      h('div', { className: 'dl-header-actions' }, view && h(Button, { disabled: loading, onClick: () => setSettings(!settings) }, settings ? '收起设置' : '设置'))),
    view && h('div', { className: 'dl-datebar' },
      today && h('select', { value: shownDate, onChange: e => setDate(e.target.value), 'aria-label': '查看日期' }, ...dates.map(d => h('option', { key: d, value: d }, `${d}${d === today ? ' · 今天' : ''}`))),
      h('span', { className: 'dl-quiet' }, plan ? `${plan.tasks.filter(t => t.done).length} / 4 已完成` : '四类任务，独立安排'),
      view.state && h(Button, { disabled: loading || !online, onClick: () => start(false) }, loading ? '正在准备…' : hasCurrent ? '查看今天' : '准备今日任务')),
    error && h('div', { className: 'dl-message dl-error', role: 'alert' }, error, h(Button, { onClick: () => { setError(''); load().catch(() => {}); } }, '刷新')),
    view?.error && h('div', { className: 'dl-message dl-error', role: 'alert' }, view.error),
    view?.warning && h('div', { className: 'dl-message', role: 'status' }, view.warning),
    !view && h('p', { className: 'dl-empty' }, '正在打开备忘录…'),
    view && (!view.state || settings) && h(Settings, { view, api, disabled: busy || !online, onSavingChange: setSavingSettings, onReload: async () => {
      const next = await load();
      if (next.state && next.config.autoPrepareOnOpen && !next.state.days[next.today] && api.isActive() && document.visibilityState === 'visible') {
        autoDates.current.add(next.today); setDate(next.today);
        return await run('prepare', { force: false, expectedDataRoot: next.config.dataRoot }) || await load();
      }
      return next;
    }, onClose: () => setSettings(false), onError: setError }),
    view?.state && shownDate !== today && !hasCurrent && h('p', { className: 'dl-message' }, '今天尚未准备。点击“准备今日任务”后才会生成新计划。'),
    view?.state && !plan && h('div', { className: 'dl-empty' }, h('h2', null, loading ? '正在安排今天' : '今天留出一点学习时间'), h('p', null, loading ? '正在取得资料并准备四类任务。你可以稍后回来查看。' : '算法、LLM、Agent 工程与 AI 探索，各有一个清晰目标。')),
    plan && h('section', { className: 'dl-task-list', 'aria-label': '每日任务' }, ...plan.tasks.map((task, index) =>
      h('article', { className: `dl-task${task.done ? ' dl-done' : ''}`, key: task.id },
        h('div', { className: 'dl-task-top' }, h('span', { className: 'dl-category' }, `${String(index + 1).padStart(2, '0')} / ${labels[task.category]}`), h('span', { className: 'dl-time' }, `${task.minutes} 分钟`)),
        h('div', { className: 'dl-title-row' }, h('input', { type: 'checkbox', checked: task.done, disabled: loading || !online, 'aria-label': `${task.title}完成`, onChange: e => run('check', { date: shownDate, category: task.category, done: e.target.checked, revision }) }), h('h2', null, task.title)),
        task.learning && h('p', { className: 'dl-task-learning' }, `${task.learning.review ? '复习 / 综合实践' : '学习阶段'} · ${task.learning.stageTitle}`, h('span', null, task.learning.stageGoal)),
        h('p', { className: 'dl-summary' }, task.summary),
        task.preparation === 'degraded' && h('span', { className: 'dl-status' }, task.category === 'algorithm' ? '待选题' : '非时效练习'),
        task.sources.length > 0 && h('div', { className: 'dl-sources' }, ...task.sources.map((source, i) => h('div', { key: source.id }, h('a', { href: source.url, target: '_blank', rel: 'noreferrer noopener' }, `${i ? '备选 · ' : ''}${source.title}`), h('small', null, `发布日期 ${source.publishedAt || '未知'} · 检索 ${new Intl.DateTimeFormat('zh-CN', { timeZone: preferences.timezone }).format(new Date(source.fetchedAt))}`)))),
        h('details', { className: 'dl-detail' }, h('summary', null, '查看学习建议'), h('ol', null, ...task.steps.map((step, i) => h('li', { key: i }, step))), h('p', null, h('strong', null, '完成标准：'), task.acceptance)),
        h('div', { className: 'dl-task-actions' }, h(Button, { onClick: () => copy(taskText(task)) }, '复制任务'), h(Button, { onClick: () => copy(promptFor(task, preferences)) }, '复制学习 Prompt'))))),
    plan?.notices?.length > 0 && h('div', { className: 'dl-notices' }, ...plan.notices.map((notice, i) => h('p', { key: i }, notice))),
    plan && shownDate === today && h('footer', { className: 'dl-footer' }, h('span', null, plan.mode === 'model' ? '已保存 · 模型规划' : '已保存 · 模板'), h(Button, { disabled: loading || !online, onClick: () => start(true) }, '重新规划未完成项')),
    toast && h('div', { className: 'dl-toast', role: 'status' }, toast),
    copyText !== null && h('section', { className: 'dl-copy-fallback', 'aria-label': '手动复制' }, h('p', null, '浏览器暂不支持直接复制。内容已选中，按 Ctrl+C 即可。'), h('textarea', { ref: fallback, readOnly: true, value: copyText, rows: 10 }), h(Button, { onClick: () => setCopyText(null) }, '关闭'))));
}
function Icon({ size = 18 }) { return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true }, h('rect', { x: 5, y: 3, width: 14, height: 18, rx: 2 }), h('path', { d: 'M9 8h6M9 12h6M9 16h4' })); }
exports.inject = ['slots', 'layout', 'connection'];
exports.apply = function apply(ctx) {
  const requests = new Set();
  const isActive = () => ctx.layout.panelInfo.getSnapshot().activePanelId === NAME;
  const api = {
    isActive,
    call: async (method, payload) => {
      const controller = new AbortController(); requests.add(controller);
      try { const result = await ctx.connection.rpc.call('/daily-learning', method, payload, controller.signal); if (!result?.ok) throw new Error(result?.error?.message || '请求失败'); return result.value; }
      finally { requests.delete(controller); }
    }
  };
  const active = { getSnapshot: isActive, subscribe: listener => ctx.layout.panelInfo.subscribe(listener) };
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: NAME, inject: () => ({ api, active }) }, Memo));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: NAME, order: 5, label: '每日学习' }, Icon));
  ctx.effect(() => () => { for (const request of requests) request.abort(); requests.clear(); }, 'daily-learning: abort client requests');
};

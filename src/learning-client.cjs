const learningLabels = { algorithm: '算法', llm: 'LLM', agent: 'Agent 工程', explore: 'AI 探索' };

function RouteDetails({ route, view, current }) {
  const position = learning.routePosition(route, Object.values(view.state.days), view.today);
  const stageIndex = route.stages.findIndex(stage => stage.id === position.stage.id);
  const budget = route.budget.minMinutes === route.budget.maxMinutes ? `${route.budget.minMinutes}` : `${route.budget.minMinutes}–${route.budget.maxMinutes}`;
  return h('div', { className: current ? 'dl-route-current' : 'dl-route-history' },
    h('h4', null, route.goal),
    h('p', { className: 'dl-quiet' }, `生成于 ${route.createdAt.slice(0, 10)} · 每天 ${budget} 分钟 · 预计 ${route.stages.reduce((sum, stage) => sum + stage.estimatedDays, 0)} 个完成日`),
    current && position.complete && h('p', { className: 'dl-route-hint', role: 'status' }, '路线已完成，后续安排复习或综合实践。可修改需求规划新的方向。'),
    route.assumptions.length > 0 && h('details', { className: 'dl-route-assumptions' }, h('summary', null, '规划假设'), h('ul', null, ...route.assumptions.map((assumption, i) => h('li', { key: i }, assumption)))),
    h('ol', { className: 'dl-route-stages' }, ...route.stages.map((stage, i) => h('li', { key: stage.id, className: i === stageIndex && !position.complete && current ? 'dl-route-stage-current' : '' },
      h('div', { className: 'dl-route-stage-head' }, h('strong', null, stage.title), h('span', { className: 'dl-quiet' }, `${stage.estimatedDays} 天${current ? position.complete || i < stageIndex ? ' · 已完成' : i === stageIndex ? ` · 当前阶段 ${position.completedDays}/${stage.estimatedDays}` : '' : ''}`)),
      h('p', null, stage.goal),
      stage.focus.length > 0 && h('p', { className: 'dl-quiet' }, `学习重点：${stage.focus.join('；')}`),
      stage.searchTerms.length > 0 && h('p', { className: 'dl-quiet' }, `检索方向：${stage.searchTerms.join(' / ')}`)))),
    !current && h('details', null, h('summary', null, '当时的学习需求'), h('p', { className: 'dl-route-request' }, route.request)));
}

function LearningSettings({ view, expectedDataRoot, requests, onRequestsChange, api, onReload, onCommitted, onError, disabled, onGeneratingChange }) {
  const [generating, setGenerating] = useState(null);
  const [message, setMessage] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const generate = async category => {
    setGenerating(category); setMessage(''); onGeneratingChange(true);
    try {
      if (!sameDataRoot(view.config.dataRoot, expectedDataRoot)) throw new Error(ROOT_SESSION_ERROR);
      const committed = await api.call('routeGenerate', { category, revision: view.state.revision, expectedDataRoot });
      if (!alive.current) return;
      onCommitted(committed);
      const refreshed = await onReload();
      if (alive.current && refreshed?.state) onCommitted(refreshed);
      if (alive.current) setMessage('路线已生成');
    } catch (error) {
      if (alive.current) { setMessage(error.message); onError(error.message); }
    } finally { if (alive.current) setGenerating(null); onGeneratingChange(false); }
  };
  const busy = disabled || generating || view.routeGenerating || view.preparing;
  return h('section', { className: 'dl-learning', 'aria-label': '学习需求与路线' },
    h('h3', null, '学习需求与路线'),
    h('p', { className: 'dl-quiet' }, '粘贴想学的内容、基础和偏好即可，无需先写准确规划。保存需求后，分别生成各类路线。清空并保存可停用自定义路线。'),
    ...categories.map(category => {
      const route = learning.activeRoute(view.state.routes || learning.emptyRouteBook(), category);
      const versions = view.state.routes?.[category]?.versions || [];
      const historical = versions.filter(version => version.id !== route?.id).slice().reverse();
      const request = requests[category] || '';
      const saved = (view.state.preferences.learningRequests?.[category] || '').trim() === request.trim();
      const modelSelected = Boolean(view.config.model);
      const label = learningLabels[category];
      return h('details', { key: category, className: 'dl-learning-category' },
        h('summary', null, h('span', null, label), h('small', null, route ? `${route.stages.length} 个阶段` : '未启用自定义路线')),
        h('label', { className: 'dl-field' }, h('span', null, `${label} 学习需求`), h('textarea', { 'aria-label': `${label} 学习需求`, rows: 6, maxLength: 12000, value: request, disabled: Boolean(generating || view.routeGenerating || view.preparing), placeholder: '例如：我想理解 Attention，喜欢手算与代码实验，目前只知道基础线性代数。', onChange: event => { setMessage(''); onRequestsChange({ ...requests, [category]: event.target.value }); } }), h('small', null, `${request.length} / 12000 字符 · 支持换行和 Markdown`)),
        h('div', { className: 'dl-route-actions' }, h(Button, { disabled: Boolean(busy || !saved || !request.trim() || !modelSelected), onClick: () => generate(category), 'aria-label': `${route ? '重新生成' : '生成'} ${label} 路线` }, generating === category || view.routeGenerating === category ? '正在生成路线…' : route ? `重新生成 ${label} 路线` : `生成 ${label} 路线`),
          h('span', { className: 'dl-quiet' }, !saved ? '先保存需求' : !modelSelected ? '请先选择并保存规划模型' : disabled ? '请先保存设置，或等待当前操作完成' : !request.trim() ? '留空时使用默认规划' : '按已保存的需求和每日预算生成')),
        route && learning.requestChanged(view.state.preferences, route) && h('p', { className: 'dl-route-hint' }, '需求已修改，路线尚未更新。'),
        route && learning.budgetChanged(view.state.preferences, route) && h('p', { className: 'dl-route-hint' }, '时间预算已修改，可重新生成路线更新预计天数。'),
        route && h(RouteDetails, { route, view, current: true }),
        historical.length > 0 && h('details', { className: 'dl-route-versions' }, h('summary', null, `历史路线（${historical.length}）`), ...historical.map(version => h('details', { key: version.id, className: 'dl-route-history' }, h('summary', null, `${version.createdAt.slice(0, 10)} · ${version.goal}`), h(RouteDetails, { route: version, view, current: false })))));
    }),
    message && h('p', { className: message === '路线已生成' ? 'dl-route-hint' : 'dl-error', role: message === '路线已生成' ? 'status' : 'alert' }, message),
    h('p', { className: 'dl-quiet' }, '路线更新后可重新规划今日未完成项。完成勾选用于安排后续任务，不代表知识掌握评测。'));
}

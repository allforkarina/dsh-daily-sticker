import { safeUrl, type Source, type Plan, type Preferences } from './domain.ts';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { activeRoute, budgetFor, emptyRouteBook, routePosition, type RouteBook } from './learning.ts';

type SourceFocus = { searchTerms: string[]; title?: string; minutes?: string };
function searchDirection(focus: SourceFocus) {
  return [...focus.searchTerms, focus.title || '', focus.minutes ? `每日 ${focus.minutes} 分钟` : ''].filter(Boolean).join(' ');
}

export function pickProblem(pool: Source[], history: Plan[], random = Math.random): Source | null {
  const excluded = new Set(history.flatMap(p => p.tasks.filter(t => t.category === 'algorithm').flatMap(t => t.sources.map(s => s.slug || s.url))));
  const eligible = pool.filter(p => p.verified && ['Easy', 'Medium'].includes(p.difficulty || '') && !excluded.has(p.slug || p.url));
  return eligible.length ? eligible[Math.min(eligible.length - 1, Math.floor(random() * eligible.length))] : null;
}
async function jsonFetch(url: string, init: any, signal: AbortSignal) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
  if (!response.ok) throw new Error('题源暂不可用');
  const reader = response.body!.getReader();
  const parts: Uint8Array[] = []; let count = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      count += value.length; if (count > 3_000_000) throw new Error('题源返回内容过大');
      parts.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
function problemRef(raw: any, site: string): Source | null {
  const slug = raw.titleSlug ?? raw.stat?.question__title_slug;
  const difficulty = raw.difficulty?.level ? ['', 'Easy', 'Medium', 'Hard'][raw.difficulty.level] : raw.difficulty;
  const title = raw.translatedTitle || raw.title || raw.stat?.question__title;
  if (raw.paid_only || raw.isPaidOnly || typeof slug !== 'string' || !/^[a-z0-9-]{1,160}$/.test(slug) || typeof title !== 'string' || !['Easy', 'Medium'].includes(difficulty)) return null;
  return { id: `problem:${site}:${slug}`, title: title.slice(0, 180), difficulty, slug, verified: true, url: `https://leetcode.${site}/problems/${slug}/`, fetchedAt: new Date().toISOString() };
}
function officialProblemSlug(input: unknown, site: string): string | null {
  if (typeof input !== 'string') return null;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.host !== `leetcode.${site}` || url.username || url.password || url.search || url.hash) return null;
    return /^\/problems\/([a-z0-9-]{1,160})\/?$/.exec(url.pathname)?.[1] || null;
  } catch { return null; }
}
export async function getProblem(prefs: Preferences, history: Plan[], signal: AbortSignal, web?: any, focus?: SourceFocus, fetchJson = jsonFetch): Promise<Source | null> {
  const site = prefs.leetcodeSite;
  if (focus) {
    let slugs: string[] = [];
    try {
      if (web) {
        const found = await web.search({ query: `site:leetcode.${site}/problems/ ${searchDirection(focus)}`, maxResults: 8 }, signal);
        slugs = (found.sources || []).slice(0, 8).map((item: any) => officialProblemSlug(item.url, site)).filter((slug: string | null) => slug !== null);
      }
    } catch { signal.throwIfAborted(); }
    signal.throwIfAborted();
    const pool = await fetchJson(`https://leetcode.${site}/api/problems/all/`, {}, signal);
    const candidates: Source[] = (pool.stat_status_pairs || []).filter((item: any) => item.paid_only === false).map((item: any) => problemRef(item, site)).filter(Boolean);
    const matched = pickProblem(candidates.filter(item => slugs.includes(item.slug!)), history);
    if (matched) return { ...matched, topicMatched: true };
    const fallback = pickProblem(candidates, history);
    return fallback ? { ...fallback, topicMatched: false } : null;
  }
  try {
    const query = site === 'cn' ? '{ questionOfToday { question { title translatedTitle titleSlug difficulty isPaidOnly } } }' : '{ activeDailyCodingChallengeQuestion { date question { title titleSlug difficulty isPaidOnly } } }';
    const daily = await fetchJson(`https://leetcode.${site}/graphql/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) }, signal);
    const item = daily.data?.questionOfToday?.[0]?.question ?? daily.data?.activeDailyCodingChallengeQuestion?.question;
    const ref = item && problemRef(item, site);
    if (ref && pickProblem([ref], history)) return ref;
  } catch { signal.throwIfAborted(); }
  const pool = await fetchJson(`https://leetcode.${site}/api/problems/all/`, {}, signal);
  const candidates = (pool.stat_status_pairs || []).map((p: any) => problemRef(p, site)).filter(Boolean);
  return pickProblem(candidates, history);
}
function readable(input: string) {
  return input.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
}
export async function collectArticles(web: any, prefs: Preferences, date: string, signal: AbortSignal, focus?: SourceFocus): Promise<Source[]> {
  if (!web) return [];
  const end = Date.parse(`${date}T00:00:00Z`) + 86400000 - 1;
  const results: Source[] = [];
  const seen = new Set();
  for (const days of [7, 30]) {
    signal.throwIfAborted();
    const since = new Date(end - days * 86400000).toISOString().slice(0, 10);
    const search = await web.search({ query: `${focus ? searchDirection(focus) : prefs.interests || 'AI 工具与研究'} ${since} 至 ${date} 原始发布 论文 官方博客`, maxResults: 6 }, signal);
    for (const item of (search.sources || []).slice(0, 6)) {
      if (results.length === 3) break;
      let url: string;
      try { url = safeUrl(item.url); } catch { continue; }
      if (seen.has(url)) continue;
      const publication = typeof item.publishedAt === 'string' ? Date.parse(item.publishedAt) : NaN;
      if (Number.isFinite(publication) && (publication < Date.parse(`${since}T00:00:00Z`) || publication > end)) continue;
      seen.add(url);
      try {
        const fetched = await web.fetch({ url }, signal);
        if (fetched.statusCode < 200 || fetched.statusCode >= 300 || typeof fetched.body?.content !== 'string') continue;
        const body = readable(fetched.body.content);
        if (body.length < 80) continue;
        results.push({ id: `article:${results.length}`, url: safeUrl(fetched.url || url), title: String(item.title || new URL(url).hostname).slice(0, 180), fetchedAt: new Date().toISOString(), ...(Number.isFinite(publication) ? { publishedAt: new Date(publication).toISOString().slice(0, 10) } : {}), text: body, verified: true });
      } catch { signal.throwIfAborted(); }
    }
    if (results.length) break;
  }
  return results;
}
function currentCachedArticle(source: Source, date: string): boolean {
  if (source.verified !== true) return false;
  const start = Date.parse(`${date}T00:00:00Z`), end = start + 86400000 - 1;
  const timestamp = source.publishedAt === undefined ? Date.parse(source.fetchedAt) : Date.parse(source.publishedAt);
  return Number.isFinite(timestamp) && timestamp >= start - 30 * 86400000 && timestamp <= end;
}
export async function collectSources(root: string, web: any, prefs: Preferences, date: string, history: Plan[], lifetime: AbortSignal, routes: RouteBook = emptyRouteBook()): Promise<Source[]> {
  const signal = AbortSignal.any([lifetime, AbortSignal.timeout(60000)]);
  const since = new Date(Date.parse(date) - 30 * 86400000).toISOString().slice(0, 10);
  const recent = history.filter(p => p.date >= since && p.date <= date);
  function direction(category: 'algorithm' | 'explore') {
    const route = activeRoute(routes, category);
    if (!route) return { key: null, focus: undefined };
    const { stage } = routePosition(route, history, date);
    const budget = budgetFor(prefs, category);
    const minutes = budget.minMinutes === budget.maxMinutes ? String(budget.minMinutes) : `${budget.minMinutes}–${budget.maxMinutes}`;
    return { key: JSON.stringify({ routeId: route.id, stageId: stage.id }), focus: { searchTerms: stage.searchTerms, title: stage.title, minutes } };
  }
  const algorithm = direction('algorithm'), explore = direction('explore');
  const results = await Promise.allSettled([getProblem(prefs, recent, signal, web, algorithm.focus), collectArticles(web, prefs, date, signal, explore.focus)]);
  lifetime.throwIfAborted();
  let sources: Source[] = [];
  if (results[0].status === 'fulfilled' && results[0].value) sources.push(results[0].value);
  if (results[1].status === 'fulfilled') sources.push(...results[1].value);
  const dir = join(root, 'cache');
  const file = join(dir, 'sources.json');
  let cachedProblems: Source[] = [], cachedArticles: Source[] = [];
  try {
    const cache = JSON.parse(await readFile(file, 'utf8'));
    if (cache.site === prefs.leetcodeSite && cache.interests === prefs.interests && Array.isArray(cache.sources)) {
      if ((cache.algorithmKey ?? null) === algorithm.key) cachedProblems = cache.sources.filter((s: Source) => s.id.startsWith('problem:'));
      if ((cache.exploreKey ?? null) === explore.key) cachedArticles = cache.sources.filter((s: Source) => s.id.startsWith('article:') && currentCachedArticle(s, date));
    }
  } catch {}
  if (!sources.some(s => s.id.startsWith('problem:'))) {
    const problem = pickProblem(cachedProblems, recent);
    if (problem) sources.push(algorithm.focus ? { ...problem, topicMatched: problem.topicMatched === true } : problem);
  }
  if (!sources.some(s => s.id.startsWith('article:'))) sources.push(...cachedArticles.slice(0, 3));
  if (sources.length) {
    await mkdir(dir, { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, algorithmKey: algorithm.key, exploreKey: explore.key, sources }), { mode: 0o600 });
    await rename(temp, file);
  }
  return sources;
}

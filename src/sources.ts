import { safeUrl, type Source, type Plan, type Preferences } from './domain.ts';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

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
  if (raw.paid_only || typeof slug !== 'string' || !/^[a-z0-9-]{1,160}$/.test(slug) || typeof title !== 'string' || !['Easy', 'Medium'].includes(difficulty)) return null;
  return { id: `problem:${site}:${slug}`, title: title.slice(0, 180), difficulty, slug, verified: true, url: `https://leetcode.${site}/problems/${slug}/`, fetchedAt: new Date().toISOString() };
}
async function getProblem(prefs: Preferences, history: Plan[], signal: AbortSignal) {
  const site = prefs.leetcodeSite;
  try {
    const query = site === 'cn' ? '{ questionOfToday { question { title translatedTitle titleSlug difficulty } } }' : '{ activeDailyCodingChallengeQuestion { date question { title titleSlug difficulty } } }';
    const daily = await jsonFetch(`https://leetcode.${site}/graphql/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) }, signal);
    const item = daily.data?.questionOfToday?.[0]?.question ?? daily.data?.activeDailyCodingChallengeQuestion?.question;
    const ref = item && problemRef(item, site);
    if (ref && pickProblem([ref], history)) return ref;
  } catch { signal.throwIfAborted(); }
  const pool = await jsonFetch(`https://leetcode.${site}/api/problems/all/`, {}, signal);
  const candidates = (pool.stat_status_pairs || []).map((p: any) => problemRef(p, site)).filter(Boolean);
  return pickProblem(candidates, history);
}
function readable(input: string) {
  return input.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
}
export async function collectArticles(web: any, prefs: Preferences, date: string, signal: AbortSignal): Promise<Source[]> {
  if (!web) return [];
  const end = Date.parse(`${date}T23:59:59Z`);
  const results: Source[] = [];
  const seen = new Set();
  for (const days of [7, 30]) {
    signal.throwIfAborted();
    const since = new Date(end - days * 86400000).toISOString().slice(0, 10);
    const search = await web.search({ query: `${prefs.interests || 'AI 工具与研究'} ${since} 至 ${date} 原始发布 论文 官方博客`, maxResults: 6 }, signal);
    for (const item of (search.sources || []).slice(0, 6)) {
      if (results.length === 3) break;
      let url: string;
      try { url = safeUrl(item.url); } catch { continue; }
      if (seen.has(url)) continue;
      seen.add(url);
      const publication = typeof item.publishedAt === 'string' ? Date.parse(item.publishedAt) : NaN;
      if (Number.isFinite(publication) && (publication < end - days * 86400000 || publication > end + 86400000)) continue;
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
export async function collectSources(root: string, web: any, prefs: Preferences, date: string, history: Plan[], lifetime: AbortSignal): Promise<Source[]> {
  const signal = AbortSignal.any([lifetime, AbortSignal.timeout(60000)]);
  const since = new Date(Date.parse(date) - 30 * 86400000).toISOString().slice(0, 10);
  const recent = history.filter(p => p.date >= since);
  const results = await Promise.allSettled([getProblem(prefs, recent, signal), collectArticles(web, prefs, date, signal)]);
  lifetime.throwIfAborted();
  let sources: Source[] = [];
  if (results[0].status === 'fulfilled' && results[0].value) sources.push(results[0].value);
  if (results[1].status === 'fulfilled') sources.push(...results[1].value);
  const dir = join(root, 'cache');
  const file = join(dir, 'sources.json');
  let cached: Source[] = [];
  try { const cache = JSON.parse(await readFile(file, 'utf8')); if (cache.site === prefs.leetcodeSite && cache.interests === prefs.interests && Array.isArray(cache.sources)) cached = cache.sources; } catch {}
  if (!sources.some(s => s.id.startsWith('problem:'))) {
    const problem = pickProblem(cached.filter(s => s.id.startsWith('problem:')), recent);
    if (problem) sources.push(problem);
  }
  if (!sources.some(s => s.id.startsWith('article:'))) sources.push(...cached.filter(s => s.id.startsWith('article:')).slice(0, 3));
  if (sources.length) {
    await mkdir(dir, { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, sources }), { mode: 0o600 });
    await rename(temp, file);
  }
  return sources;
}

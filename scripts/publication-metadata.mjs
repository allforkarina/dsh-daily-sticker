for (const url of ['https://api.github.com/repos/allforkarina/dsh-daily-sticker', 'https://api.github.com/repos/allforkarina/dsh-daily-sticker/releases']) {
  const response = await fetch(url, { headers: { 'user-agent': 'dsh-daily-sticker-release-check', accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) { console.log({ url, status: response.status }); continue; }
  const data = await response.json();
  console.log(Array.isArray(data) ? data.map(x => ({ tag: x.tag_name, url: x.html_url, assets: x.assets?.map(a => a.name) })) : { name: data.full_name, private: data.private, defaultBranch: data.default_branch, url: data.html_url });
}

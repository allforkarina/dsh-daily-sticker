import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const tarPath = process.argv[2] || `dist/${manifest.name}-${manifest.version}.tgz`;
const buffer = gunzipSync(await readFile(tarPath));
const entries = new Map();
for (let offset = 0; offset + 512 <= buffer.length;) {
  const header = buffer.subarray(offset, offset + 512);
  const name = header.subarray(0, 100).toString().replace(/\0.*$/s, '');
  if (!name) break;
  const size = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/s, '').trim() || '0', 8);
  assert.ok(Number.isFinite(size) && size >= 0);
  entries.set(name, buffer.subarray(offset + 512, offset + 512 + size).toString('utf8'));
  offset += 512 + Math.ceil(size / 512) * 512;
}
for (const file of ['package/lib/host.js', 'package/lib/client.js', 'package/cordis.patch.yml', 'package/README.md', 'package/LICENSE']) assert.ok(entries.has(file), `Missing ${file}`);
for (const [name, contents] of entries) {
  assert.ok(!/node_modules|\.test-runtime|\.target-cache|state\.json|\.env|dev-entry|dev\.patch/.test(name), `Unexpected package file ${name}`);
  if (name.endsWith('.js')) assert.ok(!contents.includes('D:/Files/Projects') && !contents.includes('D:\\Files\\Projects'), 'Development absolute path in compiled artifact');
}
assert.match(entries.get('package/lib/client.js'), /^window\.__ModuleLoader__\.load/);
assert.equal(JSON.parse(entries.get('package/package.json')).version, manifest.version);
console.log(`Package audit passed: ${entries.size} entries, no test data or development paths`);
console.log([...entries.keys()].join('\n'));

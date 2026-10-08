import { open, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

// Development-only, read-only inspection of the explicitly selected DSH installation.
const archive = process.env.DSH_ASAR || 'D:/Software/DSH/resources/app.asar';
const file = await open(archive, 'r');
try {
  const prefix = Buffer.alloc(16);
  await file.read(prefix, 0, 16, 0);
  const headerSize = prefix.readUInt32LE(4);
  const jsonSize = prefix.readUInt32LE(12);
  const json = Buffer.alloc(jsonSize);
  await file.read(json, 0, jsonSize, 16);
  const tree = JSON.parse(json.toString('utf8'));
  const entries = [];
  function walk(node, parent = '') {
    for (const [name, child] of Object.entries(node.files || {})) {
      const path = parent ? `${parent}/${name}` : name;
      if (child.files) walk(child, path);
      else if (child.offset !== undefined && !child.unpacked) entries.push({ path, ...child });
    }
  }
  walk(tree);
  const patterns = process.argv.slice(2);
  if (patterns.length === 0 || patterns[0] === '--list') {
    const packages = entries.filter(x => /node_modules\/@deepseek-ai\/[^/]+\/package\.json$/.test(x.path));
    console.log(packages.map(x => x.path).filter(x => /connection|server|llm|web|config|plugin-manager|schedule|layout|slots|modules|schemastery|cordis|boot|settings/.test(x.split('/').at(-2))).join('\n'));
  } else {
    const selected = entries.filter(x => patterns.some(p => x.path.includes(p)) && /(?:package\.json|\.(?:js|d\.ts)|cordis\.patch\.yml)$/.test(x.path));
    for (const entry of selected) {
      const buffer = Buffer.alloc(entry.size);
      await file.read(buffer, 0, buffer.length, 8 + headerSize + Number(entry.offset));
      const out = resolve('.target-cache', entry.path);
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, buffer);
    }
    console.log(`Extracted ${selected.length} public code/metadata files to .target-cache`);
  }
} finally {
  await file.close();
}

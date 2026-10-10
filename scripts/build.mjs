import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';

const strip = code => stripTypeScriptTypes(code, { mode: 'strip' }).replace(/[\t ]+$/gm, '');
await mkdir('lib', { recursive: true });
for (const name of (await readdir('src')).filter(n => n.endsWith('.ts'))) {
  const code = strip(await readFile(join('src', name), 'utf8')).replace(/(from\s+['"]\.\/[^'"]+)\.ts(['"])/g, '$1.js$2');
  await writeFile(join('lib', name.replace(/\.ts$/, '.js')), code);
}
const learning = strip(await readFile('src/learning.ts', 'utf8')).replace(/^export /gm, '');
const domain = strip(await readFile('src/domain.ts', 'utf8')).replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/learning\.ts['"];?/g, 'const {$1} = learning;').replace(/^export /gm, '');
const css = await readFile('src/client.css', 'utf8');
const client = await readFile('src/client.cjs', 'utf8');
const learningClient = await readFile('src/learning-client.cjs', 'utf8');
await writeFile('lib/client.js', `window.__ModuleLoader__.load({id:"dsh-daily-learning",factory:(require)=>{\nconst module={exports:{}};const exports=module.exports;\nconst css=${JSON.stringify(css)};\nconst learning=(()=>{${learning}\nreturn {emptyRouteBook,activeRoute,budgetFor,routePosition,requestChanged,budgetChanged,validateLearningContext};})();\nconst domain=(()=>{${domain}\nreturn {categories,labels,defaults,llmTopics,taskText,promptFor,enteredDate};})();\n${learningClient}\n${client}\nreturn module.exports;\n}});\n`);
await writeFile('lib/host.d.ts', 'export declare const name: "dsh-daily-learning";\nexport declare const inject: string[];\nexport declare const Config: unknown;\nexport declare function apply(ctx: unknown, config: {dataRoot: string | null; model: {provider: string; model: string} | null; autoPrepareOnOpen: boolean}): void;\n');
console.log('Built ESM Host and lazy-CJS Client into lib/');

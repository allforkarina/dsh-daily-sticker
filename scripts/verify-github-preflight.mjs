import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
const root = resolve('.test-runtime/github-preflight');
await mkdir(root, { recursive: true });
const { checkGithubConnection } = await import('file:///D:/Software/DSH/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-plugin-manager/lib/types/github-connection.js');
const spec = { kind: 'git', host: 'github.com', spec: 'git+ssh://git@github.com/allforkarina/dsh-daily-sticker.git#main' };
const result = await checkGithubConnection(spec, root, { timeoutMs: 30000, outputBytes: 8000, signal: new AbortController().signal });
console.log(result ? { kind: result.kind, exitCode: result.exitCode, output: result.output } : { status: 'reachable', spec: spec.spec });
if (result) process.exitCode = 1;
